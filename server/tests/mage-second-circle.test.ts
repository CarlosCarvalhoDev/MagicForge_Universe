import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterClass,Opcode,SKILLS_DATABASE,createVector3,canUpgradeSkillPower} from '@magicforge/shared';
import {DatabaseManager} from '../src/database/DatabaseManager';
import {World} from '../src/game/World';
import {Monster,MonsterState} from '../src/entities/Monster';
import type {Connection} from '../src/network/Connection';
const originalRandom=Math.random;
function fixture(t:TestContext,skill='mago_nv2_1'){
  Math.random=()=>.999;t.after(()=>{Math.random=originalRandom;});
  const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);world.automationEnabled=false;
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('mage-second'),player=db.createCharacterInSlot('mage-second',account.id,0,'Temporal',CharacterClass.MAGO);
  player.level=25;player.recalculateStatsFromEquipment();player.currentHp=player.maxHp;player.currentResource=player.maxResource;player.setEquippedSkill(3,skill);
  const packets:Array<{op:Opcode;data:any}>=[];const connection={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;world.enterWorld(connection,player);
  const enemy=(id:string,x:number,hp=100000)=>{const monster=new Monster(id,id,createVector3(x,0,0),hp,10);monster.speed=0;monster.aggroRadius=0;monster.lootTable=[];monster.expReward=0;world.entityManager.addMonster(monster);return monster;};
  const target=enemy('target',3);const casts=()=>packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_EVENT);
  return {db,world,player,target,enemy,packets,connection,casts};
}

test('Nevasca aplica 2.4 INT na área escolhida, congela movimento e ataque por 1.5s e respeita fronteiras',t=>{
  const f=fixture(t);f.target.position.x=10;const boundary=f.enemy('boundary',15.5),outside=f.enemy('outside',15.501);
  f.world.castPlayerSkill(f.player,3,undefined,createVector3(10,0,0));const power=Math.round(f.player.attributes.inteligencia*2.4);
  assert.equal(100000-f.target.currentHp,power);assert.equal(100000-boundary.currentHp,power);assert.equal(outside.currentHp,100000);
  f.target.speed=10;f.target.state=MonsterState.CHASING;f.target.targetPlayer=f.player;f.target.update(.1);assert.equal(f.target.position.x,10);
  f.target.state=MonsterState.ATTACKING;f.target.attackCooldown=0;const hp=f.player.currentHp;(f.world as any).processMonsterCombat(f.target);assert.equal(f.player.currentHp,hp);
  f.world.updateCombatStatuses(1.51);assert.equal(f.target.isStunned(),false);(f.world as any).processMonsterCombat(f.target);assert.equal(f.player.currentHp,hp-10);
});

test('Congelamento renova sem empilhar, evolui dano e termina na morte/saída do conjurador',t=>{
  const f=fixture(t);f.world.castPlayerSkill(f.player,3,undefined,f.target.position);f.world.updateCombatStatuses(1);f.player.skillCooldowns.clear();f.player.skillLevels.mago_nv2_1=2;
  const hp=f.target.currentHp;f.world.castPlayerSkill(f.player,3,undefined,f.target.position);
  assert.equal(hp-f.target.currentHp,Math.round(Math.round(f.player.attributes.inteligencia*2.4)*1.05));assert.equal([...f.target.activeStatuses.values()].filter(s=>s.type==='FROZEN').length,1);
  f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.isStunned(),false);
  const g=fixture(t);g.world.castPlayerSkill(g.player,3,undefined,g.target.position);g.player.takeDamage(g.player.maxHp*10);g.world.updateCombatStatuses(.05);assert.equal(g.target.isStunned(),false);
});

test('Relâmpago limita quatro alvos e usa potência por alvo',t=>{
  const f=fixture(t,'mago_nv2_2'),b=f.enemy('b',3.1),c=f.enemy('c',3.2),d=f.enemy('d',3.3),e=f.enemy('e',3.4),outside=f.enemy('outside',8.01);
  f.world.castPlayerSkill(f.player,3,f.target.id);const power=Math.round(f.player.attributes.inteligencia*2.35);
  for(const monster of [f.target,b,c,d])assert.equal(100000-monster.currentHp,power);
  assert.equal(e.currentHp,100000);assert.equal(outside.currentHp,100000);assert.equal(f.casts()[0].data.targetResults.length,4);
});

test('Relâmpago faz saltos de até 5m entre vizinhos sem repetir alvos ou atravessar lacunas',t=>{
  const f=fixture(t,'mago_nv2_2'),b=f.enemy('b',8),c=f.enemy('c',13),d=f.enemy('d',18),e=f.enemy('e',23);
  f.world.castPlayerSkill(f.player,3,f.target.id);
  for(const monster of [f.target,b,c,d])assert.ok(monster.currentHp<100000);
  assert.equal(e.currentHp,100000);assert.deepEqual(f.casts()[0].data.affectedEntityIds,[f.target.id,b.id,c.id,d.id]);
  const g=fixture(t,'mago_nv2_2'),gap=g.enemy('gap',8.01);g.world.castPlayerSkill(g.player,3,g.target.id);assert.equal(gap.currentHp,100000);assert.equal(g.casts()[0].data.targetResults.length,1);
});

test('Haste cobra uma vez, não vende evolução fixa e reduz somente novos cooldowns de truque',t=>{
  const f=fixture(t,'mago_nv2_3'),resource=f.player.currentResource,interval=f.player.attackIntervalSec;
  f.world.castPlayerSkill(f.player,1,f.target.id);const previous=f.player.getSkillCooldown(1);
  f.world.castPlayerSkill(f.player,3);assert.equal(f.player.currentResource,resource-10-36);assert.equal(f.player.getSkillCooldown(1),previous);assert.equal(f.player.getSkillCooldown(3),14);assert.equal(canUpgradeSkillPower(SKILLS_DATABASE.mago_nv2_3),false);
  f.player.skillCooldowns.delete(1);f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(f.player.getSkillCooldown(1),1.2);assert.equal(f.casts().at(-1)!.data.cooldownRemainingSec,1.2);
  f.world.castPlayerSkill(f.player,2,f.target.id);assert.equal(f.player.getSkillCooldown(2),6.5);assert.equal(f.player.attackIntervalSec,interval);
  f.world.updateCombatStatuses(7.01);assert.equal(f.player.hasStatus('ARCANE_HASTE'),false);f.player.skillCooldowns.delete(1);f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(f.player.getSkillCooldown(1),2.4);
});

test('Haste acelera decisões reais a 20Hz sem mudar a ordem ou executar duas conjurações no mesmo tick',t=>{
  const run=(haste:boolean)=>{
    const f=fixture(t,'mago_nv2_3');f.player.level=50;f.player.recalculateStatsFromEquipment();f.player.currentResource=f.player.maxResource;f.target.position.x=1;
    if(haste)f.world.castPlayerSkill(f.player,3);else f.player.setSkillCooldown(3,14);
    f.player.skillCastOrder=[1,2,4,3];f.world.automationEnabled=true;
    for(let n=0;n<8;n++)f.world.update(.05);
    return f.casts().filter(p=>p.data.slot!==3).slice(0,3).map(p=>({slot:p.data.slot,tick:p.data.serverTick}));
  };
  const baseline=run(false),faster=run(true);assert.deepEqual(faster.map(p=>p.slot),[1,2,4]);assert.deepEqual(baseline.map(p=>p.slot),[1,2,4]);
  assert.ok(faster[2].tick<baseline[2].tick);assert.equal(new Set(faster.map(p=>p.tick)).size,3);
});

test('Renovar Haste não soma bônus e morrer encerra o efeito',t=>{
  const f=fixture(t,'mago_nv2_3');f.world.castPlayerSkill(f.player,3);f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,3);
  assert.equal([...f.player.activeStatuses.values()].filter(s=>s.type==='ARCANE_HASTE').length,1);
  f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(f.player.getSkillCooldown(1),1.2);f.player.takeDamage(f.player.maxHp*10);assert.equal(f.player.hasStatus('ARCANE_HASTE'),false);
});

test('Validação de nível, mana, alcance e cooldown evita dano/controle/buff e cobranças parciais',t=>{
  const f=fixture(t);const resource=f.player.currentResource;f.player.level=24;assert.equal(f.world.castPlayerSkill(f.player,3,undefined,f.target.position),false);assert.equal(f.player.currentResource,resource);
  f.player.level=25;f.player.currentResource=34;assert.equal(f.world.castPlayerSkill(f.player,3,undefined,f.target.position),false);assert.equal(f.target.hasStatus('FROZEN'),false);
  f.player.currentResource=resource;assert.equal(f.world.castPlayerSkill(f.player,3,undefined,createVector3(11,0,0)),false);assert.equal(f.player.currentResource,resource);
  f.player.setEquippedSkill(3,'mago_nv2_3');f.world.castPlayerSkill(f.player,3);const after=f.player.currentResource;assert.equal(f.world.castPlayerSkill(f.player,3),false);assert.equal(f.player.currentResource,after);
});

test('Haste funciona no automático com HP cheio e AUTO desligado mantém apenas básicos',t=>{
  const f=fixture(t,'mago_nv2_3');f.target.position.x=1;f.player.skillCastOrder=[3,1,2,4];f.world.automationEnabled=true;f.world.update(.05);assert.equal(f.casts()[0].data.skillId,'mago_nv2_3');
  assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
  f.player.autoCastEnabled=false;f.player.skillCooldowns.clear();const count=f.casts().length;for(let n=0;n<10;n++)f.world.update(.05);assert.equal(f.casts().length,count);
});
