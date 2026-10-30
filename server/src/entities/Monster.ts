import {
  distance,
  distanceSquared,
  EntityType,
  Vector3,
  cloneVector3,
  createVector3,
  EntitySnapshotState,
} from '@magicforge/shared';
import { Entity } from './Entity';

export enum MonsterState {
  IDLE = 'IDLE',
  CHASING = 'CHASING',
  ATTACKING = 'ATTACKING',
  RETURNING = 'RETURNING',
}

export interface LootDropEntry {
  itemId: string;
  dropChance: number; // 0.0 to 1.0 (e.g. 0.8 = 80%)
  minQty: number;
  maxQty: number;
}

export class Monster extends Entity {
  public spawnPosition: Vector3;
  public originalCampPosition: Vector3;
  public state: MonsterState = MonsterState.IDLE;
  public aggroRadius: number = 18.0;
  public attackRange: number = 2.4;
  public attackIntervalSec: number = 1.3;
  public attackDamage: number = 15;
  public speed: number = 5.2;

  public attackCooldown: number = 0;
  public targetPlayer: Entity | null = null;
  public respawnTimer: number = 0;
  public respawnDelaySec: number = 5.0;
  public autoRespawns: boolean = true;
  public isBoss: boolean = false;
  public monsterType: string = 'melee';
  private wanderTimer: number = 0;
  private wanderIntervalSec: number = 4.0;
  private wanderTarget: Vector3 | null = null;
  public lootTable: LootDropEntry[] = [];
  public expReward: number = 35;

  constructor(id: string, name: string, spawnPos: Vector3, maxHp = 100, damage = 15, monsterType = 'melee') {
    super(id, EntityType.MONSTER, name, spawnPos, maxHp);
    this.spawnPosition = cloneVector3(spawnPos);
    this.originalCampPosition = cloneVector3(spawnPos);
    this.attackDamage = damage;
    this.monsterType = monsterType;
    this.wanderIntervalSec = 2.0 + Math.random() * 4.0;
    this.configureDefaultLoot();

    if (this.name.includes('Lobo')) {
      this.speed = 6.0;
      this.aggroRadius = 20.0;
    } else if (this.name.includes('Chefe') || this.name.includes('Grimgor') || this.name.includes('Malakor')) {
      this.speed = 4.8;
      this.aggroRadius = 26.0;
      this.attackRange = 3.2;
    }
  }

  private configureDefaultLoot(): void {
    if (this.name.includes('Slime')) {
      this.expReward = 25;
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 5, maxQty: 12 },
        { itemId: 'essence_slime', dropChance: 0.8, minQty: 1, maxQty: 2 },
        { itemId: 'stone_forge_common', dropChance: 0.35, minQty: 1, maxQty: 2 },
        { itemId: 'arcane_dust', dropChance: 0.3, minQty: 1, maxQty: 2 },
        { itemId: 'potion_hp_minor', dropChance: 0.35, minQty: 1, maxQty: 1 },
        { itemId: 'card_slime', dropChance: 0.15, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Lobo')) {
      this.expReward = 50;
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 8, maxQty: 18 },
        { itemId: 'wolf_fang', dropChance: 0.75, minQty: 1, maxQty: 2 },
        { itemId: 'stone_forge_common', dropChance: 0.4, minQty: 1, maxQty: 2 },
        { itemId: 'armor_chainmail', dropChance: 0.15, minQty: 1, maxQty: 1 },
        { itemId: 'card_wolf', dropChance: 0.15, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Arqueiro') || this.name.includes('Esqueleto')) {
      this.expReward = 40;
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 10, maxQty: 20 },
        { itemId: 'essence_goblin', dropChance: 0.7, minQty: 1, maxQty: 2 },
        { itemId: 'stone_forge_common', dropChance: 0.35, minQty: 1, maxQty: 2 },
        { itemId: 'potion_mp_minor', dropChance: 0.4, minQty: 1, maxQty: 1 },
        { itemId: 'bow_hunting', dropChance: 0.12, minQty: 1, maxQty: 1 },
        { itemId: 'card_skeleton', dropChance: 0.15, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Grimgor') || this.name.includes('Frostbite') || this.name.includes('Ignis') || this.name.includes('Lorde Titânico') || this.name.includes('Chefão')) {
      this.isBoss = true;
      this.autoRespawns = false;
      const isFrostbite = this.name.includes('Frostbite');
      const isIgnis = this.name.includes('Ignis');
      const bossCardId = isFrostbite ? 'card_boss_frostbite' : (isIgnis ? 'card_boss_ignis' : 'card_boss_grimgor');
      this.expReward = isFrostbite ? 3800 : (isIgnis ? 9000 : 1500);
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: isFrostbite ? 500 : 200, maxQty: isFrostbite ? 1200 : 500 },
        { itemId: 'stone_forge_rare', dropChance: 1.0, minQty: 3, maxQty: 6 },
        { itemId: 'stone_forge_mystic', dropChance: 0.85, minQty: 1, maxQty: 3 },
        { itemId: 'arcane_dust', dropChance: 1.0, minQty: 20, maxQty: 40 },
        { itemId: 'gem_ruby_str', dropChance: 0.6, minQty: 1, maxQty: 2 },
        { itemId: 'gem_sapphire_int', dropChance: 0.6, minQty: 1, maxQty: 2 },
        { itemId: 'gem_emerald_dex', dropChance: 0.6, minQty: 1, maxQty: 2 },
        { itemId: 'gem_topaz_con', dropChance: 0.6, minQty: 1, maxQty: 2 },
        { itemId: 'potion_hp_major', dropChance: 1.0, minQty: 4, maxQty: 8 },
        { itemId: 'rune_fragment', dropChance: 1.0, minQty: 3, maxQty: 8 },
        { itemId: 'sword_runic_bastard', dropChance: 0.4, minQty: 1, maxQty: 1 },
        { itemId: 'staff_void_astral', dropChance: 0.35, minQty: 1, maxQty: 1 },
        { itemId: 'relic_ancient_forge', dropChance: 0.5, minQty: 1, maxQty: 1 },
        { itemId: bossCardId, dropChance: 1.0, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Chefe Yetin') || this.name.includes('Chefe Goblin') || this.name.includes('Chefe')) {
      // Mini-Chefes de Santuário Externo
      this.expReward = this.name.includes('Yetin') ? 280 : 180;
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 40, maxQty: 100 },
        { itemId: 'stone_forge_rare', dropChance: 0.75, minQty: 1, maxQty: 2 },
        { itemId: 'stone_forge_common', dropChance: 1.0, minQty: 2, maxQty: 4 },
        { itemId: 'arcane_dust', dropChance: 0.8, minQty: 5, maxQty: 10 },
        { itemId: 'potion_hp_minor', dropChance: 0.8, minQty: 2, maxQty: 3 },
        { itemId: 'gem_topaz_con', dropChance: 0.25, minQty: 1, maxQty: 1 },
        { itemId: this.name.includes('Yetin') ? 'card_wolf' : 'card_goblin', dropChance: 0.35, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Gelo') || this.name.includes('Glacial') || this.name.includes('Jotunheim')) {
      // Monstros Normais de Mundo 2 (Jotunheim)
      this.expReward = 65;
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 14, maxQty: 30 },
        { itemId: 'stone_forge_common', dropChance: 0.5, minQty: 1, maxQty: 3 },
        { itemId: 'arcane_dust', dropChance: 0.45, minQty: 1, maxQty: 3 },
        { itemId: 'potion_hp_minor', dropChance: 0.4, minQty: 1, maxQty: 2 },
        { itemId: 'ore_iron_arcane', dropChance: 0.35, minQty: 1, maxQty: 2 },
        { itemId: 'armor_chainmail', dropChance: 0.15, minQty: 1, maxQty: 1 },
        { itemId: 'card_orc', dropChance: 0.18, minQty: 1, maxQty: 1 },
      ];
    } else {
      // Goblin Lanceiro / padrão
      this.expReward = 35;
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 6, maxQty: 15 },
        { itemId: 'essence_goblin', dropChance: 0.65, minQty: 1, maxQty: 2 },
        { itemId: 'stone_forge_common', dropChance: 0.35, minQty: 1, maxQty: 2 },
        { itemId: 'arcane_dust', dropChance: 0.35, minQty: 1, maxQty: 2 },
        { itemId: 'potion_hp_minor', dropChance: 0.35, minQty: 1, maxQty: 1 },
        { itemId: 'ore_iron_arcane', dropChance: 0.25, minQty: 1, maxQty: 2 },
        { itemId: 'sword_iron_broadsword', dropChance: 0.1, minQty: 1, maxQty: 1 },
        { itemId: 'card_goblin', dropChance: 0.15, minQty: 1, maxQty: 1 },
      ];
    }
  }

  public rollLoot(): Array<{ itemId: string; quantity: number }> {
    const drops: Array<{ itemId: string; quantity: number }> = [];

    for (const entry of this.lootTable) {
      if (Math.random() <= entry.dropChance) {
        const qty = Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1)) + entry.minQty;
        drops.push({ itemId: entry.itemId, quantity: qty });
      }
    }

    return drops;
  }

  public override update(deltaTimeSec: number): void {
    // If dead, tick respawn timer (only if monster autoRespawns)
    if (this.isDead) {
      if (!this.autoRespawns) return;
      this.respawnTimer += deltaTimeSec;
      if (this.respawnTimer >= this.respawnDelaySec) {
        this.respawn();
      }
      return;
    }

    // Se estiver atordoado, interrompe movimento e ações
    if (this.isStunned()) {
      this.velocity = createVector3(0, 0, 0);
      this.isMoving = false;
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTimeSec;
    }

    // AI Logic
    switch (this.state) {
      case MonsterState.IDLE:
        this.wanderTimer += deltaTimeSec;
        if (this.wanderTimer >= this.wanderIntervalSec) {
          this.wanderTimer = 0;
          this.wanderIntervalSec = 3.5 + Math.random() * 4.5;
          if (Math.random() < 0.6) {
            // Escolhe um ponto aleatório para passear até 10m de seu spawn
            const angle = Math.random() * Math.PI * 2;
            const r = 3 + Math.random() * 8;
            this.wanderTarget = createVector3(
              this.spawnPosition.x + Math.cos(angle) * r,
              0,
              this.spawnPosition.z + Math.sin(angle) * r
            );
          } else {
            this.wanderTarget = null;
          }
        }

        if (this.wanderTarget) {
          const d = distance(this.position, this.wanderTarget);
          if (d <= 0.6) {
            this.wanderTarget = null;
            this.velocity = createVector3(0, 0, 0);
            this.isMoving = false;
          } else {
            // Passeio calmo a 40% da velocidade de corrida
            const origSpeed = this.speed;
            this.speed = origSpeed * 0.45;
            this.moveTowards(this.wanderTarget, deltaTimeSec);
            this.speed = origSpeed;
          }
        } else {
          this.velocity = createVector3(0, 0, 0);
          this.isMoving = false;
        }
        break;

      case MonsterState.CHASING:
        if (!this.targetPlayer || this.targetPlayer.isDead) {
          this.state = MonsterState.RETURNING;
          this.targetId = null;
          break;
        }

        const distToPlayer = distance(this.position, this.targetPlayer.position);
        if (distToPlayer > this.aggroRadius * 1.5) {
          // Lost aggro
          this.targetPlayer = null;
          this.targetId = null;
          this.state = MonsterState.RETURNING;
          break;
        }

        if (distToPlayer <= this.attackRange) {
          // In attack range
          this.state = MonsterState.ATTACKING;
          this.velocity = createVector3(0, 0, 0);
          this.isMoving = false;
        } else {
          // Move towards player
          this.moveTowards(this.targetPlayer.position, deltaTimeSec);
        }
        break;

      case MonsterState.ATTACKING:
        if (!this.targetPlayer || this.targetPlayer.isDead) {
          this.targetPlayer = null;
          this.targetId = null;
          this.state = MonsterState.RETURNING;
          break;
        }

        const dist = distance(this.position, this.targetPlayer.position);
        if (dist > this.attackRange * 1.2) {
          // Player stepped out of attack range
          this.state = MonsterState.CHASING;
        }
        break;

      case MonsterState.RETURNING:
        const distToHome = distance(this.position, this.spawnPosition);
        if (distToHome <= 0.2) {
          this.position = cloneVector3(this.spawnPosition);
          this.velocity = createVector3(0, 0, 0);
          this.isMoving = false;
          this.state = MonsterState.IDLE;
        } else {
          this.moveTowards(this.spawnPosition, deltaTimeSec);
        }
        break;
    }
  }

  private moveTowards(target: Vector3, dt: number): void {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= 0.05) {
      this.velocity = createVector3(0, 0, 0);
      this.isMoving = false;
      return;
    }

    const dirX = dx / dist;
    const dirZ = dz / dist;

    this.velocity.x = dirX * this.speed;
    this.velocity.y = 0;
    this.velocity.z = dirZ * this.speed;

    this.headingYaw = (Math.atan2(dirX, dirZ) * 180) / Math.PI;

    const step = this.speed * dt;
    if (step >= dist) {
      this.position.x = target.x;
      this.position.z = target.z;
    } else {
      this.position.x += dirX * step;
      this.position.z += dirZ * step;
    }

    this.isMoving = true;
  }

  public respawn(newPosition?: Vector3): void {
    if (!this.autoRespawns) return;
    this.isDead = false;
    this.currentHp = this.maxHp;
    this.wanderTimer = 0;
    this.wanderTarget = null;
    if (newPosition) {
      this.spawnPosition = cloneVector3(newPosition);
    } else {
      // Renasce no raio do seu acampamento designado (+- 3.5m)
      const basePos = this.originalCampPosition || this.spawnPosition;
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 3.5;
      this.spawnPosition = createVector3(
        Math.round((basePos.x + Math.cos(angle) * radius) * 10) / 10,
        0,
        Math.round((basePos.z + Math.sin(angle) * radius) * 10) / 10
      );
    }
    this.position = cloneVector3(this.spawnPosition);
    this.velocity = createVector3(0, 0, 0);
    this.isMoving = false;
    this.state = MonsterState.IDLE;
    this.targetPlayer = null;
    this.targetId = null;
    this.respawnTimer = 0;
  }

  public override toSnapshotState(): EntitySnapshotState {
    const base = super.toSnapshotState();
    base.monsterType = this.monsterType;
    return base;
  }
}
