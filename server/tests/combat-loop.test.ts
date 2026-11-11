import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, CLASS_DEFINITIONS, Opcode, SKILLS_DATABASE, createVector3, getSkillTargeting, isSkillEffectAvailable, calculateSkillPower, canUpgradeSkillPower } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { Monster } from '../src/entities/Monster';
import { Player } from '../src/entities/Player';
import type { Connection } from '../src/network/Connection';

function setup(t: TestContext, classType: CharacterClass, level=25, range=9) {
  const db=new DatabaseManager(':memory:');t.after(()=>db.close());const world=new World(db);
  for(const monster of world.entityManager.getAllMonsters()){world.entityManager.removeMonster(monster.id);world.spatialGrid.removeEntity(monster.id);}
  const account=db.getOrCreateAccount('combat-loop'),player=db.createCharacterInSlot('combat-loop',account.id,0,'CombatHero',classType);
  player.level=level;player.recalculateStatsFromEquipment();player.currentHp=player.maxHp;player.currentResource=player.maxResource;
  const packets:Array<{op:Opcode;data:any}>=[];const conn={id:player.id,accountId:account.id,isAuthenticated:true,send:(op:Opcode,data:any)=>packets.push({op,data})} as Connection;
  world.enterWorld(conn,player);
  const target=new Monster('combat-target','Alvo imóvel',createVector3(range,0,0),1_000_000,0);
  target.speed=0;target.aggroRadius=0;target.attackCooldown=10000;target.lootTable=[];
  world.entityManager.addMonster(target);world.spatialGrid.updateEntity(target);
  const casts=()=>packets.filter(packet=>packet.op===Opcode.S2C_SKILL_CAST_EVENT);
  const errors=()=>packets.filter(packet=>packet.op===Opcode.S2C_SKILL_CAST_REJECTED);
  return {db,world,player,target,packets,casts,errors};
}

test('Clérigo aproxima para área pessoal, conjura sem ponto inimigo e mantém ataques básicos',t=>{
  const f=setup(t,CharacterClass.CLERIGO);f.player.skillCastOrder=[3,1,2,4];
  for(let n=0;n<100;n++)f.world.update(.05);
  const guardian=f.casts().find(packet=>packet.data.skillId==='clerigo_nv2_1')!;
  assert.ok(guardian);assert.equal(guardian.data.category,'AOE_SELF');
  assert.deepEqual(guardian.data.originPosition,guardian.data.targetPosition);
  assert.equal(f.errors().length,0);
  assert.ok(f.packets.some(packet=>packet.op===Opcode.S2C_COMBAT_EVENT&&packet.data.damageSource==='BASIC_ATTACK'));
});

test('Cura pessoal automática espera dano sem bloquear o restante da ordem',t=>{
  const f=setup(t,CharacterClass.CLERIGO,10,1);f.player.skillCastOrder=[2,1,3,4];
  f.world.update(.05);assert.ok(f.casts().some(p=>p.data.slot===1));assert.equal(f.casts().some(p=>p.data.slot===2),false);
  assert.equal(f.player.getSkillCooldown(2),0);
  f.player.currentHp-=200;
  for(let n=0;n<3;n++)f.world.update(.05);
  assert.ok(f.casts().some(p=>p.data.slot===2&&p.data.targetResults.some((r:any)=>r.effectiveHeal>0)));
});

test('Fúria aplica dano +25%, resistência 15% e expira sem permanência ou empilhamento',t=>{
  const f=setup(t,CharacterClass.BARBARO,10,1);f.world.automationEnabled=false;
  const base=f.player.BaseDamage,resource=f.player.currentResource;
  assert.equal(f.world.castPlayerSkill(f.player,2),true);
  assert.equal(f.player.currentResource,resource-SKILLS_DATABASE.barbaro_nv1_1.cost);
  assert.equal(f.player.BaseDamage,Math.round(base*1.25));
  const hp=f.player.currentHp;f.player.takeDamage(100);assert.equal(f.player.currentHp,hp-85);
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,2);
  assert.equal(f.player.activeStatuses.size,2);
  f.player.stopMoving();f.player.attackTimer=10000;f.world.update(6.1);
  assert.equal(f.player.hasStatus('DAMAGE_BUFF'),false);assert.equal(f.player.hasStatus('DAMAGE_REDUCTION'),false);
  assert.equal(f.player.BaseDamage,base);
});

test('Agathys pessoal agora está disponível; guarda ainda bloqueia buffs desconhecidos',t=>{
  const f=setup(t,CharacterClass.BRUXO,25,1);f.player.setEquippedSkill(2,'bruxo_nv1_2');
  assert.equal(isSkillEffectAvailable(SKILLS_DATABASE.bruxo_nv1_2),true);
  assert.equal(isSkillEffectAvailable({...SKILLS_DATABASE.bruxo_nv1_2,skillId:'unimplemented_self_buff_fixture'}),false);
  const resource=f.player.currentResource;
  assert.equal(f.world.castPlayerSkill(f.player,2),true);
  assert.equal(f.player.currentResource,resource-22);assert.equal(f.player.getSkillCooldown(2),8.5);assert.equal(f.player.hasStatus('SHIELD'),true);
  f.packets.length=0;for(let n=0;n<20;n++)f.world.update(.05);assert.equal(f.errors().length,0);
});

test('Bênção aplica os três bônus por 8s, renova sem empilhar e não vende evolução sem potência',t=>{
  const f=setup(t,CharacterClass.CLERIGO,10,1);f.world.automationEnabled=false;f.player.setEquippedSkill(2,'clerigo_nv1_2');
  const base=f.player.BaseDamage,resource=f.player.currentResource;
  assert.equal(f.world.castPlayerSkill(f.player,2),true);
  assert.equal(f.player.currentResource,resource-22);
  assert.equal(f.player.BaseDamage,Math.round(base*1.2));
  assert.ok(Math.abs(f.player.getCriticalChance(.2)-.24)<1e-9);
  const hp=f.player.currentHp;f.player.takeDamage(100);assert.equal(hp-f.player.currentHp,80);
  assert.equal(canUpgradeSkillPower(SKILLS_DATABASE.clerigo_nv1_2),false);
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,2);assert.equal(f.player.activeStatuses.size,3);
  f.world.updateCombatStatuses(8.01);assert.equal(f.player.activeStatuses.size,0);
  assert.equal(f.player.BaseDamage,base);assert.equal(f.player.getCriticalChance(.2),.2);
});

test('Raio Guia marca depois do impacto e garante somente o próximo acerto direto do autor',t=>{
  const original=Math.random;t.after(()=>{Math.random=original;});Math.random=()=>.999;
  const f=setup(t,CharacterClass.CLERIGO,10,1);f.world.automationEnabled=false;f.player.setEquippedSkill(2,'clerigo_nv1_3');
  assert.equal(f.world.castPlayerSkill(f.player,2,f.target.id),true);
  assert.equal(f.casts().at(-1)!.data.isCritical,false);assert.ok(f.target.hasStatus('GUIDING_MARK'));
  const other=new Player('other','Outro',CharacterClass.GUERREIRO,createVector3(0,0,0));
  (f.world as any).executePlayerAttack(other,f.target);assert.ok(f.target.hasStatus('GUIDING_MARK'));
  const resource=f.player.currentResource;assert.equal(f.world.castPlayerSkill(f.player,1,'invalid'),false);
  assert.equal(f.player.currentResource,resource);assert.ok(f.target.hasStatus('GUIDING_MARK'));
  assert.equal(f.world.castPlayerSkill(f.player,1,f.target.id),true);assert.equal(f.casts().at(-1)!.data.isCritical,true);assert.equal(f.target.hasStatus('GUIDING_MARK'),false);
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,1,f.target.id);assert.equal(f.casts().at(-1)!.data.isCritical,false);
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,2,f.target.id);
  (f.world as any).executePlayerAttack(f.player,f.target);assert.equal(f.target.hasStatus('GUIDING_MARK'),false);
  assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT).at(-1)!.data.isCritical,true);
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,2,f.target.id);f.world.updateCombatStatuses(6.01);
  assert.equal(f.target.hasStatus('GUIDING_MARK'),false);
});

test('Truques e Palavra de Cura usam fórmulas do Clérigo; Tributo distingue alvo ferido e evolução',t=>{
  const original=Math.random;t.after(()=>{Math.random=original;});Math.random=()=>.999;
  const f=setup(t,CharacterClass.CLERIGO,10,1);f.world.automationEnabled=false;
  const wisdom=f.player.attributes.sabedoria;
  assert.equal(calculateSkillPower(SKILLS_DATABASE.clerigo_truque_1,f.player.attributes,10),Math.round(wisdom*1.35));
  f.player.currentHp=1;f.world.castPlayerSkill(f.player,2);assert.equal(f.player.currentHp,1+Math.round(wisdom*2+10));
  f.player.setEquippedSkill(1,'clerigo_truque_2');
  f.world.castPlayerSkill(f.player,1,f.target.id);const full=f.casts().at(-1)!.data.damageOrHeal;
  assert.equal(full,Math.round(wisdom*1.45));
  f.player.skillCooldowns.clear();f.world.castPlayerSkill(f.player,1,f.target.id);
  assert.equal(f.casts().at(-1)!.data.damageOrHeal,Math.round(full*1.25));
  f.player.skillCooldowns.clear();f.player.skillLevels.clerigo_truque_2=2;f.world.castPlayerSkill(f.player,1,f.target.id);
  assert.equal(f.casts().at(-1)!.data.damageOrHeal,Math.round(Math.round(full*1.05)*1.25));
});

test('Automático conjura suporte e marca na ordem sem impedir ataques básicos',t=>{
  const f=setup(t,CharacterClass.CLERIGO,10,1);f.player.setEquippedSkill(2,'clerigo_nv1_2');f.player.skillCastOrder=[2,1,3,4];
  for(let n=0;n<10;n++)f.world.update(.05);
  assert.equal(f.casts()[0].data.skillId,'clerigo_nv1_2');assert.equal(f.errors().length,0);
  assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
  const g=setup(t,CharacterClass.CLERIGO,10,1);g.player.setEquippedSkill(2,'clerigo_nv1_3');g.player.skillCastOrder=[2,1,3,4];
  for(let n=0;n<10;n++)g.world.update(.05);
  assert.equal(g.casts()[0].data.skillId,'clerigo_nv1_3');assert.equal(g.errors().length,0);
  assert.ok(g.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'&&p.data.isCritical));
});

test('Mana usa INT do Mago, SAB do Clérigo e CAR do Bruxo no nascimento e recálculo',()=>{
  for(const [cls,key] of [[CharacterClass.MAGO,'inteligencia'],[CharacterClass.CLERIGO,'sabedoria'],[CharacterClass.BRUXO,'carisma']] as const){
    const player=new Player('mana','Mana',cls,createVector3(0,0,0));
    assert.equal(player.maxResource,100+CLASS_DEFINITIONS[cls].baseStats[key]*8);
    player.level=10;player.recalculateStatsFromEquipment();assert.equal(player.maxResource,100+player.attributes[key]*8);
    player.currentResource=99999;player.recalculateStatsFromEquipment();assert.equal(player.currentResource,player.maxResource);
  }
});

test('Geometria pessoal e área em alvo permanecem distintas, inclusive aliases',()=>{
  assert.equal(getSkillTargeting(SKILLS_DATABASE.clerigo_nv2_1).category,'AOE_SELF');
  assert.equal(getSkillTargeting(SKILLS_DATABASE.guerreiro_nv2_3).category,'AOE_LINE');
  assert.equal(getSkillTargeting(SKILLS_DATABASE.guerreiro_3).category,'AOE_SELF');
  assert.equal(getSkillTargeting(SKILLS_DATABASE.clerigo_nv1_1).category,'SELF_HEAL');
});

test('Golpes híbridos causam dano mesmo com HP cheio e só curam dentro do limite efetivo',t=>{
  for (const [cls,id,slot] of [[CharacterClass.CLERIGO,'clerigo_truque_3',1],[CharacterClass.BRUXO,'bruxo_nv2_2',3]] as const) {
    const f=setup(t,cls,25,1);f.world.automationEnabled=false;f.player.setEquippedSkill(slot,id);
    assert.equal(f.world.castPlayerSkill(f.player,slot,f.target.id),true);
    let results=f.casts().at(-1)!.data.targetResults;
    assert.ok(results.find((r:any)=>r.targetId===f.target.id).effectiveDamage>0);
    assert.equal(results.find((r:any)=>r.targetId===f.player.id).effectiveHeal,0);
    f.player.currentHp-=500;f.player.skillCooldowns.clear();
    f.target.currentHp=10;
    assert.equal(f.world.castPlayerSkill(f.player,slot,f.target.id),true);
    results=f.casts().at(-1)!.data.targetResults;
    assert.equal(results.find((r:any)=>r.targetId===f.target.id).effectiveDamage,10);
    const heal=results.find((r:any)=>r.targetId===f.player.id).effectiveHeal;
    assert.ok(heal>0);if(cls===CharacterClass.BRUXO)assert.equal(heal,5);
    const resource=f.player.currentResource;f.player.skillCooldowns.clear();f.target.isDead=false;f.target.currentHp=100;f.target.position.x=100;
    assert.equal(f.world.castPlayerSkill(f.player,slot,f.target.id),false);
    assert.equal(f.player.currentResource,resource);
  }
});
