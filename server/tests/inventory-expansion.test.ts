import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, getInventoryExpansion } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';

test('Capacidade legada usa faixa correta, respeita requisitos e expansão persiste sem cobrar replay', t => {
  const db = new DatabaseManager(':memory:'); t.after(() => db.close());
  const account = db.getOrCreateAccount('expansion-test');
  const player = db.createCharacterInSlot('expansion', account.id, 0, 'ExpansionHero', CharacterClass.GUERREIRO);
  player.maxInventorySlots = 31; player.level = 30; player.gold = 2_000_000; db.savePlayer(player);
  const world = new World(db, 1, 1);
  assert.equal(getInventoryExpansion(31)!.cost, 250_000);
  assert.equal(world.expandPlayerInventory(player, 31).success, false);
  assert.equal(db.getCharacterGold(player.dbCharacterId), 2_000_000);
  player.level = 35; db.savePlayer(player);
  assert.equal(world.expandPlayerInventory(player, 31).success, true);
  assert.equal(player.maxInventorySlots, 36);
  assert.equal(player.gold, 1_750_000);
  assert.equal(world.expandPlayerInventory(player, 31).success, false);
  assert.equal(db.expandInventorySlots(player.dbCharacterId, 31, 250_000), null);
  const restored = db.loadPlayerFromRecord('again', db.getCharacterByName(player.name)!);
  assert.equal(restored.maxInventorySlots, 36);
  assert.equal(restored.gold, 1_750_000);
});

test('Última expansão legada concede apenas os espaços até 50 e exige Reborn', t => {
  const db = new DatabaseManager(':memory:'); t.after(() => db.close());
  const account = db.getOrCreateAccount('expansion-cap');
  const player = db.createCharacterInSlot('expansion-cap', account.id, 0, 'CapHero', CharacterClass.GUERREIRO);
  player.maxInventorySlots = 48; player.level = 50; player.gold = 20_000_000; db.savePlayer(player);
  const world = new World(db, 1, 1);
  assert.equal(world.expandPlayerInventory(player, 48).success, false);
  player.rebornCount = 1; db.savePlayer(player);
  assert.equal(world.expandPlayerInventory(player, 48).success, true);
  assert.equal(player.maxInventorySlots, 50);
  assert.equal(player.gold, 10_000_000);
  assert.equal(world.expandPlayerInventory(player, 50).success, false);
});
