import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass } from '@magicforge/shared';
import { simulateBossInvestment } from '../tools/BossInvestmentSimulation';

test('Sustentação mede Mordida antes da cura pura e registra a build real', () => {
  const run = simulateBossInvestment({ classType: CharacterClass.BARBARO, level: 10, world: 2,
    seed: 101, investment: 'sustain', goldBudget: 2000 });
  assert.equal(run.unavailable, null);
  assert.equal(run.selectedSkills[1], 'barbaro_truque_3');
  assert.ok(run.skillLevels.barbaro_truque_3 > 1);
  assert.ok(run.combat.effectiveHealing > 0);
  assert.ok(run.spentGold <= run.budget);
  assert.deepEqual(simulateBossInvestment({ classType: CharacterClass.BARBARO, level: 10, world: 2,
    seed: 101, investment: 'sustain', goldBudget: 2000 }), run);
});

test('Indisponibilidade de cura e seleção de Pele Rochosa continuam explícitas', () => {
  const archer = simulateBossInvestment({ classType: CharacterClass.ARQUEIRO, level: 10, world: 1,
    seed: 101, investment: 'sustain' });
  assert.equal(archer.outcome, 'unavailable');
  const barbarian = simulateBossInvestment({ classType: CharacterClass.BARBARO, level: 25, world: 3,
    seed: 101, investment: 'sustain' });
  assert.equal(barbarian.selectedSkills[3], 'barbaro_nv2_2');
  assert.equal(barbarian.skillCastOrder[0], 3);
});

test('Instrumentação observa o combate sem alterar seu resultado nem gastar energia fictícia', () => {
  const options = { classType: CharacterClass.BARBARO, level: 25, world: 3, seed: 101, investment: 'none' as const };
  const baseline = simulateBossInvestment(options);
  const measured = simulateBossInvestment({ ...options, collectDiagnostics: true });
  assert.equal(measured.outcome, baseline.outcome);
  assert.equal(measured.seconds, baseline.seconds);
  assert.equal(measured.bossHpRemainingPercent, baseline.bossHpRemainingPercent);
  assert.deepEqual(measured.combat, baseline.combat);
  const stats = measured.diagnostics!;
  assert.equal(stats.casts.length, measured.combat.skillCasts);
  assert.equal(Object.values(stats.bySkill).reduce((sum, skill) => sum + skill.casts, 0), measured.combat.skillCasts);
  assert.ok(stats.casts.every(cast => cast.energyBefore >= cast.energyAfter && cast.energyAfter >= 0));
  assert.ok(stats.anyReadySkillEnergyBlockedSeconds <= stats.sampledSeconds);
  assert.ok(stats.noAffordableReadySkillSeconds <= stats.anyReadySkillEnergyBlockedSeconds);
  assert.equal(Object.values(stats.bySkill).reduce((sum, skill) => sum + skill.energySpent, 0),
    stats.casts.reduce((sum, cast) => sum + cast.energyBefore - cast.energyAfter, 0));
});

test('Override de regeneração é isolado e a ordem explícita preserva os quatro slots', () => {
  const options = { classType: CharacterClass.BARBARO, level: 25, world: 3, seed: 101, investment: 'none' as const, collectDiagnostics: true };
  const changed = simulateBossInvestment({ ...options, resourceRegenPerSec: 10, skillCastOrder: [3, 1, 2, 4] });
  assert.equal(changed.diagnostics!.resourceRegenPerSec, 10);
  assert.deepEqual(changed.skillCastOrder, [3, 1, 2, 4]);
  const normal = simulateBossInvestment(options);
  assert.equal(normal.diagnostics!.resourceRegenPerSec, 8);
  assert.deepEqual(normal.skillCastOrder, [1, 2, 3, 4]);
  assert.throws(() => simulateBossInvestment({ ...options, skillCastOrder: [1, 1, 2, 3] }), /rotation/);
  assert.throws(() => simulateBossInvestment({ ...options, resourceRegenPerSec: NaN }), /regeneration/);
});
