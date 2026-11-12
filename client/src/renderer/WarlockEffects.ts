import { WARLOCK_RELEASE_MS, warlockSkillArt } from './HeroAnimations.ts';
import type { FxEntity, FxRequest, WarriorCastFx } from './PixelVfx.ts';

const spells = [
  { speed: 32, radius: 1.1, tone: '#be81ff' },
  { speed: 24, radius: 1.2, tone: '#8bbbc5' },
  { speed: 19, radius: 1.5, tone: '#a7ed60' },
  { speed: 27, radius: 1.5, tone: '#f25591' },
  { speed: 0, radius: 1.7, tone: '#8fdfff' },
  { speed: 0, radius: 4.5, tone: '#ad61e4' },
  { speed: 19, radius: 5.5, tone: '#9765ff' },
  { speed: 22, radius: 1.4, tone: '#ff547a' },
  { speed: 0, radius: 3.5, tone: '#c5b0ed' },
  { speed: 16, radius: 8, tone: '#c694ff' },
  { speed: 17, radius: 6, tone: '#ff8b56' },
  { speed: 25, radius: 6, tone: '#ff6b98' },
];

export function planWarlockBasicAttack(origin: FxEntity['position'], destination: FxEntity['position'], hit: boolean): FxRequest[] {
  const travel = Math.max(90, Math.min(420, Math.hypot(destination.x - origin.x, destination.z - origin.z) * 32));
  const release = 250;
  const effects: FxRequest[] = [{ kind: 'warlockFlight', position: origin, destination, spellIndex: 0,
    tone: spells[0].tone, radius: .85, delayMs: release, durationMs: travel }];
  if (hit) effects.push({ kind: 'warlockImpact', position: destination, spellIndex: 0,
    tone: spells[0].tone, radius: .85, delayMs: release + travel, durationMs: 400 });
  return effects;
}

export function planWarlockAreaPulse(event: {
  event: string;
  status: { type: string; targetEntityId: string; radius?: number; areaCenter?: FxEntity['position'] };
}, entities: readonly FxEntity[]): FxRequest[] {
  if (event.event !== 'TICK') return [];
  const plague = event.status.type === 'WARLOCK_PLAGUE';
  const index = event.status.type === 'ABYSSAL_DEMON' ? 10 : event.status.type === 'HADAR_HUNGER' ? 6 : plague ? 2 : -1;
  const position = plague ? entities.find(entity => entity.id === event.status.targetEntityId)?.position : event.status.areaCenter;
  if (index < 0 || !position) return [];
  const spell = spells[index];
  return [{ kind: 'warlockImpact', position, spellIndex: index,
    tone: spell.tone, radius: event.status.radius ?? spell.radius, durationMs: 850 }];
}

export function planWarlockCast(event: WarriorCastFx, entities: readonly FxEntity[]): FxRequest[] {
  const art = warlockSkillArt(event.skillId);
  if (!art) return [];
  const index = art.slot * 3 + art.row;
  const spell = spells[index];
  const caster = entities.find(entity => entity.id === event.casterId);
  const origin = event.originPosition ?? caster?.position;
  if (!origin) return [];
  const primary = event.targetResults?.find(hit => hit.targetId === event.targetId);
  const destination = index === 4 || index === 8 ? origin : event.targetPosition ?? primary?.impactPosition ?? origin;
  const distance = Math.hypot(destination.x - origin.x, destination.z - origin.z);
  const travel = spell.speed && distance > .05 ? Math.min(560, Math.max(90, distance * 1000 / spell.speed)) : 0;
  const delay = WARLOCK_RELEASE_MS + travel;
  const effects: FxRequest[] = [];
  if (travel) {
    effects.push({ kind: 'warlockFlight', position: origin, destination, spellIndex: index, tone: spell.tone,
      delayMs: WARLOCK_RELEASE_MS, durationMs: travel });
  }
  effects.push({ kind: 'warlockImpact', position: destination, spellIndex: index, tone: spell.tone,
    radius: event.radius ?? spell.radius, delayMs: delay, durationMs: index >= 9 ? 1150 : 700 });
  if (index === 8 && event.targetPosition && event.targetPosition !== destination) {
    effects.push({ kind: 'warlockImpact', position: event.targetPosition, spellIndex: index, tone: spell.tone,
      radius: 1.5, delayMs: delay + 85 });
  }
  for (const result of event.targetResults ?? []) {
    if (result.effectiveDamage > 0 && result.targetId !== event.casterId) {
      const nearCenter = Math.hypot(result.impactPosition.x - destination.x, result.impactPosition.z - destination.z) < .6;
      effects.push({ kind: nearCenter ? 'warlockContact' : 'warlockImpact', position: result.impactPosition,
        spellIndex: index, tone: spell.tone, radius: 1.2, targetId: result.targetId, delayMs: delay });
    } else if (result.effectiveHeal > 0 && result.targetId === event.casterId) {
      if (index === 7 && travel) effects.push({ kind: 'warlockFlight', position: destination, destination: origin,
        spellIndex: index, tone: spell.tone, delayMs: delay, durationMs: travel });
      effects.push({ kind: 'heal', position: result.impactPosition, delayMs: delay + (index === 7 ? travel : 0) });
    }
  }
  return effects;
}
