import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_SHEETS, HeroAnimationClock, frameAt, keyDarkBackground } from '../src/renderer/HeroAnimations.ts';

test('cleric walk v2 has eight frames at 12 FPS with the original cycle duration', () => {
  const spec = HERO_SHEETS.CLERIGO.walk;
  assert.equal(spec.frames, 8); assert.equal(spec.cols, 4); assert.equal(spec.rows, 2);
  assert.equal(spec.fps, 12);
  assert.equal(spec.frames / spec.fps, 6 / 9);
  assert.equal(frameAt(spec, 584, true), 7);
  assert.equal(frameAt(spec, 667, true), 0);
});

test('cast lasts six frames at 9 FPS; attack lasts six at 11 FPS', () => {
  const clock = new HeroAnimationClock();
  clock.trigger('cleric', 'attack', 0); clock.trigger('warrior', 'attack', 0);
  assert.equal(clock.sample('cleric', false, 10, HERO_SHEETS.CLERIGO, 600).action, 'attack');
  assert.equal(clock.sample('cleric', false, 10, HERO_SHEETS.CLERIGO, 600).frame, 5);
  assert.equal(clock.sample('warrior', false, 10, HERO_SHEETS.GUERREIRO, 600).action, 'idle');
  assert.equal(clock.sample('cleric', false, 10, HERO_SHEETS.CLERIGO, 667).action, 'idle');
});
test('snapshot-only death starts at zero, plays once, holds and resets on revival', () => {
  const clock = new HeroAnimationClock(); const sheets = HERO_SHEETS.GUERREIRO;
  assert.equal(clock.sample('a', false, 0, sheets, 1000).frame, 0);
  assert.equal(clock.sample('a', false, 0, sheets, 1150).frame, 1);
  clock.trigger('a', 'death', 1200); clock.trigger('a', 'hit', 1200);
  assert.equal(clock.sample('a', false, 0, sheets, 2000).frame, 3);
  assert.deepEqual(clock.sample('a', true, 10, sheets, 2100), { action: 'walk', frame: 0 });
});
test('death event before dead snapshot is preserved until revival', () => {
  const clock = new HeroAnimationClock(); const sheets = HERO_SHEETS.BARBARO;
  clock.trigger('a', 'death', 100);
  assert.deepEqual(clock.sample('a', false, 10, sheets, 110), { action: 'death', frame: 0 });
  clock.sample('a', false, 0, sheets, 150);
  assert.equal(clock.sample('a', false, 10, sheets, 500).action, 'idle');
});
test('walk starts at first frame independently and resets when state changes', () => {
  const clock = new HeroAnimationClock(); const sheets = HERO_SHEETS.GUERREIRO;
  assert.equal(clock.sample('a', true, 10, sheets, 0).frame, 0);
  assert.equal(clock.sample('a', true, 10, sheets, 300).frame, 2);
  assert.equal(clock.sample('b', true, 10, sheets, 300).frame, 0);
  assert.equal(clock.sample('a', false, 10, sheets, 400).frame, 0);
  clock.retain(new Set());
  assert.equal(clock.sample('b', true, 10, sheets, 800).frame, 0);
});
test('one-shot frames clamp, loop frames wrap', () => {
  const spec = HERO_SHEETS.GUERREIRO.death;
  assert.equal(frameAt(spec, 1000, false), 3); assert.equal(frameAt(spec, 1000, true), 3);
  assert.equal(frameAt(spec, 2000, false), 3); assert.equal(frameAt(spec, 2000, true), 2);
});
test('authored alpha and dark details stay byte-for-byte unchanged', () => {
  const pixels = new Uint8ClampedArray([0, 0, 0, 0, 20, 20, 20, 30, 0, 0, 0, 255]);
  const before = pixels.slice(); keyDarkBackground(pixels); assert.deepEqual(pixels, before);
});
test('opaque black sheets get a monotonic soft key without RGB changes', () => {
  const pixels = new Uint8ClampedArray([0, 0, 0, 255, 23, 23, 23, 255, 32, 32, 32, 255]);
  keyDarkBackground(pixels);
  assert.equal(pixels[3], 0); assert.equal(pixels[7], 128); assert.equal(pixels[11], 255);
  assert.equal(pixels[4], 23);
});
