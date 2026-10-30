import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PracticeArena } from '../src/pixel/PracticeArena.ts';
import { PIXEL_SHEETS, PIXEL_PROPS, directionRow, facingFromYaw, pixelFamily } from '../src/renderer/PixelAssets.ts';

test('cardinal heading selects actual directional rows without mirroring', () => {
  assert.deepEqual([0, 90, 180, 270, -90, 360].map(facingFromYaw), ['south', 'east', 'north', 'west', 'west', 'south']);
  assert.equal(directionRow('hero', 'north'), 3); assert.equal(directionRow('orc', 'north'), 1);
  assert.equal(directionRow('hero', 'east'), 2); assert.equal(directionRow('slime', 'east'), 3);
  assert.equal(pixelFamily('PLAYER', 'MAGO'), null);
});
test('every shipped sheet has the declared native cell grid and every prop exists', () => {
  const file = path => fileURLToPath(new URL(`../public${path}`, import.meta.url));
  for (const set of Object.values(PIXEL_SHEETS)) for (const spec of Object.values(set)) {
    const bytes = readFileSync(file(spec.file));
    assert.equal(bytes.toString('ascii', 1, 4), 'PNG');
    assert.equal(bytes.readUInt32BE(16), spec.cols * 64, spec.file);
    assert.equal(bytes.readUInt32BE(20), 256, spec.file);
    assert.equal(spec.frames, spec.cols); assert.equal(spec.fps, 1000 / 150);
  }
  for (const path of Object.values(PIXEL_PROPS)) assert.ok(readFileSync(file(path)).length > 0);
});
test('diagonal movement is normalized, world bounds and large frame gaps are limited', () => {
  const a = new PracticeArena(), b = new PracticeArena();
  a.step(.05, 0, {x:1,z:0,attack:false,auto:false}); b.step(.05, 0, {x:1,z:1,attack:false,auto:false});
  assert.ok(Math.abs(Math.hypot(b.hero.position.x,b.hero.position.z)-a.hero.position.x)<1e-9);
  a.hero.position.x=54; a.step(99, 1, {x:1,z:0,attack:false,auto:false}); assert.equal(a.hero.position.x,54);
  b.step(99, 1, {x:0,z:1,attack:false,auto:false}); assert.ok(b.hero.position.z<1);
});
test('attack needs range and respects cooldown; dead target is counted once', () => {
  const arena=new PracticeArena();
  const input={x:0,z:0,attack:true,auto:false};
  assert.equal(arena.step(0,0,input).length,0);
  const mob=arena.entities[1]; mob.position={x:1,y:0,z:0};
  assert.ok(arena.step(0,10,input).some(e=>e.id===mob.id&&e.damage===30));
  arena.step(0,100,input); assert.equal(mob.currentHp,30);
  arena.step(0,1210,input); assert.equal(mob.currentHp,0); assert.equal(arena.defeated,1);
  arena.step(0,2500,input); assert.equal(arena.defeated,1);
});
test('dead hero cannot move or attack; reset restores local practice without persistence', () => {
  const arena=new PracticeArena(); arena.hero.currentHp=0;
  assert.deepEqual(arena.step(.05, 100, {x:1,z:1,attack:true,auto:true}),[]);
  assert.equal(arena.hero.position.x,0); arena.reset(); assert.equal(arena.hero.currentHp,160); assert.equal(arena.defeated,0);
});
test('practice waits for the first input and returns to waiting after reset', () => {
  const arena = new PracticeArena(), original = {...arena.entities[1].position};
  arena.step(.05, 10000, {x:0,z:0,attack:false,auto:false});
  assert.deepEqual(arena.entities[1].position, original); assert.equal(arena.started,false);
  arena.step(.05, 10001, {x:1,z:0,attack:false,auto:false}); assert.equal(arena.started,true);
  arena.reset(); assert.equal(arena.started,false);
});
