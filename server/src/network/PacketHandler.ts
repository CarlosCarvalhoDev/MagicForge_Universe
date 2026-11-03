import {
  C2SAttackTargetPayload,
  C2SCastSkillPayload,
  C2SEquipSkillPayload,
  C2SLoginPayload,
  C2SLootItemPayload,
  C2SMoveInputPayload,
  C2SPingPayload,
  C2SUseItemPayload,
  C2SSellItemPayload,
  C2SDiscardItemPayload,
  C2SRequestCharacterListPayload,
  C2SCreateCharacterSlotPayload,
  C2SSelectCharacterSlotPayload,
  C2SRefineEquipmentPayload,
  C2SSocketGemPayload,
  C2SEquipCardPayload,
  C2SAuthLoginPayload,
  C2SAuthRegisterPayload,
  C2SAuthSocialPayload,
  C2SAuthClaimLegacyPayload,
  C2SUpdateFarmSettingsPayload,
  C2SAutoSalvagePayload,
  C2SRequestLeaderboardPayload,
  C2SEnterDungeonPayload,
  C2SRequestChannelListPayload,
  C2SChangeChannelPayload,
  S2CChannelListPayload,
  S2CChangeChannelResultPayload,
  C2SPartyInvitePayload,
  C2SPartyInviteResponsePayload,
  C2SPartyKickPayload,
  C2SPartyPromoteLeaderPayload,
  C2SPartyLeavePayload,
  C2SPartyDisbandPayload,
  C2SClaimOfflineRewardsPayload,
  NetworkMessage,
  Opcode,
  S2CLoginSuccessPayload,
  S2CPongPayload,
  S2CPositionCorrectionPayload,
  distance,
} from '@magicforge/shared';
import { Connection } from './Connection';
import { World } from '../game/World';
import { WorldManager } from '../game/WorldManager';
import { SERVER_CONFIG } from '../config';

export class PacketHandler {
  private worldManager: WorldManager | World;

  constructor(worldOrManager: WorldManager | World) {
    this.worldManager = worldOrManager;
  }

  public getActiveWorld(connection: Connection): World {
    if (connection.currentWorldInstance) {
      return connection.currentWorldInstance as World;
    }
    if (this.worldManager instanceof World) {
      return this.worldManager;
    }
    return this.worldManager.getOrCreateChannel(connection.currentWorldIndex || 1, connection.currentChannelId || 1);
  }

  public handlePacket(connection: Connection, rawData: string): void {
    let message: NetworkMessage;
    try {
      message = JSON.parse(rawData) as NetworkMessage;
    } catch {
      console.warn(`[PacketHandler] Invalid JSON received from connection ${connection.id}`);
      return;
    }

    if (!message || typeof message.op !== 'number') {
      return;
    }

    switch (message.op) {
      // --- Autenticação de Contas & Multi-Provider ---
      case Opcode.C2S_AUTH_LOGIN:
        this.worldManager.handleAuthLogin(connection, message.data as C2SAuthLoginPayload);
        break;

      case Opcode.C2S_AUTH_REGISTER:
        this.worldManager.handleAuthRegister(connection, message.data as C2SAuthRegisterPayload);
        break;

      case Opcode.C2S_AUTH_SOCIAL:
        this.worldManager.handleAuthSocial(connection, message.data as C2SAuthSocialPayload);
        break;

      case Opcode.C2S_AUTH_CLAIM_LEGACY:
        this.worldManager.handleAuthClaimLegacy(connection, message.data as C2SAuthClaimLegacyPayload);
        break;

      case Opcode.C2S_LOGIN:
        this.handleLogin(connection, message.data as C2SLoginPayload);
        break;

      case Opcode.C2S_REQUEST_CHARACTER_LIST:
        this.handleRequestCharacterList(connection, message.data as C2SRequestCharacterListPayload);
        break;

      case Opcode.C2S_CREATE_CHARACTER_SLOT:
        this.handleCreateCharacterSlot(connection, message.data as C2SCreateCharacterSlotPayload);
        break;

      case Opcode.C2S_SELECT_CHARACTER_SLOT:
        this.handleSelectCharacterSlot(connection, message.data as C2SSelectCharacterSlotPayload);
        break;

      // --- Channels, Worlds & Instances ---
      case Opcode.C2S_REQUEST_CHANNEL_LIST:
        this.handleRequestChannelList(connection, message.data as C2SRequestChannelListPayload);
        break;

      case Opcode.C2S_CHANGE_CHANNEL:
        this.handleChangeChannel(connection, message.data as C2SChangeChannelPayload);
        break;

      // --- Party & Social Systems ---
      case Opcode.C2S_PARTY_INVITE:
        this.handlePartyInvite(connection, message.data as C2SPartyInvitePayload);
        break;

      case Opcode.C2S_PARTY_INVITE_RESPONSE:
        this.handlePartyInviteResponse(connection, message.data as C2SPartyInviteResponsePayload);
        break;

      case Opcode.C2S_PARTY_LEAVE:
        this.handlePartyLeave(connection);
        break;

      case Opcode.C2S_PARTY_KICK:
        this.handlePartyKick(connection, message.data as C2SPartyKickPayload);
        break;

      case Opcode.C2S_PARTY_PROMOTE_LEADER:
        this.handlePartyPromoteLeader(connection, message.data as C2SPartyPromoteLeaderPayload);
        break;

      case Opcode.C2S_PARTY_DISBAND:
        this.handlePartyDisband(connection);
        break;

      case Opcode.C2S_MOVE_INPUT:
        this.handleMoveInput(connection, message.data as C2SMoveInputPayload);
        break;

      case Opcode.C2S_ATTACK_TARGET:
        this.handleAttackTarget(connection, message.data as C2SAttackTargetPayload);
        break;

      case Opcode.C2S_CAST_SKILL:
        this.handleCastSkill(connection, message.data as C2SCastSkillPayload);
        break;

      case Opcode.C2S_EQUIP_SKILL:
        this.handleEquipSkill(connection, message.data as C2SEquipSkillPayload);
        break;

      case Opcode.C2S_LOOT_ITEM:
        this.handleLootItem(connection, message.data as C2SLootItemPayload);
        break;

      case Opcode.C2S_USE_ITEM:
        this.handleUseItem(connection, message.data as C2SUseItemPayload);
        break;

      case Opcode.C2S_SELL_ITEM:
        this.handleSellItem(connection, message.data as C2SSellItemPayload);
        break;

      case Opcode.C2S_DISCARD_ITEM:
        this.handleDiscardItem(connection, message.data as C2SDiscardItemPayload);
        break;

      case Opcode.C2S_CHALLENGE_BOSS:
        this.handleChallengeBoss(connection);
        break;

      case Opcode.C2S_ENTER_PORTAL:
        this.handleEnterPortal(connection);
        break;

      case Opcode.C2S_EXPAND_INVENTORY:
        this.handleExpandInventory(connection);
        break;

      case Opcode.C2S_PERFORM_REBORN:
        this.handlePerformReborn(connection);
        break;

      case Opcode.C2S_REFINE_EQUIPMENT:
        this.handleRefineEquipment(connection, message.data as C2SRefineEquipmentPayload);
        break;

      case Opcode.C2S_SOCKET_GEM:
        this.handleSocketGem(connection, message.data as C2SSocketGemPayload);
        break;

      case Opcode.C2S_EQUIP_CARD:
        this.handleEquipCard(connection, message.data as C2SEquipCardPayload);
        break;

      case Opcode.C2S_REQUEST_CARD_ALBUM:
        this.handleRequestCardAlbum(connection);
        break;

      // --- Idle Farm Helper & Bag Automation ---
      case Opcode.C2S_UPDATE_FARM_SETTINGS:
        this.getActiveWorld(connection).handleUpdateFarmSettings(connection, message.data as C2SUpdateFarmSettingsPayload);
        break;

      case Opcode.C2S_AUTO_SALVAGE:
        this.getActiveWorld(connection).handleAutoSalvage(connection, message.data as C2SAutoSalvagePayload);
        break;

      // --- Rankings & Leaderboards ---
      case Opcode.C2S_REQUEST_LEADERBOARD:
        this.getActiveWorld(connection).handleRequestLeaderboard(connection, message.data as C2SRequestLeaderboardPayload);
        break;

      // --- Daily Dungeons & Boss Rush ---
      case Opcode.C2S_REQUEST_DUNGEON_INFO:
        this.handleRequestDungeonInfo(connection);
        break;

      case Opcode.C2S_ENTER_DUNGEON:
        this.handleEnterDungeon(connection, message.data as C2SEnterDungeonPayload);
        break;

      case Opcode.C2S_BUY_DUNGEON_TICKET:
        this.handleBuyDungeonTicket(connection);
        break;

      case Opcode.C2S_LEAVE_DUNGEON:
        this.handleLeaveDungeon(connection);
        break;

      // --- Offline Progress & AFK Rewards (Baú do Tempo) ---
      case Opcode.C2S_CLAIM_OFFLINE_REWARDS:
        this.handleClaimOfflineRewards(connection, message.data as C2SClaimOfflineRewardsPayload);
        break;

      case Opcode.C2S_PING:
        this.handlePing(connection, message.data as C2SPingPayload);
        break;

      default:
        console.warn(`[PacketHandler] Unhandled opcode: 0x${message.op.toString(16)}`);
        break;
    }
  }

  private handleLogin(connection: Connection, payload: C2SLoginPayload): void {
    if (!payload || !payload.characterName) {
      connection.close(1008, 'Invalid login credentials');
      return;
    }

    if (this.worldManager instanceof WorldManager) {
      const account = this.worldManager.db.getOrCreateAccount(payload.characterName);
      connection.accountId = account.id;
      connection.accountUsername = account.username;
      const player = this.worldManager.db.loadOrCreatePlayer(connection.id, account.id, payload.characterName, payload.classType);
      this.worldManager.assignPlayerToChannel(connection, player);
    } else {
      this.worldManager.createPlayer(connection, payload.characterName, payload.classType);
    }
  }

  private handleRequestCharacterList(connection: Connection, payload: C2SRequestCharacterListPayload): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handleRequestCharacterList(connection);
    } else {
      const username = payload?.accountUsername || 'Aventureiro';
      this.worldManager.handleRequestCharacterList(connection, username);
    }
  }

  private handleCreateCharacterSlot(connection: Connection, payload: C2SCreateCharacterSlotPayload): void {
    if (!payload || typeof payload.slotIndex !== 'number' || !payload.characterName || !payload.classType) return;
    this.worldManager.handleCreateCharacterSlot(connection, payload.slotIndex, payload.characterName, payload.classType);
  }

  private handleSelectCharacterSlot(connection: Connection, payload: C2SSelectCharacterSlotPayload): void {
    if (!payload || typeof payload.slotIndex !== 'number') return;
    this.worldManager.handleSelectCharacterSlot(connection, payload.slotIndex);
  }

  private handleRequestChannelList(connection: Connection, payload?: C2SRequestChannelListPayload): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handleRequestChannelList(connection, payload);
    } else {
      connection.send(Opcode.S2C_CHANNEL_LIST, {
        worldIndex: this.worldManager.currentWorld,
        worldName: this.worldManager.getWorldName(this.worldManager.currentWorld),
        currentChannelId: this.worldManager.channelId,
        channels: [
          {
            channelId: this.worldManager.channelId,
            worldIndex: this.worldManager.currentWorld,
            worldName: this.worldManager.getWorldName(this.worldManager.currentWorld),
            activePlayers: this.worldManager.entityManager.getAllPlayers().length,
            maxPlayers: this.worldManager.maxPlayers,
            loadStatus: 'LIVRE',
            isCurrentChannel: true,
          },
        ],
      } as S2CChannelListPayload);
    }
  }

  private handleChangeChannel(connection: Connection, payload: C2SChangeChannelPayload): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handleChangeChannel(connection, payload);
    } else {
      connection.send(Opcode.S2C_CHANGE_CHANNEL_RESULT, {
        success: false,
        reason: 'SINGLE_WORLD_MODE',
        message: 'Servidor operando em modo de instância única.',
      } as S2CChangeChannelResultPayload);
    }
  }

  private handlePartyInvite(connection: Connection, payload: C2SPartyInvitePayload): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handlePartyInvite(connection, payload);
    }
  }

  private handlePartyInviteResponse(connection: Connection, payload: C2SPartyInviteResponsePayload): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handlePartyInviteResponse(connection, payload);
    }
  }

  private handlePartyLeave(connection: Connection): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handlePartyLeave(connection);
    }
  }

  private handlePartyKick(connection: Connection, payload: C2SPartyKickPayload): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handlePartyKick(connection, payload);
    }
  }

  private handlePartyPromoteLeader(connection: Connection, payload: C2SPartyPromoteLeaderPayload): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handlePartyPromoteLeader(connection, payload);
    }
  }

  private handlePartyDisband(connection: Connection): void {
    if (this.worldManager instanceof WorldManager) {
      this.worldManager.handlePartyDisband(connection);
    }
  }

  private handleMoveInput(connection: Connection, payload: C2SMoveInputPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) {
      return;
    }

    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) {
      return;
    }

    if (payload.currentClientPosition) {
      const clientServerDrift = distance(player.position, payload.currentClientPosition);
      const maxAllowedDrift = 5.0;
      if (clientServerDrift > maxAllowedDrift) {
        connection.send(Opcode.S2C_POSITION_CORRECTION, {
          lastProcessedInputSeq: payload.inputSequence,
          authoritativePosition: player.position,
          reason: 'DESYNC',
        } as S2CPositionCorrectionPayload);
      }
    }

    if (payload.moveDirection) {
      player.setMoveDirection(payload.moveDirection, payload.inputSequence);
      return;
    }

    if (payload.targetPosition) {
      player.setMoveDestination(payload.targetPosition, payload.inputSequence);
    }
  }

  private handleAttackTarget(connection: Connection, payload: C2SAttackTargetPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) return;

    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;

    player.targetId = payload.targetEntityId || null;
  }

  private handleCastSkill(connection: Connection, payload: C2SCastSkillPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || typeof payload.slot !== 'number') return;

    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;

    world.castPlayerSkill(player, payload.slot, payload.targetEntityId, payload.targetPosition);
  }

  private handleEquipSkill(connection: Connection, payload: C2SEquipSkillPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || typeof payload.slot !== 'number' || !payload.skillId) return;

    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;

    world.equipPlayerSkill(player, payload.slot, payload.skillId);
  }

  private handlePing(connection: Connection, payload: C2SPingPayload): void {
    const now = Date.now();
    connection.lastPingTime = now;
    if (payload && payload.clientSendTime) {
      connection.latencyMs = Math.max(0, (now - payload.clientSendTime) / 2);
    }

    const pongPayload: S2CPongPayload = {
      clientSendTime: payload ? payload.clientSendTime : 0,
      serverReceiveTime: now,
    };

    connection.send(Opcode.S2C_PONG, pongPayload);
  }

  private handleLootItem(connection: Connection, payload: C2SLootItemPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || !payload.dropId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.lootItem(player, payload.dropId);
  }

  private handleUseItem(connection: Connection, payload: C2SUseItemPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || typeof payload.slotIndex !== 'number') return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.usePlayerItem(player, payload.slotIndex);
  }

  private handleSellItem(connection: Connection, payload: C2SSellItemPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || typeof payload.slotIndex !== 'number') return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.sellPlayerItem(player, payload.slotIndex);
  }

  private handleChallengeBoss(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.challengeStageBoss(player);
  }

  private handleEnterPortal(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.enterPortal(player);
  }

  private handleExpandInventory(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.expandPlayerInventory(player);
  }

  private handleDiscardItem(connection: Connection, payload: C2SDiscardItemPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || typeof payload.slotIndex !== 'number') return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.discardOrRecyclePlayerItem(player, payload.slotIndex);
  }

  private handlePerformReborn(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.performPlayerReborn(player);
  }

  private handleRefineEquipment(connection: Connection, payload: C2SRefineEquipmentPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || typeof payload.slotIndex !== 'number') return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.refinePlayerEquipment(player, payload.slotIndex);
  }

  private handleSocketGem(connection: Connection, payload: C2SSocketGemPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || typeof payload.equipmentSlotIndex !== 'number' || typeof payload.socketIndex !== 'number' || !payload.gemItemId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.socketPlayerGem(player, payload.equipmentSlotIndex, payload.socketIndex, payload.gemItemId);
  }

  private handleEquipCard(connection: Connection, payload: C2SEquipCardPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || !payload.cardId || !payload.targetSlot) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.equipPlayerCard(player, payload.cardId, payload.targetSlot, payload.isEquip);
  }

  private handleRequestCardAlbum(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.sendPlayerCardAlbum(player);
  }

  private handleRequestDungeonInfo(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player) return;
    world.handleRequestDungeonInfo(player);
  }

  private handleEnterDungeon(connection: Connection, payload: C2SEnterDungeonPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.handleEnterDungeon(player, payload);
  }

  private handleBuyDungeonTicket(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;
    world.handleBuyDungeonTicket(player);
  }

  private handleLeaveDungeon(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player) return;
    world.handleLeaveDungeon(player);
  }

  private handleClaimOfflineRewards(connection: Connection, payload?: C2SClaimOfflineRewardsPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const world = this.getActiveWorld(connection);
    const player = world.entityManager.getPlayer(connection.playerId);
    if (!player) return;
    world.claimOfflineRewards(player, payload?.multiplier);
  }
}

