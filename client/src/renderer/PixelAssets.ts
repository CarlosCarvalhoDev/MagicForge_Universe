import type { HeroAction, HeroSheetSet } from './HeroAnimations.ts';

export type PixelFamily = 'hero' | 'slime' | 'orc';
export type Facing = 'south' | 'west' | 'east' | 'north';
const base = '/assets/pixel/craftpix';
// Native 64px cells, one direction per row. Counts measured from vendor PNGs.
function family(folder: PixelFamily, prefix: string, names: string[], counts: number[]): HeroSheetSet {
  return Object.fromEntries((['idle', 'walk', 'attack', 'hit', 'death'] as HeroAction[]).map((action, index) => [action, {
    file: `${base}/${folder}/${prefix}_${names[index]}_without_shadow.png`,
    cols: counts[index], rows: 4, frames: counts[index], fps: 1000 / 150,
  }])) as HeroSheetSet;
}
export const PIXEL_SHEETS: Record<PixelFamily, HeroSheetSet> = {
  hero: family('hero', 'Swordsman_lvl3', ['Idle', 'Walk', 'attack', 'Hurt', 'Death'], [12, 6, 8, 5, 7]),
  slime: family('slime', 'Slime1', ['Idle', 'Walk', 'Attack', 'Hurt', 'Death'], [6, 8, 10, 5, 10]),
  orc: family('orc', 'orc1', ['idle', 'walk', 'attack', 'hurt', 'death'], [4, 6, 8, 6, 8]),
};
export const PIXEL_PROPS = {
  grass: `${base}/tiles/Ground_grass.png`, road: `${base}/tiles/Road1_ground.png`,
  tree: `${base}/trees/Tree1.png`, mossTree: `${base}/trees/Moss_tree1.png`,
  rock: `${base}/rocks/Rock1_1.png`, smallRock: `${base}/rocks/Rock1_3.png`,
  crystal: `${base}/crystals/Blue_crystal1.png`,
  snowTree: `${base}/winter/Snow_tree1.png`, snowTreeSmall: `${base}/winter/Snow_tree2.png`,
  snowRock: `${base}/winter/Rokc3_snow_shadow1.png`, snowRockSmall: `${base}/winter/Rokc3_snow_shadow3.png`,
};
export function facingFromYaw(yaw: number): Facing {
  const quadrant = Math.floor((((yaw % 360) + 360) % 360 + 45) / 90) % 4;
  return (['south', 'east', 'north', 'west'] as Facing[])[quadrant];
}
export function directionRow(familyName: PixelFamily, facing: Facing): number {
  const rows: Facing[] = familyName === 'hero' ? ['south', 'west', 'east', 'north'] : ['south', 'north', 'west', 'east'];
  return rows.indexOf(facing);
}
export function pixelFamily(type: string, classType?: string, name = ''): PixelFamily | null {
  if (type !== 'MONSTER') return classType === 'GUERREIRO' || !classType ? 'hero' : null;
  // First visual pass: slime and Orc stand-ins. Server identity/stats stay unchanged.
  return /slime/i.test(name) ? 'slime' : 'orc';
}
