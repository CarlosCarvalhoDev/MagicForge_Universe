import { EquipmentSlot, FUSION_RECIPES, ITEMS_DATABASE, ItemRarity, ItemType, bagItems,
  findAutoEquipUpgrade, getFusionPreview, getInventoryExpansion } from '@magicforge/shared';
import type { Player } from '../src/entities/Player';
import type { World } from '../src/game/World';

export type InventorySimulationPolicy = 'retain' | 'expand' | 'managed';
export interface SimulationAction {
  seconds: number; kind: string; itemOrSkillId: string; goldSpent: number; level?: number;
  goldEarned?: number; instanceId?: string; reservedInstanceIds?: string[]; inputInstanceIds?: string[];
}

/** Reserve up to three free identical inputs for one compatible weapon fusion. No locks are changed. */
export function getReservedFusionInputs(player: Player): string[] {
  const recipe = Object.values(FUSION_RECIPES).find(recipe => recipe.classes.includes(player.classType) &&
    ITEMS_DATABASE[recipe.outputItemId].equipmentSlot === EquipmentSlot.ARMA);
  if (!recipe) return [];
  return getFusionPreview(recipe, player.inventory, player).eligible.slice(0, recipe.inputCount)
    .map(item => item.instanceId!);
}

/** Simulated user actions through production methods; this is not a new gameplay autopurchase system. */
export function manageSimulationInventory(world: World, player: Player, options: {
  policy: InventorySimulationPolicy; seconds: number; reserveFusion: boolean;
}): SimulationAction[] {
  if (options.policy === 'retain' || player.isDead) return [];
  const actions: SimulationAction[] = [];
  const record = (kind: string, itemOrSkillId: string, beforeGold: number, extra: Partial<SimulationAction> = {}) => {
    actions.push({ seconds: options.seconds, kind, itemOrSkillId, goldSpent: Math.max(0, beforeGold - player.gold), ...extra });
  };
  const reserved = new Set(options.reserveFusion ? getReservedFusionInputs(player) : []);
  if (options.policy === 'managed') {
    // Same class-weighted scoring as the real button, excluding ingredients the simulated user saves.
    for (let n = 0; n < 10; n++) {
      const upgrade = findAutoEquipUpgrade(player.inventory.filter(item => !reserved.has(item.instanceId!)), player);
      if (!upgrade) break;
      const beforeGold = player.gold;
      if (!world.usePlayerItem(player, upgrade.candidate.slotIndex)) break;
      record('equip', upgrade.candidate.itemId, beforeGold, { instanceId: upgrade.candidate.instanceId,
        reservedInstanceIds: [...reserved] });
    }
  }
  // Expansion has first claim on the wallet when occupancy reaches 80%; all live gates still apply.
  const expansion = getInventoryExpansion(player.maxInventorySlots);
  if (bagItems(player.inventory).length >= Math.ceil(player.maxInventorySlots * .8) && expansion &&
      !expansion.premium && player.gold >= expansion.cost) {
    const beforeGold = player.gold;
    const result = world.expandPlayerInventory(player, player.maxInventorySlots);
    if (result.success) record('expand', String(result.newMaxSlots), beforeGold, { level: result.newMaxSlots });
  }
  if (options.policy !== 'managed' || bagItems(player.inventory).length < Math.ceil(player.maxInventorySlots * .9)) return actions;
  // Retain materials/consumables, protected/refined/socketed items and three chosen fusion inputs.
  const candidates = player.inventory.filter(item => {
    const definition = ITEMS_DATABASE[item.itemId];
    return !item.isEquipped && !item.isLocked && !reserved.has(item.instanceId!) &&
      !(item.refineLevel ?? 0) && !item.sockets?.length && definition?.type === ItemType.EQUIPAMENTO &&
      [ItemRarity.COMUM, ItemRarity.INCOMUM].includes(definition.rarity);
  }).sort((a, b) => a.slotIndex - b.slotIndex);
  for (const candidate of candidates) {
    if (bagItems(player.inventory).length <= Math.floor(player.maxInventorySlots * .75)) break;
    const current = player.inventory.find(item => item.instanceId === candidate.instanceId);
    if (!current) continue;
    const beforeGold = player.gold;
    if (world.sellPlayerItem(player, current.slotIndex)) record('sell', current.itemId, beforeGold, {
      goldEarned: player.gold - beforeGold, instanceId: current.instanceId, reservedInstanceIds: [...reserved],
    });
  }
  return actions;
}
