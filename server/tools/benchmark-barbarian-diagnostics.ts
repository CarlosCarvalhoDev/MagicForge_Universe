import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateBossInvestment } from './BossInvestmentSimulation';

const destination = resolve(process.argv[2] ?? '../scratch/core-classes/barbarian-diagnostics.json');
const seeds = [101, 202, 303, 404, 505, 606, 707, 808];
const runs: Array<ReturnType<typeof simulateBossInvestment> & { scenario: string }> = [];
// All 27 builds and eight seeds. Only regen changes within each exact build/seed pair.
for (const a of [1, 2, 3]) for (const b of [1, 2, 3]) for (const c of [1, 2, 3]) {
  const skillSelections = { 1: `barbaro_truque_${a}`, 2: `barbaro_nv1_${b}`, 3: `barbaro_nv2_${c}` };
  for (const seed of seeds) for (const resourceRegenPerSec of [8, 10]) {
    runs.push({ scenario: resourceRegenPerSec === 8 ? 'production' : 'regen10-experiment', ...simulateBossInvestment({
      classType: CharacterClass.BARBARO, level: 25, world: 3, seed, investment: 'none', goldBudget: 2000,
      skillSelections, resourceRegenPerSec, collectDiagnostics: true,
    }) });
  }
  console.log(`build=${a}/${b}/${c} complete`);
}
// Separate order test: no coefficient/regen changes, both orders configured explicitly in the fixture.
for (const seed of seeds) for (const skillCastOrder of [[1, 2, 3, 4], [3, 1, 2, 4]]) {
  runs.push({ scenario: 'stone-order', ...simulateBossInvestment({
    classType: CharacterClass.BARBARO, level: 25, world: 3, seed, investment: 'none', goldBudget: 2000,
    skillSelections: { 1: 'barbaro_truque_1', 2: 'barbaro_nv1_1', 3: 'barbaro_nv2_2' },
    skillCastOrder, collectDiagnostics: true,
  }) });
}
for (const [b, c] of [[1, 1], [1, 2], [2, 1]]) for (const seed of seeds) {
  for (const investment of ['skill', 'weapon', 'fusion'] as const) {
    runs.push({ scenario: `investment-${investment}`, ...simulateBossInvestment({
      classType: CharacterClass.BARBARO, level: 25, world: 3, seed, investment, goldBudget: 2000,
      skillSelections: { 1: 'barbaro_truque_1', 2: `barbaro_nv1_${b}`, 3: `barbaro_nv2_${c}` },
      collectDiagnostics: true,
    }) });
  }
}
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? (sorted[Math.floor(sorted.length / 2)] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2 : null;
};
const groups = new Map<string, typeof runs>();
for (const run of runs) {
  const key = `${run.scenario}/${run.selectedSkills[2]}/${run.selectedSkills[3]}/${run.scenario === 'stone-order' ? run.skillCastOrder.join(',') : 'all-cantrips'}`;
  const rows = groups.get(key) ?? []; rows.push(run); groups.set(key, rows);
}
const summary = [...groups].map(([key, rows]) => ({ key, scenarios: rows.length,
  victories: rows.filter(row => row.outcome === 'victory').length,
  deaths: rows.filter(row => row.outcome === 'death').length,
  timeouts: rows.filter(row => row.outcome === 'timeout').length,
  medianBossHpRemainingPercent: median(rows.map(row => row.bossHpRemainingPercent!)),
  medianEnergyBlockedSeconds: median(rows.map(row => row.diagnostics!.anyReadySkillEnergyBlockedSeconds)),
  medianNoAffordableReadySkillSeconds: median(rows.map(row => row.diagnostics!.noAffordableReadySkillSeconds)),
  medianEnergySpent: median(rows.map(row => Object.values(row.diagnostics!.bySkill).reduce((sum, skill) => sum + skill.energySpent, 0))),
}));
const pairs = runs.filter(row => row.scenario === 'regen10-experiment').map(row => {
  const baseline = runs.find(other => other.scenario === 'production' && other.seed === row.seed &&
    [1, 2, 3].every(slot => other.selectedSkills[slot] === row.selectedSkills[slot]))!;
  return { seed: row.seed, selectedSkills: row.selectedSkills, baselineOutcome: baseline.outcome, outcome: row.outcome,
    gainedVictory: baseline.outcome !== 'victory' && row.outcome === 'victory',
    lostVictory: baseline.outcome === 'victory' && row.outcome !== 'victory',
    hpRemainingDelta: row.bossHpRemainingPercent! - baseline.bossHpRemainingPercent!,
  };
});
const investmentPairs = runs.filter(row => row.scenario.startsWith('investment-')).map(row => {
  const baseline = runs.find(other => other.scenario === 'production' && other.seed === row.seed &&
    [1, 2, 3].every(slot => other.selectedSkills[slot] === row.selectedSkills[slot]))!;
  return { seed: row.seed, selectedSkills: row.selectedSkills, investment: row.investment,
    baselineOutcome: baseline.outcome, outcome: row.outcome,
    gainedVictory: baseline.outcome !== 'victory' && row.outcome === 'victory',
    lostVictory: baseline.outcome === 'victory' && row.outcome !== 'victory',
    spentGold: row.spentGold, materialsUsed: row.materialsUsed,
  };
});
const sourceFiles = ['server/tools/BossInvestmentSimulation.ts', 'server/tools/benchmark-barbarian-diagnostics.ts',
  'server/src/game/World.ts', 'server/src/entities/Entity.ts', 'server/src/entities/Player.ts', 'server/src/entities/Monster.ts',
  'shared/src/skills.ts', 'shared/src/skill-targeting.ts', 'shared/src/entities.ts'];
const root = resolve(__dirname, '../..');
const sourceHashes = Object.fromEntries(sourceFiles.map(file => [file, createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')]));
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify({ generatedAt: new Date().toISOString(), sourceHashes,
  assumptions: {
    database: ':memory:', classType: 'BARBARO', level: 25, world: 3, boss: 'Ignis', tickRate: 20,
    supplied: 'Starter weapon, fixed level, equal supplied resources, no purchases, eight seeds, normal default potions.',
    experiments: 'Regen 8 vs 10 on identical build and seed; the override affects this Player fixture only. Independent stone-order test preserves regen 8 and changes only the explicitly configured order. Three cantrip-1 builds separately compare skill ranks, weapon refine and fusion under the same supplied budget; material/gold spending differs and is recorded.',
    telemetry: 'Read-only energy/readiness snapshots at start of each 50ms tick, actual successful cast costs via fixture-instance wrapper, confirmed direct/status events. Readiness samples are potential energy pressure, not server rejections or an exact decision trace. Blocked seconds overlap between skills; do not sum them as wall time.',
    limits: 'Solo starter-equipment fixtures, not earned progression or balance targets; combat RNG starts equal and diverges with decisions. No production coefficient/rotation/default was modified.',
  }, summary, pairs, investmentPairs, runs }, null, 2) + '\n');
console.log(destination);
