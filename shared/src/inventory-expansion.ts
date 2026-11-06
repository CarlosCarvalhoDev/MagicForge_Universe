export const INVENTORY_MAX_SLOTS = 50;
export const INVENTORY_EXPANSIONS: Record<number, { cost: number; minLevel: number; minReborn?: number }> = {
  20: { cost: 10_000, minLevel: 15 }, 25: { cost: 50_000, minLevel: 25 },
  30: { cost: 250_000, minLevel: 35 }, 35: { cost: 1_000_000, minLevel: 45 },
  40: { cost: 3_500_000, minLevel: 50 }, 45: { cost: 10_000_000, minLevel: 50, minReborn: 1 },
};

/** Legacy migrations can preserve capacities such as 31; use their actual price band. */
export function getInventoryExpansion(slots: number) {
  if (!Number.isInteger(slots) || slots < 20 || slots >= INVENTORY_MAX_SLOTS) return undefined;
  return { ...INVENTORY_EXPANSIONS[Math.floor(slots / 5) * 5], slotsAdded: Math.min(5, INVENTORY_MAX_SLOTS - slots), newMaxSlots: Math.min(INVENTORY_MAX_SLOTS, slots + 5) };
}
