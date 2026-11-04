import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { CharacterClass, getXpForNextLevel } from '@magicforge/shared';
import { simulateProgression } from './ProgressionSimulation';

const seconds = Number(process.argv[2] ?? 1800);
const destination = resolve(process.argv[3] ?? '../scratch/progression-audit/latest.json');
const classes = [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.ARQUEIRO, CharacterClass.CLERIGO];
const seeds = [101, 202, 303];
const results = classes.flatMap(classType => seeds.map(seed => {
  const result = simulateProgression({ classType, seconds, seed });
  console.log(`${classType} semente=${seed}: nível ${result.finalLevel}, fase ${result.finalStage}, ${result.kills} abates, ${result.deaths} mortes`);
  return result;
}));
const report = {
  generatedAt: new Date().toISOString(), nodeVersion: process.version,
  assumptions: {
    tickRate: 20, clientInputs: false, startingLevel: 1, equippedStarter: true,
    upgradesPurchased: false, portalEnteredAutomatically: true, database: ':memory:',
    model: 'Production WorldManager automation: movement, ordered skill cycle, loot and portals. No browser inputs.',
    offlineComparison: 'Offline uses final state; online rates average the whole evolving session. Not a matched-state efficiency ratio.',
  },
  xpCurve: Array.from({ length: 15 }, (_, index) => {
    const level = index + 1;
    const requirement = getXpForNextLevel(level);
    return { level, xpToNextLevel: requirement,
      ratioToPrevious: level > 1 ? Number((requirement / getXpForNextLevel(level - 1)).toFixed(3)) : null };
  }),
  results,
};
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
console.log(`Relatório: ${destination}`);
