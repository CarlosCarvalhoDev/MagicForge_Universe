import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { HERO_SHEETS, HeroAnimationClock, getFacingDirection } from '../src/renderer/HeroAnimations.ts';

test('Demonologist sheet specs are registered with 4-way motion, 8-frame walk and distinct action sheets', () => {
  const demonSheets = HERO_SHEETS.DEMONOLOGO;
  assert.ok(demonSheets, 'HERO_SHEETS.DEMONOLOGO must be defined');

  // Walk South (Frente) - 8 frames at 10 fps
  const walk = demonSheets.walk;
  assert.equal(walk.frames, 8);
  assert.equal(walk.cols, 4);
  assert.equal(walk.rows, 2);
  assert.equal(walk.fps, 10);

  // Walk North (Costas) - 6 frames at 8 fps
  const walkNorth = demonSheets.walk_north;
  assert.ok(walkNorth, 'walk_north must be defined');
  assert.equal(walkNorth.frames, 6);
  assert.equal(walkNorth.cols, 3);
  assert.equal(walkNorth.rows, 2);

  // Walk Side (Lados) - 6 frames at 9 fps
  const walkSide = demonSheets.walk_side;
  assert.ok(walkSide, 'walk_side must be defined');
  assert.equal(walkSide.frames, 6);
  assert.equal(walkSide.cols, 3);
  assert.equal(walkSide.rows, 2);

  // Attack / Cast (Flaming circular strike) - 6 frames at 10 fps
  const cast = demonSheets.attack;
  assert.equal(cast.frames, 6);
  assert.equal(cast.cols, 3);
  assert.equal(cast.rows, 2);
  assert.equal(cast.fps, 10);

  // Idle, Hit, Death
  assert.equal(demonSheets.idle.frames, 6);
  assert.equal(demonSheets.hit.frames, 2);
  assert.equal(demonSheets.death.frames, 4);
});

test('Physical PNG files for all Demonologist animations exist on disk with 256px grid fidelity', () => {
  const dir = 'client/public/assets/isometric/animations/heroes/demonologo';
  const expectedFiles = [
    { name: 'iso_hero_demonologo_walk_sheet.png', w: 1024, h: 512 },
    { name: 'iso_hero_demonologo_walk_north_sheet.png', w: 768, h: 512 },
    { name: 'iso_hero_demonologo_walk_side_sheet.png', w: 768, h: 512 },
    { name: 'iso_hero_demonologo_idle_sheet.png', w: 768, h: 512 },
    { name: 'iso_hero_demonologo_cast_sheet.png', w: 768, h: 512 },
    { name: 'iso_hero_demonologo_hit_sheet.png', w: 512, h: 256 },
    { name: 'iso_hero_demonologo_death_sheet.png', w: 512, h: 512 },
  ];

  for (const exp of expectedFiles) {
    const fullPath = path.join(dir, exp.name);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${exp.name}`);
    const data = fs.readFileSync(fullPath);
    const png = PNG.sync.read(data);
    assert.equal(png.width, exp.w, `${exp.name} width should be ${exp.w}`);
    assert.equal(png.height, exp.h, `${exp.name} height should be ${exp.h}`);
  }
});

test('Directional resolver maps headingYaw degrees to 4 cardinal directions correctly', () => {
  assert.equal(getFacingDirection(0), 'south', '0 deg should face south (down/front)');
  assert.equal(getFacingDirection(360), 'south', '360 deg should face south');
  assert.equal(getFacingDirection(90), 'east', '90 deg should face east (right)');
  assert.equal(getFacingDirection(180), 'north', '180 deg should face north (up/costas)');
  assert.equal(getFacingDirection(-180), 'north', '-180 deg should face north (costas)');
  assert.equal(getFacingDirection(270), 'west', '270 deg should face west (left)');
  assert.equal(getFacingDirection(-90), 'west', '-90 deg should face west (left)');
});

test('Demonologist walk cycle has authentic frame-to-frame pixel variations (no frozen or repeated poses)', () => {
  const walkPath = 'client/public/assets/isometric/animations/heroes/demonologo/iso_hero_demonologo_walk_sheet.png';
  const data = fs.readFileSync(walkPath);
  const png = PNG.sync.read(data);

  // Compare each of the 8 frames (256x256) to verify leg alternation
  const frameSignatures = [];
  for (let f = 0; f < 8; f++) {
    const col = f % 4;
    const row = Math.floor(f / 4);
    const startX = col * 256;
    const startY = row * 256;

    let hash = 0;
    let nonZeroPixels = 0;
    for (let y = startY + 160; y < startY + 250; y += 2) {
      for (let x = startX + 50; x < startX + 210; x += 2) {
        const idx = (png.width * y + x) << 2;
        if (png.data[idx + 3] > 0) {
          nonZeroPixels++;
          hash += png.data[idx] + png.data[idx + 1] + png.data[idx + 2];
        }
      }
    }
    assert.ok(nonZeroPixels > 100, `Frame ${f} must have visible leg pixels`);
    frameSignatures.push({ frame: f, nonZeroPixels, hash });
  }

  // Ensure consecutive frames are distinct (stride alternation)
  for (let i = 0; i < 7; i++) {
    assert.notEqual(
      frameSignatures[i].hash,
      frameSignatures[i + 1].hash,
      `Frame ${i} and ${i + 1} must differ in leg positions`
    );
  }
});

test('Demonologist skill icons exist on disk in 512x512 resolution for all tiers', () => {
  const skillFiles = [
    'demonologo_1.png',
    'demonologo_truque_1.png',
    'demonologo_2.png',
    'demonologo_nv1_1.png',
    'demonologo_3.png',
    'demonologo_nv2_1.png',
    'demonologo_4.png',
    'demonologo_nv3_1.png',
  ];

  for (const file of skillFiles) {
    const fullPath = path.join('client/public/assets/skills', file);
    assert.ok(fs.existsSync(fullPath), `Skill icon must exist: ${file}`);
    const data = fs.readFileSync(fullPath);
    const png = PNG.sync.read(data);
    assert.equal(png.width, 512, `${file} must be 512px wide`);
    assert.equal(png.height, 512, `${file} must be 512px tall`);
  }
});

test('Demonologist has 4 dedicated skill casting sheets registered with distinct frames & rates', () => {
  const demonSheets = HERO_SHEETS.DEMONOLOGO;

  assert.ok(demonSheets.cast_bolt, 'cast_bolt sheet spec must be registered');
  assert.equal(demonSheets.cast_bolt.frames, 6);
  assert.equal(demonSheets.cast_bolt.cols, 3);
  assert.equal(demonSheets.cast_bolt.fps, 12);

  assert.ok(demonSheets.cast_drain, 'cast_drain sheet spec must be registered');
  assert.equal(demonSheets.cast_drain.frames, 8);
  assert.equal(demonSheets.cast_drain.cols, 4);
  assert.equal(demonSheets.cast_drain.fps, 9);

  assert.ok(demonSheets.cast_circle, 'cast_circle sheet spec must be registered');
  assert.equal(demonSheets.cast_circle.frames, 8);
  assert.equal(demonSheets.cast_circle.cols, 4);
  assert.equal(demonSheets.cast_circle.fps, 10);

  assert.ok(demonSheets.cast_ultimate, 'cast_ultimate sheet spec must be registered');
  assert.equal(demonSheets.cast_ultimate.frames, 8);
  assert.equal(demonSheets.cast_ultimate.cols, 4);
  assert.equal(demonSheets.cast_ultimate.fps, 11);
});

test('Physical PNG files for the 4 dedicated skill casting sheets exist on disk with 256px grid size', () => {
  const dir = 'client/public/assets/isometric/animations/heroes/demonologo';
  const skillSheets = [
    { name: 'iso_hero_demonologo_cast_bolt_sheet.png', w: 768, h: 512 },
    { name: 'iso_hero_demonologo_cast_drain_sheet.png', w: 1024, h: 512 },
    { name: 'iso_hero_demonologo_cast_circle_sheet.png', w: 1024, h: 512 },
    { name: 'iso_hero_demonologo_cast_ultimate_sheet.png', w: 1024, h: 512 },
  ];

  for (const s of skillSheets) {
    const full = path.join(dir, s.name);
    assert.ok(fs.existsSync(full), `Skill sheet must exist: ${s.name}`);
    const data = fs.readFileSync(full);
    const png = PNG.sync.read(data);
    assert.equal(png.width, s.w, `${s.name} width should be ${s.w}`);
    assert.equal(png.height, s.h, `${s.name} height should be ${s.h}`);
  }
});

test('HeroAnimationClock triggers dedicated skill animations and smoothly transitions back to base motion', () => {
  const clock = new HeroAnimationClock();
  const sheets = HERO_SHEETS.DEMONOLOGO;
  const entityId = 'demon_test_hero';

  // 1. Trigger cast_bolt (6 frames at 12 fps = 500ms)
  clock.trigger(entityId, 'cast_bolt', 1000);
  const sample1 = clock.sample(entityId, false, 100, sheets, 1050);
  assert.equal(sample1.action, 'cast_bolt');

  // After 550ms (> 500ms), should revert to idle
  const sample2 = clock.sample(entityId, false, 100, sheets, 1550);
  assert.equal(sample2.action, 'idle');

  // 2. Trigger cast_drain (8 frames at 9 fps = 888.8ms)
  clock.trigger(entityId, 'cast_drain', 2000);
  const sample3 = clock.sample(entityId, false, 100, sheets, 2300);
  assert.equal(sample3.action, 'cast_drain');

  // After 950ms, should revert to idle
  const sample4 = clock.sample(entityId, false, 100, sheets, 2950);
  assert.equal(sample4.action, 'idle');

  // 3. Trigger cast_circle (8 frames at 10 fps = 800ms)
  clock.trigger(entityId, 'cast_circle', 3000);
  const sample5 = clock.sample(entityId, false, 100, sheets, 3200);
  assert.equal(sample5.action, 'cast_circle');

  // 4. Trigger cast_ultimate (8 frames at 11 fps = 727.2ms)
  clock.trigger(entityId, 'cast_ultimate', 4000);
  const sample6 = clock.sample(entityId, false, 100, sheets, 4200);
  assert.equal(sample6.action, 'cast_ultimate');
});

test('Demonologist character portrait bust exists in 256x256 format for character selection cards', () => {
  const pngPath = 'client/public/assets/portraits/DEMONOLOGO.png';
  const jpgPath = 'client/public/assets/portraits/DEMONOLOGO.jpg';
  assert.ok(fs.existsSync(pngPath), 'DEMONOLOGO.png must exist');
  assert.ok(fs.existsSync(jpgPath), 'DEMONOLOGO.jpg must exist');

  const png = PNG.sync.read(fs.readFileSync(pngPath));
  assert.equal(png.width, 256);
  assert.equal(png.height, 256);
});
