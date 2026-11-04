import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, Opcode, createVector3, selectNextSkillSlot } from '@magicforge/shared';
import { World } from '../src/game/World';
import { WorldManager } from '../src/game/WorldManager';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { Monster } from '../src/entities/Monster';
import { PacketHandler } from '../src/network/PacketHandler';
import type { Connection } from '../src/network/Connection';

function setup(t: TestContext, managed = false) {
  const db = new DatabaseManager(':memory:');
  t.after(() => db.close());
  const manager = managed ? new WorldManager(db) : undefined;
  const world = manager?.getOrCreateChannel(1, 1) ?? new World(db);
  for (const monster of world.entityManager.getAllMonsters()) {
    world.entityManager.removeMonster(monster.id);
    world.spatialGrid.removeEntity(monster.id);
  }
  const packets: Array<{ op: Opcode; data: any }> = [];
  const account = db.getOrCreateAccount('automatic_account');
  const player = db.createCharacterInSlot('automatic_connection', account.id, 0, 'AutomaticHero', CharacterClass.GUERREIRO);
  const connection = { id: player.id, accountId: account.id, isAuthenticated: true,
    send(op: Opcode, data: any) { packets.push({ op, data }); } } as unknown as Connection;
  if (manager) { manager.registerConnection(connection); manager.assignPlayerToChannel(connection, player, 1); }
  else world.enterWorld(connection, player);
  player.level = 50;
  player.recalculateStatsFromEquipment();
  player.maxResource = player.currentResource = 1000;
  player.attackTimer = 10000;
  const target = new Monster('automatic_target', 'Alvo automático', createVector3(1, 0, 0), 1_000_000, 0);
  target.speed = 0;
  target.aggroRadius = 0;
  target.attackCooldown = 10000;
  target.lootTable = [];
  world.entityManager.addMonster(target);
  world.spatialGrid.updateEntity(target);
  return { db, world, manager, player, connection, packets, target,
    casts: () => packets.filter(packet => packet.op === Opcode.S2C_SKILL_CAST_EVENT).map(packet => packet.data.slot) };
}

test('Cursor percorre esquerda→direita, pula indisponíveis e retoma o ciclo', () => {
  assert.deepEqual(selectNextSkillSlot([3, 1, 4, 2], 0, () => true), { slot: 3, nextCursor: 1 });
  assert.deepEqual(selectNextSkillSlot([3, 1, 4, 2], 1, slot => slot !== 1), { slot: 4, nextCursor: 3 });
  assert.deepEqual(selectNextSkillSlot([3, 1, 4, 2], 3, () => true), { slot: 2, nextCursor: 0 });
  assert.equal(selectNextSkillSlot([1, 2, 3, 4], 0, () => false), null);
});

test('Servidor conjura na ordem configurada sem qualquer comando do navegador', (t) => {
  const fixture = setup(t);
  fixture.player.skillCastOrder = [3, 1, 4, 2];
  for (let tick = 0; tick < 10; tick++) fixture.world.update(0.05);
  assert.deepEqual(fixture.casts().slice(0, 4), [3, 1, 4, 2]);
  assert.equal(fixture.player.skillRotationCursor, 0);
});

test('Cooldown, bloqueio e falta de recurso não travam o ciclo', (t) => {
  const fixture = setup(t);
  fixture.player.setSkillCooldown(1, 30);
  fixture.world.update(0.05);
  assert.equal(fixture.casts()[0], 2);
  fixture.player.level = 1;
  fixture.player.skillCastOrder = [4, 3, 2, 1];
  fixture.player.skillRotationCursor = 0;
  fixture.player.skillCooldowns.clear();
  fixture.player.currentResource = 0;
  fixture.player.resourceRegenPerSec = 0;
  fixture.world.update(0.1);
  assert.equal(fixture.casts().length, 1);
  fixture.player.currentResource = 1000;
  fixture.world.update(0.1);
  assert.equal(fixture.casts().at(-1), 1);
});

test('Servidor navega e rejeita movimento manual enquanto automático', (t) => {
  const fixture = setup(t);
  fixture.target.position = createVector3(15, 0, 0);
  fixture.target.spawnPosition = createVector3(15, 0, 0);
  fixture.world.spatialGrid.updateEntity(fixture.target);
  for (let tick = 0; tick < 100; tick++) fixture.world.update(0.05);
  assert.ok(fixture.player.position.x > 10);
  assert.ok(fixture.casts().length > 0);
  const before = { ...fixture.player.moveDirection };
  new PacketHandler(fixture.world).handlePacket(fixture.connection, JSON.stringify({ op: Opcode.C2S_MOVE_INPUT,
    data: { moveDirection: { x: -1, y: 0, z: 0 }, inputSequence: 99 } }));
  assert.deepEqual({ ...fixture.player.moveDirection }, before);
});

test('Ordem persiste por herói; valores inválidos não alteram categorias nem preferência', (t) => {
  const fixture = setup(t);
  const loadout = { ...fixture.player.equippedSkills };
  fixture.world.handleUpdateSkillRotation(fixture.connection, { order: [4, 2, 1, 3] });
  assert.equal(fixture.db.getCharacterByName(fixture.player.name)!.skill_cast_order, '[4,2,1,3]');
  fixture.world.handleUpdateSkillRotation(fixture.connection, { order: [1, 1, 2, 3] });
  assert.deepEqual(fixture.player.skillCastOrder, [4, 2, 1, 3]);
  assert.deepEqual(fixture.player.equippedSkills, loadout);
  const loaded = fixture.db.loadPlayerFromRecord('reloaded', fixture.db.getCharacterByName(fixture.player.name)!);
  assert.deepEqual(loaded.skillCastOrder, [4, 2, 1, 3]);
  fixture.connection.isAuthenticated = false;
  fixture.world.handleUpdateSkillRotation(fixture.connection, { order: [1, 2, 3, 4] });
  assert.deepEqual(fixture.player.skillCastOrder, [4, 2, 1, 3]);
});

test('Vitória desbloqueia e transfere automaticamente sem avançar herói novo nem mutar o mundo antigo', (t) => {
  const fixture = setup(t, true);
  fixture.world.challengeStageBoss(fixture.player);
  const boss = fixture.world.entityManager.getMonster(fixture.world.activeBossId!)!;
  boss.takeDamage(boss.maxHp * 2, fixture.player);
  fixture.world.handleMonsterDeath(boss, fixture.player);
  assert.equal(fixture.player.unlockedWorld, 2);
  const freshAccount = fixture.db.getOrCreateAccount('new_arrival');
  const fresh = fixture.db.createCharacterInSlot('fresh_connection', freshAccount.id, 0, 'NewArrival', CharacterClass.GUERREIRO);
  const freshConnection = { id: fresh.id, accountId: freshAccount.id, isAuthenticated: true, send() {} } as unknown as Connection;
  fixture.manager!.registerConnection(freshConnection);
  fixture.manager!.assignPlayerToChannel(freshConnection, fresh, 1);
  fixture.player.huntSession.add('kills', 3);
  const kills = fixture.player.huntSession.snapshot().kills;
  fixture.manager!.update(3.05);
  assert.equal(fixture.player.currentWorld, 2);
  assert.equal(fixture.connection.currentWorldInstance.currentWorld, 2);
  assert.equal(fixture.world.currentWorld, 1);
  assert.equal(fresh.currentWorld, 1);
  assert.equal(fresh.unlockedWorld, 1);
  assert.equal(fixture.player.huntSession.snapshot().kills, kills);
  assert.equal(fixture.db.getCharacterByName(fixture.player.name)!.unlocked_world, 2);
});

test('Após falhar chefe, permanece farmando e só repete automaticamente após 60s', (t) => {
  const fixture = setup(t);
  fixture.world.entityManager.removeMonster(fixture.target.id);
  fixture.world.spatialGrid.removeEntity(fixture.target.id);
  fixture.world.currentStage = fixture.player.currentStage = 9;
  fixture.world.isBossAvailable = true;
  for (let index = 0; index < 12; index++) {
    const monster = new Monster(`retry_${index}`, 'Farm', createVector3(1, 0, 0));
    monster.lootTable = [];
    monster.takeDamage(monster.maxHp, fixture.player);
    fixture.world.handleMonsterDeath(monster, fixture.player);
  }
  assert.equal(fixture.world.currentStage, 9);
  fixture.world.update(59);
  assert.equal(fixture.world.isBossActive, false);
  fixture.world.update(1);
  assert.equal(fixture.world.isBossActive, true);
  assert.equal(fixture.world.currentStage, 10);
});

test('Reconectar na fase 10 inicia o chefe sem precisar clicar ou mover', (t) => {
  const fixture = setup(t);
  fixture.player.currentStage = 10;
  fixture.player.unlockedWorld = 1;
  fixture.db.savePlayer(fixture.player);
  fixture.world.removePlayerFromWorld(fixture.connection, false);
  const loaded = fixture.db.loadPlayerFromRecord(fixture.connection.id, fixture.db.getCharacterByName(fixture.player.name)!);
  fixture.world.enterWorld(fixture.connection, loaded);
  assert.equal(fixture.world.isBossActive, true);
  assert.equal(loaded.currentStage, 10);
});

test('Magias manuais persistem; ataque básico e conjuração por clique continuam disponíveis', t => {
  const f = setup(t);
  f.world.handleUpdateSkillRotation(f.connection, {order:[1,2,3,4], autoCastEnabled:false});
  f.player.attackTimer = 0;
  const hp = f.target.currentHp;
  f.world.update(0.05);
  assert.equal(f.casts().length, 0);
  assert.ok(f.target.currentHp < hp);
  assert.ok(f.packets.some(p => p.op === Opcode.S2C_COMBAT_EVENT && p.data.damageSource === 'BASIC_ATTACK'));
  assert.equal(f.world.castPlayerSkill(f.player, 1, f.target.id), true);
  const loaded = f.db.loadPlayerFromRecord('reloaded', f.db.getCharacterByName(f.player.name)!);
  assert.equal(loaded.autoCastEnabled, false);
  f.world.handleUpdateSkillRotation(f.connection, {order:[4,3,2,1]});
  assert.equal(f.player.autoCastEnabled, false);
  f.world.handleUpdateSkillRotation(f.connection, {order:[1,2,3,4], autoCastEnabled:'false' as any});
  assert.deepEqual(f.player.skillCastOrder, [4,3,2,1]);
});

test('Magias automáticas e ataque básico causam dano na mesma sessão', t => {
  const f = setup(t);
  f.player.attackTimer = 0;
  f.world.update(0.05);
  assert.ok(f.casts().length > 0);
  assert.ok(f.packets.some(p => p.op === Opcode.S2C_COMBAT_EVENT && p.data.damageSource === 'BASIC_ATTACK' && p.data.damage > 0));
});
