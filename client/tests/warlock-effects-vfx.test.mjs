import test from 'node:test';
import assert from 'node:assert/strict';
import {planWarriorCastFx,planMageCometPulseFx} from '../src/renderer/PixelVfx.ts';
const hero={id:'hero',position:{x:6,y:0,z:0},headingYaw:90,currentHp:100},origin={x:0,y:0,z:0},point={x:2,y:0,z:0};
const base={casterId:'hero',affectedEntityIds:['hero','enemy'],isHeal:false,targetPosition:point};
test('Hex, Fome e Demônio não inventam dano inicial; Agathys mostra escudo',()=>{
  for(const skillId of ['bruxo_nv1_1','bruxo_nv2_1','bruxo_nv3_2'])assert.deepEqual(planWarriorCastFx({...base,skillId},[hero]),[]);
  assert.equal(planWarriorCastFx({...base,skillId:'bruxo_nv1_2'},[hero])[0].kind,'shield');
});
test('Praga e áreas apresentam somente pulsos de dano confirmados',()=>{
  for(const type of ['DARK_PLAGUE','HADAR_HUNGER','DEMON_PRESENCE']){
    const status={type,areaCenter:point,radius:6};assert.deepEqual(planMageCometPulseFx({event:'APPLIED',tickDamage:10,status}),[]);assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:0,status}),[]);assert.equal(planMageCometPulseFx({event:'TICK',tickDamage:10,status}).length,1);
  }
});
test('Hex apresenta cura apenas quando efetiva e acompanha o autor',()=>{
  const status={type:'HEX_REGEN',areaCenter:origin,targetEntityId:'hero'};assert.deepEqual(planMageCometPulseFx({event:'TICK',tickHeal:0,status}),[]);const effect=planMageCometPulseFx({event:'TICK',tickHeal:2,status})[0];assert.equal(effect.kind,'heal');assert.equal(effect.followId,'hero');
});
test('Vampírico separa impacto de cura sem exibir recuperação inexistente',()=>{
  const hit={targetId:'enemy',impactPosition:point,effectiveDamage:10,effectiveHeal:0};const event={...base,skillId:'bruxo_nv2_2',isHeal:true,targetResults:[hit]};assert.deepEqual(planWarriorCastFx(event,[hero]).map(e=>e.kind),['impact']);event.targetResults.push({...hit,targetId:'hero',effectiveDamage:0,effectiveHeal:5});assert.deepEqual(planWarriorCastFx(event,[hero]).map(e=>e.kind),['impact','heal']);
});
test('Brumas explode na origem, mesmo que o personagem já esteja no destino',()=>{
  const effect=planWarriorCastFx({...base,skillId:'bruxo_nv2_3',originPosition:origin,targetPosition:hero.position,radius:3.5},[hero])[0];assert.deepEqual(effect.position,origin);assert.equal(effect.radius,3.5);
});
test('Singularidade e Agonia usam o centro confirmado e rejeitam pulsos inválidos',()=>{
  for(const skillId of ['bruxo_nv3_1','bruxo_nv3_3'])assert.deepEqual(planWarriorCastFx({...base,skillId,radius:8},[hero])[0].position,point);
  assert.deepEqual(planMageCometPulseFx({event:'TICK',tickDamage:10,status:{type:'DARK_PLAGUE',areaCenter:{x:NaN,y:0,z:0}}}),[]);
});
