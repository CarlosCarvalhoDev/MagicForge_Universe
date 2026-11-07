import test from 'node:test';
import assert from 'node:assert/strict';
import {planWarriorCastFx} from '../src/renderer/PixelVfx.ts';

const hero={id:'hero',position:{x:0,y:0,z:0},currentHp:100};
const result=(targetId,effectiveDamage=0,effectiveHeal=0)=>({targetId,effectiveDamage,effectiveHeal,impactPosition:{x:17,y:0,z:0}});

test('Intervenção apresenta cura e onda somente quando confirmadas, sem ocultar dano pelo flag de cura',()=>{
  const event={skillId:'clerigo_nv3_2',casterId:'hero',affectedEntityIds:['hero','target'],isHeal:true,originPosition:hero.position,radius:8,targetResults:[result('hero',0,20),result('target',40)]};
  assert.deepEqual(planWarriorCastFx(event,[hero]).map(f=>f.kind),['heal','judgment']);
  assert.deepEqual(planWarriorCastFx({...event,targetResults:[result('hero'),result('target',40)]},[hero]).map(f=>f.kind),['judgment']);
  assert.deepEqual(planWarriorCastFx({...event,targetResults:[result('hero',0,20)]},[hero]).map(f=>f.kind),['heal']);
  assert.deepEqual(planWarriorCastFx({...event,targetResults:[result('hero')]},[hero]),[]);
});

test('Coluna apresenta área no ponto escolhido, mesmo se o alvo estava na borda e já desapareceu',()=>{
  const center={x:10,y:0,z:0};
  const fx=planWarriorCastFx({skillId:'clerigo_nv3_1',casterId:'hero',affectedEntityIds:['gone'],isHeal:false,targetPosition:center,radius:7.5,targetResults:[result('gone',50)]},[hero]);
  assert.equal(fx[0].kind,'judgment');assert.deepEqual(fx[0].position,center);assert.equal(fx[0].radius,7.5);
});

test('Raio Solar preserva impacto confirmado quando o alvo já desapareceu',()=>{
  const fx=planWarriorCastFx({skillId:'clerigo_nv3_3',casterId:'hero',affectedEntityIds:['gone'],isHeal:false,targetResults:[result('gone',50)]},[hero]);
  assert.equal(fx[0].kind,'impact');assert.deepEqual(fx[0].position,{x:17,y:0,z:0});
});
