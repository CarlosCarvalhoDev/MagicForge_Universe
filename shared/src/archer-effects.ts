/** Initial authored parameters; costs, cooldowns and unlock levels remain in skills.ts. */
export const ARCHER_EFFECTS = {
  poisonSec: 3, poisonPulses: 3, poisonCoefficient: .6,
  slowSec: 4, slow: .4, markSec: 8, markBonus: .25, rootSec: 2,
  stealthSec: 3, triplePulses: 3, tripleIntervalSec: .15,
  barragePulses: 10, barrageIntervalSec: .1,
  guardianSec: 12, guardianPulses: 12,
} as const;

export function getArcherVolley(skillId: string) {
  return skillId === 'arqueiro_nv1_2' ? { pulses: ARCHER_EFFECTS.triplePulses, intervalSec: ARCHER_EFFECTS.tripleIntervalSec }
    : skillId === 'arqueiro_nv3_2' ? { pulses: ARCHER_EFFECTS.barragePulses, intervalSec: ARCHER_EFFECTS.barrageIntervalSec } : undefined;
}
