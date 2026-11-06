import test, {type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterClass, Opcode, createVector3, calculateSkillPower, SKILLS_DATABASE} from '@magicforge/shared';
import {DatabaseManager} from '../src/database/DatabaseManager';
import {World} from '../src/game/World';
import {Monster,MonsterState} from '../src/entities/Monster';
import type {Connection} from '../src/network/Connection';

function fixture(t:TestContext, skill='clerigo_nv2_1'){
  const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);world.automationEnabled=false;
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('periodic');
  const player=db.createCharacterInSlot('periodic',account.id,0,'Temporal',CharacterClass.CLERIGO);
  player.level=25;player.recalculateStatsFromEquipment();player.currentHp=player.maxHp;player.currentResource=player.maxResource;player.setEquippedSkill(3,skill);
  const packets:Array<{op:Opcode;data:any}>=[];
  const connection={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;
  world.enterWorld(connection,player);
  const enemy=(id:string,x:number,hp=100000)=>{const monster=new Monster(id,id,createVector3(x,0,0),hp,0);monster.speed=0;monster.aggroRadius=0;monster.lootTable=[];monster.expReward=0;world.entityManager.addMonster(monster);world.spatialGrid.updateEntity(monster);return monster;};
  const target=enemy('target',1);
  const damage=()=>packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='STATUS_TICK');
  return {db,world,player,target,enemy,packets,connection,damage};
}

test('Guardiões distribui potência em seis pulsos, respeita limite radial e não repete após expirar',t=>{
  const f=fixture(t),boundary=f.enemy('boundary',5),outside=f.enemy('outside',5.01);
  const expected=calculateSkillPower(SKILLS_DATABASE.clerigo_nv2_1,f.player.attributes,25);
  assert.equal(f.world.castPlayerSkill(f.player,3),true);assert.equal(f.damage().length,0);
  assert.equal(f.target.getMovementMultiplier(),.6);assert.equal(outside.hasStatus('SLOW'),false);
  for(let n=0;n<120;n++)f.world.updateCombatStatuses(.05);
  assert.equal(100000-f.target.currentHp,expected);assert.equal(100000-boundary.currentHp,expected);assert.equal(outside.currentHp,100000);
  assert.equal(f.damage().filter(p=>p.data.targetId===f.target.id).length,6);
  f.world.updateCombatStatuses(10);assert.equal(f.target.hasStatus('SLOW'),false);assert.equal(f.player.hasStatus('GUARDIANS_AURA'),false);
  assert.equal(100000-f.target.currentHp,expected);
});

test('Aura acompanha movimento e lentidão altera deslocamento real, sem persistir fora da área',t=>{
  const f=fixture(t),chaser=f.enemy('chaser',4);chaser.speed=10;chaser.aggroRadius=100;chaser.state=MonsterState.CHASING;chaser.targetPlayer=f.player;
  f.world.castPlayerSkill(f.player,3);chaser.update(.1);assert.ok(Math.abs(chaser.position.x-3.4)<1e-8);
  const next=f.enemy('next',21);f.player.position.x=20;f.world.updateCombatStatuses(0);
  assert.equal(f.target.hasStatus('SLOW'),false);assert.equal(chaser.hasStatus('SLOW'),false);assert.equal(next.hasStatus('SLOW'),true);
  f.world.updateCombatStatuses(1);assert.equal(f.target.currentHp,100000);assert.ok(next.currentHp<100000);
});

test('Arma Espiritual espera 2s, troca alvo morto ou distante, limita alcance e atribui morte uma vez',t=>{
  const f=fixture(t,'clerigo_nv2_2');f.target.currentHp=1;const next=f.enemy('next',2),far=f.enemy('far',20);
  assert.equal(f.world.castPlayerSkill(f.player,3,f.target.id),true);f.world.updateCombatStatuses(1.99);assert.equal(f.damage().length,0);
  f.world.updateCombatStatuses(.01);assert.equal(f.target.isDead,true);assert.equal(f.player.huntSession.snapshot().kills,1);
  f.world.updateCombatStatuses(2);assert.ok(next.currentHp<100000);next.position.x=20;
  f.world.updateCombatStatuses(2);assert.equal(f.damage().length,2);assert.equal(far.currentHp,100000);
  next.position.x=2;f.world.updateCombatStatuses(20);assert.equal(f.damage().length,3);assert.equal(f.player.hasStatus('SPIRITUAL_WEAPON'),false);
  assert.equal(f.player.huntSession.snapshot().kills,1);
});

test('Santuário fica no chão, cura somente dentro, usa maior redução e respeita HP máximo',t=>{
  const f=fixture(t,'clerigo_nv2_3');f.player.setEquippedSkill(2,'clerigo_nv1_2');f.world.castPlayerSkill(f.player,2);
  assert.equal(f.world.castPlayerSkill(f.player,3),true);assert.equal(f.player.hasStatus('SANCTUARY_WARD'),true);
  let hp=f.player.currentHp;f.player.takeDamage(100);assert.equal(hp-f.player.currentHp,75);
  f.player.currentHp=1;f.world.updateCombatStatuses(1);const first=f.player.currentHp;assert.ok(first>1);
  f.player.position.x=7;f.world.updateCombatStatuses(0);assert.equal(f.player.hasStatus('SANCTUARY_WARD'),false);
  hp=f.player.currentHp;f.player.takeDamage(10);assert.equal(hp-f.player.currentHp,8);
  hp=f.player.currentHp;f.world.updateCombatStatuses(1);assert.equal(f.player.currentHp,hp);
  f.player.position.x=0;f.world.updateCombatStatuses(1);assert.equal(f.player.hasStatus('SANCTUARY_WARD'),true);assert.ok(f.player.currentHp>hp);
  f.player.currentHp=f.player.maxHp-1;f.world.updateCombatStatuses(1);assert.equal(f.player.currentHp,f.player.maxHp);
  f.world.updateCombatStatuses(2.01);assert.equal(f.player.hasStatus('SANCTUARY'),false);assert.equal(f.player.hasStatus('SANCTUARY_WARD'),false);
  assert.equal(f.player.hasStatus('DAMAGE_REDUCTION'),true);
});

test('Morte e remoção do mundo encerram aura e efeitos derivados, sem ticks de personagem ausente',t=>{
  const f=fixture(t);f.world.castPlayerSkill(f.player,3);f.player.takeDamage(f.player.maxHp*10);f.world.updateCombatStatuses(1);
  assert.equal(f.target.hasStatus('SLOW'),false);assert.equal(f.damage().length,0);
  const g=fixture(t);g.world.castPlayerSkill(g.player,3);g.world.removePlayerFromWorld(g.connection,false);
  assert.equal(g.target.hasStatus('SLOW'),false);g.world.updateCombatStatuses(20);assert.equal(g.damage().length,0);
});

test('Renovação não duplica efeito e potência captura evolução e bônus no momento da conjuração',t=>{
  const f=fixture(t,'clerigo_nv2_2');f.player.skillLevels.clerigo_nv2_2=2;
  f.world.castPlayerSkill(f.player,3,f.target.id);f.world.updateCombatStatuses(1);f.player.skillCooldowns.clear();
  f.world.castPlayerSkill(f.player,3,f.target.id);assert.equal(f.player.activeStatuses.size,1);
  const total=f.player.getStatus('SPIRITUAL_WEAPON')!.magnitude;
  f.player.attributes.sabedoria+=1000;f.world.updateCombatStatuses(100);
  assert.equal(100000-f.target.currentHp,total);assert.equal(f.damage().length,4);
});

test('Área sem alvo, arma fora de alcance, nível e recurso insuficientes não criam efeitos nem cobram',t=>{
  const f=fixture(t);f.target.position.x=10;const resource=f.player.currentResource;
  assert.equal(f.world.castPlayerSkill(f.player,3),false);assert.equal(f.player.currentResource,resource);
  f.player.setEquippedSkill(3,'clerigo_nv2_2');assert.equal(f.world.castPlayerSkill(f.player,3,f.target.id),false);
  f.target.position.x=1;f.player.level=24;assert.equal(f.world.castPlayerSkill(f.player,3,f.target.id),false);
  f.player.level=25;f.player.currentResource=0;assert.equal(f.world.castPlayerSkill(f.player,3,f.target.id),false);
  assert.equal(f.player.activeStatuses.size,0);assert.equal(f.player.getSkillCooldown(3),0);
});

test('Santuário pode entrar preventivamente no automático com vida cheia; básicos continuam',t=>{
  const f=fixture(t,'clerigo_nv2_3');f.world.automationEnabled=true;f.player.skillCastOrder=[3,1,2,4];f.world.update(.05);
  assert.ok(f.player.hasStatus('SANCTUARY'));assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
});

test('Auras de dois conjuradores não somam lentidão e a segunda mantém o efeito após a primeira sair',t=>{
  const f=fixture(t);f.world.castPlayerSkill(f.player,3);
  const account=f.db.getOrCreateAccount('second-periodic');
  const second=f.db.createCharacterInSlot('second-periodic',account.id,0,'Segundo',CharacterClass.CLERIGO);
  second.level=25;second.recalculateStatsFromEquipment();second.currentResource=second.maxResource;
  f.world.enterWorld({id:second.id,accountId:account.id,isAuthenticated:true,send:()=>{}} as unknown as Connection,second);
  f.world.castPlayerSkill(second,3);assert.equal(f.target.getMovementMultiplier(),.6);
  f.world.removePlayerFromWorld(f.connection,false);
  assert.equal(f.target.getMovementMultiplier(),.6);assert.equal(f.target.getStatus('SLOW')!.sourceEntityId,second.id);
  f.world.updateCombatStatuses(6.01);assert.equal(f.target.hasStatus('SLOW'),false);
});

test('Cura periódica soma 30% do HP capturado no rank 1 e não recebe crítico ou cura excedente',t=>{
  const f=fixture(t,'clerigo_nv2_3');f.player.currentHp=1;
  f.world.castPlayerSkill(f.player,3);const captured=f.player.getStatus('SANCTUARY')!.magnitude;
  f.world.updateCombatStatuses(6.01);
  assert.equal(captured,Math.round(f.player.maxHp*.3));assert.equal(f.player.currentHp,1+captured);
  const heals=f.packets.filter(p=>p.op===Opcode.S2C_COMBAT_STATUS_EVENT&&p.data.tickHeal!==undefined);
  assert.equal(heals.length,6);assert.equal(heals.reduce((n,p)=>n+p.data.tickHeal,0),captured);
});
