import {
  Vector3,
  cloneVector3,
  createVector3,
  EntitySnapshotState,
  EntityType,
  CombatStatusType,
  CombatStatusStatePayload,
} from '@magicforge/shared';

export interface ActiveCombatStatus {
  statusId: string;
  type: CombatStatusType;
  skillId: string;
  sourceEntityId: string;
  targetEntityId: string;
  durationSec: number;
  remainingSec: number;
  expiresAtTick: number;
  magnitude: number;
  remainingAbsorption?: number;
  maxAbsorption?: number;
  reflectRatio?: number;
  nextTickSec?: number;
}

export interface TakeDamageResult {
  effectiveDamage: number;
  absorbed: number;
  reflected: number;
  killed: boolean;
  brokenShieldStatus?: ActiveCombatStatus;
  refreshedShieldStatus?: ActiveCombatStatus;
}

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
  public activeStatuses = new Map<string, ActiveCombatStatus>();

  constructor(id: string, type: EntityType, name: string, position: Vector3, maxHp: number) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.position = cloneVector3(position);
    this.velocity = createVector3(0, 0, 0);
    this.maxHp = maxHp;
    this.currentHp = maxHp;
  }

  public addStatus(status: ActiveCombatStatus): void {
    // Se já existir status do mesmo tipo, remove o anterior para renovar com o novo
    for (const [id, s] of this.activeStatuses) {
      if (s.type === status.type) {
        this.activeStatuses.delete(id);
      }
    }
    this.activeStatuses.set(status.statusId, status);
  }

  public getStatus(type: CombatStatusType): ActiveCombatStatus | undefined {
    for (const s of this.activeStatuses.values()) {
      if (s.type === type) return s;
    }
    return undefined;
  }

  public hasStatus(type: CombatStatusType): boolean {
    return this.getStatus(type) !== undefined;
  }

  public removeStatus(statusId: string): ActiveCombatStatus | undefined {
    const s = this.activeStatuses.get(statusId);
    if (s) {
      this.activeStatuses.delete(statusId);
    }
    return s;
  }

  public clearAllStatuses(): ActiveCombatStatus[] {
    const all = Array.from(this.activeStatuses.values());
    this.activeStatuses.clear();
    return all;
  }

  public isStunned(): boolean {
    return this.hasStatus('STUN');
  }

  public hasDeathImmunity(): boolean {
    return this.hasStatus('DEATH_IMMUNITY');
  }

  public getArmorMultiplier(): number {
    const armorBreak = this.getStatus('ARMOR_BREAK');
    return armorBreak ? 1.0 + armorBreak.magnitude : 1.0;
  }

  public getDamageMultiplier(): number {
    const buff = this.getStatus('DAMAGE_BUFF');
    return buff ? 1.0 + buff.magnitude : 1.0;
  }

  public getAttackSpeedMultiplier(): number {
    const haste = this.getStatus('ATTACK_SPEED_BUFF');
    // +25% de velocidade de ataque reduz o intervalo de ataque em 20% (1 / 1.25 = 0.8)
    return haste ? Math.max(0.4, 1.0 / (1.0 + haste.magnitude)) : 1.0;
  }

  public takeDamage(damage: number, source?: Entity, isReflected = false): TakeDamageResult {
    if (this.isDead || damage <= 0) {
      return { effectiveDamage: 0, absorbed: 0, reflected: 0, killed: false };
    }

    let modifiedDamage = Math.round(damage * this.getArmorMultiplier());
    let absorbed = 0;
    let reflected = 0;
    let brokenShieldStatus: ActiveCombatStatus | undefined;
    let refreshedShieldStatus: ActiveCombatStatus | undefined;

    // 1. Reflexão e absorção de escudo (Baluarte Inquebrável)
    const shield = this.getStatus('SHIELD');
    if (shield) {
      if (shield.reflectRatio && shield.reflectRatio > 0 && source && !source.isDead && !isReflected) {
        reflected = Math.max(1, Math.round(modifiedDamage * shield.reflectRatio));
        source.takeDamage(reflected, this, true);
      }

      if (shield.remainingAbsorption && shield.remainingAbsorption > 0) {
        absorbed = Math.min(shield.remainingAbsorption, modifiedDamage);
        shield.remainingAbsorption -= absorbed;
        modifiedDamage -= absorbed;

        if (shield.remainingAbsorption <= 0) {
          brokenShieldStatus = shield;
          this.activeStatuses.delete(shield.statusId);
        } else {
          refreshedShieldStatus = shield;
        }
      }
    }

    // 2. Aplicação de dano no HP com verificação de Imunidade à Morte
    if (this.hasDeathImmunity()) {
      // HP nunca cai abaixo de 1 durante a Última Resistência
      const prevHp = this.currentHp;
      this.currentHp = Math.max(1, this.currentHp - modifiedDamage);
      const appliedDamage = prevHp - this.currentHp;
      return {
        effectiveDamage: appliedDamage + absorbed,
        absorbed,
        reflected,
        killed: false,
        brokenShieldStatus,
        refreshedShieldStatus,
      };
    }

    this.currentHp = Math.max(0, this.currentHp - modifiedDamage);
    const killed = this.currentHp <= 0;
    if (killed) {
      this.isDead = true;
      this.onDeath();
    }

    return {
      effectiveDamage: modifiedDamage + absorbed,
      absorbed,
      reflected,
      killed,
      brokenShieldStatus,
      refreshedShieldStatus,
    };
  }

  public heal(amount: number): number {
    if (this.isDead || amount <= 0) return 0;
    const prevHp = this.currentHp;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    return this.currentHp - prevHp;
  }

  protected onDeath(): void {
    this.velocity = createVector3(0, 0, 0);
    this.isMoving = false;
    this.clearAllStatuses();
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
