import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, ITEMS_DATABASE, ItemType } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';

for (const classType of [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.ARQUEIRO, CharacterClass.CLERIGO]) {
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
