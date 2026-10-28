import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXPANSION_PREVIEW } from '../src/ui/InventoryExpansion';
import { INTRO_SCENES } from '../src/ui/NarrativeContent';
import { FloatingDialogue, monsterDialogueType } from '../src/ui/FloatingDialogue';

test('display quote matches the current authoritative table without invoking shared database', () => {
  const world = readFileSync(resolve('../server/src/game/World.ts'), 'utf8');
  const table = world.slice(world.indexOf('public static readonly INVENTORY_EXPANSIONS'), world.indexOf('public expandPlayerInventory'));
  const entries = [...table.matchAll(/(\d+):\s*\{\s*cost:\s*([\d_]+),\s*minLevel:\s*(\d+)(?:,\s*minReborn:\s*(\d+))?\s*\}/g)];
  const actual = Object.fromEntries(entries.map(([, slots, cost, minLevel, minReborn]) => [slots, { cost: Number(cost.replaceAll('_', '')), minLevel: Number(minLevel), ...(minReborn ? { minReborn: Number(minReborn) } : {}) }]));
  assert.deepEqual(EXPANSION_PREVIEW, actual);
});
test('all cinematic images exist and the six-scene sequence lasts within 40–60 seconds', () => {
  assert.equal(INTRO_SCENES.length, 6);
  for (const scene of INTRO_SCENES) assert.ok(existsSync(resolve('public', '.' + scene.image)), scene.image);
  const duration = INTRO_SCENES.reduce((sum, scene) => sum + scene.duration, 0) + 5 * 500;
  assert.ok(duration >= 40000 && duration <= 60000);
});
test('dialogue chance has a 10% boundary and repeated frames do not reroll', () => {
  let calls = 0;
  const dialogue = new FloatingDialogue(() => { calls++; return .1; });
  const slime = { id: 's', type: 'MONSTER', name: 'Slime', currentHp: 100 };
  dialogue.observe([slime], 0); assert.equal(dialogue.current(250), null); assert.equal(calls, 1);
  dialogue.observe([slime], 12001); assert.equal(calls, 1);
  dialogue.observe([{ ...slime, currentHp: 90 }], 12002); assert.equal(calls, 2);
});
test('global cooldown, expiration, death and reset limit floating dialogue', () => {
  const dialogue = new FloatingDialogue(() => 0);
  const slime = { id: 's', type: 'MONSTER', name: 'Slime', currentHp: 100 };
  const wolf = { ...slime, id: 'w', name: 'Lobo Selvagem' };
  dialogue.observe([slime], 0); assert.equal(dialogue.current(250)?.opacity, 1);
  dialogue.observe([slime, wolf], 1000); assert.equal(dialogue.current(1100)?.entityId, 's');
  assert.equal(dialogue.current(3000), null);
  dialogue.observe([slime, { ...wolf, currentHp: 99 }], 12000); assert.equal(dialogue.current(12250)?.entityId, 'w');
  dialogue.observe([slime], 12300); assert.equal(dialogue.current(12300), null);
  dialogue.reset(); dialogue.observe([slime], 12400); assert.equal(dialogue.current(12650)?.entityId, 's');
  assert.equal(monsterDialogueType('Goblin Arqueiro'), 'archer');
  assert.equal(monsterDialogueType('Grimgor'), 'goblinBoss');
  assert.equal(monsterDialogueType('Outro inimigo'), undefined);
});
