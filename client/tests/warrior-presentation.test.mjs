import test from 'node:test';
import assert from 'node:assert/strict';
import { WarriorPresentation, combatTriggersAttack, SkillRejectionEchoFilter } from '../src/renderer/WarriorPresentation.ts';
import { planWarriorCastFx } from '../src/renderer/PixelVfx.ts';
const entity={id:'hero',position:{x:0,y:0,z:0},headingYaw:90,currentHp:100};
const status={statusId:'shield-1',type:'SHIELD',skillId:'guerreiro_nv2_2',sourceEntityId:'hero',targetEntityId:'hero',durationSec:6,remainingSec:6,expiresAtTick:220,magnitude:.3,remainingAbsorption:30,maxAbsorption:30};

test('structured rejection hides only its matching short-lived legacy echo',()=>{
  const f=new SkillRejectionEchoFilter(); f.record('Sem alvo',0);
  assert.equal(f.suppress('Outro','Sem alvo',1),false); assert.equal(f.suppress('Grimório','Outro erro',2),false);
  assert.equal(f.suppress('Grimório','Sem alvo',3),true); assert.equal(f.suppress('Grimório','Sem alvo',4),false);
  f.record('Sem alvo',10); assert.equal(f.suppress('Grimório','Sem alvo',2011),false);
});

test('only basic attacks or legacy events trigger the source attack animation',()=>{
  assert.equal(combatTriggersAttack('BASIC_ATTACK'),true); assert.equal(combatTriggersAttack(),true);
  for(const source of ['STATUS_TICK','REFLECTION','SKILL']) assert.equal(combatTriggersAttack(source),false);
});

test('cast IDs deduplicate all presentation effects and session reset allows a fresh session',()=>{
  const p=new WarriorPresentation(); assert.equal(p.acceptCast({castId:'a'},0),true); assert.equal(p.acceptCast({castId:'a'},1),false);
  p.clear(); assert.equal(p.acceptCast({castId:'a'},2),true); assert.equal(p.acceptCast({},3),true);
});
test('shield follows authoritative refresh and removal; out-of-order apply cannot resurrect it',()=>{
  const p=new WarriorPresentation();
  assert.equal(p.transition({event:'APPLIED',serverTick:100,status},0),true);
  assert.equal(p.visible(100,[entity])[0].remainingAbsorption,30);
  p.transition({event:'REFRESHED',serverTick:101,status:{...status,remainingAbsorption:10}},100);
  assert.equal(p.visible(150,[entity])[0].remainingAbsorption,10);
  assert.equal(p.transition({event:'BROKEN',serverTick:102,status},200),true);
  assert.equal(p.transition({event:'APPLIED',serverTick:101,status},250),false);
  assert.equal(p.visible(300,[entity]).length,0);
});
test('same-tick terminal event wins over duplicate cast status; visual timeout is bounded',()=>{
  const p=new WarriorPresentation(); p.transition({event:'APPLIED',serverTick:100,status},0);
  p.transition({event:'EXPIRED',serverTick:100,status},10);
  assert.equal(p.transition({event:'APPLIED',serverTick:100,status},20),false);
  p.clear(); p.transition({event:'APPLIED',serverTick:100,status},0);
  assert.equal(p.visible(5999,[entity]).length,1); assert.equal(p.visible(6000,[entity]).length,0);
});
test('death/despawn clear visible statuses and pending-before-spawn survives briefly',()=>{
  const p=new WarriorPresentation(); p.transition({event:'APPLIED',serverTick:100,status},0);
  assert.equal(p.visible(1,[]).length,0); assert.equal(p.visible(2,[entity]).length,1);
  assert.equal(p.visible(3,[]).length,0); assert.equal(p.visible(4,[entity]).length,0);
  p.clear(); p.transition({event:'APPLIED',serverTick:100,status},0); assert.equal(p.visible(2,[{...entity,currentHp:0}]).length,0);
});
test('resolved impact survives a target despawn and LINE uses origin/direction/dimensions',()=>{
  const base={skillId:'guerreiro_truque_1',casterId:'hero',affectedEntityIds:['gone'],isHeal:false,targetResults:[{targetId:'gone',impactPosition:{x:4,y:0,z:2},effectiveDamage:15,effectiveHeal:0}]};
  assert.deepEqual(planWarriorCastFx(base,[entity])[0].position,{x:4,y:0,z:2});
  const line=planWarriorCastFx({...base,skillId:'guerreiro_nv2_3',geometry:'LINE',originPosition:entity.position,headingYaw:90,lineLength:4.5,lineWidth:3},[entity])[0];
  assert.equal(line.kind,'line'); assert.equal(line.yaw,90); assert.equal(line.lineLength,4.5); assert.deepEqual(line.position,entity.position);
});
