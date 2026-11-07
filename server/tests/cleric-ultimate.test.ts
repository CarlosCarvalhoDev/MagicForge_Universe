import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterClass,Opcode,SKILLS_DATABASE,calculateSkillPower,createVector3} from '@magicforge/shared';
import {DatabaseManager} from '../src/database/DatabaseManager';
import {World} from '../src/game/World';
import {Monster} from '../src/entities/Monster';
import type {Connection} from '../src/network/Connection';

function fixture(t:TestContext,skill='clerigo_nv3_2'){
  const original=Math.random;Math.random=()=>.999;t.after(()=>{Math.random=original;});
  const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);world.automationEnabled=false;
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('ultimate'),player=db.createCharacterInSlot('ultimate',account.id,0,'Graça',CharacterClass.CLERIGO);
  player.level=50;player.recalculateStatsFromEquipment();player.currentHp=player.maxHp;player.currentResource=player.maxResource;player.setEquippedSkill(4,skill);
  const packets:Array<{op:Opcode;data:any}>=[];world.enterWorld({id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection,player);
  const enemy=(id:string,x:number,hp=100000)=>{const monster=new Monster(id,id,createVector3(x,0,0),hp,0);monster.speed=0;monster.aggroRadius=0;monster.lootTable=[];monster.expReward=0;world.entityManager.addMonster(monster);return monster;};
  const target=enemy('target',1);
  const casts=()=>packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_EVENT);
  return {db,world,player,target,enemy,packets,casts};
}

test('Coluna de Fogo usa SAB+CON no ponto escolhido e fronteira de área, com evolução',t=>{
  const f=fixture(t,'clerigo_nv3_1');f.target.position.x=10;
  const boundary=f.enemy('boundary',17.5),outside=f.enemy('outside',17.501),near=f.enemy('near',2.5);
  const power=Math.round(f.player.attributes.sabedoria*4.1+f.player.attributes.constituicao*1.5);
  assert.equal(calculateSkillPower(SKILLS_DATABASE.clerigo_nv3_1,f.player.attributes,50),power);
  assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(10,0,0)),true);
  assert.equal(100000-f.target.currentHp,power);assert.equal(100000-boundary.currentHp,power);assert.equal(100000-near.currentHp,power);assert.equal(outside.currentHp,100000);
  assert.equal(f.casts()[0].data.geometry,'CIRCLE_TARGET');assert.equal(f.casts()[0].data.radius,7.5);
  f.player.skillCooldowns.clear();f.player.skillLevels.clerigo_nv3_1=2;const before=f.target.currentHp;
  f.world.castPlayerSkill(f.player,4,undefined,createVector3(10,0,0));assert.equal(before-f.target.currentHp,Math.round(power*1.05));
});

test('Raio Solar atinge somente um alvo, respeita 12m e consome marca para um crítico',t=>{
  const f=fixture(t,'clerigo_nv3_3'),other=f.enemy('other',1.1);
  f.player.setEquippedSkill(2,'clerigo_nv1_3');f.world.castPlayerSkill(f.player,2,f.target.id);
  const hp=f.target.currentHp,power=Math.round(f.player.attributes.sabedoria*4.8);
  assert.equal(f.world.castPlayerSkill(f.player,4,f.target.id),true);
  assert.equal(hp-f.target.currentHp,Math.round(power*1.5));assert.equal(f.casts().at(-1)!.data.isCritical,true);assert.equal(other.currentHp,100000);assert.equal(f.target.hasStatus('GUIDING_MARK'),false);
  f.player.skillCooldowns.clear();f.target.position.x=12.51;const resource=f.player.currentResource;
  assert.equal(f.world.castPlayerSkill(f.player,4,f.target.id),false);assert.equal(f.player.currentResource,resource);assert.equal(f.player.getSkillCooldown(4),0);
});

test('Intervenção cura até o máximo e causa dano em 8m na mesma cobrança e evento',t=>{
  const f=fixture(t),boundary=f.enemy('boundary',8),outside=f.enemy('outside',8.01);
  f.player.currentHp=1;const resource=f.player.currentResource,maxHp=f.player.maxHp;
  const power=Math.round(f.player.attributes.sabedoria*4.3);
  assert.equal(f.world.castPlayerSkill(f.player,4),true);
  assert.equal(f.player.currentHp,maxHp);assert.equal(f.player.maxHp,maxHp);assert.equal(f.player.currentResource,resource-70);assert.equal(f.player.getSkillCooldown(4),45);
  assert.equal(100000-f.target.currentHp,power);assert.equal(100000-boundary.currentHp,power);assert.equal(outside.currentHp,100000);
  const event=f.casts()[0].data;assert.equal(event.geometry,'CIRCLE_SELF');assert.deepEqual(event.targetPosition,event.originPosition);
  assert.equal(event.targetResults.find((r:any)=>r.targetId===f.player.id).effectiveHeal,maxHp-1);
  assert.equal(event.damageOrHeal,maxHp-1+power*2);assert.equal(event.targetResults.length,3);
});

test('Intervenção evolui dano e recebe Bênção sem exceder HP ou consumir marca de alvo único',t=>{
  const f=fixture(t);f.player.setEquippedSkill(2,'clerigo_nv1_3');f.world.castPlayerSkill(f.player,2,f.target.id);
  f.player.skillCooldowns.clear();f.player.setEquippedSkill(2,'clerigo_nv1_2');f.world.castPlayerSkill(f.player,2);
  f.player.skillLevels.clerigo_nv3_2=2;f.player.currentHp=1;const hp=f.target.currentHp;
  const expected=Math.round(Math.round(Math.round(f.player.attributes.sabedoria*4.3)*1.05)*1.2);
  f.world.castPlayerSkill(f.player,4);assert.equal(hp-f.target.currentHp,expected);assert.equal(f.player.currentHp,f.player.maxHp);assert.ok(f.target.hasStatus('GUIDING_MARK'));
});

test('Intervenção manual permite cura sem inimigo próximo e informa cura efetiva zero com HP cheio',t=>{
  const f=fixture(t);f.target.position.x=20;f.player.currentHp=1;f.world.castPlayerSkill(f.player,4);
  assert.equal(f.player.currentHp,f.player.maxHp);assert.equal(f.target.currentHp,100000);assert.equal(f.casts()[0].data.targetResults.length,1);
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,4);assert.equal(f.casts()[1].data.damageOrHeal,0);
});

test('Automático usa Intervenção ofensiva com HP cheio, mantém básicos e respeita desligar AUTO',t=>{
  const f=fixture(t);f.world.automationEnabled=true;f.player.skillCastOrder=[4,1,2,3];f.world.update(.05);
  assert.equal(f.casts()[0].data.skillId,'clerigo_nv3_2');assert.ok(f.casts()[0].data.targetResults.some((r:any)=>r.effectiveDamage>0));
  assert.equal(f.casts()[0].data.targetResults.find((r:any)=>r.targetId===f.player.id).effectiveHeal,0);
  assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
  f.player.autoCastEnabled=false;f.player.skillCooldowns.clear();const count=f.casts().length;
  for(let n=0;n<10;n++)f.world.update(.05);assert.equal(f.casts().length,count);
});

test('Rejeições de nível, recurso, alcance e cooldown não aplicam cura nem dano parcial',t=>{
  const f=fixture(t);f.player.currentHp=1;f.player.level=49;
  const resource=f.player.currentResource;assert.equal(f.world.castPlayerSkill(f.player,4),false);assert.equal(f.player.currentResource,resource);
  f.player.level=50;f.player.currentResource=69;assert.equal(f.world.castPlayerSkill(f.player,4),false);assert.equal(f.player.currentHp,1);
  f.player.currentResource=resource;assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(1,0,0)),false);assert.equal(f.player.currentResource,resource);
  f.world.castPlayerSkill(f.player,4);f.player.currentHp=1;const hp=f.target.currentHp,remaining=f.player.currentResource;
  assert.equal(f.world.castPlayerSkill(f.player,4),false);assert.equal(f.player.currentHp,1);assert.equal(f.target.currentHp,hp);assert.equal(f.player.currentResource,remaining);
});

test('Supernova reconhece mortes uma única vez e não produz cura em monstros',t=>{
  const f=fixture(t);f.target.currentHp=1;const other=f.enemy('other',2,1);f.world.castPlayerSkill(f.player,4);
  assert.equal(f.player.huntSession.snapshot().kills,2);assert.equal(other.isDead,true);
  assert.ok(f.casts()[0].data.targetResults.filter((r:any)=>r.targetId!==f.player.id).every((r:any)=>r.effectiveHeal===0));
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,4);assert.equal(f.player.huntSession.snapshot().kills,2);
});

test('Área pessoal de cura também funciona sem inimigos para o Santuário',t=>{
  const f=fixture(t);f.target.position.x=20;f.player.setEquippedSkill(3,'clerigo_nv2_3');
  assert.equal(f.world.castPlayerSkill(f.player,3),true);assert.ok(f.player.hasStatus('SANCTUARY'));
  assert.equal(f.casts()[0].data.targetId,f.player.id);
});
