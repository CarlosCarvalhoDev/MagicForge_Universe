import test from 'node:test';
import assert from 'node:assert/strict';
import {planWarriorCastFx,PixelVfxQueue} from '../src/renderer/PixelVfx.ts';
const hero={id:'hero',position:{x:0,y:0,z:0},headingYaw:90,currentHp:100};
const result={targetId:'gone',impactPosition:{x:3,y:0,z:0},effectiveDamage:10,effectiveHeal:0};

test('Cone usa origem e direção confirmadas, sem deslocar a área até o alvo',()=>{
  const request=planWarriorCastFx({skillId:'mago_nv1_3',casterId:'hero',affectedEntityIds:['gone'],isHeal:false,originPosition:hero.position,targetPosition:result.impactPosition,headingYaw:90,coneRange:6,coneAngleDeg:60,targetResults:[result]},[hero])[0];
  assert.equal(request.kind,'cone');assert.deepEqual(request.position,hero.position);assert.equal(request.yaw,90);assert.equal(request.coneRange,6);assert.equal(request.coneAngleDeg,60);
  const queue=new PixelVfxQueue();queue.spawn(request,100);assert.equal(queue.sample(200,[hero]).length,1);assert.equal(queue.sample(800,[hero]).length,0);
});

test('Mísseis representa impactos efetivos e preserva posição após despawn',()=>{
  const event={skillId:'mago_nv1_1',casterId:'hero',affectedEntityIds:['gone'],isHeal:false,targetResults:[result,result,result]};
  assert.equal(planWarriorCastFx(event,[hero]).length,3);
  const queue=new PixelVfxQueue();for(const request of planWarriorCastFx(event,[hero]))queue.spawn(request,0);
  assert.equal(queue.sample(0,[hero]).length,1);assert.equal(queue.sample(100,[hero]).length,2);assert.equal(queue.sample(200,[hero]).length,3);assert.equal(queue.sample(1000,[hero]).length,0);
  assert.equal(planWarriorCastFx({...event,targetResults:[result]},[hero]).length,1);
});

test('Escudo nasce no conjurador e não cria um impacto em monstro',()=>{
  const requests=planWarriorCastFx({skillId:'mago_nv1_2',casterId:'hero',affectedEntityIds:['hero'],isHeal:false},[hero]);
  assert.equal(requests[0].kind,'shield');assert.equal(requests[0].followId,'hero');
});
