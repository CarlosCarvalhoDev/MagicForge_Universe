export interface UpgradeFarmSample {
  elapsedSeconds: number;
  goldPerHour: number | null;
  arcaneDustPerHour?: number | null;
  autoSaleGold?: number;
}

/** Parallel resource acquisition: the slowest missing resource controls the estimate. */
export function estimateUpgradeSeconds(
  cost: { gold: number; dust: number },
  balance: { gold: number; dust: number },
  sample: UpgradeFarmSample | null,
): { state: 'ready' | 'sampling' | 'no-gold-rate' | 'no-dust-rate' | 'estimated'; seconds: number | null } {
  const gold = Math.max(0, cost.gold - balance.gold), dust = Math.max(0, cost.dust - balance.dust);
  if (!gold && !dust) return { state: 'ready', seconds: 0 };
  if (!sample || !Number.isFinite(sample.elapsedSeconds) || sample.elapsedSeconds < 60) return { state: 'sampling', seconds: null };
  const autoSalesPerHour = Number.isFinite(sample.autoSaleGold) ? Math.max(0, sample.autoSaleGold!) * 3600 / sample.elapsedSeconds : 0;
  const goldPerHour = (sample.goldPerHour ?? 0) + autoSalesPerHour;
  if (gold && (!Number.isFinite(goldPerHour) || goldPerHour <= 0)) return { state: 'no-gold-rate', seconds: null };
  if (dust && (!Number.isFinite(sample.arcaneDustPerHour) || (sample.arcaneDustPerHour ?? 0) <= 0)) return { state: 'no-dust-rate', seconds: null };
  return { state: 'estimated', seconds: Math.ceil(Math.max(
    gold ? gold * 3600 / goldPerHour : 0,
    dust ? dust * 3600 / sample.arcaneDustPerHour! : 0,
  )) };
}
