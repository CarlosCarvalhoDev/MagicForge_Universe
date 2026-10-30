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
  C2SExpandInventoryPayload,
  CharacterClass,
  NetworkMessage,
  Opcode,
  S2CCombatEventPayload,
  S2CInventoryUpdatePayload,
  S2CItemDropDespawnPayload,
  S2CItemDropSpawnPayload,
  C2SRequestCharacterListPayload,
  C2SCreateCharacterSlotPayload,
  C2SSelectCharacterSlotPayload,
  S2CCharacterListPayload,
  S2CCharacterActionErrorPayload,
  S2CLoginSuccessPayload,
  S2CPlayerExpUpdatePayload,
  S2CPlayerLevelUpPayload,
  S2CPongPayload,
  S2CPositionCorrectionPayload,
  S2CSkillCastEventPayload,
  S2CSkillCastRejectedPayload,
  CombatStatusTransitionPayload,
  S2CSkillsUpdatePayload,
  S2CWorldSnapshotPayload,
  S2CBossEventPayload,
  S2CStageUpdatePayload,
  S2CChatMessagePayload,
  C2SPerformRebornPayload,
  S2CRebornResultPayload,
  C2SRefineEquipmentPayload,
  S2CRefineResultPayload,
  C2SSocketGemPayload,
  S2CSocketResultPayload,
  C2SEquipCardPayload,
  S2CCardsUpdatePayload,
  C2SRequestCardAlbumPayload,
  C2SAuthLoginPayload,
  C2SAuthRegisterPayload,
  C2SAuthSocialPayload,
  C2SAuthClaimLegacyPayload,
  S2CAuthSuccessPayload,
  S2CAuthErrorPayload,
  SocialAuthProvider,
  FarmHelperSettingsPayload,
  C2SUpdateFarmSettingsPayload,
  S2CFarmSettingsUpdatePayload,
  C2SAutoSalvagePayload,
  S2CAutoSalvageResultPayload,
  S2CExpandInventoryResultPayload,
  C2SRequestLeaderboardPayload,
  S2CLeaderboardUpdatePayload,
  LeaderboardCategory,
  LeaderboardEntryPayload,
  C2SEnterDungeonPayload,
  S2CDungeonEventPayload,
  S2CBuyDungeonTicketResultPayload,
  DailyDungeonInfoPayload,
  DungeonType,
  Vector3,
} from '@magicforge/shared';

export type MessageListener<T> = (data: T) => void;

export class ClientNetwork {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private inputSequence: number = 0;
  private pingIntervalId: number | null = null;

  public isConnected: boolean = false;
  public myPlayerId: string | null = null;
  public currentLatencyMs: number = 0;
  public isAuthenticated: boolean = false;
  public currentAccountId: string | null = null;
  public currentAccountUsername: string | null = null;
  public farmSettings: FarmHelperSettingsPayload | null = null;

  // Listeners
  public onAuthSuccess: MessageListener<S2CAuthSuccessPayload> | null = null;
  public onAuthError: MessageListener<S2CAuthErrorPayload> | null = null;
  public onFarmSettingsUpdate: MessageListener<S2CFarmSettingsUpdatePayload> | null = null;
  public onAutoSalvageResult: MessageListener<S2CAutoSalvageResultPayload> | null = null;
  public onExpandInventoryResult: MessageListener<S2CExpandInventoryResultPayload> | null = null;
  public onLeaderboardUpdate: MessageListener<S2CLeaderboardUpdatePayload> | null = null;
  public onDungeonInfo: MessageListener<DailyDungeonInfoPayload> | null = null;
  public onDungeonEvent: MessageListener<S2CDungeonEventPayload> | null = null;
  public onBuyDungeonTicketResult: MessageListener<S2CBuyDungeonTicketResultPayload> | null = null;
  public onLoginSuccess: MessageListener<S2CLoginSuccessPayload> | null = null;
  public onCharacterList: MessageListener<S2CCharacterListPayload> | null = null;
  public onCharacterActionError: MessageListener<S2CCharacterActionErrorPayload> | null = null;
  public onSnapshot: MessageListener<S2CWorldSnapshotPayload> | null = null;
  public onCombatEvent: MessageListener<S2CCombatEventPayload> | null = null;
  public onSkillCastEvent: MessageListener<S2CSkillCastEventPayload> | null = null;
  public onSkillCastRejected: MessageListener<S2CSkillCastRejectedPayload> | null = null;
  public onCombatStatusEvent: MessageListener<CombatStatusTransitionPayload> | null = null;
  public onPositionCorrection: MessageListener<S2CPositionCorrectionPayload> | null = null;
  public onItemDropSpawn: MessageListener<S2CItemDropSpawnPayload> | null = null;
  public onItemDropDespawn: MessageListener<S2CItemDropDespawnPayload> | null = null;
  public onInventoryUpdate: MessageListener<S2CInventoryUpdatePayload> | null = null;
  public onPlayerExpUpdate: MessageListener<S2CPlayerExpUpdatePayload> | null = null;
  public onPlayerLevelUp: MessageListener<S2CPlayerLevelUpPayload> | null = null;
  public onBossEvent: MessageListener<S2CBossEventPayload> | null = null;
  public onStageUpdate: MessageListener<S2CStageUpdatePayload> | null = null;
  public onSkillsUpdate: MessageListener<S2CSkillsUpdatePayload> | null = null;
  public onRebornResult: MessageListener<S2CRebornResultPayload> | null = null;
  public onRefineResult: MessageListener<S2CRefineResultPayload> | null = null;
  public onSocketResult: MessageListener<S2CSocketResultPayload> | null = null;
  public onCardsUpdate: MessageListener<S2CCardsUpdatePayload> | null = null;
  public onChatMessage: MessageListener<S2CChatMessagePayload> | null = null;
  public onLatencyUpdated: ((pingMs: number) => void) | null = null;
  public onConnectionStateChange: ((connected: boolean) => void) | null = null;

  private reconnectTimeoutId: number | null = null;
  public autoReconnect: boolean = true;

  constructor(serverUrl?: string) {
    if (serverUrl) {
      this.serverUrl = serverUrl;
    } else if (import.meta.env?.VITE_SERVER_URL) {
      this.serverUrl = import.meta.env.VITE_SERVER_URL;
    } else if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.serverUrl = `${protocol}//${window.location.hostname}:3000`;
    } else {
      this.serverUrl = 'ws://192.168.1.12:3000';
    }
  }

  public connect(): void {
    this.autoReconnect = true;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.ws) {
      this.disconnect(false);
    }

    console.log(`[ClientNetwork] Connecting to ${this.serverUrl}...`);
    try {
      this.ws = new WebSocket(this.serverUrl);
    } catch (err) {
      console.error('[ClientNetwork] Erro ao instanciar WebSocket:', err);
      if (this.autoReconnect) this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[ClientNetwork] Connected to WebSocket server!');
      this.isConnected = true;
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }
      this.onConnectionStateChange?.(true);
      this.startPingHeartbeat();
    };

    this.ws.onclose = () => {
      console.warn('[ClientNetwork] Disconnected from WebSocket server.');
      this.isConnected = false;
      this.onConnectionStateChange?.(false);
      this.stopPingHeartbeat();
      if (this.autoReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('[ClientNetwork] WebSocket error:', err);
      if (this.autoReconnect && !this.isConnected) {
        this.scheduleReconnect();
      }
    };

    this.ws.onmessage = (event) => {
      this.handleIncomingRaw(event.data);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) return;
    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectTimeoutId = null;
      if (!this.isConnected && this.autoReconnect) {
        console.log('[ClientNetwork] Tentando reconectar automaticamente ao servidor...');
        this.connect();
      }
    }, 1200);
  }

  public disconnect(stopAuto = true): void {
    if (stopAuto) {
      this.autoReconnect = false;
    }
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.stopPingHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignora erro ao fechar
      }
      this.ws = null;
    }
    this.isConnected = false;
  }

  public send<T>(op: Opcode, data: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const msg: NetworkMessage<T> = {
      op,
      timestamp: Date.now(),
      seq: ++this.inputSequence,
      data,
    };

    this.ws.send(JSON.stringify(msg));
  }

  public login(characterName: string, classType: CharacterClass): void {
    const payload: C2SLoginPayload = {
      characterName,
      classType,
      clientVersion: '1.0.0',
    };
    this.send(Opcode.C2S_LOGIN, payload);
  }

  public sendAuthLogin(username: string, password?: string): void {
    const payload: C2SAuthLoginPayload = {
      username,
      password,
    };
    this.send(Opcode.C2S_AUTH_LOGIN, payload);
  }

  public sendAuthRegister(username: string, password?: string, email?: string): void {
    const payload: C2SAuthRegisterPayload = {
      username,
      password,
      email,
    };
    this.send(Opcode.C2S_AUTH_REGISTER, payload);
  }

  public sendAuthSocial(provider: SocialAuthProvider, token?: string, email?: string, displayName?: string): void {
    const payload: C2SAuthSocialPayload = {
      provider,
      token,
      email,
      displayName,
    };
    this.send(Opcode.C2S_AUTH_SOCIAL, payload);
  }

  public sendAuthClaimLegacy(
    username: string,
    verifyHeroName: string,
    verifyHeroClass: CharacterClass,
    newPassword: string,
    adminKey?: string
  ): void {
    const payload: C2SAuthClaimLegacyPayload = {
      username,
      verifyHeroName,
      verifyHeroClass,
      newPassword,
      adminKey,
    };
    this.send(Opcode.C2S_AUTH_CLAIM_LEGACY, payload);
  }

  public sendRequestCharacterList(accountUsername: string): void {
    const payload: C2SRequestCharacterListPayload = {
      accountUsername,
    };
    this.send(Opcode.C2S_REQUEST_CHARACTER_LIST, payload);
  }

  public sendCreateCharacterSlot(slotIndex: number, characterName: string, classType: CharacterClass): void {
    const payload: C2SCreateCharacterSlotPayload = {
      slotIndex,
      characterName,
      classType,
    };
    this.send(Opcode.C2S_CREATE_CHARACTER_SLOT, payload);
  }

  public sendSelectCharacterSlot(slotIndex: number): void {
    const payload: C2SSelectCharacterSlotPayload = {
      slotIndex,
    };
    this.send(Opcode.C2S_SELECT_CHARACTER_SLOT, payload);
  }

  public sendMoveInput(targetPosition: Vector3, currentClientPosition: Vector3): number {
    const seq = ++this.inputSequence;
    const payload: C2SMoveInputPayload = {
      targetPosition,
      currentClientPosition,
      inputSequence: seq,
    };
    this.send(Opcode.C2S_MOVE_INPUT, payload);
    return seq;
  }

  public sendMoveDirection(moveDirection: Vector3, currentClientPosition: Vector3): number {
    const seq = ++this.inputSequence;
    const payload: C2SMoveInputPayload = {
      moveDirection,
      currentClientPosition,
      inputSequence: seq,
    };
    this.send(Opcode.C2S_MOVE_INPUT, payload);
    return seq;
  }

  public sendAttackTarget(targetEntityId: string): void {
    const payload: C2SAttackTargetPayload = { targetEntityId };
    this.send(Opcode.C2S_ATTACK_TARGET, payload);
  }

  public sendCastSkill(slot: number, targetEntityId?: string, targetPosition?: Vector3): void {
    const payload: C2SCastSkillPayload = {
      slot,
      targetEntityId,
      targetPosition,
    };
    this.send(Opcode.C2S_CAST_SKILL, payload);
  }

  public sendEquipSkill(slot: number, skillId: string): void {
    const payload: C2SEquipSkillPayload = {
      slot,
      skillId,
    };
    this.send(Opcode.C2S_EQUIP_SKILL, payload);
  }

  public sendLootItem(dropId: string): void {
    const payload: C2SLootItemPayload = { dropId };
    this.send(Opcode.C2S_LOOT_ITEM, payload);
  }

  public sendUseItem(slotIndex: number): void {
    const payload: C2SUseItemPayload = { slotIndex };
    this.send(Opcode.C2S_USE_ITEM, payload);
  }

  public sendSellItem(slotIndex: number): void {
    const payload: C2SSellItemPayload = { slotIndex };
    this.send(Opcode.C2S_SELL_ITEM, payload);
  }

  public sendDiscardItem(slotIndex: number): void {
    const payload: C2SDiscardItemPayload = { slotIndex };
    this.send(Opcode.C2S_DISCARD_ITEM, payload);
  }

  public sendExpandInventory(): void {
    this.send(Opcode.C2S_EXPAND_INVENTORY, {});
  }

  public sendChallengeBoss(): void {
    this.send(Opcode.C2S_CHALLENGE_BOSS, {});
  }

  public sendEnterPortal(): void {
    this.send(Opcode.C2S_ENTER_PORTAL, {});
  }

  public sendPerformReborn(): void {
    this.send(Opcode.C2S_PERFORM_REBORN, {});
  }

  public sendRefineEquipment(slotIndex: number): void {
    const payload: C2SRefineEquipmentPayload = { slotIndex };
    this.send(Opcode.C2S_REFINE_EQUIPMENT, payload);
  }

  public sendSocketGem(equipmentSlotIndex: number, socketIndex: number, gemItemId: string): void {
    const payload: C2SSocketGemPayload = { equipmentSlotIndex, socketIndex, gemItemId };
    this.send(Opcode.C2S_SOCKET_GEM, payload);
  }

  public sendEquipCard(cardId: string, targetSlot: 'ARMA' | 'ARMADURA', isEquip: boolean): void {
    const payload: C2SEquipCardPayload = { cardId, targetSlot, isEquip };
    this.send(Opcode.C2S_EQUIP_CARD, payload);
  }

  public sendRequestCardAlbum(): void {
    this.send(Opcode.C2S_REQUEST_CARD_ALBUM, {});
  }

  public sendUpdateFarmSettings(settings: Partial<FarmHelperSettingsPayload>): void {
    const payload: C2SUpdateFarmSettingsPayload = { settings };
    this.send(Opcode.C2S_UPDATE_FARM_SETTINGS, payload);
  }

  public sendAutoSalvage(includeRare = false): void {
    const payload: C2SAutoSalvagePayload = { includeRare };
    this.send(Opcode.C2S_AUTO_SALVAGE, payload);
  }

  public sendRequestLeaderboard(category: LeaderboardCategory = 'COMBAT_POWER', limit = 20): void {
    const payload: C2SRequestLeaderboardPayload = { category, limit };
    this.send(Opcode.C2S_REQUEST_LEADERBOARD, payload);
  }

  public sendRequestDungeonInfo(): void {
    this.send(Opcode.C2S_REQUEST_DUNGEON_INFO, {});
  }

  public sendEnterDungeon(dungeonType: DungeonType = 'BOSS_RUSH'): void {
    const payload: C2SEnterDungeonPayload = { dungeonType };
    this.send(Opcode.C2S_ENTER_DUNGEON, payload);
  }

  public sendBuyDungeonTicket(): void {
    this.send(Opcode.C2S_BUY_DUNGEON_TICKET, {});
  }

  public sendLeaveDungeon(): void {
    this.send(Opcode.C2S_LEAVE_DUNGEON, {});
  }

  private startPingHeartbeat(): void {
    this.stopPingHeartbeat();
    this.pingIntervalId = window.setInterval(() => {
      if (this.isConnected) {
        const payload: C2SPingPayload = { clientSendTime: performance.now() };
        this.send(Opcode.C2S_PING, payload);
      }
    }, 2000);
  }

  private stopPingHeartbeat(): void {
    if (this.pingIntervalId !== null) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private handleIncomingRaw(rawData: string): void {
    try {
      const packet = JSON.parse(rawData) as NetworkMessage;
      switch (packet.op) {
        case Opcode.S2C_LOGIN_SUCCESS: {
          const data = packet.data as S2CLoginSuccessPayload;
          this.myPlayerId = data.playerId;
          this.onLoginSuccess?.(data);
          break;
        }

        case Opcode.S2C_WORLD_SNAPSHOT: {
          this.onSnapshot?.(packet.data as S2CWorldSnapshotPayload);
          break;
        }

        case Opcode.S2C_COMBAT_EVENT: {
          this.onCombatEvent?.(packet.data as S2CCombatEventPayload);
          break;
        }

        case Opcode.S2C_SKILL_CAST_EVENT: {
          this.onSkillCastEvent?.(packet.data as S2CSkillCastEventPayload);
          break;
        }

        case Opcode.S2C_SKILL_CAST_REJECTED: {
          this.onSkillCastRejected?.(packet.data as S2CSkillCastRejectedPayload);
          break;
        }

        case Opcode.S2C_COMBAT_STATUS_EVENT: {
          this.onCombatStatusEvent?.(packet.data as CombatStatusTransitionPayload);
          break;
        }

        case Opcode.S2C_POSITION_CORRECTION: {
          this.onPositionCorrection?.(packet.data as S2CPositionCorrectionPayload);
          break;
        }

        case Opcode.S2C_ITEM_DROP_SPAWN: {
          this.onItemDropSpawn?.(packet.data as S2CItemDropSpawnPayload);
          break;
        }

        case Opcode.S2C_ITEM_DROP_DESPAWN: {
          this.onItemDropDespawn?.(packet.data as S2CItemDropDespawnPayload);
          break;
        }

        case Opcode.S2C_INVENTORY_UPDATE: {
          this.onInventoryUpdate?.(packet.data as S2CInventoryUpdatePayload);
          break;
        }

        case Opcode.S2C_PLAYER_EXP_UPDATE: {
          this.onPlayerExpUpdate?.(packet.data as S2CPlayerExpUpdatePayload);
          break;
        }

        case Opcode.S2C_PLAYER_LEVEL_UP: {
          this.onPlayerLevelUp?.(packet.data as S2CPlayerLevelUpPayload);
          break;
        }

        case Opcode.S2C_BOSS_EVENT: {
          this.onBossEvent?.(packet.data as S2CBossEventPayload);
          break;
        }

        case Opcode.S2C_STAGE_UPDATE: {
          this.onStageUpdate?.(packet.data as S2CStageUpdatePayload);
          break;
        }

        case Opcode.S2C_SKILLS_UPDATE: {
          this.onSkillsUpdate?.(packet.data as S2CSkillsUpdatePayload);
          break;
        }

        case Opcode.S2C_REBORN_RESULT: {
          this.onRebornResult?.(packet.data as S2CRebornResultPayload);
          break;
        }

        case Opcode.S2C_REFINE_RESULT: {
          this.onRefineResult?.(packet.data as S2CRefineResultPayload);
          break;
        }

        case Opcode.S2C_SOCKET_RESULT: {
          this.onSocketResult?.(packet.data as S2CSocketResultPayload);
          break;
        }

        case Opcode.S2C_CARDS_UPDATE: {
          this.onCardsUpdate?.(packet.data as S2CCardsUpdatePayload);
          break;
        }

        case Opcode.S2C_CHARACTER_LIST: {
          this.onCharacterList?.(packet.data as S2CCharacterListPayload);
          break;
        }

        case Opcode.S2C_ERROR: {
          this.onCharacterActionError?.(packet.data as S2CCharacterActionErrorPayload);
          break;
        }

        case Opcode.S2C_CHAT_MESSAGE: {
          this.onChatMessage?.(packet.data as S2CChatMessagePayload);
          break;
        }

        case Opcode.S2C_AUTH_SUCCESS: {
          const authData = packet.data as S2CAuthSuccessPayload;
          this.isAuthenticated = true;
          this.currentAccountId = authData.accountId;
          this.currentAccountUsername = authData.accountUsername;
          this.onAuthSuccess?.(authData);
          break;
        }

        case Opcode.S2C_AUTH_ERROR: {
          this.onAuthError?.(packet.data as S2CAuthErrorPayload);
          break;
        }

        case Opcode.S2C_FARM_SETTINGS_UPDATE: {
          const farmData = packet.data as S2CFarmSettingsUpdatePayload;
          this.farmSettings = farmData.settings;
          this.onFarmSettingsUpdate?.(farmData);
          break;
        }

        case Opcode.S2C_AUTO_SALVAGE_RESULT: {
          this.onAutoSalvageResult?.(packet.data as S2CAutoSalvageResultPayload);
          break;
        }

        case Opcode.S2C_EXPAND_INVENTORY_RESULT: {
          this.onExpandInventoryResult?.(packet.data as S2CExpandInventoryResultPayload);
          break;
        }

        case Opcode.S2C_LEADERBOARD_UPDATE: {
          this.onLeaderboardUpdate?.(packet.data as S2CLeaderboardUpdatePayload);
          break;
        }

        case Opcode.S2C_DUNGEON_INFO: {
          this.onDungeonInfo?.(packet.data as DailyDungeonInfoPayload);
          break;
        }

        case Opcode.S2C_DUNGEON_EVENT: {
          this.onDungeonEvent?.(packet.data as S2CDungeonEventPayload);
          break;
        }

        case Opcode.S2C_BUY_DUNGEON_TICKET_RESULT: {
          this.onBuyDungeonTicketResult?.(packet.data as S2CBuyDungeonTicketResultPayload);
          break;
        }

        case Opcode.S2C_PONG: {
          const pong = packet.data as S2CPongPayload;
          const rtt = performance.now() - pong.clientSendTime;
          this.currentLatencyMs = Math.round(rtt);
          this.onLatencyUpdated?.(this.currentLatencyMs);
          break;
        }
      }
    } catch (err) {
      console.error('[ClientNetwork] Error parsing incoming packet:', err);
    }
  }
}
