import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

test('Demonologist database record, stats & progression integrity', () => {
  const dbPath = path.resolve('server/data/magicforge.db');
  const db = new DatabaseSync(dbPath);

  const demonChar = db.prepare("SELECT * FROM characters WHERE class_type = 'DEMONOLOGO'").get();
  assert.ok(demonChar, 'Demonologist character must exist in database');
  assert.equal(demonChar.name, 'DemonLord');
  assert.equal(demonChar.class_type, 'DEMONOLOGO');
  assert.equal(demonChar.level, 50);
  assert.equal(demonChar.slot_index, 1);
  assert.equal(demonChar.reborn_count, 1);
  assert.ok(demonChar.gold >= 1000000, 'DemonLord should have at least 1M gold');
  assert.equal(demonChar.slot1_skill, 'demonologo_truque_1');
  assert.equal(demonChar.slot2_skill, 'demonologo_nv1_1');
  assert.equal(demonChar.slot3_skill, 'demonologo_nv2_1');
  assert.equal(demonChar.slot4_skill, 'demonologo_nv3_1');

  // Verify D&D attributes growth and combat power
  assert.ok(demonChar.carisma >= 20, `Carisma should be at least 20: ${demonChar.carisma}`);
  assert.ok(demonChar.constituicao >= 30, `Constituicao should be at least 30: ${demonChar.constituicao}`);
  assert.ok(demonChar.combat_power >= 10000, `CP should be high: ${demonChar.combat_power}`);
  db.close();
});

test('Demonologist account association and pedestals in database', () => {
  const dbPath = path.resolve('server/data/magicforge.db');
  const db = new DatabaseSync(dbPath);

  const adminAcc = db.prepare("SELECT * FROM accounts WHERE username = 'admin'").get();
  assert.ok(adminAcc, 'Admin account exists');

  const chars = db.prepare("SELECT slot_index, name, class_type FROM characters WHERE account_id = ? ORDER BY slot_index ASC").all(adminAcc.id);
  assert.equal(chars.length, 2, 'Admin must have 2 heroes configured (AdminLord and DemonLord)');
  assert.equal(chars[0].name, 'AdminLord');
  assert.equal(chars[0].class_type, 'GUERREIRO');
  assert.equal(chars[1].name, 'DemonLord');
  assert.equal(chars[1].class_type, 'DEMONOLOGO');

  db.close();
});
