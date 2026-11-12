import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateProgression, type ProgressionInvestment } from './ProgressionSimulation';
import { simulateBossInvestment, type BossInvestment } from './BossInvestmentSimulation';

const mode = process.argv[2] ?? 'farm';
if (!['farm', 'profiles', 'boss', 'choices'].includes(mode)) throw new Error('Mode: farm, profiles, boss or choices.');
const destination = resolve(process.argv[3] ?? `../scratch/core-classes/${mode}.json`);
const seconds = Number(process.argv[4] ?? 1800);
const classes = [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.ARQUEIRO];
const levels = [1, 10, 25, 50];
const worlds = (level: number) => level >= 50 ? [3, 4] : level >= 25 ? [2, 3] : level >= 10 ? [1, 2] : [1];
const root = resolve(__dirname, '../..');
const sourceFiles = [
  'server/tools/benchmark-core-classes.ts', 'server/tools/ProgressionSimulation.ts', 'server/tools/BossInvestmentSimulation.ts',
  'server/src/game/World.ts', 'server/src/game/WorldManager.ts', 'server/src/game/OfflineRewards.ts',
  'server/src/entities/Player.ts', 'server/src/entities/Entity.ts', 'server/src/entities/Monster.ts',
  'server/src/database/DatabaseManager.ts', 'shared/src/skills.ts', 'shared/src/entities.ts',
  'shared/src/items.ts', 'shared/src/equipment-advice.ts', 'shared/src/equipment-fusion.ts',
  'shared/src/skill-progression.ts', 'shared/src/skill-targeting.ts', 'shared/src/archer-effects.ts',
];
const sourceHashes = Object.fromEntries(sourceFiles.map(file => [file,
  createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')]));
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return (sorted[middle] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2;
};
const write = (report: object) => {
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify({ generatedAt: new Date().toISOString(), nodeVersion: process.version, mode, sourceHashes, ...report }, null, 2) + '\n');
  console.log(destination);
};

if (mode === 'profiles') {
  const runs: ReturnType<typeof simulateProgression>[] = [];
  for (const classType of classes) for (const startingLevel of levels) for (const seed of [101, 202, 303]) {
    const startingWorld = startingLevel >= 50 ? 3 : startingLevel >= 25 ? 2 : 1;
    const run = simulateProgression({ classType, seed, seconds, startingLevel, startingWorld, investment: 'none' });
    runs.push(run);
    console.log(`profile/${classType}/lv${startingLevel}/${seed}: finalLv=${run.finalLevel} kills=${run.kills} deaths=${run.deaths}`);
  }
  const summary = classes.flatMap(classType => levels.map(startingLevel => {
    const rows = runs.filter(run => run.classType === classType && run.startingLevel === startingLevel);
    return { classType, startingLevel, startingWorld: rows[0].startingWorld,
      medianFinalLevel: median(rows.map(run => run.finalLevel)),
      medianGoldPerMinute: median(rows.map(run => run.lootGold * 60 / seconds)),
      medianDustPerMinute: median(rows.map(run => run.arcaneDustLoot * 60 / seconds)),
      medianDeaths: median(rows.map(run => run.deaths)), medianBossVictories: median(rows.map(run => run.bossVictories)),
      medianFullBagSeconds: median(rows.map(run => run.fullInventorySeconds)),
    };
  }));
  write({ assumptions: {
    database: ':memory:', durationSeconds: seconds, tickRate: 20, seeds: [101, 202, 303],
    model: 'Supplied starting levels 1/10/25/50 and worlds 1/1/2/3, normal starter equipment/resources, no purchases. Production XP, level-ups, stage progression and automatic portals remain enabled.',
    limitations: 'Profiling snapshots, not proof of time required to earn starting levels/worlds. Rates average each evolving session, not a frozen level/world. Final levels and per-phase counters are included. No expansion/sales/recycling.',
  }, summary, runs });
} else if (mode === 'farm') {
  const runs: ReturnType<typeof simulateProgression>[] = [];
  for (const classType of classes) for (const seed of [101, 202, 303]) {
    for (const investment of ['none', 'skill', 'equipment', 'fusion'] as ProgressionInvestment[]) {
      const run = simulateProgression({ classType, seed, seconds, investment, equipmentScoring: 'class-weighted', collectFusionMilestones: true });
      runs.push(run);
      console.log(`${classType}/${seed}/${investment}: lv=${run.finalLevel} world=${run.finalWorld} stage=${run.finalStage} wins=${run.bossVictories} deaths=${run.deaths}`);
    }
  }
  const summary = classes.flatMap(classType => (['none', 'skill', 'equipment', 'fusion'] as ProgressionInvestment[]).map(investment => {
    const rows = runs.filter(run => run.classType === classType && run.investment === investment);
    const observed = (key: 'firstSkillAffordableSeconds' | 'firstRefineAffordableSeconds' | 'firstBossSeconds') => {
      const values = rows.map(run => run[key]).filter((value): value is number => value !== null);
      return { observed: values.length, total: rows.length, medianSeconds: median(values) };
    };
    return { classType, investment, scenarios: rows.length,
      medianLevel: median(rows.map(run => run.finalLevel)),
      medianGoldPerMinute: median(rows.map(run => (run.lootGold + run.autoSaleGold) * 60 / seconds)),
      medianDustPerMinute: median(rows.map(run => run.arcaneDustLoot * 60 / seconds)),
      medianKills: median(rows.map(run => run.kills)), medianDeaths: median(rows.map(run => run.deaths)),
      medianBossVictories: median(rows.map(run => run.bossVictories)),
      medianSpentGold: median(rows.map(run => run.spentGold)),
      medianFullBagSeconds: median(rows.map(run => run.fullInventorySeconds)),
      firstSkill: observed('firstSkillAffordableSeconds'), firstRefine: observed('firstRefineAffordableSeconds'), firstBoss: observed('firstBossSeconds'),
      firstPurchaseSeconds: median(rows.flatMap(run => run.actions.filter(action => action.goldSpent > 0).slice(0, 1).map(action => action.seconds))),
    };
  }));
  write({ assumptions: {
    database: ':memory:', durationSeconds: seconds, tickRate: 20, startingLevel: 1,
    equipmentScoring: 'Production auto-equip button; class-weighted, may sacrifice stats. Refine to +2 only.',
    resources: 'Normal starter kit; all subsequent purchases use actual earned drops/gold. No grants, no offline claims, no sales, no expansion, no recycling.',
    policies: 'none saves; skill buys slot 1 ranks; equipment equips weighted upgrades and refines weapon; fusion reserves for first compatible weapon fusion.',
    limitations: 'Three seeds, solo default loadout, evolving levels/worlds. Not fixed-level farm at 10/25/50. Seeds match at start but subsequent actions change RNG use. Currency affordability is not necessarily an optimal purchase.',
  }, summary, runs });
} else {
  const runs: ReturnType<typeof simulateBossInvestment>[] = [];
  for (const classType of classes) for (const level of levels) {
    const before = runs.length;
    if (mode === 'choices') {
      for (const a of [1, 2, 3]) for (const b of level >= 10 ? [1, 2, 3] : [0])
        for (const c of level >= 25 ? [1, 2, 3] : [0]) for (const d of level >= 50 ? [1, 2, 3] : [0]) {
          const prefix = classType.toLowerCase(), skillSelections: Record<number, string> = { 1: `${prefix}_truque_${a}` };
          if (b) skillSelections[2] = `${prefix}_nv1_${b}`;
          if (c) skillSelections[3] = `${prefix}_nv2_${c}`;
          if (d) skillSelections[4] = `${prefix}_nv3_${d}`;
          for (const world of worlds(level)) for (const seed of [101, 202]) {
            runs.push(simulateBossInvestment({ classType, level, world, seed, investment: 'none', goldBudget: 2000, skillSelections }));
          }
        }
    } else {
      for (const world of worlds(level)) for (const seed of [101, 202]) {
        for (const investment of ['none', 'skill', 'weapon', 'sustain'] as BossInvestment[]) {
          runs.push(simulateBossInvestment({ classType, level, world, seed, investment, goldBudget: 2000 }));
        }
      }
    }
    console.log(`${mode}/${classType}/lv${level}: ${runs.length - before} scenarios`);
  }
  const summary = classes.flatMap(classType => levels.flatMap(level =>
    (mode === 'choices' ? ['none'] : ['none', 'skill', 'weapon', 'sustain']).map(investment => {
      const rows = runs.filter(run => run.classType === classType && run.level === level && run.investment === investment);
      return { classType, level, investment, scenarios: rows.length,
        victories: rows.filter(run => run.outcome === 'victory').length,
        deaths: rows.filter(run => run.outcome === 'death').length,
        timeouts: rows.filter(run => run.outcome === 'timeout').length,
        unavailable: rows.filter(run => run.outcome === 'unavailable').length,
        medianVictorySeconds: median(rows.filter(run => run.outcome === 'victory').map(run => run.seconds)),
        medianBossHpRemainingPercent: median(rows.flatMap(run => run.bossHpRemainingPercent === null ? [] : [run.bossHpRemainingPercent])),
        rejections: rows.reduce((sum, run) => sum + run.combat.rejections, 0),
        emptyCasts: rows.reduce((sum, run) => sum + run.combat.ineffectiveCasts, 0),
      };
    })));
  const paired = mode === 'boss' ? runs.filter(run => run.investment !== 'none').map(run => {
    const baseline = runs.find(other => other.classType === run.classType && other.level === run.level && other.world === run.world && other.seed === run.seed && other.investment === 'none')!;
    return { classType: run.classType, level: run.level, world: run.world, seed: run.seed, investment: run.investment,
      baselineOutcome: baseline.outcome, outcome: run.outcome,
      gainedVictory: baseline.outcome !== 'victory' && run.outcome === 'victory',
      lostVictory: baseline.outcome === 'victory' && run.outcome !== 'victory' && run.outcome !== 'unavailable',
      spentGold: run.spentGold, materialsUsed: run.materialsUsed,
      victorySecondsSaved: baseline.outcome === 'victory' && run.outcome === 'victory' ? baseline.seconds - run.seconds : null,
    };
  }) : [];
  write({ assumptions: {
    database: ':memory:', tickRate: 20, fightLimitSeconds: 60, seeds: [101, 202],
    model: 'Production combat/automation, fixed level, starter weapon, supplied identical 2000 gold and materials. Not earned-farm progression.',
    sustain: 'Changes to first unlocked healing skill, or Barbarian life-draining Bite when no pure heal is unlocked, prioritizes it and buys ranks; unavailable if none. Build and spending combined, not pure coefficient test.',
    comparison: 'Group summaries combine two worlds above level 1; compare exact class/level/world/seed in raw runs. Paired combat RNG is reset before combat but diverges with actions. Default skill build for investments; all unlocked choices only in choices mode.',
  }, summary, paired, runs });
}
