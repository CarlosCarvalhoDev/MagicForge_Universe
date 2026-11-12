export const INVENTORY_MAX_SLOTS = 50;
export const INVENTORY_GOLD_ONLY_LIMIT = 35;
export const INVENTORY_EXPANSION_SEAL = 'seal_astral_expansion';
export type InventoryExpansionPayment = 'gold' | 'cash' | 'gold_item';
export const INVENTORY_EXPANSIONS: Record<number, { cost: number; minLevel: number; minReborn?: number; premium?: boolean; cashCost?: number }> = {
  20: { cost: 10_000, minLevel: 1 }, 25: { cost: 50_000, minLevel: 1 },
  30: { cost: 250_000, minLevel: 1 }, 35: { cost: 1_000_000, minLevel: 1, premium: true, cashCost: 100 },
  40: { cost: 3_500_000, minLevel: 1, premium: true, cashCost: 200 }, 45: { cost: 10_000_000, minLevel: 1, premium: true, cashCost: 400 },
};

/** Legacy migrations can preserve capacities such as 31; use their actual price band. */
export function getInventoryExpansion(slots: number) {
  if (!Number.isInteger(slots) || slots < 20 || slots >= INVENTORY_MAX_SLOTS) return undefined;
  const limit = slots < INVENTORY_GOLD_ONLY_LIMIT ? INVENTORY_GOLD_ONLY_LIMIT : INVENTORY_MAX_SLOTS;
  return { ...INVENTORY_EXPANSIONS[Math.floor(slots / 5) * 5], premium: slots >= INVENTORY_GOLD_ONLY_LIMIT,
    slotsAdded: Math.min(5, limit - slots), newMaxSlots: Math.min(limit, slots + 5) };
}
