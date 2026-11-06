import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateProgression } from './ProgressionSimulation';

const seconds=Number(process.argv[2] ?? 1800);
const destination=resolve(process.argv[3] ?? '../scratch/fusion-benchmark/latest.json');
const runs=[CharacterClass.GUERREIRO,CharacterClass.BARBARO,CharacterClass.ARQUEIRO,CharacterClass.CLERIGO].flatMap(classType=>[101,202].map(seed=>simulateProgression({classType,seed,seconds,autoSellEquipment:false,collectFusionMilestones:true})));
const report={generatedAt:new Date().toISOString(),seconds,assumptions:'Solo, fresh heroes, memory SQLite, starter equipped, 20 bag slots, equipment auto-sale off, no purchases/recycling/fusion execution, no offline rewards. Measures first availability, not repeated purchases or overall class balance.',runs};
mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
for(const run of runs)console.log(JSON.stringify({classType:run.classType,seed:run.seed,level:run.finalLevel,gold:run.goldBalance,fusionAvailability:run.fusionAvailability}));
console.log(`Relatório: ${destination}`);
