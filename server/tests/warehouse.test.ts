import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, createVector3, Opcode, WAREHOUSE_TILE_SIZE, INVENTORY_EXPANSION_SEAL, type EntitySnapshotState, type WarehouseRoom } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { PacketHandler } from '../src/network/PacketHandler';
import type { Connection } from '../src/network/Connection';

test('Warehouse mantém expansão por ouro, cash e selo sem perder posição de combate', t => {
  for (const payment of ['gold', 'cash', 'gold_item'] as const) {
    const db = new DatabaseManager(':memory:'); t.after(() => db.close());
    const account = db.getOrCreateAccount('warehouse-expansion');
    const player = db.createCharacterInSlot('warehouse-expansion', account.id, 0, 'WarehouseBuyer', CharacterClass.GUERREIRO);
    const capacity = payment === 'gold' ? 20 : 35;
    player.maxInventorySlots = capacity; player.gold = 2_000_000;
    player.position = createVector3(4,0,-7); db.savePlayer(player);
    if (payment === 'cash') db.creditAccountCash(account.id,100,'fixture:warehouse-expansion');
    if (payment === 'gold_item') db.addItemToInventory(player.dbCharacterId,INVENTORY_EXPANSION_SEAL,1);
    const world = new World(db);
    world.entityManager.addPlayer(player); world.spatialGrid.updateEntity(player);
    const packets: Array<{op: Opcode; data: any}> = [];
    const connection = {id:player.id,playerId:player.id,accountId:account.id,isAuthenticated:true,
      currentWorldInstance:world,send(op:Opcode,data:unknown){packets.push({op,data});}} as unknown as Connection;
    world.registerConnection(connection);
    const handler = new PacketHandler(world);
    handler.handlePacket(connection,JSON.stringify({op:Opcode.C2S_WAREHOUSE_TRAVEL,data:'warehouse'}));
    assert.equal(world.entityManager.getPlayer(player.id),undefined);
    handler.handlePacket(connection,JSON.stringify({op:Opcode.C2S_EXPAND_INVENTORY,data:{expectedMaxSlots:capacity,
      payment,quotedCost:payment==='cash'?100:payment==='gold'?10_000:1_000_000}}));
    assert.equal(player.maxInventorySlots,capacity+5);
    assert.equal(world.getWarehouse(player.id)?.player,player);
    assert.deepEqual(player.position,createVector3(4,0,-7));
    assert.equal(db.getCharacterById(player.dbCharacterId)!.max_inventory_slots,capacity+5);
    assert.ok(packets.some(packet=>packet.op===Opcode.S2C_EXPAND_INVENTORY_RESULT&&packet.data.success));
    if(payment==='cash')assert.equal(db.getAccountCashBalance(account.id),0);
    if(payment==='gold_item')assert.equal(db.hasItemQuantity(player.dbCharacterId,INVENTORY_EXPANSION_SEAL,1),false);
  }
});

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
