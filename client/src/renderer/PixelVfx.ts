export type FxKind = 'slash' | 'heal' | 'whirlwind' | 'avatar' | 'impact' | 'shield' | 'levelUp' | 'line' | 'judgment';
export type FxPosition = { x: number; y: number; z: number };
export type FxEntity = { id: string; position: FxPosition; headingYaw: number; currentHp: number };
export type SlashVariant = 'bleed' | 'rupture' | 'haste' | 'stun';
export type FxRequest = { kind: FxKind; position: FxPosition; yaw?: number; followId?: string; radius?: number; lineLength?: number; lineWidth?: number; variant?: SlashVariant };
export type FxInstance = FxRequest & { startedAt: number; duration: number };
export const FX_DURATION: Record<FxKind, number> = { slash: 330, heal: 800, whirlwind: 650, avatar: 1000, impact: 400, shield: 900, levelUp: 1100, line: 650, judgment: 850 };
export const FX_SHEETS = {
  heal: { file: '/assets/pixel/craftpix/vfx/heal.png', cell: 72, frames: 8, fps: 10 },
  impact: { file: '/assets/pixel/craftpix/vfx/impact.png', cell: 72, frames: 4, fps: 10 },
};
export function finitePosition(position: FxPosition | undefined): position is FxPosition {
  return !!position && Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z);
}
/** Bounded, disposable presentation state. No damage, healing or persistent statuses. */
export class PixelVfxQueue {
  private effects: FxInstance[] = [];
  spawn(request: FxRequest, now: number): void {
    if (!finitePosition(request.position) || !Number.isFinite(now) || !Object.hasOwn(FX_DURATION, request.kind)) return;
    this.effects.push({ ...request, position: { ...request.position }, yaw: Number.isFinite(request.yaw) ? request.yaw : 0, radius: Number.isFinite(request.radius) ? Math.max(1, Math.min(30, request.radius!)) : undefined, startedAt: now, duration: FX_DURATION[request.kind] });
    if (this.effects.length > 64) this.effects.splice(0, this.effects.length - 64);
  }
  clear(): void { this.effects = []; }
  sample(now: number, entities: readonly FxEntity[]): FxInstance[] {
    const byId = new Map(entities.map(e => [e.id, e]));
    this.effects = this.effects.filter(effect => now >= effect.startedAt && now - effect.startedAt < effect.duration && (!effect.followId || (byId.has(effect.followId) && byId.get(effect.followId)!.currentHp > 0)));
    return this.effects.map(effect => ({ ...effect, position: effect.followId ? { ...byId.get(effect.followId)!.position } : { ...effect.position } }));
  }
}
export type WarriorCastFx = {
  skillId: string; casterId: string; targetPosition?: FxPosition; targetId?: string;
  affectedEntityIds: string[]; isHeal: boolean;
  originPosition?: FxPosition; headingYaw?: number; geometry?: string; radius?: number;
  lineLength?: number; lineWidth?: number;
  targetResults?: Array<{ targetId: string; impactPosition: FxPosition; effectiveDamage: number; effectiveHeal: number }>;
};
/** Short cast/impact visuals only; persistent statuses use their own authoritative lifecycle. */
export function planWarriorCastFx(event: WarriorCastFx, entities: readonly FxEntity[], radius?: number): FxRequest[] {
  if (!event.affectedEntityIds.length) return [];
  const caster = entities.find(e => e.id === event.casterId);
  if (event.skillId === 'guerreiro_nv3_3') {
    if (!caster || !event.affectedEntityIds.includes(caster.id)) return [];
    // Mixed heal/damage cast: the heal flag must not hide its confirmed martial wave.
    const effects: FxRequest[] = [{ kind: 'heal', position: caster.position, followId: caster.id }];
    if (event.targetResults?.some(r => r.effectiveDamage > 0)) effects.push({ kind: 'avatar', position: caster.position, radius: event.radius ?? 4 });
    return effects;
  }
  if (event.skillId === 'guerreiro_nv1_1') {
    return event.isHeal && caster && event.affectedEntityIds.includes(caster.id) ? [{ kind: 'heal', position: caster.position, followId: caster.id }] : [];
  }
  if (event.isHeal) return [];
  const target = entities.find(e => event.affectedEntityIds.includes(e.id));
  const result = event.targetResults?.find(r => r.effectiveDamage > 0 && finitePosition(r.impactPosition));
  const impact = result?.impactPosition ?? (finitePosition(event.targetPosition) ? event.targetPosition : target?.position);
  const origin = finitePosition(event.originPosition) ? event.originPosition : caster?.position;
  const yaw = Number.isFinite(event.headingYaw) ? event.headingYaw! : origin && impact ? Math.atan2(impact.x - origin.x, impact.z - origin.z) * 180 / Math.PI : caster?.headingYaw ?? 0;
  if (['guerreiro_truque_1', 'guerreiro_truque_2', 'guerreiro_truque_3', 'guerreiro_nv1_2', 'guerreiro_nv1_3'].includes(event.skillId) && impact) {
    const variants: Record<string, SlashVariant> = { guerreiro_truque_2: 'bleed', guerreiro_truque_3: 'rupture', guerreiro_nv1_2: 'haste', guerreiro_nv1_3: 'stun' };
    return [{ kind: 'slash', position: impact, yaw, variant: variants[event.skillId] }];
  }
  const center = event.geometry === 'CIRCLE_SELF' ? origin : finitePosition(event.targetPosition) ? event.targetPosition : origin;
  radius = event.radius ?? radius;
  if (event.skillId === 'guerreiro_nv2_1' && center) return [{ kind: 'whirlwind', position: center, radius }];
  if (event.skillId === 'guerreiro_nv3_1' && center) return [{ kind: 'avatar', position: center, radius }];
  if (event.skillId === 'guerreiro_nv2_3' && origin) return [{ kind: 'line', position: origin, yaw, lineLength: event.lineLength, lineWidth: event.lineWidth }];
  if (event.skillId === 'guerreiro_nv3_2' && center) return [{ kind: 'judgment', position: center, radius }];
  return [];
}
