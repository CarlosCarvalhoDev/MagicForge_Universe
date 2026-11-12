import {
  CharacterClass,
  createVector3,
  Opcode,
  ChannelSummaryPayload,
  ChannelLoadStatus,
  C2SRequestChannelListPayload,
  S2CChannelListPayload,
  C2SChangeChannelPayload,
  S2CChangeChannelResultPayload,
  C2SAuthLoginPayload,
  C2SAuthRegisterPayload,
  C2SAuthSocialPayload,
  C2SAuthClaimLegacyPayload,
  S2CAuthSuccessPayload,
  S2CAuthErrorPayload,
  S2CCharacterListPayload,
  S2CCharacterActionErrorPayload,
  C2SPartyInvitePayload,
  C2SPartyInviteResponsePayload,
  C2SPartyKickPayload,
  C2SPartyPromoteLeaderPayload,
} from '@magicforge/shared';
import { World } from './World';
import { DatabaseManager } from '../database/DatabaseManager';
import { Connection } from '../network/Connection';
import { Player } from '../entities/Player';
import { SocialAuthService } from '../auth/SocialAuthService';
import { PartyManager } from './PartyManager';

export class WorldManager {
  public readonly db: DatabaseManager;
  public readonly partyManager: PartyManager;
  private readonly devSpawn = { paused: false };
  private channels = new Map<string, World>();
  private connections = new Map<string, Connection>();

  constructor(customDb?: DatabaseManager) {
    this.db = customDb || new DatabaseManager();
    this.partyManager = new PartyManager(() => this.connections.values());

    // Inicializa canais padrão para os Mundos 1 (Floresta) e 2 (Jotunheim)
    this.getOrCreateChannel(1, 1);
    this.getOrCreateChannel(1, 2);
    this.getOrCreateChannel(2, 1);
    this.getOrCreateChannel(2, 2);
  }

  public getChannelKey(worldIndex: number, channelId: number): string {
    return `${worldIndex}_${channelId}`;
  }

  /**
   * Obtém um canal existente ou inicializa uma nova instância de mundo/canal
   */
  public getOrCreateChannel(worldIndex: number, channelId: number): World {
    const key = this.getChannelKey(worldIndex, channelId);
    let world = this.channels.get(key);
    if (!world) {
      world = new World(this.db, worldIndex, channelId, undefined, this.devSpawn);
      world.partyManager = this.partyManager;
      world.automaticPortalHandler = player => this.advancePlayerAutomatically(player, world!);
      this.channels.set(key, world);
      console.log(`[WorldManager] Novo canal instanciado: Mundo ${worldIndex} (${world.getWorldName(worldIndex)}) - Canal ${channelId} (ID: ${world.instanceId})`);
    } else if (!world.partyManager) {
      world.partyManager = this.partyManager;
    }
    return world;
  }

  /**
   * Retorna todas as instâncias de canais ativas no servidor
   */
  public getAllChannels(): World[] {
    return Array.from(this.channels.values());
  }

  public advancePlayerAutomatically(player: Player, source: World): boolean {
    const connection = this.connections.get(player.id);
    if (!connection || connection.currentWorldInstance !== source || player.isDead ||
      player.unlockedWorld <= player.currentWorld || source.dungeonManager.isPlayerInDungeon(player.id)) return false;
    const nextWorld = player.currentWorld + 1;
    const preferredChannel = source.channelId;
    this.getOrCreateChannel(nextWorld, preferredChannel);
    source.removePlayerFromWorld(connection, false);
    player.currentWorld = nextWorld;
    player.currentStage = 1;
    player.position = createVector3(0, 0, -10);
    player.stopMoving();
    player.targetId = null;
    this.db.savePlayer(player);
    this.assignPlayerToChannel(connection, player, preferredChannel);
    const party = this.partyManager.getPlayerParty(player.id);
    if (party) this.partyManager.broadcastPartyUpdate(party, 'Avanço automático de mundo.');
    return true;
  }

  /**
   * Retorna os canais disponíveis para um mundo específico com status de lotação
   */
  public getAvailableChannels(worldIndex: number, currentChannelId: number = 1): ChannelSummaryPayload[] {
    // Garante que existam pelo menos os canais 1 e 2 instanciados
    this.getOrCreateChannel(worldIndex, 1);
    this.getOrCreateChannel(worldIndex, 2);

    const result: ChannelSummaryPayload[] = [];
    for (const world of this.channels.values()) {
      if (world.currentWorld !== worldIndex) continue;

      const activePlayers = world.getOccupancy();
      const maxPlayers = world.maxPlayers || 30;
      const ratio = activePlayers / maxPlayers;

      let loadStatus: ChannelLoadStatus = 'LIVRE';
      if (ratio >= 1.0) {
        loadStatus = 'LOTADO';
      } else if (ratio >= 0.5) {
        loadStatus = 'POVOADO';
      }

      result.push({
        channelId: world.channelId,
        worldIndex: world.currentWorld,
        worldName: world.getWorldName(world.currentWorld),
        activePlayers,
        maxPlayers,
        loadStatus,
        isCurrentChannel: world.channelId === currentChannelId,
      });
    }

    result.sort((a, b) => a.channelId - b.channelId);
    return result;
  }

  /**
   * Aloca o jogador no melhor canal disponível (balanceamento de carga) ou canal preferido
   */
  public assignPlayerToChannel(connection: Connection, player: Player, preferredChannelId?: number): World {
    const worldIndex = player.currentWorld || 1;

    // Se preferência informada e canal tem vaga
    if (preferredChannelId !== undefined && preferredChannelId > 0) {
      const preferredWorld = this.getOrCreateChannel(worldIndex, preferredChannelId);
      if (preferredWorld.getOccupancy() < preferredWorld.maxPlayers) {
        preferredWorld.enterWorld(connection, player);
        return preferredWorld;
      }
    }

    // Balanceador automático: escolhe o canal do mesmo mundo com menor população
    const worldChannels = Array.from(this.channels.values()).filter((w) => w.currentWorld === worldIndex);
    worldChannels.sort((a, b) => a.getOccupancy() - b.getOccupancy());

    let chosenWorld = worldChannels[0] ?? this.getOrCreateChannel(worldIndex, 1);
    // Se o canal mais vazio estiver cheio, cria dinamicamente o próximo canal
    if (chosenWorld.getOccupancy() >= chosenWorld.maxPlayers) {
      const nextChannelId = worldChannels.length + 1;
      chosenWorld = this.getOrCreateChannel(worldIndex, nextChannelId);
    }

    chosenWorld.enterWorld(connection, player);
    return chosenWorld;
  }

  /**
   * Troca atômica de canal solicitada pelo jogador
   */
  public changePlayerChannel(
    connection: Connection,
    targetChannelId: number
  ): { success: boolean; reason?: string; message: string } {
    if (!connection.isAuthenticated || !connection.playerId) {
      return { success: false, reason: 'UNAUTHENTICATED', message: 'Você precisa estar logado.' };
    }

    const currentWorld = connection.currentWorldInstance as World | null;
    if (!currentWorld) {
      return { success: false, reason: 'NO_ACTIVE_WORLD', message: 'Nenhuma instância de mundo ativa encontrada.' };
    }

    if (currentWorld.channelId === targetChannelId) {
      return { success: false, reason: 'ALREADY_IN_CHANNEL', message: `Você já está no Canal ${targetChannelId}.` };
    }

    const targetWorld = this.getOrCreateChannel(currentWorld.currentWorld, targetChannelId);
    const activeInTarget = targetWorld.getOccupancy();
    if (activeInTarget >= targetWorld.maxPlayers) {
      return {
        success: false,
        reason: 'CHANNEL_FULL',
        message: `O Canal ${targetChannelId} está lotado (${activeInTarget}/${targetWorld.maxPlayers}).`,
      };
    }

    // Remove do canal atual salvando os dados
    const player = currentWorld.removePlayerFromWorld(connection, true);
    if (!player) {
      return { success: false, reason: 'PLAYER_NOT_FOUND', message: 'Erro ao transferir dados do personagem.' };
    }

    // Insere no canal destino
    targetWorld.enterWorld(connection, player);

    // Envia confirmação de sucesso
    connection.send(Opcode.S2C_CHANGE_CHANNEL_RESULT, {
      success: true,
      channelId: targetWorld.channelId,
      worldIndex: targetWorld.currentWorld,
      worldName: targetWorld.getWorldName(targetWorld.currentWorld),
      message: `Você mudou para o Canal ${targetWorld.channelId} de ${targetWorld.getWorldName(targetWorld.currentWorld)}!`,
    } as S2CChangeChannelResultPayload);

    console.log(`[WorldManager] Player "${player.name}" transferido do Canal ${currentWorld.channelId} para o Canal ${targetWorld.channelId} (Mundo ${targetWorld.currentWorld}).`);
    return {
      success: true,
      message: `Transferido para o Canal ${targetWorld.channelId} com sucesso.`,
    };
  }

  // --- Gerenciamento Global de Conexões e Autenticação ---

  public registerConnection(connection: Connection): void {
    this.connections.set(connection.id, connection);
  }

  public unregisterConnection(connection: Connection): void {
    this.connections.delete(connection.id);
    if (connection.playerId) {
      this.partyManager.handlePlayerDisconnect(connection.playerId);
    }
    if (connection.currentWorldInstance) {
      (connection.currentWorldInstance as World).removePlayerFromWorld(connection, true, true);
      connection.currentWorldInstance = null;
    }
  }

  public handleAuthLogin(connection: Connection, payload: C2SAuthLoginPayload): void {
    if (!payload || !payload.username) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'INVALID_CREDENTIALS',
        errorMessage: 'Nome de usuário não informado.',
      } as S2CAuthErrorPayload);
      return;
    }

    const result = this.db.authenticateAccount(payload.username, payload.password);
    if (!result.success || !result.account) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: (result.error as any) || 'INVALID_CREDENTIALS',
        errorMessage: result.message || 'Falha na autenticação.',
      } as S2CAuthErrorPayload);
      return;
    }

    connection.isAuthenticated = true;
    connection.accountId = result.account.id;
    connection.accountUsername = result.account.username;

    connection.send(Opcode.S2C_AUTH_SUCCESS, {
      accountId: result.account.id,
      accountUsername: result.account.username,
      provider: result.account.auth_provider || 'LOCAL',
      isActivated: Boolean(result.account.is_activated),
      message: 'Autenticado com sucesso!',
    } as S2CAuthSuccessPayload);

    console.log(`[WorldManager] Conta autenticada: "${result.account.username}" (ID: ${result.account.id})`);
  }

  public handleAuthRegister(connection: Connection, payload: C2SAuthRegisterPayload): void {
    if (!payload || !payload.username) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'INVALID_CREDENTIALS',
        errorMessage: 'Nome de usuário não informado.',
      } as S2CAuthErrorPayload);
      return;
    }

    const cleanEmail = (payload.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'INVALID_EMAIL',
        errorMessage: 'Informe um email válido para criar sua conta.',
      } as S2CAuthErrorPayload);
      return;
    }

    const result = this.db.registerAccount(payload.username, payload.password, cleanEmail);
    if (!result.success || !result.account) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: (result.error as any) || 'INVALID_CREDENTIALS',
        errorMessage: result.message || 'Falha ao registrar conta.',
      } as S2CAuthErrorPayload);
      return;
    }

    connection.isAuthenticated = true;
    connection.accountId = result.account.id;
    connection.accountUsername = result.account.username;

    connection.send(Opcode.S2C_AUTH_SUCCESS, {
      accountId: result.account.id,
      accountUsername: result.account.username,
      provider: 'LOCAL',
      isActivated: true,
      message: 'Conta registrada e autenticada com sucesso!',
    } as S2CAuthSuccessPayload);

    console.log(`[WorldManager] Nova conta registrada e conectada: "${result.account.username}" (ID: ${result.account.id})`);
  }

  public async handleAuthSocial(connection: Connection, payload: C2SAuthSocialPayload): Promise<void> {
    if (!payload || !payload.provider) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'SOCIAL_AUTH_FAILED',
        errorMessage: 'Provedor social não informado.',
      } as S2CAuthErrorPayload);
      return;
    }

    const verification = await SocialAuthService.verifyToken(payload.provider, payload.token);
    if (!verification.success || !verification.profile) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'SOCIAL_AUTH_FAILED',
        errorMessage: verification.error || 'Falha na validação do login social.',
      } as S2CAuthErrorPayload);
      return;
    }

    const result = this.db.authenticateVerifiedProfile(verification.profile);
    if (!result.success || !result.account) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'SOCIAL_AUTH_FAILED',
        errorMessage: result.message || 'Erro ao associar conta social.',
      } as S2CAuthErrorPayload);
      return;
    }

    connection.isAuthenticated = true;
    connection.accountId = result.account.id;
    connection.accountUsername = result.account.username;

    connection.send(Opcode.S2C_AUTH_SUCCESS, {
      accountId: result.account.id,
      accountUsername: result.account.username,
      provider: verification.profile.provider,
      isActivated: true,
      message: `Autenticado via ${verification.profile.provider} com sucesso!`,
    } as S2CAuthSuccessPayload);

    console.log(`[WorldManager] Conta social autenticada (${verification.profile.provider}): "${result.account.username}" (ID: ${result.account.id})`);
  }

  public handleAuthClaimLegacy(connection: Connection, payload: C2SAuthClaimLegacyPayload): void {
    if (!payload || !payload.username || !payload.verifyHeroName || !payload.verifyHeroClass || !payload.newPassword) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'LEGACY_CLAIM_FAILED',
        errorMessage: 'Dados incompletos para comprovação de posse da conta.',
      } as S2CAuthErrorPayload);
      return;
    }

    const result = this.db.claimLegacyAccount(
      payload.username,
      payload.verifyHeroName,
      payload.verifyHeroClass,
      payload.newPassword,
      payload.adminKey
    );

    if (!result.success || !result.account) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: (result.error as any) || 'LEGACY_CLAIM_FAILED',
        errorMessage: result.message || 'Falha ao comprovar posse da conta legada.',
      } as S2CAuthErrorPayload);
      return;
    }

    connection.isAuthenticated = true;
    connection.accountId = result.account.id;
    connection.accountUsername = result.account.username;

    connection.send(Opcode.S2C_AUTH_SUCCESS, {
      accountId: result.account.id,
      accountUsername: result.account.username,
      provider: 'LOCAL',
      isActivated: true,
      message: 'Conta legada ativada com sucesso e protegida com nova senha!',
    } as S2CAuthSuccessPayload);

    console.log(`[WorldManager] Conta legada ativada com sucesso: "${result.account.username}" (ID: ${result.account.id})`);
  }

  public handleRequestCharacterList(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.accountId) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'UNAUTHENTICATED',
        errorMessage: 'É necessário autenticar a conta antes de listar os heróis.',
      } as S2CAuthErrorPayload);
      return;
    }

    const summaries = this.db.getCharacterSlotsSummary(connection.accountId);
    connection.send(Opcode.S2C_CHARACTER_LIST, {
      accountId: connection.accountId,
      accountUsername: connection.accountUsername || 'Aventureiro',
      slots: summaries,
    } as S2CCharacterListPayload);

    console.log(`[WorldManager] Lista dos 3 slots enviada para "${connection.accountUsername}" (Account ID: ${connection.accountId})`);
  }

  public handleCreateCharacterSlot(
    connection: Connection,
    slotIndex: number,
    characterName: string,
    classType: CharacterClass
  ): void {
    if (!connection.isAuthenticated || !connection.accountId) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'UNAUTHENTICATED',
        errorMessage: 'É necessário autenticar a conta antes de criar um herói.',
      } as S2CCharacterActionErrorPayload);
      return;
    }

    if (slotIndex < 0 || slotIndex > 2) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'INVALID_SLOT',
        errorMessage: 'Índice de slot inválido. Escolha um slot entre 0 e 2.',
        slotIndex,
      } as S2CCharacterActionErrorPayload);
      return;
    }

    const unlockedInitialClasses = [
      CharacterClass.GUERREIRO,
      CharacterClass.CLERIGO,
      CharacterClass.BARBARO,
      CharacterClass.ARQUEIRO,
    ];
    if (!unlockedInitialClasses.includes(classType)) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'INVALID_SLOT',
        errorMessage: 'Esta classe ainda não está liberada. Escolha Guerreiro, Clérigo, Bárbaro ou Arqueiro.',
        slotIndex,
      } as S2CCharacterActionErrorPayload);
      return;
    }

    try {
      this.db.createCharacterInSlot(connection.id, connection.accountId, slotIndex, characterName, classType);

      const summaries = this.db.getCharacterSlotsSummary(connection.accountId);
      connection.send(Opcode.S2C_CHARACTER_LIST, {
        accountId: connection.accountId,
        accountUsername: connection.accountUsername || '',
        slots: summaries,
        message: `Herói "${characterName}" criado com sucesso no Slot ${slotIndex + 1}!`,
      } as S2CCharacterListPayload);
    } catch (err: any) {
      const code = err.message || 'ERROR';
      let message = 'Não foi possível criar o herói.';
      if (code === 'NAME_TAKEN') message = `O nome "${characterName}" já está em uso por outro aventureiro.`;
      else if (code === 'SLOT_OCCUPIED') message = `O Slot ${slotIndex + 1} já possui um herói alocado.`;
      else if (code === 'INVALID_NAME') message = 'O nome do herói deve ter entre 3 e 20 caracteres.';

      connection.send(Opcode.S2C_ERROR, {
        errorCode: code,
        errorMessage: message,
        slotIndex,
      } as S2CCharacterActionErrorPayload);
    }
  }

  public handleSelectCharacterSlot(connection: Connection, slotIndex: number, preferredChannelId?: number): void {
    if (!connection.isAuthenticated || !connection.accountId) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'UNAUTHENTICATED',
        errorMessage: 'É necessário autenticar a conta antes de selecionar um herói.',
      } as S2CCharacterActionErrorPayload);
      return;
    }

    if (slotIndex < 0 || slotIndex > 2) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'INVALID_SLOT',
        errorMessage: 'Slot inválido.',
        slotIndex,
      } as S2CCharacterActionErrorPayload);
      return;
    }

    const record = this.db.getCharacterByAccountAndSlot(connection.accountId, slotIndex);
    if (!record) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'CHARACTER_NOT_FOUND',
        errorMessage: `Nenhum herói encontrado no Slot ${slotIndex + 1}.`,
        slotIndex,
      } as S2CCharacterActionErrorPayload);
      return;
    }

    const player = this.db.loadPlayerFromRecord(connection.id, record);
    this.assignPlayerToChannel(connection, player, preferredChannelId);
  }

  public handleDeleteCharacterSlot(connection: Connection, slotIndex: number, characterName: string, confirmation: string): void {
    if (!connection.isAuthenticated || !connection.accountId) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'UNAUTHENTICATED',
        errorMessage: 'É necessário autenticar a conta antes de excluir um herói.',
      } as S2CCharacterActionErrorPayload);
      return;
    }

    if (connection.playerId) {
      connection.send(Opcode.S2C_ERROR, {
        errorCode: 'CHARACTER_ACTIVE',
        errorMessage: 'Retorne à Sala dos Forjados antes de excluir um herói.',
        slotIndex,
      } as S2CCharacterActionErrorPayload);
      return;
    }

    try {
      this.db.deleteCharacterInSlot(connection.accountId, slotIndex, characterName, confirmation);
      connection.send(Opcode.S2C_CHARACTER_LIST, {
        accountId: connection.accountId,
        accountUsername: connection.accountUsername || 'Aventureiro',
        slots: this.db.getCharacterSlotsSummary(connection.accountId),
        message: `Herói "${characterName.trim()}" excluído. O pedestal está livre para uma nova lenda.`,
      } as S2CCharacterListPayload);
    } catch (err: any) {
      const code = err?.message || 'CHARACTER_NOT_FOUND';
      const messages: Record<string, string> = {
        INVALID_SLOT: 'Slot inválido.',
        CHARACTER_NOT_FOUND: 'Nenhum herói encontrado nesse pedestal.',
        DELETE_CONFIRMATION_REQUIRED: 'A confirmação precisa conter o nome exato deste herói.',
      };
      connection.send(Opcode.S2C_ERROR, {
        errorCode: code,
        errorMessage: messages[code] || 'Não foi possível excluir este herói.',
        slotIndex,
      } as S2CCharacterActionErrorPayload);
    }
  }

  public handleRequestChannelList(connection: Connection, payload?: C2SRequestChannelListPayload): void {
    const worldIndex = payload?.worldIndex || connection.currentWorldIndex || 1;
    const currentChannelId = connection.currentChannelId || 1;
    const channels = this.getAvailableChannels(worldIndex, currentChannelId);

    const world = this.getOrCreateChannel(worldIndex, 1);
    connection.send(Opcode.S2C_CHANNEL_LIST, {
      worldIndex,
      worldName: world.getWorldName(worldIndex),
      currentChannelId,
      channels,
    } as S2CChannelListPayload);
  }

  public handleChangeChannel(connection: Connection, payload: C2SChangeChannelPayload): void {
    if (!payload || !payload.targetChannelId) {
      connection.send(Opcode.S2C_CHANGE_CHANNEL_RESULT, {
        success: false,
        reason: 'INVALID_CHANNEL_ID',
        message: 'Canal inválido.',
      } as S2CChangeChannelResultPayload);
      return;
    }

    const res = this.changePlayerChannel(connection, payload.targetChannelId);
    if (!res.success) {
      connection.send(Opcode.S2C_CHANGE_CHANNEL_RESULT, {
        success: false,
        reason: res.reason,
        message: res.message,
      } as S2CChangeChannelResultPayload);
    }
  }

  // --- Party & Social Actions ---

  public handlePartyInvite(connection: Connection, payload: C2SPartyInvitePayload): void {
    const target = payload.targetPlayerId || payload.targetPlayerName;
    if (!target) return;
    this.partyManager.invitePlayer(connection, target);
  }

  public handlePartyInviteResponse(connection: Connection, payload: C2SPartyInviteResponsePayload): void {
    if (!payload || !payload.inviterId) return;
    this.partyManager.respondInvite(connection, payload.inviterId, Boolean(payload.accept));
  }

  public handlePartyLeave(connection: Connection): void {
    this.partyManager.leaveParty(connection);
  }

  public handlePartyKick(connection: Connection, payload: C2SPartyKickPayload): void {
    if (!payload || !payload.targetPlayerId) return;
    this.partyManager.kickMember(connection, payload.targetPlayerId);
  }

  public handlePartyPromoteLeader(connection: Connection, payload: C2SPartyPromoteLeaderPayload): void {
    if (!payload || !payload.targetPlayerId) return;
    this.partyManager.promoteLeader(connection, payload.targetPlayerId);
  }

  public handlePartyDisband(connection: Connection): void {
    this.partyManager.disbandParty(connection);
  }

  /**
   * Ciclo de atualização autoritativo (20Hz): atualiza todas as instâncias em execução
   */
  public update(deltaTimeSec: number): void {
    for (const channel of [...this.channels.values()]) {
      channel.update(deltaTimeSec);
    }
  }

  /**
   * Salva com segurança todos os jogadores em todos os canais
   */
  public saveAllPlayers(): void {
    for (const channel of this.channels.values()) {
      channel.saveAllPlayers();
    }
  }
}
