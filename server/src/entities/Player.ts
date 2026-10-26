import {
  CharacterAttributes,
  CharacterClass,
  CLASS_DEFINITIONS,
  distance,
  distanceSquared,
  EntityType,
  PrimaryStatType,
  Vector3,
  cloneVector3,
  createVector3,
  EntitySnapshotState,
} from '@magicforge/shared';
import { Entity } from './Entity';
import { SERVER_CONFIG } from '../config';

export class Player extends Entity {
  public readonly classType: CharacterClass;
  public attributes: CharacterAttributes;
  public level: number = 1;
  public speed: number;
  public attackRange: number;
  public attackIntervalSec: number;

  public targetDestination: Vector3 | null = null;
  public attackTimer: number = 0;
  public lastProcessedInputSeq: number = 0;

  constructor(id: string, name: string, classType: CharacterClass, initialPosition: Vector3) {
    const classDef = CLASS_DEFINITIONS[classType] || CLASS_DEFINITIONS[CharacterClass.GUERREIRO];
    // HP = constituicao * 10 + (level * 50) as defined in BaseStats.cs
    const maxHp = classDef.baseStats.constituicao * 10 + 50;

    super(id, EntityType.PLAYER, name, initialPosition, maxHp);

    this.classType = classType;
    this.attributes = { ...classDef.baseStats };
    this.speed = classDef.baseSpeed;
    this.attackRange = classDef.attackRange;
    this.attackIntervalSec = classDef.attackIntervalSec;
  }

  public get BaseDamage(): number {
    const classDef = CLASS_DEFINITIONS[this.classType];
    let modifier = 0;

    switch (classDef.mainStat) {
      case PrimaryStatType.FORCA:
        modifier = this.attributes.forca;
        break;
      case PrimaryStatType.DESTREZA:
        modifier = this.attributes.destreza;
        break;
      case PrimaryStatType.INTELIGENCIA:
        modifier = this.attributes.inteligencia;
        break;
      case PrimaryStatType.SABEDORIA:
        modifier = this.attributes.sabedoria;
        break;
      case PrimaryStatType.CARISMA:
        modifier = this.attributes.carisma;
        break;
      case PrimaryStatType.FORCA_E_CARISMA:
        modifier = this.attributes.forca + this.attributes.carisma;
        break;
    }

    return modifier * 3 + this.level * 5;
  }

  public get CombatPower(): number {
    const { forca, destreza, constituicao, inteligencia, sabedoria, carisma } = this.attributes;
    const cpStats = (forca + destreza + constituicao + inteligencia + sabedoria + carisma) * 15;
    const cpLevel = this.level * 100;
    return cpStats + cpLevel;
  }

  public setMoveDestination(destination: Vector3, inputSeq: number): void {
    this.targetDestination = cloneVector3(destination);
    this.lastProcessedInputSeq = inputSeq;
    this.isMoving = true;
  }

  public stopMoving(): void {
    this.targetDestination = null;
    this.isMoving = false;
    this.velocity = createVector3(0, 0, 0);
  }

  public override update(deltaTimeSec: number): void {
    if (this.isDead) return;

    // Tick cooldowns
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTimeSec;
    }

    // Authoritative Movement Simulation
    if (this.isMoving && this.targetDestination) {
      const dx = this.targetDestination.x - this.position.x;
      const dz = this.targetDestination.z - this.position.z;
      const distSq = dx * dx + dz * dz;

      const stopDistance = 0.15;
      if (distSq <= stopDistance * stopDistance) {
        // Arrived at destination
        this.position.x = this.targetDestination.x;
        this.position.z = this.targetDestination.z;
        this.stopMoving();
      } else {
        const dist = Math.sqrt(distSq);
        const dirX = dx / dist;
        const dirZ = dz / dist;

        // Velocity vector
        this.velocity.x = dirX * this.speed;
        this.velocity.y = 0;
        this.velocity.z = dirZ * this.speed;

        // Yaw angle (degrees)
        this.headingYaw = (Math.atan2(dirX, dirZ) * 180) / Math.PI;

        // Integrate position: s = v * dt
        const moveStep = this.speed * deltaTimeSec;
        if (moveStep >= dist) {
          this.position.x = this.targetDestination.x;
          this.position.z = this.targetDestination.z;
          this.stopMoving();
        } else {
          this.position.x += dirX * moveStep;
          this.position.z += dirZ * moveStep;
        }

        // Clamp to map boundaries
        this.clampToBounds();
      }
    }
  }

  private clampToBounds(): void {
    const { minX, maxX, minZ, maxZ } = SERVER_CONFIG.MAP_BOUNDS;
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
    this.position.z = Math.max(minZ, Math.min(maxZ, this.position.z));
  }

  public override toSnapshotState(): EntitySnapshotState {
    const base = super.toSnapshotState();
    return {
      ...base,
      classType: this.classType,
    };
  }
}
