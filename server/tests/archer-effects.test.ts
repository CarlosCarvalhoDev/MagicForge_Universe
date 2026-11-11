import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, Opcode, SKILLS_DATABASE, calculateSkillPower, createVector3, getSkillTargeting, canUpgradeSkillPower } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { Monster, MonsterState } from '../src/entities/Monster';
import type { Connection } from '../src/network/Connection';

const originalRandom = Math.random, originalNow = Date.now;
function fixture(t: TestContext, skillId: string) {
  let clock = 1_800_000_000_000;
  Math.random = () => .999; Date.now = () => ++clock;
  t.after(() => { Math.random = originalRandom; Date.now = originalNow; });
  const db = new DatabaseManager(':memory:'); t.after(() => db.close());
  const world = new World(db); world.automationEnabled = false;
  for (const enemy of world.entityManager.getAllMonsters()) { world.entityManager.removeMonster(enemy.id); world.spatialGrid.removeEntity(enemy.id); }
  const account = db.getOrCreateAccount('archer');
  const player = db.createCharacterInSlot('archer',account.id,0,'ArqueiroTeste',CharacterClass.ARQUEIRO);
  player.level = 50; player.recalculateStatsFromEquipment(); player.attributes.destreza = 20; player.currentResource = 100;
  player.setEquippedSkill(SKILLS_DATABASE[skillId].slot,skillId);
  const packets: Array<{ op: Opcode; data: any }> = [];
  const connection = { id: player.id, accountId: account.id, isAuthenticated: true, send: (op: Opcode,data: any) => packets.push({op,data}) } as Connection;
  world.enterWorld(connection,player); player.position = createVector3(0,0,0);
  const enemy = (id: string,x: number,z = 0,hp = 100000) => {
    const monster = new Monster(id,id,createVector3(x,0,z),hp,100);
    monster.speed = 0; monster.aggroRadius = 0; monster.autoRespawns = false; monster.lootTable = []; monster.expReward = 0;
    world.entityManager.addMonster(monster); world.spatialGrid.updateEntity(monster); return monster;
  };
  const target = enemy('prey',4);
  const casts = () => packets.filter(p => p.op === Opcode.S2C_SKILL_CAST_EVENT);
  const ticks = () => packets.filter(p => p.op === Opcode.S2C_COMBAT_EVENT && p.data.damageSource === 'STATUS_TICK');
  const reset = (id: string) => { player.skillCooldowns.clear(); player.currentResource = 100; player.setEquippedSkill(SKILLS_DATABASE[id].slot,id); };
  const cast = (id = skillId) => world.castPlayerSkill(player,SKILLS_DATABASE[id].slot,target.id,target.position);
  return { db, world, account, player, packets, connection, target, enemy, casts, ticks, reset, cast };
}

test('Tiro Certeiro usa coeficiente próprio, base de nível, evolução e uma cobrança', t => {
  const f = fixture(t,'arqueiro_truque_1'); f.player.skillLevels.arqueiro_truque_1 = 2;
  assert.equal(f.cast(),true);
  const expected = Math.round(Math.round(6+4*50+1.35*20)*1.05);
  assert.equal(100000-f.target.currentHp,expected); assert.equal(f.player.currentResource,90);
  assert.equal(f.casts()[0].data.isCritical,false); assert.equal(f.cast(),false); assert.equal(f.player.currentResource,90);
});

test('Veneno distribui potência em três pulsos, recupera atraso e não pulsa após expirar', t => {
  const f = fixture(t,'arqueiro_truque_2'); f.cast(); const hp = f.target.currentHp;
  assert.equal(100000-hp,Math.round(206+1.1*20));
  f.world.updateCombatStatuses(10); assert.equal(hp-f.target.currentHp,12); assert.equal(f.ticks().length,3);
  f.world.updateCombatStatuses(10); assert.equal(f.ticks().length,3); assert.equal(f.target.hasStatus('POISON'),false);
});

test('Veneno captura evolução/bônus e renovação substitui os pulsos antigos', t => {
  const f = fixture(t,'arqueiro_truque_2'); f.player.skillLevels.arqueiro_truque_2 = 2; f.cast();
  assert.equal(f.target.getStatus('POISON')!.magnitude,13); f.world.updateCombatStatuses(1);
  f.reset('arqueiro_truque_2'); f.player.skillLevels.arqueiro_truque_2 = 1; f.cast();
  const hp = f.target.currentHp; f.world.updateCombatStatuses(3); assert.equal(hp-f.target.currentHp,12); assert.equal(f.ticks().length,4);
});

test('Veneno e marca são limpos quando o autor morre ou sai do mundo', t => {
  const f = fixture(t,'arqueiro_truque_2'); f.cast(); const hp = f.target.currentHp;
  f.world.removePlayerFromWorld(f.connection,false); f.world.updateCombatStatuses(3); assert.equal(f.target.currentHp,hp); assert.equal(f.target.hasStatus('POISON'),false);
  const g = fixture(t,'arqueiro_nv1_1'); g.cast(); g.player.takeDamage(g.player.maxHp*2); g.world.updateCombatStatuses(.05); assert.equal(g.target.hasStatus('HUNTERS_MARK'),false);
});

test('Veneno que mata chefe recompensa e abre portal uma única vez', t => {
  const f = fixture(t,'arqueiro_truque_2'); f.world.challengeStageBoss(f.player);
  const boss = f.world.entityManager.getMonster(f.world.activeBossId!)!; boss.position = createVector3(4,0,0);
  assert.equal(f.world.castPlayerSkill(f.player,1,boss.id),true); boss.currentHp = 1;
  f.world.updateCombatStatuses(1); assert.equal(boss.isDead,true); assert.equal(f.world.isPortalOpen,true);
  const kills = f.player.huntSession.snapshot().kills; f.world.updateCombatStatuses(10);
  assert.equal(f.player.huntSession.snapshot().kills,kills);
  assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_BOSS_EVENT&&p.data.eventType==='VICTORY').length,1);
});

test('Tiro Desacelerador aplica 40% por 4s sem somar com lentidão existente', t => {
  const f = fixture(t,'arqueiro_truque_3'); f.cast(); assert.equal(f.target.getMovementMultiplier(),.6);
  const slow = f.target.getStatus('CRIPPLED')!;
  f.target.addStatus({...slow,type:'FROST_SLOW',statusId:'stronger',magnitude:.6}); assert.equal(f.target.getMovementMultiplier(),.4);
  f.target.removeStatus('stronger'); f.world.updateCombatStatuses(4.01); assert.equal(f.target.getMovementMultiplier(),1);
});

test('Marca não causa dano; amplifica apenas o autor, evolui e expira em 8s', t => {
  const f = fixture(t,'arqueiro_nv1_1'); f.player.skillLevels.arqueiro_nv1_1 = 2; f.cast();
  assert.equal(f.target.currentHp,100000); assert.equal(f.casts()[0].data.damageOrHeal,0);
  assert.ok(Math.abs(f.target.getStatus('HUNTERS_MARK')!.magnitude-.2625)<1e-8);
  f.target.takeDamage(100,f.player); assert.equal(f.target.currentHp,99874);
  const other = f.db.createCharacterInSlot('other',f.account.id,1,'OutroArqueiro',CharacterClass.ARQUEIRO);
  f.target.takeDamage(100,other); assert.equal(f.target.currentHp,99774);
  f.world.updateCombatStatuses(8.01); f.target.takeDamage(100,f.player); assert.equal(f.target.currentHp,99674);
});

test('Marca beneficia ataque básico e veneno do autor sem ser consumida', t => {
  const f = fixture(t,'arqueiro_nv1_1'); f.cast(); const hp = f.target.currentHp;
  (f.world as any).executePlayerAttack(f.player,f.target); assert.equal(hp-f.target.currentHp,Math.round(f.player.BaseDamage*1.25));
  f.reset('arqueiro_truque_2'); f.cast('arqueiro_truque_2'); const before = f.target.currentHp;
  f.world.updateCombatStatuses(1); assert.equal(before-f.target.currentHp,5); assert.equal(f.target.hasStatus('HUNTERS_MARK'),true);
});

for (const [skillId,pulses,seconds] of [['arqueiro_nv1_2',3,.45],['arqueiro_nv3_2',10,1]] as const) {
  test(`${skillId}: ${pulses} impactos reais dividem potência total e cobram uma vez`, t => {
    const f = fixture(t,skillId); f.cast(); const resource = f.player.currentResource;
    assert.equal(f.target.currentHp,100000); assert.equal(f.casts()[0].data.damageOrHeal,0);
    f.world.updateCombatStatuses(seconds+.01);
    assert.equal(f.ticks().length,pulses); assert.equal(100000-f.target.currentHp,calculateSkillPower(SKILLS_DATABASE[skillId],f.player.attributes,50));
    assert.equal(f.player.currentResource,resource); f.world.updateCombatStatuses(3); assert.equal(f.ticks().length,pulses);
  });
}

test('Rajada e Bombardeio coexistem sem apagar o efeito do outro slot', t => {
  const f = fixture(t,'arqueiro_nv1_2'); f.cast(); f.player.setEquippedSkill(4,'arqueiro_nv3_2'); f.cast('arqueiro_nv3_2');
  assert.equal(f.player.hasStatus('ARROW_VOLLEY'),true); assert.equal(f.player.hasStatus('STORM_BARRAGE'),true);
  f.world.updateCombatStatuses(1.01); assert.equal(f.ticks().length,13);
});

test('Rajadas interrompem com alvo morto/distante e não trocam de vítima', t => {
  const f = fixture(t,'arqueiro_nv1_2'); f.cast(); f.world.updateCombatStatuses(.15); f.target.position.x = 11;
  const hp = f.target.currentHp; f.world.updateCombatStatuses(1); assert.equal(f.target.currentHp,hp); assert.equal(f.ticks().length,1);
  const g = fixture(t,'arqueiro_nv3_2'); g.target.currentHp = 1; const other = g.enemy('other',5); g.cast(); g.world.updateCombatStatuses(1.01);
  assert.equal(g.ticks().length,1); assert.equal(other.currentHp,100000);
});

test('Rajada captura potência, mas respeita perda do autor e interrupção por morte', t => {
  const f = fixture(t,'arqueiro_nv1_2'); f.cast(); const power = f.player.getStatus('ARROW_VOLLEY')!.magnitude;
  f.player.attributes.destreza = 500; f.world.updateCombatStatuses(.46); assert.equal(100000-f.target.currentHp,power);
  const g = fixture(t,'arqueiro_nv3_2'); g.cast(); g.player.takeDamage(g.player.maxHp*2); g.world.updateCombatStatuses(2); assert.equal(g.ticks().length,0);
});

test('Armadilha enraíza sem atordoar ou impedir ataque ao alcance', t => {
  const f = fixture(t,'arqueiro_nv1_3'); f.cast(); assert.equal(f.target.hasStatus('ROOT'),true); assert.equal(f.target.isStunned(),false);
  f.target.speed = 3; f.target.aggroRadius = 10; f.target.targetPlayer = f.player; f.target.state = MonsterState.CHASING;
  f.target.update(.5); assert.equal(f.target.position.x,4); assert.equal(f.target.isMoving,false);
  f.target.position.x = 1; f.target.state = MonsterState.ATTACKING; f.target.attackCooldown = 0;
  const hp = f.player.currentHp; (f.world as any).processMonsterCombat(f.target); assert.equal(hp-f.player.currentHp,100);
  f.world.updateCombatStatuses(2.01); assert.equal(f.target.getMovementMultiplier(),1);
});

test('Chuva usa área no ponto escolhido e respeita a borda de 5.5m', t => {
  const f = fixture(t,'arqueiro_nv2_1'), edge = f.enemy('edge',9.5), outside = f.enemy('outside',9.51);
  f.cast(); assert.ok(edge.currentHp<100000); assert.equal(outside.currentHp,100000);
  assert.equal(100000-f.target.currentHp,Math.round(206+2.4*20)); assert.equal(f.casts()[0].data.geometry,'CIRCLE_TARGET');
});

test('Flecha espectral atinge linha, não círculo; não alcança atrás/lateral distante', t => {
  const f = fixture(t,'arqueiro_nv2_2'), edge = f.enemy('edge',10,1.5), outside = f.enemy('outside',4,1.51), behind = f.enemy('behind',-1);
  f.cast(); assert.ok(edge.currentHp<100000); assert.equal(outside.currentHp,100000); assert.equal(behind.currentHp,100000);
  const event = f.casts()[0].data; assert.equal(event.geometry,'LINE'); assert.equal(event.lineLength,12); assert.equal(event.lineWidth,3);
  assert.equal(getSkillTargeting(SKILLS_DATABASE.arqueiro_nv2_2).category,'AOE_LINE');
});

test('Flecha em linha rejeita alvo inexistente sem custo nem cooldown', t => {
  const f = fixture(t,'arqueiro_nv2_2'); assert.equal(f.world.castPlayerSkill(f.player,3,'invalid'),false);
  assert.equal(f.player.currentResource,100); assert.equal(f.player.getSkillCooldown(3),0);
});

test('Flecha em linha rejeita mira elevada que poderia estender artificialmente o alcance', t => {
  const f = fixture(t,'arqueiro_nv2_2'), far = f.enemy('far',16);
  assert.equal(f.world.castPlayerSkill(f.player,3,undefined,createVector3(4,4,0)),false);
  assert.equal(f.player.currentResource,100); assert.equal(f.player.getSkillCooldown(3),0); assert.equal(far.currentHp,100000);
});

test('Manto oculta de inimigo existente e impede aquisição de novo alvo', t => {
  const f = fixture(t,'arqueiro_nv2_3'); f.cast(); f.target.targetPlayer = f.player; f.target.state = MonsterState.CHASING; f.target.speed = 3;
  f.target.update(.5); assert.equal(f.target.position.x,4);
  f.target.state = MonsterState.ATTACKING; const hp = f.player.currentHp; (f.world as any).processMonsterCombat(f.target); assert.equal(f.player.currentHp,hp);
  const idle = f.enemy('idle',2); idle.aggroRadius = 10; f.player.attackTimer = 10; f.world.update(.05); assert.equal(idle.targetPlayer,null);
});

test('Manto garante um crítico ofensivo e uma esquiva, sem imunidade permanente', t => {
  const f = fixture(t,'arqueiro_nv2_3'); f.cast();
  f.reset('arqueiro_truque_1'); f.cast('arqueiro_truque_1'); assert.equal(f.casts().at(-1)!.data.isCritical,true);
  assert.equal(f.player.hasStatus('STEALTH'),false); assert.equal(f.player.hasStatus('AMBUSH_CRITICAL'),false);
  f.target.state = MonsterState.ATTACKING; f.target.targetPlayer = f.player; f.target.attackCooldown = 0;
  const hp = f.player.currentHp; (f.world as any).processMonsterCombat(f.target); assert.equal(f.player.currentHp,hp); assert.equal(f.player.hasStatus('EVASION_READY'),false);
  assert.equal(f.packets.filter(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.isDodged).length,1);
  f.target.attackCooldown = 0; (f.world as any).processMonsterCombat(f.target); assert.equal(hp-f.player.currentHp,100);
  f.reset('arqueiro_truque_1'); f.cast('arqueiro_truque_1'); assert.equal(f.casts().at(-1)!.data.isCritical,false);
});

test('Marca e invocação não gastam emboscada; crítico/esquiva expiram após 3s', t => {
  const f = fixture(t,'arqueiro_nv2_3'); f.cast(); f.reset('arqueiro_nv1_1'); f.cast('arqueiro_nv1_1');
  assert.equal(f.player.hasStatus('AMBUSH_CRITICAL'),true); f.reset('arqueiro_nv3_3'); f.cast('arqueiro_nv3_3');
  assert.equal(f.player.hasStatus('STEALTH'),true); f.world.updateCombatStatuses(3.01);
  for (const type of ['STEALTH','AMBUSH_CRITICAL','EVASION_READY'] as const) assert.equal(f.player.hasStatus(type),false);
  assert.equal(canUpgradeSkillPower(SKILLS_DATABASE.arqueiro_nv2_3),false);
});

test('Fênix usa DEX+SAB, evolução e raio de 8m no centro confirmado', t => {
  const f = fixture(t,'arqueiro_nv3_1'), edge = f.enemy('edge',12), outside = f.enemy('outside',12.01);
  f.player.skillLevels.arqueiro_nv3_1 = 2; f.cast();
  const expected = Math.round(Math.round(206+4.2*20+1.5*f.player.attributes.sabedoria)*1.05);
  assert.equal(100000-f.target.currentHp,expected); assert.ok(edge.currentHp<100000); assert.equal(outside.currentHp,100000);
});

test('Fera protege área fixa por 12 pulsos sem dano inicial, crítico ou perseguição do herói', t => {
  const f = fixture(t,'arqueiro_nv3_3'), outside = f.enemy('outside',10.01), edge = f.enemy('edge',10);
  f.cast(); assert.equal(f.target.currentHp,100000); f.player.position.x = 40;
  f.world.updateCombatStatuses(12.01); const power = calculateSkillPower(SKILLS_DATABASE.arqueiro_nv3_3,f.player.attributes,50);
  assert.equal(100000-f.target.currentHp,power); assert.equal(100000-edge.currentHp,power); assert.equal(outside.currentHp,100000); assert.equal(f.ticks().length,24);
  f.world.updateCombatStatuses(12); assert.equal(f.ticks().length,24);
});

test('Fera considera entrada/saída da área e encerra na saída do autor', t => {
  const f = fixture(t,'arqueiro_nv3_3'); f.cast(); f.world.updateCombatStatuses(1); const hp = f.target.currentHp;
  f.target.position.x = 11; f.world.updateCombatStatuses(1); assert.equal(f.target.currentHp,hp);
  f.target.position.x = 4; f.world.updateCombatStatuses(1); assert.ok(f.target.currentHp<hp);
  const after = f.target.currentHp; f.world.removePlayerFromWorld(f.connection,false); f.world.updateCombatStatuses(12); assert.equal(f.target.currentHp,after);
});

test('Nível, recurso, coordenadas e alvo morto são rejeitados antes de gastar', t => {
  const f = fixture(t,'arqueiro_nv3_1'); f.player.level = 49; assert.equal(f.cast(),false); assert.equal(f.player.currentResource,100);
  f.player.level = 50; assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(NaN,0,0)),false);
  assert.equal(f.world.castPlayerSkill(f.player,4,undefined,createVector3(13,0,0)),false); assert.equal(f.player.currentResource,100);
  f.reset('arqueiro_truque_1'); f.target.isDead = true; assert.equal(f.cast('arqueiro_truque_1'),false); assert.equal(f.player.currentResource,100);
  f.target.isDead = false; f.player.currentResource = 0; assert.equal(f.cast('arqueiro_truque_1'),false); assert.equal(f.player.getSkillCooldown(1),0);
});

test('Poison não é criado se reflexão do impacto mata o autor', t => {
  const f = fixture(t,'arqueiro_truque_2'); f.player.currentHp = 1;
  f.target.addStatus({statusId:'reflect',type:'SHIELD',sourceEntityId:f.target.id,targetEntityId:f.target.id,skillId:'test',durationSec:5,remainingSec:5,expiresAtTick:100,magnitude:1000,remainingAbsorption:1000,reflectRatio:1});
  f.cast(); assert.equal(f.player.isDead,true); assert.equal(f.target.hasStatus('POISON'),false);
});

test('A guarda da furtividade não impede aggro contra outro herói visível', t => {
  const f = fixture(t,'arqueiro_nv2_3'); f.cast(); f.player.attackTimer = 10;
  const other = f.db.createCharacterInSlot('visible',f.account.id,1,'Visivel',CharacterClass.GUERREIRO);
  const connection = {id:other.id,accountId:f.account.id,isAuthenticated:true,send(){}} as Connection;
  f.world.enterWorld(connection,other); other.position = createVector3(6,0,0); other.attackTimer = 10;
  f.target.aggroRadius = 10; f.world.update(.05); assert.equal(f.target.targetPlayer?.id,other.id);
});

test('Manto garante crítico na potência capturada de Rajada, sem cobrar novamente nos pulsos', t => {
  const f = fixture(t,'arqueiro_nv2_3'); f.cast(); f.reset('arqueiro_nv1_2'); f.cast('arqueiro_nv1_2');
  const power = calculateSkillPower(SKILLS_DATABASE.arqueiro_nv1_2,f.player.attributes,50);
  assert.equal(f.casts().at(-1)!.data.isCritical,true); f.world.updateCombatStatuses(.46);
  assert.equal(100000-f.target.currentHp,Math.round(power*1.5)); assert.equal(f.player.currentResource,78);
});

test('Fera termina na morte e Rajada termina na desconexão do autor', t => {
  const f = fixture(t,'arqueiro_nv3_3'); f.cast(); f.player.takeDamage(f.player.maxHp*2); f.world.updateCombatStatuses(12); assert.equal(f.ticks().length,0);
  const g = fixture(t,'arqueiro_nv1_2'); g.cast(); g.world.removePlayerFromWorld(g.connection,false); g.world.updateCombatStatuses(1); assert.equal(g.ticks().length,0);
});

test('AUTO respeita ordem com Manto e continua ataque básico quando magia está desligada', t => {
  const f = fixture(t,'arqueiro_nv2_3'); f.player.skillCastOrder = [3,1,2,4]; f.world.automationEnabled = true;
  f.world.update(.05); assert.equal(f.casts()[0].data.skillId,'arqueiro_nv2_3');
  f.player.autoCastEnabled = false; f.target.position.x = 1; f.player.attackTimer = 0;
  f.world.update(.05); assert.equal(f.casts().length,1);
  assert.ok(f.packets.some(p=>p.op===Opcode.S2C_COMBAT_EVENT&&p.data.damageSource==='BASIC_ATTACK'));
});
