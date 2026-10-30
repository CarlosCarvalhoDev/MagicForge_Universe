import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const { CharacterClass, CLASS_DEFINITIONS, createVector3, distance } = require('@magicforge/shared');
const { Monster, MonsterState } = require('../../server/dist/server/src/entities/Monster.js');
const { Player } = require('../../server/dist/server/src/entities/Player.js');
import { HERO_SHEETS, HeroAnimationClock } from '../src/renderer/HeroAnimations.ts';

test('Player baseSpeed is tuned to 7.8 units/sec for agile, responsive gameplay', () => {
  assert.equal(CLASS_DEFINITIONS[CharacterClass.DEMONOLOGO].baseSpeed, 7.8);
  assert.equal(CLASS_DEFINITIONS[CharacterClass.GUERREIRO].baseSpeed, 7.8);

  const dummyDb = { savePlayer: () => {}, getCharacterEquippedItems: () => [] };
  const player = new Player('p1', 'DemonLord', CharacterClass.DEMONOLOGO, createVector3(0, 0, 0), dummyDb, 1);
  assert.equal(player.speed, 7.8, 'Player speed should be 7.8 units/sec for responsive movement');

  // Simulate 1 second of movement towards destination
  player.setMoveDestination(createVector3(10, 0, 0), 1);
  player.update(1.0);
  assert.ok(player.position.x > 7.0, 'Player should cover ~7.8m in 1 second');
});

test('Monster AI has high aggression (18m aggro, 5.2m/s speed) and pursues player actively', () => {
  const spawnPos = createVector3(-20, 0, 18);
  const goblin = new Monster('mob_goblin_1', 'Goblin Lanceiro', spawnPos, 90, 12);
  assert.equal(goblin.aggroRadius, 18.0, 'Aggro radius should be 18m');
  assert.equal(goblin.speed, 5.2, 'Speed should be 5.2m/s');

  const dummyDb = { savePlayer: () => {}, getCharacterEquippedItems: () => [] };
  const player = new Player('p1', 'Hero', CharacterClass.DEMONOLOGO, createVector3(-10, 0, 18), dummyDb, 1);

  // Player is 10m away (well within 18m aggro radius)
  const dist = distance(player.position, goblin.position);
  assert.ok(dist <= goblin.aggroRadius, 'Player is within aggro range');

  // When targetPlayer is assigned by World, goblin enters CHASING state
  goblin.targetPlayer = player;
  goblin.state = MonsterState.CHASING;
  goblin.update(0.5);

  assert.equal(goblin.targetPlayer, player, 'Goblin must retain player target');
  assert.ok(goblin.isMoving, 'Goblin should be moving in chase');
  assert.ok(goblin.position.x > -20, 'Goblin should advance towards player position');
});

test('Wolf AI has heightened speed (6.0m/s) and wide scent radius (20m)', () => {
  const wolf = new Monster('mob_wolf_1', 'Lobo Selvagem', createVector3(22, 0, 12), 100, 14);
  assert.equal(wolf.speed, 6.0, 'Wolves have 6.0m/s sprint speed');
  assert.equal(wolf.aggroRadius, 20.0, 'Wolves detect players up to 20m away');
});

test('Monsters respawn around their designated thematic camps instead of scattered randomly', () => {
  const campPos = createVector3(-26, 0, 14);
  const archer = new Monster('mob_archer_1', 'Goblin Arqueiro', campPos, 70, 16);
  assert.deepEqual(archer.originalCampPosition, campPos, 'Monster must retain its designated camp position');

  // Trigger death
  archer.isDead = true;
  archer.currentHp = 0;

  // Trigger respawn
  archer.respawn();
  assert.equal(archer.isDead, false, 'Monster must be alive after respawn');
  assert.equal(archer.currentHp, archer.maxHp);

  const distanceFromCamp = distance(archer.position, campPos);
  assert.ok(distanceFromCamp <= 4.5, `Respawned monster should remain close to its camp (was ${distanceFromCamp.toFixed(2)}m)`);
});

test('Demonologist animation clock samples cleanly through all directional movement without flicker', () => {
  const clock = new HeroAnimationClock();
  const sheets = HERO_SHEETS.DEMONOLOGO;
  const entityId = 'demon_char_test';
  const startTime = 1000;

  // 1. Idle state (standing still, alive)
  const idleSample = clock.sample(entityId, false, 100, sheets, startTime);
  assert.equal(idleSample.action, 'idle');
  assert.ok(idleSample.frame >= 0 && idleSample.frame < sheets.idle.frames);

  // 2. Walking state
  const walkSample = clock.sample(entityId, true, 100, sheets, startTime + 200);
  assert.equal(walkSample.action, 'walk');
  assert.ok(walkSample.frame >= 0 && walkSample.frame < sheets.walk.frames);

  // 3. Trigger 360 fire slash attack
  clock.trigger(entityId, 'attack', startTime + 400);
  const attackSample = clock.sample(entityId, true, 100, sheets, startTime + 500);
  assert.equal(attackSample.action, 'attack');
  assert.ok(attackSample.frame >= 0 && attackSample.frame < sheets.attack.frames);

  // 4. Return to walk after attack duration
  const finishTime = startTime + 400 + (sheets.attack.frames / sheets.attack.fps) * 1000 + 50;
  const postAttackSample = clock.sample(entityId, true, 100, sheets, finishTime);
  assert.equal(postAttackSample.action, 'walk', 'Should return to walk smoothly without glitching');
});

test('Demonologist sprite sheets are unified to the consistent 256px red demon warrior master art', () => {
  const sheets = HERO_SHEETS.DEMONOLOGO;
  assert.equal(sheets.idle.frames, 6);
  assert.equal(sheets.walk.frames, 8);
  assert.equal(sheets.walk_north.frames, 6);
  assert.equal(sheets.walk_side.frames, 6);
  assert.equal(sheets.attack.frames, 6);
  assert.equal(sheets.hit.frames, 2);
  assert.equal(sheets.death.frames, 4);
});
