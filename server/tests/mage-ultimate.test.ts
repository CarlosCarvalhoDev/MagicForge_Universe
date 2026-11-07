import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterClass,Opcode,createVector3} from '@magicforge/shared';
import {DatabaseManager} from '../src/database/DatabaseManager';
import {World} from '../src/game/World';
import {Monster} from '../src/entities/Monster';
import type {Connection} from '../src/network/Connection';
const originalRandom=Math.random;
function fixture(t:TestContext,skill='mago_nv3_2'){
  Math.random=()=>.999;t.after(()=>{Math.random=originalRandom;});const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);world.automationEnabled=false;
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('mage-ultimate'),player=db.createCharacterInSlot('mage-ultimate',account.id,0,'Cometa',CharacterClass.MAGO);
  player.level=50;player.recalculateStatsFromEquipment();player.currentHp=player.maxHp;player.currentResource=player.maxResource;player.setEquippedSkill(4,skill);
  const packets:Array<{op:Opcode;data:any}>=[];const connection={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;world.enterWorld(connection,player);
  const enemy=(id:string,x:number,hp=100000)=>{const monster=new Monster(id,id,createVector3(x,0,0),hp,0);monster.speed=0;monster.aggroRadius=0;monster.lootTable=[];monster.expReward=0;world.entityManager.addMonster(monster);return monster;};
  const target=enemy('target',3);const casts=()=>packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_EVENT);const ticks=()=>packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='STATUS_TICK');
  return {db,world,player,target,enemy,packets,connection,casts,ticks};
}

test('Bola de Fogo aplica 4.3 INT na área de 8m, respeita fronteira e evolução',t=>{
  const f=fixture(t,'mago_nv3_1');f.target.position.x=10;const edge=f.enemy('edge',18),outside=f.enemy('outside',18.001);const resource=f.player.currentResource,power=Math.round(f.player.attributes.inteligencia*4.3);
  f.world.castPlayerSkill(f.player,4,undefined,createVector3(10,0,0));assert.equal(100000-f.target.currentHp,power);assert.equal(100000-edge.currentHp,power);assert.equal(outside.currentHp,100000);assert.equal(f.player.currentResource,resource-65);assert.equal(f.player.getSkillCooldown(4),40);
  f.player.skillCooldowns.clear();f.player.skillLevels.mago_nv3_1=2;const hp=f.target.currentHp;f.world.castPlayerSkill(f.player,4,undefined,createVector3(10,0,0));assert.equal(hp-f.target.currentHp,Math.round(power*1.05));
});

test('Cometas não dão dano inicial, caem em 0.5/1/1.5s e preservam a potência total',t=>{
  const f=fixture(t),resource=f.player.currentResource,power=Math.round(f.player.attributes.inteligencia*4.7);
  f.world.castPlayerSkill(f.player,4,undefined,f.target.position);assert.equal(f.target.currentHp,100000);assert.equal(f.player.currentResource,resource-70);assert.equal(f.player.getSkillCooldown(4),45);
  const applied=f.packets.find(p=>p.op===Opcode.S2C_COMBAT_STATUS_EVENT&&p.data.status.type==='COMET_RAIN')!.data.status;
  assert.deepEqual(applied.areaCenter,createVector3(3,0,0));assert.equal(applied.radius,6.5);
  f.world.updateCombatStatuses(.49);assert.equal(f.ticks().length,0);f.world.updateCombatStatuses(.01);assert.equal(f.ticks().length,1);
  f.world.updateCombatStatuses(.5);assert.equal(f.ticks().length,2);f.world.updateCombatStatuses(.5);assert.equal(f.ticks().length,3);assert.equal(100000-f.target.currentHp,power);
  f.world.updateCombatStatuses(10);assert.equal(f.ticks().length,3);assert.equal(f.player.hasStatus('COMET_RAIN'),false);
});

test('Área dos Cometas fica fixa, verifica entradas/saídas e não acompanha movimento do conjurador',t=>{
  const f=fixture(t),entering=f.enemy('entering',30);f.world.castPlayerSkill(f.player,4,undefined,f.target.position);f.world.updateCombatStatuses(.5);
  const hp=f.target.currentHp;f.target.position.x=10;entering.position.x=3;f.player.position.x=50;f.world.updateCombatStatuses(1);
  assert.equal(f.target.currentHp,hp);assert.ok(entering.currentHp<100000);assert.equal(f.ticks().filter(p=>p.data.targetId===entering.id).length,2);
});

test('Cometas capturam evolução, não têm crítico e renovação substitui os impactos pendentes',t=>{
  const f=fixture(t);f.player.skillLevels.mago_nv3_2=2;f.world.castPlayerSkill(f.player,4,undefined,f.target.position);const captured=f.player.getStatus('COMET_RAIN')!.magnitude;
  assert.equal(captured,Math.round(Math.round(f.player.attributes.inteligencia*4.7)*1.05));assert.equal(f.casts()[0].data.isCritical,false);
  f.world.updateCombatStatuses(.5);f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,4,undefined,f.target.position);assert.equal([...f.player.activeStatuses.values()].filter(s=>s.type==='COMET_RAIN').length,1);
  const hp=f.target.currentHp;f.player.attributes.inteligencia+=1000;f.world.updateCombatStatuses(100);assert.equal(hp-f.target.currentHp,captured);assert.equal(f.ticks().length,4);
});

test('Morte e saída do conjurador cancelam Cometas; morte por impacto recompensa uma única vez',t=>{
  const f=fixture(t);f.world.castPlayerSkill(f.player,4,undefined,f.target.position);f.player.takeDamage(f.player.maxHp*10);f.world.updateCombatStatuses(2);assert.equal(f.ticks().length,0);
  const g=fixture(t);g.world.castPlayerSkill(g.player,4,undefined,g.target.position);g.world.removePlayerFromWorld(g.connection,false);g.world.updateCombatStatuses(2);assert.equal(g.ticks().length,0);
  const h=fixture(t);h.world.castPlayerSkill(h.player,4,undefined,h.target.position);h.target.currentHp=1;h.world.updateCombatStatuses(2);assert.equal(h.player.huntSession.snapshot().kills,1);assert.equal(h.ticks().length,1);
});

test('Estase aplica 3.9 INT e 3s de congelamento; Nevasca não encurta um efeito mais longo',t=>{
  const f=fixture(t,'mago_nv3_3');const power=Math.round(f.player.attributes.inteligencia*3.9);f.world.castPlayerSkill(f.player,4,undefined,f.target.position);
  assert.equal(100000-f.target.currentHp,power);assert.equal(f.target.getStatus('FROZEN')!.remainingSec,3);f.world.updateCombatStatuses(.1);
  f.world.castPlayerSkill(f.player,3,undefined,f.target.position);assert.ok(Math.abs(f.target.getStatus('FROZEN')!.remainingSec-2.9)<1e-8);
  f.world.updateCombatStatuses(2.91);assert.equal(f.target.isStunned(),false);
});

test('Rejeições de nível, mana, alcance e cooldown não criam chuva nem cobram parcialmente',t=>{
  const f=fixture(t);const resource=f.player.currentResource;f.player.level=49;assert.equal(f.world.castPlayerSkill(f.player,4,undefined,f.target.position),false);assert.equal(f.player.currentResource,resource);
  f.player.level=50;f.player.currentResource=69;assert.equal(f.world.castPlayerSkill(f.player,4,undefined,f.target.position),false);assert.equal(f.player.hasStatus('COMET_RAIN'),false);
  f.player.currentResource=resource;assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(11,0,0)),false);assert.equal(f.player.currentResource,resource);
  f.world.castPlayerSkill(f.player,4,undefined,f.target.position);const after=f.player.currentResource;assert.equal(f.world.castPlayerSkill(f.player,4,undefined,f.target.position),false);assert.equal(f.player.currentResource,after);
});

test('Automático usa cada escolha e desligar AUTO preserva somente o efeito já conjurado e básicos',t=>{
  for(const skill of ['mago_nv3_1','mago_nv3_2','mago_nv3_3']){
    const f=fixture(t,skill);f.target.position.x=1;f.world.automationEnabled=true;f.player.skillCastOrder=[4,1,2,3];f.world.update(.05);assert.equal(f.casts()[0].data.skillId,skill);
    assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
    f.player.autoCastEnabled=false;f.player.skillCooldowns.clear();const count=f.casts().length;for(let n=0;n<32;n++)f.world.update(.05);assert.equal(f.casts().length,count);
    if(skill==='mago_nv3_2')assert.equal(f.ticks().length,3);
  }
});
