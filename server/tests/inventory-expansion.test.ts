import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CharacterClass, getInventoryExpansion, INVENTORY_EXPANSION_SEAL, Opcode } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { PacketHandler } from '../src/network/PacketHandler';
import type { Connection } from '../src/network/Connection';

function fixture(t: { after(fn: () => void): void }, slots = 20, gold = 50_000_000, path = ':memory:') {
  const db = new DatabaseManager(path); t.after(() => db.close());
  const account = db.getOrCreateAccount('expansion-test');
  const player = db.createCharacterInSlot('expansion', account.id, 0, 'ExpansionHero', CharacterClass.GUERREIRO);
  player.level = 1; player.maxInventorySlots = slots; player.gold = gold; db.savePlayer(player);
  const world = new World(db, 1, 1);
  return { db, account, player, world };
}

test('Nível 1 compra com ouro até 35; cotação legada para em 35 e replay não cobra', t => {
  const f = fixture(t);
  for (const [before, after] of [[20,25],[25,30],[30,35]]) {
    assert.equal(f.world.expandPlayerInventory(f.player, before, 'gold').success, true);
    assert.equal(f.player.maxInventorySlots, after);
  }
  assert.equal(f.player.gold, 50_000_000 - 310_000);
  assert.equal(f.world.expandPlayerInventory(f.player, 35, 'gold').success, false);
  assert.equal(f.db.expandInventorySlots(f.player.dbCharacterId, 35, 1_000_000), null);
  assert.equal(f.player.gold, 50_000_000 - 310_000);
  const legacy = getInventoryExpansion(31)!;
  assert.equal(legacy.newMaxSlots, 35); assert.equal(legacy.slotsAdded, 4);
  assert.equal(legacy.cost, 250_000);
  f.player.maxInventorySlots = 31; f.db.savePlayer(f.player);
  assert.equal(f.world.expandPlayerInventory(f.player, 31).success, true);
  const gold = f.player.gold;
  assert.equal(f.world.expandPlayerInventory(f.player, 31).success, false);
  assert.equal(f.player.gold, gold);
});

test('Cash e ouro+selo ampliam até 50 sem nível/Reborn e não cobram replay', t => {
  const f = fixture(t, 35);
  assert.equal(f.db.creditAccountCash(f.account.id, 700, 'store:test:1'), 700);
  assert.equal(f.db.creditAccountCash(f.account.id, 700, 'store:test:1'), 700);
  assert.throws(() => f.db.creditAccountCash(f.account.id, 701, 'store:test:1'), /CONFLICT/);
  assert.equal(f.world.expandPlayerInventory(f.player, 35, 'cash', 100).success, true);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 600);
  assert.equal(f.player.gold, 50_000_000);
  assert.equal(f.world.expandPlayerInventory(f.player, 35, 'cash', 100).success, false);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 600);
  f.db.addItemToInventory(f.player.dbCharacterId, INVENTORY_EXPANSION_SEAL, 1);
  const seal = f.db.getInventory(f.player.dbCharacterId).find(item => item.itemId === INVENTORY_EXPANSION_SEAL)!;
  f.db.setItemLocked(f.player.dbCharacterId, seal.instanceId!, true);
  assert.equal(f.world.expandPlayerInventory(f.player, 40, 'gold_item').success, false);
  assert.equal(f.player.gold, 50_000_000);
  f.db.setItemLocked(f.player.dbCharacterId, seal.instanceId!, false);
  assert.equal(f.world.expandPlayerInventory(f.player, 40, 'gold_item', 3_500_000).success, true);
  assert.equal(f.player.gold, 46_500_000);
  assert.equal(f.db.hasItemQuantity(f.player.dbCharacterId, INVENTORY_EXPANSION_SEAL, 1), false);
  assert.equal(f.world.expandPlayerInventory(f.player, 45, 'cash', 400).success, true);
  assert.equal(f.player.maxInventorySlots, 50); assert.equal(f.player.rebornCount, 0);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 200);
  assert.equal(f.world.expandPlayerInventory(f.player, 50, 'cash', 400).success, false);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 200);
});

test('Falhas após débito revertem cash, recibo, ouro, selo e capacidade juntos', t => {
  const f = fixture(t, 35);
  f.db.creditAccountCash(f.account.id, 100, 'store:rollback');
  f.db.addItemToInventory(f.player.dbCharacterId, INVENTORY_EXPANSION_SEAL, 1);
  const fail = t.mock.method(f.db, 'getCharacterGold', () => { throw new Error('injected persistence failure'); });
  assert.throws(() => f.db.purchaseInventoryExpansion(f.player.dbCharacterId, 35, 'cash'), /injected/);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 100);
  assert.equal(f.db.getCharacterById(f.player.dbCharacterId)!.max_inventory_slots, 35);
  assert.throws(() => f.db.purchaseInventoryExpansion(f.player.dbCharacterId, 35, 'gold_item'), /injected/);
  assert.equal(f.db.hasItemQuantity(f.player.dbCharacterId, INVENTORY_EXPANSION_SEAL, 1), true);
  assert.equal(f.db.getCharacterById(f.player.dbCharacterId)!.gold, 50_000_000);
  fail.mock.restore();
  assert.equal(f.db.purchaseInventoryExpansion(f.player.dbCharacterId, 35, 'cash').newMaxSlots, 40);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 0);
});

test('Sem saldo e sem selo não compra; selo não pode ser vendido ou reciclado', t => {
  const f = fixture(t, 35, 100);
  assert.equal(f.world.expandPlayerInventory(f.player, 35, 'cash', 100).success, false);
  assert.equal(f.world.expandPlayerInventory(f.player, 35, 'gold_item').success, false);
  assert.equal(f.player.gold, 100); assert.equal(f.player.maxInventorySlots, 35);
  f.db.addItemToInventory(f.player.dbCharacterId, INVENTORY_EXPANSION_SEAL, 1);
  const seal = f.db.getInventory(f.player.dbCharacterId).find(item => item.itemId === INVENTORY_EXPANSION_SEAL)!;
  assert.equal(f.world.sellPlayerItem(f.player, seal.slotIndex), false);
  assert.equal(f.world.discardOrRecyclePlayerItem(f.player, seal.slotIndex), false);
  assert.equal(f.db.hasItemQuantity(f.player.dbCharacterId, INVENTORY_EXPANSION_SEAL, 1), true);
});

test('Pacote exige capacidade e preço de cash corretos e ignora conta informada pelo cliente', t => {
  const f = fixture(t, 35);
  f.db.creditAccountCash(f.account.id, 100, 'store:packet');
  f.world.entityManager.addPlayer(f.player);
  const connection = { isAuthenticated: true, playerId: f.player.id, accountId: f.account.id, send() {} } as unknown as Connection;
  const handler = new PacketHandler(f.world);
  const send = (data: object) => handler.handlePacket(connection, JSON.stringify({ op: Opcode.C2S_EXPAND_INVENTORY, data }));
  send({ payment: 'cash', quotedCost: 100 });
  send({ expectedMaxSlots: 35, payment: 'cash', quotedCost: 1 });
  send({ expectedMaxSlots: 35, payment: 'cash' });
  send({ expectedMaxSlots: 35, payment: 'gold' });
  assert.equal(f.db.getAccountCashBalance(f.account.id), 100);
  assert.equal(f.player.maxInventorySlots, 35);
  send({ expectedMaxSlots: 35, payment: 'cash', quotedCost: 100, accountId: 'forged-other-account', cashBalance: 999999 });
  assert.equal(f.player.maxInventorySlots, 40);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 0);
  send({ expectedMaxSlots: 35, payment: 'cash', quotedCost: 100 });
  assert.equal(f.player.maxInventorySlots, 40);
});

test('Saldo por conta e recibos persistem ao reabrir o SQLite', t => {
  const folder = mkdtempSync(join(tmpdir(), 'magicforge-cash-'));
  const path = join(folder, 'test.db');
  const db = new DatabaseManager(path);
  const account = db.getOrCreateAccount('cash-persistence');
  const player = db.createCharacterInSlot('one', account.id, 0, 'CashPersist', CharacterClass.GUERREIRO);
  player.maxInventorySlots = 35; db.savePlayer(player);
  db.creditAccountCash(account.id, 300, 'store:persist');
  db.purchaseInventoryExpansion(player.dbCharacterId, 35, 'cash'); db.close();
  const reopened = new DatabaseManager(path); t.after(() => { reopened.close(); for (const suffix of ['', '-wal', '-shm']) if (existsSync(path + suffix)) unlinkSync(path + suffix); rmdirSync(folder); });
  assert.equal(reopened.getAccountCashBalance(account.id), 200);
  assert.equal(reopened.creditAccountCash(account.id, 300, 'store:persist'), 200);
  assert.equal(reopened.getCharacterById(player.dbCharacterId)!.max_inventory_slots, 40);
  assert.throws(() => reopened.purchaseInventoryExpansion(player.dbCharacterId, 35, 'cash'), /STALE/);
  assert.equal(reopened.getAccountCashBalance(account.id), 200);
});

test('Falha de notificação após commit não é apresentada como compra revertida', t => {
  const f = fixture(t, 35);
  f.db.creditAccountCash(f.account.id, 100, 'store:notification');
  t.mock.method(f.world, 'sendInventoryUpdate', () => { throw new Error('notification failed'); });
  assert.throws(() => f.world.expandPlayerInventory(f.player, 35, 'cash', 100), /notification failed/);
  assert.equal(f.db.getAccountCashBalance(f.account.id), 0);
  assert.equal(f.db.getCharacterById(f.player.dbCharacterId)!.max_inventory_slots, 40);
});
