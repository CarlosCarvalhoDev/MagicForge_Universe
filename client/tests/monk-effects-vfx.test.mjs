import test from 'node:test';
import assert from 'node:assert/strict';
import {planWarriorCastFx,planMageCometPulseFx} from '../src/renderer/PixelVfx.ts';
import {WarriorPresentation} from '../src/renderer/WarriorPresentation.ts';
const hero={id:'hero',position:{x:0,y:0,z:0},headingYaw:90,currentHp:100},point={x:2,y:0,z:0};
const base={casterId:'hero',affectedEntityIds:['hero'],isHeal:false,targetPosition:point};

test('Palma, Rajada, Passo e Domo não inventam impacto na aplicação',()=>{
  for(const skillId of ['monge_truque_1','monge_nv1_1','monge_nv1_2','monge_nv3_3'])assert.deepEqual(planWarriorCastFx({...base,skillId},[hero]),[]);
});
test('Socos apresentam somente pulsos autoritativos que causaram dano',()=>{
  for(const type of ['CHI_PALMS','FLURRY']){
    const status={type,areaCenter:point};
    assert.deepEqual(planMageCometPulseFx({event:'APPLIED',tickDamage:10,status}),[]);
    assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:0,status}),[]);
    assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:10,status}),[{kind:'impact',position:point}]);
  }
});
test('Lótus não apresenta cura quando não houve vida recuperada',()=>{
  const event={...base,skillId:'monge_nv1_3',isHeal:true,targetResults:[{targetId:'hero',impactPosition:point,effectiveDamage:0,effectiveHeal:0}]};
  assert.deepEqual(planWarriorCastFx(event,[hero]),[]);event.targetResults[0].effectiveHeal=1;assert.equal(planWarriorCastFx(event,[hero])[0].kind,'heal');
});
test('Sopro usa origem/cone de 5m e Ascensão usa centro/raio confirmados',()=>{
  const cone=planWarriorCastFx({...base,skillId:'monge_nv2_2',originPosition:hero.position,coneRange:5,coneAngleDeg:60},[hero])[0];
  assert.equal(cone.kind,'cone');assert.equal(cone.coneRange,5);assert.equal(cone.coneAngleDeg,60);assert.deepEqual(cone.position,hero.position);
  const dragon=planWarriorCastFx({...base,skillId:'monge_nv3_2',radius:8},[hero])[0];assert.deepEqual(dragon.position,point);assert.equal(dragon.radius,8);
});
test('Domo separa cura própria e dano confirmado sem repetir o impacto inicial',()=>{
  const status={type:'ZEN_DOME',areaCenter:point,radius:6,targetEntityId:'hero'};
  assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:0,tickHeal:0,status}),[]);
  const heal=planMageCometPulseFx({event:'TICK',tickDamage:0,tickHeal:5,status});assert.equal(heal.length,1);assert.equal(heal[0].kind,'heal');assert.equal(heal[0].followId,'hero');
  const both=planMageCometPulseFx({event:'TICK',tickDamage:10,tickHeal:5,status});assert.equal(both.length,2);assert.equal(both[0].radius,6);assert.deepEqual(both[0].position,point);
});
test('Sombras exibem os três resultados reais e status de corrida expira sem ressurgir',()=>{
  const hit={targetId:'enemy',impactPosition:point,effectiveDamage:1,effectiveHeal:0};
  assert.equal(planWarriorCastFx({...base,skillId:'monge_nv2_3',targetResults:[hit,hit,hit]},[hero]).length,3);
  const presentation=new WarriorPresentation(),status={statusId:'stride',type:'DRAGON_STRIDE',skillId:'monge_nv3_2',sourceEntityId:'hero',targetEntityId:'hero',durationSec:6,remainingSec:6,expiresAtTick:120,magnitude:1};
  presentation.transition({event:'APPLIED',serverTick:0,status},0);assert.equal(presentation.visible(1,[hero]).length,1);assert.equal(presentation.visible(6001,[hero]).length,0);
});
