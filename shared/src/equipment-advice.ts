import { ITEMS_DATABASE, ItemType, type ItemAttributesBonus } from './items';
import { CLASS_DEFINITIONS, PrimaryStatType, type CharacterAttributes, type CharacterClass } from './entities';
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
export interface AutoEquipResult { equippedCount: number; message: string; }

type EquipmentHero = { classType: CharacterClass; level: number; attributes: CharacterAttributes };

export function findAutoEquipUpgrade(items: readonly InventoryItemPayload[], hero: EquipmentHero) {
  const primary = CLASS_DEFINITIONS[hero.classType].mainStat;
  const primaryKeys = primary === PrimaryStatType.FORCA_E_CARISMA ? ['forca', 'carisma'] : [primary.toLowerCase()];
  const score = (bonuses: ItemAttributesBonus) => Object.entries(bonuses).reduce((total, [key, value]) =>
    total + (value ?? 0) * (primaryKeys.includes(key) ? 3 : key === 'constituicao' ? 2 : key === 'maxHp' || key === 'maxResource' ? .1 : 1), 0);
  const equipped = items.filter(item => item.isEquipped);
  const meetsStats = (item: InventoryItemPayload, attributes: CharacterAttributes) =>
    Object.entries(ITEMS_DATABASE[item.itemId]?.requiredAttributes ?? {}).every(([key, value]) => attributes[key as keyof CharacterAttributes] >= value!);
  let best: { candidate: InventoryItemPayload; attributes: CharacterAttributes; gain: number } | undefined;
  for (const candidate of items) {
    const definition = ITEMS_DATABASE[candidate.itemId];
    if (candidate.isEquipped || candidate.isLocked || definition?.type !== ItemType.EQUIPAMENTO || !definition.equipmentSlot) continue;
    if (hero.level < (definition.minLevel ?? 1) || (definition.allowedClasses && !definition.allowedClasses.includes(hero.classType))) continue;
    if (!meetsStats(candidate, hero.attributes)) continue;
    const current = equipped.find(item => ITEMS_DATABASE[item.itemId]?.equipmentSlot === definition.equipmentSlot);
    if (current?.isLocked) continue;
    const next = getEquipmentBonuses(candidate);
    const previous = current ? getEquipmentBonuses(current) : {};
    const gain = score(next) - score(previous);
    if (gain < 0 || (current && gain <= 0) || (best && (best.gain > gain || (best.gain === gain && best.candidate.slotIndex <= candidate.slotIndex)))) continue;
    const attributes = { ...hero.attributes };
    for (const key of Object.keys(attributes) as Array<keyof CharacterAttributes>) {
      attributes[key] += (next[key] ?? 0) - (previous[key] ?? 0);
    }
    if (!meetsStats(candidate, attributes) || equipped.some(item => item !== current && meetsStats(item, hero.attributes) && !meetsStats(item, attributes))) continue;
    best = { candidate, attributes, gain };
  }
  return best;
}

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
