import type { Vector3 } from './math';

/** Authored timings where the original catalogue did not specify a duration. */
export const MONK_EFFECTS = {
  palmPulses: 2, palmIntervalSec: .1, flurryPulses: 4, flurryIntervalSec: .125,
  attackSlow: .2, attackSlowSec: 4, windSec: 5, dodgeBonus: .35, criticalBonus: .15,
  stunSec: 2.5, coneRange: 5, coneAngleDeg: 60, shadowHits: 3,
  strideSec: 6, strideBonus: 1, domeSec: 6, domePulses: 6, domeHealFraction: .3,
} as const;

export function getMonkStrikes(skillId: string) {
  return skillId === 'monge_truque_1' ? { pulses: MONK_EFFECTS.palmPulses, intervalSec: MONK_EFFECTS.palmIntervalSec }
    : skillId === 'monge_nv1_1' ? { pulses: MONK_EFFECTS.flurryPulses, intervalSec: MONK_EFFECTS.flurryIntervalSec } : undefined;
}

export function isInMonkCone(origin: Vector3, point: Vector3, yawDeg: number): boolean {
  const dx=point.x-origin.x, dz=point.z-origin.z, length=Math.hypot(dx,dz);
  if (length > MONK_EFFECTS.coneRange + 1e-8) return false;
  if (length < 1e-8) return true;
  const yaw=yawDeg*Math.PI/180;
  return (dx*Math.sin(yaw)+dz*Math.cos(yaw))/length >= Math.cos(MONK_EFFECTS.coneAngleDeg*Math.PI/360)-1e-8;
}
