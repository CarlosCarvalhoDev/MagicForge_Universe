import {
  createVector3, WAREHOUSE_PASSAGES, WAREHOUSE_TILE_SIZE as TILE, WAREHOUSE_TRAIL,
  type C2SMoveInputPayload, type Vector3, type WarehouseRoom, type WarehouseTile,
} from '@magicforge/shared';
import type { Player } from '../entities/Player';

type RowRanges = Readonly<Record<number, readonly (readonly [number, number])[]>>;

const walkableRows: Record<WarehouseRoom, RowRanges> = {
  exterior: {
    2: [[-11, -11], [-4, -4]],
    3: [[-11, -11], [-8, -3], [0, 0]],
    4: [[-11, -11], [-8, -3], [0, 0]],
    5: [[-11, -8], [-4, 0]],
    6: [[-4, -3], [5, WAREHOUSE_TRAIL.east]],
    7: [[-4, -3], [5, WAREHOUSE_TRAIL.east]],
    8: [[WAREHOUSE_TRAIL.west, 6]],
    9: [[WAREHOUSE_TRAIL.west, 6]],
  },
  interior: {
    '-3': [[-11, -10]],
    '-2': [[-11, -10], [-7, -3]],
    '-1': [[-11, -7], [-6, -3]],
    0: [[-7, -3]],
    1: [[-8, -7], [-2, -1]],
    2: [[-8, -7], [-2, 0], [2, 2]],
    3: [[-8, -7], [-2, 3]],
    4: [[-8, 3]], 5: [[-8, 3]], 6: [[1, 1]],
  },
  upper: {
    '-1': [[-7, -6]],
    0: [[-7, -5]],
    1: [[-7, 0]], 2: [[-7, 0]], 3: [[-7, 0]],
  },
};

const NEIGHBORS: readonly WarehouseTile[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const tileAt = (x: number, z: number): WarehouseTile => [Math.round(x / TILE), Math.round(z / TILE)];
const tileCenter = ([col, row]: WarehouseTile) => createVector3(col * TILE, 0, row * TILE);
const tileKey = ([col, row]: WarehouseTile) => col + ',' + row;

function isWalkable(room: WarehouseRoom, [col, row]: WarehouseTile): boolean {
  return walkableRows[room][row]?.some(([start, end]) => col >= start && col <= end) ?? false;
}

function findRoute(room: WarehouseRoom, start: WarehouseTile, end: WarehouseTile): WarehouseTile[] {
  if (!isWalkable(room, end)) return [];
  const queue = [start];
  const parents = new Map<string, WarehouseTile | null>([[tileKey(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const tile = queue[i];
    if (tileKey(tile) === tileKey(end)) {
      const route: WarehouseTile[] = [];
      for (let cursor: WarehouseTile | null = tile; cursor; cursor = parents.get(tileKey(cursor)) ?? null) {
        route.push(cursor);
      }
      return route.reverse();
    }
    for (const [dx, dz] of NEIGHBORS) {
      const next: WarehouseTile = [tile[0] + dx, tile[1] + dz];
      if (!isWalkable(room, next) || parents.has(tileKey(next))) continue;
      parents.set(tileKey(next), tile);
      queue.push(next);
    }
  }
  return [];
}

export class WarehouseSession {
  room: WarehouseRoom = 'exterior';
  private position = tileCenter([-4, 5]);
  private velocity = createVector3(0, 0, 0);
  private direction: Vector3 | null = null;
  private route: Vector3[] = [];
  private heading = 180;
  private lastInput = -1;

  constructor(readonly player: Player) {}

  move(input?: C2SMoveInputPayload): void {
    if (!input || !Number.isSafeInteger(input.inputSequence) || input.inputSequence <= this.lastInput) return;
    const vector = input.moveDirection ?? input.targetPosition;
    if (!vector || !Number.isFinite(vector.x) || !Number.isFinite(vector.z)) return;
    this.lastInput = input.inputSequence;
    this.direction = null;
    this.route = [];
    if (input.moveDirection) {
      const magnitude = Math.hypot(vector.x, vector.z);
      if (magnitude > .001 && Number.isFinite(magnitude)) this.direction = createVector3(vector.x / magnitude, 0, vector.z / magnitude);
      return;
    }
    const start = tileAt(this.position.x, this.position.z);
    const end = tileAt(vector.x, vector.z);
    this.route = findRoute(this.room, start, end).map(tileCenter);
    if (this.route.length && !WAREHOUSE_PASSAGES[this.room].some(p => tileKey(p.tile) === tileKey(end))) {
      this.route.push(createVector3(vector.x, 0, vector.z));
    }
  }

  update(delta: number): void {
    this.velocity = createVector3(0, 0, 0);
    while (this.route[0] && Math.hypot(this.route[0].x - this.position.x, this.route[0].z - this.position.z) < .01) {
      this.route.shift();
    }
    const destination = this.route[0];
    if (delta <= 0 || (!destination && !this.direction)) return;
    const dx = destination ? destination.x - this.position.x : this.direction!.x;
    const dz = destination ? destination.z - this.position.z : this.direction!.z;
    const distance = Math.hypot(dx, dz);
    const step = Math.min(6.5 * delta, TILE / 3, destination ? distance : Infinity);
    const nextX = this.position.x + dx / distance * step;
    const nextZ = this.position.z + dz / distance * step;
    const x = isWalkable(this.room, tileAt(nextX, this.position.z)) ? nextX : this.position.x;
    const z = isWalkable(this.room, tileAt(x, nextZ)) ? nextZ : this.position.z;
    this.velocity = createVector3((x - this.position.x) / delta, 0, (z - this.position.z) / delta);
    if (x === this.position.x && z === this.position.z) return;
    this.heading = Math.atan2(this.velocity.x, this.velocity.z) * 180 / Math.PI;
    this.position = createVector3(x, 0, z);

    const passage = WAREHOUSE_PASSAGES[this.room].find(({ tile }) => {
      const center = tileCenter(tile);
      return Math.hypot(x - center.x, z - center.z) <= TILE * .44;
    });
    if (!passage) return;
    this.room = passage.room;
    this.position = tileCenter(passage.arrival);
    this.velocity = createVector3(0, 0, 0);
    this.direction = null;
    this.route = [];
  }

  snapshot() {
    return {
      ...this.player.toSnapshotState(),
      position: this.position,
      velocity: this.velocity,
      headingYaw: this.heading,
      isMoving: this.velocity.x !== 0 || this.velocity.z !== 0,
      targetId: null,
    };
  }
}
