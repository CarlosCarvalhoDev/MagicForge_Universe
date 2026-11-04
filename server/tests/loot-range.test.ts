import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, ItemRarity, createVector3 } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import type { Connection } from '../src/network/Connection';

function scenario(t: TestContext, classType: CharacterClass, x: number, autoLoot = true) {
  const db = new DatabaseManager(':memory:');
  t.after(() => db.close());
  const world = new World(db);
  const account = db.getOrCreateAccount('loot_range_test');
  const player = db.createCharacterInSlot('loot_connection', account.id, 0, 'LootHero', classType);
  const connection = { id: player.id, accountId: account.id, isAuthenticated: true, send() {} } as unknown as Connection;
  world.enterWorld(connection, player);
  for (const monster of world.entityManager.getAllMonsters()) {
    world.entityManager.removeMonster(monster.id);
    world.spatialGrid.removeEntity(monster.id);
  }
  player.farmSettings.autoLootEnabled = autoLoot;
  world.activeItemDrops.set('range_drop', { dropId: 'range_drop', itemId: 'gold', name: 'Ouro',
    rarity: ItemRarity.COMUM, quantity: 10, position: createVector3(x, 0, 0), spawnTime: Date.now(), despawnSec: 60 });
  return { world, player };
}

test('Arqueiro coleta loot no alcance de ataque incluindo espalhamento, uma única vez', (t) => {
  const { world, player } = scenario(t, CharacterClass.ARQUEIRO, 13.4);
  const gold = player.gold;
  world.update(0.05);
  assert.equal(player.gold, gold + 10);
  assert.equal(player.huntSession.snapshot().lootGold, 10);
  assert.equal(world.activeItemDrops.has('range_drop'), false);
  world.update(0.05);
  assert.equal(player.gold, gold + 10);
});

test('Clérigo coleta dentro do próprio alcance; melee preserva raio automático de 6m', (t) => {
  const cleric = scenario(t, CharacterClass.CLERIGO, 11.4);
  cleric.world.update(0.05);
  assert.equal(cleric.player.huntSession.snapshot().lootGold, 10);
  const melee = scenario(t, CharacterClass.GUERREIRO, 6.5);
  melee.world.update(0.05);
  assert.equal(melee.player.huntSession.snapshot().lootGold, 0);
  assert.equal(melee.world.lootItem(melee.player, 'range_drop'), true, 'Toque manual mantém a tolerância de 7m');
});

test('Automático desligado não amplia coleta manual; pedidos além do raio são rejeitados', (t) => {
  const disabled = scenario(t, CharacterClass.ARQUEIRO, 12, false);
  disabled.world.update(0.05);
  assert.equal(disabled.player.huntSession.snapshot().lootGold, 0);
  assert.equal(disabled.world.lootItem(disabled.player, 'range_drop'), false);
  const tooFar = scenario(t, CharacterClass.ARQUEIRO, 14);
  tooFar.world.update(0.05);
  assert.equal(tooFar.world.lootItem(tooFar.player, 'range_drop'), false);
  assert.equal(tooFar.player.huntSession.snapshot().lootGold, 0);
});
