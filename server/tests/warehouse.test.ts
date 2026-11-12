import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, createVector3, Opcode, WAREHOUSE_TILE_SIZE, type EntitySnapshotState, type WarehouseRoom } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { PacketHandler } from '../src/network/PacketHandler';
import type { Connection } from '../src/network/Connection';

test('Warehouse is private, preserves battle position and phase, and disconnect saves the battle state', t => {
  const db = new DatabaseManager(':memory:');
  t.after(() => db.close());
  const account = db.getOrCreateAccount('warehouse-test');
  const world = new World(db, 3, 2);
  const player = db.createCharacterInSlot('visitor', account.id, 0, 'Visitante', CharacterClass.GUERREIRO);
  const battlePosition = createVector3(4, 0, -7);
  player.currentWorld = 3;
  player.currentStage = world.currentStage = 4;
  player.position = battlePosition;
  player.autoCastEnabled = true;
  world.entityManager.addPlayer(player);
  world.spatialGrid.updateEntity(player);
  const monster = world.entityManager.getAllMonsters()[0];
  monster.targetPlayer = player;
  monster.targetId = player.id;
  const packets: Array<{ op: Opcode; data: any }> = [];
  const connection = {
    id: player.id, playerId: player.id, accountId: account.id, isAuthenticated: true,
    currentWorldInstance: world, send(op: Opcode, data: unknown) { packets.push({ op, data }); },
  } as unknown as Connection;
  world.registerConnection(connection);
  const handler = new PacketHandler(world);
  const send = (op: Opcode, data: unknown) => handler.handlePacket(connection, JSON.stringify({ op, data }));
  const travel = (area: string) => send(Opcode.C2S_WAREHOUSE_TRAVEL, area);
  const positionAt = (col: number, row: number) => createVector3(col * WAREHOUSE_TILE_SIZE, 0, row * WAREHOUSE_TILE_SIZE);
  let sequence = 0;
  const walkTo = (col: number, row: number, room: WarehouseRoom) => {
    send(Opcode.C2S_MOVE_INPUT, { targetPosition: positionAt(col, row), inputSequence: ++sequence });
    for (let tick = 0; tick < 500; tick++) world.update(.05);
    assert.equal(world.getWarehouse(player.id)?.room, room);
    assert.equal([...packets].reverse().find(packet => packet.op === Opcode.S2C_WAREHOUSE_STATE)?.data.room, room);
  };

  travel('warehouse');
  assert.equal(world.entityManager.getPlayer(player.id), undefined);
  assert.equal(monster.targetPlayer, null);
  assert.equal(world.getSessionPlayer(player.id), player);
  send(Opcode.C2S_ATTACK_TARGET, { targetId: monster.id });
  assert.equal(world.getWarehouse(player.id)?.room, 'exterior');
  walkTo(-4, 0, 'exterior'); // The house wall cannot be crossed.
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(-4, 5));
  walkTo(-8, 6, 'exterior'); // The fence is solid outside the gate.
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(-4, 5));
  walkTo(-11, 2, 'exterior');
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(-11, 2));
  walkTo(-10, 3, 'exterior'); // The crates beside the house stay solid.
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(-11, 2));
  walkTo(0, 3, 'exterior');
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(0, 3));
  walkTo(0, 2, 'exterior'); // The crate on the opposite side is solid too.
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(0, 3));
  walkTo(-18, 8, 'exterior');
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(-18, 8));
  walkTo(-19, 8, 'exterior');
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(-18, 8));
  walkTo(8, 7, 'exterior');
  assert.deepEqual(world.getWarehouse(player.id)?.snapshot().position, positionAt(8, 7));
  walkTo(-4, 2, 'interior');
  walkTo(-11, -3, 'upper');
  walkTo(-7, -1, 'interior');
  walkTo(1, 6, 'exterior');
  const snapshot = [...packets].reverse().find(packet => packet.op === Opcode.S2C_WORLD_SNAPSHOT)?.data.entities as EntitySnapshotState[];
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].id, player.id);
  assert.deepEqual(snapshot[0].position, positionAt(-4, 3));
  assert.deepEqual(player.position, battlePosition);
  assert.equal(player.targetId, null);

  travel('battle');
  assert.equal(world.getWarehouse(player.id), undefined);
  assert.equal(world.entityManager.getPlayer(player.id), player);
  assert.deepEqual(player.position, battlePosition);
  assert.equal(player.autoCastEnabled, true);
  assert.equal([...packets].reverse().find(packet => packet.op === Opcode.S2C_STAGE_UPDATE)?.data.stage, 4);

  travel('warehouse');
  walkTo(-4, 2, 'interior');
  walkTo(-11, -3, 'upper');
  world.removePlayerFromWorld(connection, true, true);
  assert.equal(world.getWarehouse(player.id), undefined);
  const record = db.getCharacterByAccountAndSlot(account.id, 0);
  assert.ok(record);
  const reconnected = db.loadPlayerFromRecord('new-connection', record);
  assert.equal(reconnected.currentWorld, 3);
  assert.equal(reconnected.currentStage, 4);
  assert.deepEqual(reconnected.position, battlePosition);
});
