import {
  CharacterClass,
  createVector3,
  distance,
  distanceSquared,
  EntitySnapshotState,
  Opcode,
  S2CCombatEventPayload,
  S2CEntityDespawnPayload,
  S2CEntitySpawnPayload,
  S2CInventoryUpdatePayload,
  S2CItemDropDespawnPayload,
  S2CItemDropSpawnPayload,
  S2CPlayerExpUpdatePayload,
  S2CPlayerLevelUpPayload,
  S2CSkillCastEventPayload,
  S2CWorldSnapshotPayload,
  SKILLS_DATABASE,
  calculateSkillPower,
  ItemDropState,
  ITEMS_DATABASE,
  ItemType,
  Vector3,
} from '@magicforge/shared';
import { EntityManager } from './EntityManager';
import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Monster, MonsterState } from '../entities/Monster';
import { Connection } from '../network/Connection';
import { SpatialGrid } from './SpatialGrid';
import { SERVER_CONFIG } from '../config';
import { DatabaseManager } from '../database/DatabaseManager';

export class World {
  public readonly entityManager = new EntityManager();
  public readonly spatialGrid = new SpatialGrid(20.0);
  public readonly db = new DatabaseManager();
  public currentTick: number = 0;
  public activeItemDrops = new Map<string, ItemDropState>();
  private connections = new Map<string, Connection>();

  constructor() {
    this.spawnInitialMonsters();
  }

  private spawnInitialMonsters(): void {
    const mobSpawns = [
      { name: 'Goblin Lanceiro', pos: createVector3(-8, 0, 10), hp: 90, damage: 12 },
      { name: 'Goblin Arqueiro', pos: createVector3(12, 0, -8), hp: 70, damage: 16 },
      { name: 'Slime da Floresta', pos: createVector3(10, 0, 12), hp: 120, damage: 8 },
      { name: 'Lobo Selvagem', pos: createVector3(-14, 0, -10), hp: 100, damage: 14 },
      { name: 'Chefe Goblin', pos: createVector3(0, 0, 22), hp: 350, damage: 28 },
    ];

    mobSpawns.forEach((spawn, idx) => {
      const monster = new Monster(`mob_${idx + 1}`, spawn.name, spawn.pos, spawn.hp, spawn.damage);
      this.entityManager.addMonster(monster);
      this.spatialGrid.updateEntity(monster);
    });

    console.log(`[World] Spawned ${mobSpawns.length} initial monsters in Spatial Grid (20m cells).`);
  }

  public registerConnection(connection: Connection): void {
    this.connections.set(connection.id, connection);
  }

  public unregisterConnection(connection: Connection): void {
    this.connections.delete(connection.id);
    if (connection.playerId) {
      this.handlePlayerDisconnect(connection.playerId);
    }
  }

  public createPlayer(connection: Connection, name: string, classType: CharacterClass): Player {
    // 1. Busca ou cria a conta e carrega/cria o personagem no banco de dados SQLite
    const account = this.db.getOrCreateAccount(name);
    const player = this.db.loadOrCreatePlayer(connection.id, account.id, name, classType);

    this.entityManager.addPlayer(player);
    this.spatialGrid.updateEntity(player);
    connection.playerId = player.id;
    connection.isAuthenticated = true;

    // Broadcast spawn to all other connected players
    this.broadcast(
      Opcode.S2C_ENTITY_SPAWN,
      { entity: player.toSnapshotState() } as S2CEntitySpawnPayload,
      connection.id // exclude self (client gets full login payload)
    );

    // Send existing entities to the new player
    const allEntities = this.entityManager.getAllEntities();
    for (const ent of allEntities) {
      if (ent.id !== player.id) {
        connection.send(Opcode.S2C_ENTITY_SPAWN, {
          entity: ent.toSnapshotState(),
        } as S2CEntitySpawnPayload);
      }
    }

    // Send active item drops to the new player
    const now = Date.now();
    for (const drop of this.activeItemDrops.values()) {
      const remainingSec = Math.max(0, Math.round(drop.despawnSec - (now - drop.spawnTime) / 1000));
      connection.send(Opcode.S2C_ITEM_DROP_SPAWN, {
        dropId: drop.dropId,
        itemId: drop.itemId,
        name: drop.name,
        rarity: drop.rarity,
        quantity: drop.quantity,
        position: drop.position,
        despawnTimeSec: remainingSec,
      } as S2CItemDropSpawnPayload);
    }

    // Send player inventory & gold state
    connection.send(Opcode.S2C_INVENTORY_UPDATE, {
      slots: player.inventory,
      gold: player.gold,
      totalCombatPower: player.CombatPower,
    } as S2CInventoryUpdatePayload);

    console.log(`[World] Player "${player.name}" (${player.classType}) pronto em [${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}]. Total players: ${this.entityManager.getAllPlayers().length}`);
    return player;
  }

  private handlePlayerDisconnect(playerId: string): void {
    const player = this.entityManager.removePlayer(playerId);
    this.spatialGrid.removeEntity(playerId);
    if (player) {
      // Salva o progresso mais recente no banco de dados SQLite
      this.db.savePlayer(player);
      console.log(`[World] Player "${player.name}" desconectou e foi salvo com sucesso no SQLite.`);
      this.broadcast(Opcode.S2C_ENTITY_DESPAWN, {
        entityId: playerId,
        reason: 'DISCONNECTED',
      } as S2CEntityDespawnPayload);
    }
  }

  public saveAllPlayers(): void {
    const players = this.entityManager.getAllPlayers();
    for (const p of players) {
      this.db.savePlayer(p);
    }
    console.log(`[World] Todos os ${players.length} jogadores foram salvos no banco de dados.`);
  }

  /**
   * Authoritative Simulation Step called by GameLoop at 20Hz (every 50ms)
   */
  public update(deltaTimeSec: number): void {
    this.currentTick++;

    // 1. Update all Players & Spatial Cell Index
    const players = this.entityManager.getAllPlayers();
    for (const player of players) {
      player.update(deltaTimeSec);
      this.spatialGrid.updateEntity(player);

      // Auto-Combat AI for Players (matching Unity AutoCombatController logic)
      this.processPlayerAutoCombat(player);
    }

    // 2. Update all Monsters & Spatial Cell Index
    const monsters = this.entityManager.getAllMonsters();
    for (const monster of monsters) {
      // Monster Aggro targeting
      if (monster.state === MonsterState.IDLE && !monster.isDead) {
        const nearestPlayer = this.entityManager.findNearestPlayer(monster.position, monster.aggroRadius);
        if (nearestPlayer) {
          monster.targetPlayer = nearestPlayer;
          monster.targetId = nearestPlayer.id;
          monster.state = MonsterState.CHASING;
        }
      }

      monster.update(deltaTimeSec);
      this.spatialGrid.updateEntity(monster);

      // Monster Combat Attack
      this.processMonsterCombat(monster);
    }

    // 3. Update Item Drops (despawn countdown & player proximity auto-loot)
    const now = Date.now();
    for (const [dropId, drop] of this.activeItemDrops) {
      if ((now - drop.spawnTime) / 1000 >= drop.despawnSec) {
        this.activeItemDrops.delete(dropId);
        this.broadcast(Opcode.S2C_ITEM_DROP_DESPAWN, { dropId } as S2CItemDropDespawnPayload);
        continue;
      }

      // Proximity auto-pickup (distance <= 2.2m)
      for (const player of players) {
        if (!player.isDead && distance(player.position, drop.position) <= 2.2) {
          this.lootItem(player, dropId);
          break; // drop picked up, break player loop
        }
      }
    }

    // 4. Build & Broadcast World Snapshot (Partitioned by Area of Interest)
    this.broadcastSnapshot();
  }

  private processPlayerAutoCombat(player: Player): void {
    if (player.isDead) return;

    // If player has a target, check validity
    let target = player.targetId ? this.entityManager.getMonster(player.targetId) : null;

    if (!target || target.isDead) {
      // Auto-target nearest monster within radar (25m)
      target = this.entityManager.findNearestMonster(player.position, 25.0);
      player.targetId = target ? target.id : null;
    }

    if (!target || target.isDead) return;

    const dist = distance(player.position, target.position);

    // If within attack range and cooldown ready, execute attack
    if (dist <= player.attackRange) {
      // If moving, stop moving when in attack range (just like Unity AutoCombatController)
      if (player.isMoving && player.targetDestination) {
        player.stopMoving();
      }

      if (player.attackTimer <= 0) {
        this.executePlayerAttack(player, target);
        player.attackTimer = player.attackIntervalSec;
      }
    }
  }

  private executePlayerAttack(player: Player, target: Monster): void {
    const wasAlive = !target.isDead;
    const rawDamage = player.BaseDamage;
    // Simple critical strike formula based on DEX
    const isCritical = Math.random() < (player.attributes.destreza * 0.015);
    const finalDamage = isCritical ? Math.round(rawDamage * 1.5) : rawDamage;

    target.takeDamage(finalDamage);

    const combatEvent: S2CCombatEventPayload = {
      attackerId: player.id,
      targetId: target.id,
      damage: finalDamage,
      isCritical,
      isDodged: false,
      targetRemainingHp: target.currentHp,
      targetMaxHp: target.maxHp,
      isTargetDead: target.isDead,
    };

    this.broadcast(Opcode.S2C_COMBAT_EVENT, combatEvent);

    if (wasAlive && target.isDead) {
      this.handleMonsterDeath(target, player);
    }
  }

  private processMonsterCombat(monster: Monster): void {
    if (monster.isDead || monster.state !== MonsterState.ATTACKING || !monster.targetPlayer) return;

    const player = monster.targetPlayer as Player;
    if (player.isDead) return;

    if (monster.attackCooldown <= 0) {
      const damage = monster.attackDamage;
      // Dodge check based on player DEX
      const isDodged = Math.random() < (player.attributes.destreza * 0.01);

      if (!isDodged) {
        player.takeDamage(damage);
      }

      const combatEvent: S2CCombatEventPayload = {
        attackerId: monster.id,
        targetId: player.id,
        damage: isDodged ? 0 : damage,
        isCritical: false,
        isDodged,
        targetRemainingHp: player.currentHp,
        targetMaxHp: player.maxHp,
        isTargetDead: player.isDead,
      };

      this.broadcast(Opcode.S2C_COMBAT_EVENT, combatEvent);
      monster.attackCooldown = monster.attackIntervalSec;
    }
  }

  /**
   * Conjuração Autoritativa de Habilidades Ativas (Slots 1 a 4)
   */
  public castPlayerSkill(player: Player, slot: number, targetId?: string, targetPos?: Vector3): boolean {
    if (player.isDead) return false;

    const skillKey = `${player.classType.toLowerCase()}_${slot}`;
    const skill = SKILLS_DATABASE[skillKey];
    if (!skill) {
      console.warn(`[World] Skill não encontrada: ${skillKey}`);
      return false;
    }

    // 1. Validação de Cooldown
    if (player.getSkillCooldown(slot) > 0) {
      return false;
    }

    // 2. Validação de Recurso (Mana / Energia)
    if (!player.consumeResource(skill.cost)) {
      return false;
    }

    // 3. Inicia o Cooldown
    player.setSkillCooldown(slot, skill.cooldownSec);

    // 4. Calcula Poder (Fórmula D&D)
    const power = calculateSkillPower(skill, player.attributes, player.level);
    const isCritical = Math.random() < (player.attributes.destreza * 0.02);
    const finalPower = isCritical ? Math.round(power * 1.5) : power;

    const affectedIds: string[] = [];

    // 5. Aplica Efeito
    if (skill.isHeal) {
      player.heal(finalPower);
      affectedIds.push(player.id);
    } else if (skill.isAoe) {
      // Habilidade em Área
      const aoeOrigin = targetPos || player.position;
      const radiusSq = (skill.aoeRadius || 5.0) * (skill.aoeRadius || 5.0);

      const nearbyMonsters = this.entityManager.getAllMonsters();
      for (const m of nearbyMonsters) {
        if (!m.isDead && distanceSquared(aoeOrigin, m.position) <= radiusSq) {
          const wasAlive = !m.isDead;
          m.takeDamage(finalPower);
          affectedIds.push(m.id);
          if (wasAlive && m.isDead) {
            this.handleMonsterDeath(m, player);
          }
        }
      }
    } else {
      // Alvo Único
      let target: Entity | null = targetId ? (this.entityManager.getEntity(targetId) || null) : null;
      if (!target || target.isDead) {
        target = this.entityManager.findNearestMonster(player.position, skill.range);
      }

      if (target && !target.isDead && target instanceof Monster) {
        const d = distance(player.position, target.position);
        if (d <= skill.range * 1.3) {
          const wasAlive = !target.isDead;
          target.takeDamage(finalPower);
          affectedIds.push(target.id);
          if (wasAlive && target.isDead) {
            this.handleMonsterDeath(target, player);
          }
        }
      }
    }

    // 6. Transmite Evento de Conjuração para Todos na Área
    const castPayload: S2CSkillCastEventPayload = {
      casterId: player.id,
      skillId: skill.skillId,
      slot: skill.slot,
      skillName: skill.name,
      targetId: targetId || (affectedIds.length > 0 ? affectedIds[0] : undefined),
      targetPosition: targetPos,
      damageOrHeal: finalPower,
      isHeal: skill.isHeal,
      isCritical,
      affectedEntityIds: affectedIds,
      casterCurrentResource: Math.round(player.currentResource),
      casterMaxResource: player.maxResource,
    };

    this.broadcast(Opcode.S2C_SKILL_CAST_EVENT, castPayload);
    return true;
  }

  private broadcastSnapshot(): void {
    const now = Date.now();

    for (const [_, conn] of this.connections) {
      if (!conn.isAuthenticated) continue;

      let entitiesToSend: Entity[];

      if (conn.playerId) {
        const player = this.entityManager.getPlayer(conn.playerId);
        if (player) {
          // AOI Partitioning: Only entities within visibility radius from player's spatial neighborhood
          const aoiEntities = this.spatialGrid.getEntitiesInAOI(player.position, SERVER_CONFIG.VISIBILITY_RADIUS);
          // Guarantee own player is always included
          if (!aoiEntities.some((e) => e.id === player.id)) {
            aoiEntities.push(player);
          }
          entitiesToSend = aoiEntities;
        } else {
          entitiesToSend = this.entityManager.getAllEntities();
        }
      } else {
        entitiesToSend = this.entityManager.getAllEntities();
      }

      const entitySnapshots: EntitySnapshotState[] = entitiesToSend.map((e) => e.toSnapshotState());
      const snapshotPayload: S2CWorldSnapshotPayload = {
        serverTick: this.currentTick,
        serverTimestamp: now,
        entities: entitySnapshots,
      };

      conn.send(Opcode.S2C_WORLD_SNAPSHOT, snapshotPayload);
    }
  }

  public broadcast<T>(op: Opcode, data: T, excludeConnectionId?: string): void {
    for (const [id, conn] of this.connections) {
      if (id !== excludeConnectionId && conn.isAuthenticated) {
        conn.send(op, data);
      }
    }
  }

  public handleMonsterDeath(monster: Monster, killer?: Player): void {
    // 1. Authoritative Experience (EXP) & Level Up Progression
    if (killer && !killer.isDead && killer instanceof Player) {
      const expReward = monster.expReward;
      const progress = killer.addExperience(expReward);
      this.db.savePlayer(killer);

      const killerConn = this.connections.get(killer.id);
      if (killerConn) {
        killerConn.send(Opcode.S2C_PLAYER_EXP_UPDATE, {
          playerId: killer.id,
          currentXp: killer.currentXp,
          xpToNextLevel: killer.xpToNextLevel,
          level: killer.level,
          expGained: expReward,
          source: monster.name,
        } as S2CPlayerExpUpdatePayload);
      }

      if (progress.leveledUp) {
        this.broadcast(Opcode.S2C_PLAYER_LEVEL_UP, {
          playerId: killer.id,
          newLevel: killer.level,
          newAttributes: killer.attributes,
          newMaxHp: killer.maxHp,
          newMaxResource: killer.maxResource,
          totalCombatPower: killer.CombatPower,
        } as S2CPlayerLevelUpPayload);

        // Notify killer with fresh inventory / CP
        if (killerConn) {
          killerConn.send(Opcode.S2C_INVENTORY_UPDATE, {
            slots: killer.inventory,
            gold: killer.gold,
            totalCombatPower: killer.CombatPower,
          } as S2CInventoryUpdatePayload);
        }
      }
    }

    // 2. Loot Generation & Drop Scattering
    const rolledDrops = monster.rollLoot();
    const now = Date.now();

    for (const drop of rolledDrops) {
      const itemDef = ITEMS_DATABASE[drop.itemId];
      if (!itemDef) continue;

      const dropId = `drop_${now}_${Math.random().toString(36).substring(2, 7)}`;
      // Slight random scatter offset around monster position (-1.2 to +1.2)
      const dropPos = createVector3(
        monster.position.x + (Math.random() - 0.5) * 2.0,
        monster.position.y,
        monster.position.z + (Math.random() - 0.5) * 2.0
      );

      const dropState: ItemDropState = {
        dropId,
        itemId: itemDef.itemId,
        name: itemDef.name,
        rarity: itemDef.rarity,
        quantity: drop.quantity,
        position: dropPos,
        spawnTime: now,
        despawnSec: 60,
      };

      this.activeItemDrops.set(dropId, dropState);

      this.broadcast(Opcode.S2C_ITEM_DROP_SPAWN, {
        dropId: dropState.dropId,
        itemId: dropState.itemId,
        name: dropState.name,
        rarity: dropState.rarity,
        quantity: dropState.quantity,
        position: dropState.position,
        despawnTimeSec: dropState.despawnSec,
      } as S2CItemDropSpawnPayload);
    }
  }

  public lootItem(player: Player, dropId: string): boolean {
    const drop = this.activeItemDrops.get(dropId);
    if (!drop) return false;

    // Validate distance (leeway up to 4.5m for tap or lag)
    if (distance(player.position, drop.position) > 4.5) {
      return false;
    }

    if (drop.itemId === 'gold') {
      player.gold += drop.quantity;
      this.db.updateCharacterGold(player.dbCharacterId, player.gold);
    } else {
      const added = this.db.addItemToInventory(player.dbCharacterId, drop.itemId, drop.quantity);
      if (!added) {
        // Inventory full
        return false;
      }
      player.inventory = this.db.getInventory(player.dbCharacterId);
      player.recalculateStatsFromEquipment();
    }

    this.activeItemDrops.delete(dropId);

    // Broadcast despawn to all players
    this.broadcast(Opcode.S2C_ITEM_DROP_DESPAWN, {
      dropId,
      looterId: player.id,
    } as S2CItemDropDespawnPayload);

    // Send inventory update to looter
    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }

    return true;
  }

  public usePlayerItem(player: Player, slotIndex: number): boolean {
    const item = player.inventory.find((i) => i.slotIndex === slotIndex);
    if (!item) return false;

    const itemDef = ITEMS_DATABASE[item.itemId];
    if (!itemDef) return false;

    if (itemDef.type === ItemType.CONSUMIVEL) {
      if (item.itemId === 'potion_hp_minor') {
        player.heal(50);
      } else if (item.itemId === 'potion_hp_major') {
        player.heal(150);
      } else if (item.itemId === 'potion_mp_minor') {
        player.restoreResource(40);
      } else if (item.itemId === 'potion_mp_major') {
        player.restoreResource(100);
      }
      this.db.removeItemFromInventory(player.dbCharacterId, slotIndex, 1);
    } else if (itemDef.type === ItemType.EQUIPAMENTO) {
      this.db.toggleEquipItem(player.dbCharacterId, slotIndex);
    }

    player.inventory = this.db.getInventory(player.dbCharacterId);
    player.recalculateStatsFromEquipment();

    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }

    return true;
  }
}
