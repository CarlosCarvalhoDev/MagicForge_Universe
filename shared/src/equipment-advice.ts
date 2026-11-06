import { ITEMS_DATABASE, ItemType, type ItemAttributesBonus } from './items';
import type { CharacterAttributes, CharacterClass } from './entities';
import type { InventoryItemPayload } from './messages';

export function getEquipmentBonuses(item: InventoryItemPayload): ItemAttributesBonus {
  const result: ItemAttributesBonus = {};
  const base = ITEMS_DATABASE[item.itemId]?.statsBonus ?? {};
  for (const key of Object.keys(base) as Array<keyof ItemAttributesBonus>) result[key] = Math.round(base[key]! * (1 + (item.refineLevel ?? 0) * .08));
  for (const socket of item.sockets ?? []) {
    const gem = ITEMS_DATABASE[socket.gemId]?.statsBonus ?? {};
    for (const key of Object.keys(gem) as Array<keyof ItemAttributesBonus>) result[key] = (result[key] ?? 0) + gem[key]!;
  }
  return result;
}

export interface EquipmentSuggestion {
  candidate: InventoryItemPayload;
  equipped?: InventoryItemPayload;
  delta: ItemAttributesBonus;
}
export interface EquipmentAdvicePayload { characterId: string; suggestions: EquipmentSuggestion[]; }

/** Conservative advice: no stat loss, no protected choices, no CP-based build assumptions. */
export function getEquipmentSuggestions(items: readonly InventoryItemPayload[], hero: { classType: CharacterClass; level: number; attributes: CharacterAttributes }): EquipmentSuggestion[] {
  const suggestions = new Map<string, EquipmentSuggestion>();
  for (const candidate of [...items].sort((a, b) => a.slotIndex - b.slotIndex)) {
    const def = ITEMS_DATABASE[candidate.itemId];
    if (candidate.isEquipped || candidate.isLocked || def?.type !== ItemType.EQUIPAMENTO || !def.equipmentSlot) continue;
    if (hero.level < (def.minLevel ?? 1) || (def.allowedClasses && !def.allowedClasses.includes(hero.classType))) continue;
    if (Object.entries(def.requiredAttributes ?? {}).some(([key, value]) => hero.attributes[key as keyof CharacterAttributes] < value!)) continue;
    const equipped = items.find(item => item.isEquipped && ITEMS_DATABASE[item.itemId]?.equipmentSlot === def.equipmentSlot);
    if (equipped?.isLocked) continue;
    const next = getEquipmentBonuses(candidate), current = equipped ? getEquipmentBonuses(equipped) : {};
    const keys = new Set([...Object.keys(next), ...Object.keys(current)] as Array<keyof ItemAttributesBonus>);
    const delta = Object.fromEntries([...keys].map(key => [key, (next[key] ?? 0) - (current[key] ?? 0)])) as ItemAttributesBonus;
    if (!Object.values(delta).some(value => value > 0) || Object.values(delta).some(value => value < 0)) continue;
    const previous = suggestions.get(def.equipmentSlot);
    // Prefer an improvement over the existing suggestion only if it also dominates that suggestion.
    if (previous) {
      const prior = getEquipmentBonuses(previous.candidate);
      const all = new Set([...Object.keys(prior), ...Object.keys(next)] as Array<keyof ItemAttributesBonus>);
      if ([...all].some(key => (next[key] ?? 0) < (prior[key] ?? 0))) continue;
      if (![...all].some(key => (next[key] ?? 0) > (prior[key] ?? 0))) continue;
    }
    suggestions.set(def.equipmentSlot, { candidate, equipped, delta });
  }
  return [...suggestions.values()];
}
