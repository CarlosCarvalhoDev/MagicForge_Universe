import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass } from '@magicforge/shared';
import { simulateProgression } from '../tools/ProgressionSimulation';

test('Farm com compras usa saldo real e mantém determinismo e relógio isolados', () => {
  const random = Math.random, now = Date.now;
  const options = { classType: CharacterClass.GUERREIRO, seed: 101, seconds: 300, investment: 'skill' as const };
  const result = simulateProgression(options);
  assert.deepEqual(simulateProgression(options), result);
  assert.ok(result.actions.length > 0);
  assert.equal(result.actions[0].goldSpent, 300);
  assert.ok(result.actions[0].seconds > 0);
  assert.ok(result.goldBalance >= 0);
  assert.equal(result.spentGold, result.actions.reduce((total, action) => total + action.goldSpent, 0));
  assert.equal(result.goldBalance, result.startingGold + result.lootGold + result.autoSaleGold - result.spentGold);
  assert.equal(result.bagComposition.reduce((slots, item) => slots + item.slots, 0), result.inventorySlotsUsed);
  assert.equal(result.skillLevels.guerreiro_truque_1, result.actions.length + 1);
  assert.equal(Math.random, random);
  assert.equal(Date.now, now);
});

test('Política padrão continua sem compras; equipamento usa apenas drops e pedras da caçada', () => {
  const options = { classType: CharacterClass.BARBARO, seed: 101, seconds: 300 };
  const baseline = simulateProgression(options);
  assert.deepEqual(baseline.actions, []);
  assert.equal(baseline.spentGold, 0);
  const equipment = simulateProgression({ ...options, investment: 'equipment' });
  assert.ok(equipment.actions.some(action => action.kind === 'refine'));
  assert.ok(equipment.actions.every(action => action.kind === 'equip' || action.kind === 'refine'));
  assert.ok(equipment.actions.filter(action => action.kind === 'refine').every(action => action.goldSpent === 500 && action.level! <= 2));
  assert.ok(equipment.goldBalance >= 0);
});

test('Fusão do farm consome uma receita real e não se repete', () => {
  const result = simulateProgression({ classType: CharacterClass.GUERREIRO, seed: 101, seconds: 600, investment: 'fusion' });
  const fusions = result.actions.filter(action => action.kind === 'fusion');
  assert.equal(fusions.length, 1);
  assert.equal(fusions[0].goldSpent, 1800);
  assert.ok(result.equippedItems.some(item => item.itemId === fusions[0].itemOrSkillId));
  assert.equal(result.spentGold, 1800);
  assert.equal(result.goldBalance, result.startingGold + result.lootGold + result.autoSaleGold - result.spentGold);
});
