import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateProgression } from './ProgressionSimulation';
import type { InventorySimulationPolicy } from './InventorySimulationPolicy';

const destination = resolve(process.argv[2] ?? '../scratch/core-classes/inventory-progression.json');
const seconds = Number(process.argv[3] ?? 1800);
const runs: ReturnType<typeof simulateProgression>[] = [];
for (const classType of [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.ARQUEIRO]) {
  for (const seed of [101, 202, 303]) for (const inventoryPolicy of ['retain', 'expand', 'managed'] as InventorySimulationPolicy[]) {
    const run = simulateProgression({ classType, seed, seconds, inventoryPolicy, investment: 'fusion',
      equipmentScoring: 'class-weighted', collectFusionMilestones: true });
    runs.push(run);
    console.log(`${classType}/${seed}/${inventoryPolicy}: slots=${run.maxInventorySlots} lv=${run.finalLevel} bosses=${run.bossVictories} full=${run.fullInventorySeconds}s sales=${run.manualSaleGold}`);
  }
}
const median = (values: number[]) => {
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted.length ? (sorted[Math.floor(sorted.length/2)]+sorted[Math.floor((sorted.length-1)/2)])/2 : null;
};
const summary = [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.ARQUEIRO].flatMap(classType =>
  (['retain','expand','managed'] as InventorySimulationPolicy[]).map(inventoryPolicy => {
    const rows = runs.filter(run => run.classType === classType && run.inventoryPolicy === inventoryPolicy);
    const first = (kind: string) => rows.flatMap(run => {
      const action = run.actions.find(action => action.kind === kind);
      return action ? [action.seconds] : [];
    });
    return { classType, inventoryPolicy, scenarios: rows.length,
      fusionObserved: first('fusion').length, medianFusionSeconds: median(first('fusion')),
      expansionObserved: first('expand').length, medianExpansionSeconds: median(first('expand')),
      medianFinalLevel: median(rows.map(run=>run.finalLevel)), medianSlots: median(rows.map(run=>run.maxInventorySlots)),
      medianFullBagSeconds: median(rows.map(run=>run.fullInventorySeconds)), medianBossVictories: median(rows.map(run=>run.bossVictories)),
      medianDeaths: median(rows.map(run=>run.deaths)), medianManualSaleGold: median(rows.map(run=>run.manualSaleGold)),
      medianSpentGold: median(rows.map(run=>run.spentGold)),
    };
  }));
const root=resolve(__dirname,'../..');
const files=['server/tools/benchmark-inventory-progression.ts','server/tools/InventorySimulationPolicy.ts','server/tools/ProgressionSimulation.ts',
  'server/src/game/World.ts','server/src/game/WorldManager.ts','server/src/database/DatabaseManager.ts','server/src/entities/Player.ts',
  'server/src/entities/Entity.ts','server/src/entities/Monster.ts','shared/src/inventory-expansion.ts','shared/src/equipment-advice.ts',
  'shared/src/equipment-fusion.ts','shared/src/items.ts','shared/src/skills.ts','shared/src/entities.ts'];
const sourceHashes=Object.fromEntries(files.map(file=>[file,createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')]));
mkdirSync(dirname(destination),{recursive:true});
writeFileSync(destination,JSON.stringify({generatedAt:new Date().toISOString(),sourceHashes,assumptions:{
  database:':memory:',seconds,seeds:[101,202,303],startingLevel:1,grants:false,investment:'First compatible weapon fusion only.',
  retain:'Keep drops; do not expand, equip new drops or sell.',
  expand:'Buy gold-only expansion at 80% occupancy if affordable; no new equip/sales.',
  managed:'Weighted equips exclude up to three reserved identical eligible fusion inputs. Expand at 80% when affordable. At 90%, sell unprotected/unrefined/socket-free common/uncommon gear until <=75%, preserving the reserved inputs. After first fusion stop reserving copies.',
  payments:'Production prices and no level/Reborn gate. Cash and seals are never granted or used by this benchmark; gold-only expansion stops at 35.',
  limitations:'Policies bundle user decisions, not an isolated effect of capacity. Sequential solo fixtures and normal starter kit. Equal seeds diverge with decisions. No offline claim or new automatic purchase/sale feature in the live game.',
},summary,runs},null,2)+'\n');
console.log(destination);
