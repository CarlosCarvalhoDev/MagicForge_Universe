import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterClass,Opcode,SKILLS_DATABASE,calculateSkillPower,createVector3,canUpgradeSkillPower} from '@magicforge/shared';
import {DatabaseManager} from '../src/database/DatabaseManager';
import {World} from '../src/game/World';
import {Monster,MonsterState} from '../src/entities/Monster';
import type {Connection} from '../src/network/Connection';
const originalRandom=Math.random,originalNow=Date.now;
function fixture(t:TestContext,skillId:string){
  let clock=1_800_000_000_000;Math.random=()=>.999;Date.now=()=>++clock;t.after(()=>{Math.random=originalRandom;Date.now=originalNow;});
  const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);world.automationEnabled=false;
  for(const m of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(m.id);world.spatialGrid.removeEntity(m.id);}
  const account=db.getOrCreateAccount('warlock'),player=db.createCharacterInSlot('warlock',account.id,0,'BruxoTeste',CharacterClass.BRUXO);
  player.level=50;player.recalculateStatsFromEquipment();player.attributes.carisma=20;player.attributes.destreza=10;player.currentHp=player.maxHp;player.currentResource=100;
  player.farmSettings.autoHpPotionEnabled=false;player.farmSettings.autoMpPotionEnabled=false;player.setEquippedSkill(SKILLS_DATABASE[skillId].slot,skillId);
  const packets:Array<{op:Opcode;data:any}>=[];const connection={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;world.enterWorld(connection,player);player.position=createVector3(0,0,0);
  const enemy=(id:string,x:number,z=0,hp=100000)=>{const m=new Monster(id,id,createVector3(x,0,z),hp,100);m.aggroRadius=0;m.speed=0;m.autoRespawns=false;m.lootTable=[];m.expReward=0;world.entityManager.addMonster(m);world.spatialGrid.updateEntity(m);return m;};
  const target=enemy('prey',2),casts=()=>packets.filter(p=>p.op===Opcode.S2C_SKILL_CAST_EVENT),ticks=()=>packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='STATUS_TICK');
  const reset=(id:string)=>{player.skillCooldowns.clear();player.currentResource=100;player.setEquippedSkill(SKILLS_DATABASE[id].slot,id);};
  const cast=(id=skillId)=>world.castPlayerSkill(player,SKILLS_DATABASE[id].slot,target.id,target.position);
  return {db,world,account,player,packets,connection,target,enemy,casts,ticks,reset,cast};
}
test('Rajada Mística usa CAR, base de nível e evolução sem cobrar duas vezes',t=>{
  const f=fixture(t,'bruxo_truque_1');f.player.skillLevels.bruxo_truque_1=2;f.cast();assert.equal(100000-f.target.currentHp,Math.round(Math.round(206+1.45*20)*1.05));assert.equal(f.player.currentResource,90);assert.equal(f.cast(),false);assert.equal(f.player.currentResource,90);
});
test('Toque Necrótico corta cura recebida por 4s, sem criar autocura',t=>{
  const f=fixture(t,'bruxo_truque_2');f.player.currentHp=1;f.cast();const hp=f.target.currentHp;assert.equal(f.target.heal(100),50);assert.equal(f.target.currentHp,hp+50);assert.equal(f.player.currentHp,1);
  f.world.updateCombatStatuses(4.01);assert.equal(f.target.heal(100),100);
});
test('Redução de cura renova sem somar e limpa ao sair',t=>{
  const f=fixture(t,'bruxo_truque_2');f.cast();f.reset('bruxo_truque_2');f.cast();assert.equal(f.target.heal(100),50);f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.heal(100),100);
});
test('Praga tem quatro pulsos capturados, sem crítico periódico e sem pulsos extras',t=>{
  const f=fixture(t,'bruxo_truque_3');f.player.skillLevels.bruxo_truque_3=2;f.cast();const hp=f.target.currentHp;assert.equal(f.target.getStatus('DARK_PLAGUE')!.magnitude,13);
  f.player.attributes.carisma=500;f.world.updateCombatStatuses(10);assert.equal(hp-f.target.currentHp,13);assert.equal(f.ticks().length,4);assert.ok(f.ticks().every(p=>!p.data.isCritical));f.world.updateCombatStatuses(10);assert.equal(f.ticks().length,4);
});
test('Praga renova e desaparece com morte ou saída do autor',t=>{
  const f=fixture(t,'bruxo_truque_3');f.cast();f.world.updateCombatStatuses(1);f.reset('bruxo_truque_3');f.cast();const hp=f.target.currentHp;f.world.updateCombatStatuses(4);assert.equal(hp-f.target.currentHp,12);assert.equal(f.ticks().length,5);
  const g=fixture(t,'bruxo_truque_3');g.cast();g.player.takeDamage(g.player.maxHp*2);g.world.updateCombatStatuses(4);assert.equal(g.ticks().length,0);
  const h=fixture(t,'bruxo_truque_3');h.cast();h.world.removePlayerFromWorld(h.connection,false);assert.equal(h.target.hasStatus('DARK_PLAGUE'),false);
});
test('Hex amplifica todo dano, não causa impacto direto e regenera apenas seu autor',t=>{
  const f=fixture(t,'bruxo_nv1_1');f.player.currentHp=1;f.cast();assert.equal(f.target.currentHp,100000);assert.equal(f.casts()[0].data.damageOrHeal,0);
  const other=f.db.createCharacterInSlot('other',f.account.id,1,'Outro',CharacterClass.GUERREIRO);f.target.takeDamage(100,other);assert.equal(f.target.currentHp,99875);f.target.takeDamage(100);assert.equal(f.target.currentHp,99750);
  f.world.updateCombatStatuses(8.01);assert.equal(f.player.currentHp,1+Math.round(f.player.maxHp*.08));assert.equal(f.target.hasStatus('HEXED'),false);
});
test('Hex evolui percentual/cura e trocar presa encerra a maldição anterior',t=>{
  const f=fixture(t,'bruxo_nv1_1');f.player.skillLevels.bruxo_nv1_1=2;f.cast();assert.ok(Math.abs(f.target.getStatus('HEXED')!.magnitude-.2625)<1e-8);assert.equal(f.player.getStatus('HEX_REGEN')!.periodic!.totalHealing,Math.round(f.player.maxHp*.08*1.05));
  const next=f.enemy('next',3);f.reset('bruxo_nv1_1');f.world.castPlayerSkill(f.player,2,next.id);assert.equal(f.target.hasStatus('HEXED'),false);assert.equal(next.hasStatus('HEXED'),true);
  next.isDead=true;f.player.currentHp=1;f.world.updateCombatStatuses(1);assert.equal(f.player.currentHp,1);assert.equal(f.player.hasStatus('HEX_REGEN'),false);
});
test('Hex de outro autor substitui a marca sem continuar curando o autor anterior',t=>{
  const f=fixture(t,'bruxo_nv1_1');f.player.currentHp=1;f.cast();
  const other=f.db.createCharacterInSlot('other',f.account.id,1,'SegundoBruxo',CharacterClass.BRUXO);other.level=50;other.recalculateStatsFromEquipment();other.currentHp=1;other.currentResource=100;other.setEquippedSkill(2,'bruxo_nv1_1');
  const connection={id:other.id,accountId:f.account.id,isAuthenticated:true,send(){}} as Connection;f.world.enterWorld(connection,other);other.position=createVector3(0,0,0);
  assert.equal(f.world.castPlayerSkill(other,2,f.target.id),true);f.world.updateCombatStatuses(1);assert.equal(f.player.currentHp,1);assert.ok(other.currentHp>1);
});
test('Agathys absorve e retalia valor fixo inclusive no golpe que quebra o escudo',t=>{
  const f=fixture(t,'bruxo_nv1_2');f.cast();const shield=f.player.getStatus('SHIELD')!,hp=f.player.currentHp;
  const first=f.player.takeDamage(100,f.target);assert.equal(first.absorbed,100);assert.equal(first.reflected,30);assert.equal(f.target.currentHp,99970);assert.equal(f.player.currentHp,hp);
  const remaining=shield.remainingAbsorption!;const second=f.player.takeDamage(remaining+10,f.target);assert.equal(second.reflected,30);assert.equal(f.player.currentHp,hp-10);assert.equal(f.player.hasStatus('SHIELD'),false);
  f.player.takeDamage(100,f.target);assert.equal(f.target.currentHp,99940);
});
test('Agathys permite melhoria persistida e evolui absorção/retaliação',t=>{
  const f=fixture(t,'bruxo_nv1_2');assert.equal(canUpgradeSkillPower(SKILLS_DATABASE.bruxo_nv1_2),true);
  f.player.gold=f.db.updateCharacterGold(f.player.dbCharacterId,1000);f.db.addItemToInventory(f.player.dbCharacterId,'arcane_dust',2);Object.assign(f.player,f.db.upgradeCharacterSkill(f.player,'bruxo_nv1_2',1));
  assert.equal(f.db.getSkillLevels(f.player.dbCharacterId).bruxo_nv1_2,2);assert.equal(f.player.gold,450);f.cast();const shield=f.player.getStatus('SHIELD')!;
  assert.equal(shield.maxAbsorption,Math.round(Math.round(f.player.maxHp*.2)*1.05));assert.equal(f.player.takeDamage(100,f.target).reflected,32);
});
test('Agathys não reflete em cadeia nem após expiração',t=>{
  const f=fixture(t,'bruxo_nv1_2');f.cast();f.target.addStatus({statusId:'enemy-shield',type:'SHIELD',skillId:'test',sourceEntityId:f.target.id,targetEntityId:f.target.id,durationSec:10,remainingSec:10,expiresAtTick:200,magnitude:100,remainingAbsorption:100,reflectRatio:1});
  const hp=f.player.currentHp;f.player.takeDamage(100,f.target);assert.equal(f.player.currentHp,hp);assert.equal(f.target.currentHp,100000);
  f.world.updateCombatStatuses(6.01);assert.equal(f.player.hasStatus('SHIELD'),false);const enemyHp=f.target.currentHp;f.player.takeDamage(100,f.target);assert.equal(f.target.currentHp,enemyHp);
});
test('Retaliação de Agathys mata chefe com portal e recompensa únicos',t=>{
  const f=fixture(t,'bruxo_nv1_2');f.cast();f.world.challengeStageBoss(f.player);const boss=f.world.entityManager.getMonster(f.world.activeBossId!)!;boss.currentHp=1;boss.targetPlayer=f.player;boss.state=MonsterState.ATTACKING;boss.attackCooldown=0;boss.attackDamage=100;
  (f.world as any).processMonsterCombat(boss);assert.equal(boss.isDead,true);assert.equal(f.world.isPortalOpen,true);const kills=f.player.huntSession.snapshot().kills;(f.world as any).processMonsterCombat(boss);assert.equal(f.player.huntSession.snapshot().kills,kills);assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_BOSS_EVENT&&p.data.eventType==='VICTORY').length,1);
});
test('Tentáculos enraízam por 1.5s sem stun, respeitam raio e não encurtam raiz existente',t=>{
  const f=fixture(t,'bruxo_nv1_3'),edge=f.enemy('edge',6.5),outside=f.enemy('outside',6.51);f.cast();assert.equal(edge.hasStatus('ROOT'),true);assert.equal(outside.hasStatus('ROOT'),false);assert.equal(f.target.isStunned(),false);assert.equal(f.target.getMovementMultiplier(),0);
  f.world.updateCombatStatuses(1.51);assert.equal(f.target.getMovementMultiplier(),1);f.reset('bruxo_nv1_3');f.target.addStatus({statusId:'long',type:'ROOT',sourceEntityId:f.player.id,targetEntityId:f.target.id,skillId:'test',durationSec:4,remainingSec:4,expiresAtTick:80,magnitude:1});f.cast();assert.equal(f.target.getStatus('ROOT')!.remainingSec,4);
});
test('Fome divide potência em seis pulsos na área fixa, sem dano inicial',t=>{
  const f=fixture(t,'bruxo_nv2_1'),edge=f.enemy('edge',7.5),outside=f.enemy('outside',7.51);f.cast();assert.equal(f.target.currentHp,100000);assert.equal(f.target.hasStatus('BLINDED'),true);assert.equal(outside.hasStatus('BLINDED'),false);
  f.player.position.x=30;f.world.updateCombatStatuses(10);const power=calculateSkillPower(SKILLS_DATABASE.bruxo_nv2_1,f.player.attributes,50);assert.equal(100000-f.target.currentHp,power);assert.equal(100000-edge.currentHp,power);assert.equal(outside.currentHp,100000);assert.equal(f.ticks().length,12);
});
test('Cegueira causa falha real de ataque básico e sai quando o alvo deixa a área',t=>{
  const f=fixture(t,'bruxo_nv2_1');f.cast();f.target.state=MonsterState.ATTACKING;f.target.targetPlayer=f.player;let rolls=[.999,.1];Math.random=()=>rolls.shift()??.999;
  const hp=f.player.currentHp;(f.world as any).processMonsterCombat(f.target);assert.equal(f.player.currentHp,hp);assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.isDodged).length,1);
  f.target.position.x=8;f.world.updateCombatStatuses(.01);assert.equal(f.target.hasStatus('BLINDED'),false);f.target.attackCooldown=0;(f.world as any).processMonsterCombat(f.target);assert.equal(hp-f.player.currentHp,100);
});
test('Sobreposição de Fomes mantém cegueira quando um dos autores sai',t=>{
  const f=fixture(t,'bruxo_nv2_1');f.cast();const other=f.db.createCharacterInSlot('other',f.account.id,1,'SegundoHadar',CharacterClass.BRUXO);other.level=50;other.recalculateStatsFromEquipment();other.currentResource=100;other.setEquippedSkill(3,'bruxo_nv2_1');
  const connection={id:other.id,accountId:f.account.id,isAuthenticated:true,send(){}} as Connection;f.world.enterWorld(connection,other);other.position=createVector3(0,0,0);f.world.castPlayerSkill(other,3,f.target.id);
  f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.getStatus('BLINDED')!.sourceEntityId,other.id);
});
test('Vampírico preserva 2.5x CAR e cura só 50% do HP retirado, sem overkill/absorção',t=>{
  const f=fixture(t,'bruxo_nv2_2');f.player.currentHp=1;f.target.currentHp=10;f.cast();assert.equal(f.player.currentHp,6);assert.equal(f.casts()[0].data.damageOrHeal,15);
  const g=fixture(t,'bruxo_nv2_2');g.player.currentHp=1;g.target.addStatus({statusId:'shield',type:'SHIELD',sourceEntityId:g.target.id,targetEntityId:g.target.id,skillId:'test',durationSec:5,remainingSec:5,expiresAtTick:100,magnitude:1000,remainingAbsorption:1000});g.cast();assert.equal(g.player.currentHp,1);assert.equal(g.target.currentHp,100000);
  const h=fixture(t,'bruxo_nv2_2');h.cast();assert.equal(100000-h.target.currentHp,50);
});
test('Brumas move o herói e explode na partida, não no destino',t=>{
  const f=fixture(t,'bruxo_nv2_3'),arrival=f.enemy('arrival',6);assert.equal(f.world.castPlayerSkill(f.player,3,undefined,createVector3(6,0,0)),true);
  assert.equal(f.player.position.x,6);assert.equal(100000-f.target.currentHp,Math.round(206+2.2*20));assert.equal(arrival.currentHp,100000);assert.equal(f.player.currentResource,64);assert.equal(f.casts()[0].data.originPosition.x,0);assert.equal(f.casts()[0].data.targetPosition.x,6);
});
test('Brumas pode escapar sem inimigos e usa direção atual sem ponto escolhido',t=>{
  const f=fixture(t,'bruxo_nv2_3');f.world.entityManager.removeMonster(f.target.id);f.player.headingYaw=90;assert.equal(f.world.castPlayerSkill(f.player,3),true);assert.ok(Math.abs(f.player.position.x-6)<1e-8);assert.equal(f.casts()[0].data.damageOrHeal,0);
});
test('Brumas rejeita altura, limites, distância e destino parado antes de cobrar',t=>{
  const f=fixture(t,'bruxo_nv2_3');for(const p of [createVector3(6.01,0,0),createVector3(2,1,0),createVector3(0,0,0),createVector3(NaN,0,0)])assert.equal(f.world.castPlayerSkill(f.player,3,undefined,p),false);
  f.player.position.x=59;assert.equal(f.world.castPlayerSkill(f.player,3,undefined,createVector3(61,0,0)),false);assert.equal(f.player.currentResource,100);assert.equal(f.player.getSkillCooldown(3),0);
  f.player.position.x=0;f.player.headingYaw=NaN;assert.equal(f.world.castPlayerSkill(f.player,3),false);assert.equal(f.player.position.x,0);
});
test('AUTO usa Brumas para afastar e revalida distância do básico após teleportar',t=>{
  const f=fixture(t,'bruxo_nv2_3');f.target.position.x=5;f.player.skillCastOrder=[3,1,2,4];f.world.automationEnabled=true;f.world.update(.05);assert.equal(f.casts()[0].data.skillId,'bruxo_nv2_3');assert.equal(f.player.position.x,-6);assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK').length,0);
});
test('Singularidade puxa apenas alvos no raio e atualiza a posição autoritativa',t=>{
  const f=fixture(t,'bruxo_nv3_1'),edge=f.enemy('edge',10),outside=f.enemy('outside',10.01);f.cast();assert.equal(edge.position.x,2);assert.equal(f.target.position.x,2);assert.equal(outside.position.x,10.01);assert.equal(outside.currentHp,100000);assert.equal(100000-edge.currentHp,Math.round(206+4.3*20));
});
test('Singularidade não puxa para um centro fora do mapa',t=>{
  const f=fixture(t,'bruxo_nv3_1');f.player.position.x=59;assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(65,0,0)),false);assert.equal(f.player.currentResource,100);assert.equal(f.player.getSkillCooldown(4),0);
});
test('Lorde Demônio tem dez pulsos em área fixa, sem dano instantâneo',t=>{
  const f=fixture(t,'bruxo_nv3_2'),edge=f.enemy('edge',8),outside=f.enemy('outside',8.01);f.cast();assert.equal(f.target.currentHp,100000);f.player.position.x=30;f.world.updateCombatStatuses(12);
  assert.equal(100000-f.target.currentHp,Math.round(206+4.5*20));assert.equal(edge.currentHp,f.target.currentHp);assert.equal(outside.currentHp,100000);assert.equal(f.ticks().length,20);f.world.updateCombatStatuses(10);assert.equal(f.ticks().length,20);
});
test('Agonia separa dano do principal e área sem somar ambos na vítima principal',t=>{
  const f=fixture(t,'bruxo_nv3_3'),edge=f.enemy('edge',8),outside=f.enemy('outside',8.01);f.cast();assert.equal(100000-f.target.currentHp,Math.round(206+4.9*20));assert.equal(100000-edge.currentHp,Math.round(206+2.5*20));assert.equal(outside.currentHp,100000);
});
test('Agonia por ponto escolhe como principal o mais próximo do centro',t=>{
  const f=fixture(t,'bruxo_nv3_3'),near=f.enemy('near',3.9);f.world.castPlayerSkill(f.player,4,undefined,createVector3(4,0,0));assert.equal(100000-near.currentHp,304);assert.equal(100000-f.target.currentHp,256);assert.equal(f.casts()[0].data.targetId,near.id);
});
test('Áreas, praga e Hex encerram na morte/saída do autor',t=>{
  const f=fixture(t,'bruxo_nv2_1');f.cast();f.world.removePlayerFromWorld(f.connection,false);assert.equal(f.target.hasStatus('BLINDED'),false);f.world.updateCombatStatuses(10);assert.equal(f.ticks().length,0);
  const g=fixture(t,'bruxo_nv3_2');g.cast();g.player.takeDamage(g.player.maxHp*2);g.world.updateCombatStatuses(10);assert.equal(g.ticks().length,0);
  const h=fixture(t,'bruxo_nv1_1');h.cast();h.world.removePlayerFromWorld(h.connection,false);assert.equal(h.target.hasStatus('HEXED'),false);
});
test('Dano periódico da Fome mata chefe com vitória e recompensa únicas',t=>{
  const f=fixture(t,'bruxo_nv2_1');f.world.challengeStageBoss(f.player);const boss=f.world.entityManager.getMonster(f.world.activeBossId!)!;boss.position=createVector3(2,0,0);boss.currentHp=1;assert.equal(f.world.castPlayerSkill(f.player,3,boss.id),true);f.world.updateCombatStatuses(1);assert.equal(boss.isDead,true);assert.equal(f.world.isPortalOpen,true);const kills=f.player.huntSession.snapshot().kills;f.world.updateCombatStatuses(10);assert.equal(f.player.huntSession.snapshot().kills,kills);
});
test('Nível, alvo morto, mana e cooldown são validados antes de gasto',t=>{
  const f=fixture(t,'bruxo_nv3_3');f.player.level=49;assert.equal(f.cast(),false);assert.equal(f.player.currentResource,100);f.player.level=50;f.target.isDead=true;assert.equal(f.cast(),false);assert.equal(f.player.getSkillCooldown(4),0);f.target.isDead=false;f.player.currentResource=0;assert.equal(f.cast(),false);
});
