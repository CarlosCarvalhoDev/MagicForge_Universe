import {
  distance,
  distanceSquared,
  EntityType,
  Vector3,
  cloneVector3,
  createVector3,
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
  public state: MonsterState = MonsterState.IDLE;
  public aggroRadius: number = 14.0;
  public attackRange: number = 2.2;
  public attackIntervalSec: number = 1.6;
  public attackDamage: number = 15;
  public speed: number = 3.6;

  public attackCooldown: number = 0;
  public targetPlayer: Entity | null = null;
  public respawnTimer: number = 0;
  public readonly respawnDelaySec: number = 6.0;
  public lootTable: LootDropEntry[] = [];

  constructor(id: string, name: string, spawnPos: Vector3, maxHp = 100, damage = 15) {
    super(id, EntityType.MONSTER, name, spawnPos, maxHp);
    this.spawnPosition = cloneVector3(spawnPos);
    this.attackDamage = damage;
    this.configureDefaultLoot();
  }

  private configureDefaultLoot(): void {
    if (this.name.includes('Slime')) {
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 5, maxQty: 12 },
        { itemId: 'essence_slime', dropChance: 0.8, minQty: 1, maxQty: 2 },
        { itemId: 'potion_hp_minor', dropChance: 0.35, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Lobo')) {
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 8, maxQty: 18 },
        { itemId: 'wolf_fang', dropChance: 0.75, minQty: 1, maxQty: 2 },
        { itemId: 'armor_chainmail', dropChance: 0.15, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Arqueiro')) {
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 10, maxQty: 20 },
        { itemId: 'essence_goblin', dropChance: 0.7, minQty: 1, maxQty: 2 },
        { itemId: 'potion_mp_minor', dropChance: 0.4, minQty: 1, maxQty: 1 },
        { itemId: 'bow_hunting', dropChance: 0.12, minQty: 1, maxQty: 1 },
      ];
    } else if (this.name.includes('Chefe')) {
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 60, maxQty: 120 },
        { itemId: 'potion_hp_major', dropChance: 1.0, minQty: 1, maxQty: 2 },
        { itemId: 'rune_fragment', dropChance: 0.85, minQty: 1, maxQty: 3 },
        { itemId: 'shield_iron_buckler', dropChance: 0.45, minQty: 1, maxQty: 1 },
        { itemId: 'relic_ancient_forge', dropChance: 0.3, minQty: 1, maxQty: 1 }, // Lendário!
      ];
    } else {
      // Goblin Lanceiro / padrão
      this.lootTable = [
        { itemId: 'gold', dropChance: 1.0, minQty: 6, maxQty: 15 },
        { itemId: 'essence_goblin', dropChance: 0.65, minQty: 1, maxQty: 2 },
        { itemId: 'potion_hp_minor', dropChance: 0.35, minQty: 1, maxQty: 1 },
        { itemId: 'ore_iron_arcane', dropChance: 0.25, minQty: 1, maxQty: 2 },
        { itemId: 'sword_iron_broadsword', dropChance: 0.1, minQty: 1, maxQty: 1 },
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
    // If dead, tick respawn timer
    if (this.isDead) {
      this.respawnTimer += deltaTimeSec;
      if (this.respawnTimer >= this.respawnDelaySec) {
        this.respawn();
      }
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTimeSec;
    }

    // AI Logic
    switch (this.state) {
      case MonsterState.IDLE:
        this.velocity = createVector3(0, 0, 0);
        this.isMoving = false;
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

  public respawn(): void {
    this.isDead = false;
    this.currentHp = this.maxHp;
    this.position = cloneVector3(this.spawnPosition);
    this.velocity = createVector3(0, 0, 0);
    this.isMoving = false;
    this.state = MonsterState.IDLE;
    this.targetPlayer = null;
    this.targetId = null;
    this.respawnTimer = 0;
  }
}
