import { CharacterClass } from './entities';
import type { InventoryItemPayload } from './messages';

export interface FusionRecipe {
  id: string; version: number; name: string; preferredInputItemId: string; inputItemIds: readonly string[]; inputCount: number;
  outputItemId: string; goldCost: number; minLevel: number; classes: CharacterClass[];
  materials: Array<{ itemId: string; quantity: number }>;
}
export const FUSION_BASE_ITEMS = ['sword_iron_broadsword', 'staff_apprentice', 'bow_hunting', 'mace_cleric_dawn', 'armor_chainmail', 'robe_mystic_threads', 'shield_iron_buckler'] as const;
const recipe = (id: string, name: string, inputItemId: string, outputItemId: string, classes: CharacterClass[]): FusionRecipe => ({
  id, version: 1, name, preferredInputItemId: inputItemId, inputItemIds: FUSION_BASE_ITEMS, inputCount: 3, outputItemId, classes, goldCost: 1800, minLevel: 5,
  materials: [{ itemId: 'ore_iron_arcane', quantity: 6 }, { itemId: 'arcane_dust', quantity: 8 }],
});
export const FUSION_RECIPES: Record<string, FusionRecipe> = Object.fromEntries([
  recipe('forge_blade_v1', 'Têmpera da Bigorna', 'sword_iron_broadsword', 'sword_runic_tempered', [CharacterClass.GUERREIRO, CharacterClass.BARBARO]),
  recipe('forge_bow_v1', 'Corda do Bosque Ancestral', 'bow_hunting', 'bow_warden_runic', [CharacterClass.ARQUEIRO]),
  recipe('forge_mace_v1', 'Consagração da Aurora', 'mace_cleric_dawn', 'mace_dawn_consecrated', [CharacterClass.CLERIGO]),
  recipe('forge_staff_v1', 'Foco da Trama Arcana', 'staff_apprentice', 'staff_runic_focus', [CharacterClass.MAGO]),
  recipe('forge_pact_v1', 'Selo do Pacto Velado', 'staff_apprentice', 'focus_veiled_pact', [CharacterClass.BRUXO]),
  recipe('forge_wraps_v1', 'Anéis do Caminho Sereno', 'sword_iron_broadsword', 'wraps_serene_path', [CharacterClass.MONGE]),
  recipe('forge_mail_v1', 'Elos da Vigília', 'armor_chainmail', 'armor_runic_vigil', [CharacterClass.GUERREIRO, CharacterClass.BARBARO, CharacterClass.CLERIGO]),
  recipe('forge_robe_v1', 'Tecelagem da Trama', 'robe_mystic_threads', 'robe_runic_weave', [CharacterClass.MAGO, CharacterClass.BRUXO]),
].map(value => [value.id, value]));

export interface FusionRequest { requestId: string; recipeId: string; recipeVersion: number; inputInstanceIds: string[]; }
export interface FusionResult { requestId: string; success: boolean; message: string; outputInstanceId?: string; replayed?: boolean; }
export function isFusionIngredient(item: InventoryItemPayload, recipe: FusionRecipe): boolean {
  return recipe.inputItemIds.includes(item.itemId) && !!item.instanceId && !item.isEquipped && !item.isLocked && item.slotIndex >= 0 && item.quantity === 1 && (item.refineLevel ?? 0) === 0 && !item.sockets?.length;
}
export function getFusionPreview(recipe: FusionRecipe, items: readonly InventoryItemPayload[], hero: { classType: CharacterClass; level: number; gold: number }) {
  const groups = recipe.inputItemIds.map(id => items.filter(item => item.itemId === id && isFusionIngredient(item, recipe)).sort((a,b)=>a.slotIndex-b.slotIndex));
  const preferred = groups.find(group => group.length >= recipe.inputCount && group[0].itemId === recipe.preferredInputItemId);
  const eligible = preferred ?? groups.sort((a,b)=>b.length-a.length)[0] ?? [];
  const materials = recipe.materials.map(material => ({ ...material, available: items.filter(item => !item.isLocked && !item.isEquipped && item.itemId === material.itemId).reduce((sum, item) => sum + item.quantity, 0) }));
  const reason = !recipe.classes.includes(hero.classType) ? 'Receita de outra classe.' : hero.level < recipe.minLevel ? `Requer nível ${recipe.minLevel}.` : eligible.length < recipe.inputCount ? `Requer ${recipe.inputCount} cópias livres. Disponíveis: ${eligible.length}.` : hero.gold < recipe.goldCost ? `Faltam ${(recipe.goldCost - hero.gold).toLocaleString('pt-BR')} ouro.` : materials.some(material => material.available < material.quantity) ? 'Faltam materiais desbloqueados.' : '';
  return { eligible, selected: eligible.slice(0, recipe.inputCount), materials, reason };
}
