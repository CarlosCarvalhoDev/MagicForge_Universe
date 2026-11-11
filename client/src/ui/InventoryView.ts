import { getEquipmentBonuses, ITEMS_DATABASE, ItemRarity, ItemType, type InventoryItemPayload, type ItemAttributesBonus } from '@magicforge/shared';
import { createItemIcon } from './ItemIcon';

export interface InventoryViewState { query: string; type: string; rarity: string; sort: 'slot' | 'name' | 'rarity'; }
export const DEFAULT_INVENTORY_VIEW: InventoryViewState = { query: '', type: 'all', rarity: 'all', sort: 'slot' };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const rarityOrder = [ItemRarity.COMUM, ItemRarity.INCOMUM, ItemRarity.RARO, ItemRarity.EPICO, ItemRarity.LENDARIO];

export function selectBagView(items: readonly InventoryItemPayload[], state: InventoryViewState): InventoryItemPayload[] {
  const query = normalize(state.query.trim());
  return items.filter(item => {
    const def = ITEMS_DATABASE[item.itemId];
    return !item.isEquipped && def && (state.type === 'all' || def.type === state.type) &&
      (state.rarity === 'all' || def.rarity === state.rarity) &&
      (!query || normalize(`${def.name} ${def.equipmentSlot ?? ''} ${def.description}`).includes(query));
  }).sort((a, b) => {
    const da = ITEMS_DATABASE[a.itemId], db = ITEMS_DATABASE[b.itemId];
    const difference = state.sort === 'rarity' ? rarityOrder.indexOf(db.rarity) - rarityOrder.indexOf(da.rarity) :
      state.sort === 'name' ? da.name.localeCompare(db.name, 'pt-BR') : 0;
    return difference || a.slotIndex - b.slotIndex;
  });
}

export const itemBonuses = getEquipmentBonuses;

export function compareEquipment(candidate: InventoryItemPayload, items: readonly InventoryItemPayload[]) {
  const def = ITEMS_DATABASE[candidate.itemId];
  if (def?.type !== ItemType.EQUIPAMENTO) return null;
  const equipped = items.find(item => item.isEquipped && ITEMS_DATABASE[item.itemId]?.equipmentSlot === def.equipmentSlot);
  const next = itemBonuses(candidate), current = equipped ? itemBonuses(equipped) : {};
  const keys = new Set([...Object.keys(next), ...Object.keys(current)] as Array<keyof ItemAttributesBonus>);
  return { equipped, delta: Object.fromEntries([...keys].map(key => [key, (next[key] ?? 0) - (current[key] ?? 0)])) as ItemAttributesBonus };
}

export function renderEquipmentComparison(root: HTMLElement, candidate: InventoryItemPayload | undefined, items: readonly InventoryItemPayload[]) {
  root.replaceChildren();
  const comparison = candidate ? compareEquipment(candidate, items) : null;
  root.hidden = !comparison;
  if (!comparison || !candidate) return;
  const title = document.createElement('h4');
  title.textContent = candidate.isEquipped ? 'Equipado no herói' : 'Comparar com o equipado';
  title.prepend(createItemIcon(candidate.itemId));
  const context = document.createElement('p');
  context.textContent = comparison.equipped ? ITEMS_DATABASE[comparison.equipped.itemId].name : 'Este slot do herói está vazio.';
  if (comparison.equipped) context.prepend(createItemIcon(comparison.equipped.itemId));
  root.append(title, context);
  if (candidate.isEquipped) return;
  const labels: Record<keyof ItemAttributesBonus, string> = { forca: 'Força', destreza: 'Destreza', constituicao: 'Constituição', inteligencia: 'Inteligência', sabedoria: 'Sabedoria', carisma: 'Carisma', maxHp: 'Vida do item', maxResource: 'Recurso do item' };
  const current = comparison.equipped ? itemBonuses(comparison.equipped) : {}, next = itemBonuses(candidate);
  for (const key of Object.keys(comparison.delta) as Array<keyof ItemAttributesBonus>) {
    const delta = comparison.delta[key]!;
    const row = document.createElement('p');
    row.dataset.delta = delta > 0 ? 'gain' : delta < 0 ? 'loss' : 'same';
    row.textContent = `${labels[key]}: ${current[key] ?? 0} → ${next[key] ?? 0} (${delta > 0 ? '+' : ''}${delta})`;
    root.append(row);
  }
  const note = document.createElement('p');
  note.textContent = 'Bônus dos itens, incluindo refino e gemas. Confira também classe e nível requeridos.';
  root.append(note);
}
