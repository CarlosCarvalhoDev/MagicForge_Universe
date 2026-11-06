import test from 'node:test';
import assert from 'node:assert/strict';
import {planWarriorCastFx} from '../src/renderer/PixelVfx.ts';
const hero={id:'hero',position:{x:0,y:0,z:0},headingYaw:90,currentHp:100};
test('Nevasca preserva centro e raio escolhidos após desaparecimento de um alvo',()=>{
  const center={x:10,y:0,z:0};const requests=planWarriorCastFx({skillId:'mago_nv2_1',casterId:'hero',affectedEntityIds:['gone'],isHeal:false,targetPosition:center,radius:5.5},[hero]);
  assert.equal(requests[0].kind,'whirlwind');assert.deepEqual(requests[0].position,center);assert.equal(requests[0].radius,5.5);
});
test('Relâmpago representa somente os impactos confirmados e preserva sua ordem',()=>{
  const results=[1,2,3,4].map(n=>({targetId:`target${n}`,effectiveDamage:20,effectiveHeal:0,impactPosition:{x:n,y:0,z:0}}));
  const requests=planWarriorCastFx({skillId:'mago_nv2_2',casterId:'hero',affectedEntityIds:results.map(r=>r.targetId),isHeal:false,targetResults:results},[hero]);
  assert.equal(requests.length,4);assert.deepEqual(requests.map(r=>r.delayMs),[0,80,160,240]);assert.deepEqual(requests.map(r=>r.position.x),[1,2,3,4]);
});
test('Haste é um efeito no conjurador, sem impactos de dano inventados',()=>{
  const requests=planWarriorCastFx({skillId:'mago_nv2_3',casterId:'hero',affectedEntityIds:['hero'],isHeal:false},[hero]);
  assert.equal(requests.length,1);assert.equal(requests[0].followId,'hero');assert.equal(requests[0].kind,'avatar');
});
