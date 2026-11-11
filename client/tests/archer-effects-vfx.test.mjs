import test from 'node:test';
import assert from 'node:assert/strict';
import { planWarriorCastFx, planMageCometPulseFx } from '../src/renderer/PixelVfx.ts';
import { WarriorPresentation } from '../src/renderer/WarriorPresentation.ts';
const hero = { id:'hero',position:{x:0,y:0,z:0},headingYaw:90,currentHp:100 };
const point = {x:4,y:0,z:0};
const base = { casterId:'hero',affectedEntityIds:['hero'],isHeal:false,targetPosition:point };

test('Marca, Manto e efeitos periódicos não inventam impacto inicial', () => {
  for (const skillId of ['arqueiro_nv1_1','arqueiro_nv1_2','arqueiro_nv2_3','arqueiro_nv3_2','arqueiro_nv3_3']) {
    assert.deepEqual(planWarriorCastFx({...base,skillId},[hero]),[]);
  }
});
test('Rajadas e veneno apresentam impacto somente no pulso de dano confirmado', () => {
  for (const type of ['ARROW_VOLLEY','STORM_BARRAGE','POISON']) {
    const status = {type,areaCenter:point};
    assert.deepEqual(planMageCometPulseFx({event:'APPLIED',tickDamage:20,status}),[]);
    assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:0,status}),[]);
    assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:20,status}),[{kind:'impact',position:point}]);
  }
});
test('Fênix, Chuva e Flecha em Linha usam centro e geometria autoritativos', () => {
  assert.equal(planWarriorCastFx({...base,skillId:'arqueiro_nv3_1',radius:8},[hero])[0].radius,8);
  assert.equal(planWarriorCastFx({...base,skillId:'arqueiro_nv2_1',radius:5.5},[hero])[0].radius,5.5);
  const line = planWarriorCastFx({...base,skillId:'arqueiro_nv2_2',originPosition:hero.position,lineLength:12,lineWidth:3},[hero])[0];
  assert.equal(line.kind,'line'); assert.equal(line.lineLength,12); assert.equal(line.lineWidth,3);
});
test('Guardião usa a área fixa e não apresenta dano em área vazia', () => {
  const status = {type:'ASTRAL_GUARDIAN',areaCenter:point,radius:6};
  assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:0,status}),[]);
  assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:20,status}),[{kind:'whirlwind',position:point,radius:6}]);
});
test('Veneno rejeita coordenadas inválidas e furtividade limpa pela transição do servidor', () => {
  assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:20,status:{type:'POISON',areaCenter:{x:NaN,y:0,z:0}}}),[]);
  const presentation = new WarriorPresentation();
  const status = {statusId:'cloak',type:'STEALTH',skillId:'arqueiro_nv2_3',sourceEntityId:'hero',targetEntityId:'hero',durationSec:3,remainingSec:3,expiresAtTick:60,magnitude:1};
  presentation.transition({event:'APPLIED',serverTick:0,status},0); assert.equal(presentation.visible(1,[hero]).length,1);
  presentation.transition({event:'BROKEN',serverTick:1,status},50); assert.equal(presentation.visible(51,[hero]).length,0);
});
