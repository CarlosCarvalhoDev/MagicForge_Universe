import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CharacterClass, Opcode, bagItems } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { PacketHandler } from '../src/network/PacketHandler';
import type { Connection } from '../src/network/Connection';

function setup(t: TestContext, filename = ':memory:') {
  const db = new DatabaseManager(filename);
  t.after(() => { if (filename === ':memory:') db.close(); });
  const account = db.getOrCreateAccount('inventory_test');
  const player = db.createCharacterInSlot('inventory_connection', account.id, 0, 'InventoryHero', CharacterClass.GUERREIRO);
  const inventory = () => db.getInventory(player.dbCharacterId);
  const weapon = () => inventory().find(item => item.itemId === 'sword_iron_broadsword')!;
  const equip = (slot: number) => db.toggleEquipItem(player.dbCharacterId, slot, player.classType, player.level, player.attributes);
  return { db, player, inventory, weapon, equip };
}

test('Equipar libera bag e conserva identidade; trocar funciona com bag cheia e desequipar exige espaço', t => {
  const f = setup(t);
  f.player.maxInventorySlots = 3; f.db.savePlayer(f.player);
  const first = f.weapon();
  assert.equal(f.equip(first.slotIndex).success, true);
  assert.equal(bagItems(f.inventory()).length, 2);
  const worn = f.inventory().find(item => item.instanceId === first.instanceId)!;
  assert.equal(worn.location, 'equipment'); assert.equal(worn.slotIndex, -1);
  assert.ok(f.db.addItemToInventory(f.player.dbCharacterId, first.itemId, 1, 3));
  const second = f.inventory().find(item => !item.isEquipped && item.itemId === first.itemId)!;
  assert.equal(second.slotIndex, first.slotIndex);
  assert.equal(f.equip(second.slotIndex).success, true);
  assert.equal(f.inventory().find(item => item.slotIndex === second.slotIndex)!.instanceId, first.instanceId);
  const before = f.inventory();
  assert.equal(f.equip(-1).success, false);
  assert.deepEqual(f.inventory(), before);
  f.db.removeItemFromInventory(f.player.dbCharacterId, 0, 3);
  assert.equal(f.equip(-1).success, true);
  assert.equal(f.inventory().find(item => item.instanceId === second.instanceId)!.slotIndex, 0);
  assert.equal(f.inventory().filter(item => item.isEquipped).length, 0);
});

test('Refino e gemas acompanham a instância ao equipar, trocar e voltar', t => {
  const f = setup(t), first = f.weapon();
  f.db.refineEquipmentItem(f.player.dbCharacterId, first.slotIndex, 7);
  f.db.addItemToInventory(f.player.dbCharacterId, 'gem_ruby_str', 2);
  assert.equal(f.db.socketGem(f.player.dbCharacterId, first.slotIndex, 0, 'gem_ruby_str').success, true);
  assert.equal(f.equip(first.slotIndex).success, true);
  f.db.addItemToInventory(f.player.dbCharacterId, first.itemId);
  const other = f.inventory().find(item => !item.isEquipped && item.itemId === first.itemId)!;
  assert.equal(f.equip(other.slotIndex).success, true);
  assert.equal(f.equip(other.slotIndex).success, true);
  const restored = f.inventory().find(item => item.isEquipped)!;
  assert.equal(restored.instanceId, first.instanceId);
  assert.equal(restored.refineLevel, 7);
  assert.deepEqual(restored.sockets, [{ socketIndex: 0, gemId: 'gem_ruby_str' }]);
  assert.equal(f.db.socketGem(f.player.dbCharacterId, -1, 0, 'gem_ruby_str').success, false);
  assert.ok(f.db.hasItemQuantity(f.player.dbCharacterId, 'gem_ruby_str', 1));
});

test('Empilhamento distribui excedente e recusa entrega inteira sem espaço, sem alteração parcial', t => {
  const f = setup(t);
  assert.equal(f.db.addItemToInventory(f.player.dbCharacterId, 'potion_hp_minor', 95, 3), true);
  const before = f.inventory();
  assert.equal(f.db.addItemToInventory(f.player.dbCharacterId, 'potion_hp_minor', 2, 3), false);
  assert.deepEqual(f.inventory(), before);
  f.equip(f.weapon().slotIndex);
  assert.equal(f.db.addItemToInventory(f.player.dbCharacterId, 'potion_hp_minor', 2, 3), true);
  const stacks = f.inventory().filter(item => item.itemId === 'potion_hp_minor');
  assert.deepEqual(stacks.map(item => item.quantity).sort((a,b) => a-b), [1, 99]);
  assert.equal(f.db.addItemToInventory(f.player.dbCharacterId, 'potion_hp_minor', -1), false);
});

test('Falha no meio da troca reverte as duas posições e mantém todos os itens', t => {
  const f = setup(t);
  f.equip(f.weapon().slotIndex);
  f.db.addItemToInventory(f.player.dbCharacterId, 'sword_iron_broadsword');
  const next = f.inventory().find(item => !item.isEquipped && item.itemId === 'sword_iron_broadsword')!;
  const before = f.inventory();
  (f.db as any).db.exec("CREATE TRIGGER fail_inventory_swap BEFORE UPDATE OF is_equipped ON inventory WHEN NEW.is_equipped = 1 BEGIN SELECT RAISE(ABORT, 'test swap failure'); END;");
  assert.throws(() => f.equip(next.slotIndex), /test swap failure/);
  assert.deepEqual(f.inventory(), before);
});

test('Pedido antigo não equipa de volta nem vende outro item que ocupou a posição', t => {
  const f = setup(t), world = new World(f.db), packets: any[] = [];
  const connection = { id: f.player.id, accountId: f.player.dbCharacterId, isAuthenticated: true,
    send(op: Opcode, data: unknown) { packets.push({op,data}); } } as unknown as Connection;
  world.enterWorld(connection, f.player);
  const handler = new PacketHandler(world), first = f.weapon();
  const send = (op: Opcode, slotIndex: number, expectedInstanceId?: string) => handler.handlePacket(connection,
    JSON.stringify({ op, data: { slotIndex, expectedInstanceId } }));
  send(Opcode.C2S_USE_ITEM, first.slotIndex, first.instanceId);
  f.db.addItemToInventory(f.player.dbCharacterId, first.itemId);
  f.player.inventory = f.inventory();
  const other = f.player.inventory.find(item => !item.isEquipped && item.itemId === first.itemId)!;
  send(Opcode.C2S_USE_ITEM, other.slotIndex, other.instanceId);
  const before = f.inventory();
  send(Opcode.C2S_USE_ITEM, other.slotIndex, other.instanceId);
  send(Opcode.C2S_SELL_ITEM, other.slotIndex, other.instanceId);
  send(Opcode.C2S_DISCARD_ITEM, other.slotIndex, undefined);
  assert.deepEqual(f.inventory(), before);
  assert.ok(packets.some(packet => packet.op === Opcode.S2C_CHAT_MESSAGE && packet.data.message.includes('mudou de posição')));
});

test('Transação externa pode reverter entrega interna sem vazamento de itens', t => {
  const f = setup(t), before = f.inventory();
  assert.throws(() => f.db.runInTransaction(() => {
    f.db.addItemToInventory(f.player.dbCharacterId, 'arcane_dust', 1000);
    throw new Error('abort outer');
  }), /abort outer/);
  assert.deepEqual(f.inventory(), before);
});

test('Gema não sai do soquete se não puder ser devolvida à bag', t => {
  const f = setup(t), weapon = f.weapon();
  f.db.addItemToInventory(f.player.dbCharacterId, 'gem_ruby_str');
  f.db.socketGem(f.player.dbCharacterId, weapon.slotIndex, 0, 'gem_ruby_str');
  f.equip(weapon.slotIndex);
  f.player.maxInventorySlots = 3; f.db.savePlayer(f.player);
  f.db.addItemToInventory(f.player.dbCharacterId, weapon.itemId, 1, 3);
  const before = f.inventory();
  assert.equal(f.db.unsocketGem(f.player.dbCharacterId, -1, 0).success, false);
  assert.deepEqual(f.inventory(), before);
});

test('Refino repetido com nível antigo cobra uma vez e falha SQL preserva materiais e ouro', t => {
  const f = setup(t), world = new World(f.db);
  const packets: any[] = [];
  const connection = { id: f.player.id, isAuthenticated: true, send(op: Opcode, data: unknown) { packets.push({op,data}); } } as unknown as Connection;
  world.enterWorld(connection, f.player);
  f.player.gold = f.db.updateCharacterGold(f.player.dbCharacterId, 2000);
  f.db.addItemToInventory(f.player.dbCharacterId, 'stone_forge_common', 3);
  f.player.inventory = f.inventory();
  world.usePlayerItem(f.player, f.weapon().slotIndex);
  const equipped = f.player.inventory.find(item => item.isEquipped)!;
  const handler = new PacketHandler(world);
  const packet = (level: number) => JSON.stringify({ op: Opcode.C2S_REFINE_EQUIPMENT, data: {
    slotIndex: equipped.slotIndex, expectedInstanceId: equipped.instanceId, expectedRefineLevel: level,
  } });
  const gold = f.player.gold;
  handler.handlePacket(connection, packet(0));
  handler.handlePacket(connection, packet(0));
  assert.equal(f.player.gold, gold - 500);
  assert.equal(f.inventory().find(item => item.isEquipped)!.refineLevel, 1);
  assert.ok(f.db.hasItemQuantity(f.player.dbCharacterId, 'stone_forge_common', 2));
  const before = f.inventory();
  (f.db as any).db.exec("CREATE TRIGGER fail_refine BEFORE UPDATE OF refine_level ON inventory BEGIN SELECT RAISE(ABORT, 'test refine failure'); END;");
  handler.handlePacket(connection, packet(1));
  assert.equal(f.player.gold, gold - 500);
  assert.deepEqual(f.inventory(), before);
  assert.equal(packets.filter(packet => packet.op === Opcode.S2C_REFINE_RESULT).at(-1)!.data.success, false);
});

test('Reciclagem em mochila expandida entrega pó no espaço livre além do slot 20', t => {
  const f = setup(t);
  f.player.maxInventorySlots = 30; f.db.savePlayer(f.player);
  for (let i = 0; i < 20; i++) assert.ok(f.db.addItemToInventory(f.player.dbCharacterId, 'sword_iron_broadsword', 1, 30));
  const item = f.inventory().find(item => item.slotIndex === 21)!;
  assert.equal(f.db.discardOrRecycleItem(f.player.dbCharacterId, item.slotIndex).success, true);
  assert.ok(f.db.hasItemQuantity(f.player.dbCharacterId, 'arcane_dust', 2));
  assert.equal(f.inventory().some(entry => entry.instanceId === item.instanceId), false);
});

test('Migração preserva registros, refinos e gemas de banco legado e é idempotente', t => {
  const filename = join(tmpdir(), `magicforge-inventory-${randomUUID()}.db`);
  t.after(() => { for (const suffix of ['', '-wal', '-shm']) rmSync(filename + suffix, {force:true}); });
  const f = setup(t, filename), first = f.weapon();
  f.db.refineEquipmentItem(f.player.dbCharacterId, first.slotIndex, 7);
  f.db.addItemToInventory(f.player.dbCharacterId, 'gem_ruby_str');
  f.db.socketGem(f.player.dbCharacterId, first.slotIndex, 0, 'gem_ruby_str');
  const count = f.inventory().length;
  const raw = (f.db as any).db;
  raw.exec('DROP INDEX idx_inventory_character_location');
  raw.prepare('UPDATE inventory SET is_equipped = 1 WHERE id = ?').run(first.instanceId);
  f.db.close();
  for (let pass = 0; pass < 2; pass++) {
    const reopened = new DatabaseManager(filename);
    try {
      const items = reopened.getInventory(f.player.dbCharacterId), worn = items.find(item => item.instanceId === first.instanceId)!;
      assert.equal(items.length, count); assert.equal(worn.slotIndex, -1); assert.equal(worn.refineLevel, 7);
      assert.equal(worn.sockets![0].gemId, 'gem_ruby_str');
      assert.equal(new Set(items.map(item => item.slotIndex)).size, count);
    } finally { reopened.close(); }
  }
});
