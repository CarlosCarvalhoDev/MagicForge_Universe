import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWarriorWorldFx } from '../src/renderer/WarriorWorldFxDraw.ts';
import { planWarriorWorldFx } from '../src/renderer/WarriorWorldFx.ts';

const position = (x, z) => ({ x, y: 0, z });
const origin = position(0, 0);
const center = position(7, 0);
const hit = (id, impactPosition, effectiveDamage = 12) => ({ targetId: id, impactPosition, effectiveDamage, effectiveHeal: 0 });
const cast = (suffix, data = {}) => planWarriorWorldFx({
  skillId: `guerreiro_${suffix}`, casterId: 'hero', originPosition: origin, targetPosition: center,
  affectedEntityIds: ['hero', 'mob'], isHeal: false, targetResults: [hit('mob', center)], ...data,
}, []);

test('all twelve skills have a world effect independent of caster sprite availability', () => {
  for (const group of ['truque', 'nv1', 'nv2', 'nv3']) {
    for (const choice of [1, 2, 3]) assert.ok(cast(`${group}_${choice}`).length, `${group}_${choice}`);
  }
});

test('Judgment drops at the resolved center, then marks only confirmed damage positions', () => {
  const mob = position(8, 1);
  const effects = cast('nv3_2', { radius: 5, targetResults: [hit('mob', mob), hit('miss', center, 0)] });
  assert.deepEqual(effects.map(fx => fx.kind), ['warriorSigil', 'warriorBlade', 'warriorWave', 'warriorAftermath', 'warriorContact']);
  assert.deepEqual(effects[0].position, center);
  assert.deepEqual(effects[1].position, center);
  assert.deepEqual(effects[4].position, mob);
  assert.ok(effects[4].delayMs > effects[2].delayMs);
});

test('Immortal Resistance emits three waves and delays each impact by distance', () => {
  const effects = cast('nv3_3', { isHeal: true, targetResults: [hit('near', position(1, 0)), hit('far', position(4, 0))] });
  const waves = effects.filter(fx => fx.kind === 'warriorWave');
  const contacts = effects.filter(fx => fx.kind === 'warriorContact');
  assert.deepEqual(waves.map(fx => fx.radius), [4, 4, 4]);
  assert.ok(waves[0].delayMs < waves[1].delayMs && waves[1].delayMs < waves[2].delayMs);
  assert.ok(contacts[0].delayMs < contacts[1].delayMs);
  assert.equal(cast('nv3_3', { targetResults: [] }).filter(fx => fx.kind === 'warriorWave').length, 3);
});

test('world rendering uses dedicated sprites and never stamps crest, shield or barrier artwork', () => {
  const sprites = [];
  let particles = 0;
  const images = {
    world: { naturalWidth: 1086, naturalHeight: 1448 },
    ultimate: { naturalWidth: 1448, naturalHeight: 1086 },
    impact: { naturalWidth: 288, naturalHeight: 72 },
  };
  const ctx = {
    globalAlpha: 1, save() {}, restore() {}, translate() {}, rotate() {},
    beginPath() {}, ellipse() {}, stroke() {}, moveTo() {}, lineTo() {},
    fillRect() { particles++; },
    drawImage(image, sx, sy) {
      const atlas = Object.keys(images).find(key => images[key] === image);
      const cellSize = atlas === 'impact' ? 72 : 362;
      const columns = atlas === 'world' ? 3 : 4;
      sprites.push([atlas, sx / cellSize + columns * sy / cellSize]);
    },
  };
  for (const group of ['truque', 'nv1', 'nv2', 'nv3']) {
    for (const choice of [1, 2, 3]) {
      for (const fx of cast(`${group}_${choice}`)) {
        ctx.globalAlpha = 1;
        drawWarriorWorldFx(ctx, images, fx, 200, 200, 24, .35, 'ground');
        drawWarriorWorldFx(ctx, images, fx, 200, 200, 24, .35, 'air');
      }
    }
  }
  assert.ok(particles > 0);
  assert.ok(sprites.some(([atlas]) => atlas === 'impact'));
  assert.ok(sprites.some(([atlas, cell]) => atlas === 'ultimate' && cell === 5));
  assert.ok(sprites.some(([atlas, cell]) => atlas === 'ultimate' && cell === 9));
  assert.ok(sprites.every(([atlas, cell]) => ({
    world: [0, 1, 2, 3, 4, 6, 8], ultimate: [5, 6, 9, 10, 11], impact: [0, 1, 2, 3],
  })[atlas].includes(cell)));
});
