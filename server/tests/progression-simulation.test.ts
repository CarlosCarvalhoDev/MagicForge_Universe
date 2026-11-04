import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass } from '@magicforge/shared';
import { simulateProgression } from '../tools/ProgressionSimulation';

test('Bancada repete o resultado com a mesma semente e restaura relógio e RNG', () => {
  const originalRandom = Math.random;
  const originalNow = Date.now;
  const options = { classType: CharacterClass.GUERREIRO, seconds: 60, seed: 101 };
  const first = simulateProgression(options);
  const second = simulateProgression(options);
  assert.deepEqual(first, second);
  assert.equal(Math.random, originalRandom);
  assert.equal(Date.now, originalNow);
  assert.equal(first.elapsedSeconds, 60);
  assert.ok(first.kills > 0, 'Os inputs de autoplay precisam gerar combate real');
  assert.ok(first.combatExp > 0);
});

test('Comparação permite isolar arma inicial sem alterar arquivo de banco', () => {
  const options = { classType: CharacterClass.ARQUEIRO, seconds: 60, seed: 202 };
  const equipped = simulateProgression(options);
  const bare = simulateProgression({ ...options, equipStarter: false });
  assert.equal(equipped.starterEquipped, true);
  assert.equal(bare.starterEquipped, false);
  assert.ok(equipped.combatPower > bare.combatPower);
  assert.equal(equipped.finalWorld, 1);
  assert.equal(bare.finalWorld, 1);
});

test('Duração inválida é rejeitada sem alterar os globais do processo', () => {
  const originalRandom = Math.random;
  assert.throws(() => simulateProgression({ classType: CharacterClass.GUERREIRO, seconds: -1, seed: 1 }));
  assert.equal(Math.random, originalRandom);
});
