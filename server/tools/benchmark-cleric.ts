import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateBossInvestment } from './BossInvestmentSimulation';

const destination=resolve(process.argv[2]??'../scratch/runtime/cleric-loadouts.json');
function selectSkills(cantrip:number,firstCircle:number,secondCircle:number,ultimate:number):Record<number,string>{
  const selections:Record<number,string>={1:`clerigo_truque_${cantrip}`,2:`clerigo_nv1_${firstCircle}`};
  if(secondCircle)selections[3]=`clerigo_nv2_${secondCircle}`;
  if(ultimate)selections[4]=`clerigo_nv3_${ultimate}`;
  return selections;
}
const runs:ReturnType<typeof simulateBossInvestment>[]=[];
for(const level of [10,25,50])
  for(const cantrip of [1,2,3])
    for(const firstCircle of [1,2,3])
      for(const secondCircle of level>=25?[1,2,3]:[0])
        for(const ultimate of level===50?[1,2,3]:[0])
          for(const world of level===50?[3,4]:[1,2])
            for(const seed of [101,202])runs.push(simulateBossInvestment({classType:CharacterClass.CLERIGO,level,world,seed,investment:'none',goldBudget:2000,skillSelections:selectSkills(cantrip,firstCircle,secondCircle,ultimate)}));
mkdirSync(dirname(destination),{recursive:true});
writeFileSync(destination,JSON.stringify({generatedAt:new Date().toISOString(),assumptions:'468 fresh in-memory fixtures: nine choices at level 10 and 27 at level 25 in worlds 1/2; all 81 choices at level 50 in worlds 3/4; seeds 101/202. Default order and starter equipment, no investment; not farm-earned progression or a balance target. Different levels/worlds must not be compared as equal-difficulty fights.',runs},null,2));
console.log(JSON.stringify({scenarios:runs.length,rejections:runs.reduce((n,r)=>n+r.combat.rejections,0),emptyCasts:runs.reduce((n,r)=>n+r.combat.ineffectiveCasts,0),victories:runs.filter(r=>r.outcome==='victory').length,deaths:runs.filter(r=>r.outcome==='death').length,timeouts:runs.filter(r=>r.outcome==='timeout').length}));
console.log(destination);
