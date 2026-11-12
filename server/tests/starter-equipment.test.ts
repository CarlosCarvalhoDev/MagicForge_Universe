import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { WebSocket } from 'ws';
import { CharacterClass, ITEMS_DATABASE, ItemType, Opcode } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { WorldManager } from '../src/game/WorldManager';
import { ServerNetwork } from '../src/network/ServerNetwork';

test('A Forja cria o Bruxo pelo WebSocket e preserva o pedestal ao rejeitar uma classe bloqueada', { timeout: 5000 }, async () => {
  const db = new DatabaseManager(':memory:');
  const http = createServer();
  const network = new ServerNetwork(http, new WorldManager(db));
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const address = http.address();
  assert.ok(address && typeof address !== 'string');
  const socket = new WebSocket(`ws://127.0.0.1:${address.port}`);
  async function send(op: Opcode, data: object) {
    const response = once(socket, 'message');
    socket.send(JSON.stringify({ op, data }));
    const [raw] = await response;
    return JSON.parse(raw.toString());
  }
  try {
    await once(socket, 'open');
    const auth = await send(Opcode.C2S_AUTH_REGISTER, {
      username: 'warlock_forge', email: 'warlock@example.test', password: 'TestOnly_49!Password',
    });
    assert.equal(auth.op, Opcode.S2C_AUTH_SUCCESS);
    const denied = await send(Opcode.C2S_CREATE_CHARACTER_SLOT, {
      slotIndex: 0, characterName: 'Mago da Forja', classType: CharacterClass.MAGO,
    });
    assert.equal(denied.op, Opcode.S2C_ERROR);
    assert.equal(denied.data.errorCode, 'CLASS_UNAVAILABLE');
    assert.equal(db.getCharacterByAccountAndSlot(auth.data.accountId, 0), null);
    const created = await send(Opcode.C2S_CREATE_CHARACTER_SLOT, {
      slotIndex: 0, characterName: 'Bruxo da Forja', classType: CharacterClass.BRUXO,
    });
    assert.equal(created.op, Opcode.S2C_CHARACTER_LIST);
    assert.equal(created.data.slots[0].classType, CharacterClass.BRUXO);
    assert.equal(db.getCharacterByAccountAndSlot(auth.data.accountId, 0)?.class_type, CharacterClass.BRUXO);
  } finally {
    const closed = once(socket, 'close');
    socket.close();
    await closed;
    network.close();
    http.close();
    db.close();
  }
});

for (const classType of Object.values(CharacterClass)) {
  test(`${classType}: kit inicial contém arma válida e equipável no nível 1`, (t) => {
    const db = new DatabaseManager(':memory:');
    t.after(() => db.close());
    const account = db.getOrCreateAccount(`starter_${classType}`);
    const player = db.createCharacterInSlot('starter_connection', account.id, 0, `Hero_${classType}`, classType);
    const inventory = db.getInventory(player.dbCharacterId);
    assert.ok(inventory.every(item => ITEMS_DATABASE[item.itemId]), 'Todo item inicial precisa existir no catálogo');
    const weapons = inventory.filter(item => ITEMS_DATABASE[item.itemId].type === ItemType.EQUIPAMENTO);
    assert.equal(weapons.length, 1, 'Herói deve receber uma arma inicial');
    assert.equal(db.toggleEquipItem(player.dbCharacterId, weapons[0].slotIndex, classType, 1, player.attributes).success, true);
    assert.ok(db.getInventory(player.dbCharacterId).find(item => item.instanceId === weapons[0].instanceId)!.isEquipped);
  });
}
