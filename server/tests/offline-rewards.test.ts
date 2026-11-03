import test from 'node:test';
import assert from 'node:assert/strict';
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
  const ironOre = player.pendingOfflineReward.loot.find((l) => l.itemId === 'iron_ore');
  assert.ok(ironOre);
  assert.equal(ironOre.quantity, 4 * 2); // 8 minérios de ferro

  const pkt = mockSocket.getLastPacket(Opcode.S2C_OFFLINE_REWARD_INFO) as S2COfflineRewardInfoPayload;
  assert.ok(pkt);
  assert.equal(pkt.accumulatedGold, expectedGold);
  assert.equal(pkt.accumulatedExp, expectedExp);
  assert.equal(pkt.cappedSeconds, 3600);
});

test('3. Limite de 12 horas (43.200s) limita o ganho mesmo após 24 horas offline', () => {
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
  assert.equal(player.pendingOfflineReward.cappedSeconds, 43200, 'Deve aplicar teto máximo de 12 horas');

  // goldPerSec = 1*15 + 1*5 + 1*3 = 23
  const expectedGold = 43200 * 23;
  assert.equal(player.pendingOfflineReward.accumulatedGold, expectedGold);

  const pkt = mockSocket.getLastPacket(Opcode.S2C_OFFLINE_REWARD_INFO) as S2COfflineRewardInfoPayload;
  assert.ok(pkt);
  assert.equal(pkt.cappedSeconds, 43200);
  assert.equal(pkt.accumulatedGold, expectedGold);
});

test('4. Resgate autoritativo (C2S_CLAIM_OFFLINE_REWARDS) credita Ouro, EXP, itens no SQLite e limpa pendência', () => {
  const { world, conn, mockSocket, db } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  player.gold = 500;
  const initialExp = player.currentXp;

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
