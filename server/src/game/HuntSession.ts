import type { S2CHuntReportPayload } from '@magicforge/shared';

type Counters = Pick<S2CHuntReportPayload,
  'kills' | 'combatExp' | 'lootGold' | 'autoSaleGold' | 'manualSaleGold' |
  'hpPotionsUsed' | 'resourcePotionsUsed' | 'deaths'>;

/** In-memory, fixed-size counters. Survive channel transfers with Player, never reconnects. */
export class HuntSession {
  public elapsedSeconds = 0;
  private totals: Counters = this.emptyCounters();

  private emptyCounters(): Counters {
    return { kills: 0, combatExp: 0, lootGold: 0, autoSaleGold: 0, manualSaleGold: 0,
      hpPotionsUsed: 0, resourcePotionsUsed: 0, deaths: 0 };
  }

  public advance(seconds: number): void {
    if (Number.isFinite(seconds) && seconds > 0) this.elapsedSeconds += seconds;
  }

  public add(counter: keyof Counters, amount = 1): void {
    if (Number.isFinite(amount) && amount > 0) this.totals[counter] += Math.floor(amount);
  }

  public reset(): void {
    this.elapsedSeconds = 0;
    this.totals = this.emptyCounters();
  }

  public snapshot(): Counters & Pick<S2CHuntReportPayload, 'elapsedSeconds' | 'expPerHour' | 'goldPerHour'> {
    // Millisecond rounding avoids 1,200 ticks of 0.05s being displayed as 59 seconds.
    const elapsed = Math.round(this.elapsedSeconds * 1000) / 1000;
    const rate = (amount: number) => elapsed >= 60 ? Math.round(amount * 3600 / elapsed) : null;
    return { ...this.totals, elapsedSeconds: elapsed,
      expPerHour: rate(this.totals.combatExp), goldPerHour: rate(this.totals.lootGold) };
  }
}
