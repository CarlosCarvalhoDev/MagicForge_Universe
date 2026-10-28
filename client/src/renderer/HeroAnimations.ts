export type HeroAction = 'idle' | 'walk' | 'attack' | 'hit' | 'death';
export type HeroSheetSpec = { file: string; cols: number; rows: number; frames: number; fps: number };
export type HeroSheetSet = Record<HeroAction, HeroSheetSpec>;

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

/** Same source of timing and slicing for gameplay and the offline review page. */
export const HERO_SHEETS: Record<string, HeroSheetSet> = {
  GUERREIRO: sheets('guerreiro'), CLERIGO: sheets('clerigo', true, 8, 12), BARBARO: sheets('barbaro'),
};

export function frameAt(spec: HeroSheetSpec, elapsedMs: number, loop: boolean): number {
  const index = Math.floor(Math.max(0, elapsedMs) * spec.fps / 1000);
  return loop ? index % spec.frames : Math.min(spec.frames - 1, index);
}

type Playback = { action: HeroAction; startedAt: number; sawDeadSnapshot: boolean };

/** Per-entity clocks start at frame zero; death holds until authoritative revival. */
export class HeroAnimationClock {
  private states = new Map<string, Playback>();

  trigger(id: string, action: 'attack' | 'hit' | 'death', now: number): void {
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
    if (state && (state.action === 'attack' || state.action === 'hit')) {
      const duration = sheets[state.action].frames / sheets[state.action].fps * 1000;
      if (now - state.startedAt >= duration) state = undefined;
    }
    if (!state || ((state.action === 'idle' || state.action === 'walk') && state.action !== baseAction)) {
      state = { action: baseAction, startedAt: now, sawDeadSnapshot: false };
    }
    this.states.set(id, state);
    const spec = sheets[state.action];
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
