import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, bagItems } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { getReservedFusionInputs, manageSimulationInventory } from '../tools/InventorySimulationPolicy';
import { simulateProgression } from '../tools/ProgressionSimulation';

function setup(t: { after(fn: () => void): void }, gold: number) {
  const db = new DatabaseManager(':memory:'); t.after(() => db.close());
  const account = db.getOrCreateAccount('inventory-policy');
  const player = db.createCharacterInSlot('inventory-policy', account.id, 0, 'InventoryPolicy', CharacterClass.GUERREIRO);
  const world = new World(db);
  const weapon = player.inventory.find(item => item.itemId === 'sword_iron_broadsword')!;
  world.usePlayerItem(player, weapon.slotIndex);
  player.gold = gold; db.savePlayer(player);
  while (bagItems(db.getInventory(player.dbCharacterId)).length < 19) db.addItemToInventory(player.dbCharacterId, 'sword_iron_broadsword');
  player.inventory = db.getInventory(player.dbCharacterId);
  return {db,player,world};
}

test('Gestão vende excedentes, preserva três ingredientes e não toca item protegido', t => {
  const f = setup(t, 50);
  const item = f.player.inventory.find(item => !item.isEquipped && item.itemId === 'sword_iron_broadsword')!;
  f.db.setItemLocked(f.player.dbCharacterId, item.instanceId!, true);
  f.player.inventory = f.db.getInventory(f.player.dbCharacterId);
  const reserved = getReservedFusionInputs(f.player);
  assert.equal(reserved.length, 3);
  const beforeGold = f.player.gold;
  const actions = manageSimulationInventory(f.world, f.player, {policy:'managed',seconds:1,reserveFusion:true});
  const sales = actions.filter(action => action.kind === 'sell');
  assert.ok(sales.length > 0);
  assert.ok(sales.every(action => !reserved.includes(action.instanceId!) && action.instanceId !== item.instanceId));
  assert.ok(reserved.every(id => f.player.inventory.some(item => item.instanceId === id && !item.isEquipped)));
  assert.ok(f.player.inventory.some(current => current.instanceId === item.instanceId && current.isLocked));
  assert.equal(f.player.gold - beforeGold, sales.reduce((sum, sale) => sum + sale.goldEarned!, 0));
});

test('Expansão simulada usa o custo real no nível 1 e não inventa espaços', t => {
  const f = setup(t, 10_000);
  assert.ok(bagItems(f.player.inventory).length >= 16);
  const actions = manageSimulationInventory(f.world, f.player, {policy:'expand',seconds:1,reserveFusion:true});
  assert.equal(actions.length, 1);
  assert.equal(actions[0].kind, 'expand'); assert.equal(actions[0].goldSpent, 10_000);
  assert.equal(f.player.maxInventorySlots, 25); assert.equal(f.player.gold, 0);
  assert.equal(f.db.getCharacterById(f.player.dbCharacterId)!.max_inventory_slots, 25);
});

test('Progressão gerenciada conserva saldo real, ingredientes e determinismo', () => {
  const options = {classType:CharacterClass.GUERREIRO,seed:101,seconds:600,investment:'fusion' as const,
    inventoryPolicy:'managed' as const,equipmentScoring:'class-weighted' as const};
  const run = simulateProgression(options);
  assert.equal(run.goldBalance, run.startingGold + run.lootGold + run.autoSaleGold + run.manualSaleGold - run.spentGold);
  assert.ok(run.actions.some(action => action.kind === 'fusion'));
  assert.ok(run.actions.filter(action => action.kind === 'sell').every(sale => !sale.reservedInstanceIds?.includes(sale.instanceId!)));
  // Production instance IDs use crypto entropy; compare deterministic decisions and ID relationships.
  const canonical = (value: unknown) => {
    const ids = new Map<string, string>();
    return JSON.parse(JSON.stringify(value, (_key, item) => {
      if (typeof item !== 'string' || !item.startsWith('inv_')) return item;
      if (!ids.has(item)) ids.set(item, `item${ids.size}`);
      return ids.get(item);
    }));
  };
  assert.deepEqual(canonical(simulateProgression(options)), canonical(run));
});
