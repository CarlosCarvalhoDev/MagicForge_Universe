import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {CharacterClass} from '@magicforge/shared';
import {simulateBossInvestment} from './BossInvestmentSimulation';
const destination=resolve(process.argv[2]??'../scratch/runtime/martial-loadouts.json');
const runs:ReturnType<typeof simulateBossInvestment>[]=[];
for(const classType of [CharacterClass.GUERREIRO,CharacterClass.BARBARO])for(const level of [10,25,50])for(const a of [1,2,3])for(const b of [1,2,3])for(const c of level>=25?[1,2,3]:[0])for(const d of level>=50?[1,2,3]:[0])for(const world of level>=50?[3,4]:level>=25?[2,3]:[1,2])for(const seed of [101,202]){
  const prefix=classType.toLowerCase(),skillSelections:Record<number,string>={1:`${prefix}_truque_${a}`,2:`${prefix}_nv1_${b}`};if(c)skillSelections[3]=`${prefix}_nv2_${c}`;if(d)skillSelections[4]=`${prefix}_nv3_${d}`;
  runs.push(simulateBossInvestment({classType,level,world,seed,investment:'none',goldBudget:2000,skillSelections}));
}
mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,JSON.stringify({generatedAt:new Date().toISOString(),assumptions:'936 fresh in-memory fixtures: Warrior/Barbarian, nine choices at level 10 in worlds 1/2; 27 at level 25 in worlds 2/3; 81 at level 50 in worlds 3/4; seeds 101/202. Default order and supplied starter gear/resources, no investment. Not farm-earned progression or a balance target.',runs},null,2));
for(const classType of [CharacterClass.GUERREIRO,CharacterClass.BARBARO]){const rows=runs.filter(r=>r.classType===classType);console.log(JSON.stringify({classType,scenarios:rows.length,victories:rows.filter(r=>r.outcome==='victory').length,deaths:rows.filter(r=>r.outcome==='death').length,timeouts:rows.filter(r=>r.outcome==='timeout').length,rejections:rows.reduce((n,r)=>n+r.combat.rejections,0),emptyCasts:rows.reduce((n,r)=>n+r.combat.ineffectiveCasts,0)}));}
console.log(destination);
