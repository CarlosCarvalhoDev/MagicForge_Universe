import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOfflineReward, getOfflineLimitSeconds } from '../src/game/OfflineRewards';

const now = 1_800_000_000_000;
const state = { lastLogoutTime: now - 86400_000, currentWorld: 1, currentStage: 5, level: 10 };

test('Política gratuita tem 8h; política premium futura tem 12h sem multiplicar taxas', () => {
  assert.equal(getOfflineLimitSeconds(), 28800);
  assert.equal(getOfflineLimitSeconds('premium'), 43200);
  const free = calculateOfflineReward(state, now)!;
  const premium = calculateOfflineReward(state, now, null, 'premium')!;
  assert.equal(free.cappedSeconds, 28800);
  assert.equal(premium.cappedSeconds, 43200);
  assert.equal(free.accumulatedGold, 28800 * 70);
  assert.equal(free.accumulatedExp, 28800 * 50);
  assert.equal(premium.accumulatedGold, 43200 * 70);
  assert.equal(premium.accumulatedExp, 43200 * 50);
});

test('Limiar de 5 minutos inclui a fronteira e rejeita datas futuras', () => {
  assert.equal(calculateOfflineReward({ ...state, lastLogoutTime: now - 299_000 }, now), null);
  assert.equal(calculateOfflineReward({ ...state, lastLogoutTime: now + 1000 }, now), null);
  assert.equal(calculateOfflineReward({ ...state, lastLogoutTime: now - 300_000 }, now)!.cappedSeconds, 300);
});

test('Novo intervalo soma ao baú preservado e respeita o teto total, sem duplicar materiais', () => {
  const previous = calculateOfflineReward({ ...state, lastLogoutTime: now - 3600_000 }, now)!;
  const accumulated = calculateOfflineReward(state, now, previous)!;
  assert.equal(accumulated.offlineSeconds, 90000);
  assert.equal(accumulated.cappedSeconds, 28800);
  assert.equal(accumulated.accumulatedGold, 28800 * 70);
  assert.equal(accumulated.accumulatedExp, 28800 * 50);
  assert.equal(accumulated.loot.find(item => item.itemId === 'ore_iron_arcane')!.quantity, 20);
  const again = calculateOfflineReward({ ...state, lastLogoutTime: now }, now, accumulated)!;
  assert.deepEqual(again, accumulated);
});

test('Reconectar após coleta parcial preserva só o restante e acrescenta apenas materiais novos', () => {
  const first = calculateOfflineReward({ ...state, lastLogoutTime: now - 3600_000 }, now)!;
  const remaining = { ...first, accumulatedGold: 0, accumulatedExp: 0, loot: [{ ...first.loot[1], quantity: 3 }] };
  assert.deepEqual(calculateOfflineReward({ ...state, lastLogoutTime: now }, now, remaining)!.loot, remaining.loot);
  const next = calculateOfflineReward({ ...state, lastLogoutTime: now - 3600_000 }, now, remaining)!;
  assert.equal(next.accumulatedGold, first.accumulatedGold);
  assert.equal(next.loot.find(i => i.itemId === 'ore_iron_arcane')!.quantity, 8);
  assert.equal(next.loot.find(i => i.itemId === 'potion_hp_minor')!.quantity, 9);
});
