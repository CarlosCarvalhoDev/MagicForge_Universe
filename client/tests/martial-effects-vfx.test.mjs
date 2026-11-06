import test from 'node:test';
import assert from 'node:assert/strict';
import {planWarriorCastFx} from '../src/renderer/PixelVfx.ts';
import {WarriorPresentation} from '../src/renderer/WarriorPresentation.ts';
const hero={id:'hero',position:{x:0,y:0,z:0},headingYaw:90,currentHp:100};
const hit={targetId:'enemy',impactPosition:{x:1,y:0,z:0},effectiveDamage:10,effectiveHeal:0};
test('Pisotão não apresenta atordoamento e Carga usa o controle realmente aplicado',()=>{
  const base={casterId:'hero',affectedEntityIds:['enemy'],isHeal:false,targetResults:[hit]};
  assert.notEqual(planWarriorCastFx({...base,skillId:'barbaro_truque_2'},[hero])[0].variant,'stun');
  assert.equal(planWarriorCastFx({...base,skillId:'barbaro_nv1_3'},[hero])[0].variant,'stun');
});
test('Mordida apresenta cura somente quando o servidor confirma recuperação efetiva',()=>{
  const base={skillId:'barbaro_truque_3',casterId:'hero',affectedEntityIds:['enemy','hero'],isHeal:false,targetResults:[hit]};
  assert.deepEqual(planWarriorCastFx(base,[hero]).map(f=>f.kind),['slash']);
  assert.deepEqual(planWarriorCastFx({...base,targetResults:[hit,{...hit,targetId:'hero',effectiveDamage:0,effectiveHeal:2}]},[hero]).map(f=>f.kind),['slash','heal']);
});
test('Pele apresenta proteção com vida cheia sem inventar cura',()=>{
  const requests=planWarriorCastFx({skillId:'barbaro_nv2_2',casterId:'hero',affectedEntityIds:['hero'],isHeal:true,targetResults:[{...hit,targetId:'hero',effectiveDamage:0,effectiveHeal:0}]},[hero]);
  assert.deepEqual(requests.map(f=>f.kind),['shield']);
});
test('Janela de energia livre expira com o status autoritativo e limpa com morte',()=>{
  const presentation=new WarriorPresentation(),status={statusId:'free',type:'UNBRIDLED_RAGE',skillId:'barbaro_nv3_1',sourceEntityId:'hero',targetEntityId:'hero',durationSec:6,remainingSec:6,expiresAtTick:120,magnitude:1};
  presentation.transition({event:'APPLIED',serverTick:0,status},0);assert.equal(presentation.visible(1,[hero])[0].type,'UNBRIDLED_RAGE');assert.equal(presentation.visible(6001,[hero]).length,0);
  presentation.clear();presentation.transition({event:'APPLIED',serverTick:0,status},0);assert.equal(presentation.visible(1,[{...hero,currentHp:0}]).length,0);
});
