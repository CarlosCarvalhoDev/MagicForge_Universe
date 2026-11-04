import type { OfflineRewardState } from '@magicforge/shared';
import { ITEMS_DATABASE } from '@magicforge/shared';

export const OFFLINE_REWARD_POLICY = {
  minimumSeconds: 300,
  freeLimitSeconds: 8 * 3600,
  premiumLimitSeconds: 12 * 3600,
  materialIntervalSeconds: 900,
  materialIntervalLimit: 10,
} as const;

export type OfflineAccessTier = 'free' | 'premium';

export function getOfflineLimitSeconds(tier: OfflineAccessTier = 'free'): number {
  return tier === 'premium'
    ? OFFLINE_REWARD_POLICY.premiumLimitSeconds
    : OFFLINE_REWARD_POLICY.freeLimitSeconds;
}

/** Pure calculation; premium may only be selected by a future trusted entitlement service. */
export function calculateOfflineReward(
  state: { lastLogoutTime: number; currentWorld: number; currentStage: number; level: number },
  now: number,
  previous: OfflineRewardState | null = null,
  tier: OfflineAccessTier = 'free',
): OfflineRewardState | null {
  if (!Number.isFinite(state.lastLogoutTime) || state.lastLogoutTime <= 0) return previous;
  const elapsed = Math.max(0, Math.floor((now - state.lastLogoutTime) / 1000));
  if (!previous && elapsed < OFFLINE_REWARD_POLICY.minimumSeconds) return null;

  // An already generated chest keeps its original policy and rates for credited time.
  const maxOfflineSeconds = previous?.maxOfflineSeconds ?? getOfflineLimitSeconds(tier);
  const priorSeconds = previous?.cappedSeconds ?? 0;
  const cappedSeconds = Math.min(maxOfflineSeconds, priorSeconds + elapsed);
  const addedSeconds = cappedSeconds - priorSeconds;
  const goldRate = state.currentWorld * 15 + state.currentStage * 5 + state.level * 3;
  const expRate = state.currentWorld * 10 + state.currentStage * 4 + state.level * 2;
  const intervals = Math.min(
    OFFLINE_REWARD_POLICY.materialIntervalLimit,
    Math.floor(cappedSeconds / OFFLINE_REWARD_POLICY.materialIntervalSeconds),
  );

  return {
    accumulatedGold: (previous?.accumulatedGold ?? 0) + Math.floor(addedSeconds * goldRate),
    accumulatedExp: (previous?.accumulatedExp ?? 0) + Math.floor(addedSeconds * expRate),
    loot: intervals > 0 ? [
      { itemId: 'ore_iron_arcane', name: ITEMS_DATABASE.ore_iron_arcane.name, rarity: ITEMS_DATABASE.ore_iron_arcane.rarity, quantity: intervals * 2 },
      { itemId: 'potion_hp_minor', name: ITEMS_DATABASE.potion_hp_minor.name, rarity: ITEMS_DATABASE.potion_hp_minor.rarity, quantity: Math.max(1, Math.floor(intervals * 1.5)) },
    ] : [],
    offlineSeconds: (previous?.offlineSeconds ?? 0) + elapsed,
    cappedSeconds,
    maxOfflineSeconds,
  };
}
