import type { HeroSheetSet } from '../renderer/HeroAnimations';

/** Review-only assets. Never used by gameplay before visual approval. */
export const ARCHER_CANDIDATE: HeroSheetSet = {
  idle: { file: '/assets/isometric/review/arqueiro_basico_v1/iso_hero_arqueiro_idle_sheet.png', cols: 2, rows: 2, frames: 4, fps: 5 },
  walk: { file: '/assets/isometric/review/arqueiro_basico_v1/iso_hero_arqueiro_walk_sheet.png', cols: 3, rows: 2, frames: 6, fps: 9 },
  attack: { file: '/assets/isometric/review/arqueiro_basico_v1/iso_hero_arqueiro_attack_sheet.png', cols: 3, rows: 2, frames: 6, fps: 11 },
  hit: { file: '/assets/isometric/review/arqueiro_basico_v1/iso_hero_arqueiro_hit_sheet.png', cols: 2, rows: 1, frames: 2, fps: 10 },
  death: { file: '/assets/isometric/review/arqueiro_basico_v1/iso_hero_arqueiro_death_sheet.png', cols: 2, rows: 2, frames: 4, fps: 7 },
};
