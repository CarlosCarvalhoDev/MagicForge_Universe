import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CharacterClass,
  Opcode,
  createVector3,
  S2CPartyUpdatePayload,
  S2CPartyInviteReceivedPayload,
  S2CPartyActionResultPayload,
  S2CPlayerExpUpdatePayload,
} from '@magicforge/shared';
import { WorldManager } from '../src/game/WorldManager';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { Connection } from '../src/network/Connection';
import { Monster } from '../src/entities/Monster';

class MockConnection {
  public id: string;
  public playerId: string | null = null;
  public accountId: string | null = null;
  public accountUsername: string | null = null;
  public isAuthenticated: boolean = false;
  public currentWorldInstance: any | null = null;
  public currentChannelId: number = 1;
  public currentWorldIndex: number = 1;
  public sentPackets: Array<{ op: Opcode; data: any }> = [];

  constructor(id: string) {
    this.id = id;
  }

  public send(op: Opcode, data: any): void {
    this.sentPackets.push({ op, data });
  }

  public getLastPacket(op: Opcode): any | null {
    for (let i = this.sentPackets.length - 1; i >= 0; i--) {
      if (this.sentPackets[i].op === op) return this.sentPackets[i].data;
    }
    return null;
  }

  public getPackets(op: Opcode): any[] {
    return this.sentPackets.filter((p) => p.op === op).map((p) => p.data);
  }

  public clear(): void {
    this.sentPackets = [];
  }
}

function createPlayerConnection(worldManager: WorldManager, id: string, username: string, heroName: string): MockConnection {
  const conn = new MockConnection(id);
  worldManager.registerConnection(conn as unknown as Connection);
  worldManager.handleAuthRegister(conn as unknown as Connection, { username, password: 'password123', email: `${username}@forja.com` });
  worldManager.handleCreateCharacterSlot(conn as unknown as Connection, 0, heroName, CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn as unknown as Connection, 0, 1);
  return conn;
}

test('1. Convite e formação de grupo entre dois jogadores', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  const conn1 = createPlayerConnection(worldManager, 'conn_l1', 'leader1', 'LiderGuerreiro');
  const conn2 = createPlayerConnection(worldManager, 'conn_m1', 'member1', 'MembroAliado');

  conn1.clear();
  conn2.clear();

  // 1. Líder convida Membro pelo nome
  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerName: 'MembroAliado' });

  // Confirma envio do convite
  const invitePkt = conn2.getLastPacket(Opcode.S2C_PARTY_INVITE_RECEIVED) as S2CPartyInviteReceivedPayload;
  assert.ok(invitePkt);
  assert.equal(invitePkt.inviterName, 'LiderGuerreiro');

  // 2. Membro aceita o convite
  worldManager.handlePartyInviteResponse(conn2 as unknown as Connection, { inviterId: invitePkt.inviterId, accept: true });

  // 3. Ambos devem receber S2C_PARTY_UPDATE com 2 membros
  const updateConn1 = conn1.getLastPacket(Opcode.S2C_PARTY_UPDATE) as S2CPartyUpdatePayload;
  const updateConn2 = conn2.getLastPacket(Opcode.S2C_PARTY_UPDATE) as S2CPartyUpdatePayload;

  assert.ok(updateConn1);
  assert.ok(updateConn2);
  assert.equal(updateConn1.partyId, updateConn2.partyId);
  assert.equal(updateConn1.leaderId, conn1.playerId);
  assert.equal(updateConn1.members.length, 2);
  assert.equal(updateConn1.members.find((m) => m.playerId === conn1.playerId)?.isLeader, true);
  assert.equal(updateConn1.members.find((m) => m.playerId === conn2.playerId)?.isLeader, false);
});

test('2. Limite de 4 membros por grupo e rejeição quando lotado', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  const conn1 = createPlayerConnection(worldManager, 'conn_cap1', 'cap1', 'LiderCap');
  const conn2 = createPlayerConnection(worldManager, 'conn_cap2', 'cap2', 'Heroi2');
  const conn3 = createPlayerConnection(worldManager, 'conn_cap3', 'cap3', 'Heroi3');
  const conn4 = createPlayerConnection(worldManager, 'conn_cap4', 'cap4', 'Heroi4');
  const conn5 = createPlayerConnection(worldManager, 'conn_cap5', 'cap5', 'Heroi5');

  // Forma grupo com 4 membros
  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn2.playerId! });
  worldManager.handlePartyInviteResponse(conn2 as unknown as Connection, { inviterId: conn1.playerId!, accept: true });

  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn3.playerId! });
  worldManager.handlePartyInviteResponse(conn3 as unknown as Connection, { inviterId: conn1.playerId!, accept: true });

  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn4.playerId! });
  worldManager.handlePartyInviteResponse(conn4 as unknown as Connection, { inviterId: conn1.playerId!, accept: true });

  const party = worldManager.partyManager.getPlayerParty(conn1.playerId!);
  assert.ok(party);
  assert.equal(party.getMemberCount(), 4);

  // Tenta convidar o 5º membro: deve rejeitar com PARTY_FULL
  conn1.clear();
  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn5.playerId! });

  // Confirma que não houve convite enviado para o 5º
  const inviteConn5 = conn5.getLastPacket(Opcode.S2C_PARTY_INVITE_RECEIVED);
  assert.equal(inviteConn5, null);
});

test('3. Bônus de EXP cooperativo (+10% por membro em área de 25m)', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  const conn1 = createPlayerConnection(worldManager, 'conn_exp1', 'exp1', 'GuerreiroA');
  const conn2 = createPlayerConnection(worldManager, 'conn_exp2', 'exp2', 'GuerreiroB');

  // Forma grupo
  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn2.playerId! });
  worldManager.handlePartyInviteResponse(conn2 as unknown as Connection, { inviterId: conn1.playerId!, accept: true });

  const world = conn1.currentWorldInstance;
  const p1 = world.entityManager.getPlayer(conn1.playerId!);
  const p2 = world.entityManager.getPlayer(conn2.playerId!);

  // Posiciona P1 e P2 a 5m de distância (dentro dos 25m)
  p1.position = createVector3(0, 0, 0);
  p2.position = createVector3(5, 0, 0);
  p1.currentXp = 0;
  p2.currentXp = 0;

  conn1.clear();
  conn2.clear();

  // Cria um monstro com 100 de EXP base e P1 o abate
  const mob = new Monster('mob_exp_test', 'Lobo', createVector3(1, 0, 0), 10, 5);
  mob.expReward = 100;
  world.entityManager.addMonster(mob);

  world.handleMonsterDeath(mob, p1);

  // Com 2 membros próximos: base 100 * 1.10 = 110 EXP total -> 55 EXP para cada um!
  assert.equal(p1.currentXp, 55, 'P1 deve receber 55 EXP com o bônus de cooperação');
  assert.equal(p2.currentXp, 55, 'P2 deve receber 55 EXP cooperativa por estar a 5m');

  const expPacket1 = conn1.getLastPacket(Opcode.S2C_PLAYER_EXP_UPDATE) as S2CPlayerExpUpdatePayload;
  const expPacket2 = conn2.getLastPacket(Opcode.S2C_PLAYER_EXP_UPDATE) as S2CPlayerExpUpdatePayload;
  assert.ok(expPacket1);
  assert.ok(expPacket2);
  assert.equal(expPacket1.expGained, 55);
  assert.equal(expPacket2.expGained, 55);
});

test('4. Expulsão de membro pelo líder e transferência de liderança', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  const conn1 = createPlayerConnection(worldManager, 'conn_mod1', 'mod1', 'LiderOriginal');
  const conn2 = createPlayerConnection(worldManager, 'conn_mod2', 'mod2', 'Aliado1');
  const conn3 = createPlayerConnection(worldManager, 'conn_mod3', 'mod3', 'Aliado2');

  // Forma grupo de 3
  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn2.playerId! });
  worldManager.handlePartyInviteResponse(conn2 as unknown as Connection, { inviterId: conn1.playerId!, accept: true });

  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn3.playerId! });
  worldManager.handlePartyInviteResponse(conn3 as unknown as Connection, { inviterId: conn1.playerId!, accept: true });

  const party = worldManager.partyManager.getPlayerParty(conn1.playerId!)!;
  assert.equal(party.getMemberCount(), 3);
  assert.equal(party.leaderId, conn1.playerId);

  // 1. Líder transfere a liderança para Aliado1 (conn2)
  worldManager.handlePartyPromoteLeader(conn1 as unknown as Connection, { targetPlayerId: conn2.playerId! });
  assert.equal(party.leaderId, conn2.playerId, 'conn2 deve ser o novo líder');

  // 2. Novo líder (conn2) expulsa Aliado2 (conn3)
  conn3.clear();
  worldManager.handlePartyKick(conn2 as unknown as Connection, { targetPlayerId: conn3.playerId! });

  assert.equal(party.getMemberCount(), 2);
  assert.equal(worldManager.partyManager.getPlayerParty(conn3.playerId!), null);

  // Confirma que conn3 recebeu notificação de saída
  const kickPkt = conn3.getLastPacket(Opcode.S2C_PARTY_UPDATE) as S2CPartyUpdatePayload;
  assert.ok(kickPkt);
  assert.equal(kickPkt.isDisbanded, true);
});

test('5. Saída voluntária e dissolução segura do grupo ao sobrar 1 membro', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  const conn1 = createPlayerConnection(worldManager, 'conn_dis1', 'dis1', 'LiderDis');
  const conn2 = createPlayerConnection(worldManager, 'conn_dis2', 'dis2', 'MembroDis');

  worldManager.handlePartyInvite(conn1 as unknown as Connection, { targetPlayerId: conn2.playerId! });
  worldManager.handlePartyInviteResponse(conn2 as unknown as Connection, { inviterId: conn1.playerId!, accept: true });

  conn1.clear();
  conn2.clear();

  // Membro sai voluntariamente do grupo
  worldManager.handlePartyLeave(conn2 as unknown as Connection);

  assert.equal(worldManager.partyManager.getPlayerParty(conn2.playerId!), null);
  assert.equal(worldManager.partyManager.getPlayerParty(conn1.playerId!), null, 'O grupo deve ser dissolvido com 1 membro restante');

  // Ambos recebem notificação de grupo desfeito
  const update1 = conn1.getLastPacket(Opcode.S2C_PARTY_UPDATE) as S2CPartyUpdatePayload;
  const update2 = conn2.getLastPacket(Opcode.S2C_PARTY_UPDATE) as S2CPartyUpdatePayload;
  assert.ok(update1);
  assert.ok(update2);
  assert.equal(update1.isDisbanded, true);
  assert.equal(update2.isDisbanded, true);
});

