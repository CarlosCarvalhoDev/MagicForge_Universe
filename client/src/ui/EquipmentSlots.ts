import { EquipmentSlot, ITEMS_DATABASE, RARITY_COLORS } from '@magicforge/shared';

export const equipmentSlots = {
  head: { slot: EquipmentSlot.ELMO, icon: 'helmet', label: 'Elmo' },
  chest: { slot: EquipmentSlot.ARMADURA, icon: 'armor', label: 'Armadura' },
  legs: { slot: EquipmentSlot.BOTAS, icon: 'boots', label: 'Botas' },
  main_hand: { slot: EquipmentSlot.ARMA, icon: 'weapon', label: 'Arma' },
  off_hand: { slot: EquipmentSlot.ESCUDO, icon: 'shield', label: 'Escudo' },
  relic: { slot: EquipmentSlot.ACESSORIO, icon: 'relic', label: 'Relíquia' },
} as const;

type EquipmentSlotKey = keyof typeof equipmentSlots;
type EquippedItem = { itemId: string; refineLevel?: number };

export function renderEquipmentSlot(element: HTMLElement, key: EquipmentSlotKey, item?: EquippedItem, inventoryKnown = true): void {
  const slot = equipmentSlots[key];
  const definition = item && ITEMS_DATABASE[item.itemId];
  const rarity = definition && RARITY_COLORS[definition.rarity];
  const icon = document.createElement('img');
  icon.className = 'slot-placeholder-icon';
  icon.src = `/assets/ui/slots/slot_${slot.icon}.png`;
  icon.alt = '';
  const label = document.createElement('span');
  label.className = 'slot-label';
  label.textContent = slot.label;
  element.classList.toggle('equipped', !!definition);
  element.style.setProperty('--equipment-color', rarity?.border ?? '#d5b477');
  element.style.setProperty('--equipment-glow', rarity?.glow ?? '#d5b47766');
  const suffix = item?.refineLevel ? ` +${item.refineLevel}` : '';
  element.title = definition
    ? `${slot.label}: ${definition.name}${suffix}`
    : `${slot.label}: ${inventoryKnown ? 'vazio' : 'indisponível'}`;
  element.setAttribute('aria-label', element.title);
  element.replaceChildren(icon, label);
  if (definition && item?.refineLevel) {
    const badge = document.createElement('span');
    badge.className = 'slot-refine-badge';
    badge.textContent = suffix.trim();
    element.append(badge);
  }
}
