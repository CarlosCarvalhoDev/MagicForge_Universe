import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterClass,Opcode,SKILLS_DATABASE,calculateSkillPower,createVector3} from '@magicforge/shared';
import {DatabaseManager} from '../src/database/DatabaseManager';
import {World} from '../src/game/World';
import {Monster,MonsterState} from '../src/entities/Monster';
import type {Connection} from '../src/network/Connection';
const originalRandom=Math.random;
function fixture(t:TestContext,cls:CharacterClass,skill:string){
  Math.random=()=>.999;t.after(()=>{Math.random=originalRandom;});const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);world.automationEnabled=false;
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('martial'),player=db.createCharacterInSlot('martial',account.id,0,'Marcial',cls);player.level=50;player.recalculateStatsFromEquipment();player.currentHp=player.maxHp;player.currentResource=100;player.setEquippedSkill(SKILLS_DATABASE[skill].slot,skill);
  const packets:Array<{op:Opcode;data:any}>=[];const connection={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;world.enterWorld(connection,player);
  const enemy=(id:string,x:number,hp=100000)=>{const monster=new Monster(id,id,createVector3(x,0,0),hp,100);monster.speed=0;monster.aggroRadius=0;monster.lootTable=[];monster.expReward=0;world.entityManager.addMonster(monster);return monster;};
  const target=enemy('target',1);const casts=()=>packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_EVENT);const ticks=()=>packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='STATUS_TICK');
  return {db,world,player,target,enemy,packets,connection,casts,ticks};
}
const warrior=(t:TestContext,skill:string)=>fixture(t,CharacterClass.GUERREIRO,skill);
const barb=(t:TestContext,skill:string)=>fixture(t,CharacterClass.BARBARO,skill);

test('Guerreiro: sangramento resolve três pulsos mesmo em atualização longa e não repete após expirar',t=>{
  const f=warrior(t,'guerreiro_truque_2');f.world.castPlayerSkill(f.player,1,f.target.id);const perTick=f.target.getStatus('BLEED')!.magnitude,hp=f.target.currentHp;
  f.world.updateCombatStatuses(10);assert.equal(hp-f.target.currentHp,perTick*3);assert.equal(f.ticks().length,3);f.world.updateCombatStatuses(10);assert.equal(f.ticks().length,3);
});
test('Guerreiro: sair ou morrer encerra sangramento antes de causar dano sem dono',t=>{
  const f=warrior(t,'guerreiro_truque_2');f.world.castPlayerSkill(f.player,1,f.target.id);const hp=f.target.currentHp;f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.hasStatus('BLEED'),false);f.world.updateCombatStatuses(3);assert.equal(f.target.currentHp,hp);
  const g=warrior(t,'guerreiro_truque_2');g.world.castPlayerSkill(g.player,1,g.target.id);g.player.takeDamage(g.player.maxHp*10);g.world.updateCombatStatuses(1);assert.equal(g.ticks().length,0);
});
test('Guerreiro: reflexão que mata chefe reconhece vitória, abre portal e recompensa uma única vez',t=>{
  const f=warrior(t,'guerreiro_nv2_2');f.world.castPlayerSkill(f.player,3);f.world.challengeStageBoss(f.player);const boss=f.world.entityManager.getMonster(f.world.activeBossId!)!;
  boss.currentHp=1;boss.attackDamage=100;boss.state=MonsterState.ATTACKING;boss.targetPlayer=f.player;boss.attackCooldown=0;(f.world as any).processMonsterCombat(boss);
  assert.equal(boss.isDead,true);assert.equal(f.world.isBossActive,false);assert.equal(f.world.isPortalOpen,true);assert.equal(f.player.unlockedWorld,2);const kills=f.player.huntSession.snapshot().kills;
  (f.world as any).processMonsterCombat(boss);assert.equal(f.player.huntSession.snapshot().kills,kills);assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_BOSS_EVENT&&p.data.eventType==='VICTORY').length,1);
});
test('Guerreiro: Golpe Colossal mantém inimigo dentro dos limites do mapa',t=>{
  const f=warrior(t,'guerreiro_nv2_3');f.player.position.x=59;f.target.position.x=59.5;f.world.castPlayerSkill(f.player,3,undefined,f.target.position);assert.equal(f.target.position.x,60);assert.ok(f.target.currentHp<100000);
});
test('Guerreiro: Última Resistência funciona no automático com HP cheio, soma onda ao evento e protege da morte',t=>{
  const f=warrior(t,'guerreiro_nv3_3');f.player.skillCastOrder=[4,1,2,3];f.world.automationEnabled=true;f.world.update(.05);const event=f.casts()[0].data;
  assert.equal(event.skillId,'guerreiro_nv3_3');assert.ok(f.player.hasStatus('DEATH_IMMUNITY'));assert.equal(event.damageOrHeal,event.targetResults.reduce((n:number,r:any)=>n+r.effectiveDamage+r.effectiveHeal,0));
  f.player.takeDamage(f.player.maxHp*10);assert.equal(f.player.currentHp,1);assert.equal(f.player.isDead,false);f.world.updateCombatStatuses(6);f.player.takeDamage(1);assert.equal(f.player.isDead,true);
});
test('Guerreiro: Avatar também amplifica a onda da Última Resistência sem alterar o ataque básico base',t=>{
  const f=warrior(t,'guerreiro_nv3_1');f.world.castPlayerSkill(f.player,4);f.player.skillCooldowns.clear();f.player.currentResource=100;f.player.setEquippedSkill(4,'guerreiro_nv3_3');const hp=f.target.currentHp;
  f.world.castPlayerSkill(f.player,4);assert.equal(hp-f.target.currentHp,Math.round((f.player.attributes.forca*2+f.player.attributes.constituicao)*1.3));
});
test('Bárbaro: Cutilada preserva curva de nível e Pisotão aplica lentidão real sem somar percentuais',t=>{
  const f=barb(t,'barbaro_truque_1');f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(100000-f.target.currentHp,Math.round(6+4*f.player.level+1.4*f.player.attributes.forca));
  f.player.skillCooldowns.clear();f.player.setEquippedSkill(1,'barbaro_truque_2');f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(f.target.getMovementMultiplier(),.7);
  const cripple=f.target.getStatus('CRIPPLED')!;f.target.addStatus({...cripple,type:'FROST_SLOW',statusId:'frost-test',magnitude:.35});assert.equal(f.target.getMovementMultiplier(),.65);f.target.removeStatus('frost-test');f.world.updateCombatStatuses(3.01);assert.equal(f.target.getMovementMultiplier(),1);
});
test('Bárbaro: Mordida cura somente 20% do HP retirado, nunca overkill ou dano absorvido',t=>{
  const f=barb(t,'barbaro_truque_3');f.player.currentHp=1;f.target.currentHp=10;f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(f.player.currentHp,3);assert.equal(f.casts()[0].data.damageOrHeal,12);
  const other=f.enemy('shielded',1);other.addStatus({statusId:'shield',type:'SHIELD',skillId:'test',sourceEntityId:other.id,targetEntityId:other.id,durationSec:5,remainingSec:5,expiresAtTick:100,magnitude:9999,remainingAbsorption:9999});
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,1,other.id);assert.equal(f.player.currentHp,3);
});
test('Bárbaro: Rugido reduz ataque em área, não causa dano direto e evolução aumenta a redução',t=>{
  const f=barb(t,'barbaro_nv1_2'),outside=f.enemy('outside',5.01);f.player.skillLevels.barbaro_nv1_2=2;f.world.castPlayerSkill(f.player,2);
  assert.equal(f.target.currentHp,100000);assert.equal(outside.hasStatus('WEAKENED'),false);assert.ok(Math.abs(f.target.getStatus('WEAKENED')!.magnitude-.21)<1e-8);
  f.target.state=MonsterState.ATTACKING;f.target.targetPlayer=f.player;f.target.attackCooldown=0;const hp=f.player.currentHp;(f.world as any).processMonsterCombat(f.target);assert.equal(hp-f.player.currentHp,79);
  f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.hasStatus('WEAKENED'),false);
});
test('Bárbaro: Carga desloca o herói e aplica dois segundos de atordoamento',t=>{
  const f=barb(t,'barbaro_nv1_3');f.target.position.x=4;f.world.castPlayerSkill(f.player,2,f.target.id);assert.equal(f.player.position.x,2.5);assert.equal(f.target.getStatus('STUN')!.remainingSec,2);assert.equal(f.casts()[0].data.originPosition.x,0);f.world.updateCombatStatuses(2.01);assert.equal(f.target.isStunned(),false);
});
test('Bárbaro: Banho de Sangue é pessoal, aplica sangramento em área e respeita limite de raio',t=>{
  const f=barb(t,'barbaro_nv2_1'),edge=f.enemy('edge',5),outside=f.enemy('outside',5.01);f.world.castPlayerSkill(f.player,3);const hp=f.target.currentHp,bleed=f.target.getStatus('BLEED')!.magnitude;
  assert.ok(edge.hasStatus('BLEED'));assert.equal(outside.currentHp,100000);f.world.updateCombatStatuses(10);assert.equal(hp-f.target.currentHp,bleed*3);assert.equal(f.ticks().length,6);
});
test('Bárbaro: Pele cura 15% do HP e usa maior redução sem somar com Fúria',t=>{
  const f=barb(t,'barbaro_nv2_2');f.world.castPlayerSkill(f.player,2);f.world.castPlayerSkill(f.player,3);const hp=f.player.currentHp;f.player.takeDamage(100);assert.equal(hp-f.player.currentHp,80);
  f.player.currentHp=1;f.player.currentResource=100;f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,3);assert.equal(f.player.currentHp,1+Math.round(f.player.maxHp*.15));f.world.updateCombatStatuses(6.01);assert.equal(f.player.hasStatus('STONE_SKIN'),false);
});
test('Bárbaro: Salto muda posição autoritativa e rejeita destino fora do mapa sem gastar',t=>{
  const f=barb(t,'barbaro_nv2_3');f.player.position.x=58;f.target.position.x=63;const resource=f.player.currentResource;assert.equal(f.world.castPlayerSkill(f.player,3,undefined,createVector3(63,0,0)),false);assert.equal(f.player.currentResource,resource);
  const g=barb(t,'barbaro_nv2_3');assert.equal(g.world.castPlayerSkill(g.player,3,undefined,createVector3(1,1,0)),false);assert.equal(g.player.currentResource,100);g.world.castPlayerSkill(g.player,3,undefined,g.target.position);assert.equal(g.player.position.x,1);assert.equal(g.player.position.y,0);assert.equal(g.casts()[0].data.originPosition.x,0);assert.ok(g.target.currentHp<100000);
});
test('Bárbaro: Cólera paga ativação e libera energia por 6s, preservando cooldown e validações',t=>{
  const f=barb(t,'barbaro_nv3_1');f.world.castPlayerSkill(f.player,4);assert.equal(f.player.currentResource,35);assert.ok(f.player.hasStatus('UNBRIDLED_RAGE'));
  f.player.currentResource=0;assert.equal(f.world.castPlayerSkill(f.player,1,f.target.id),true);assert.equal(f.player.currentResource,0);assert.equal(f.world.castPlayerSkill(f.player,1,f.target.id),false);
  f.player.skillCooldowns.delete(1);f.player.resourceRegenPerSec=0;f.player.skillCastOrder=[1,2,3,4];f.world.automationEnabled=true;f.world.update(.05);assert.equal(f.casts().at(-1)!.data.slot,1);
  f.world.automationEnabled=false;f.world.updateCombatStatuses(6.01);f.player.skillCooldowns.clear();f.player.currentResource=0;assert.equal(f.world.castPlayerSkill(f.player,1,f.target.id),false);
});
test('Bárbaro: Guilhotina dobra apenas abaixo de 30%, usando HP anterior ao impacto',t=>{
  const f=barb(t,'barbaro_nv3_2'),power=calculateSkillPower(SKILLS_DATABASE.barbaro_nv3_2,f.player.attributes,f.player.level);
  f.target.currentHp=30000;f.world.castPlayerSkill(f.player,4,f.target.id);assert.equal(f.target.currentHp,30000-power);
  f.player.currentResource=100;f.player.skillCooldowns.clear();f.target.currentHp=29999;f.world.castPlayerSkill(f.player,4,f.target.id);assert.equal(f.target.currentHp,29999-power*2);
});
test('Bárbaro: Matilha distribui potência em dez pulsos e termina ao morrer ou sair',t=>{
  const f=barb(t,'barbaro_nv3_3');f.world.castPlayerSkill(f.player,4);const power=f.player.getStatus('SPECTRAL_PACK')!.magnitude;assert.equal(f.target.currentHp,100000);f.world.updateCombatStatuses(10.01);assert.equal(100000-f.target.currentHp,power);assert.equal(f.ticks().length,10);
  const g=barb(t,'barbaro_nv3_3');g.world.castPlayerSkill(g.player,4);g.world.removePlayerFromWorld(g.connection,false);g.world.updateCombatStatuses(10);assert.equal(g.ticks().length,0);
});
test('Bárbaro: Matilha acompanha o herói e não continua atingindo área antiga',t=>{
  const f=barb(t,'barbaro_nv3_3'),next=f.enemy('next',21);f.world.castPlayerSkill(f.player,4);f.world.updateCombatStatuses(1);const hp=f.target.currentHp;f.player.position.x=20;f.world.updateCombatStatuses(9);assert.equal(f.target.currentHp,hp);assert.equal(f.ticks().filter(p=>p.data.targetId===next.id).length,9);
});
test('Bárbaro: nível e alvo inválidos não consomem recurso e proteção funciona no AUTO com HP cheio',t=>{
  const f=barb(t,'barbaro_nv2_2');f.player.level=24;const resource=f.player.currentResource;assert.equal(f.world.castPlayerSkill(f.player,3),false);assert.equal(f.player.currentResource,resource);f.player.level=50;f.world.automationEnabled=true;f.player.skillCastOrder=[3,1,2,4];f.world.update(.05);assert.equal(f.casts()[0].data.skillId,'barbaro_nv2_2');assert.ok(f.player.hasStatus('STONE_SKIN'));
});
