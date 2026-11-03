import test from 'node:test';
import assert from 'node:assert/strict';
import { ClientNetwork } from '../src/network/ClientNetwork.ts';
import { Opcode, CharacterClass } from '@magicforge/shared';

test('ClientNetwork sends channel requests with correct opcodes and payloads', () => {
  const sentMessages = [];
  const network = new ClientNetwork('ws://localhost:3000');
  network.isConnected = true;

  // Mock send
  network.send = (op, data) => {
    sentMessages.push({ op, data });
  };

  network.sendRequestChannelList();
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].op, Opcode.C2S_REQUEST_CHANNEL_LIST);

  network.sendChangeChannel(2);
  assert.equal(sentMessages.length, 2);
  assert.equal(sentMessages[1].op, Opcode.C2S_CHANGE_CHANNEL);
  assert.equal(sentMessages[1].data.targetChannelId, 2);
});

test('ClientNetwork sends party actions with correct opcodes and parameters', () => {
  const sentMessages = [];
  const network = new ClientNetwork('ws://localhost:3000');
  network.isConnected = true;
  network.send = (op, data) => {
    sentMessages.push({ op, data });
  };

  network.sendPartyInvite('Artemis');
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].op, Opcode.C2S_PARTY_INVITE);
  assert.equal(sentMessages[0].data.targetPlayerName, 'Artemis');

  network.sendPartyRespondInvite('leader_123', true);
  assert.equal(sentMessages.length, 2);
  assert.equal(sentMessages[1].op, Opcode.C2S_PARTY_INVITE_RESPONSE);
  assert.equal(sentMessages[1].data.inviterId, 'leader_123');
  assert.equal(sentMessages[1].data.accept, true);

  network.sendPartyLeave();
  assert.equal(sentMessages.length, 3);
  assert.equal(sentMessages[2].op, Opcode.C2S_PARTY_LEAVE);

  network.sendPartyKick('member_456');
  assert.equal(sentMessages.length, 4);
  assert.equal(sentMessages[3].op, Opcode.C2S_PARTY_KICK);
  assert.equal(sentMessages[3].data.targetPlayerId, 'member_456');

  network.sendPartyPromote('member_456');
  assert.equal(sentMessages.length, 5);
  assert.equal(sentMessages[4].op, Opcode.C2S_PARTY_PROMOTE_LEADER);
  assert.equal(sentMessages[4].data.targetPlayerId, 'member_456');

  network.sendPartyDisband();
  assert.equal(sentMessages.length, 6);
  assert.equal(sentMessages[5].op, Opcode.C2S_PARTY_DISBAND);
});

test('ClientNetwork dispatches incoming channel and party packets to their listeners', () => {
  const network = new ClientNetwork('ws://localhost:3000');

  let channelListReceived = null;
  let changeResultReceived = null;
  let partyUpdateReceived = null;
  let inviteReceived = null;
  let actionResultReceived = null;

  network.onChannelList = (payload) => { channelListReceived = payload; };
  network.onChangeChannelResult = (payload) => { changeResultReceived = payload; };
  network.onPartyUpdate = (payload) => { partyUpdateReceived = payload; };
  network.onPartyInviteReceived = (payload) => { inviteReceived = payload; };
  network.onPartyActionResult = (payload) => { actionResultReceived = payload; };

  // Simulate incoming packets via handleIncomingRaw
  network['handleIncomingRaw'](JSON.stringify({
    op: Opcode.S2C_CHANNEL_LIST,
    data: {
      worldIndex: 1,
      worldName: 'Floresta da Forja',
      currentChannelId: 1,
      channels: [
        { channelId: 1, worldIndex: 1, worldName: 'Floresta da Forja', activePlayers: 1, maxPlayers: 50, loadStatus: 'LIVRE', isCurrentChannel: true },
        { channelId: 2, worldIndex: 1, worldName: 'Floresta da Forja', activePlayers: 0, maxPlayers: 50, loadStatus: 'LIVRE', isCurrentChannel: false },
      ],
    },
  }));
  assert.ok(channelListReceived);
  assert.equal(channelListReceived.currentChannelId, 1);
  assert.equal(channelListReceived.channels.length, 2);

  network['handleIncomingRaw'](JSON.stringify({
    op: Opcode.S2C_CHANGE_CHANNEL_RESULT,
    data: { success: true, channelId: 2, message: 'Transferido para Canal 2' },
  }));
  assert.ok(changeResultReceived);
  assert.equal(changeResultReceived.channelId, 2);

  network['handleIncomingRaw'](JSON.stringify({
    op: Opcode.S2C_PARTY_INVITE_RECEIVED,
    data: { inviterId: 'p1', inviterName: 'SirGalahad', inviterLevel: 5, inviterClass: CharacterClass.GUERREIRO },
  }));
  assert.ok(inviteReceived);
  assert.equal(inviteReceived.inviterName, 'SirGalahad');

  network['handleIncomingRaw'](JSON.stringify({
    op: Opcode.S2C_PARTY_UPDATE,
    data: {
      partyId: 'party_1',
      leaderId: 'p1',
      members: [
        { playerId: 'p1', name: 'SirGalahad', classType: CharacterClass.GUERREIRO, level: 5, currentHp: 500, maxHp: 500, currentResource: 100, maxResource: 100, isLeader: true, isOnline: true, worldIndex: 1, channelId: 1 },
      ],
    },
  }));
  assert.ok(partyUpdateReceived);
  assert.equal(partyUpdateReceived.members.length, 1);
  assert.equal(partyUpdateReceived.leaderId, 'p1');

  network['handleIncomingRaw'](JSON.stringify({
    op: Opcode.S2C_PARTY_ACTION_RESULT,
    data: { action: 'INVITE', success: true, message: 'Convite enviado com sucesso.' },
  }));
  assert.ok(actionResultReceived);
  assert.equal(actionResultReceived.success, true);
});
