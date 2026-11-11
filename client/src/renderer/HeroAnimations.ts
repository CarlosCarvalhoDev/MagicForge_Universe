export type HeroAction = 'idle' | 'walk' | 'attack' | 'hit' | 'death';
export type HeroSheetSpec = { file: string; cols: number; rows: number; frames: number; fps: number; directional?: boolean };
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
const warriorV5 = '/assets/isometric/review/guerreiro_v5';
const warriorDirectional = (action: HeroAction, fps: number): HeroSheetSpec => ({
  file: `${warriorV5}/guerreiro_${action}_sheet.png`, cols: 4, rows: 8, frames: 4, fps, directional: true,
});

export const WARRIOR_DIRECTIONAL_SHEETS = {
  idle: warriorDirectional('idle', 5),
  walk: warriorDirectional('walk', 9),
  attack: warriorDirectional('attack', 8),
  hit: warriorDirectional('hit', 12),
  death: warriorDirectional('death', 7),
};

/** Sprite rows run clockwise from south toward west. Positive yaw turns toward east. */
export function warriorDirectionRow(yaw: number): number {
  return ((Math.round(-yaw / 45) % 8) + 8) % 8;
}

export const WARRIOR_CAST_SHEETS = [1, 2, 3, 4].map(slot =>
  `${warriorV5}/guerreiro_skills_slot_${slot}_sheet.png`);

// Ground baselines in the authored 362px cells. Spell trails can extend below them.
const warriorCastGround = [[303, 301, 304], [335, 324, 316], [294, 289, 294], [328, 341, 315]];

export function warriorCastArt(skillId: string) {
  const match = /^guerreiro_(truque|nv1|nv2|nv3)_([123])$/.exec(skillId);
  if (!match) return;
  const slot = ['truque', 'nv1', 'nv2', 'nv3'].indexOf(match[1]);
  const row = Number(match[2]) - 1;
  return { file: WARRIOR_CAST_SHEETS[slot], row, ground: warriorCastGround[slot][row] / 362 };
}

export class WarriorCastClock {
  private readonly casts = new Map<string, NonNullable<ReturnType<typeof warriorCastArt>> & { startedAt: number }>();

  trigger(id: string, skillId: string, now: number): boolean {
    const art = warriorCastArt(skillId);
    if (!art) return false;
    this.casts.set(id, { ...art, startedAt: now });
    return true;
  }

  sample(id: string, now: number) {
    const cast = this.casts.get(id);
    if (!cast) return;
    const frame = Math.floor(Math.max(0, now - cast.startedAt) / 125);
    if (frame >= 4) {
      this.casts.delete(id);
      return;
    }
    const { file, row, ground } = cast;
    return { file, row, ground, frame };
  }

  clear(id: string): void { this.casts.delete(id); }
  reset(): void { this.casts.clear(); }
  retain(ids: ReadonlySet<string>): void {
    for (const id of this.casts.keys()) if (!ids.has(id)) this.casts.delete(id);
  }
}

export const HERO_SHEETS: Record<string, HeroSheetSet> = {
  GUERREIRO: WARRIOR_DIRECTIONAL_SHEETS,
  CLERIGO: sheets('clerigo', true, 8, 12), BARBARO: sheets('barbaro'),
  ARQUEIRO: sheets('arqueiro'),
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
