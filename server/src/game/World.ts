import {
  CharacterClass,
  createVector3,
  distance,
  EntitySnapshotState,
  Opcode,
  S2CCombatEventPayload,
  S2CEntityDespawnPayload,
  S2CEntitySpawnPayload,
  S2CWorldSnapshotPayload,
  Vector3,
} from '@magicforge/shared';
import { EntityManager } from './EntityManager';
import { Player } from '../entities/Player';
import { Monster, MonsterState } from '../entities/Monster';
import { Connection } from '../network/Connection';

export class World {
  public readonly entityManager = new EntityManager();
  public currentTick: number = 0;
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
    });

    console.log(`[World] Spawned ${mobSpawns.length} initial monsters in the world.`);
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
    // Generate spawn point (near center with slight random offset)
    const randomAngle = Math.random() * Math.PI * 2;
    const randomDist = 2 + Math.random() * 4;
    const spawnPos = createVector3(
      Math.cos(randomAngle) * randomDist,
      0,
      Math.sin(randomAngle) * randomDist
    );

    const player = new Player(connection.id, name, classType, spawnPos);
    this.entityManager.addPlayer(player);
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

    console.log(`[World] Player "${player.name}" (${player.classType}) spawned at [${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}]. Total players: ${this.entityManager.getAllPlayers().length}`);
    return player;
  }

  private handlePlayerDisconnect(playerId: string): void {
    const player = this.entityManager.removePlayer(playerId);
    if (player) {
      console.log(`[World] Player "${player.name}" disconnected.`);
      this.broadcast(Opcode.S2C_ENTITY_DESPAWN, {
        entityId: playerId,
        reason: 'DISCONNECTED',
      } as S2CEntityDespawnPayload);
    }
  }

  /**
   * Authoritative Simulation Step called by GameLoop at 20Hz (every 50ms)
   */
  public update(deltaTimeSec: number): void {
    this.currentTick++;

    // 1. Update all Players
    const players = this.entityManager.getAllPlayers();
    for (const player of players) {
      player.update(deltaTimeSec);

      // Auto-Combat AI for Players (matching Unity AutoCombatController logic)
      this.processPlayerAutoCombat(player);
    }

    // 2. Update all Monsters & AI
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

      // Monster Combat Attack
      this.processMonsterCombat(monster);
    }

    // 3. Build & Broadcast World Snapshot
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

  private broadcastSnapshot(): void {
    const entities = this.entityManager.getAllEntities();
    const entitySnapshots: EntitySnapshotState[] = entities.map((e) => e.toSnapshotState());

    const snapshotPayload: S2CWorldSnapshotPayload = {
      serverTick: this.currentTick,
      serverTimestamp: Date.now(),
      entities: entitySnapshots,
    };

    this.broadcast(Opcode.S2C_WORLD_SNAPSHOT, snapshotPayload);
  }

  public broadcast<T>(op: Opcode, data: T, excludeConnectionId?: string): void {
    for (const [id, conn] of this.connections) {
      if (id !== excludeConnectionId && conn.isAuthenticated) {
        conn.send(op, data);
      }
    }
  }
}
