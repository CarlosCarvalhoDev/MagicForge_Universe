export const DEFAULT_SKILL_CAST_ORDER = [1, 2, 3, 4] as const;

export function isValidSkillCastOrder(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 4 && new Set(value).size === 4 &&
    value.every(slot => Number.isInteger(slot) && slot >= 1 && slot <= 4);
}

/** Advance after a successful cast; unavailable slots never block the cycle. */
export function selectNextSkillSlot(order: readonly number[], cursor: number, ready: (slot: number) => boolean) {
  for (let offset = 0; offset < order.length; offset++) {
    const index = (cursor + offset) % order.length;
    const slot = order[index];
    if (ready(slot)) return { slot, nextCursor: (index + 1) % order.length };
  }
  return null;
}
