export type WorldAppearance = { theme: 'forest' | 'frost'; icon: string; placeholder: boolean };
export function worldAppearance(world: number): WorldAppearance {
  if (world === 2) return { theme: 'frost', icon: '❄️', placeholder: false };
  return { theme: 'forest', icon: world === 1 ? '🌲' : '🗺️', placeholder: world !== 1 };
}
type Point = { x: number; y: number; z: number };
export type VisualStage = { world: number; portalOpen?: boolean; portalPosition?: Point };

/** Presentation only. No progression, entities or saved character data are modified. */
export class WorldPresentation {
  world = 1;
  portal: Point | null = null;
  get appearance(): WorldAppearance { return worldAppearance(this.world); }
  setStage(stage: VisualStage): void {
    if (!Number.isSafeInteger(stage.world) || stage.world < 1) return;
    this.world = stage.world;
    const p = stage.portalPosition;
    this.portal = stage.portalOpen && p && [p.x, p.y, p.z].every(Number.isFinite) ? { ...p } : null;
  }
}
