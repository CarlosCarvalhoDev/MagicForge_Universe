import test from 'node:test';
import assert from 'node:assert/strict';
import {planWarriorCastFx,planMageCometPulseFx} from '../src/renderer/PixelVfx.ts';
const hero={id:'hero',position:{x:0,y:0,z:0},headingYaw:90,currentHp:100},center={x:10,y:0,z:0};
test('Bola de Fogo e Estase apresentam área no ponto confirmado',()=>{
  for(const skillId of ['mago_nv3_1','mago_nv3_3']){
    const requests=planWarriorCastFx({skillId,casterId:'hero',affectedEntityIds:['gone'],isHeal:false,targetPosition:center,radius:8},[hero]);
    assert.equal(requests.length,2);assert.deepEqual(requests[0].position,center);assert.equal(requests[1].kind,'whirlwind');
  }
});
test('Chuva não inventa impacto na conjuração; efeitos chegam nos pulsos autoritativos',()=>{
  assert.deepEqual(planWarriorCastFx({skillId:'mago_nv3_2',casterId:'hero',affectedEntityIds:['hero'],isHeal:false,targetPosition:center},[hero]),[]);
  const status={type:'COMET_RAIN',areaCenter:center,radius:6.5};
  assert.deepEqual(planMageCometPulseFx({event:'APPLIED',status}),[]);assert.deepEqual(planMageCometPulseFx({event:'EXPIRED',status}),[]);
  const effects=planMageCometPulseFx({event:'TICK',status});assert.equal(effects.length,2);assert.deepEqual(effects[0].position,center);assert.equal(effects[1].radius,6.5);
});
test('Pulso sem centro válido ou de outro efeito não gera Cometas',()=>{
  assert.deepEqual(planMageCometPulseFx({event:'TICK',status:{type:'COMET_RAIN'}}),[]);
  assert.deepEqual(planMageCometPulseFx({event:'TICK',status:{type:'BURN',areaCenter:center}}),[]);
  assert.deepEqual(planMageCometPulseFx({event:'TICK',status:{type:'COMET_RAIN',areaCenter:{x:NaN,y:0,z:0}}}),[]);
});
