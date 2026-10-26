/**
 * 3D Vector interface compatible with Unity Vector3
 * In Unity: X = Left/Right, Y = Up/Down, Z = Forward/Back (Ground Plane is X/Z)
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export function createVector3(x = 0, y = 0, z = 0): Vector3 {
  return { x, y, z };
}

export function distanceSquared(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function distance(a: Vector3, b: Vector3): number {
  return Math.sqrt(distanceSquared(a, b));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, t));
}

export function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: a.x + (b.x - a.x) * clampedT,
    y: a.y + (b.y - a.y) * clampedT,
    z: a.z + (b.z - a.z) * clampedT,
  };
}

export function cloneVector3(v: Vector3): Vector3 {
  return { x: v.x, y: v.y, z: v.z };
}
