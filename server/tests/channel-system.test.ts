import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CharacterClass,
  Opcode,
  createVector3,
  S2CChannelListPayload,
  S2CChangeChannelResultPayload,
} from '@magicforge/shared';
import { WorldManager } from '../src/game/WorldManager';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { Connection } from '../src/network/Connection';
import { PacketHandler } from '../src/network/PacketHandler';

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

test('1. Listagem de canais e status de carga por mundo', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);
  const conn = new MockConnection('conn_list') as unknown as Connection;
  worldManager.registerConnection(conn);

  const channelsW1 = worldManager.getAvailableChannels(1);
  assert.ok(channelsW1.length >= 2, 'Mundo 1 deve ter no mínimo 2 canais iniciais');
  assert.equal(channelsW1[0].channelId, 1);
  assert.equal(channelsW1[0].worldIndex, 1);
  assert.equal(channelsW1[0].worldName, 'Floresta da Forja');
  assert.equal(channelsW1[0].activePlayers, 0);
  assert.equal(channelsW1[0].loadStatus, 'LIVRE');

  const channelsW2 = worldManager.getAvailableChannels(2);
  assert.ok(channelsW2.length >= 2, 'Mundo 2 deve ter no mínimo 2 canais iniciais');
  assert.equal(channelsW2[0].channelId, 1);
  assert.equal(channelsW2[0].worldIndex, 2);
  assert.equal(channelsW2[0].worldName, 'Picos de Jotunheim');
});

test('2. Balanceamento automático de carga entre canais do mesmo mundo', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  // Jogador 1 entra no Mundo 1
  const conn1 = new MockConnection('conn_p1') as unknown as Connection;
  worldManager.registerConnection(conn1);
  worldManager.handleAuthRegister(conn1, { username: 'user1', password: 'password123', email: 'u1@forja.com' });
  worldManager.handleCreateCharacterSlot(conn1, 0, 'HeroiUm', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn1, 0);

  // Jogador 2 entra no Mundo 1
  const conn2 = new MockConnection('conn_p2') as unknown as Connection;
  worldManager.registerConnection(conn2);
  worldManager.handleAuthRegister(conn2, { username: 'user2', password: 'password123', email: 'u2@forja.com' });
  worldManager.handleCreateCharacterSlot(conn2, 0, 'HeroiDois', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn2, 0);

  // Jogador 1 no Canal 1, Jogador 2 distribuído no Canal 2
  assert.equal(conn1.currentChannelId, 1, 'Jogador 1 deve estar no Canal 1');
  assert.equal(conn2.currentChannelId, 2, 'Jogador 2 deve ser balanceado para o Canal 2');

  // Jogador 3 entra com preferência explícita pelo Canal 1
  const conn3 = new MockConnection('conn_p3') as unknown as Connection;
  worldManager.registerConnection(conn3);
  worldManager.handleAuthRegister(conn3, { username: 'user3', password: 'password123', email: 'u3@forja.com' });
  worldManager.handleCreateCharacterSlot(conn3, 0, 'HeroiTres', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn3, 0, 1);

  assert.equal(conn3.currentChannelId, 1, 'Jogador 3 deve respeitar a preferência pelo Canal 1');
});

test('3. Isolamento estrito de visibilidade e combate entre canais', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  // P1 no Canal 1
  const conn1 = new MockConnection('conn_iso_1') as unknown as Connection;
  worldManager.registerConnection(conn1);
  worldManager.handleAuthRegister(conn1, { username: 'iso_user1', password: 'password123', email: 'iso1@forja.com' });
  worldManager.handleCreateCharacterSlot(conn1, 0, 'GuerreiroCh1', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn1, 0, 1);

  // P2 no Canal 2
  const conn2 = new MockConnection('conn_iso_2') as unknown as Connection;
  worldManager.registerConnection(conn2);
  worldManager.handleAuthRegister(conn2, { username: 'iso_user2', password: 'password123', email: 'iso2@forja.com' });
  worldManager.handleCreateCharacterSlot(conn2, 0, 'GuerreiroCh2', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn2, 0, 2);

  // Limpa pacotes iniciais de conexão
  (conn1 as any).clear();
  (conn2 as any).clear();

  // Instâncias isoladas
  const world1 = conn1.currentWorldInstance;
  const world2 = conn2.currentWorldInstance;
  assert.notEqual(world1, world2, 'As instâncias de mundo de canais diferentes devem ser distintas');

  const p1 = world1.entityManager.getPlayer(conn1.playerId!);
  const p2 = world2.entityManager.getPlayer(conn2.playerId!);
  assert.ok(p1);
  assert.ok(p2);

  // Confirma que P1 não existe no EntityManager de World 2 e vice-versa
  assert.equal(world2.entityManager.getPlayer(p1.id), undefined);
  assert.equal(world1.entityManager.getPlayer(p2.id), undefined);

  // P1 aproxima-se e ataca um monstro do Canal 1
  const mobInCh1 = world1.entityManager.getAllMonsters()[0];
  p1.position = createVector3(mobInCh1.position.x - 1.5, 0, mobInCh1.position.z);
  world1.spatialGrid.updateEntity(p1);
  const castRes = world1.castPlayerSkill(p1, 1, mobInCh1.id);
  assert.equal(castRes, true, 'Habilidade deve ser executada com sucesso contra o monstro no alcance');

  // P1 recebe evento de conjuração de habilidade
  const skillCastPacketsP1 = (conn1 as any).getPackets(Opcode.S2C_SKILL_CAST_EVENT);
  assert.ok(skillCastPacketsP1.length > 0, 'Jogador no Canal 1 deve receber o evento de habilidade executada');

  // P2 no Canal 2 NÃO recebe nenhum evento do Canal 1!
  const skillCastPacketsP2 = (conn2 as any).getPackets(Opcode.S2C_SKILL_CAST_EVENT);
  assert.equal(skillCastPacketsP2.length, 0, 'Jogador no Canal 2 não deve receber eventos do Canal 1');
});

test('4. Troca dinâmica de canal com transferência segura e despawn/spawn autoritativo', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  // P1 no Canal 1
  const conn1 = new MockConnection('conn_swap_1') as unknown as Connection;
  worldManager.registerConnection(conn1);
  worldManager.handleAuthRegister(conn1, { username: 'swap_u1', password: 'password123', email: 'sw1@forja.com' });
  worldManager.handleCreateCharacterSlot(conn1, 0, 'Viajante', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn1, 0, 1);

  // P2 no Canal 2
  const conn2 = new MockConnection('conn_swap_2') as unknown as Connection;
  worldManager.registerConnection(conn2);
  worldManager.handleAuthRegister(conn2, { username: 'swap_u2', password: 'password123', email: 'sw2@forja.com' });
  worldManager.handleCreateCharacterSlot(conn2, 0, 'ResidenteCh2', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn2, 0, 2);

  // P3 no Canal 1 (para observar o despawn de P1 ao trocar de canal)
  const conn3 = new MockConnection('conn_swap_3') as unknown as Connection;
  worldManager.registerConnection(conn3);
  worldManager.handleAuthRegister(conn3, { username: 'swap_u3', password: 'password123', email: 'sw3@forja.com' });
  worldManager.handleCreateCharacterSlot(conn3, 0, 'ObservadorCh1', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn3, 0, 1);

  (conn1 as any).clear();
  (conn2 as any).clear();
  (conn3 as any).clear();

  // P1 ganha ouro e dano antes de trocar de canal
  const p1 = conn1.currentWorldInstance.entityManager.getPlayer(conn1.playerId!);
  p1.gold = 7777;
  p1.level = 18;

  // P1 solicita mudança para o Canal 2
  const changeRes = worldManager.changePlayerChannel(conn1, 2);
  assert.equal(changeRes.success, true);
  assert.equal(conn1.currentChannelId, 2);

  // 1. Confirma que Observador no Canal 1 recebeu S2C_ENTITY_DESPAWN para P1
  const despawnP3 = (conn3 as any).getLastPacket(Opcode.S2C_ENTITY_DESPAWN);
  assert.ok(despawnP3);
  assert.equal(despawnP3.entityId, p1.id);
  assert.equal(despawnP3.reason, 'DISCONNECTED');

  // 2. Confirma que Residente no Canal 2 recebeu S2C_ENTITY_SPAWN para P1
  const spawnsP2 = (conn2 as any).getPackets(Opcode.S2C_ENTITY_SPAWN);
  assert.ok(spawnsP2.some((s: any) => s.entity.id === p1.id));

  // 3. Confirma que P1 recebeu S2C_CHANGE_CHANNEL_RESULT com canal 2
  const changePkt = (conn1 as any).getLastPacket(Opcode.S2C_CHANGE_CHANNEL_RESULT) as S2CChangeChannelResultPayload;
  assert.ok(changePkt);
  assert.equal(changePkt.success, true);
  assert.equal(changePkt.channelId, 2);

  // 4. Confirma dados do personagem perfeitamente preservados após a troca de canal
  const p1InNewChannel = conn1.currentWorldInstance.entityManager.getPlayer(conn1.playerId!);
  assert.ok(p1InNewChannel);
  assert.equal(p1InNewChannel.gold, 7777);
  assert.equal(p1InNewChannel.level, 18);
});

test('5. Rejeição quando canal destino estiver lotado', () => {
  const db = new DatabaseManager(':memory:');
  const worldManager = new WorldManager(db);

  // Configura capacidade máxima do Canal 2 para 1 jogador
  const ch2 = worldManager.getOrCreateChannel(1, 2);
  ch2.maxPlayers = 1;

  // P1 ocupa a única vaga do Canal 2
  const conn1 = new MockConnection('conn_occupy') as unknown as Connection;
  worldManager.registerConnection(conn1);
  worldManager.handleAuthRegister(conn1, { username: 'occupant', password: 'password123', email: 'occ@forja.com' });
  worldManager.handleCreateCharacterSlot(conn1, 0, 'Ocupante', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn1, 0, 2);

  // P2 entra no Canal 1
  const conn2 = new MockConnection('conn_try_full') as unknown as Connection;
  worldManager.registerConnection(conn2);
  worldManager.handleAuthRegister(conn2, { username: 'applicant', password: 'password123', email: 'app@forja.com' });
  worldManager.handleCreateCharacterSlot(conn2, 0, 'Candidato', CharacterClass.GUERREIRO);
  worldManager.handleSelectCharacterSlot(conn2, 0, 1);

  // P2 tenta trocar para o Canal 2 (que está 1/1 lotado)
  const changeRes = worldManager.changePlayerChannel(conn2, 2);
  assert.equal(changeRes.success, false);
  assert.equal(changeRes.reason, 'CHANNEL_FULL');
  assert.equal(conn2.currentChannelId, 1, 'Jogador deve permanecer com segurança no Canal 1');
});
