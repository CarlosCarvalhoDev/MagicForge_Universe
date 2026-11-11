import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, Opcode, SKILLS_DATABASE, calculateSkillPower, createVector3, getSkillTargeting, canUpgradeSkillPower, isHybridHealingSkill } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { Monster, MonsterState } from '../src/entities/Monster';
import type { Connection } from '../src/network/Connection';

const originalRandom=Math.random, originalNow=Date.now;
function fixture(t: TestContext, skillId: string) {
  let clock=1_800_000_000_000; Math.random=()=>.999; Date.now=()=>++clock;
  t.after(()=>{Math.random=originalRandom;Date.now=originalNow;});
  const db=new DatabaseManager(':memory:');t.after(()=>db.close());
  const world=new World(db);world.automationEnabled=false;
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('monk'),player=db.createCharacterInSlot('monk',account.id,0,'MongeTeste',CharacterClass.MONGE);
  player.level=50;player.recalculateStatsFromEquipment();player.attributes.destreza=20;player.attributes.sabedoria=10;player.currentHp=player.maxHp;player.currentResource=100;
  player.farmSettings.autoHpPotionEnabled=false;player.farmSettings.autoMpPotionEnabled=false;player.setEquippedSkill(SKILLS_DATABASE[skillId].slot,skillId);
  const packets:Array<{op:Opcode;data:any}>=[];
  const connection={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;
  world.enterWorld(connection,player);player.position=createVector3(0,0,0);
  const enemy=(id:string,x:number,z=0,hp=100000)=>{const monster=new Monster(id,id,createVector3(x,0,z),hp,100);monster.aggroRadius=0;monster.speed=0;monster.autoRespawns=false;monster.lootTable=[];monster.expReward=0;world.entityManager.addMonster(monster);world.spatialGrid.updateEntity(monster);return monster;};
  const target=enemy('prey',2);
  const casts=()=>packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_EVENT);
  const ticks=()=>packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='STATUS_TICK');
  const reset=(id:string)=>{player.skillCooldowns.clear();player.currentResource=100;player.setEquippedSkill(SKILLS_DATABASE[id].slot,id);};
  const cast=(id=skillId)=>world.castPlayerSkill(player,SKILLS_DATABASE[id].slot,target.id,target.position);
  return {db,world,account,player,packets,connection,target,enemy,casts,ticks,reset,cast};
}

for(const [id,count,duration] of [['monge_truque_1',2,.2],['monge_nv1_1',4,.5]] as const){
  test(`${id}: ${count} impactos reais dividem a potência e cobram uma única vez`,t=>{
    const f=fixture(t,id);assert.equal(f.cast(),true);assert.equal(f.target.currentHp,100000);const resource=f.player.currentResource;
    f.world.updateCombatStatuses(duration+.01);
    assert.equal(f.ticks().length,count);assert.equal(100000-f.target.currentHp,calculateSkillPower(SKILLS_DATABASE[id],f.player.attributes,50));assert.equal(f.player.currentResource,resource);
    f.world.updateCombatStatuses(2);assert.equal(f.ticks().length,count);assert.equal(f.cast(),false);
  });
}

test('Palma e Rajada coexistem e capturam potência/evolução da conjuração',t=>{
  const f=fixture(t,'monge_truque_1');f.player.skillLevels.monge_truque_1=2;f.cast();const palm=f.player.getStatus('CHI_PALMS')!.magnitude;
  assert.equal(palm,Math.round(Math.round(206+1.35*20)*1.05));
  f.player.setEquippedSkill(2,'monge_nv1_1');f.cast('monge_nv1_1');const flurry=f.player.getStatus('FLURRY')!.magnitude;
  f.player.attributes.destreza=500;f.world.updateCombatStatuses(1);assert.equal(f.ticks().length,6);assert.equal(100000-f.target.currentHp,palm+flurry);
});

test('Rajada interrompe se alvo sai do alcance e não escolhe substituto',t=>{
  const f=fixture(t,'monge_nv1_1');f.cast();f.world.updateCombatStatuses(.125);const hp=f.target.currentHp;f.target.position.x=3.01;
  f.world.updateCombatStatuses(1);assert.equal(f.target.currentHp,hp);assert.equal(f.ticks().length,1);
  const g=fixture(t,'monge_nv1_1'),other=g.enemy('other',2.1);g.target.currentHp=1;g.cast();g.world.updateCombatStatuses(1);assert.equal(g.ticks().length,1);assert.equal(other.currentHp,100000);
});

test('Atordoamento, morte ou saída interrompem socos pendentes',t=>{
  const f=fixture(t,'monge_nv1_1');f.cast();f.player.addStatus({statusId:'stun',type:'STUN',sourceEntityId:f.player.id,targetEntityId:f.player.id,skillId:'test',durationSec:1,remainingSec:1,expiresAtTick:20,magnitude:1});
  f.world.updateCombatStatuses(.5);assert.equal(f.ticks().length,0);
  const g=fixture(t,'monge_truque_1');g.cast();g.player.takeDamage(g.player.maxHp*2);g.world.updateCombatStatuses(1);assert.equal(g.ticks().length,0);
  const h=fixture(t,'monge_nv1_1');h.cast();h.world.removePlayerFromWorld(h.connection,false);h.world.updateCombatStatuses(1);assert.equal(h.ticks().length,0);
});

test('Chute atinge o alvo escolhido e só um segundo inimigo dentro de 3m do monge',t=>{
  const f=fixture(t,'monge_truque_2'),near=f.enemy('near',2.2),third=f.enemy('third',2.3),outside=f.enemy('outside',3.01);
  f.cast();const expected=Math.round(206+1.2*20+.3*10);
  assert.equal(100000-f.target.currentHp,expected);assert.equal(100000-near.currentHp,expected);assert.equal(third.currentHp,100000);assert.equal(outside.currentHp,100000);assert.equal(f.casts()[0].data.targetResults.length,2);
});

test('Ponto Vital reduz frequência em 20%, sem mexer no intervalo já iniciado',t=>{
  const f=fixture(t,'monge_truque_3');f.target.attackCooldown=.7;f.cast();assert.equal(f.target.attackCooldown,.7);
  assert.equal(f.target.getAttackSpeedMultiplier(),1.25);f.target.state=MonsterState.ATTACKING;f.target.targetPlayer=f.player;f.target.attackCooldown=0;
  const hp=f.player.currentHp;(f.world as any).processMonsterCombat(f.target);assert.equal(hp-f.player.currentHp,100);assert.equal(f.target.attackCooldown,f.target.attackIntervalSec*1.25);
  f.world.updateCombatStatuses(4.01);assert.equal(f.target.getAttackSpeedMultiplier(),1);
});

test('Ponto Vital renova sem somar e é limpo na saída do autor',t=>{
  const f=fixture(t,'monge_truque_3');f.cast();f.reset('monge_truque_3');f.cast();assert.equal(f.target.getAttackSpeedMultiplier(),1.25);
  f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.hasStatus('ATTACK_SLOW'),false);
});

test('Passo soma 35pp de esquiva e 15pp de crítico, não teleporta e não empilha',t=>{
  const f=fixture(t,'monge_nv1_2');const position={...f.player.position};f.cast();assert.deepEqual(f.player.position,position);
  assert.ok(Math.abs(f.player.getDodgeChance(.2)-.55)<1e-8);assert.ok(Math.abs(f.player.getCriticalChance(.4)-.55)<1e-8);
  f.reset('monge_nv1_2');f.cast();assert.ok(Math.abs(f.player.getDodgeChance(.2)-.55)<1e-8);assert.equal(f.player.getDodgeChance(.9),1);assert.equal(f.player.getCriticalChance(.9),1);
  assert.equal(canUpgradeSkillPower(SKILLS_DATABASE.monge_nv1_2),false);f.world.updateCombatStatuses(5.01);assert.equal(f.player.getDodgeChance(.2),.2);assert.equal(f.player.getCriticalChance(.4),.4);
});

test('Passo altera as rolagens reais de ataque e esquiva durante a janela',t=>{
  const f=fixture(t,'monge_nv1_2');f.cast();Math.random=()=>.5;
  f.reset('monge_truque_2');f.cast('monge_truque_2');assert.equal(f.casts().at(-1)!.data.isCritical,true);
  f.target.state=MonsterState.ATTACKING;f.target.targetPlayer=f.player;f.target.attackCooldown=0;const hp=f.player.currentHp;(f.world as any).processMonsterCombat(f.target);assert.equal(f.player.currentHp,hp);
  f.world.updateCombatStatuses(5.01);f.target.attackCooldown=0;(f.world as any).processMonsterCombat(f.target);assert.equal(hp-f.player.currentHp,100);
});

test('Lótus usa SAB+DEX e evolução, não crítico, e limita cura à vida faltante',t=>{
  const f=fixture(t,'monge_nv1_3');f.player.currentHp=1;f.player.skillLevels.monge_nv1_3=2;Math.random=()=>0;f.cast();
  assert.equal(f.player.currentHp,1+Math.round((1.6*10+1.2*20)*1.05));assert.equal(f.casts()[0].data.isCritical,false);
  f.reset('monge_nv1_3');f.player.currentHp=f.player.maxHp-3;f.cast();assert.equal(f.casts().at(-1)!.data.damageOrHeal,3);assert.equal(f.player.currentHp,f.player.maxHp);
});

test('Golpe Atordoante para movimento e ataques por 2.5s',t=>{
  const f=fixture(t,'monge_nv2_1');f.cast();assert.equal(f.target.getStatus('STUN')!.remainingSec,2.5);
  f.target.targetPlayer=f.player;f.target.state=MonsterState.ATTACKING;f.target.attackCooldown=0;const hp=f.player.currentHp;(f.world as any).processMonsterCombat(f.target);assert.equal(f.player.currentHp,hp);
  f.world.updateCombatStatuses(2.51);(f.world as any).processMonsterCombat(f.target);assert.equal(hp-f.player.currentHp,100);
});

test('Atordoamento não encurta efeito mais longo e o próprio efeito limpa na saída',t=>{
  const f=fixture(t,'monge_nv2_1');f.target.addStatus({statusId:'long',type:'STUN',sourceEntityId:f.player.id,targetEntityId:f.target.id,skillId:'test',durationSec:5,remainingSec:5,expiresAtTick:100,magnitude:1});
  f.cast();assert.equal(f.target.getStatus('STUN')!.remainingSec,5);f.target.clearAllStatuses();f.reset('monge_nv2_1');f.cast();f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.isStunned(),false);
});

test('Sopro usa cone de 5m/60 graus com SAB+DEX, sem atingir atrás ou fora da borda',t=>{
  const f=fixture(t,'monge_nv2_2'),edge=f.enemy('edge',5),side=f.enemy('side',2,2),behind=f.enemy('behind',-1),outside=f.enemy('outside',5.01);
  f.cast();assert.equal(100000-f.target.currentHp,Math.round(206+2.4*10+20));assert.ok(edge.currentHp<100000);assert.equal(side.currentHp,100000);assert.equal(behind.currentHp,100000);assert.equal(outside.currentHp,100000);
  const event=f.casts()[0].data;assert.equal(event.geometry,'CONE');assert.equal(event.coneRange,5);assert.equal(event.coneAngleDeg,60);assert.equal(getSkillTargeting(SKILLS_DATABASE.monge_nv2_2).geometry,'CONE');
});

test('Sombras dividem a potência em três impactos simultâneos por alvo',t=>{
  const f=fixture(t,'monge_nv2_3'),edge=f.enemy('edge',6.5),outside=f.enemy('outside',6.51);f.cast();
  const power=calculateSkillPower(SKILLS_DATABASE.monge_nv2_3,f.player.attributes,50);assert.equal(100000-f.target.currentHp,power);assert.equal(100000-edge.currentHp,power);assert.equal(outside.currentHp,100000);
  assert.equal(f.casts()[0].data.targetResults.length,6);
});

test('Palma dos Cinco Pontos usa impacto único sem execução instantânea escondida',t=>{
  const f=fixture(t,'monge_nv3_1');f.target.currentHp=1000;f.cast();assert.equal(1000-f.target.currentHp,Math.round(206+4.6*20+2*10));assert.equal(f.target.isDead,false);assert.equal(f.casts()[0].data.targetResults.length,1);
});

test('Ascensão aplica área de 8m e dobra corrida por 6s sem alterar velocidade base',t=>{
  const f=fixture(t,'monge_nv3_2'),edge=f.enemy('edge',10),outside=f.enemy('outside',10.01);const speed=f.player.speed;f.cast();
  assert.ok(edge.currentHp<100000);assert.equal(outside.currentHp,100000);assert.equal(f.player.getMovementMultiplier(),2);assert.equal(f.player.speed,speed);
  f.player.setMoveDirection(createVector3(1,0,0),0);f.player.update(.1);assert.ok(Math.abs(f.player.position.x-speed*.2)<1e-8);
  f.player.position=createVector3(0,0,0);f.player.setMoveDestination(createVector3(20,0,0),0);f.player.update(.1);assert.ok(Math.abs(f.player.position.x-speed*.2)<1e-8);
  f.world.updateCombatStatuses(6.01);assert.equal(f.player.getMovementMultiplier(),1);assert.equal(f.player.speed,speed);
});

test('Corrida renova sem multiplicar aplicações e mantém limites do mapa',t=>{
  const f=fixture(t,'monge_nv3_2');f.cast();f.reset('monge_nv3_2');f.cast();assert.equal(f.player.getMovementMultiplier(),2);
  f.player.position.x=59;f.player.setMoveDirection(createVector3(1,0,0),0);f.player.update(1);assert.equal(f.player.position.x,60);
  f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.player.getMovementMultiplier(),1);
});

test('Domo aplica seis pulsos de dano e cura própria, sem efeito instantâneo ou crítico',t=>{
  const f=fixture(t,'monge_nv3_3');f.player.currentHp=1;f.cast();const maxHp=f.player.maxHp;
  assert.equal(f.target.currentHp,100000);assert.equal(f.player.currentHp,1);assert.equal(f.casts()[0].data.isCritical,false);
  f.world.updateCombatStatuses(10);assert.equal(100000-f.target.currentHp,Math.round(206+3.9*10));assert.equal(f.player.currentHp,1+Math.round(maxHp*.3));assert.equal(f.ticks().length,6);
  f.world.updateCombatStatuses(10);assert.equal(f.ticks().length,6);assert.equal(f.target.isSilenced(),false);assert.equal(isHybridHealingSkill(SKILLS_DATABASE.monge_nv3_3),true);
});

test('Domo captura rank/dano/cura e cura somente o monge dentro da área fixa',t=>{
  const f=fixture(t,'monge_nv3_3');f.player.currentHp=1;f.player.skillLevels.monge_nv3_3=2;
  f.player.addStatus({statusId:'power',type:'DAMAGE_BUFF',sourceEntityId:f.player.id,targetEntityId:f.player.id,skillId:'test',durationSec:5,remainingSec:5,expiresAtTick:100,magnitude:.5});
  f.cast();const status=f.player.getStatus('ZEN_DOME')!;
  assert.equal(status.magnitude,Math.round(Math.round(Math.round(206+3.9*10)*1.05)*1.5));assert.equal(status.periodic!.totalHealing,Math.round(f.player.maxHp*.3*1.05));
  f.player.position.x=20;f.world.updateCombatStatuses(1);assert.equal(f.player.currentHp,1);assert.ok(f.target.currentHp<100000);
  f.player.position.x=0;f.world.updateCombatStatuses(1);assert.ok(f.player.currentHp>1);
});

test('Domo considera entrada/saída de inimigos e não segue o herói',t=>{
  const f=fixture(t,'monge_nv3_3'),edge=f.enemy('edge',8),outside=f.enemy('outside',8.01);f.cast();
  assert.equal(edge.isSilenced(),true);assert.equal(outside.isSilenced(),false);f.world.updateCombatStatuses(1);const hp=edge.currentHp;
  edge.position.x=8.01;outside.position.x=8;f.world.updateCombatStatuses(1);assert.equal(edge.currentHp,hp);assert.equal(edge.isSilenced(),false);assert.equal(outside.isSilenced(),true);assert.ok(outside.currentHp<100000);
});

test('Silêncio do Domo bloqueia habilidades sem impedir movimento ou ataque básico',t=>{
  const f=fixture(t,'monge_nv3_3');f.cast();assert.equal(f.target.isSilenced(),true);assert.equal(f.target.canUseSkills(),false);assert.equal(f.target.isStunned(),false);assert.equal(f.target.getMovementMultiplier(),1);
  f.target.state=MonsterState.ATTACKING;f.target.targetPlayer=f.player;f.target.attackCooldown=0;const hp=f.player.currentHp;(f.world as any).processMonsterCombat(f.target);assert.equal(hp-f.player.currentHp,100);
  const silence=f.target.getStatus('SILENCED')!;f.player.addStatus({...silence,statusId:'hero-silence',targetEntityId:f.player.id});const resource=f.player.currentResource;
  assert.equal(f.world.castPlayerSkill(f.player,1,f.target.id),false);assert.equal(f.player.currentResource,resource);assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_REJECTED).at(-1)!.data.reasonCode,'CASTER_SILENCED');
});

test('Domo pode ser colocado em área vazia para regenerar',t=>{
  const f=fixture(t,'monge_nv3_3');f.world.entityManager.removeMonster(f.target.id);f.player.currentHp=1;
  assert.equal(f.world.castPlayerSkill(f.player,4),true);f.world.updateCombatStatuses(1);assert.ok(f.player.currentHp>1);assert.equal(f.ticks().length,0);
});

test('Domo e silêncio encerram na morte ou saída do autor',t=>{
  const f=fixture(t,'monge_nv3_3');f.cast();f.player.takeDamage(f.player.maxHp*2);f.world.updateCombatStatuses(1);assert.equal(f.ticks().length,0);assert.equal(f.target.isSilenced(),false);
  const g=fixture(t,'monge_nv3_3');g.cast();g.world.removePlayerFromWorld(g.connection,false);assert.equal(g.target.isSilenced(),false);g.world.updateCombatStatuses(6);assert.equal(g.ticks().length,0);
});

test('Sobreposição de Domos mantém silêncio quando um dos autores sai',t=>{
  const f=fixture(t,'monge_nv3_3');f.cast();
  const other=f.db.createCharacterInSlot('other',f.account.id,1,'SegundoMonge',CharacterClass.MONGE);other.level=50;other.recalculateStatsFromEquipment();other.currentResource=100;other.setEquippedSkill(4,'monge_nv3_3');
  const connection={id:other.id,accountId:f.account.id,isAuthenticated:true,send(){}} as Connection;f.world.enterWorld(connection,other);other.position=createVector3(0,0,0);
  assert.equal(f.world.castPlayerSkill(other,4,f.target.id),true);f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.isSilenced(),true);assert.equal(f.target.getStatus('SILENCED')!.sourceEntityId,other.id);
});

test('Pulso do Domo que mata chefe reconhece vitória e recompensa uma vez',t=>{
  const f=fixture(t,'monge_nv3_3');f.world.challengeStageBoss(f.player);const boss=f.world.entityManager.getMonster(f.world.activeBossId!)!;boss.position=createVector3(2,0,0);boss.currentHp=1;
  assert.equal(f.world.castPlayerSkill(f.player,4,boss.id),true);f.world.updateCombatStatuses(1);assert.equal(boss.isDead,true);assert.equal(f.world.isPortalOpen,true);
  const kills=f.player.huntSession.snapshot().kills;f.world.updateCombatStatuses(10);assert.equal(f.player.huntSession.snapshot().kills,kills);assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_BOSS_EVENT&&p.data.eventType==='VICTORY').length,1);
});

test('Validação de nível, recurso, distância e posição acontece antes da cobrança',t=>{
  const f=fixture(t,'monge_nv3_2');f.player.level=49;assert.equal(f.cast(),false);assert.equal(f.player.currentResource,100);f.player.level=50;
  assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(NaN,0,0)),false);assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(9,0,0)),false);assert.equal(f.player.getSkillCooldown(4),0);
  f.reset('monge_truque_1');f.target.position.x=3.01;assert.equal(f.cast('monge_truque_1'),false);assert.equal(f.player.currentResource,100);f.target.position.x=2;f.player.currentResource=0;assert.equal(f.cast('monge_truque_1'),false);
});

test('AUTO usa Passo na ordem escolhida e não conjura silenciado; básicos continuam',t=>{
  const f=fixture(t,'monge_nv1_2');f.player.skillCastOrder=[2,1,3,4];f.world.automationEnabled=true;f.world.update(.05);assert.equal(f.casts()[0].data.skillId,'monge_nv1_2');
  f.player.addStatus({statusId:'silence',type:'SILENCED',sourceEntityId:f.player.id,targetEntityId:f.player.id,skillId:'test',durationSec:3,remainingSec:3,expiresAtTick:60,magnitude:1});
  f.player.attackTimer=0;f.world.update(.1);assert.equal(f.casts().length,1);assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_REJECTED).length,0);assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
});
