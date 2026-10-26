import { Vector3, cloneVector3, createVector3, EntitySnapshotState, EntityType } from '@magicforge/shared';

export abstract class Entity {
  public readonly id: string;
  public readonly type: EntityType;
  public name: string;
  public position: Vector3;
  public velocity: Vector3;
  public headingYaw: number = 0; // Degrees (0-360)
  public currentHp: number;
  public maxHp: number;
  public isMoving: boolean = false;
  public targetId: string | null = null;
  public isDead: boolean = false;

  constructor(id: string, type: EntityType, name: string, position: Vector3, maxHp: number) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.position = cloneVector3(position);
    this.velocity = createVector3(0, 0, 0);
    this.maxHp = maxHp;
    this.currentHp = maxHp;
  }

  public takeDamage(damage: number): boolean {
    if (this.isDead) return false;
    this.currentHp = Math.max(0, this.currentHp - damage);
    if (this.currentHp <= 0) {
      this.isDead = true;
      this.onDeath();
    }
    return true;
  }

  public heal(amount: number): void {
    if (this.isDead) return;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }

  protected onDeath(): void {
    this.velocity = createVector3(0, 0, 0);
    this.isMoving = false;
  }

  public abstract update(deltaTimeSec: number): void;

  public toSnapshotState(): EntitySnapshotState {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      position: cloneVector3(this.position),
      velocity: cloneVector3(this.velocity),
      headingYaw: this.headingYaw,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      isMoving: this.isMoving,
      targetId: this.targetId,
    };
  }
}
