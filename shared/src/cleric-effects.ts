/** Initial tuning: listed damage is the total per activation, not damage per pulse. */
export const CLERIC_PERIODIC_EFFECTS = {
  clerigo_nv2_1: { type:'GUARDIANS_AURA', durationSec:6, intervalSec:1, pulses:6, radius:5 },
  clerigo_nv2_2: { type:'SPIRITUAL_WEAPON', durationSec:8, intervalSec:2, pulses:4, radius:8 },
  clerigo_nv2_3: { type:'SANCTUARY', durationSec:6, intervalSec:1, pulses:6, radius:6 },
} as const;

export function getClericPeriodicEffect(skillId: string) {
  return CLERIC_PERIODIC_EFFECTS[skillId as keyof typeof CLERIC_PERIODIC_EFFECTS];
}

/** Cumulative rounding preserves the captured total, including the final pulse. */
export function getClericPulsePower(total: number, pulse: number, count: number): number {
  return Math.round(total*pulse/count)-Math.round(total*(pulse-1)/count);
}
