import { SERVER_CONFIG } from '../config';

export class GameLoop {
  private isRunning: boolean = false;
  private timerId: NodeJS.Timeout | null = null;
  private onTickCallback: (deltaTimeSec: number) => void;

  // Nanosecond timing
  private readonly targetTickIntervalNs: bigint;
  private lastTickTimeNs: bigint = 0n;
  private lagNs: bigint = 0n;

  // Performance monitoring
  private ticksInSecond: number = 0;
  private lastFpsCheckTime: number = Date.now();
  public currentActualFps: number = 0;

  constructor(onTick: (deltaTimeSec: number) => void) {
    this.onTickCallback = onTick;
    // 50ms in nanoseconds = 50,000,000 ns
    this.targetTickIntervalNs = BigInt(SERVER_CONFIG.TICK_INTERVAL_MS) * 1_000_000n;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTimeNs = process.hrtime.bigint();
    this.lagNs = 0n;
    this.lastFpsCheckTime = Date.now();

    console.log(
      `[GameLoop] Started authoritative loop at ${SERVER_CONFIG.TICK_RATE}Hz (${SERVER_CONFIG.TICK_INTERVAL_MS}ms tick interval)`
    );

    this.scheduleNextTick();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    console.log('[GameLoop] Stopped.');
  }

  private scheduleNextTick(): void {
    if (!this.isRunning) return;

    // Use a short timer resolution (e.g. 5ms) to poll high-res time without busy-spinning CPU
    this.timerId = setTimeout(() => {
      this.step();
      this.scheduleNextTick();
    }, 4);
  }

  private step(): void {
    const currentNs = process.hrtime.bigint();
    const elapsedNs = currentNs - this.lastTickTimeNs;
    this.lastTickTimeNs = currentNs;
    this.lagNs += elapsedNs;

    const maxCatchupTicks = 3; // Prevent spiral of death if system hitches
    let ticksExecuted = 0;

    while (this.lagNs >= this.targetTickIntervalNs && ticksExecuted < maxCatchupTicks) {
      this.onTickCallback(SERVER_CONFIG.TICK_DELTA_TIME_SEC);
      this.lagNs -= this.targetTickIntervalNs;
      ticksExecuted++;
      this.ticksInSecond++;
    }

    // Discard excess lag if spiral limit hit
    if (this.lagNs >= this.targetTickIntervalNs) {
      this.lagNs = 0n;
    }

    // Monitor FPS / Tick Rate
    const now = Date.now();
    if (now - this.lastFpsCheckTime >= 5000) {
      const elapsedSec = (now - this.lastFpsCheckTime) / 1000;
      this.currentActualFps = parseFloat((this.ticksInSecond / elapsedSec).toFixed(1));
      this.ticksInSecond = 0;
      this.lastFpsCheckTime = now;
      console.log(`[GameLoop Health] Server Tick Rate: ${this.currentActualFps} Hz (Target: ${SERVER_CONFIG.TICK_RATE} Hz)`);
    }
  }
}
