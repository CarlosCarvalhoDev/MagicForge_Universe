import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateBossInvestment, type BossInvestment } from './BossInvestmentSimulation';

const destination=resolve(process.argv[2]??'../scratch/combat-loop/latest.json');
const sourceSha256=Object.fromEntries(['server/src/game/World.ts','server/src/entities/Player.ts','server/src/entities/Entity.ts','server/src/database/DatabaseManager.ts','shared/src/skills.ts','shared/src/entities.ts','shared/src/skill-targeting.ts'].filter(file=>existsSync(resolve(__dirname,'../../',file))).map(file=>[file,createHash('sha256').update(readFileSync(resolve(__dirname,'../../',file))).digest('hex')]));
const runs=Object.values(CharacterClass).flatMap(classType=>[5,10,25].flatMap(level=>[1,2].flatMap(world=>[101,202].flatMap(seed=>
  (['none','skill','weapon','fusion','sustain'] as BossInvestment[]).map(investment=>simulateBossInvestment({classType,level,world,seed,investment,goldBudget:2000}))))));
mkdirSync(dirname(destination),{recursive:true});
writeFileSync(destination,JSON.stringify({generatedAt:new Date().toISOString(),sourceSha256,assumptions:'Controlled fresh fixtures; levels 5/10/25, worlds 1/2, seeds 101/202, equal 2000 gold and supplied stocks for every alternative. No real account, farm or offline income. Materials spent differ. RNG reset before each fight, action streams may subsequently diverge.',runs},null,2));
for(const cls of Object.values(CharacterClass)){
  const fights=runs.filter(run=>run.classType===cls);
  console.log(JSON.stringify({classType:cls,victories:fights.filter(r=>r.outcome==='victory').length,deaths:fights.filter(r=>r.outcome==='death').length,timeouts:fights.filter(r=>r.outcome==='timeout').length,unavailable:fights.filter(r=>r.outcome==='unavailable').length,rejections:fights.reduce((n,r)=>n+r.combat.rejections,0),emptyCasts:fights.reduce((n,r)=>n+r.combat.ineffectiveCasts,0)}));
}
console.log(`Relatório: ${destination}`);
