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

  // Resource & Skills
  public currentResource: number;
  public maxResource: number;
  public readonly resourceType: 'Mana' | 'Energia';
  public resourceRegenPerSec: number = 8.0;
  public skillCooldowns = new Map<number, number>(); // slot -> remaining seconds

  public targetDestination: Vector3 | null = null;
  public moveDirection: Vector3 | null = null;
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

    // Resource allocation based on class (Mana for casters, Energia for martials)
    const isCaster = classType === CharacterClass.MAGO || classType === CharacterClass.CLERIGO || classType === CharacterClass.BRUXO;
    this.resourceType = isCaster ? 'Mana' : 'Energia';
    this.maxResource = isCaster ? 100 + (this.attributes.inteligencia || this.attributes.sabedoria || 10) * 8 : 100;
    this.currentResource = this.maxResource;
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
    this.moveDirection = null;
    this.lastProcessedInputSeq = inputSeq;
    this.isMoving = true;
  }

  public setMoveDirection(dir: Vector3, inputSeq: number): void {
    const magSq = dir.x * dir.x + dir.z * dir.z;
    if (magSq < 0.001) {
      this.stopMoving();
      return;
    }

    const mag = Math.sqrt(magSq);
    this.moveDirection = createVector3(dir.x / mag, 0, dir.z / mag);
    this.targetDestination = null;
    this.lastProcessedInputSeq = inputSeq;
    this.isMoving = true;
  }

  public stopMoving(): void {
    this.targetDestination = null;
    this.moveDirection = null;
    this.isMoving = false;
    this.velocity = createVector3(0, 0, 0);
  }

  public override update(deltaTimeSec: number): void {
    if (this.isDead) return;

    // Tick basic attack cooldown
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTimeSec;
    }

    // Tick Skill Cooldowns
    for (const [slot, cd] of this.skillCooldowns) {
      const remaining = cd - deltaTimeSec;
      if (remaining <= 0) {
        this.skillCooldowns.delete(slot);
      } else {
        this.skillCooldowns.set(slot, remaining);
      }
    }

    // Passive Resource Regeneration (Mana / Energia)
    if (this.currentResource < this.maxResource) {
      this.currentResource = Math.min(this.maxResource, this.currentResource + this.resourceRegenPerSec * deltaTimeSec);
    }

    // Authoritative Continuous Direction Movement (Mobile Virtual Joystick)
    if (this.isMoving && this.moveDirection) {
      this.velocity.x = this.moveDirection.x * this.speed;
      this.velocity.y = 0;
      this.velocity.z = this.moveDirection.z * this.speed;

      this.headingYaw = (Math.atan2(this.moveDirection.x, this.moveDirection.z) * 180) / Math.PI;

      this.position.x += this.velocity.x * deltaTimeSec;
      this.position.z += this.velocity.z * deltaTimeSec;

      this.clampToBounds();
      return;
    }

    // Authoritative Destination Movement (Touch/Click-to-Move)
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

  public getSkillCooldown(slot: number): number {
    return this.skillCooldowns.get(slot) || 0;
  }

  public setSkillCooldown(slot: number, durationSec: number): void {
    this.skillCooldowns.set(slot, durationSec);
  }

  public consumeResource(amount: number): boolean {
    if (this.currentResource >= amount) {
      this.currentResource -= amount;
      return true;
    }
    return false;
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
      currentResource: Math.round(this.currentResource),
      maxResource: this.maxResource,
      resourceType: this.resourceType,
    };
  }
}
