import type { CombatStatusStatePayload, CombatStatusTransitionPayload, S2CSkillCastEventPayload } from '@magicforge/shared';
import type { FxEntity } from './PixelVfx';

/** Old events retain basic-attack behavior; skills have their own cast event. */
export function combatTriggersAttack(damageSource?: string): boolean {
  return damageSource === undefined || damageSource === 'BASIC_ATTACK';
}

/** The server sends a structured rejection followed by a legacy chat echo. */
export class SkillRejectionEchoFilter {
  private last: { message: string; time: number } | null = null;
  record(message: string, now: number): void { this.last = { message, time: now }; }
  suppress(senderId: string | undefined, message: string, now: number): boolean {
    if (senderId !== 'Grimório' || !this.last || this.last.message !== message || now - this.last.time > 2000) return false;
    this.last = null; return true;
  }
}

export class WarriorPresentation {
  private casts = new Map<string, number>();
  private statuses = new Map<string, { status: CombatStatusStatePayload; tick: number; until: number; removed: boolean; seen: boolean }>();
  clear(): void { this.casts.clear(); this.statuses.clear(); }
  acceptCast(event: Pick<S2CSkillCastEventPayload, 'castId'>, now: number): boolean {
    for (const [id, time] of this.casts) if (now - time > 60000) this.casts.delete(id);
    if (!event.castId) return true; // Compatibility: old events cannot be deduplicated reliably.
    if (this.casts.has(event.castId)) return false;
    this.casts.set(event.castId, now);
    if (this.casts.size > 512) this.casts.delete(this.casts.keys().next().value!);
    return true;
  }
  transition(payload: CombatStatusTransitionPayload, now: number): boolean {
    const { status, serverTick, event } = payload;
    const previous = this.statuses.get(status.statusId);
    const removed = !['APPLIED', 'REFRESHED', 'TICK'].includes(event);
    if (previous && (serverTick < previous.tick || (serverTick === previous.tick && (previous.removed || !removed)))) return false;
    const remaining = Math.max(0, Math.min(status.remainingSec, (status.expiresAtTick - serverTick) / 20));
    this.statuses.set(status.statusId, { status: { ...status }, tick: serverTick, until: now + remaining * 1000, removed, seen: previous?.seen ?? false });
    if (this.statuses.size > 512) this.statuses.delete(this.statuses.keys().next().value!);
    return true;
  }
  visible(now: number, entities: readonly FxEntity[]): CombatStatusStatePayload[] {
    const byId = new Map(entities.map(e => [e.id, e]));
    const visible: CombatStatusStatePayload[] = [];
    for (const entry of this.statuses.values()) {
      const entity = byId.get(entry.status.targetEntityId);
      if (entry.until <= now || (entry.seen && !entity) || (entity && entity.currentHp <= 0)) entry.removed = true;
      if (!entry.removed && entity) { entry.seen = true; visible.push(entry.status); }
    }
    return visible;
  }
}
