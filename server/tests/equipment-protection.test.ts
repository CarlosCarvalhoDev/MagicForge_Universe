import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, Opcode, getEquipmentSuggestions, type InventoryItemPayload } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { PacketHandler } from '../src/network/PacketHandler';
import { Connection } from '../src/network/Connection';

function setup(t: TestContext) {
  const db = new DatabaseManager(':memory:'); t.after(() => db.close());
  const account = db.getOrCreateAccount('protection-test');
  const player = db.createCharacterInSlot('protection', account.id, 0, 'ProtectedHero', CharacterClass.GUERREIRO);
  const packets: any[] = [];
  const conn = new Connection('protection', { readyState: 1, send: (raw: string) => packets.push(JSON.parse(raw)) } as any);
  conn.isAuthenticated = true; conn.playerId = player.id;
  const world = new World(db); world.registerConnection(conn); world.entityManager.addPlayer(player);
  const inventory = () => db.getInventory(player.dbCharacterId);
  const weapon = () => inventory().find(item => item.itemId === 'sword_iron_broadsword')!;
  return { db, player, world, conn, packets, inventory, weapon };
}

test('Proteger preserva instância ao equipar/trocar/recarregar e bloqueia venda/reciclagem na persistência', t => {
  const f = setup(t), weapon = f.weapon();
  assert.equal(f.db.setItemLocked(f.player.dbCharacterId, weapon.instanceId!, true), true);
  assert.equal(f.db.removeItemFromInventory(f.player.dbCharacterId, weapon.slotIndex), false);
  assert.equal(f.db.discardOrRecycleItem(f.player.dbCharacterId, weapon.slotIndex).success, false);
  assert.equal(f.world.sellPlayerItem(f.player, weapon.slotIndex), false);
  assert.equal(f.db.toggleEquipItem(f.player.dbCharacterId, weapon.slotIndex, f.player.classType, 30, f.player.attributes).success, true);
  assert.ok(f.db.addItemToInventory(f.player.dbCharacterId, weapon.itemId));
  const other = f.inventory().find(item => item.itemId === weapon.itemId && !item.isEquipped)!;
  f.db.toggleEquipItem(f.player.dbCharacterId, other.slotIndex, f.player.classType, 30, f.player.attributes);
  const restored = f.db.loadPlayerFromRecord('reload', f.db.getCharacterByName(f.player.name)!);
  const locked = restored.inventory.find(item => item.instanceId === weapon.instanceId)!;
  assert.equal(locked.isLocked, true); assert.equal(locked.isEquipped, false);
  assert.equal(f.db.setItemLocked('another-character', weapon.instanceId!, false), false);
  assert.equal(f.db.setItemLocked(f.player.dbCharacterId, weapon.instanceId!, false), true);
  assert.equal(f.db.removeItemFromInventory(f.player.dbCharacterId, locked.slotIndex), true);
});

test('Materiais, poções e gemas protegidos não são consumidos; faxina não vende nem credita item protegido', t => {
  const f = setup(t), weapon = f.weapon();
  for (const id of ['arcane_dust', 'gem_ruby_str']) f.db.addItemToInventory(f.player.dbCharacterId, id, 5);
  for (const item of f.inventory()) f.db.setItemLocked(f.player.dbCharacterId, item.instanceId!, true);
  assert.equal(f.db.consumeItemQuantity(f.player.dbCharacterId, 'arcane_dust', 1), false);
  assert.equal(f.db.socketGem(f.player.dbCharacterId, weapon.slotIndex, 0, 'gem_ruby_str').success, false);
  const hp = f.inventory().find(item => item.itemId === 'potion_hp_minor')!;
  f.player.inventory = f.inventory(); const before = f.inventory(), gold = f.player.gold;
  assert.equal(f.world.usePlayerItem(f.player, hp.slotIndex), false);
  f.world.handleAutoSalvage(f.conn, { includeRare: true });
  assert.deepEqual(f.inventory(), before); assert.equal(f.player.gold, gold);
  f.db.setItemLocked(f.player.dbCharacterId, weapon.instanceId!, false);
  f.world.handleAutoSalvage(f.conn, { includeRare: true });
  assert.equal(f.inventory().some(item => item.instanceId === weapon.instanceId), false);
  assert.equal(f.player.gold, gold + 80);
});

test('Pacote exige identidade e booleano; proteger é idempotente e sugestão é somente leitura', t => {
  const f = setup(t), handler = new PacketHandler(f.world), weapon = f.weapon();
  const send = (data: unknown) => handler.handlePacket(f.conn, JSON.stringify({ op: Opcode.C2S_SET_ITEM_LOCK, data }));
  send({ slotIndex: weapon.slotIndex, expectedInstanceId: 'foreign', isLocked: true });
  send({ slotIndex: weapon.slotIndex, expectedInstanceId: weapon.instanceId, isLocked: 'true' });
  assert.equal(f.weapon().isLocked, false);
  const payload = { slotIndex: weapon.slotIndex, expectedInstanceId: weapon.instanceId, isLocked: true };
  send(payload); send(payload); assert.equal(f.weapon().isLocked, true);
  const before = f.inventory();
  handler.handlePacket(f.conn, JSON.stringify({ op: Opcode.C2S_REQUEST_EQUIPMENT_ADVICE, data: {} }));
  assert.deepEqual(f.inventory(), before);
  assert.ok(f.packets.some(packet => packet.op === Opcode.S2C_EQUIPMENT_ADVICE));
});

const hero = { classType: CharacterClass.GUERREIRO, level: 30, attributes: { forca: 50, destreza: 30, constituicao: 40, inteligencia: 10, sabedoria: 10, carisma: 10 } };
const item = (itemId: string, slotIndex: number, isEquipped = false): InventoryItemPayload => ({ itemId, slotIndex, quantity: 1, isEquipped, instanceId: `item-${slotIndex}`, refineLevel: 0 });
test('Sugestões respeitam classe, nível, atributos, refino/gemas e escolhas protegidas; não equipam por CP', () => {
  const worn = item('sword_iron_broadsword', -1, true), upgrade = item('sword_runic_bastard', 5);
  const items = [worn, upgrade, item('staff_void_astral', 6)];
  assert.equal(getEquipmentSuggestions(items, hero)[0].candidate.instanceId, upgrade.instanceId);
  assert.equal(getEquipmentSuggestions(items, { ...hero, level: 1 }).length, 0);
  assert.equal(getEquipmentSuggestions(items, { ...hero, attributes: { ...hero.attributes, forca: 10 } }).length, 0);
  assert.equal(getEquipmentSuggestions([{ ...worn, isLocked: true }, upgrade], hero).length, 0);
  assert.equal(getEquipmentSuggestions([worn, { ...upgrade, isLocked: true }], hero).length, 0);
  // The high-STR gem creates a real loss despite the candidate's higher rarity and other gains.
  const gemmed = { ...worn, refineLevel: 15, sockets: Array.from({length:3}, (_, socketIndex) => ({ socketIndex, gemId:'gem_ruby_str' })) };
  assert.equal(getEquipmentSuggestions([gemmed, upgrade], hero).length, 0);
  assert.equal(worn.isEquipped, true); assert.equal(upgrade.isEquipped, false);
});
