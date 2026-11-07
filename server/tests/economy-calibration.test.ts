import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, estimateUpgradeSeconds } from '@magicforge/shared';
import { simulateProgression } from '../tools/ProgressionSimulation';
import { simulateBossInvestment } from '../tools/BossInvestmentSimulation';

test('Previsão usa gargalo dos dois recursos e inclui auto-vendas sem incluir vendas manuais', () => {
  const sample = { elapsedSeconds: 120, goldPerHour: 3600, arcaneDustPerHour: 60, autoSaleGold: 120 };
  assert.deepEqual(estimateUpgradeSeconds({ gold: 300, dust: 2 }, { gold: 0, dust: 0 }, sample), { state: 'estimated', seconds: 150 });
  assert.deepEqual(estimateUpgradeSeconds({ gold: 300, dust: 2 }, { gold: 300, dust: 0 }, sample), { state: 'estimated', seconds: 120 });
  assert.deepEqual(estimateUpgradeSeconds({ gold: 300, dust: 2 }, { gold: 300, dust: 2 }, null), { state: 'ready', seconds: 0 });
  assert.equal(estimateUpgradeSeconds({ gold: 300, dust: 2 }, { gold: 0, dust: 0 }, { ...sample, elapsedSeconds: 59 }).state, 'sampling');
  assert.equal(estimateUpgradeSeconds({ gold: 300, dust: 2 }, { gold: 300, dust: 0 }, { ...sample, arcaneDustPerHour: 0 }).state, 'no-dust-rate');
  assert.equal(estimateUpgradeSeconds({ gold: 300, dust: 2 }, { gold: 0, dust: 2 }, { ...sample, goldPerHour: 0, autoSaleGold: 0 }).state, 'no-gold-rate');
});

test('Medição por fase concilia ouro, pó e duração com o relatório total', () => {
  const result = simulateProgression({ classType: CharacterClass.GUERREIRO, seed: 101, seconds: 60, autoSellEquipment: true });
  const sum = (field: 'gold' | 'dust' | 'seconds') => result.phases.reduce((total, phase) => total + phase[field], 0);
  assert.equal(sum('gold'), result.lootGold);
  assert.equal(sum('dust'), result.arcaneDustLoot);
  assert.ok(Math.abs(sum('seconds') - 60) < 0.01);
  assert.equal(result.milestoneCosts[0].gold, 300);
  assert.ok(result.firstSkillAffordableSeconds === null || result.firstSkillAffordableSeconds <= 60);
});

test('Chefe controlado repete semente e compara compras reais dentro do mesmo orçamento', () => {
  const originalRandom = Math.random, originalNow = Date.now;
  const options = { classType: CharacterClass.GUERREIRO, seed: 101, level: 10, world: 2 };
  const baseline = simulateBossInvestment({ ...options, investment: 'none' });
  assert.deepEqual(simulateBossInvestment({ ...options, investment: 'none' }), baseline);
  const skill = simulateBossInvestment({ ...options, investment: 'skill' });
  const weapon = simulateBossInvestment({ ...options, investment: 'weapon' });
  assert.equal(baseline.spentGold, 0);
  assert.equal(skill.skillLevels.guerreiro_truque_1, 3);
  assert.equal(skill.spentGold, 740);
  assert.equal(weapon.weaponRefine, 2);
  assert.equal(weapon.spentGold, 1000);
  assert.ok(weapon.afterStats.forca > weapon.beforeStats.forca);
  assert.equal(Math.random, originalRandom);
  assert.equal(Date.now, originalNow);
});

test('Comparador declara sustentação indisponível sem inventar cura para a classe', () => {
  const result = simulateBossInvestment({ classType: CharacterClass.ARQUEIRO, seed: 101, level: 8, world: 2, investment: 'sustain' });
  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.spentGold, 0);
  assert.equal(result.bossHpRemainingPercent, null);
});
