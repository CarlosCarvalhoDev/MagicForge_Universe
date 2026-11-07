import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS_DATABASE, ItemType, type InventoryItemPayload } from '@magicforge/shared';
import { DEFAULT_INVENTORY_VIEW, selectBagView, itemBonuses, compareEquipment } from '../src/ui/InventoryView';
import { InventoryHold } from '../src/ui/InventoryTooltip';

const item = (itemId: string, slotIndex: number, isEquipped = false): InventoryItemPayload =>
  ({ itemId, slotIndex, isEquipped, quantity: 1, instanceId: `instance-${slotIndex}`, refineLevel: 0 });

test('Busca sem acento e filtros excluem equipamento vestido e preservam posições e identidades', () => {
  const items = [item('sword_iron_broadsword', -1, true), item('potion_hp_minor', 7), item('sword_iron_broadsword', 3)];
  const before = structuredClone(items);
  assert.deepEqual(selectBagView(items, { ...DEFAULT_INVENTORY_VIEW, query: 'pocao' }).map(i => i.slotIndex), [7]);
  const weapon = ITEMS_DATABASE.sword_iron_broadsword;
  assert.deepEqual(selectBagView(items, { ...DEFAULT_INVENTORY_VIEW, type: ItemType.EQUIPAMENTO, rarity: weapon.rarity }).map(i => i.instanceId), ['instance-3']);
  const sorted = selectBagView(items, { ...DEFAULT_INVENTORY_VIEW, sort: 'name' });
  assert.equal(sorted.length, 2);
  assert.deepEqual(items, before);
  assert.equal(selectBagView(items, { ...DEFAULT_INVENTORY_VIEW, query: 'inexistente' }).length, 0);
});

test('Comparação aplica refino e gemas e detecta perda ao trocar equipamento', () => {
  const equipped = { ...item('sword_iron_broadsword', -1, true), refineLevel: 5, sockets: [{gemId:'gem_ruby_str'}] };
  const candidate = item('sword_iron_broadsword', 4);
  const base = ITEMS_DATABASE.sword_iron_broadsword.statsBonus!.forca!;
  const gem = ITEMS_DATABASE.gem_ruby_str.statsBonus!.forca!;
  assert.equal(itemBonuses(equipped).forca, Math.round(base * 1.4) + gem);
  assert.equal(compareEquipment(candidate, [equipped])!.delta.forca, base - Math.round(base * 1.4) - gem);
  assert.equal(compareEquipment(candidate, [])!.delta.forca, base);
  assert.equal(compareEquipment(item('potion_hp_minor', 5), [equipped]), null);
});

test('Toque curto seleciona; segurar compara e consome o clique; rolar cancela a comparação', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const hold = new InventoryHold();
  let opened = 0;
  hold.start(20, 30, () => opened++);
  t.mock.timers.tick(200);
  hold.cancel();
  t.mock.timers.tick(500);
  assert.equal(opened, 0);
  assert.equal(hold.consumeClick(), false);
  hold.start(20, 30, () => opened++);
  t.mock.timers.tick(400);
  assert.equal(opened, 1);
  hold.cancel();
  assert.equal(hold.consumeClick(), true);
  assert.equal(hold.consumeClick(), false);
  hold.start(20, 30, () => opened++);
  assert.equal(hold.move(20, 65), true);
  t.mock.timers.tick(500);
  assert.equal(opened, 1);
  assert.equal(hold.consumeClick(), true);
});
