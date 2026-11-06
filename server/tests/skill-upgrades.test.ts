import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CharacterClass, Opcode, SKILLS_DATABASE, createVector3, getSkillUpgradeCost, getSkillUpgradeMultiplier,
} from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { WorldManager } from '../src/game/WorldManager';
import { Monster } from '../src/entities/Monster';
import { PacketHandler } from '../src/network/PacketHandler';
import type { Connection } from '../src/network/Connection';

function setup(t: TestContext) {
  const db = new DatabaseManager(':memory:');
  t.after(() => db.close());
  const world = new World(db);
  world.automationEnabled = false;
  const account = db.getOrCreateAccount('skill_upgrades');
  const player = db.createCharacterInSlot('hero', account.id, 0, 'UpgradeHero', CharacterClass.GUERREIRO);
  const packets: Array<{ op: Opcode; data: any }> = [];
  const connection = { id: player.id, accountId: account.id, isAuthenticated: true,
    send(op: Opcode, data: any) { packets.push({ op, data }); } } as unknown as Connection;
  world.enterWorld(connection, player);
  player.level = 50;
  player.recalculateStatsFromEquipment();
  player.attributes.destreza = 0;
  player.maxResource = player.currentResource = 10000;
  player.gold = db.updateCharacterGold(player.dbCharacterId, 10_000_000);
  db.addItemToInventory(player.dbCharacterId, 'arcane_dust', 500);
  player.inventory = db.getInventory(player.dbCharacterId);
  const upgrade = (skillId = 'guerreiro_truque_1', expectedLevel = 1) => {
    new PacketHandler(world).handlePacket(connection, JSON.stringify({ op: Opcode.C2S_UPGRADE_SKILL,
      data: { skillId, expectedLevel, goldCost: 0, dustCost: 0, nextLevel: 20 } }));
    return packets.filter(p => p.op === Opcode.S2C_SKILL_UPGRADE_RESULT).at(-1)?.data;
  };
  const wallet = () => ({ gold: db.getCharacterGold(player.dbCharacterId), inventory: db.getInventory(player.dbCharacterId),
    levels: db.getSkillLevels(player.dbCharacterId) });
  return { db, world, player, connection, packets, upgrade, wallet };
}

test('Compra usa preço do servidor, persiste por habilidade e rejeita pedido repetido', t => {
  const f = setup(t);
  const old = f.wallet();
  const loadout = { ...f.player.equippedSkills };
  f.player.skillCastOrder = [4, 2, 1, 3];
  assert.equal(f.upgrade().success, true);
  assert.equal(f.player.gold, old.gold - 300);
  assert.equal(f.player.skillLevels.guerreiro_truque_1, 2);
  assert.equal(f.db.hasItemQuantity(f.player.dbCharacterId, 'arcane_dust', 500), false);
  assert.equal(f.db.hasItemQuantity(f.player.dbCharacterId, 'arcane_dust', 499), true);
  const bought = f.wallet();
  assert.equal(f.upgrade().success, false);
  assert.deepEqual(f.wallet(), bought);
  assert.deepEqual(f.player.equippedSkills, loadout);
  assert.deepEqual(f.player.skillCastOrder, [4, 2, 1, 3]);
  assert.equal(f.world.equipPlayerSkill(f.player, 1, 'guerreiro_truque_2'), true);
  assert.equal(f.world.equipPlayerSkill(f.player, 1, 'guerreiro_truque_1'), true);
  f.db.savePlayer(f.player);
  const loaded = f.db.loadPlayerFromRecord('reconnect', f.db.getCharacterByName(f.player.name)!);
  assert.deepEqual(loaded.skillLevels, { guerreiro_truque_1: 2 });
  const second = f.db.createCharacterInSlot('other', f.connection.accountId!, 1, 'OtherHero', CharacterClass.GUERREIRO);
  assert.deepEqual(second.skillLevels, {});
});

test('Classe, escolha não selecionada, bloqueio, aliases e payload inválido não consomem recursos', t => {
  const f = setup(t);
  const old = f.wallet();
  for (const [id, level] of [['mago_truque_1', 1], ['guerreiro_truque_2', 1], ['guerreiro_1', 1],
    ['inexistente', 1], ['guerreiro_truque_1', 0], ['guerreiro_truque_1', 1.5], ['guerreiro_truque_1', '1']] as const) {
    assert.equal(f.upgrade(id, level as number).success, false);
  }
  f.player.level = 1;
  assert.equal(f.upgrade('guerreiro_nv1_1').success, false);
  f.world.handleUpgradeSkill(f.connection, undefined);
  assert.deepEqual(f.wallet(), old);
  f.connection.isAuthenticated = false;
  assert.deepEqual(f.player.skillLevels, {});
  f.upgrade();
  assert.deepEqual(f.wallet(), old);
});

test('Ouro ou material insuficiente não cobra parcialmente', t => {
  const f = setup(t);
  f.player.gold = f.db.updateCharacterGold(f.player.dbCharacterId, -10_000_000);
  const poor = f.wallet();
  assert.equal(f.upgrade().success, false);
  assert.deepEqual(f.wallet(), poor);
  f.player.gold = f.db.updateCharacterGold(f.player.dbCharacterId, 1000);
  f.db.consumeItemQuantity(f.player.dbCharacterId, 'arcane_dust', 500);
  f.player.inventory = f.db.getInventory(f.player.dbCharacterId);
  const noDust = f.wallet();
  assert.equal(f.upgrade().success, false);
  assert.deepEqual(f.wallet(), noDust);
});

test('Falha após consumo reverte ouro, materiais, nível e estado em memória', t => {
  const f = setup(t);
  const old = f.wallet();
  const memory = { gold: f.player.gold, inventory: structuredClone(f.player.inventory) };
  const getInventory = f.db.getInventory.bind(f.db);
  f.db.getInventory = () => { throw new Error('falha de leitura simulada'); };
  assert.equal(f.upgrade().success, false);
  f.db.getInventory = getInventory;
  assert.deepEqual(f.wallet(), old);
  assert.deepEqual(f.player.skillLevels, {});
  assert.equal(f.player.gold, memory.gold);
  assert.deepEqual(f.player.inventory, memory.inventory);
});

test('Teto 20 é atingível, preços crescem e pedidos no teto não cobram', t => {
  const f = setup(t);
  let previous = 0;
  for (let level = 1; level < 20; level++) {
    const cost = getSkillUpgradeCost(SKILLS_DATABASE.guerreiro_truque_1, level)!;
    assert.ok(cost.gold > previous);
    previous = cost.gold;
    assert.equal(f.upgrade('guerreiro_truque_1', level).success, true);
  }
  assert.equal(f.player.skillLevels.guerreiro_truque_1, 20);
  assert.equal(getSkillUpgradeMultiplier(20), 1.95);
  assert.equal(getSkillUpgradeCost(SKILLS_DATABASE.guerreiro_truque_1, 20), null);
  const capped = f.wallet();
  assert.equal(f.upgrade('guerreiro_truque_1', 20).success, false);
  assert.deepEqual(f.wallet(), capped);
});

test('Melhoria aumenta dano, cura, escudo e sangramento reais sem mudar custo nem cooldown', t => {
  const f = setup(t);
  for (const m of f.world.entityManager.getAllMonsters()) f.world.entityManager.removeMonster(m.id);
  const target = new Monster('target', 'Alvo', createVector3(1, 0, 0), 1_000_000, 0);
  f.world.entityManager.addMonster(target);
  const cast = (slot: number) => {
    f.player.skillCooldowns.clear();
    f.player.currentResource = 10000;
    assert.equal(f.world.castPlayerSkill(f.player, slot, target.id), true);
    return f.packets.filter(p => p.op === Opcode.S2C_SKILL_CAST_EVENT).at(-1)!.data;
  };
  const damage = cast(1).damageOrHeal;
  f.upgrade();
  assert.ok(cast(1).damageOrHeal > damage);
  assert.equal(f.player.currentResource, 9995);
  assert.equal(f.player.getSkillCooldown(1), 2.5);
  f.player.currentHp = 1;
  const heal = cast(2).damageOrHeal;
  assert.equal(f.upgrade('guerreiro_nv1_1').success, true);
  f.player.currentHp = 1;
  assert.ok(cast(2).damageOrHeal > heal);
  f.world.equipPlayerSkill(f.player, 3, 'guerreiro_nv2_2');
  const shield = cast(3).targetResults[0].shieldGranted;
  assert.equal(f.upgrade('guerreiro_nv2_2').success, true);
  assert.ok(cast(3).targetResults[0].shieldGranted > shield);
  f.world.equipPlayerSkill(f.player, 1, 'guerreiro_truque_2');
  const bleed = cast(1).appliedStatuses.find((s: any) => s.type === 'BLEED').magnitude;
  assert.equal(f.upgrade('guerreiro_truque_2').success, true);
  assert.ok(cast(1).appliedStatuses.find((s: any) => s.type === 'BLEED').magnitude > bleed);
});

test('Suporte com percentuais fixos não pode vender evolução de potência', t => {
  const f = setup(t);
  const account = f.db.getOrCreateAccount('mage_account');
  const mage = f.db.createCharacterInSlot('mage', account.id, 0, 'Mage', CharacterClass.MAGO);
  mage.level = 50;
  mage.setEquippedSkill(3,'mago_nv2_3');
  assert.throws(() => f.db.upgradeCharacterSkill(mage, 'mago_nv2_3', 1), /INVALID_SKILL/);
});

test('Banco fechado e reaberto mantém nível, consumo e escolha sem repetir migração', t => {
  const filename = join(tmpdir(), `magicforge-skill-${randomUUID()}.db`);
  t.after(() => {
    for (const suffix of ['', '-wal', '-shm']) rmSync(filename + suffix, { force: true });
  });
  let db = new DatabaseManager(filename);
  try {
    const account = db.getOrCreateAccount('disk_upgrade');
    const player = db.createCharacterInSlot('before', account.id, 0, 'DiskHero', CharacterClass.GUERREIRO);
    db.updateCharacterGold(player.dbCharacterId, 1000);
    db.addItemToInventory(player.dbCharacterId, 'arcane_dust', 3);
    db.upgradeCharacterSkill(player, 'guerreiro_truque_1', 1);
    db.close();
    db = new DatabaseManager(filename);
    const loaded = db.loadPlayerFromRecord('after', db.getCharacterByName('DiskHero')!);
    assert.equal(loaded.skillLevels.guerreiro_truque_1, 2);
    assert.equal(loaded.gold, 750);
    assert.equal(loaded.getEquippedSkill(1), 'guerreiro_truque_1');
    assert.equal(loaded.inventory.find(item => item.itemId === 'arcane_dust')!.quantity, 2);
  } finally { db.close(); }
});

test('Reconexão em mundo ainda sem canal preserva melhoria e cria a instância necessária', t => {
  const f = setup(t);
  f.upgrade();
  f.player.currentWorld = f.player.unlockedWorld = 3;
  f.db.savePlayer(f.player);
  const loaded = f.db.loadPlayerFromRecord(f.connection.id, f.db.getCharacterByName(f.player.name)!);
  const manager = new WorldManager(f.db);
  manager.registerConnection(f.connection);
  assert.equal(manager.getAllChannels().some(world => world.currentWorld === 3), false);
  const world = manager.assignPlayerToChannel(f.connection, loaded);
  assert.equal(world.currentWorld, 3);
  assert.equal(loaded.currentWorld, 3);
  assert.equal(loaded.skillLevels.guerreiro_truque_1, 2);
  assert.equal(world.entityManager.getPlayer(loaded.id), loaded);
});
