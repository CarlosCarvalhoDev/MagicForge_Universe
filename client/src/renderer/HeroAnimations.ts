export type HeroAction =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'hit'
  | 'death'
  | 'cast_bolt'
  | 'cast_drain'
  | 'cast_circle'
  | 'cast_ultimate';

export type HeroDirection = 'south' | 'north' | 'east' | 'west';
export type HeroSheetSpec = { file: string; cols: number; rows: number; frames: number; fps: number };
export type HeroSheetSet = Record<string, HeroSheetSpec>;

export function getFacingDirection(headingYaw: number): HeroDirection {
  const deg = ((headingYaw % 360) + 360) % 360;
  if (deg >= 45 && deg < 135) return 'east';
  if (deg >= 135 && deg < 225) return 'north';
  if (deg >= 225 && deg < 315) return 'west';
  return 'south';
}

function sheets(className: string, cast = false, walkFrames = 6, walkFps = 9): HeroSheetSet {
  const file = (action: string) => `/assets/isometric/animations/heroes/${className}/iso_hero_${className}_${action}_sheet.png`;
  return {
    idle: { file: file('idle'), cols: 2, rows: 2, frames: 4, fps: 5 },
    walk: { file: file('walk'), cols: walkFrames / 2, rows: 2, frames: walkFrames, fps: walkFps },
    attack: { file: file(cast ? 'cast' : 'attack'), cols: 3, rows: 2, frames: 6, fps: cast ? 9 : 11 },
    hit: { file: file('hit'), cols: 2, rows: 1, frames: 2, fps: 10 },
    death: { file: file('death'), cols: 2, rows: 2, frames: 4, fps: 7 },
  };
}

function demonologoSheets(): HeroSheetSet {
  const dir = '/assets/isometric/animations/heroes/demonologo/iso_hero_demonologo_';
  return {
    idle: { file: `${dir}idle_sheet.png`, cols: 3, rows: 2, frames: 6, fps: 6 },
    walk: { file: `${dir}walk_sheet.png`, cols: 4, rows: 2, frames: 8, fps: 10 },
    walk_north: { file: `${dir}walk_north_sheet.png`, cols: 3, rows: 2, frames: 6, fps: 8 },
    walk_side: { file: `${dir}walk_side_sheet.png`, cols: 3, rows: 2, frames: 6, fps: 9 },
    attack: { file: `${dir}cast_sheet.png`, cols: 3, rows: 2, frames: 6, fps: 10 },
    cast_bolt: { file: `${dir}cast_bolt_sheet.png`, cols: 3, rows: 2, frames: 6, fps: 12 },
    cast_drain: { file: `${dir}cast_drain_sheet.png`, cols: 4, rows: 2, frames: 8, fps: 9 },
    cast_circle: { file: `${dir}cast_circle_sheet.png`, cols: 4, rows: 2, frames: 8, fps: 10 },
    cast_ultimate: { file: `${dir}cast_ultimate_sheet.png`, cols: 4, rows: 2, frames: 8, fps: 11 },
    hit: { file: `${dir}hit_sheet.png`, cols: 2, rows: 1, frames: 2, fps: 10 },
    death: { file: `${dir}death_sheet.png`, cols: 2, rows: 2, frames: 4, fps: 7 },
  };
}

/** Same source of timing and slicing for gameplay and the offline review page. */
export const HERO_SHEETS: Record<string, HeroSheetSet> = {
  GUERREIRO: sheets('guerreiro'),
  CLERIGO: sheets('clerigo', true, 8, 12),
  BARBARO: sheets('barbaro'),
  ARQUEIRO: sheets('arqueiro'),
  DEMONOLOGO: demonologoSheets(),
};

export function frameAt(spec: HeroSheetSpec, elapsedMs: number, loop: boolean): number {
  const index = Math.floor(Math.max(0, elapsedMs) * spec.fps / 1000);
  return loop ? index % spec.frames : Math.min(spec.frames - 1, index);
}

type Playback = { action: HeroAction; startedAt: number; sawDeadSnapshot: boolean };

/** Per-entity clocks start at frame zero; death holds until authoritative revival. */
export class HeroAnimationClock {
  private states = new Map<string, Playback>();

  trigger(id: string, action: HeroAction, now: number): void {
    const previous = this.states.get(id);
    if (previous?.action === 'death') return;
    this.states.set(id, { action, startedAt: now, sawDeadSnapshot: false });
  }

  sample(id: string, moving: boolean, hp: number, sheets: HeroSheetSet, now: number) {
    let state = this.states.get(id);
    if (hp <= 0) {
      if (state?.action !== 'death') state = { action: 'death', startedAt: now, sawDeadSnapshot: true };
      state.sawDeadSnapshot = true;
    } else if (state?.action === 'death' && state.sawDeadSnapshot) {
      state = undefined;
    }
    const baseAction = moving ? 'walk' : 'idle';
    if (state && state.action !== 'idle' && state.action !== 'walk' && state.action !== 'death') {
      const spec = sheets[state.action] || sheets['attack'];
      if (spec) {
        const duration = (spec.frames / spec.fps) * 1000;
        if (now - state.startedAt >= duration) state = undefined;
      } else {
        state = undefined;
      }
    }
    if (!state || ((state.action === 'idle' || state.action === 'walk') && state.action !== baseAction)) {
      state = { action: baseAction, startedAt: now, sawDeadSnapshot: false };
    }
    this.states.set(id, state);
    const spec = sheets[state.action] || sheets[baseAction];
    const loop = state.action === 'idle' || state.action === 'walk';
    return { action: state.action, frame: frameAt(spec, now - state.startedAt, loop) };
  }

  retain(ids: Set<string>): void {
    for (const id of this.states.keys()) if (!ids.has(id)) this.states.delete(id);
  }
}

/** Existing alpha must never be increased by the compatibility chroma key. */
export function keyDarkBackground(pixels: Uint8ClampedArray): void {
  // A sheet with transparent pixels already has authored alpha; preserve its dark details.
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i] < 255) return;
  for (let i = 0; i < pixels.length; i += 4) {
    const value = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (value <= 14) pixels[i + 3] = 0;
    else if (value < 32) pixels[i + 3] = Math.round((value - 14) / 18 * 255);
  }
}
