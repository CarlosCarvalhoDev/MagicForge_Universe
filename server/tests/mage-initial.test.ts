import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterClass,Opcode,SKILLS_DATABASE,calculateSkillPower,createVector3,canUpgradeSkillPower} from '@magicforge/shared';
import {DatabaseManager} from '../src/database/DatabaseManager';
import {World} from '../src/game/World';
import {Monster,MonsterState} from '../src/entities/Monster';
import type {Connection} from '../src/network/Connection';
const originalRandom=Math.random;

function fixture(t:TestContext,skill='mago_truque_1'){
  Math.random=()=>.999;t.after(()=>{Math.random=originalRandom;});
  const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);world.automationEnabled=false;
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('mage-initial'),player=db.createCharacterInSlot('mage-initial',account.id,0,'Arcano',CharacterClass.MAGO);
  player.level=10;player.recalculateStatsFromEquipment();player.currentHp=player.maxHp;player.currentResource=player.maxResource;player.setEquippedSkill(SKILLS_DATABASE[skill].slot,skill);
  const packets:Array<{op:Opcode;data:any}>=[];const connection={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;world.enterWorld(connection,player);
  const enemy=(id:string,x:number,z=0,hp=100000)=>{const monster=new Monster(id,id,createVector3(x,0,z),hp,0);monster.speed=0;monster.aggroRadius=0;monster.lootTable=[];monster.expReward=0;world.entityManager.addMonster(monster);return monster;};
  const target=enemy('target',3);
  const casts=()=>packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_EVENT);
  return {db,world,player,target,enemy,packets,connection,casts};
}

test('Dardo de Fogo usa 1.4 INT e evolução sem trocar custo, cooldown ou alvo',t=>{
  const f=fixture(t),power=Math.round(f.player.attributes.inteligencia*1.4),resource=f.player.currentResource;
  f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(100000-f.target.currentHp,power);assert.equal(f.player.currentResource,resource-10);assert.equal(f.player.getSkillCooldown(1),2.4);
  f.player.skillCooldowns.clear();f.player.skillLevels.mago_truque_1=2;const hp=f.target.currentHp;
  f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(hp-f.target.currentHp,Math.round(power*1.05));
});

test('Raio de Gelo reduz deslocamento por 3s; Guardiões e gelo usam maior lentidão sem se apagar',t=>{
  const f=fixture(t,'mago_truque_2');f.target.position.x=4;f.target.speed=10;f.target.aggroRadius=100;f.target.state=MonsterState.CHASING;f.target.targetPlayer=f.player;
  f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(f.target.getMovementMultiplier(),.65);f.target.update(.1);assert.ok(Math.abs(f.target.position.x-3.35)<1e-8);
  const account=f.db.getOrCreateAccount('cleric-coop'),cleric=f.db.createCharacterInSlot('cleric-coop',account.id,0,'Sagrado',CharacterClass.CLERIGO);
  cleric.level=25;cleric.recalculateStatsFromEquipment();cleric.currentResource=cleric.maxResource;
  const connection={id:cleric.id,accountId:account.id,isAuthenticated:true,send:()=>{}} as unknown as Connection;f.world.enterWorld(connection,cleric);f.world.castPlayerSkill(cleric,3);
  assert.equal(f.target.getMovementMultiplier(),.6);f.world.removePlayerFromWorld(connection,false);assert.equal(f.target.getMovementMultiplier(),.65);
  f.world.updateCombatStatuses(3.01);assert.equal(f.target.getMovementMultiplier(),1);
});

test('Toque Chocante prioriza alvo selecionado e limita a dois inimigos dentro de 3m',t=>{
  const f=fixture(t,'mago_truque_3'),second=f.enemy('second',3.1),third=f.enemy('third',3.2),outside=f.enemy('outside',6.01);
  f.world.castPlayerSkill(f.player,1,f.target.id);
  assert.ok(f.target.currentHp<100000);assert.ok(second.currentHp<100000);assert.equal(third.currentHp,100000);assert.equal(outside.currentHp,100000);
  assert.equal(f.casts()[0].data.targetResults.length,2);
});

test('Mísseis gera três impactos que somam 1.85 INT em uma cobrança e para ao matar',t=>{
  const f=fixture(t,'mago_nv1_1'),resource=f.player.currentResource;
  f.world.castPlayerSkill(f.player,2,f.target.id);const results=f.casts()[0].data.targetResults;
  assert.equal(results.length,3);assert.equal(results.reduce((n:number,r:any)=>n+r.effectiveDamage,0),Math.round(f.player.attributes.inteligencia*1.85));assert.equal(f.player.currentResource,resource-20);
  f.target.currentHp=1;f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,2,f.target.id);
  assert.equal(f.casts()[1].data.targetResults.length,1);assert.equal(f.player.huntSession.snapshot().kills,1);
});

test('Escudo absorve 25% HP, reflete somente o absorvido e rompe sem efeito além do limite',t=>{
  const f=fixture(t,'mago_nv1_2');f.world.castPlayerSkill(f.player,2);
  const capacity=Math.round(f.player.maxHp*.25),hp=f.player.currentHp;assert.equal(f.player.getStatus('SHIELD')!.remainingAbsorption,capacity);
  const result=f.player.takeDamage(capacity+100,f.target);
  assert.equal(result.absorbed,capacity);assert.equal(result.reflected,Math.round(capacity*.2));assert.equal(f.player.currentHp,hp-100);assert.equal(f.player.hasStatus('SHIELD'),false);
  const targetHp=f.target.currentHp;f.player.takeDamage(10,f.target);assert.equal(f.target.currentHp,targetHp);
});

test('Escudo possui melhoria real, renova sem empilhar, não dá crítico e expira após 5s',t=>{
  const f=fixture(t,'mago_nv1_2');assert.equal(canUpgradeSkillPower(SKILLS_DATABASE.mago_nv1_2),true);
  f.player.skillLevels.mago_nv1_2=2;f.world.castPlayerSkill(f.player,2);const expected=Math.round(Math.round(f.player.maxHp*.25)*1.05);
  assert.equal(f.player.getStatus('SHIELD')!.remainingAbsorption,expected);assert.equal(f.casts()[0].data.isCritical,false);
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,2);assert.equal(f.player.activeStatuses.size,1);f.world.updateCombatStatuses(5.01);assert.equal(f.player.hasStatus('SHIELD'),false);
});

test('Compra real da evolução do Escudo persiste rank, debita uma vez e aumenta absorção',t=>{
  const f=fixture(t,'mago_nv1_2');f.player.gold=f.db.updateCharacterGold(f.player.dbCharacterId,10000-f.player.gold);f.db.addItemToInventory(f.player.dbCharacterId,'arcane_dust',10);
  const result=f.db.upgradeCharacterSkill(f.player,'mago_nv1_2',1);Object.assign(f.player,result);
  assert.equal(result.skillLevels.mago_nv1_2,2);assert.equal(result.gold,9400);assert.equal(f.db.getSkillLevels(f.player.dbCharacterId).mago_nv1_2,2);
  assert.throws(()=>f.db.upgradeCharacterSkill(f.player,'mago_nv1_2',1),/STALE_LEVEL/);assert.equal(f.db.getCharacterGold(f.player.dbCharacterId),9400);
  f.world.castPlayerSkill(f.player,2);assert.equal(f.player.getStatus('SHIELD')!.remainingAbsorption,Math.round(Math.round(f.player.maxHp*.25)*1.05));
});

test('Reflexão do Escudo reconhece morte no ataque do monstro uma única vez e não faz cadeia',t=>{
  const f=fixture(t,'mago_nv1_2');f.world.castPlayerSkill(f.player,2);f.target.currentHp=1;f.target.attackDamage=10;f.target.state=MonsterState.ATTACKING;f.target.targetPlayer=f.player;f.target.attackCooldown=0;
  (f.world as any).processMonsterCombat(f.target);assert.equal(f.target.isDead,true);assert.equal(f.player.huntSession.snapshot().kills,1);
  (f.world as any).processMonsterCombat(f.target);assert.equal(f.player.huntSession.snapshot().kills,1);
  assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='REFLECTION'));
  const other=f.enemy('shielded',3);other.addStatus({...f.player.getStatus('SHIELD')!,statusId:'enemy-shield',targetEntityId:other.id,reflectRatio:1});
  const hp=f.player.currentHp;const result=f.player.takeDamage(10,other);assert.equal(result.reflected,2);assert.equal(f.player.currentHp,hp);
});

test('Orbe atinge cone frontal de 6m e 60 graus, sem atingir atrás, nas laterais ou além do alcance',t=>{
  const f=fixture(t,'mago_nv1_3'),edge=f.enemy('edge',6*Math.cos(Math.PI/6),3),outsideAngle=f.enemy('angle',4*Math.cos(31*Math.PI/180),4*Math.sin(31*Math.PI/180)),behind=f.enemy('behind',-1),far=f.enemy('far',6.01);
  f.world.castPlayerSkill(f.player,2,undefined,createVector3(6,0,0));
  assert.ok(f.target.currentHp<100000);assert.ok(edge.currentHp<100000);assert.equal(outsideAngle.currentHp,100000);assert.equal(behind.currentHp,100000);assert.equal(far.currentHp,100000);
  assert.equal(f.casts()[0].data.geometry,'CONE');assert.equal(f.casts()[0].data.headingYaw,90);assert.equal(f.casts()[0].data.coneRange,6);assert.equal(f.casts()[0].data.coneAngleDeg,60);
});

test('Queima distribui potência capturada em quatro pulsos, respeita evolução e renovação sem duplicar',t=>{
  const f=fixture(t,'mago_nv1_3');f.player.skillLevels.mago_nv1_3=2;f.world.castPlayerSkill(f.player,2,undefined,f.target.position);
  const power=f.target.getStatus('BURN')!.magnitude;assert.equal(power,Math.round(Math.round(f.player.attributes.inteligencia*.8)*1.05));
  f.world.updateCombatStatuses(1);f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,2,undefined,f.target.position);
  assert.equal([...f.target.activeStatuses.values()].filter(s=>s.type==='BURN').length,1);
  const hp=f.target.currentHp;f.player.attributes.inteligencia+=1000;f.world.updateCombatStatuses(100);
  assert.equal(hp-f.target.currentHp,power);assert.equal(f.target.hasStatus('BURN'),false);
});

test('Queima atribui morte uma vez e efeitos do Mago terminam na morte e saída do conjurador',t=>{
  const f=fixture(t,'mago_nv1_3');f.world.castPlayerSkill(f.player,2,undefined,f.target.position);f.target.currentHp=1;f.world.updateCombatStatuses(1);
  assert.equal(f.player.huntSession.snapshot().kills,1);f.world.updateCombatStatuses(10);assert.equal(f.player.huntSession.snapshot().kills,1);
  const g=fixture(t,'mago_nv1_3');g.world.castPlayerSkill(g.player,2,undefined,g.target.position);g.player.takeDamage(g.player.maxHp*10);const hp=g.target.currentHp;g.world.updateCombatStatuses(1);assert.equal(g.target.currentHp,hp);assert.equal(g.target.hasStatus('BURN'),false);
  const h=fixture(t,'mago_truque_2');h.world.castPlayerSkill(h.player,1,h.target.id);h.world.removePlayerFromWorld(h.connection,false);assert.equal(h.target.hasStatus('FROST_SLOW'),false);
});

test('Rejeições não criam efeito nem cobram: nível, mana, cone vazio e ponto além do alcance',t=>{
  const f=fixture(t,'mago_nv1_3');const resource=f.player.currentResource;
  f.player.level=9;assert.equal(f.world.castPlayerSkill(f.player,2,undefined,f.target.position),false);assert.equal(f.player.currentResource,resource);
  f.player.level=10;f.player.currentResource=24;assert.equal(f.world.castPlayerSkill(f.player,2,undefined,f.target.position),false);assert.equal(f.player.currentResource,24);
  f.player.currentResource=resource;assert.equal(f.world.castPlayerSkill(f.player,2,undefined,createVector3(-6,0,0)),false);assert.equal(f.world.castPlayerSkill(f.player,2,undefined,createVector3(7,0,0)),false);assert.equal(f.player.currentResource,resource);assert.equal(f.player.getSkillCooldown(2),0);assert.equal(f.target.activeStatuses.size,0);
});

test('Automático usa Escudo com vida cheia e cone voltado ao inimigo, preservando ataques básicos',t=>{
  for(const skill of ['mago_nv1_2','mago_nv1_3']){
    const f=fixture(t,skill);f.target.position.x=1;f.player.skillCastOrder=[2,1,3,4];f.world.automationEnabled=true;f.world.update(.05);
    assert.equal(f.casts()[0].data.skillId,skill);assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
    f.player.autoCastEnabled=false;f.player.skillCooldowns.clear();const count=f.casts().length;for(let n=0;n<10;n++)f.world.update(.05);assert.equal(f.casts().length,count);
  }
});
