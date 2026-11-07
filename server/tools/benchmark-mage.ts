import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {CharacterClass} from '@magicforge/shared';
import {simulateBossInvestment} from './BossInvestmentSimulation';
const destination=resolve(process.argv[2]??'../scratch/runtime/mage-loadouts.json');
const runs:ReturnType<typeof simulateBossInvestment>[]=[];
for(const level of [5,10,25,50])for(const cantrip of [1,2,3])for(const firstCircle of level>=10?[1,2,3]:[0])for(const secondCircle of level>=25?[1,2,3]:[0])for(const ultimate of level>=50?[1,2,3]:[0])for(const world of level>=50?[3,4]:level>=25?[2,3]:[1,2])for(const seed of [101,202]){
  const skillSelections:Record<number,string>={1:`mago_truque_${cantrip}`};if(firstCircle)skillSelections[2]=`mago_nv1_${firstCircle}`;
  if(secondCircle)skillSelections[3]=`mago_nv2_${secondCircle}`;
  if(ultimate)skillSelections[4]=`mago_nv3_${ultimate}`;
  runs.push(simulateBossInvestment({classType:CharacterClass.MAGO,level,world,seed,investment:'none',goldBudget:2000,skillSelections}));
}
mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,JSON.stringify({generatedAt:new Date().toISOString(),assumptions:'480 fresh in-memory fixtures: three choices at level 5 and nine at level 10 in worlds 1/2; 27 choices at level 25 in worlds 2/3; all 81 choices at level 50 in worlds 3/4; seeds 101/202. Default rotation and starter gear, no investment; not farm-earned progression or proof of class balance. Different levels/worlds are not equal-difficulty pairs.',runs},null,2));
console.log(JSON.stringify({scenarios:runs.length,victories:runs.filter(r=>r.outcome==='victory').length,deaths:runs.filter(r=>r.outcome==='death').length,timeouts:runs.filter(r=>r.outcome==='timeout').length,rejections:runs.reduce((n,r)=>n+r.combat.rejections,0),emptyCasts:runs.reduce((n,r)=>n+r.combat.ineffectiveCasts,0)}));console.log(destination);
