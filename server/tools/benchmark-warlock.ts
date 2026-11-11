import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {CharacterClass} from '@magicforge/shared';
import {simulateBossInvestment} from './BossInvestmentSimulation';

const destination=resolve(process.argv[2]??'../scratch/runtime/warlock-loadouts.json');
const sources=['src/game/World.ts','src/entities/Entity.ts','src/entities/Monster.ts','src/entities/Player.ts','tools/BossInvestmentSimulation.ts','tools/benchmark-warlock.ts','../shared/src/warlock-effects.ts','../shared/src/skills.ts','../shared/src/skill-targeting.ts'];
const sourceHashes=Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(readFileSync(resolve(p))).digest('hex')]));
const runs:ReturnType<typeof simulateBossInvestment>[]=[];
for(const level of [1,10,25,50])for(const a of [1,2,3])for(const b of level>=10?[1,2,3]:[0])for(const c of level>=25?[1,2,3]:[0])for(const d of level>=50?[1,2,3]:[0])for(const world of level>=50?[3,4]:level>=25?[2,3]:level>=10?[1,2]:[1])for(const seed of [101,202]){
  const skillSelections:Record<number,string>={1:`bruxo_truque_${a}`};if(b)skillSelections[2]=`bruxo_nv1_${b}`;if(c)skillSelections[3]=`bruxo_nv2_${c}`;if(d)skillSelections[4]=`bruxo_nv3_${d}`;
  runs.push(simulateBossInvestment({classType:CharacterClass.BRUXO,level,world,seed,investment:'none',goldBudget:2000,skillSelections}));
}
const summary=[1,10,25,50].map(level=>{const selected=runs.filter(r=>r.level===level);return {level,scenarios:selected.length,victories:selected.filter(r=>r.outcome==='victory').length,deaths:selected.filter(r=>r.outcome==='death').length,timeouts:selected.filter(r=>r.outcome==='timeout').length,rejections:selected.reduce((n,r)=>n+r.combat.rejections,0),emptyCasts:selected.reduce((n,r)=>n+r.combat.ineffectiveCasts,0)};});
mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,JSON.stringify({generatedAt:new Date().toISOString(),sourceHashes,assumptions:'474 solo in-memory fixed-level fixtures, two seeds: level 1/world 1, 10/worlds 1-2, 25/worlds 2-3, 50/worlds 3-4; all unlocked loadouts. Starter equipment, supplied gold/stocks, no purchases. Not farm-earned progression or final balance. Current production targeting, movement, buffs and periodic effects. Movement-only Misty Step casts are counted as useful when displacement is confirmed.',summary,runs},null,2)+'\n');
summary.forEach(row=>console.log(JSON.stringify(row)));console.log(destination);

