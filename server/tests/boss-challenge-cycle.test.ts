import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/World';
import { Connection } from '../src/network/Connection';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { CharacterClass, Opcode, createVector3, S2CStageUpdatePayload, S2CBossEventPayload } from '@magicforge/shared';
import { MonsterState } from '../src/entities/Monster';

class MockSocket {
  public sentMessages: string[] = [];
  public readyState: number = 1;

  public send(msg: string): void {
    this.sentMessages.push(msg);
  }

  public getPackets(op?: number): any[] {
    return this.sentMessages
      .map(m => JSON.parse(m))
      .filter(p => (op !== undefined ? p.op === op : true))
      .map(p => p.data);
  }

  public getLastPacket(op: number): any | null {
    const pkts = this.getPackets(op);
    return pkts.length > 0 ? pkts[pkts.length - 1] : null;
  }
}

let testAccountCounter = 0;

function setupTestWorld(): { world: World; conn: Connection; mockSocket: MockSocket; db: DatabaseManager } {
  testAccountCounter++;
  const db = new DatabaseManager(':memory:');
  const world = new World(db, 1, 1);
  const mockSocket = new MockSocket();
  const conn = new Connection(`conn_test_${testAccountCounter}`, mockSocket as any);
  world.registerConnection(conn);

  const username = `hero_${testAccountCounter}_${Math.floor(Math.random() * 9999)}`;
  world.handleAuthRegister(conn, { username, password: 'password123', email: `${username}@forja.com` });
  assert.ok(conn.isAuthenticated);

  world.handleCreateCharacterSlot(conn, 0, `Valente_${testAccountCounter}`, CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn, 0);

  return { world, conn, mockSocket, db };
}

test('1. Timeout no Chefe da Fase 10 aciona Auto-Recuo para Fase 9, revivendo herói e mantendo farm seguro', () => {
  const { world, conn, mockSocket } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  assert.ok(player);

  // Inicia desafio do Chefão
  const challengeRes = world.challengeStageBoss(player);
  assert.equal(challengeRes.success, true);
  assert.equal(world.currentStage, 10);
  assert.equal(world.isBossActive, true);
  assert.ok(world.activeBossId);

  // Simula esgotamento do tempo limite (60 segundos)
  world.update(60.1);

  // Valida auto-recuo para Fase 9
  assert.equal(world.currentStage, 9, 'Deve recuar para a Fase 9');
  assert.equal(world.isBossActive, false, 'Chefe deve ser despawnado');
  assert.equal(world.activeBossId, null);
  assert.equal(world.isBossAvailable, true, 'Botão de re-desafio deve ficar ativo');
  assert.equal(player.currentHp, player.maxHp, 'HP deve ser restaurado para o farm');
  assert.equal(player.isDead, false);

  // Valida notificação enviada ao cliente
  const stagePkt = mockSocket.getLastPacket(Opcode.S2C_STAGE_UPDATE) as S2CStageUpdatePayload;
  assert.ok(stagePkt);
  assert.equal(stagePkt.stage, 9);
  assert.equal(stagePkt.bossAvailable, true);
  assert.equal(stagePkt.isBossStage, false);

  const bossPkt = mockSocket.getLastPacket(Opcode.S2C_BOSS_EVENT) as S2CBossEventPayload;
  assert.ok(bossPkt);
  assert.equal(bossPkt.eventType, 'TIMEOUT');
});

test('2. Morte do jogador contra o Chefe aciona Auto-Recuo imediato para a Fase 9 sem travar o jogo', () => {
  const { world, conn, mockSocket } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  world.challengeStageBoss(player);
  assert.equal(world.isBossActive, true);

  const boss = world.entityManager.getMonster(world.activeBossId!)!;
  assert.ok(boss);

  // Chefe aplica dano letal ao jogador
  player.takeDamage(player.maxHp * 2, boss);
  assert.equal(player.isDead, true);

  // Executa ciclo de combate do chefe que detecta a derrota do jogador
  boss.attackCooldown = 0;
  boss.targetPlayer = player;
  boss.state = MonsterState.ATTACKING;
  world['processMonsterCombat'](boss);

  // Valida auto-recuo seguro
  assert.equal(world.currentStage, 9);
  assert.equal(world.isBossActive, false);
  assert.equal(world.isBossAvailable, true);
  assert.equal(player.isDead, false, 'Jogador deve renascer automaticamente no acampamento');
  assert.equal(player.currentHp, player.maxHp);
});

test('3. Re-desafio manual reinicia a arena da Fase 10 com novo timer de 60s e cura total', () => {
  const { world, conn, mockSocket } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  // Falha na primeira tentativa
  world.challengeStageBoss(player);
  world.update(60.1);
  assert.equal(world.currentStage, 9);
  assert.equal(world.isBossAvailable, true);

  // Jogador clica no botão [DESAFIAR CHEFÃO]
  player.currentHp = 50; // Deixou HP baixo no farm
  const retryRes = world.challengeStageBoss(player);
  assert.equal(retryRes.success, true);

  // Arena reconfigurada
  assert.equal(world.currentStage, 10);
  assert.equal(world.isBossActive, true);
  assert.equal(world.isBossAvailable, false, 'Botão de desafio deve sumir durante a luta');
  assert.equal(world.bossTimerSec, 60.0);
  assert.equal(player.currentHp, player.maxHp, 'Início do chefe deve conceder full HP');
});

test('4. Auto-desafio de chefe (autoChallengeBoss) re-invoca automaticamente quando ativado', () => {
  const { world, conn } = setupTestWorld();
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  // Jogador ativa toggle de auto-challenge
  player.farmSettings.autoChallengeBoss = true;

  // Está na Fase 9 com chefe disponível
  world.currentStage = 9;
  world.stageKills = 0;
  world.isBossAvailable = true;

  // Derrota 10 monstros da Fase 9
  for (let i = 0; i < 10; i++) {
    const mob = world.entityManager.getAllMonsters().find(m => !m.isBoss && !m.isDead);
    assert.ok(mob);
    mob.takeDamage(mob.maxHp, player);
    world.handleMonsterDeath(mob, player);
  }

  // Com autoChallengeBoss ligado, deve acionar a Fase 10 automaticamente
  assert.equal(world.currentStage, 10, 'Deve ter avançado automaticamente para o Chefe');
  assert.equal(world.isBossActive, true, 'Chefe deve estar ativo na arena');
});
