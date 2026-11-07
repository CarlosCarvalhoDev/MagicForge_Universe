import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateProgression } from './ProgressionSimulation';
import { simulateBossInvestment, type BossInvestment } from './BossInvestmentSimulation';

const seconds = Number(process.argv[2] ?? 1800);
const destination = resolve(process.argv[3] ?? '../scratch/economy-audit/latest.json');
const classes = [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.ARQUEIRO, CharacterClass.CLERIGO];
const seeds = [101, 202, 303];
const farm = classes.flatMap(classType => seeds.map(seed => {
  const result = simulateProgression({ classType, seed, seconds, autoSellEquipment: true });
  console.log(`${classType}/${seed}: ouro/min=${(result.lootGold * 60 / seconds).toFixed(1)}, pó/min=${((result.arcaneDustLoot ?? 0) * 60 / seconds).toFixed(1)}, 1ª melhoria=${result.firstSkillAffordableSeconds}s`);
  return result;
}));
const boss = classes.flatMap(classType => [8, 10].flatMap(level => [1, 2, 3].flatMap(world => seeds.flatMap(seed =>
  (['none', 'skill', 'weapon', 'sustain'] as BossInvestment[]).map(investment =>
    simulateBossInvestment({ classType, level, world, seed, investment }))))));
const report = {
  generatedAt: new Date().toISOString(), seconds,
  assumptions: {
    farm: 'Solo, level 1, starter weapon equipped, default potions, 20 slots, common/uncommon equipment auto-sale on, production automation, no purchases, memory SQLite.',
    phases: 'Counters attributed to the world/stage occupied during each simulation tick; small samples and pickup delays are not stable rates.',
    milestones: 'First time the untouched wallet can fund all ranks up to the target; not a replay with purchases.',
    bosses: 'Controlled fixtures at levels 8/10; same 1000 gold budget and supplied 20 dust/3 forge stones, default starting potions. Material costs are not equivalent. Fresh combat seed per paired scenario; actions can subsequently diverge.',
    sustain: 'Select an unlocked healing skill, prioritize its slot and buy its ranks within budget. Unavailable when no healing skill is unlocked. Measures build plus upgrades, not just one coefficient.',
    offline: 'Excluded from online farm rates; separate existing policy remains uncalibrated.',
  }, farm, boss,
};
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
console.log(`Relatório: ${destination}`);
