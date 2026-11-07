import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { World } from '../src/game/World';
import { Connection } from '../src/network/Connection';
import { DatabaseManager } from '../src/database/DatabaseManager';
import {
  CharacterClass,
  Opcode,
  S2COfflineRewardInfoPayload,
  S2COfflineRewardsClaimedPayload,
} from '@magicforge/shared';

class MockSocket {
  public sentMessages: string[] = [];
  public readyState: number = 1;

  public send(msg: string): void {
    this.sentMessages.push(msg);
  }

  public getPackets(op?: number): any[] {
    return this.sentMessages
      .map((m) => JSON.parse(m))
      .filter((p) => (op !== undefined ? p.op === op : true))
      .map((p) => p.data);
  }

  public getLastPacket(op: number): any | null {
    const pkts = this.getPackets(op);
    return pkts.length > 0 ? pkts[pkts.length - 1] : null;
  }
}

let testCounter = 0;

function setupTestWorld(): { world: World; conn: Connection; mockSocket: MockSocket; db: DatabaseManager } {
  testCounter++;
  const db = new DatabaseManager(':memory:');
  const world = new World(db, 1, 1);
  const mockSocket = new MockSocket();
  const conn = new Connection(`conn_afk_${testCounter}`, mockSocket as any);
  world.registerConnection(conn);

  const username = `hero_afk_${testCounter}_${Math.floor(Math.random() * 9999)}`;
  world.handleAuthRegister(conn, { username, password: 'password123', email: `${username}@forja.com` });
  assert.ok(conn.isAuthenticated);

  world.handleCreateCharacterSlot(conn, 0, `AfkHero_${testCounter}`, CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn, 0);
  world.entityManager.getPlayer(conn.playerId!)!.offlineRewardsEvaluated = false;

  return { world, conn, mockSocket, db };
}

test('1. Jogador ausente por menos de 5 minutos (300s) não gera recompensa AFK', () => {
  const { world, conn, mockSocket } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  assert.ok(player);

  // Simula logout há 2 minutos (120 segundos)
  player.lastLogoutTime = Date.now() - 120 * 1000;
  mockSocket.sentMessages = [];

  world.checkAndNotifyOfflineRewards(conn, player);

  assert.equal(player.pendingOfflineReward, null, 'Não deve ter recompensa pendente');
  const rewardPkt = mockSocket.getLastPacket(Opcode.S2C_OFFLINE_REWARD_INFO);
  assert.equal(rewardPkt, null, 'Nenhum pacote S2C_OFFLINE_REWARD_INFO deve ser enviado');
});

test('2. Ausência de 1 hora acumula Ouro, EXP e Suprimentos conforme Mundo, Fase e Nível', () => {
  const { world, conn, mockSocket } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  player.currentWorld = 1;
  player.currentStage = 5;
  player.level = 10;

  // Ausente há 3600 segundos (1 hora)
  const oneHourAgo = Date.now() - 3600 * 1000;
  player.lastLogoutTime = oneHourAgo;
  mockSocket.sentMessages = [];

  world.checkAndNotifyOfflineRewards(conn, player);

  assert.ok(player.pendingOfflineReward);
  assert.equal(player.pendingOfflineReward.offlineSeconds, 3600);
  assert.equal(player.pendingOfflineReward.cappedSeconds, 3600);

  // Fórmulas:
  // goldPerSec = 1 * 15 + 5 * 5 + 10 * 3 = 15 + 25 + 30 = 70
  // expPerSec = 1 * 10 + 5 * 4 + 10 * 2 = 10 + 20 + 20 = 50
  const expectedGold = 3600 * 70;
  const expectedExp = 3600 * 50;

  assert.equal(player.pendingOfflineReward.accumulatedGold, expectedGold);
  assert.equal(player.pendingOfflineReward.accumulatedExp, expectedExp);

  // Itens: a cada 900s (15 min) -> 4 intervalos de 15 min em 1 hora
  assert.ok(player.pendingOfflineReward.loot.length >= 2);
  const ironOre = player.pendingOfflineReward.loot.find((l) => l.itemId === 'ore_iron_arcane');
  assert.ok(ironOre);
  assert.equal(ironOre.quantity, 4 * 2); // 8 minérios de ferro

  const pkt = mockSocket.getLastPacket(Opcode.S2C_OFFLINE_REWARD_INFO) as S2COfflineRewardInfoPayload;
  assert.ok(pkt);
  assert.equal(pkt.accumulatedGold, expectedGold);
  assert.equal(pkt.accumulatedExp, expectedExp);
  assert.equal(pkt.cappedSeconds, 3600);
});

test('3. Limite gratuito de 8 horas limita o ganho mesmo após 24 horas offline', () => {
  const { world, conn, mockSocket } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  player.currentWorld = 1;
  player.currentStage = 1;
  player.level = 1;

  // Ausente há 24 horas (86.400 segundos)
  player.lastLogoutTime = Date.now() - 86400 * 1000;
  mockSocket.sentMessages = [];

  world.checkAndNotifyOfflineRewards(conn, player);

  assert.ok(player.pendingOfflineReward);
  assert.equal(player.pendingOfflineReward.offlineSeconds, 86400);
  assert.equal(player.pendingOfflineReward.cappedSeconds, 28800, 'Deve aplicar teto gratuito de 8 horas');

  // goldPerSec = 1*15 + 1*5 + 1*3 = 23
  const expectedGold = 28800 * 23;
  assert.equal(player.pendingOfflineReward.accumulatedGold, expectedGold);

  const pkt = mockSocket.getLastPacket(Opcode.S2C_OFFLINE_REWARD_INFO) as S2COfflineRewardInfoPayload;
  assert.ok(pkt);
  assert.equal(pkt.cappedSeconds, 28800);
  assert.equal(pkt.maxOfflineSeconds, 28800);
  assert.equal(pkt.accumulatedGold, expectedGold);
});

test('4. Resgate autoritativo (C2S_CLAIM_OFFLINE_REWARDS) credita Ouro, EXP, itens no SQLite e limpa pendência', () => {
  const { world, conn, mockSocket, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  player.gold = 500;
  db.savePlayer(player);

  // Gera recompensa AFK pendente (30 minutos = 1800s)
  player.lastLogoutTime = Date.now() - 1800 * 1000;
  world.checkAndNotifyOfflineRewards(conn, player);
  assert.ok(player.pendingOfflineReward);

  const pendingGold = player.pendingOfflineReward.accumulatedGold;
  const pendingExp = player.pendingOfflineReward.accumulatedExp;

  mockSocket.sentMessages = [];

  // Executa resgate
  const claimRes = world.claimOfflineRewards(player);
  assert.equal(claimRes.success, true);

  // Valida que o ouro e exp foram adicionados
  assert.equal(player.gold, 500 + pendingGold);
  assert.ok(player.level > 1, 'Herói deve subir de nível com o ganho massivo de EXP');
  assert.equal(player.level, 8);
  assert.equal(player.pendingOfflineReward, null, 'Recompensa deve ser limpa');

  // Valida notificação ao cliente
  const claimedPkt = mockSocket.getLastPacket(Opcode.S2C_OFFLINE_REWARDS_CLAIMED) as S2COfflineRewardsClaimedPayload;
  assert.ok(claimedPkt);
  assert.equal(claimedPkt.success, true);
  assert.equal(claimedPkt.claimedGold, pendingGold);
  assert.equal(claimedPkt.claimedExp, pendingExp);
  assert.equal(claimedPkt.newLevel, 8);

  // Valida persistência no SQLite
  const savedPlayer = db.getCharacterByName(player.name)!;
  assert.equal(savedPlayer.gold, 500 + pendingGold);

  // Proteção contra double-claim
  const doubleClaimRes = world.claimOfflineRewards(player);
  assert.equal(doubleClaimRes.success, false, 'Segundo resgate deve falhar');
});

test('5. Multiplicadores enviados pelo cliente não aumentam a recompensa', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1_800_000_000_000 });
  const { world, conn, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.lastLogoutTime = Date.now() - 1800_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  const expectedGold = player.pendingOfflineReward!.accumulatedGold;
  const initialGold = player.gold;
  assert.equal(world.claimOfflineRewards(player, 3).success, true);
  assert.equal(db.getCharacterByName(player.name)!.gold, initialGold + expectedGold);
});

test('6. Mochila cheia entrega ouro/EXP e itens que cabem; restante persiste sem duplicar resgate', () => {
  const { world, conn, db, mockSocket } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.lastLogoutTime = Date.now() - 1800_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  const reward = structuredClone(player.pendingOfflineReward!);
  const potion = player.inventory.find(item => item.itemId === 'potion_hp_minor')!;
  db.removeItemFromInventory(player.dbCharacterId, potion.slotIndex, potion.quantity);
  player.inventory = db.getInventory(player.dbCharacterId);
  player.maxInventorySlots = player.inventory.length + 1;
  const initialGold = player.gold;
  assert.equal(world.claimOfflineRewards(player).success, true);
  assert.equal(player.gold, initialGold + reward.accumulatedGold);
  assert.equal(player.pendingOfflineReward!.accumulatedGold, 0);
  assert.equal(player.pendingOfflineReward!.accumulatedExp, 0);
  assert.equal(player.pendingOfflineReward!.loot.length, 1);
  assert.equal(player.pendingOfflineReward!.loot[0].itemId, 'potion_hp_minor');
  assert.ok(mockSocket.getLastPacket(Opcode.S2C_OFFLINE_REWARDS_CLAIMED).remainingReward);
  const persisted = db.getCharacterByName(player.name)!;
  const loaded = db.loadPlayerFromRecord('reloaded', persisted);
  assert.deepEqual(loaded.pendingOfflineReward, player.pendingOfflineReward);
  assert.equal(world.claimOfflineRewards(player).success, false);
  assert.equal(player.gold, initialGold + reward.accumulatedGold);
  player.maxInventorySlots = 25;
  assert.equal(world.claimOfflineRewards(player).success, true);
  assert.equal(player.pendingOfflineReward, null);
  assert.equal(player.gold, initialGold + reward.accumulatedGold);
  assert.equal(db.getInventory(player.dbCharacterId).find(i => i.itemId === 'ore_iron_arcane')!.quantity, reward.loot.find(i => i.itemId === 'ore_iron_arcane')!.quantity);
});

test('7. Baú persiste no SQLite; reconexão acumula somente a nova ausência e resgata uma vez', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1_800_000_000_000 });
  const { world, conn, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.lastLogoutTime = Date.now() - 3600_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  const first = structuredClone(player.pendingOfflineReward!);
  // Spend 2h online; repeated checks/channel transfers must not add offline time.
  t.mock.timers.tick(7200_000);
  world.checkAndNotifyOfflineRewards(conn, player);
  assert.deepEqual(player.pendingOfflineReward, first);
  world.removePlayerFromWorld(conn, true, true);
  t.mock.timers.tick(3600_000);
  const loaded = db.loadPlayerFromRecord(conn.id, db.getCharacterByName(player.name)!);
  assert.deepEqual(loaded.pendingOfflineReward, first);
  world.enterWorld(conn, loaded);
  assert.equal(loaded.pendingOfflineReward!.cappedSeconds, 7200);
  assert.equal(loaded.pendingOfflineReward!.accumulatedGold, first.accumulatedGold * 2);
  assert.equal(world.claimOfflineRewards(loaded).success, true);
  const saved = db.getCharacterByName(player.name)!;
  assert.equal(saved.pending_offline_reward, null);
  assert.equal(world.claimOfflineRewards(loaded).success, false);
});

test('8. Falha no save reverte ouro, itens, nível, atributos e mantém o baú persistido', (t) => {
  const { world, conn, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.lastLogoutTime = Date.now() - 1800_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  const savedBefore = db.getCharacterByName(player.name)!;
  const inventoryBefore = db.getInventory(player.dbCharacterId);
  const attrsBefore = { ...player.baseAttributes };
  const save = t.mock.method(db, 'savePlayer', () => { throw new Error('SIMULATED_DISK_FAILURE'); });
  assert.equal(world.claimOfflineRewards(player).success, false);
  assert.equal(player.level, savedBefore.level);
  assert.deepEqual(player.baseAttributes, attrsBefore);
  assert.deepEqual(db.getInventory(player.dbCharacterId), inventoryBefore);
  assert.deepEqual(db.getCharacterByName(player.name), savedBefore);
  assert.ok(player.pendingOfflineReward);
  save.mock.restore();
  assert.equal(world.claimOfflineRewards(player).success, true);
});

test('9. Materiais usam slots expandidos e respeitam o limite de cada pilha', () => {
  const { world, conn, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.maxInventorySlots = 25;
  const potion = player.inventory.find(item => item.itemId === 'potion_hp_minor')!;
  db.addItemToInventory(player.dbCharacterId, 'potion_hp_minor', 98 - potion.quantity, 25);
  // Fill remaining original slots with non-stackable swords.
  while (db.getInventory(player.dbCharacterId).length < 20) {
    assert.equal(db.addItemToInventory(player.dbCharacterId, 'sword_iron_broadsword', 1, 25), true);
  }
  player.inventory = db.getInventory(player.dbCharacterId);
  player.lastLogoutTime = Date.now() - 9000_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  assert.equal(world.claimOfflineRewards(player).success, true);
  const inventory = db.getInventory(player.dbCharacterId);
  assert.ok(inventory.some(item => item.slotIndex >= 20 && item.itemId === 'ore_iron_arcane'));
  const potions = inventory.filter(item => item.itemId === 'potion_hp_minor');
  assert.equal(potions.reduce((sum, item) => sum + item.quantity, 0), 113);
  assert.ok(potions.every(item => item.quantity <= 99));
});

test('10. Cópia antiga do mesmo baú em outra sessão não pode resgatar novamente', () => {
  const { world, conn, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.lastLogoutTime = Date.now() - 1800_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  const stale = db.loadPlayerFromRecord('stale_connection', db.getCharacterByName(player.name)!);
  assert.equal(world.claimOfflineRewards(player).success, true);
  const gold = db.getCharacterByName(player.name)!.gold;
  assert.equal(world.claimOfflineRewards(stale).success, false);
  assert.equal(db.getCharacterByName(player.name)!.gold, gold);
  assert.equal(db.getCharacterByName(player.name)!.pending_offline_reward, null);
});

test('11. Reinício do SQLite mantém o baú e a migração pode executar novamente', (t) => {
  const databasePath = join(tmpdir(), `magicforge-offline-${randomUUID()}.sqlite`);
  let database: DatabaseManager | undefined;
  t.after(() => {
    database?.close();
    for (const suffix of ['', '-wal', '-shm']) rmSync(databasePath + suffix, { force: true });
  });
  database = new DatabaseManager(databasePath);
  const account = database.getOrCreateAccount('offline_restart');
  const player = database.createCharacterInSlot('restart_connection', account.id, 0, 'RestartHero', CharacterClass.GUERREIRO);
  const world = new World(database);
  const conn = new Connection('restart_connection', new MockSocket() as any);
  player.lastLogoutTime = Date.now() - 3600_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  const expected = structuredClone(player.pendingOfflineReward);
  database.close();
  database = new DatabaseManager(databasePath);
  const loaded = database.loadPlayerFromRecord('new_connection', database.getCharacterByName(player.name)!);
  assert.deepEqual(loaded.pendingOfflineReward, expected);
});

test('10. Resgate com bag cheia, expansão comprada e retirada do restante completam o mesmo baú uma vez', () => {
  const { world, conn, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.level = 35; player.gold = 500000; db.savePlayer(player);
  while (db.getInventory(player.dbCharacterId).filter(item => !item.isEquipped).length < 20) {
    assert.equal(db.addItemToInventory(player.dbCharacterId, 'sword_iron_broadsword', 1, 20), true);
  }
  player.inventory = db.getInventory(player.dbCharacterId);
  player.lastLogoutTime = Date.now() - 1800_000;
  world.checkAndNotifyOfflineRewards(conn, player);
  const expectedGold = 500000 + player.pendingOfflineReward!.accumulatedGold - 10000;
  assert.equal(world.claimOfflineRewards(player).success, true);
  assert.ok(player.pendingOfflineReward!.loot.some(item => item.itemId === 'ore_iron_arcane'));
  assert.equal(world.expandPlayerInventory(player, 20).success, true);
  assert.equal(player.maxInventorySlots, 25);
  assert.equal(world.claimOfflineRewards(player).success, true);
  assert.equal(player.pendingOfflineReward, null);
  assert.equal(player.gold, expectedGold);
  assert.equal(world.claimOfflineRewards(player).success, false);
});
