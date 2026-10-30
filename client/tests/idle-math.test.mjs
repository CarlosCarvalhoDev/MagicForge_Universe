import test from 'node:test';
import assert from 'node:assert/strict';
import { IdleMath } from '../src/idle/IdleMath.ts';

test('IdleMath.d handles null, undefined, numbers and invalid strings safely', () => {
  assert.equal(IdleMath.d(null).toString(), '0');
  assert.equal(IdleMath.d(undefined).toString(), '0');
  assert.equal(IdleMath.d('invalid').toString(), '0');
  assert.equal(IdleMath.d(100).toString(), '100');
  assert.equal(IdleMath.d('1e50').toString(), '1e50');
});

test('IdleMath.format handles small numbers and zeros without unnecessary suffixes', () => {
  assert.equal(IdleMath.format(0), '0');
  assert.equal(IdleMath.format(15), '15');
  assert.equal(IdleMath.format(999), '999');
  assert.equal(IdleMath.format(4.75, 2), '4.75');
});

test('IdleMath.format formats idle suffixes K, M, B, T and beyond with standard precision', () => {
  assert.equal(IdleMath.format(1000), '1.00 K');
  assert.equal(IdleMath.format(1500), '1.50 K');
  assert.equal(IdleMath.format(2500000), '2.50 M');
  assert.equal(IdleMath.format(1e9), '1.00 B');
  assert.equal(IdleMath.format(3.45e12), '3.45 T');
  assert.equal(IdleMath.format(7.89e15), '7.89 Qa');
  assert.equal(IdleMath.format(1.23e18), '1.23 Qi');
});

test('IdleMath.format switches to scientific notation for numbers exceeding suffix range', () => {
  const extremeNum = '1e350';
  const formatted = IdleMath.format(extremeNum);
  assert.match(formatted, /^1(\.0+)?e\+?350$/i);
});

test('IdleMath.formatCombatDamage returns compact single-decimal strings', () => {
  assert.equal(IdleMath.formatCombatDamage(450), '450');
  assert.equal(IdleMath.formatCombatDamage(1250), '1.3 K');
  assert.equal(IdleMath.formatCombatDamage(5400000), '5.4 M');
});

test('IdleMath.calculateIdleCp scales exponentially with Reborn and stats', () => {
  const baseCp = IdleMath.calculateIdleCp(60, 50, 0);
  const reborn1Cp = IdleMath.calculateIdleCp(60, 50, 1);
  const reborn2Cp = IdleMath.calculateIdleCp(60, 50, 2);

  assert.ok(baseCp.gt(0));
  assert.ok(reborn1Cp.gt(baseCp));
  assert.ok(reborn2Cp.gt(reborn1Cp));
  // Reborn 1 has 1.5x multiplier
  assert.equal(reborn1Cp.div(baseCp).toFixed(1), '1.5');
});

test('IdleMath.calculateCost scales exponentially with tiers', () => {
  const cost0 = IdleMath.calculateCost(1000, 0, 1.5);
  const cost1 = IdleMath.calculateCost(1000, 1, 1.5);
  const cost2 = IdleMath.calculateCost(1000, 2, 1.5);

  assert.equal(cost0.toNumber(), 1000);
  assert.equal(cost1.toNumber(), 1500);
  assert.equal(cost2.toNumber(), 2250);
});

