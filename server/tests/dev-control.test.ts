import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, Opcode } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { PacketHandler } from '../src/network/PacketHandler';
import type { Connection } from '../src/network/Connection';

test('Dev commands require server-side admin permission and spawn a stationary, indestructible target', t => {
  const db = new DatabaseManager(':memory:');
  t.after(() => db.close());
  const account = db.getOrCreateAccount('dev-test');
  const hero = db.createCharacterInSlot('dev-session', account.id, 0, 'DevHero', CharacterClass.GUERREIRO);
  const world = new World(db);
  world.entityManager.addPlayer(hero);
  const packets: Array<{ op: Opcode; data: unknown }> = [];
  const conn = {
    isAuthenticated: true, playerId: hero.id, accountId: account.id,
    send(op: Opcode, data: unknown) { packets.push({ op, data }); },
  } as unknown as Connection;
  const handler = new PacketHandler(world);
  const send = (data: unknown) => handler.handlePacket(conn, JSON.stringify({ op: Opcode.C2S_DEV_CONTROL, data }));
  const command = { action: 'dummy', x: 3, z: -2 };
  send(command);
  assert.equal(db.isAdminAccount(account.id), false);
  assert.equal(world.entityManager.getAllMonsters().some(monster => monster.trainingDummy), false);
  assert.equal(packets.length, 0);

  t.mock.method(db, 'isAdminAccount', id => id === account.id);
  send(command);
  const dummy = world.entityManager.getAllMonsters().find(monster => monster.trainingDummy)!;
  assert.ok(dummy);
  assert.equal(dummy.takeDamage(1_000_000, hero).killed, false);
  world.update(.05);
  assert.deepEqual(dummy.position, { x: 3, y: 0, z: -2 });
  const [visible, outside] = world.entityManager.getAllMonsters().filter(monster => !monster.devTarget);
  const stageKills = world.stageKills;
  send({ action: 'killVisible', monsterIds: [visible.id, visible.id, hero.id, 'absent'] });
  assert.equal(visible.isDead, true);
  assert.equal(outside.isDead, false);
  assert.equal(world.stageKills, stageKills);
  assert.equal(hero.isDead, false);
  send({ action: 'toggle', key: 'infiniteVitals', enabled: true });
  assert.equal(hero.takeDamage(1_000_000).effectiveDamage, 0);
  assert.equal(hero.consumeResource(1_000_000), true);
  send({ action: 'reset' });
  assert.equal(hero.devInfiniteVitals, false);
  assert.equal(world.entityManager.getMonster(dummy.id), undefined);
});
