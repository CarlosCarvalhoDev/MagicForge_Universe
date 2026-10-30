import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PixelVfxQueue, planWarriorCastFx, FX_SHEETS } from '../src/renderer/PixelVfx.ts';
const pos = (x=0,z=0) => ({x,y:0,z});
const hero={id:'hero',position:pos(8,8),headingYaw:90,currentHp:100};
const target={id:'target',position:pos(0,0),headingYaw:0,currentHp:30};
const cast=(skillId,extra={})=>({skillId,casterId:'hero',affectedEntityIds:['target'],isHeal:false,...extra});

test('VFX accepts the real world origin and does not use zero as missing-position sentinel',()=>{
  const effects=planWarriorCastFx(cast('guerreiro_truque_1',{targetPosition:pos()}),[hero,target]);
  assert.equal(effects[0].kind,'slash'); assert.deepEqual(effects[0].position,pos());
});
test('unknown, empty/rejected and persistent buff casts do not fabricate success effects',()=>{
  assert.deepEqual(planWarriorCastFx(cast('unknown'),[hero,target]),[]);
  assert.deepEqual(planWarriorCastFx(cast('guerreiro_truque_1',{affectedEntityIds:[]}),[hero,target]),[]);
  assert.deepEqual(planWarriorCastFx(cast('guerreiro_nv2_2'),[hero,target]),[]);
});
test('heal follows the confirmed caster only; AoE uses resolved center',()=>{
  const heal=planWarriorCastFx(cast('guerreiro_nv1_1',{isHeal:true,affectedEntityIds:['hero']}),[hero,target]);
  assert.equal(heal[0].followId,'hero');
  assert.deepEqual(planWarriorCastFx(cast('guerreiro_nv1_1',{isHeal:true}),[hero,target]),[]);
  const area=planWarriorCastFx(cast('guerreiro_nv2_1',{targetPosition:pos(-2,3)}),[hero,target],5);
  assert.deepEqual(area[0].position,pos(-2,3)); assert.equal(area[0].radius,5);
});
test('queue expires at the clip end, clears and caps event floods',()=>{
  const q=new PixelVfxQueue();
  for(let i=0;i<1000;i++) q.spawn({kind:'slash',position:pos()},0);
  assert.equal(q.sample(100,[]).length,64); assert.equal(q.sample(330,[]).length,0);
  q.spawn({kind:'avatar',position:pos()},400); q.clear(); assert.equal(q.sample(500,[]).length,0);
});
test('follow effects move with living entities and stop at death/despawn without changing HP',()=>{
  const q=new PixelVfxQueue(), before=JSON.stringify(hero);
  q.spawn({kind:'heal',position:hero.position,followId:hero.id},0);
  const moved={...hero,position:pos(20,20)};
  assert.deepEqual(q.sample(100,[moved])[0].position,moved.position);
  assert.equal(q.sample(200,[{...moved,currentHp:0}]).length,0);
  assert.equal(JSON.stringify(hero),before);
  q.spawn({kind:'shield',position:hero.position,followId:hero.id},300); assert.equal(q.sample(400,[]).length,0);
});
test('impact survives target despawn at captured position; invalid coordinates rejected',()=>{
  const q=new PixelVfxQueue(), p=pos(2,3); q.spawn({kind:'impact',position:p},0); p.x=100;
  q.spawn({kind:'heal',position:pos(NaN,0)},0);
  assert.equal(q.sample(100,[]).length,1); assert.deepEqual(q.sample(100,[])[0].position,pos(2,3));
});
test('vendor sheets match measured grids and their source hashes',()=>{
  const provenance=JSON.parse(readFileSync(new URL('../public/assets/pixel/craftpix/vfx/provenance.json',import.meta.url)));
  for(const spec of Object.values(FX_SHEETS)){
    const bytes=readFileSync(new URL(`../public${spec.file}`,import.meta.url));
    assert.equal(bytes.readUInt32BE(16),spec.cell*spec.frames); assert.equal(bytes.readUInt32BE(20),spec.cell);
    assert.equal(createHash('sha256').update(bytes).digest('hex').toUpperCase(),provenance.find(p=>spec.file.endsWith('/'+p.Output)).SHA256);
  }
});

test('Judgment lands at the authoritative center and mixed immortal cast keeps heal plus confirmed damage wave',()=>{
  const judgment=planWarriorCastFx(cast('guerreiro_nv3_2',{targetPosition:pos(3,4),radius:5}),[hero,target]);
  assert.equal(judgment[0].kind,'judgment'); assert.deepEqual(judgment[0].position,pos(3,4));
  const immortal=cast('guerreiro_nv3_3',{isHeal:true,affectedEntityIds:['hero','target'],targetResults:[{targetId:'hero',impactPosition:hero.position,effectiveDamage:0,effectiveHeal:40},{targetId:'target',impactPosition:target.position,effectiveDamage:20,effectiveHeal:0}]});
  assert.deepEqual(planWarriorCastFx(immortal,[hero,target]).map(f=>f.kind),['heal','avatar']);
  immortal.targetResults=immortal.targetResults.slice(0,1);
  assert.deepEqual(planWarriorCastFx(immortal,[hero,target]).map(f=>f.kind),['heal']);
  immortal.affectedEntityIds=[]; assert.deepEqual(planWarriorCastFx(immortal,[hero,target]),[]);
});

test('warrior contact choices keep the approved basic slash and identify four other casts without inventing statuses',()=>{
  for (const [id,variant] of [['guerreiro_truque_1',undefined],['guerreiro_truque_2','bleed'],['guerreiro_truque_3','rupture'],['guerreiro_nv1_2','haste'],['guerreiro_nv1_3','stun']]) {
    const effects=planWarriorCastFx(cast(id,{headingYaw:180,targetPosition:target.position}),[hero,target]);
    assert.equal(effects.length,1); assert.equal(effects[0].kind,'slash'); assert.equal(effects[0].variant,variant);
    assert.equal(effects[0].yaw,180); assert.deepEqual(effects[0].position,target.position);
    assert.deepEqual(planWarriorCastFx(cast(id,{affectedEntityIds:[]}),[hero,target]),[]);
  }
});
