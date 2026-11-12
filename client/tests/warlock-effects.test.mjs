import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WARLOCK_CAST_SHEETS, WARLOCK_DIRECTIONAL_SHEETS, WARLOCK_FX_SHEETS, WARLOCK_RELEASE_MS, WarriorCastClock } from '../src/renderer/HeroAnimations.ts';
import { planWarlockCast } from '../src/renderer/WarlockEffects.ts';
import { decodePng } from './helpers/png-rgba.mjs';

test('The directional and spell sheets contain art in every registered cell', () => {
  const sheets = [
    ...Object.values(WARLOCK_DIRECTIONAL_SHEETS),
    ...[...WARLOCK_CAST_SHEETS, ...WARLOCK_FX_SHEETS].map(file => ({ file, cols: 6, rows: 3 })),
  ];
  for (const { file, cols, rows } of sheets) {
    const png = decodePng(readFileSync(new URL(`../public${file}`, import.meta.url)));
    assert.equal(png.w % cols + png.h % rows, 0, file);
    const w = png.w / cols;
    const h = png.h / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let painted = 0;
        for (let y = row * h; y < (row + 1) * h; y += 2) {
          for (let x = col * w; x < (col + 1) * w; x += 2) {
            if (png.data[(y * png.w + x) * 4 + 3] > 128) painted++;
          }
        }
        assert.ok(painted > 10 && painted < w * h * .24, `${file}, row ${row}, col ${col}: ${painted}`);
      }
    }
  }
});

test('Warlock flight starts on the staff release frame and contacts the authoritative target on arrival', () => {
  const origin = { x: 0, y: 0, z: 0 };
  const target = { x: 8, y: 0, z: 0 };
  const clock = new WarriorCastClock();
  for (const [slot, tier] of ['truque', 'nv1', 'nv2', 'nv3'].entries()) {
    for (let choice = 1; choice <= 3; choice++) {
      const id = `bruxo_${tier}_${choice}`;
      assert.ok(clock.trigger('caster', id, 0));
      assert.equal(clock.sample('caster', WARLOCK_RELEASE_MS).frame, 4);
      assert.equal(clock.sample('caster', 480), undefined);
      const effects = planWarlockCast({
        skillId: id, casterId: 'caster', originPosition: origin, targetPosition: target, targetId: 'mob',
        affectedEntityIds: ['mob'], isHeal: false,
        targetResults: [{ targetId: 'mob', impactPosition: target, effectiveDamage: 1, effectiveHeal: 0 }],
      }, []);
      const impact = effects.find(effect => effect.targetId === 'mob');
      assert.deepEqual(impact.position, target);
      assert.equal(impact.spellIndex, slot * 3 + choice - 1);
      const flight = effects.find(effect => effect.kind === 'warlockFlight');
      assert.equal(impact.delayMs, WARLOCK_RELEASE_MS + (flight?.durationMs ?? 0));
    }
  }
});
