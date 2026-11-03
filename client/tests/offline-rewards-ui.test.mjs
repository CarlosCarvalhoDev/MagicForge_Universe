import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOfflineDuration } from '../src/ui/OfflineRewardModal.ts';

test('1. formatOfflineDuration formata segundos em formato legível de Idle RPG', () => {
  assert.equal(formatOfflineDuration(45), '45s');
  assert.equal(formatOfflineDuration(125), '2min 5s');
  assert.equal(formatOfflineDuration(3600), '1h 0min');
  assert.equal(formatOfflineDuration(5420), '1h 30min');
  assert.equal(formatOfflineDuration(43200), '12h 0min');
});
