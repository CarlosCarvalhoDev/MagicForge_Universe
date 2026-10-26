import {
  EntitySnapshotState,
  lerp,
  lerpVector3,
  S2CWorldSnapshotPayload,
  Vector3,
} from '@magicforge/shared';

export interface TimestampedSnapshot {
  receiveTime: number; // Client time when packet arrived (performance.now())
  serverTick: number;
  serverTimestamp: number;
  entities: Map<string, EntitySnapshotState>;
}

export interface InterpolatedEntity {
  id: string;
  type: string;
  name: string;
  position: Vector3;
  headingYaw: number;
  currentHp: number;
  maxHp: number;
  isMoving: boolean;
  targetId?: string | null;
  classType?: string;
  rawPosition: Vector3; // Position in latest raw snapshot (for visual comparison)
}

export class SnapshotBuffer {
  private snapshots: TimestampedSnapshot[] = [];
  private readonly maxBufferSize = 30; // ~1.5s of history at 20Hz

  /**
   * Render delay in milliseconds.
   * Standard MMO setting is 2 * (1000 / TICK_RATE) = 100ms.
   * This guarantees there are always 2 snapshots to interpolate between,
   * absorbing minor jitter without causing stutter.
   */
  public renderDelayMs: number = 100;

  /**
   * Add incoming authoritative snapshot to buffer
   */
  public pushSnapshot(payload: S2CWorldSnapshotPayload): void {
    const receiveTime = performance.now();
    const entityMap = new Map<string, EntitySnapshotState>();

    for (const ent of payload.entities) {
      entityMap.set(ent.id, ent);
    }

    this.snapshots.push({
      receiveTime,
      serverTick: payload.serverTick,
      serverTimestamp: payload.serverTimestamp,
      entities: entityMap,
    });

    // Prune old snapshots
    if (this.snapshots.length > this.maxBufferSize) {
      this.snapshots.shift();
    }
  }

  /**
   * Get interpolated states for all entities at the current render time
   * @param useInterpolation if false, returns raw snappy 20Hz positions for comparison
   */
  public getInterpolatedEntities(useInterpolation = true): InterpolatedEntity[] {
    if (this.snapshots.length === 0) {
      return [];
    }

    const latestSnapshot = this.snapshots[this.snapshots.length - 1];

    // If interpolation is disabled by user toggle, return latest raw snapshot
    if (!useInterpolation || this.snapshots.length < 2) {
      return Array.from(latestSnapshot.entities.values()).map((ent) => ({
        id: ent.id,
        type: ent.type,
        name: ent.name,
        position: { ...ent.position },
        rawPosition: { ...ent.position },
        headingYaw: ent.headingYaw,
        currentHp: ent.currentHp,
        maxHp: ent.maxHp,
        isMoving: ent.isMoving,
        targetId: ent.targetId,
        classType: ent.classType,
      }));
    }

    const now = performance.now();
    const renderTime = now - this.renderDelayMs;

    // 1. Locate the two snapshots surrounding renderTime
    let older: TimestampedSnapshot | null = null;
    let newer: TimestampedSnapshot | null = null;

    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      const snap = this.snapshots[i];
      if (snap.receiveTime <= renderTime) {
        older = snap;
        newer = this.snapshots[i + 1] || latestSnapshot;
        break;
      }
    }

    // Fallbacks if not found
    if (!older) {
      older = this.snapshots[0];
      newer = this.snapshots[1] || older;
    }
    if (!newer) {
      newer = latestSnapshot;
    }

    // Compute interpolation factor alpha [0.0 - 1.0]
    const timeDelta = newer.receiveTime - older.receiveTime;
    const alpha = timeDelta > 0 ? Math.max(0, Math.min(1, (renderTime - older.receiveTime) / timeDelta)) : 1;

    const result: InterpolatedEntity[] = [];

    // Interpolate every entity present in the newer snapshot
    for (const [id, newerEnt] of newer.entities) {
      const olderEnt = older.entities.get(id);
      const rawEnt = latestSnapshot.entities.get(id) || newerEnt;

      if (!olderEnt) {
        // Entity just spawned between snapshots; render as-is
        result.push({
          id: newerEnt.id,
          type: newerEnt.type,
          name: newerEnt.name,
          position: { ...newerEnt.position },
          rawPosition: { ...rawEnt.position },
          headingYaw: newerEnt.headingYaw,
          currentHp: newerEnt.currentHp,
          maxHp: newerEnt.maxHp,
          isMoving: newerEnt.isMoving,
          targetId: newerEnt.targetId,
          classType: newerEnt.classType,
        });
        continue;
      }

      // Smooth Position LERP
      const interpolatedPos = lerpVector3(olderEnt.position, newerEnt.position, alpha);

      // Smooth Rotation / Yaw LERP with shortest angle wrapping
      const interpolatedYaw = this.lerpAngle(olderEnt.headingYaw, newerEnt.headingYaw, alpha);

      result.push({
        id: newerEnt.id,
        type: newerEnt.type,
        name: newerEnt.name,
        position: interpolatedPos,
        rawPosition: { ...rawEnt.position },
        headingYaw: interpolatedYaw,
        currentHp: newerEnt.currentHp,
        maxHp: newerEnt.maxHp,
        isMoving: newerEnt.isMoving,
        targetId: newerEnt.targetId,
        classType: newerEnt.classType,
      });
    }

    return result;
  }

  /**
   * Helper to interpolate angles around 360/0 degree wrap
   */
  private lerpAngle(a: number, b: number, t: number): number {
    let diff = (b - a) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return a + diff * Math.max(0, Math.min(1, t));
  }

  public getSnapshotCount(): number {
    return this.snapshots.length;
  }
}
