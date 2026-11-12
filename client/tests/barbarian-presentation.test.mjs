import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HERO_SHEETS, HeroAnimationClock } from '../src/renderer/HeroAnimations.ts';
import { PIXEL_SHEETS, pixelFamily, directionRow } from '../src/renderer/PixelAssets.ts';
import { planWarriorCastFx } from '../src/renderer/PixelVfx.ts';
import { decodePng } from './helpers/png-rgba.mjs';

function getPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    size: buf.length
  };
}

test('Barbarian sheets are registered with standard timing and specifications', () => {
  const specs = HERO_SHEETS.BARBARO;
  assert.ok(specs, 'HERO_SHEETS.BARBARO must exist');
  assert.equal(specs.walk.frames, 6);
  assert.equal(specs.walk.cols, 3);
  assert.equal(specs.walk.rows, 2);
  assert.equal(specs.walk.fps, 9);

  assert.equal(specs.attack.frames, 6);
  assert.equal(specs.attack.cols, 3);
  assert.equal(specs.attack.rows, 2);
  assert.equal(specs.attack.fps, 11);

  assert.equal(specs.idle.frames, 4);
  assert.equal(specs.idle.cols, 2);
  assert.equal(specs.idle.rows, 2);

  assert.equal(specs.hit.frames, 2);
  assert.equal(specs.hit.cols, 2);
  assert.equal(specs.hit.rows, 1);

  assert.equal(specs.death.frames, 4);
  assert.equal(specs.death.cols, 2);
  assert.equal(specs.death.rows, 2);
});

test('Physical PNG files for all Barbarian sheets exist on disk with 512px cell fidelity', () => {
  const bDir = path.join('client', 'public', 'assets', 'isometric', 'animations', 'heroes', 'barbaro');
  
  const walk = getPngSize(path.join(bDir, 'iso_hero_barbaro_walk_sheet.png'));
  assert.equal(walk.width, 1536);
  assert.equal(walk.height, 1024);

  const attack = getPngSize(path.join(bDir, 'iso_hero_barbaro_attack_sheet.png'));
  assert.equal(attack.width, 1536);
  assert.equal(attack.height, 1024);

  const idle = getPngSize(path.join(bDir, 'iso_hero_barbaro_idle_sheet.png'));
  assert.equal(idle.width, 1024);
  assert.equal(idle.height, 1024);

  const hit = getPngSize(path.join(bDir, 'iso_hero_barbaro_hit_sheet.png'));
  assert.equal(hit.width, 1024);
  assert.equal(hit.height, 512);

  const death = getPngSize(path.join(bDir, 'iso_hero_barbaro_death_sheet.png'));
  assert.equal(death.width, 1024);
  assert.equal(death.height, 1024);
});

test('Individual 512x512 frames exist in frames_individuais for review and tooling', () => {
  const framesDir = path.join('client', 'public', 'assets', 'isometric', 'animations', 'heroes', 'barbaro', 'frames_individuais');
  assert.ok(fs.existsSync(framesDir), 'frames_individuais directory must exist');

  const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
  assert.equal(files.length, 22, 'Must contain all 22 distinct animation action frames');

  const sample = getPngSize(path.join(framesDir, 'iso_hero_barbaro_walk_00.png'));
  assert.equal(sample.width, 512);
  assert.equal(sample.height, 512);
});

test('Barbarian walk cycle has authentic frame-to-frame pixel variations and alternating gait', () => {
  const framesDir = path.join('client', 'public', 'assets', 'isometric', 'animations', 'heroes', 'barbaro', 'frames_individuais');
  const frame0 = fs.readFileSync(path.join(framesDir, 'iso_hero_barbaro_walk_00.png'));
  const frame1 = fs.readFileSync(path.join(framesDir, 'iso_hero_barbaro_walk_01.png'));
  const frame2 = fs.readFileSync(path.join(framesDir, 'iso_hero_barbaro_walk_02.png'));
  const frame3 = fs.readFileSync(path.join(framesDir, 'iso_hero_barbaro_walk_03.png'));

  assert.notDeepEqual(frame0, frame1, 'Frame 0 and 1 must have distinct pixels');
  assert.notDeepEqual(frame1, frame2, 'Frame 1 and 2 must have distinct pixels');
  assert.notDeepEqual(frame2, frame3, 'Frame 2 and 3 must have distinct pixels');
});

test('Barbarian character portrait and static isometric sprites exist on disk', () => {
  const portrait = path.join('client', 'public', 'assets', 'portraits', 'BARBARO.png');
  assert.ok(fs.existsSync(portrait), 'Character selection portrait BARBARO.png must exist');

  const iso = path.join('client', 'public', 'assets', 'isometric', 'iso_hero_barbaro.png');
  assert.ok(fs.existsSync(iso), 'Static isometric sprite iso_hero_barbaro.png must exist');

  const unitySprite = path.join('MagicForgeClient', 'Assets', 'Textures', 'Sprites', 'iso_hero_barbaro.png');
  assert.ok(fs.existsSync(unitySprite), 'Unity client sprite iso_hero_barbaro.png must exist');
});

test('Full LPC 4-directional directional frame library is preserved and accessible', () => {
  const lpcDir = path.join('client', 'public', 'assets', 'isometric', 'animations', 'heroes', 'barbaro', 'lpc');
  assert.ok(fs.existsSync(lpcDir), 'LPC directory must exist');
  assert.ok(fs.existsSync(path.join(lpcDir, 'standard', 'walk', 'down', '1.png')));
  assert.ok(fs.existsSync(path.join(lpcDir, 'standard', 'walk', 'right', '1.png')));
  assert.ok(fs.existsSync(path.join(lpcDir, 'custom', 'slash_oversize', 'down', '1.png')));
  assert.ok(fs.existsSync(path.join(lpcDir, 'character.json')));
});

test('HeroAnimationClock samples Barbaro actions correctly in gameplay simulation', () => {
  const clock = new HeroAnimationClock();
  const sheets = HERO_SHEETS.BARBARO;

  // Idle when standing still
  const idleSample = clock.sample('barbarian_player', false, 100, sheets, 0);
  assert.equal(idleSample.action, 'idle');

  // Walk when moving
  const walkSample = clock.sample('barbarian_player', true, 100, sheets, 250);
  assert.equal(walkSample.action, 'walk');

  // Trigger attack
  clock.trigger('barbarian_player', 'attack', 500);
  const attackSample = clock.sample('barbarian_player', false, 100, sheets, 600);
  assert.equal(attackSample.action, 'attack');

  // Trigger hit
  clock.trigger('barbarian_player', 'hit', 1200);
  const hitSample = clock.sample('barbarian_player', false, 80, sheets, 1250);
  assert.equal(hitSample.action, 'hit');

  // Death when hp reaches 0
  const deathSample = clock.sample('barbarian_player', false, 0, sheets, 2000);
  assert.equal(deathSample.action, 'death');
});

test('PixelWorld craftpix sheets exist with exact 4-row 64px specifications', () => {
  const craftpixDir = path.join('client', 'public', 'assets', 'pixel', 'craftpix', 'barbarian');
  assert.ok(fs.existsSync(craftpixDir), 'craftpix barbarian folder must exist');

  const idle = getPngSize(path.join(craftpixDir, 'Barbarian_Idle_without_shadow.png'));
  assert.equal(idle.width, 256, 'Idle width must be 4 cols * 64 = 256');
  assert.equal(idle.height, 256, 'Idle height must be 4 rows * 64 = 256');

  const walk = getPngSize(path.join(craftpixDir, 'Barbarian_Walk_without_shadow.png'));
  assert.equal(walk.width, 512, 'Walk width must be 8 cols * 64 = 512');
  assert.equal(walk.height, 256, 'Walk height must be 4 rows * 64 = 256');

  const attack = getPngSize(path.join(craftpixDir, 'Barbarian_attack_without_shadow.png'));
  assert.equal(attack.width, 384, 'Attack width must be 6 cols * 64 = 384');
  assert.equal(attack.height, 256, 'Attack height must be 4 rows * 64 = 256');

  const hurt = getPngSize(path.join(craftpixDir, 'Barbarian_Hurt_without_shadow.png'));
  assert.equal(hurt.width, 256, 'Hurt width must be 4 cols * 64 = 256');
  assert.equal(hurt.height, 256, 'Hurt height must be 4 rows * 64 = 256');

  const death = getPngSize(path.join(craftpixDir, 'Barbarian_Death_without_shadow.png'));
  assert.equal(death.width, 384, 'Death width must be 6 cols * 64 = 384');
  assert.equal(death.height, 256, 'Death height must be 4 rows * 64 = 256');
});

test('Barbarian craftpix sprites are proportional to monsters and heroes (height ~30px, feet at maxY=44)', () => {
  const craftpixDir = path.join('client', 'public', 'assets', 'pixel', 'craftpix', 'barbarian');
  const img = decodePng(fs.readFileSync(path.join(craftpixDir, 'Barbarian_Idle_without_shadow.png')));
  let minX = 64, maxX = 0, minY = 64, maxY = 0;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      if (img.data[(y * img.w + x) * 4 + 3] > 30) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  const charHeight = maxY - minY + 1;
  assert.ok(maxY >= 44 && maxY <= 45, `Barbarian feet must be at maxY 44-45 (got ${maxY})`);
  assert.ok(charHeight >= 28 && charHeight <= 32, `Barbarian height must be proportional ~30px (got ${charHeight}) matching Swordsman (26px) and Orc (28px)`);
});

test('PixelAssets recognizes BARBARO class and assigns barbarian family with correct row order', () => {
  const family = pixelFamily('PLAYER', 'BARBARO');
  assert.equal(family, 'barbarian', 'pixelFamily must map BARBARO to barbarian family');

  assert.ok(PIXEL_SHEETS.barbarian, 'PIXEL_SHEETS.barbarian must be registered');
  assert.equal(PIXEL_SHEETS.barbarian.walk.cols, 8);
  assert.equal(PIXEL_SHEETS.barbarian.idle.cols, 4);
  assert.equal(PIXEL_SHEETS.barbarian.attack.cols, 6);

  // Direction row order for barbarian must be: south=0, west=1, east=2, north=3
  assert.equal(directionRow('barbarian', 'south'), 0);
  assert.equal(directionRow('barbarian', 'west'), 1);
  assert.equal(directionRow('barbarian', 'east'), 2);
  assert.equal(directionRow('barbarian', 'north'), 3);
});

test('All 12 Barbarian skill icon assets exist on disk for HUD action bar and Grimório', () => {
  const skillIds = [
    'barbaro_truque_1', 'barbaro_truque_2', 'barbaro_truque_3',
    'barbaro_nv1_1', 'barbaro_nv1_2', 'barbaro_nv1_3',
    'barbaro_nv2_1', 'barbaro_nv2_2', 'barbaro_nv2_3',
    'barbaro_nv3_1', 'barbaro_nv3_2', 'barbaro_nv3_3',
  ];
  const skillsDir = path.join('client', 'public', 'assets', 'skills', 'illustrated');
  for (const id of skillIds) {
    const file = path.join(skillsDir, `${id}.png`);
    assert.ok(fs.existsSync(file), `Skill icon ${id}.png must exist in the canonical illustrated directory`);
    const stat = fs.statSync(file);
    assert.ok(stat.size > 1000, `Skill icon ${id}.png must have valid non-empty image content`);
  }
});

test('planWarriorCastFx produces valid visual effects for Barbarian abilities', () => {
  const caster = { id: 'barb_1', position: { x: 10, y: 0, z: 10 }, headingYaw: 90, currentHp: 100 };
  const target = { id: 'orc_1', position: { x: 12, y: 0, z: 10 }, headingYaw: 270, currentHp: 50 };
  const entities = [caster, target];

  // 1. Cutilada Selvagem (slash)
  const slashFx = planWarriorCastFx({
    skillId: 'barbaro_truque_1',
    casterId: caster.id,
    affectedEntityIds: [target.id],
    targetPosition: target.position,
    isHeal: false,
  }, entities);
  assert.equal(slashFx.length, 1);
  assert.equal(slashFx[0].kind, 'slash');

  // 2. Banho de Sangue (whirlwind)
  const whirlFx = planWarriorCastFx({
    skillId: 'barbaro_nv2_1',
    casterId: caster.id,
    affectedEntityIds: [target.id],
    targetPosition: target.position,
    isHeal: false,
  }, entities);
  assert.equal(whirlFx.length, 1);
  assert.equal(whirlFx[0].kind, 'whirlwind');

  // 3. Fúria Primitiva (avatar roar aura)
  const rageFx = planWarriorCastFx({
    skillId: 'barbaro_nv1_1',
    casterId: caster.id,
    affectedEntityIds: [caster.id],
    originPosition: caster.position,
    geometry: 'CIRCLE_SELF',
    isHeal: false,
  }, entities);
  assert.equal(rageFx.length, 1);
  assert.equal(rageFx[0].kind, 'avatar');

  // 4. Salto dos Titãs / Guilhotina (judgment)
  const slamFx = planWarriorCastFx({
    skillId: 'barbaro_nv2_3',
    casterId: caster.id,
    affectedEntityIds: [target.id],
    targetPosition: target.position,
    isHeal: false,
  }, entities);
  assert.equal(slamFx.length, 1);
  assert.equal(slamFx[0].kind, 'judgment');
});
