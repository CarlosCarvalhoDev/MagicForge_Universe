import {
  CharacterClass,
  createVector3,
  distance,
  distanceSquared,
  EntitySnapshotState,
  Opcode,
  S2CCombatEventPayload,
  S2CEntityDespawnPayload,
  S2CEntitySpawnPayload,
  S2CInventoryUpdatePayload,
  S2CItemDropDespawnPayload,
  S2CItemDropSpawnPayload,
  S2CPlayerExpUpdatePayload,
  S2CPlayerLevelUpPayload,
  S2CSkillCastEventPayload,
  S2CSkillCastRejectedPayload,
  SkillCastRejectCode,
  CombatStatusType,
  CombatStatusEventReason,
  CombatStatusStatePayload,
  CombatStatusTransitionPayload,
  SkillCategory,
  SkillGeometryType,
  SkillTargetResultPayload,
  cloneVector3,
  S2CWorldSnapshotPayload,
  SKILLS_DATABASE,
  getDefaultSkillsForClass,
  calculateSkillPower,
  ItemDropState,
  ITEMS_DATABASE,
  ItemType,
  ItemRarity,
  S2CBossEventPayload,
  S2CStageUpdatePayload,
  S2CSkillsUpdatePayload,
  S2CCharacterListPayload,
  S2CCharacterActionErrorPayload,
  S2CLoginSuccessPayload,
  S2CRebornResultPayload,
  S2CRefineResultPayload,
  S2CSocketResultPayload,
  S2CCardsUpdatePayload,
  CARDS_DATABASE,
  CLASS_DEFINITIONS,
  Vector3,
  C2SAuthLoginPayload,
  C2SAuthRegisterPayload,
  C2SAuthSocialPayload,
  C2SAuthClaimLegacyPayload,
  S2CAuthSuccessPayload,
  S2CAuthErrorPayload,
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
  S2COfflineRewardInfoPayload,
  C2SClaimOfflineRewardsPayload,
  S2COfflineRewardsClaimedPayload,
  OfflineLootItem,
  S2CHuntReportPayload,
  C2SUpdateSkillRotationPayload,
  S2CSkillRotationPayload,
  isValidSkillCastOrder,
  selectNextSkillSlot,
  getSkillTargeting,
  isSkillEffectAvailable,
  C2SUpgradeSkillPayload,
  S2CSkillUpgradeResultPayload,
  getEquipmentSuggestions,
  findAutoEquipUpgrade,
  FusionRequest,
  getSkillLevel,
  INVENTORY_EXPANSIONS,
  getInventoryExpansion,
  getSkillUpgradeMultiplier,
  getClericPeriodicEffect,
  getClericPulsePower,
  isHybridHealingSkill,
  MAGE_INITIAL_EFFECTS,
  MAGE_SECOND_CIRCLE_EFFECTS,
  MAGE_ULTIMATE_EFFECTS,
  MARTIAL_EFFECTS,
  ARCHER_EFFECTS,
  getArcherVolley,
  MONK_EFFECTS,
  getMonkStrikes,
  isInMonkCone,
  WARLOCK_EFFECTS,
  isInMageCone,
  splitMagePower,
  type DevCommand,
  type DevState,
} from '@magicforge/shared';
import { EntityManager } from './EntityManager';
import { Entity, ActiveCombatStatus } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Monster, MonsterState } from '../entities/Monster';
import { Connection } from '../network/Connection';
import { SpatialGrid } from './SpatialGrid';
import { SERVER_CONFIG } from '../config';
import { DatabaseManager } from '../database/DatabaseManager';
import { SocialAuthService } from '../auth/SocialAuthService';
import { DungeonManager } from './DungeonManager';
import { PartyManager } from './PartyManager';
import { calculateOfflineReward, OFFLINE_REWARD_POLICY } from './OfflineRewards';

export class World {
  private devSettings = { pauseRespawns: false, disableDrops: false, doubleLegendary: false };
  private devTargetSequence = 0;
  public automationEnabled = true;
  public automaticPortalHandler?: (player: Player) => void;
  private automaticPortalTimerSec = 0;
  private automaticBossRetrySec = 0;
  private huntReportTimerSec: number = 0;
  public readonly entityManager = new EntityManager();
  public readonly spatialGrid = new SpatialGrid(20.0);
  public readonly db: DatabaseManager;
  public readonly dungeonManager: DungeonManager;
  public partyManager?: PartyManager;
  public currentTick: number = 0;
  public castSequence: number = 0;
  public statusSequence: number = 0;
  public activeItemDrops = new Map<string, ItemDropState>();
  public connections = new Map<string, Connection>();

  // Stage & Boss Mechanics
  public currentStage: number = 1;
  public currentWorld: number = 1;
  public stageKills: number = 0;
  public readonly killsPerStage: number = 10;
  public isBossActive: boolean = false;
  public isBossAvailable: boolean = false; // Only true when boss escapes on stage 10
  public isPortalOpen: boolean = false;
  public readonly portalPosition: Vector3 = createVector3(0, 0, 8);
  public bossTimerSec: number = 0;
  public activeBossId: string | null = null;
  public activeBossName: string = '';

  // Channel & Instance Configuration
  public channelId: number = 1;
  public maxPlayers: number = 30;
  public instanceId: string = 'world_1_ch_1';

  public getWorldName(world: number): string {
    switch (world) {
      case 1: return 'Floresta da Forja';
      case 2: return 'Picos de Jotunheim';
      case 3: return 'Forja Vulcânica';
      default: return `Dimensão Astral ${world}`;
    }
  }

  constructor(customDb?: DatabaseManager, worldIndex: number = 1, channelId: number = 1, maxPlayers: number = 30) {
    this.db = customDb || new DatabaseManager();
    this.currentWorld = worldIndex;
    this.channelId = channelId;
    this.maxPlayers = maxPlayers;
    this.instanceId = `world_${worldIndex}_ch_${channelId}`;
    this.dungeonManager = new DungeonManager(this);
    this.spawnWorldMonsters(this.currentWorld);
  }

  public spawnWorldMonsters(worldIndex: number): void {
    const mobTemplates = [
      // Quadrante Noroeste (12m - 32m)
      { type: 'slime', pos: createVector3(-14, 0, 12), baseHp: 120, baseDmg: 8 },
      { type: 'melee', pos: createVector3(-20, 0, 18), baseHp: 90, baseDmg: 12 },
      { type: 'archer', pos: createVector3(-26, 0, 14), baseHp: 70, baseDmg: 16 },
      { type: 'wolf', pos: createVector3(-16, 0, 26), baseHp: 100, baseDmg: 14 },

      // Quadrante Nordeste (12m - 32m)
      { type: 'slime', pos: createVector3(14, 0, 14), baseHp: 120, baseDmg: 8 },
      { type: 'wolf', pos: createVector3(22, 0, 12), baseHp: 100, baseDmg: 14 },
      { type: 'melee', pos: createVector3(25, 0, 22), baseHp: 90, baseDmg: 12 },
      { type: 'archer', pos: createVector3(18, 0, 26), baseHp: 70, baseDmg: 16 },

      // Quadrante Sudoeste (12m - 32m)
      { type: 'slime', pos: createVector3(-12, 0, -15), baseHp: 120, baseDmg: 8 },
      { type: 'wolf', pos: createVector3(-22, 0, -14), baseHp: 100, baseDmg: 14 },
      { type: 'melee', pos: createVector3(-16, 0, -25), baseHp: 90, baseDmg: 12 },
      { type: 'archer', pos: createVector3(-26, 0, -22), baseHp: 70, baseDmg: 16 },

      // Quadrante Sudeste (12m - 32m)
      { type: 'melee', pos: createVector3(15, 0, -14), baseHp: 90, baseDmg: 12 },
      { type: 'wolf', pos: createVector3(24, 0, -12), baseHp: 100, baseDmg: 14 },
      { type: 'slime', pos: createVector3(14, 0, -24), baseHp: 120, baseDmg: 8 },
      { type: 'archer', pos: createVector3(25, 0, -24), baseHp: 70, baseDmg: 16 },

      // Santuários Externos (Mini-Chefes a 30m - 36m)
      { type: 'miniboss', pos: createVector3(-32, 0, 20), baseHp: 350, baseDmg: 28 },
      { type: 'miniboss', pos: createVector3(32, 0, -20), baseHp: 350, baseDmg: 28 },
    ];

    const hpMult = 1.0 + (worldIndex - 1) * 0.8;
    const dmgMult = 1.0 + (worldIndex - 1) * 0.6;

    const getMobName = (type: string, world: number) => {
      switch (world) {
        case 1:
          switch (type) {
            case 'slime': return 'Slime da Floresta';
            case 'melee': return 'Goblin Lanceiro';
            case 'archer': return 'Goblin Arqueiro';
            case 'wolf': return 'Lobo Selvagem';
            case 'miniboss': return 'Chefe Goblin';
            default: return 'Monstro da Floresta';
          }
        case 2:
          switch (type) {
            case 'slime': return 'Slime Glacial';
            case 'melee': return 'Guerreiro do Gelo';
            case 'archer': return 'Arqueiro da Neve';
            case 'wolf': return 'Lobo de Jotunheim';
            case 'miniboss': return 'Chefe Yetin';
            default: return 'Monstro Glacial';
          }
        case 3:
          switch (type) {
            case 'slime': return 'Slime de Magma';
            case 'melee': return 'Guerreiro de Cinzas';
            case 'archer': return 'Atirador de Chamas';
            case 'wolf': return 'Cão Infernal';
            case 'miniboss': return 'Chefe de Magma';
            default: return 'Monstro Vulcânico';
          }
        default:
          switch (type) {
            case 'slime': return `Slime Astral ${world}`;
            case 'melee': return `Soldado Astral ${world}`;
            case 'archer': return `Arqueiro Astral ${world}`;
            case 'wolf': return `Besta Astral ${world}`;
            case 'miniboss': return `Comandante Astral ${world}`;
            default: return `Monstro Astral ${world}`;
          }
      }
    };

    mobTemplates.forEach((template, idx) => {
      const mobName = getMobName(template.type, worldIndex);
      const hp = Math.round(template.baseHp * hpMult);
      const damage = Math.round(template.baseDmg * dmgMult);
      const monster = new Monster(`mob_w${worldIndex}_${idx + 1}`, mobName, template.pos, hp, damage, template.type);
      this.entityManager.addMonster(monster);
      this.spatialGrid.updateEntity(monster);

      this.broadcast(Opcode.S2C_ENTITY_SPAWN, {
        entity: monster.toSnapshotState(),
      } as S2CEntitySpawnPayload);
    });

    console.log(`[World] Spawned ${mobTemplates.length} monsters for World ${worldIndex} (${this.getWorldName(worldIndex)}).`);
  }

  public registerConnection(connection: Connection): void {
    this.connections.set(connection.id, connection);
  }

  public unregisterConnection(connection: Connection): void {
    this.removePlayerFromWorld(connection, true);
  }

  /**
   * Remove o jogador desta instância com opção de persistir estado.
   * Usado para desconexões e transferências suaves entre canais.
   */
  public removePlayerFromWorld(connection: Connection, saveToDb: boolean = true, markLogout: boolean = false): Player | null {
    this.connections.delete(connection.id);
    if (!connection.playerId) return null;
    const playerId = connection.playerId;
    const player = this.entityManager.removePlayer(playerId);
    this.spatialGrid.removeEntity(playerId);
    if (player) {
      const clearedStatuses = player.clearAllStatuses();
      this.clearCombatEffectsFromSource(player.id);
      this.syncClericZones();
      this.syncMonkZones();
      this.syncWarlockZones();
      for (const st of clearedStatuses) {
        this.broadcastStatusTransition('CLEARED_ON_DISCONNECT', st, {
          targetRemainingHp: player.currentHp,
          isTargetDead: player.isDead,
        });
      }
      if (saveToDb) {
        if (markLogout) player.lastLogoutTime = Date.now();
        this.db.savePlayer(player);
        console.log(`[World] Player "${player.name}" salvo no SQLite ao sair da instância ${this.instanceId}.`);
      }
      this.broadcast(Opcode.S2C_ENTITY_DESPAWN, {
        entityId: playerId,
        reason: 'DISCONNECTED',
      } as S2CEntityDespawnPayload);
    }
    return player || null;
  }

  public createPlayer(connection: Connection, name: string, classType: CharacterClass): Player {
    // 1. Busca ou cria a conta e carrega/cria o personagem no banco de dados SQLite
    const account = this.db.getOrCreateAccount(name);
    connection.accountId = account.id;
    connection.accountUsername = account.username;
    const player = this.db.loadOrCreatePlayer(connection.id, account.id, name, classType);

    return this.enterWorld(connection, player);
  }

  /**
   * Autenticação de conta local com usuário e senha (0x70)
   */
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

    console.log(`[World] Conta autenticada: "${result.account.username}" (ID: ${result.account.id})`);
  }

  /**
   * Cadastro de nova conta com usuário e senha (0x71)
   */
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

    console.log(`[World] Nova conta registrada e conectada: "${result.account.username}" (ID: ${result.account.id})`);
  }

  /**
   * Autenticação via Provedores Sociais / Convidados (0x72) com Verificação Real de Token
   */
  public async handleAuthSocial(connection: Connection, payload: C2SAuthSocialPayload): Promise<void> {
    if (!payload || !payload.provider) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'SOCIAL_AUTH_FAILED',
        errorMessage: 'Provedor social não informado.',
      } as S2CAuthErrorPayload);
      return;
    }

    // 1. Verificação Criptográfica do Token junto ao provedor oficial (Google, Discord, Facebook, Guest)
    const verification = await SocialAuthService.verifyToken(payload.provider, payload.token);
    if (!verification.success || !verification.profile) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'SOCIAL_AUTH_FAILED',
        errorMessage: verification.error || 'Falha ao autenticar token social com o provedor.',
      } as S2CAuthErrorPayload);
      return;
    }

    // 2. Persistência e Vinculação Segura da Conta com Perfil Autenticado
    const result = this.db.authenticateVerifiedProfile(verification.profile);
    if (!result.success || !result.account) {
      connection.send(Opcode.S2C_AUTH_ERROR, {
        errorCode: 'SOCIAL_AUTH_FAILED',
        errorMessage: result.message || 'Falha ao processar conta social no banco de dados.',
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

    console.log(`[World] Conta social autenticada (${verification.profile.provider}): "${result.account.username}" (ID: ${result.account.id})`);
  }

  /**
   * Ativação e Reivindicação de Conta Legada por Comprovação de Posse do Herói (0x73)
   */
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

    console.log(`[World] Conta legada ativada com sucesso: "${result.account.username}" (ID: ${result.account.id})`);
  }

  /**
   * Responde com a lista de 3 slots de personagens da conta (para os 3 pedestais rúnicos)
   * Bloqueia autoritativamente se a conexão não tiver sido previamente autenticada!
   * IMPORTANTE: Não cria nem spawna nenhum jogador no mundo!
   */
  public handleRequestCharacterList(connection: Connection, username?: string): void {
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

    console.log(`[World] Lista dos 3 slots enviada para "${connection.accountUsername}" (Account ID: ${connection.accountId})`);
  }

  /**
   * Cria um novo personagem em um slot específico (0, 1 ou 2)
   */
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
      
      // Envia a lista atualizada com o novo herói ocupando o pedestal
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

  /**
   * Seleciona o personagem no slot especificado e ingressa o jogador no mundo
   */
  public handleSelectCharacterSlot(connection: Connection, slotIndex: number): void {
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
    this.enterWorld(connection, player);
  }

  /**
   * Conclui a autenticação, instancia o jogador na simulação 20Hz e sincroniza o estado inicial
   */
  public enterWorld(connection: Connection, player: Player): Player {
    // Se o mundo ativo da arena for diferente do mundo do jogador (ex: servidor reiniciou com jogador no Mundo 2)
    if (this.currentWorld !== player.currentWorld && this.entityManager.getAllPlayers().length === 0) {
      for (const m of this.entityManager.getAllMonsters()) {
        m.autoRespawns = false;
        this.entityManager.removeMonster(m.id);
        this.spatialGrid.removeEntity(m.id);
      }
      this.currentWorld = player.currentWorld;
      this.currentStage = player.currentStage;
      this.spawnWorldMonsters(this.currentWorld);
    }

    this.registerConnection(connection);
    connection.currentWorldInstance = this;
    connection.currentChannelId = this.channelId;
    connection.currentWorldIndex = this.currentWorld;
    this.entityManager.addPlayer(player);
    this.spatialGrid.updateEntity(player);
    connection.playerId = player.id;
    connection.isAuthenticated = true;

    // 1. Notifica todos os demais jogadores sobre o surgimento deste herói
    this.broadcast(
      Opcode.S2C_ENTITY_SPAWN,
      { entity: player.toSnapshotState() } as S2CEntitySpawnPayload,
      connection.id // exclui o próprio jogador que receberá login_success
    );

    // 2. Envia entidades existentes na arena para o jogador recém-conectado (incluindo status ativos)
    const allEntities = this.entityManager.getAllEntities();
    for (const ent of allEntities) {
      if (ent.id !== player.id) {
        connection.send(Opcode.S2C_ENTITY_SPAWN, {
          entity: ent.toSnapshotState(),
        } as S2CEntitySpawnPayload);
        for (const st of ent.activeStatuses.values()) {
          connection.send(Opcode.S2C_COMBAT_STATUS_EVENT, {
            event: 'APPLIED',
            serverTick: this.currentTick,
            status: this.toCombatStatusPayload(st),
          } as CombatStatusTransitionPayload);
        }
      }
    }
    for (const st of player.activeStatuses.values()) {
      connection.send(Opcode.S2C_COMBAT_STATUS_EVENT, {
        event: 'APPLIED',
        serverTick: this.currentTick,
        status: this.toCombatStatusPayload(st),
      } as CombatStatusTransitionPayload);
    }

    // 3. Envia drops de itens ativos no chão
    const now = Date.now();
    for (const drop of this.activeItemDrops.values()) {
      const remainingSec = Math.max(0, Math.round(drop.despawnSec - (now - drop.spawnTime) / 1000));
      connection.send(Opcode.S2C_ITEM_DROP_SPAWN, {
        dropId: drop.dropId,
        itemId: drop.itemId,
        name: drop.name,
        rarity: drop.rarity,
        quantity: drop.quantity,
        position: drop.position,
        despawnTimeSec: remainingSec,
      } as S2CItemDropSpawnPayload);
    }

    // 4. Envia inventário, moedas e CP
    connection.send(Opcode.S2C_INVENTORY_UPDATE, {
      slots: player.inventory,
      gold: player.gold,
      totalCombatPower: player.CombatPower,
      maxSlots: player.maxInventorySlots,
    } as S2CInventoryUpdatePayload);

    // 5. Sincroniza e envia progressão de estágio
    this.currentWorld = player.currentWorld;
    this.currentStage = player.currentStage;
    connection.send(Opcode.S2C_STAGE_UPDATE, {
      world: this.currentWorld,
      stage: this.currentStage,
      worldName: this.getWorldName(this.currentWorld),
      stageKills: this.stageKills,
      killsRequired: this.currentStage === 10 ? 1 : this.killsPerStage,
      isBossStage: this.currentStage === 10,
      bossAvailable: this.isBossAvailable,
      portalOpen: this.isPortalOpen,
      portalPosition: this.portalPosition,
    } as S2CStageUpdatePayload);

    // 6. Envia habilidades equipadas nos 4 slots
    connection.send(Opcode.S2C_SKILLS_UPDATE, {
      equippedSkills: player.equippedSkills,
      skillLevels: player.skillLevels,
    } as S2CSkillsUpdatePayload);

    // 7. Envia configurações do Farm Helper (Automação Idle)
    connection.send(Opcode.S2C_FARM_SETTINGS_UPDATE, {
      settings: player.farmSettings,
      message: 'Configurações do Farm Helper sincronizadas.',
    } as S2CFarmSettingsUpdatePayload);

    // 8. Envia confirmação definitiva de login bem-sucedido
    connection.send(Opcode.S2C_LOGIN_SUCCESS, {
      isAdmin: this.db.isAdminAccount(connection.accountId),
      playerId: player.id,
      characterName: player.name,
      classType: player.classType,
      position: player.position,
      stats: player.attributes,
      level: player.level,
      currentXp: player.currentXp,
      xpToNextLevel: player.xpToNextLevel,
      gold: player.gold,
      rebornCount: player.rebornCount,
      honorTitle: player.HonorTitle,
      currentWorld: player.currentWorld,
      currentStage: player.currentStage,
      serverTickRate: SERVER_CONFIG.TICK_RATE,
      tickIntervalMs: SERVER_CONFIG.TICK_INTERVAL_MS,
    } as S2CLoginSuccessPayload);

    console.log(`[World] Player "${player.name}" (${player.classType}) entrou no mundo em [${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}]. Total players ativos: ${this.entityManager.getAllPlayers().length}`);

    // 9. Processa Recompensas Offline (Baú do Tempo / Progresso AFK)
    connection.send(Opcode.S2C_SKILL_ROTATION, { order: [...player.skillCastOrder], autoCastEnabled: player.autoCastEnabled, success: true } satisfies S2CSkillRotationPayload);
    this.checkAndNotifyOfflineRewards(connection, player);
    // Reconnecting at the boss stage must never leave an empty, stalled arena.
    if (this.automationEnabled && player.currentStage === 10 && !this.isBossActive && !this.isPortalOpen &&
      player.unlockedWorld <= player.currentWorld) this.challengeStageBoss(player);

    return player;
  }

  private handlePlayerDisconnect(playerId: string): void {
    const player = this.entityManager.removePlayer(playerId);
    this.spatialGrid.removeEntity(playerId);
    if (player) {
      player.lastLogoutTime = Date.now();
      const clearedStatuses = player.clearAllStatuses();
      this.clearCombatEffectsFromSource(player.id);
      this.syncClericZones();
      this.syncMonkZones();
      this.syncWarlockZones();
      for (const st of clearedStatuses) {
        this.broadcastStatusTransition('CLEARED_ON_DISCONNECT', st, {
          targetRemainingHp: player.currentHp,
          isTargetDead: player.isDead,
        });
      }
      // Salva o progresso mais recente no banco de dados SQLite
      this.db.savePlayer(player);
      console.log(`[World] Player "${player.name}" desconectou e foi salvo com sucesso no SQLite.`);
      this.broadcast(Opcode.S2C_ENTITY_DESPAWN, {
        entityId: playerId,
        reason: 'DISCONNECTED',
      } as S2CEntityDespawnPayload);
    }
  }

  public saveAllPlayers(): void {
    const players = this.entityManager.getAllPlayers();
    for (const p of players) {
      this.db.savePlayer(p);
    }
    console.log(`[World] Todos os ${players.length} jogadores foram salvos no banco de dados.`);
  }

  public sendExpUpdate(player: Player, expGained: number, sourceName: string = 'Monstro'): void {
    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_PLAYER_EXP_UPDATE, {
        playerId: player.id,
        currentXp: player.currentXp,
        xpToNextLevel: player.xpToNextLevel,
        level: player.level,
        expGained,
        source: sourceName,
      } as S2CPlayerExpUpdatePayload);
    }
  }

  public sendHuntReport(player: Player): void {
    const connection = this.connections.get(player.id);
    if (!connection?.isAuthenticated) return;
    connection.send(Opcode.S2C_HUNT_REPORT, {
      characterId: player.dbCharacterId, characterName: player.name, classType: player.classType,
      level: player.level, world: player.currentWorld, stage: player.currentStage, channel: this.channelId,
      ...player.huntSession.snapshot(),
    } satisfies S2CHuntReportPayload);
  }

  public handleRequestHuntReport(connection: Connection, reset = false): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const player = this.entityManager.getPlayer(connection.playerId);
    if (!player) return;
    const now = Date.now();
    if (reset) {
      if (now - player.lastHuntReportResetAt < 1000) return;
      player.lastHuntReportResetAt = now;
      player.huntSession.reset();
    } else {
      if (now - player.lastHuntReportRequestAt < 1000) return;
      player.lastHuntReportRequestAt = now;
    }
    this.sendHuntReport(player);
  }

  public handleUpdateSkillRotation(connection: Connection, payload?: C2SUpdateSkillRotationPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const player = this.entityManager.getPlayer(connection.playerId);
    if (!player) return;
    if (!isValidSkillCastOrder(payload?.order) || (payload?.autoCastEnabled !== undefined && typeof payload.autoCastEnabled !== 'boolean')) {
      connection.send(Opcode.S2C_SKILL_ROTATION, {
        order: [...player.skillCastOrder], autoCastEnabled: player.autoCastEnabled, success: false, message: 'Escolha uma ordem com os quatro slots, sem repetir.',
      } satisfies S2CSkillRotationPayload);
      return;
    }
    try {
      this.db.updateSkillCastOrder(player.dbCharacterId, payload.order, payload.autoCastEnabled);
      if (payload.autoCastEnabled !== undefined) player.autoCastEnabled = payload.autoCastEnabled;
      player.skillCastOrder = [...payload.order];
      player.skillRotationCursor = 0;
      connection.send(Opcode.S2C_SKILL_ROTATION, {
        order: [...player.skillCastOrder], autoCastEnabled: player.autoCastEnabled, success: true, message: player.autoCastEnabled ? 'Magias automáticas ativadas. O ciclo segue da esquerda para a direita.' : 'Magias manuais ativadas. Movimento, ataque básico e avanço continuam automáticos.',
      } satisfies S2CSkillRotationPayload);
    } catch {
      connection.send(Opcode.S2C_SKILL_ROTATION, {
        order: [...player.skillCastOrder], autoCastEnabled: player.autoCastEnabled, success: false, message: 'Não foi possível salvar o ciclo. Tente novamente.',
      } satisfies S2CSkillRotationPayload);
    }
  }

  public handleUpgradeSkill(connection: Connection, payload?: C2SUpgradeSkillPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const player = this.entityManager.getPlayer(connection.playerId);
    if (!player) return;
    let success = false;
    let message = 'Não foi possível melhorar a habilidade. Tente novamente.';
    const skillId = typeof payload?.skillId === 'string' ? payload.skillId : '';
    try {
      const result = this.db.upgradeCharacterSkill(player, skillId, payload?.expectedLevel as number);
      player.skillLevels = result.skillLevels;
      player.gold = result.gold;
      player.inventory = result.inventory;
      success = true;
      message = `${SKILLS_DATABASE[skillId].name} melhorada para Nv. ${result.skillLevels[skillId]}!`;
    } catch (error) {
      const messages: Record<string, string> = {
        INVALID_SKILL: 'Selecione uma habilidade liberada da sua classe com evolução disponível.',
        INVALID_LEVEL: 'Nível inválido ou habilidade já no nível máximo.',
        STALE_LEVEL: 'Esta melhoria já foi processada ou o nível mudou. Confira o nível atual.',
        INSUFFICIENT_GOLD: 'Ouro insuficiente para esta melhoria.',
        INSUFFICIENT_MATERIAL: 'Pó Arcano insuficiente. Obtenha mais no farm ou reciclando equipamentos.',
      };
      message = messages[error instanceof Error ? error.message : ''] ?? message;
    }
    connection.send(Opcode.S2C_SKILL_UPGRADE_RESULT, {
      skillId, success, skillLevels: { ...player.skillLevels }, message,
    } satisfies S2CSkillUpgradeResultPayload);
    this.sendInventoryUpdate(player);
  }

  public handlePlayerLevelUp(player: Player): void {
    this.broadcast(Opcode.S2C_PLAYER_LEVEL_UP, {
      playerId: player.id,
      newLevel: player.level,
      newAttributes: player.attributes,
      newMaxHp: player.maxHp,
      newMaxResource: player.maxResource,
      totalCombatPower: player.CombatPower,
      rebornCount: player.rebornCount,
      honorTitle: player.HonorTitle,
    } as S2CPlayerLevelUpPayload);

    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }
  }

  /**
   * Authoritative Simulation Step called by GameLoop at 20Hz (every 50ms)
   */
  public update(deltaTimeSec: number): void {
    this.currentTick++;
    if (this.automationEnabled && this.automaticPortalHandler &&
      (this.isPortalOpen || this.entityManager.getAllPlayers().some(player => player.unlockedWorld > player.currentWorld))) {
      this.automaticPortalTimerSec += deltaTimeSec;
      if (this.automaticPortalTimerSec >= 3) {
        for (const player of this.entityManager.getAllPlayers()) {
          if (!player.isDead && player.unlockedWorld > player.currentWorld && !this.dungeonManager.isPlayerInDungeon(player.id)) this.automaticPortalHandler(player);
        }
      }
    } else { this.automaticPortalTimerSec = 0; }
    if (this.automationEnabled && this.isBossAvailable && !this.isBossActive && !this.isPortalOpen) {
      this.automaticBossRetrySec += deltaTimeSec;
      if (this.automaticBossRetrySec >= 60) {
        const player = this.entityManager.getAllPlayers().find(candidate => !candidate.isDead && !this.dungeonManager.isPlayerInDungeon(candidate.id));
        if (player) { this.automaticBossRetrySec = 0; this.challengeStageBoss(player); }
      }
    } else { this.automaticBossRetrySec = 0; }

    // 1. Update all Players & Spatial Cell Index
    const players = this.entityManager.getAllPlayers();
    for (const player of players) {
      player.update(deltaTimeSec);
      this.spatialGrid.updateEntity(player);

      // Auto-Combat AI for Players (matching Unity AutoCombatController logic)
      this.processPlayerAutoCombat(player, deltaTimeSec);

      // Farm Helper AI for Players (Auto-Poção HP e MP)
      this.processPlayerFarmHelper(player);
    }
    this.huntReportTimerSec += deltaTimeSec;
    if (this.huntReportTimerSec >= 5) {
      this.huntReportTimerSec %= 5;
      for (const player of players) this.sendHuntReport(player);
    }

    // 1.1. Update Daily Dungeons & Boss Rush
    this.dungeonManager.update(deltaTimeSec);

    this.syncClericZones();
    // 2. Update all Monsters & Spatial Cell Index
    const monsters = this.entityManager.getAllMonsters();
    for (const monster of monsters) {
      if (monster.trainingDummy) {
        monster.position = cloneVector3(monster.spawnPosition);
        this.spatialGrid.updateEntity(monster);
        continue;
      }
      if (monster.isDead && this.devSettings.pauseRespawns) continue;
      // Monster Aggro targeting
      if (monster.state === MonsterState.IDLE && !monster.isDead) {
        const nearestPlayer = players.filter(p => !p.isDead && !p.hasStatus('STEALTH') && distanceSquared(p.position,monster.position)<=monster.aggroRadius**2)
          .sort((a,b)=>distanceSquared(a.position,monster.position)-distanceSquared(b.position,monster.position))[0];
        if (nearestPlayer) {
          monster.targetPlayer = nearestPlayer;
          monster.targetId = nearestPlayer.id;
          monster.state = MonsterState.CHASING;
        }
      }

      monster.update(deltaTimeSec);
      this.spatialGrid.updateEntity(monster);

      // Monster Combat Attack
      this.processMonsterCombat(monster);
    }

    // 2.1. Update Combat Statuses (Bleed, Buffs, Debuffs, Shields, Expirations)
    this.updateCombatStatuses(deltaTimeSec);

    // 3. Update Boss Challenge Timer
    if (this.isBossActive) {
      this.bossTimerSec -= deltaTimeSec;
      if (this.bossTimerSec <= 0) {
        const boss = this.activeBossId ? this.entityManager.getMonster(this.activeBossId) : null;
        if (boss) {
          boss.autoRespawns = false;
          this.entityManager.removeMonster(boss.id);
          this.spatialGrid.removeEntity(boss.id);
          this.broadcast(Opcode.S2C_ENTITY_DESPAWN, { entityId: boss.id, reason: 'DEAD' } as S2CEntityDespawnPayload);
          for (const p of this.entityManager.getAllPlayers()) {
            if (p.targetId === boss.id) p.targetId = null;
          }
        }
        this.isBossActive = false;
        this.activeBossId = null;
        this.activeBossName = '';
        this.isBossAvailable = true; // Botão de re-tentativa agora fica disponível na Fase 10!

        this.broadcast(Opcode.S2C_BOSS_EVENT, {
          eventType: 'TIMEOUT',
          message: '⌛ O tempo de 60s acabou e o Chefão escapou! Você continua na Fase 10. Suba seu Poder de Combate (CP) e clique em DESAFIAR CHEFÃO!',
        } as S2CBossEventPayload);

        this.broadcast(Opcode.S2C_STAGE_UPDATE, {
          world: this.currentWorld,
          stage: this.currentStage,
          worldName: this.getWorldName(this.currentWorld),
          stageKills: 0,
          killsRequired: 1,
          isBossStage: true,
          bossAvailable: true,
          portalOpen: false,
        } as S2CStageUpdatePayload);
      }
    }

    // 4. Update Item Drops (despawn countdown & player proximity auto-loot)
    const now = Date.now();
    for (const [dropId, drop] of this.activeItemDrops) {
      if ((now - drop.spawnTime) / 1000 >= drop.despawnSec) {
        this.activeItemDrops.delete(dropId);
        this.broadcast(Opcode.S2C_ITEM_DROP_DESPAWN, { dropId } as S2CItemDropDespawnPayload);
        continue;
      }

      // Proximity auto-pickup (generous 6.0m vacuum radius for smooth idle play, respeitando autoLootEnabled)
      for (const player of players) {
        if (!player.isDead && player.farmSettings.autoLootEnabled && distance(player.position, drop.position) <= this.getAutoLootRange(player)) {
          this.lootItem(player, dropId);
          break; // drop picked up, break player loop
        }
      }
    }

    // 4. Build & Broadcast World Snapshot (Partitioned by Area of Interest)
    this.broadcastSnapshot();
  }

  private processPlayerAutoCombat(player: Player, deltaTimeSec: number): void {
    if (player.isDead || player.isStunned()) return;
    const hasArcaneHaste=player.hasStatus('ARCANE_HASTE');
    player.autoSkillDecisionTimerSec = Math.max(hasArcaneHaste?-SERVER_CONFIG.TICK_DELTA_TIME_SEC:0, player.autoSkillDecisionTimerSec - deltaTimeSec);

    // If player has a target, check validity
    let target = player.targetId ? this.entityManager.getMonster(player.targetId) : null;

    if (!target || target.isDead) {
      // Auto-target nearest monster within radar (60m)
      target = this.entityManager.findNearestMonster(player.position, 60.0);
      player.targetId = target ? target.id : null;
    }

    if (!target || target.isDead) {
      if (this.automationEnabled) {
        if (Math.hypot(player.position.x, player.position.z) > 3) player.setMoveDirection(createVector3(-player.position.x, 0, -player.position.z), 0);
        else player.stopMoving();
      }
      return;
    }

    const dist = distance(player.position, target.position);
    if (this.automationEnabled) {
      const readySkills = new Map(player.skillCastOrder.map(slot => [slot, SKILLS_DATABASE[player.getEquippedSkill(slot)]] as const).filter(([, skill]) => {
        if (player.isSilenced() || !skill || skill.classType !== player.classType || player.level < skill.unlockLevel || player.currentResource < this.getEffectiveSkillCost(player,skill.cost) || !isSkillEffectAvailable(skill)) return false;
        const category = getSkillTargeting(skill).category;
        if (category==='AOE_SELF' && isHybridHealingSkill(skill) && player.currentHp>=player.maxHp && dist>getSkillTargeting(skill).reach) return false;
        return !(skill.isHeal && !isHybridHealingSkill(skill) && !['clerigo_nv2_3','barbaro_nv2_2','guerreiro_nv3_3'].includes(skill.skillId) && (category === 'SELF_HEAL' || category === 'AOE_SELF') && player.currentHp >= player.maxHp);
      }).filter(([slot]) => (player.skillCooldowns.get(slot) ?? 0) <= 0));
      let approachRange = player.attackRange;
      if (player.autoCastEnabled) for (const skill of readySkills.values()) {
        const targeting = getSkillTargeting(skill);
        if (targeting.category !== 'SELF_HEAL' && targeting.category !== 'SELF_BUFF' && !(targeting.category === 'AOE_SELF' && skill.isHeal && !isHybridHealingSkill(skill))) approachRange = Math.min(approachRange, targeting.reach);
      }
      const stopDistance = Math.max(0.1, approachRange - 0.35);
      if (dist > stopDistance) {
        player.setMoveDirection(createVector3(target.position.x - player.position.x, 0, target.position.z - player.position.z), 0);
      } else {
        player.stopMoving();
        if (player.autoCastEnabled && player.autoSkillDecisionTimerSec <= 0) {
          player.autoSkillDecisionTimerSec = hasArcaneHaste?player.autoSkillDecisionTimerSec+0.1/MAGE_SECOND_CIRCLE_EFFECTS.hasteDecisionMultiplier:0.1;
          const next = selectNextSkillSlot(player.skillCastOrder, player.skillRotationCursor, slot => {
            const skill = readySkills.get(slot); if (!skill) return false;
            const targeting = getSkillTargeting(skill);
            if (targeting.category === 'SELF_HEAL' || targeting.category === 'SELF_BUFF') return this.castPlayerSkill(player, slot);
            if (targeting.category === 'AOE_SELF') {
              if (!skill.isHeal && dist > targeting.reach) return false;
              return this.castPlayerSkill(player, slot);
            }
            if (dist > targeting.reach + 0.5) return false;
            if (skill.skillId==='bruxo_nv2_3') {
              const dx=player.position.x-target!.position.x,dz=player.position.z-target!.position.z,length=Math.hypot(dx,dz);
              const destination=createVector3(Math.max(SERVER_CONFIG.MAP_BOUNDS.minX,Math.min(SERVER_CONFIG.MAP_BOUNDS.maxX,player.position.x+(length>1e-8?dx/length:Math.sin(player.headingYaw*Math.PI/180))*skill.range)),0,Math.max(SERVER_CONFIG.MAP_BOUNDS.minZ,Math.min(SERVER_CONFIG.MAP_BOUNDS.maxZ,player.position.z+(length>1e-8?dz/length:Math.cos(player.headingYaw*Math.PI/180))*skill.range)));
              return distanceSquared(player.position,destination)>.01&&this.castPlayerSkill(player,slot,undefined,destination);
            }
            return skill.isAoe ? this.castPlayerSkill(player, slot, undefined, target!.position) : this.castPlayerSkill(player, slot, target!.id);
          });
          if (next) player.skillRotationCursor = next.nextCursor;
        }
      }
    }

    // If within attack range and cooldown ready, execute attack
    if (!target.isDead && distance(player.position,target.position) <= player.attackRange) {
      // If moving, stop moving when in attack range (just like Unity AutoCombatController)
      if (player.isMoving && player.targetDestination) {
        player.stopMoving();
      }

      if (player.attackTimer <= 0) {
        this.executePlayerAttack(player, target);
        player.attackTimer = player.attackIntervalSec * player.getAttackSpeedMultiplier();
      }
    }
  }

  private rollPlayerCritical(player: Player, target: Monster | null, baseChance: number): boolean {
    const ambush = player.getStatus('AMBUSH_CRITICAL');
    if (ambush && ambush.remainingSec > 0) {
      for (const type of ['AMBUSH_CRITICAL','STEALTH'] as const) {
        const status = player.getStatus(type);
        if (status) { player.removeStatus(status.statusId); this.broadcastStatusTransition('BROKEN',status); }
      }
      return true;
    }
    const mark = target?.getStatus('GUIDING_MARK');
    if (mark && mark.sourceEntityId === player.id && mark.remainingSec > 0) {
      target!.removeStatus(mark.statusId);
      this.broadcastStatusTransition('BROKEN', mark);
      return true;
    }
    return Math.random() < player.getCriticalChance(baseChance);
  }

  private executePlayerAttack(player: Player, target: Monster): void {
    const wasAlive = !target.isDead;
    const rawDamage = player.BaseDamage;
    // Simple critical strike formula based on DEX
    const isCritical = this.rollPlayerCritical(player, target, player.attributes.destreza * 0.015);
    const finalDamage = isCritical ? Math.round(rawDamage * 1.5) : rawDamage;

    const dmgRes = target.takeDamage(finalDamage, player);
    if (dmgRes.brokenShieldStatus) {
      this.broadcastStatusTransition('BROKEN', dmgRes.brokenShieldStatus, {
        targetRemainingHp: target.currentHp,
        isTargetDead: target.isDead,
      });
    } else if (dmgRes.refreshedShieldStatus) {
      this.broadcastStatusTransition('REFRESHED', dmgRes.refreshedShieldStatus, {
        targetRemainingHp: target.currentHp,
        isTargetDead: target.isDead,
      });
    }

    const combatEvent: S2CCombatEventPayload = {
      attackerId: player.id,
      targetId: target.id,
      damage: dmgRes.effectiveDamage,
      isCritical,
      isDodged: false,
      targetRemainingHp: target.currentHp,
      targetMaxHp: target.maxHp,
      isTargetDead: target.isDead,
      damageSource: 'BASIC_ATTACK',
    };

    this.broadcast(Opcode.S2C_COMBAT_EVENT, combatEvent);

    if (wasAlive && target.isDead) {
      this.handleMonsterDeath(target, player);
    }
  }

  private processMonsterCombat(monster: Monster): void {
    if (monster.isDead || monster.isStunned() || monster.state !== MonsterState.ATTACKING || !monster.targetPlayer) return;

    const player = monster.targetPlayer as Player;
    if (player.isDead || player.hasStatus('STEALTH')) return;

    if (monster.attackCooldown <= 0) {
      const damage = Math.round(monster.attackDamage*(1-Math.max(0,Math.min(.5,monster.getStatus('WEAKENED')?.magnitude??0))));
      // Dodge check based on player DEX
      const evasion = player.getStatus('EVASION_READY');
      const guaranteedDodge = !!evasion && evasion.remainingSec > 0;
      const blinded=Math.max(0,Math.min(1,monster.getStatus('BLINDED')?.magnitude??0));
      const isDodged = guaranteedDodge || Math.random() < player.getDodgeChance(player.attributes.destreza * 0.01) || (blinded>0&&Math.random()<blinded);
      if (guaranteedDodge) {
        player.removeStatus(evasion!.statusId); this.broadcastStatusTransition('BROKEN',evasion!);
      }
      if(isDodged&&(guaranteedDodge||blinded>0))this.broadcast(Opcode.S2C_COMBAT_EVENT,{attackerId:monster.id,targetId:player.id,damage:0,isCritical:false,isDodged:true,targetRemainingHp:player.currentHp,targetMaxHp:player.maxHp,isTargetDead:false,damageSource:'BASIC_ATTACK'} as S2CCombatEventPayload);

      if (!isDodged) {
        const dmgRes = player.takeDamage(damage, monster);
        if (dmgRes.brokenShieldStatus) {
          this.broadcastStatusTransition('BROKEN', dmgRes.brokenShieldStatus, {
            targetRemainingHp: player.currentHp,
            isTargetDead: player.isDead,
          });
        } else if (dmgRes.refreshedShieldStatus) {
          this.broadcastStatusTransition('REFRESHED', dmgRes.refreshedShieldStatus, {
            targetRemainingHp: player.currentHp,
            isTargetDead: player.isDead,
          });
        }

        const combatEvent: S2CCombatEventPayload = {
          attackerId: monster.id,
          targetId: player.id,
          damage: dmgRes.effectiveDamage,
          isCritical: false,
          isDodged,
          targetRemainingHp: player.currentHp,
          targetMaxHp: player.maxHp,
          isTargetDead: player.isDead,
          damageSource: 'BASIC_ATTACK',
        };

        this.broadcast(Opcode.S2C_COMBAT_EVENT, combatEvent);

        if (dmgRes.reflected > 0) {
          this.broadcast(Opcode.S2C_COMBAT_EVENT, {
            attackerId: player.id,
            targetId: monster.id,
            damage: dmgRes.reflected,
            isCritical: false,
            isDodged: false,
            targetRemainingHp: monster.currentHp,
            targetMaxHp: monster.maxHp,
            isTargetDead: monster.isDead,
            damageSource: 'REFLECTION',
          } as S2CCombatEventPayload);

          if (monster.isDead) {
            this.handleMonsterDeath(monster, player);
          }
        }
      }
      monster.attackCooldown = monster.attackIntervalSec * monster.getAttackSpeedMultiplier();

      if (player.isDead && this.isBossActive && monster.id === this.activeBossId) {
        // O jogador foi derrotado pelo chefão: o chefão recua para não causar spawn-camp
        monster.autoRespawns = false;
        this.entityManager.removeMonster(monster.id);
        this.spatialGrid.removeEntity(monster.id);
        this.broadcast(Opcode.S2C_ENTITY_DESPAWN, { entityId: monster.id, reason: 'DEAD' } as S2CEntityDespawnPayload);
        for (const p of this.entityManager.getAllPlayers()) {
          if (p.targetId === monster.id) p.targetId = null;
        }
        this.isBossActive = false;
        this.activeBossId = null;
        this.activeBossName = '';
        this.isBossAvailable = true; // Botão de re-tentativa agora fica disponível na Fase 10!

        this.broadcast(Opcode.S2C_BOSS_EVENT, {
          eventType: 'TIMEOUT',
          message: `💀 O herói caiu em combate! O ${this.activeBossName} retornou às sombras. Você continua na Fase 10. Recupere-se e clique em [DESAFIAR CHEFÃO]!`,
        } as S2CBossEventPayload);

        this.broadcast(Opcode.S2C_STAGE_UPDATE, {
          world: this.currentWorld,
          stage: 10,
          worldName: this.getWorldName(this.currentWorld),
          stageKills: 0,
          killsRequired: 1,
          isBossStage: true,
          bossAvailable: true,
          portalOpen: false,
        } as S2CStageUpdatePayload);
      }
    }
  }

  private isFiniteVector3(v: unknown): v is Vector3 {
    if (!v || typeof v !== 'object') return false;
    const p = v as Vector3;
    return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
  }

  public sendSkillRejection(
    player: Player,
    slot: number,
    reasonCode: SkillCastRejectCode,
    message: string,
    skillId?: string
  ): void {
    const conn = this.connections.get(player.id);
    if (!conn) return;

    conn.send(Opcode.S2C_SKILL_CAST_REJECTED, {
      casterId: player.id,
      slot,
      skillId,
      reasonCode,
      message,
      serverTick: this.currentTick,
      cooldownRemainingSec: player.getSkillCooldown(slot),
      casterCurrentResource: Math.round(player.currentResource),
      casterMaxResource: player.maxResource,
    } as S2CSkillCastRejectedPayload);

    conn.send(Opcode.S2C_CHAT_MESSAGE, {
      senderId: 'Grimório',
      senderName: '⚠️ Ação Rejeitada',
      message,
      channel: 'system',
      timestamp: Date.now(),
    });
  }

  public toCombatStatusPayload(status: ActiveCombatStatus): CombatStatusStatePayload {
    return {
      areaCenter: status.areaCenter ? cloneVector3(status.areaCenter) : undefined,
      radius: status.radius,
      statusId: status.statusId,
      type: status.type,
      skillId: status.skillId,
      sourceEntityId: status.sourceEntityId,
      targetEntityId: status.targetEntityId,
      durationSec: status.durationSec,
      remainingSec: Math.max(0, Math.round(status.remainingSec * 10) / 10),
      expiresAtTick: status.expiresAtTick,
      magnitude: status.magnitude,
      remainingAbsorption: status.remainingAbsorption,
      maxAbsorption: status.maxAbsorption,
      reflectRatio: status.reflectRatio,
    };
  }

  public broadcastStatusTransition(
    event: CombatStatusEventReason,
    status: ActiveCombatStatus,
    extra?: { tickDamage?: number; tickHeal?: number; targetRemainingHp?: number; isTargetDead?: boolean }
  ): void {
    const payload: CombatStatusTransitionPayload = {
      event,
      serverTick: this.currentTick,
      status: this.toCombatStatusPayload(status),
      tickDamage: extra?.tickDamage,
      tickHeal: extra?.tickHeal,
      targetRemainingHp: extra?.targetRemainingHp,
      isTargetDead: extra?.isTargetDead,
    };
    this.broadcast(Opcode.S2C_COMBAT_STATUS_EVENT, payload);
  }

  private syncClericZones(): void {
    const players=this.entityManager.getAllPlayers().filter(player=>!player.isDead);
    const guardians=players.map(player=>({player,effect:player.getStatus('GUARDIANS_AURA')})).filter(entry=>entry.effect && entry.effect.remainingSec>0);
    const sync=(entity:Entity,type:'SLOW'|'SANCTUARY_WARD',source:Player|undefined,effect:ActiveCombatStatus|undefined,magnitude:number)=>{
      const current=entity.getStatus(type);
      if(!source||!effect){
        if(current?.skillId==='clerigo_nv2_1'||current?.skillId==='clerigo_nv2_3'){
          entity.removeStatus(current.statusId);this.broadcastStatusTransition('EXPIRED',current);
        }
        return;
      }
      if(current?.sourceEntityId===source.id && current.skillId===effect.skillId){
        current.remainingSec=effect.remainingSec;
        if(current.expiresAtTick!==effect.expiresAtTick){current.expiresAtTick=effect.expiresAtTick;this.broadcastStatusTransition('REFRESHED',current);}
        return;
      }
      if(current){entity.removeStatus(current.statusId);this.broadcastStatusTransition('EXPIRED',current);}
      const status:ActiveCombatStatus={statusId:`status_${Date.now()}_${++this.statusSequence}`,type,skillId:effect.skillId,sourceEntityId:source.id,targetEntityId:entity.id,durationSec:effect.durationSec,remainingSec:effect.remainingSec,expiresAtTick:effect.expiresAtTick,magnitude};
      entity.addStatus(status);this.broadcastStatusTransition('APPLIED',status);
    };
    for(const monster of this.entityManager.getAllMonsters()){
      const source=!monster.isDead?guardians.find(({player,effect})=>distanceSquared(player.position,monster.position)<=(effect!.radius??5)**2):undefined;
      sync(monster,'SLOW',source?.player,source?.effect,0.4);
    }
    for(const player of players){
      const effect=player.getStatus('SANCTUARY');
      const inside=effect && effect.remainingSec>0 && effect.areaCenter && distanceSquared(player.position,effect.areaCenter)<=(effect.radius??6)**2;
      sync(player,'SANCTUARY_WARD',inside?player:undefined,inside?effect:undefined,0.25);
    }
  }

  private updateClericPeriodicEffect(player:Player,status:ActiveCombatStatus,deltaTimeSec:number): void {
    const spec=getClericPeriodicEffect(status.skillId), periodic=status.periodic;
    if(!spec||!periodic||player.isDead)return;
    periodic.elapsedSec=Math.min(spec.durationSec,periodic.elapsedSec+Math.min(deltaTimeSec,Math.max(0,status.remainingSec)));
    while(periodic.pulsesDone<spec.pulses && periodic.elapsedSec+1e-8>=(periodic.pulsesDone+1)*spec.intervalSec){
      if(player.isDead || this.entityManager.getPlayer(player.id)!==player || !player.activeStatuses.has(status.statusId))break;
      const power=getClericPulsePower(periodic.totalPower,++periodic.pulsesDone,spec.pulses);
      if(status.type==='SANCTUARY'){
        if(status.areaCenter && distanceSquared(player.position,status.areaCenter)<=spec.radius**2){
          const healed=player.heal(power);
          this.broadcastStatusTransition('TICK',status,{tickHeal:healed,targetRemainingHp:player.currentHp,isTargetDead:false});
        }
        continue;
      }
      let targets:Monster[]=[];
      if(status.type==='GUARDIANS_AURA')targets=this.entityManager.getAllMonsters().filter(monster=>!monster.isDead&&distanceSquared(player.position,monster.position)<=spec.radius**2);
      else {
        let target=periodic.targetId?this.entityManager.getMonster(periodic.targetId):null;
        if(!target||target.isDead||distanceSquared(player.position,target.position)>spec.radius**2)target=this.entityManager.findNearestMonster(player.position,spec.radius);
        periodic.targetId=target?.id;
        if(target&&!target.isDead)targets=[target];
      }
      for(const target of targets){
        if(player.isDead)break;
        const previousHp=target.currentHp;
        target.takeDamage(power,player);
        const damage=Math.max(0,previousHp-target.currentHp);
        this.broadcast(Opcode.S2C_COMBAT_EVENT,{attackerId:player.id,targetId:target.id,damage,isCritical:false,isDodged:false,targetRemainingHp:target.currentHp,targetMaxHp:target.maxHp,isTargetDead:target.isDead,damageSource:'STATUS_TICK'} as S2CCombatEventPayload);
        if(target.isDead)this.handleMonsterDeath(target,player);
      }
    }
  }

  private clearCombatEffectsFromSource(sourceId:string):void{
    for(const monster of this.entityManager.getAllMonsters())for(const status of [...monster.activeStatuses.values()]){
      if(status.sourceEntityId===sourceId && (['BURN','FROST_SLOW','FROZEN','BLEED','CRIPPLED','WEAKENED','POISON','HUNTERS_MARK','ROOT','ATTACK_SLOW','SILENCED','HEAL_REDUCTION','DARK_PLAGUE','HEXED','BLINDED'].includes(status.type)||(status.type==='STUN'&&status.skillId==='monge_nv2_1'))){
        monster.removeStatus(status.statusId);this.broadcastStatusTransition('CLEARED_ON_DISCONNECT',status);
      }
    }
  }

  private applySkillStatus(player:Player,target:Entity,type:CombatStatusType,durationSec:number,magnitude:number,skillId:string,extra:Pick<ActiveCombatStatus,'periodic'|'remainingAbsorption'|'maxAbsorption'|'reflectRatio'|'reflectFlat'|'reflectOnAbsorbed'|'areaCenter'|'radius'>={}):ActiveCombatStatus{
    const previous=target.getStatus(type);
    if(previous){target.removeStatus(previous.statusId);this.broadcastStatusTransition('EXPIRED',previous);}
    const status:ActiveCombatStatus={statusId:`status_${Date.now()}_${++this.statusSequence}`,type,skillId,sourceEntityId:player.id,targetEntityId:target.id,durationSec,remainingSec:durationSec,expiresAtTick:this.currentTick+durationSec*SERVER_CONFIG.TICK_RATE,magnitude,...extra};
    target.addStatus(status);this.broadcastStatusTransition('APPLIED',status);return status;
  }

  private updateMageBurn(monster:Monster,status:ActiveCombatStatus,deltaTimeSec:number):void{
    const periodic=status.periodic,source=this.entityManager.getPlayer(status.sourceEntityId);
    if(!periodic||!source||source.isDead)return;
    periodic.elapsedSec=Math.min(MAGE_INITIAL_EFFECTS.burnDurationSec,periodic.elapsedSec+Math.min(deltaTimeSec,Math.max(0,status.remainingSec)));
    while(periodic.pulsesDone<4 && periodic.elapsedSec+1e-8>=periodic.pulsesDone+1){
      if(monster.isDead||source.isDead||!monster.activeStatuses.has(status.statusId))break;
      const power=splitMagePower(periodic.totalPower,++periodic.pulsesDone,4),previousHp=monster.currentHp;
      monster.takeDamage(power,source);
      const damage=Math.max(0,previousHp-monster.currentHp);
      this.broadcastStatusTransition('TICK',status,{tickDamage:damage,targetRemainingHp:monster.currentHp,isTargetDead:monster.isDead});
      this.broadcast(Opcode.S2C_COMBAT_EVENT,{attackerId:source.id,targetId:monster.id,damage,isCritical:false,isDodged:false,targetRemainingHp:monster.currentHp,targetMaxHp:monster.maxHp,isTargetDead:monster.isDead,damageSource:'STATUS_TICK'} as S2CCombatEventPayload);
      if(monster.isDead)this.handleMonsterDeath(monster,source);
    }
  }

  private updateAreaDamageEffect(player:Player,status:ActiveCombatStatus,deltaTimeSec:number):void{
    const pack=status.type==='SPECTRAL_PACK';
    const guardian=status.type==='ASTRAL_GUARDIAN';
    const hunger=status.type==='HADAR_HUNGER',demon=status.type==='DEMON_PRESENCE';
    const duration=hunger?WARLOCK_EFFECTS.hungerSec:demon?WARLOCK_EFFECTS.demonSec:guardian?ARCHER_EFFECTS.guardianSec:pack?MARTIAL_EFFECTS.packSec:MAGE_ULTIMATE_EFFECTS.cometDurationSec;
    const pulses=hunger?WARLOCK_EFFECTS.hungerPulses:demon?WARLOCK_EFFECTS.demonPulses:guardian?ARCHER_EFFECTS.guardianPulses:pack?MARTIAL_EFFECTS.packPulses:MAGE_ULTIMATE_EFFECTS.cometPulses;
    const interval=pack||guardian||hunger||demon?1:MAGE_ULTIMATE_EFFECTS.cometIntervalSec;
    const periodic=status.periodic,center=pack?player.position:status.areaCenter;
    if(!periodic||!center||player.isDead)return;
    periodic.elapsedSec=Math.min(duration,periodic.elapsedSec+Math.min(deltaTimeSec,Math.max(0,status.remainingSec)));
    while(periodic.pulsesDone<pulses && periodic.elapsedSec+1e-8>=(periodic.pulsesDone+1)*interval){
      if(player.isDead||this.entityManager.getPlayer(player.id)!==player||!player.activeStatuses.has(status.statusId))break;
      const power=splitMagePower(periodic.totalPower,++periodic.pulsesDone,pulses);let totalDamage=0;
      const targets=this.entityManager.getAllMonsters().filter(monster=>!monster.isDead&&distanceSquared(center,monster.position)<=(status.radius??6.5)**2);
      for(const monster of targets){
        if(player.isDead)break;
        const previousHp=monster.currentHp;monster.takeDamage(power,player);const damage=Math.max(0,previousHp-monster.currentHp);totalDamage+=damage;
        this.broadcast(Opcode.S2C_COMBAT_EVENT,{attackerId:player.id,targetId:monster.id,damage,isCritical:false,isDodged:false,targetRemainingHp:monster.currentHp,targetMaxHp:monster.maxHp,isTargetDead:monster.isDead,damageSource:'STATUS_TICK'} as S2CCombatEventPayload);
        if(monster.isDead)this.handleMonsterDeath(monster,player);
      }
      this.broadcastStatusTransition('TICK',status,{tickDamage:totalDamage});
    }
  }

  private updateTargetedPeriodic(entity: Entity, status: ActiveCombatStatus, deltaTimeSec: number): void {
    const periodic = status.periodic, source = this.entityManager.getPlayer(status.sourceEntityId);
    if (!periodic || !source || source.isDead) return;
    const volley = getArcherVolley(status.skillId) ?? getMonkStrikes(status.skillId);
    if (getMonkStrikes(status.skillId) && source.isStunned()) {
      entity.removeStatus(status.statusId); this.broadcastStatusTransition('EXPIRED',status); return;
    }
    const dot=status.type==='POISON'||status.type==='DARK_PLAGUE';
    const pulses = status.type === 'DARK_PLAGUE' ? WARLOCK_EFFECTS.plaguePulses : status.type === 'POISON' ? ARCHER_EFFECTS.poisonPulses : volley?.pulses;
    const interval = dot ? 1 : volley?.intervalSec;
    if (!pulses || !interval) return;
    periodic.elapsedSec = Math.min(status.durationSec, periodic.elapsedSec + Math.min(deltaTimeSec,Math.max(0,status.remainingSec)));
    while (periodic.pulsesDone < pulses && periodic.elapsedSec + 1e-8 >= (periodic.pulsesDone + 1) * interval) {
      if (source.isDead || this.entityManager.getPlayer(source.id) !== source || !entity.activeStatuses.has(status.statusId)) break;
      const target = dot ? entity as Monster : this.entityManager.getMonster(periodic.targetId ?? '');
      const skill = SKILLS_DATABASE[status.skillId];
      if (!target || target.isDead || (!dot && distance(source.position,target.position) > skill.range + .5)) {
        entity.removeStatus(status.statusId); this.broadcastStatusTransition('EXPIRED',status); break;
      }
      const power = splitMagePower(periodic.totalPower,++periodic.pulsesDone,pulses), hp = target.currentHp;
      target.takeDamage(power,source);
      const damage = Math.max(0,hp-target.currentHp);
      status.areaCenter = cloneVector3(target.position);
      this.broadcastStatusTransition('TICK',status,{tickDamage:damage,targetRemainingHp:target.currentHp,isTargetDead:target.isDead});
      this.broadcast(Opcode.S2C_COMBAT_EVENT,{attackerId:source.id,targetId:target.id,damage,isCritical:periodic.isCritical??false,isDodged:false,targetRemainingHp:target.currentHp,targetMaxHp:target.maxHp,isTargetDead:target.isDead,damageSource:'STATUS_TICK'} as S2CCombatEventPayload);
      if (target.isDead) { this.handleMonsterDeath(target,source); break; }
    }
  }

  private syncMonkZones(): void {
    const areas=this.entityManager.getAllPlayers().filter(player=>!player.isDead)
      .map(player=>({player,effect:player.getStatus('ZEN_DOME')}))
      .filter(entry=>entry.effect&&entry.effect.remainingSec>0&&entry.effect.areaCenter);
    for (const monster of this.entityManager.getAllMonsters()) {
      const current=monster.getStatus('SILENCED');
      const containing=areas.filter(({effect})=>!monster.isDead&&distanceSquared(monster.position,effect!.areaCenter!)<=(effect!.radius??6)**2);
      const source=containing.find(entry=>entry.player.id===current?.sourceEntityId)??containing[0];
      if (!source) {
        if (current?.skillId==='monge_nv3_3') { monster.removeStatus(current.statusId); this.broadcastStatusTransition('EXPIRED',current); }
        continue;
      }
      const effect=source.effect!;
      if (current?.sourceEntityId===source.player.id&&current.skillId==='monge_nv3_3') {
        current.remainingSec=effect.remainingSec; current.expiresAtTick=effect.expiresAtTick; continue;
      }
      if (current&&current.skillId!=='monge_nv3_3'&&current.remainingSec>=effect.remainingSec) continue;
      const status=this.applySkillStatus(source.player,monster,'SILENCED',effect.remainingSec,1,'monge_nv3_3');
      status.expiresAtTick=effect.expiresAtTick;
    }
  }

  private updateMonkDome(player: Player, status: ActiveCombatStatus, deltaTimeSec: number): void {
    const periodic=status.periodic, center=status.areaCenter;
    if (!periodic||!center||player.isDead) return;
    periodic.elapsedSec=Math.min(MONK_EFFECTS.domeSec,periodic.elapsedSec+Math.min(deltaTimeSec,Math.max(0,status.remainingSec)));
    while (periodic.pulsesDone<MONK_EFFECTS.domePulses&&periodic.elapsedSec+1e-8>=periodic.pulsesDone+1) {
      if (player.isDead||this.entityManager.getPlayer(player.id)!==player||!player.activeStatuses.has(status.statusId)) break;
      const part=++periodic.pulsesDone, power=splitMagePower(periodic.totalPower,part,MONK_EFFECTS.domePulses);
      let healed=0, totalDamage=0;
      if (distanceSquared(player.position,center)<=(status.radius??6)**2) healed=player.heal(splitMagePower(periodic.totalHealing??0,part,MONK_EFFECTS.domePulses));
      const targets=this.entityManager.getAllMonsters().filter(monster=>!monster.isDead&&distanceSquared(monster.position,center)<=(status.radius??6)**2);
      for (const monster of targets) {
        if (player.isDead) break;
        const hp=monster.currentHp; monster.takeDamage(power,player); const damage=Math.max(0,hp-monster.currentHp); totalDamage+=damage;
        this.broadcast(Opcode.S2C_COMBAT_EVENT,{attackerId:player.id,targetId:monster.id,damage,isCritical:false,isDodged:false,targetRemainingHp:monster.currentHp,targetMaxHp:monster.maxHp,isTargetDead:monster.isDead,damageSource:'STATUS_TICK'} as S2CCombatEventPayload);
        if (monster.isDead) this.handleMonsterDeath(monster,player);
      }
      this.broadcastStatusTransition('TICK',status,{tickDamage:totalDamage,tickHeal:healed,targetRemainingHp:player.currentHp,isTargetDead:player.isDead});
    }
  }

  private syncWarlockZones(): void {
    const areas=this.entityManager.getAllPlayers().filter(p=>!p.isDead).map(player=>({player,effect:player.getStatus('HADAR_HUNGER')})).filter(e=>e.effect&&e.effect.remainingSec>0&&e.effect.areaCenter);
    for(const monster of this.entityManager.getAllMonsters()){
      const current=monster.getStatus('BLINDED');
      const containing=areas.filter(({effect})=>!monster.isDead&&distanceSquared(monster.position,effect!.areaCenter!)<=(effect!.radius??5.5)**2);
      const source=containing.find(e=>e.player.id===current?.sourceEntityId)??containing[0];
      if(!source){if(current?.skillId==='bruxo_nv2_1'){monster.removeStatus(current.statusId);this.broadcastStatusTransition('EXPIRED',current);}continue;}
      const effect=source.effect!;
      if(current?.sourceEntityId===source.player.id&&current.skillId==='bruxo_nv2_1'){current.remainingSec=effect.remainingSec;current.expiresAtTick=effect.expiresAtTick;continue;}
      if(current&&current.skillId!=='bruxo_nv2_1'&&current.remainingSec>=effect.remainingSec)continue;
      this.applySkillStatus(source.player,monster,'BLINDED',effect.remainingSec,WARLOCK_EFFECTS.blindMissChance,'bruxo_nv2_1');
    }
  }

  private updateHexRegeneration(player:Player,status:ActiveCombatStatus,deltaTimeSec:number):void{
    const periodic=status.periodic;if(!periodic||player.isDead)return;
    const target=this.entityManager.getMonster(periodic.targetId??''),curse=target?.getStatus('HEXED');
    if(!target||target.isDead||curse?.sourceEntityId!==player.id){player.removeStatus(status.statusId);this.broadcastStatusTransition('EXPIRED',status);return;}
    periodic.elapsedSec=Math.min(status.durationSec,periodic.elapsedSec+Math.min(deltaTimeSec,Math.max(0,status.remainingSec)));
    while(periodic.pulsesDone<WARLOCK_EFFECTS.hexPulses&&periodic.elapsedSec+1e-8>=periodic.pulsesDone+1){
      if(player.isDead||!player.activeStatuses.has(status.statusId)||target.isDead||target.getStatus('HEXED')?.sourceEntityId!==player.id)break;
      const heal=player.heal(splitMagePower(periodic.totalHealing??0,++periodic.pulsesDone,WARLOCK_EFFECTS.hexPulses));
      this.broadcastStatusTransition('TICK',status,{tickHeal:heal,targetRemainingHp:player.currentHp,isTargetDead:false});
    }
  }

  public updateCombatStatuses(deltaTimeSec: number): void {
    this.syncClericZones();
    this.syncMonkZones();
    this.syncWarlockZones();
    const allEntities: Entity[] = [
      ...this.entityManager.getAllPlayers(),
      ...this.entityManager.getAllMonsters(),
    ];

    for (const ent of allEntities) {
      if (ent.activeStatuses.size === 0) continue;

      for (const [statusId, status] of Array.from(ent.activeStatuses.entries())) {
        if(!ent.activeStatuses.has(statusId))continue;
        if(['BURN','FROST_SLOW','FROZEN','BLEED','CRIPPLED','WEAKENED','POISON','HUNTERS_MARK','ROOT','ATTACK_SLOW','SILENCED','HEAL_REDUCTION','DARK_PLAGUE','HEXED','BLINDED'].includes(status.type)||(status.type==='STUN'&&status.skillId==='monge_nv2_1')){
          const source=this.entityManager.getPlayer(status.sourceEntityId);
          if(!source||source.isDead){ent.removeStatus(statusId);this.broadcastStatusTransition(source?'CLEARED_ON_DEATH':'CLEARED_ON_DISCONNECT',status);continue;}
          if(ent instanceof Monster && status.type==='BURN')this.updateMageBurn(ent,status,deltaTimeSec);
          if(ent instanceof Monster && (status.type==='POISON'||status.type==='DARK_PLAGUE'))this.updateTargetedPeriodic(ent,status,deltaTimeSec);
        }
        if(ent instanceof Player && status.periodic){
          if(['ARROW_VOLLEY','STORM_BARRAGE','CHI_PALMS','FLURRY'].includes(status.type))this.updateTargetedPeriodic(ent,status,deltaTimeSec);
          else if(status.type==='ZEN_DOME')this.updateMonkDome(ent,status,deltaTimeSec);
          else if(status.type==='HEX_REGEN')this.updateHexRegeneration(ent,status,deltaTimeSec);
          else if(['COMET_RAIN','SPECTRAL_PACK','ASTRAL_GUARDIAN','HADAR_HUNGER','DEMON_PRESENCE'].includes(status.type))this.updateAreaDamageEffect(ent,status,deltaTimeSec);
          else this.updateClericPeriodicEffect(ent,status,deltaTimeSec);
        }

        // Periodic Tick (e.g. BLEED a cada 1.0s)
        if (status.type === 'BLEED') {
          status.nextTickSec = (status.nextTickSec ?? 1.0) - Math.min(deltaTimeSec,Math.max(0,status.remainingSec));
          while (status.nextTickSec <= 1e-8 && !ent.isDead && ent.activeStatuses.has(statusId)) {
            status.nextTickSec += 1;
            const tickDmg = status.magnitude;
            const dmgRes = ent.takeDamage(tickDmg);

            this.broadcastStatusTransition('TICK', status, {
              tickDamage: dmgRes.effectiveDamage,
              targetRemainingHp: ent.currentHp,
              isTargetDead: ent.isDead,
            });

            this.broadcast(Opcode.S2C_COMBAT_EVENT, {
              attackerId: status.sourceEntityId,
              targetId: ent.id,
              damage: dmgRes.effectiveDamage,
              isCritical: false,
              isDodged: false,
              targetRemainingHp: ent.currentHp,
              targetMaxHp: ent.maxHp,
              isTargetDead: ent.isDead,
              damageSource: 'STATUS_TICK',
            } as S2CCombatEventPayload);

            if (dmgRes.killed && ent instanceof Monster) {
              const killer = this.entityManager.getPlayer(status.sourceEntityId) || undefined;
              this.handleMonsterDeath(ent, killer);
            }
          }
        }

        status.remainingSec -= deltaTimeSec;

        // Expiração do status
        if (status.remainingSec <= 0 && ent.activeStatuses.has(statusId)) {
          ent.activeStatuses.delete(statusId);
          this.broadcastStatusTransition('EXPIRED', status, {
            targetRemainingHp: ent.currentHp,
            isTargetDead: ent.isDead,
          });
        }
      }
    }
    this.syncClericZones();
    this.syncMonkZones();
    this.syncWarlockZones();
  }

  /**
   * Conjuração Autoritativa de Habilidades Ativas (Slots 1 a 4)
   * Valida rigorosamente classe, slot, nível, CD, recurso, alvo, distância e geometria
   * ANTES de consumir qualquer recurso ou acionar cooldown.
   */
  private getEffectiveSkillCost(player:Player,baseCost:number):number{
    return player.classType===CharacterClass.BARBARO&&player.hasStatus('UNBRIDLED_RAGE')?0:baseCost;
  }

  public castPlayerSkill(player: Player, slot: number, targetId?: string, targetPos?: Vector3): boolean {
    if (player.isDead) {
      this.sendSkillRejection(player, slot, 'CASTER_DEAD', 'O herói está derrotado e não pode agir!');
      return false;
    }

    if (player.isStunned()) {
      this.sendSkillRejection(player, slot, 'CASTER_STUNNED', 'Você está atordoado e não pode usar habilidades!');
      return false;
    }
    if (player.isSilenced()) {
      this.sendSkillRejection(player,slot,'CASTER_SILENCED','Você está silenciado e não pode conjurar habilidades.'); return false;
    }

    if (!Number.isInteger(slot) || slot < 1 || slot > 4) {
      this.sendSkillRejection(player, slot, 'INVALID_SLOT', `Slot inválido: ${slot}. Escolha entre 1 e 4.`);
      return false;
    }

    const skillKey = player.getEquippedSkill(slot) || getDefaultSkillsForClass(player.classType)[slot];
    const skill = SKILLS_DATABASE[skillKey];
    if (!skill) {
      this.sendSkillRejection(player, slot, 'INVALID_SKILL', `Habilidade não cadastrada: ${skillKey}`);
      return false;
    }

    if (skill.classType !== player.classType) {
      this.sendSkillRejection(
        player,
        slot,
        'WRONG_CLASS',
        `Esta habilidade pertence a ${skill.classType}, não a ${player.classType}.`,
        skill.skillId
      );
      return false;
    }

    if (skill.slot !== slot) {
      this.sendSkillRejection(
        player,
        slot,
        'INVALID_SLOT',
        `A habilidade "${skill.name}" pertence ao Slot ${skill.slot}, não ao Slot ${slot}.`,
        skill.skillId
      );
      return false;
    }

    if (player.level < skill.unlockLevel) {
      this.sendSkillRejection(
        player,
        slot,
        'LEVEL_LOCKED',
        `O Slot ${slot} (${skill.tierName}) requer Nível ${skill.unlockLevel}! (Nível atual: ${player.level})`,
        skill.skillId
      );
      return false;
    }

    if (!isSkillEffectAvailable(skill)) {
      this.sendSkillRejection(player, slot, 'UNIMPLEMENTED_EFFECT', 'Este efeito está em preparação. Escolha outra habilidade no Grimório.', skill.skillId);
      return false;
    }

    const currentCd = player.getSkillCooldown(slot);
    if (currentCd > 0) {
      this.sendSkillRejection(
        player,
        slot,
        'ON_COOLDOWN',
        `Habilidade em recarga! (${currentCd.toFixed(1)}s restantes)`,
        skill.skillId
      );
      return false;
    }

    const resourceCost=this.getEffectiveSkillCost(player,skill.cost);
    if (player.currentResource < resourceCost) {
      this.sendSkillRejection(
        player,
        slot,
        'INSUFFICIENT_RESOURCE',
        `${skill.resourceType} insuficiente! Necessário ${resourceCost} (Atual: ${Math.round(player.currentResource)}).`,
        skill.skillId
      );
      return false;
    }

    if (targetPos !== undefined && !this.isFiniteVector3(targetPos)) {
      this.sendSkillRejection(player, slot, 'INVALID_POSITION', 'Coordenadas de alvo inválidas ou não finitas.', skill.skillId);
      return false;
    }

    const { category, geometry } = getSkillTargeting(skill);

    const RANGE_TOLERANCE = 0.5;
    let resolvedTargetId: string | undefined;
    let resolvedCenter: Vector3 = cloneVector3(player.position);
    let resolvedDirection: number = player.headingYaw;
    let targetsToDamage: Monster[] = [];
    let singleTargetMonster: Monster | null = null;
    let mistDestination: Vector3 | undefined;

    // Resolução de Alvo e Validação Pré-Consumo
    if (skill.skillId==='bruxo_nv2_3') {
      if(targetId){const target=this.entityManager.getMonster(targetId);if(!target||target.isDead){this.sendSkillRejection(player,slot,'INVALID_TARGET','Destino da bruma inválido.',skill.skillId);return false;}mistDestination=cloneVector3(target.position);}
      else mistDestination=targetPos?cloneVector3(targetPos):createVector3(player.position.x+Math.sin(player.headingYaw*Math.PI/180)*skill.range,0,player.position.z+Math.cos(player.headingYaw*Math.PI/180)*skill.range);
      if(!this.isFiniteVector3(mistDestination)||Math.abs(mistDestination.y)>.001||mistDestination.x<SERVER_CONFIG.MAP_BOUNDS.minX||mistDestination.x>SERVER_CONFIG.MAP_BOUNDS.maxX||mistDestination.z<SERVER_CONFIG.MAP_BOUNDS.minZ||mistDestination.z>SERVER_CONFIG.MAP_BOUNDS.maxZ||distance(player.position,mistDestination)>skill.range+1e-8||distanceSquared(player.position,mistDestination)<.01){this.sendSkillRejection(player,slot,'INVALID_POSITION','Escolha um ponto no chão, dentro do mapa e a até 6m.',skill.skillId);return false;}
      targetsToDamage=this.entityManager.getAllMonsters().filter(m=>!m.isDead&&distanceSquared(player.position,m.position)<=(skill.aoeRadius??3.5)**2);
      resolvedCenter=cloneVector3(mistDestination);resolvedTargetId=targetsToDamage[0]?.id??player.id;
      resolvedDirection=Math.atan2(mistDestination.x-player.position.x,mistDestination.z-player.position.z)*180/Math.PI;
    } else switch (category) {
      case 'SELF_HEAL':
      case 'SELF_BUFF': {
        resolvedTargetId = player.id;
        resolvedCenter = cloneVector3(player.position);
        resolvedDirection = player.headingYaw;
        break;
      }

      case 'SINGLE_TARGET': {
        if (targetId) {
          const ent = this.entityManager.getEntity(targetId);
          if (!ent || !(ent instanceof Monster)) {
            this.sendSkillRejection(player, slot, 'INVALID_TARGET', 'Alvo inválido ou inexistente.', skill.skillId);
            return false;
          }
          if (ent.isDead) {
            this.sendSkillRejection(player, slot, 'TARGET_DEAD', 'O monstro alvo já foi derrotado.', skill.skillId);
            return false;
          }
          const d = distance(player.position, ent.position);
          if (d > skill.range + RANGE_TOLERANCE) {
            this.sendSkillRejection(
              player,
              slot,
              'OUT_OF_RANGE',
              `Alvo fora de alcance! (${d.toFixed(1)}m > ${skill.range}m)`,
              skill.skillId
            );
            return false;
          }
          singleTargetMonster = ent;
        } else {
          // Auto-busca o monstro vivo mais próximo no alcance
          const nearest = this.entityManager.findNearestMonster(player.position, skill.range + RANGE_TOLERANCE);
          if (!nearest || nearest.isDead) {
            this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum monstro ao alcance da habilidade.', skill.skillId);
            return false;
          }
          singleTargetMonster = nearest;
        }

        resolvedTargetId = singleTargetMonster.id;
        resolvedCenter = cloneVector3(singleTargetMonster.position);
        const dx = singleTargetMonster.position.x - player.position.x;
        const dz = singleTargetMonster.position.z - player.position.z;
        resolvedDirection = (Math.atan2(dx, dz) * 180) / Math.PI;
        targetsToDamage = [singleTargetMonster];
        if (skill.skillId === 'monge_truque_2') {
          const second = this.entityManager.getAllMonsters().filter(m=>!m.isDead&&m.id!==singleTargetMonster!.id&&distanceSquared(player.position,m.position)<=skill.range**2)
            .sort((a,b)=>distanceSquared(singleTargetMonster!.position,a.position)-distanceSquared(singleTargetMonster!.position,b.position)||a.id.localeCompare(b.id))[0];
          if (second) targetsToDamage.push(second);
        }
        break;
      }

      case 'AOE_SELF': {
        // Redemoinho de Aço (raio 5m) ou Avatar da Guerra (raio 7m) centrado no Guerreiro
        if (targetPos && distance(player.position, targetPos) > skill.range + RANGE_TOLERANCE) {
          this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', 'Ponto de conjuração fora do alcance permitido.', skill.skillId);
          return false;
        }
        if (targetId) {
          const ent = this.entityManager.getEntity(targetId);
          if (!ent || ent.isDead || distance(player.position, ent.position) > skill.range + RANGE_TOLERANCE) {
            this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', 'Alvo de referência fora do alcance permitido.', skill.skillId);
            return false;
          }
        }

        resolvedCenter = cloneVector3(player.position);
        resolvedDirection = player.headingYaw;
        const radius = skill.aoeRadius || 5.0;
        const radiusSq = radius * radius;

        const monsters = this.entityManager.getAllMonsters();
        targetsToDamage = monsters.filter((m) => !m.isDead && distanceSquared(resolvedCenter, m.position) <= radiusSq);

        if (targetsToDamage.length === 0 && !skill.isHeal) {
          this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum inimigo dentro do raio de efeito da habilidade.', skill.skillId);
          return false;
        }
        resolvedTargetId = targetsToDamage[0]?.id ?? player.id;
        break;
      }

      case 'AOE_LINE': {
        if (skill.skillId === 'arqueiro_nv2_2' && targetPos && Math.abs(targetPos.y) > .001) {
          this.sendSkillRejection(player,slot,'INVALID_POSITION','Mire a flecha em um ponto no chão.',skill.skillId); return false;
        }
        // Golpe Colossal: racha o solo em linha a partir do Guerreiro
        let dirX = Math.sin((player.headingYaw * Math.PI) / 180);
        let dirZ = Math.cos((player.headingYaw * Math.PI) / 180);

        if (targetPos) {
          const dist = distance(player.position, targetPos);
          if (dist > skill.range + RANGE_TOLERANCE) {
            this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', 'Direção de ataque além do alcance permitido.', skill.skillId);
            return false;
          }
          if (dist > 0.1) {
            dirX = (targetPos.x - player.position.x) / dist;
            dirZ = (targetPos.z - player.position.z) / dist;
          }
        } else if (targetId) {
          const ent = this.entityManager.getEntity(targetId);
          if(skill.skillId==='arqueiro_nv2_2'&&(!ent||!(ent instanceof Monster)||ent.isDead)){
            this.sendSkillRejection(player,slot,ent?.isDead?'TARGET_DEAD':'INVALID_TARGET','Alvo da flecha em linha inválido.',skill.skillId);return false;
          }
          if (ent && !ent.isDead) {
            const dist = distance(player.position, ent.position);
            if (dist > skill.range + RANGE_TOLERANCE) {
              this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', 'Alvo além do alcance permitido.', skill.skillId);
              return false;
            }
            if (dist > 0.1) {
              dirX = (ent.position.x - player.position.x) / dist;
              dirZ = (ent.position.z - player.position.z) / dist;
            }
          }
        }

        const lineLength = skill.range + RANGE_TOLERANCE;
        const halfWidth = 1.5;
        const monsters = this.entityManager.getAllMonsters();

        targetsToDamage = monsters.filter((m) => {
          if (m.isDead) return false;
          const dx = m.position.x - player.position.x;
          const dz = m.position.z - player.position.z;
          const proj = dx * dirX + dz * dirZ;
          const perp = Math.abs(dx * -dirZ + dz * dirX);
          return proj >= 0 && proj <= lineLength && perp <= halfWidth;
        });

        if (targetsToDamage.length === 0) {
          this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum inimigo atingido pela trajetória em linha.', skill.skillId);
          return false;
        }

        resolvedDirection = (Math.atan2(dirX, dirZ) * 180) / Math.PI;
        resolvedCenter = createVector3(
          player.position.x + dirX * (skill.aoeRadius || 4.0),
          0,
          player.position.z + dirZ * (skill.aoeRadius || 4.0)
        );
        resolvedTargetId = targetsToDamage[0].id;
        break;
      }

      case 'AOE_TARGET': {
        // Lâmina do Julgamento: queda autorizada no alvo ou ponto até 8m
        if (targetId) {
          const ent = this.entityManager.getEntity(targetId);
          if (!ent || !(ent instanceof Monster)) {
            this.sendSkillRejection(player, slot, 'INVALID_TARGET', 'Alvo de área inexistente.', skill.skillId);
            return false;
          }
          if (ent.isDead) {
            this.sendSkillRejection(player, slot, 'TARGET_DEAD', 'O monstro alvo já foi derrotado.', skill.skillId);
            return false;
          }
          const d = distance(player.position, ent.position);
          if (d > skill.range + RANGE_TOLERANCE) {
            this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', `Alvo além do alcance de ${skill.range}m.`, skill.skillId);
            return false;
          }
          resolvedCenter = cloneVector3(ent.position);
          resolvedTargetId = ent.id;
        } else if (targetPos) {
          const d = distance(player.position, targetPos);
          if (d > skill.range + RANGE_TOLERANCE) {
            this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', `Ponto além do alcance de ${skill.range}m.`, skill.skillId);
            return false;
          }
          resolvedCenter = cloneVector3(targetPos);
        } else if (skill.skillId === 'monge_nv3_3') {
          resolvedCenter = cloneVector3(player.position); resolvedTargetId = player.id;
        } else {
          const nearest = this.entityManager.findNearestMonster(player.position, skill.range + RANGE_TOLERANCE);
          if (!nearest || nearest.isDead) {
            this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum inimigo ao alcance da habilidade.', skill.skillId);
            return false;
          }
          resolvedCenter = cloneVector3(nearest.position);
          resolvedTargetId = nearest.id;
        }

        const radius = skill.aoeRadius || 5.0;
        const radiusSq = radius * radius;
        const monsters = this.entityManager.getAllMonsters();
        targetsToDamage = monsters.filter((m) => !m.isDead && distanceSquared(resolvedCenter, m.position) <= radiusSq);

        if(geometry==='CONE'){
          const dx=resolvedCenter.x-player.position.x,dz=resolvedCenter.z-player.position.z;
          resolvedDirection=Math.hypot(dx,dz)>1e-8?Math.atan2(dx,dz)*180/Math.PI:player.headingYaw;
          targetsToDamage=monsters.filter(monster=>!monster.isDead&&(skill.skillId==='monge_nv2_2'?isInMonkCone(player.position,monster.position,resolvedDirection):isInMageCone(player.position,monster.position,resolvedDirection)));
        }
        if(skill.skillId==='mago_truque_3'){
          targetsToDamage.sort((a,b)=>{
            if(a.id===resolvedTargetId)return -1;if(b.id===resolvedTargetId)return 1;
            return distanceSquared(resolvedCenter,a.position)-distanceSquared(resolvedCenter,b.position)||a.id.localeCompare(b.id);
          });
          targetsToDamage=targetsToDamage.slice(0,MAGE_INITIAL_EFFECTS.chainTargets);
        }
        if(skill.skillId==='mago_nv2_2'){
          const byDistance=(origin:Vector3)=>(a:Monster,b:Monster)=>distanceSquared(origin,a.position)-distanceSquared(origin,b.position)||a.id.localeCompare(b.id);
          let next=resolvedTargetId?monsters.find(monster=>monster.id===resolvedTargetId):targetsToDamage.filter(monster=>distance(player.position,monster.position)<=skill.range+RANGE_TOLERANCE).sort(byDistance(resolvedCenter))[0];
          const chain:Monster[]=[];
          while(next&&!next.isDead&&chain.length<MAGE_SECOND_CIRCLE_EFFECTS.chainTargets){
            chain.push(next);const origin=next.position;
            next=monsters.filter(monster=>!monster.isDead&&!chain.includes(monster)&&distanceSquared(origin,monster.position)<=radiusSq+1e-8).sort(byDistance(origin))[0];
          }
          targetsToDamage=chain;
        }
        if (targetsToDamage.length === 0 && skill.skillId !== 'monge_nv3_3') {
          this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum inimigo dentro da área de impacto.', skill.skillId);
          return false;
        }
        if (!resolvedTargetId) resolvedTargetId = targetsToDamage[0]?.id ?? player.id;
        break;
      }
    }

    // =========================================================================
    // TODAS AS VALIDAÇÕES PASSARAM: AGORA SIM CONSOME RECURSO E APLICA COOLDOWN
    // =========================================================================
    if(skill.skillId==='barbaro_nv2_3'&&(Math.abs(resolvedCenter.y)>.001||resolvedCenter.x<SERVER_CONFIG.MAP_BOUNDS.minX||resolvedCenter.x>SERVER_CONFIG.MAP_BOUNDS.maxX||resolvedCenter.z<SERVER_CONFIG.MAP_BOUNDS.minZ||resolvedCenter.z>SERVER_CONFIG.MAP_BOUNDS.maxZ)){
      this.sendSkillRejection(player,slot,'INVALID_POSITION','Ponto de salto fora do mapa.',skill.skillId);return false;
    }
    if(['bruxo_nv2_1','bruxo_nv3_1','bruxo_nv3_2'].includes(skill.skillId)&&(Math.abs(resolvedCenter.y)>.001||resolvedCenter.x<SERVER_CONFIG.MAP_BOUNDS.minX||resolvedCenter.x>SERVER_CONFIG.MAP_BOUNDS.maxX||resolvedCenter.z<SERVER_CONFIG.MAP_BOUNDS.minZ||resolvedCenter.z>SERVER_CONFIG.MAP_BOUNDS.maxZ)){this.sendSkillRejection(player,slot,'INVALID_POSITION','Área fora do chão ou dos limites do mapa.',skill.skillId);return false;}
    const castOrigin=cloneVector3(player.position);
    player.consumeResource(resourceCost);
    const cooldownSec=slot===1&&player.hasStatus('ARCANE_HASTE')?skill.cooldownSec*MAGE_SECOND_CIRCLE_EFFECTS.hasteCantripCooldownMultiplier:skill.cooldownSec;
    player.setSkillCooldown(slot, cooldownSec);

    const castId = `cast_${Date.now()}_${++this.castSequence}`;
    const upgradeMultiplier = getSkillUpgradeMultiplier(getSkillLevel(player.skillLevels, skill.skillId));
    const hybridAttack = isHybridHealingSkill(skill);
    const rawPower = skill.skillId === 'clerigo_truque_3' ? player.attributes.sabedoria * 1.1
      : skill.skillId === 'bruxo_nv2_2' ? player.attributes.carisma * 2.5
      : calculateSkillPower(skill, player.attributes, player.level, player.maxHp);
    const basePower = Math.round(rawPower * upgradeMultiplier);
    const periodicSpec=getClericPeriodicEffect(skill.skillId);
    const isCritical = periodicSpec || ['mago_nv1_2','mago_nv2_3','mago_nv3_2','barbaro_nv1_2','barbaro_nv2_2','barbaro_nv3_3','arqueiro_nv1_1','arqueiro_nv2_3','arqueiro_nv3_3','monge_nv1_2','monge_nv1_3','monge_nv3_3','bruxo_nv1_1','bruxo_nv1_2','bruxo_nv2_1','bruxo_nv3_2'].includes(skill.skillId) ? false : this.rollPlayerCritical(player, !skill.isHeal || hybridAttack ? singleTargetMonster : null, player.attributes.destreza * 0.02);
    let finalPower = isCritical ? Math.round(basePower * 1.5) : basePower;
    if (skill.skillId === 'clerigo_truque_2' && singleTargetMonster && singleTargetMonster.currentHp < singleTargetMonster.maxHp) finalPower = Math.round(finalPower * 1.25);

    if ((!skill.isHeal || hybridAttack) && category !== 'SELF_BUFF') {
      finalPower = Math.round(finalPower * player.getDamageMultiplier());
    }

    const affectedEntityIds: string[] = [];
    const targetResults: SkillTargetResultPayload[] = [];
    const appliedStatuses: CombatStatusStatePayload[] = [];
    let totalEffectiveDamageOrHeal = 0;

    // Aplicação Específica por Habilidade
    if (periodicSpec) {
      const totalPower=skill.isHeal?basePower:Math.round(basePower*player.getDamageMultiplier());
      const status:ActiveCombatStatus={statusId:`status_${Date.now()}_${++this.statusSequence}`,type:periodicSpec.type,skillId:skill.skillId,sourceEntityId:player.id,targetEntityId:player.id,durationSec:periodicSpec.durationSec,remainingSec:periodicSpec.durationSec,expiresAtTick:this.currentTick+periodicSpec.durationSec*SERVER_CONFIG.TICK_RATE,magnitude:totalPower,radius:periodicSpec.radius,areaCenter:periodicSpec.type==='SANCTUARY'?cloneVector3(player.position):undefined,periodic:{elapsedSec:0,pulsesDone:0,totalPower,targetId:singleTargetMonster?.id}};
      const previous=player.getStatus(periodicSpec.type);
      if(previous){player.removeStatus(previous.statusId);this.broadcastStatusTransition('EXPIRED',previous);}
      player.addStatus(status);appliedStatuses.push(this.toCombatStatusPayload(status));this.broadcastStatusTransition('APPLIED',status);this.syncClericZones();
      affectedEntityIds.push(player.id);
    } else if (skill.skillId==='mago_nv3_2') {
      const status=this.applySkillStatus(player,player,'COMET_RAIN',MAGE_ULTIMATE_EFFECTS.cometDurationSec,finalPower,skill.skillId,{areaCenter:cloneVector3(resolvedCenter),radius:skill.aoeRadius??6.5,periodic:{elapsedSec:0,pulsesDone:0,totalPower:finalPower}});
      appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(player.id);
    } else if (skill.skillId==='mago_nv2_3') {
      const status=this.applySkillStatus(player,player,'ARCANE_HASTE',MAGE_SECOND_CIRCLE_EFFECTS.hasteDurationSec,MAGE_SECOND_CIRCLE_EFFECTS.hasteDecisionMultiplier-1,skill.skillId);
      appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(player.id);
    } else if (skill.skillId === 'mago_nv1_2') {
      const status=this.applySkillStatus(player,player,'SHIELD',MAGE_INITIAL_EFFECTS.shieldDurationSec,basePower,skill.skillId,{remainingAbsorption:basePower,maxAbsorption:basePower,reflectRatio:MAGE_INITIAL_EFFECTS.shieldReflection,reflectOnAbsorbed:true});
      appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(player.id);
    } else if (['mago_truque_1','mago_truque_2','mago_truque_3','mago_nv1_1','mago_nv1_3','mago_nv2_1','mago_nv2_2','mago_nv3_1','mago_nv3_3'].includes(skill.skillId)) {
      for(const monster of targetsToDamage){
        const hits=skill.skillId==='mago_nv1_1'?MAGE_INITIAL_EFFECTS.missiles:1;
        for(let hit=1;hit<=hits;hit++){
          if(monster.isDead||player.isDead)break;
          const previousHp=monster.currentHp;
          monster.takeDamage(splitMagePower(finalPower,hit,hits),player);
          const damage=Math.max(0,previousHp-monster.currentHp);
          totalEffectiveDamageOrHeal+=damage;
          if(!affectedEntityIds.includes(monster.id))affectedEntityIds.push(monster.id);
          targetResults.push({targetId:monster.id,impactPosition:cloneVector3(monster.position),effectiveDamage:damage,effectiveHeal:0,remainingHp:monster.currentHp,maxHp:monster.maxHp,isDead:monster.isDead,isCritical});
          if(monster.isDead){this.handleMonsterDeath(monster,player);break;}
        }
        if(!monster.isDead && !player.isDead && skill.skillId==='mago_truque_2'){
          const status=this.applySkillStatus(player,monster,'FROST_SLOW',MAGE_INITIAL_EFFECTS.frostDurationSec,MAGE_INITIAL_EFFECTS.frostSlow,skill.skillId);
          appliedStatuses.push(this.toCombatStatusPayload(status));
        }
        if(!monster.isDead&&!player.isDead&&['mago_nv2_1','mago_nv3_3'].includes(skill.skillId)){
          const duration=skill.skillId==='mago_nv3_3'?MAGE_ULTIMATE_EFFECTS.stasisFreezeSec:MAGE_SECOND_CIRCLE_EFFECTS.freezeDurationSec;
          if((monster.getStatus('FROZEN')?.remainingSec??0)<duration){
            const status=this.applySkillStatus(player,monster,'FROZEN',duration,1,skill.skillId);
            appliedStatuses.push(this.toCombatStatusPayload(status));
          }
        }
        if(!monster.isDead && !player.isDead && skill.skillId==='mago_nv1_3'){
          const totalPower=Math.round(Math.round(player.attributes.inteligencia*MAGE_INITIAL_EFFECTS.burnCoefficient)*upgradeMultiplier*player.getDamageMultiplier());
          const status=this.applySkillStatus(player,monster,'BURN',MAGE_INITIAL_EFFECTS.burnDurationSec,totalPower,skill.skillId,{periodic:{elapsedSec:0,pulsesDone:0,totalPower}});
          appliedStatuses.push(this.toCombatStatusPayload(status));
        }
      }
    } else if (skill.classType === CharacterClass.BRUXO) {
      if(skill.skillId==='bruxo_nv1_1'&&singleTargetMonster){
        for(const monster of this.entityManager.getAllMonsters()){const old=monster.getStatus('HEXED');if(old?.sourceEntityId===player.id){monster.removeStatus(old.statusId);this.broadcastStatusTransition('EXPIRED',old);}}
        const curse=this.applySkillStatus(player,singleTargetMonster,'HEXED',WARLOCK_EFFECTS.hexSec,WARLOCK_EFFECTS.hexBonus*upgradeMultiplier,skill.skillId);
        const healing=Math.round(player.maxHp*WARLOCK_EFFECTS.hexHealFraction*upgradeMultiplier);
        const regeneration=this.applySkillStatus(player,player,'HEX_REGEN',WARLOCK_EFFECTS.hexSec,healing,skill.skillId,{periodic:{elapsedSec:0,pulsesDone:0,totalPower:0,totalHealing:healing,targetId:singleTargetMonster.id},areaCenter:cloneVector3(player.position)});
        appliedStatuses.push(this.toCombatStatusPayload(curse),this.toCombatStatusPayload(regeneration));affectedEntityIds.push(singleTargetMonster.id,player.id);
      }else if(skill.skillId==='bruxo_nv1_2'){
        const retaliation=Math.round(player.attributes.carisma*WARLOCK_EFFECTS.retaliationCoefficient*upgradeMultiplier);
        const status=this.applySkillStatus(player,player,'SHIELD',WARLOCK_EFFECTS.armorSec,basePower,skill.skillId,{remainingAbsorption:basePower,maxAbsorption:basePower,reflectFlat:retaliation,reflectOnAbsorbed:true});
        appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(player.id);
      }else if(skill.skillId==='bruxo_nv2_1'||skill.skillId==='bruxo_nv3_2'){
        const hunger=skill.skillId==='bruxo_nv2_1';
        const status=this.applySkillStatus(player,player,hunger?'HADAR_HUNGER':'DEMON_PRESENCE',hunger?WARLOCK_EFFECTS.hungerSec:WARLOCK_EFFECTS.demonSec,finalPower,skill.skillId,{areaCenter:cloneVector3(resolvedCenter),radius:skill.aoeRadius,periodic:{elapsedSec:0,pulsesDone:0,totalPower:finalPower}});
        appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(player.id);this.syncWarlockZones();
      }else{
        if(mistDestination){player.position=cloneVector3(mistDestination);player.headingYaw=resolvedDirection;player.stopMoving();this.spatialGrid.updateEntity(player);affectedEntityIds.push(player.id);}
        const primary=skill.skillId==='bruxo_nv3_3'?[...targetsToDamage].sort((a,b)=>a.id===targetId?-1:b.id===targetId?1:distanceSquared(a.position,resolvedCenter)-distanceSquared(b.position,resolvedCenter)||a.id.localeCompare(b.id))[0]:undefined;
        if(primary)resolvedTargetId=primary.id;
        const splashBase=Math.round((6+player.level*4+player.attributes.carisma*WARLOCK_EFFECTS.agonySplashCoefficient)*upgradeMultiplier);
        const splashPower=Math.round((isCritical?Math.round(splashBase*1.5):splashBase)*player.getDamageMultiplier());
        for(const monster of targetsToDamage){
          if(monster.isDead||player.isDead)continue;
          if(skill.skillId==='bruxo_nv3_1'){monster.position=cloneVector3(resolvedCenter);monster.velocity=createVector3(0,0,0);monster.isMoving=false;this.spatialGrid.updateEntity(monster);}
          const hp=monster.currentHp;monster.takeDamage(skill.skillId==='bruxo_nv3_3'&&monster!==primary?splashPower:finalPower,player);
          const damage=Math.max(0,hp-monster.currentHp);affectedEntityIds.push(monster.id);totalEffectiveDamageOrHeal+=damage;
          targetResults.push({targetId:monster.id,impactPosition:cloneVector3(monster.position),effectiveDamage:damage,effectiveHeal:0,remainingHp:monster.currentHp,maxHp:monster.maxHp,isDead:monster.isDead,isCritical});
          if(skill.skillId==='bruxo_nv2_2'){
            const heal=player.heal(Math.floor(damage*.5));affectedEntityIds.push(player.id);totalEffectiveDamageOrHeal+=heal;
            targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal:heal,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:player.isDead,isCritical:false});
          }
          if(monster.isDead){this.handleMonsterDeath(monster,player);continue;}if(player.isDead)continue;
          if(skill.skillId==='bruxo_truque_2')appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'HEAL_REDUCTION',WARLOCK_EFFECTS.woundSec,WARLOCK_EFFECTS.woundReduction,skill.skillId)));
          if(skill.skillId==='bruxo_truque_3'){
            const power=Math.round(player.attributes.carisma*WARLOCK_EFFECTS.plagueCoefficient*upgradeMultiplier*player.getDamageMultiplier());
            appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'DARK_PLAGUE',WARLOCK_EFFECTS.plagueSec,power,skill.skillId,{periodic:{elapsedSec:0,pulsesDone:0,totalPower:power}})));
          }
          if(skill.skillId==='bruxo_nv1_3'&&(monster.getStatus('ROOT')?.remainingSec??0)<WARLOCK_EFFECTS.rootSec)appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'ROOT',WARLOCK_EFFECTS.rootSec,1,skill.skillId)));
        }
      }
    } else if (skill.classType === CharacterClass.MONGE) {
      if (skill.skillId === 'monge_nv1_2') {
        const status=this.applySkillStatus(player,player,'WIND_STEP',MONK_EFFECTS.windSec,MONK_EFFECTS.dodgeBonus,skill.skillId);
        appliedStatuses.push(this.toCombatStatusPayload(status)); affectedEntityIds.push(player.id);
      } else if (skill.skillId === 'monge_nv1_3') {
        const heal=player.heal(basePower); totalEffectiveDamageOrHeal=heal; affectedEntityIds.push(player.id);
        targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal:heal,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:false,isCritical:false});
      } else if (skill.skillId === 'monge_nv3_3') {
        const healing=Math.round(player.maxHp*MONK_EFFECTS.domeHealFraction*upgradeMultiplier);
        const status=this.applySkillStatus(player,player,'ZEN_DOME',MONK_EFFECTS.domeSec,finalPower,skill.skillId,{areaCenter:cloneVector3(resolvedCenter),radius:skill.aoeRadius??6,periodic:{elapsedSec:0,pulsesDone:0,totalPower:finalPower,totalHealing:healing}});
        appliedStatuses.push(this.toCombatStatusPayload(status)); affectedEntityIds.push(player.id); this.syncMonkZones();
      } else if (getMonkStrikes(skill.skillId) && singleTargetMonster) {
        const spec=getMonkStrikes(skill.skillId)!;
        const status=this.applySkillStatus(player,player,skill.skillId==='monge_truque_1'?'CHI_PALMS':'FLURRY',spec.pulses*spec.intervalSec,finalPower,skill.skillId,{areaCenter:cloneVector3(singleTargetMonster.position),periodic:{elapsedSec:0,pulsesDone:0,totalPower:finalPower,targetId:singleTargetMonster.id,isCritical}});
        appliedStatuses.push(this.toCombatStatusPayload(status)); affectedEntityIds.push(player.id);
      } else {
        for (const monster of targetsToDamage) {
          const hits=skill.skillId==='monge_nv2_3'?MONK_EFFECTS.shadowHits:1;
          for (let hit=1;hit<=hits;hit++) {
            if (monster.isDead||player.isDead) break;
            const hp=monster.currentHp; monster.takeDamage(splitMagePower(finalPower,hit,hits),player);
            const damage=Math.max(0,hp-monster.currentHp); totalEffectiveDamageOrHeal+=damage;
            if (!affectedEntityIds.includes(monster.id)) affectedEntityIds.push(monster.id);
            targetResults.push({targetId:monster.id,impactPosition:cloneVector3(monster.position),effectiveDamage:damage,effectiveHeal:0,remainingHp:monster.currentHp,maxHp:monster.maxHp,isDead:monster.isDead,isCritical});
            if (monster.isDead) { this.handleMonsterDeath(monster,player); break; }
          }
          if (monster.isDead||player.isDead) continue;
          if (skill.skillId==='monge_truque_3') appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'ATTACK_SLOW',MONK_EFFECTS.attackSlowSec,MONK_EFFECTS.attackSlow,skill.skillId)));
          if (skill.skillId==='monge_nv2_1' && (monster.getStatus('STUN')?.remainingSec??0)<MONK_EFFECTS.stunSec) appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'STUN',MONK_EFFECTS.stunSec,1,skill.skillId)));
        }
        if (skill.skillId==='monge_nv3_2'&&!player.isDead) {
          const status=this.applySkillStatus(player,player,'DRAGON_STRIDE',MONK_EFFECTS.strideSec,MONK_EFFECTS.strideBonus,skill.skillId);
          appliedStatuses.push(this.toCombatStatusPayload(status)); affectedEntityIds.push(player.id);
        }
      }
    } else if (skill.classType === CharacterClass.ARQUEIRO) {
      if (skill.skillId === 'arqueiro_nv2_3') {
        for (const type of ['STEALTH','AMBUSH_CRITICAL','EVASION_READY'] as const) {
          appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,player,type,ARCHER_EFFECTS.stealthSec,1,skill.skillId)));
        }
        affectedEntityIds.push(player.id);
      } else if (skill.skillId === 'arqueiro_nv1_1' && singleTargetMonster) {
        const status = this.applySkillStatus(player,singleTargetMonster,'HUNTERS_MARK',ARCHER_EFFECTS.markSec,ARCHER_EFFECTS.markBonus*upgradeMultiplier,skill.skillId);
        appliedStatuses.push(this.toCombatStatusPayload(status)); affectedEntityIds.push(singleTargetMonster.id);
      } else if (getArcherVolley(skill.skillId) && singleTargetMonster) {
        const spec = getArcherVolley(skill.skillId)!;
        const status = this.applySkillStatus(player,player,skill.skillId==='arqueiro_nv3_2'?'STORM_BARRAGE':'ARROW_VOLLEY',spec.pulses*spec.intervalSec,finalPower,skill.skillId,{areaCenter:cloneVector3(singleTargetMonster.position),periodic:{elapsedSec:0,pulsesDone:0,totalPower:finalPower,targetId:singleTargetMonster.id,isCritical}});
        appliedStatuses.push(this.toCombatStatusPayload(status)); affectedEntityIds.push(player.id);
      } else if (skill.skillId === 'arqueiro_nv3_3') {
        const status = this.applySkillStatus(player,player,'ASTRAL_GUARDIAN',ARCHER_EFFECTS.guardianSec,finalPower,skill.skillId,{areaCenter:cloneVector3(resolvedCenter),radius:skill.aoeRadius??6,periodic:{elapsedSec:0,pulsesDone:0,totalPower:finalPower}});
        appliedStatuses.push(this.toCombatStatusPayload(status)); affectedEntityIds.push(player.id);
      } else {
        for (const monster of targetsToDamage) {
          if (monster.isDead || player.isDead) continue;
          const previousHp = monster.currentHp; monster.takeDamage(finalPower,player);
          const damage = Math.max(0,previousHp-monster.currentHp);
          totalEffectiveDamageOrHeal += damage; affectedEntityIds.push(monster.id);
          targetResults.push({targetId:monster.id,impactPosition:cloneVector3(monster.position),effectiveDamage:damage,effectiveHeal:0,remainingHp:monster.currentHp,maxHp:monster.maxHp,isDead:monster.isDead,isCritical});
          if (monster.isDead) { this.handleMonsterDeath(monster,player); continue; }
          if (player.isDead) continue;
          if (skill.skillId === 'arqueiro_truque_2') {
            const power = Math.round(player.attributes.destreza*ARCHER_EFFECTS.poisonCoefficient*upgradeMultiplier*player.getDamageMultiplier());
            appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'POISON',ARCHER_EFFECTS.poisonSec,power,skill.skillId,{periodic:{elapsedSec:0,pulsesDone:0,totalPower:power}})));
          } else if (skill.skillId === 'arqueiro_truque_3') {
            appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'CRIPPLED',ARCHER_EFFECTS.slowSec,ARCHER_EFFECTS.slow,skill.skillId)));
          } else if (skill.skillId === 'arqueiro_nv1_3' && (monster.getStatus('ROOT')?.remainingSec??0) < ARCHER_EFFECTS.rootSec) {
            appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'ROOT',ARCHER_EFFECTS.rootSec,1,skill.skillId)));
          }
        }
      }
    } else if (skill.skillId === 'guerreiro_truque_1' || skill.skillId === 'guerreiro_1') {
      // Golpe Firme: 1.35x STR + restaura 5 de Energia ao acertar
      if (singleTargetMonster && !singleTargetMonster.isDead) {
        const wasAlive = !singleTargetMonster.isDead;
        const dmgRes = singleTargetMonster.takeDamage(finalPower, player);
        player.restoreResource(5); // Restaura 5 de Energia autoritativa

        affectedEntityIds.push(singleTargetMonster.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;
        targetResults.push({
          targetId: singleTargetMonster.id,
          impactPosition: cloneVector3(singleTargetMonster.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: singleTargetMonster.currentHp,
          maxHp: singleTargetMonster.maxHp,
          isDead: singleTargetMonster.isDead,
          isCritical,
        });

        if (wasAlive && singleTargetMonster.isDead) {
          this.handleMonsterDeath(singleTargetMonster, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_truque_2') {
      // Golpe Dilacerante: dano imediato + Sangramento por 3s
      if (singleTargetMonster && !singleTargetMonster.isDead) {
        const wasAlive = !singleTargetMonster.isDead;
        const dmgRes = singleTargetMonster.takeDamage(finalPower, player);

        affectedEntityIds.push(singleTargetMonster.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;
        targetResults.push({
          targetId: singleTargetMonster.id,
          impactPosition: cloneVector3(singleTargetMonster.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: singleTargetMonster.currentHp,
          maxHp: singleTargetMonster.maxHp,
          isDead: singleTargetMonster.isDead,
          isCritical,
        });

        if (!singleTargetMonster.isDead) {
          const bleedStatus: ActiveCombatStatus = {
            statusId: `status_${Date.now()}_${++this.statusSequence}`,
            type: 'BLEED',
            skillId: skill.skillId,
            sourceEntityId: player.id,
            targetEntityId: singleTargetMonster.id,
            durationSec: 3.0,
            remainingSec: 3.0,
            expiresAtTick: this.currentTick + Math.round(3.0 * SERVER_CONFIG.TICK_RATE),
            magnitude: Math.max(1, Math.round((player.attributes.forca * 0.35 + player.level) * upgradeMultiplier)),
            nextTickSec: 1.0,
          };
          singleTargetMonster.addStatus(bleedStatus);
          appliedStatuses.push(this.toCombatStatusPayload(bleedStatus));
          this.broadcastStatusTransition('APPLIED', bleedStatus);
        }

        if (wasAlive && singleTargetMonster.isDead) {
          this.handleMonsterDeath(singleTargetMonster, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_truque_3') {
      // Corte de Ruptura: dano imediato + Quebra de Armadura por 5s (-15% defesa)
      if (singleTargetMonster && !singleTargetMonster.isDead) {
        const wasAlive = !singleTargetMonster.isDead;
        const dmgRes = singleTargetMonster.takeDamage(finalPower, player);

        affectedEntityIds.push(singleTargetMonster.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;
        targetResults.push({
          targetId: singleTargetMonster.id,
          impactPosition: cloneVector3(singleTargetMonster.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: singleTargetMonster.currentHp,
          maxHp: singleTargetMonster.maxHp,
          isDead: singleTargetMonster.isDead,
          isCritical,
        });

        if (!singleTargetMonster.isDead) {
          const armorStatus: ActiveCombatStatus = {
            statusId: `status_${Date.now()}_${++this.statusSequence}`,
            type: 'ARMOR_BREAK',
            skillId: skill.skillId,
            sourceEntityId: player.id,
            targetEntityId: singleTargetMonster.id,
            durationSec: 5.0,
            remainingSec: 5.0,
            expiresAtTick: this.currentTick + Math.round(5.0 * SERVER_CONFIG.TICK_RATE),
            magnitude: 0.15,
          };
          singleTargetMonster.addStatus(armorStatus);
          appliedStatuses.push(this.toCombatStatusPayload(armorStatus));
          this.broadcastStatusTransition('APPLIED', armorStatus);
        }

        if (wasAlive && singleTargetMonster.isDead) {
          this.handleMonsterDeath(singleTargetMonster, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_nv1_1' || skill.skillId === 'guerreiro_2') {
      // Retomar o Fôlego: Cura marcial no Guerreiro (1.6x STR + 2x Nível)
      const effectiveHeal = player.heal(finalPower);
      affectedEntityIds.push(player.id);
      totalEffectiveDamageOrHeal = effectiveHeal;

      targetResults.push({
        targetId: player.id,
        impactPosition: cloneVector3(player.position),
        effectiveDamage: 0,
        effectiveHeal,
        remainingHp: player.currentHp,
        maxHp: player.maxHp,
        isDead: false,
        isCritical: false,
      });
    } else if (skill.skillId === 'guerreiro_nv1_2') {
      // Postura Ofensiva: golpe de investida + +25% velocidade de ataque por 6s
      if (singleTargetMonster && !singleTargetMonster.isDead) {
        const wasAlive = !singleTargetMonster.isDead;
        const dmgRes = singleTargetMonster.takeDamage(finalPower, player);

        affectedEntityIds.push(singleTargetMonster.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;
        targetResults.push({
          targetId: singleTargetMonster.id,
          impactPosition: cloneVector3(singleTargetMonster.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: singleTargetMonster.currentHp,
          maxHp: singleTargetMonster.maxHp,
          isDead: singleTargetMonster.isDead,
          isCritical,
        });

        const hasteStatus: ActiveCombatStatus = {
          statusId: `status_${Date.now()}_${++this.statusSequence}`,
          type: 'ATTACK_SPEED_BUFF',
          skillId: skill.skillId,
          sourceEntityId: player.id,
          targetEntityId: player.id,
          durationSec: 6.0,
          remainingSec: 6.0,
          expiresAtTick: this.currentTick + Math.round(6.0 * SERVER_CONFIG.TICK_RATE),
          magnitude: 0.25,
        };
        player.addStatus(hasteStatus);
        appliedStatuses.push(this.toCombatStatusPayload(hasteStatus));
        this.broadcastStatusTransition('APPLIED', hasteStatus);

        if (wasAlive && singleTargetMonster.isDead) {
          this.handleMonsterDeath(singleTargetMonster, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_nv1_3') {
      // Escudo Desarmador: dano + atordoamento por 1.5s
      if (singleTargetMonster && !singleTargetMonster.isDead) {
        const wasAlive = !singleTargetMonster.isDead;
        const dmgRes = singleTargetMonster.takeDamage(finalPower, player);

        affectedEntityIds.push(singleTargetMonster.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;
        targetResults.push({
          targetId: singleTargetMonster.id,
          impactPosition: cloneVector3(singleTargetMonster.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: singleTargetMonster.currentHp,
          maxHp: singleTargetMonster.maxHp,
          isDead: singleTargetMonster.isDead,
          isCritical,
        });

        if (!singleTargetMonster.isDead) {
          const stunStatus: ActiveCombatStatus = {
            statusId: `status_${Date.now()}_${++this.statusSequence}`,
            type: 'STUN',
            skillId: skill.skillId,
            sourceEntityId: player.id,
            targetEntityId: singleTargetMonster.id,
            durationSec: 1.5,
            remainingSec: 1.5,
            expiresAtTick: this.currentTick + Math.round(1.5 * SERVER_CONFIG.TICK_RATE),
            magnitude: 1.0,
          };
          singleTargetMonster.addStatus(stunStatus);
          appliedStatuses.push(this.toCombatStatusPayload(stunStatus));
          this.broadcastStatusTransition('APPLIED', stunStatus);
        }

        if (wasAlive && singleTargetMonster.isDead) {
          this.handleMonsterDeath(singleTargetMonster, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_nv2_1' || skill.skillId === 'guerreiro_3') {
      // Redemoinho de Aço: giro devastador 360° em 5m
      for (const m of targetsToDamage) {
        const wasAlive = !m.isDead;
        const dmgRes = m.takeDamage(finalPower, player);
        affectedEntityIds.push(m.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;

        targetResults.push({
          targetId: m.id,
          impactPosition: cloneVector3(m.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: m.currentHp,
          maxHp: m.maxHp,
          isDead: m.isDead,
          isCritical,
        });

        if (wasAlive && m.isDead) {
          this.handleMonsterDeath(m, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_nv2_2') {
      // Baluarte Inquebrável: absorve 30% HP Máximo por 6s e reflete 20% do dano
      const shieldValue = Math.round(player.maxHp * 0.30 * upgradeMultiplier);
      const shieldStatus: ActiveCombatStatus = {
        statusId: `status_${Date.now()}_${++this.statusSequence}`,
        type: 'SHIELD',
        skillId: skill.skillId,
        sourceEntityId: player.id,
        targetEntityId: player.id,
        durationSec: 6.0,
        remainingSec: 6.0,
        expiresAtTick: this.currentTick + Math.round(6.0 * SERVER_CONFIG.TICK_RATE),
        magnitude: shieldValue,
        remainingAbsorption: shieldValue,
        maxAbsorption: shieldValue,
        reflectRatio: 0.20,
      };

      player.addStatus(shieldStatus);
      affectedEntityIds.push(player.id);
      appliedStatuses.push(this.toCombatStatusPayload(shieldStatus));
      this.broadcastStatusTransition('APPLIED', shieldStatus);
      totalEffectiveDamageOrHeal = shieldValue;

      targetResults.push({
        targetId: player.id,
        impactPosition: cloneVector3(player.position),
        effectiveDamage: 0,
        effectiveHeal: 0,
        shieldGranted: shieldValue,
        remainingHp: player.currentHp,
        maxHp: player.maxHp,
        isDead: false,
        isCritical: false,
      });
    } else if (skill.skillId === 'guerreiro_nv2_3') {
      // Golpe Colossal: dano em linha + empurrão de 1.5m
      const dirRad = (resolvedDirection * Math.PI) / 180;
      const pushX = Math.sin(dirRad) * 1.5;
      const pushZ = Math.cos(dirRad) * 1.5;

      for (const m of targetsToDamage) {
        const wasAlive = !m.isDead;
        const dmgRes = m.takeDamage(finalPower, player);
        affectedEntityIds.push(m.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;

        if (!m.isDead) {
          m.position.x = Math.max(SERVER_CONFIG.MAP_BOUNDS.minX,Math.min(SERVER_CONFIG.MAP_BOUNDS.maxX,m.position.x+pushX));
          m.position.z = Math.max(SERVER_CONFIG.MAP_BOUNDS.minZ,Math.min(SERVER_CONFIG.MAP_BOUNDS.maxZ,m.position.z+pushZ));
          this.spatialGrid.updateEntity(m);
        }

        targetResults.push({
          targetId: m.id,
          impactPosition: cloneVector3(m.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: m.currentHp,
          maxHp: m.maxHp,
          isDead: m.isDead,
          isCritical,
        });

        if (wasAlive && m.isDead) {
          this.handleMonsterDeath(m, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_nv3_1' || skill.skillId === 'guerreiro_4') {
      // Avatar da Guerra: dano em 7m + amplia dano em 30% por 10s
      for (const m of targetsToDamage) {
        const wasAlive = !m.isDead;
        const dmgRes = m.takeDamage(finalPower, player);
        affectedEntityIds.push(m.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;

        targetResults.push({
          targetId: m.id,
          impactPosition: cloneVector3(m.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: m.currentHp,
          maxHp: m.maxHp,
          isDead: m.isDead,
          isCritical,
        });

        if (wasAlive && m.isDead) {
          this.handleMonsterDeath(m, player);
        }
      }

      const avatarStatus: ActiveCombatStatus = {
        statusId: `status_${Date.now()}_${++this.statusSequence}`,
        type: 'DAMAGE_BUFF',
        skillId: skill.skillId,
        sourceEntityId: player.id,
        targetEntityId: player.id,
        durationSec: 10.0,
        remainingSec: 10.0,
        expiresAtTick: this.currentTick + Math.round(10.0 * SERVER_CONFIG.TICK_RATE),
        magnitude: 0.30,
      };
      player.addStatus(avatarStatus);
      appliedStatuses.push(this.toCombatStatusPayload(avatarStatus));
      this.broadcastStatusTransition('APPLIED', avatarStatus);
    } else if (skill.skillId === 'guerreiro_nv3_2') {
      // Lâmina do Julgamento: espada celestial que cai sobre o centro autorizado em 5m
      for (const m of targetsToDamage) {
        const wasAlive = !m.isDead;
        const dmgRes = m.takeDamage(finalPower, player);
        affectedEntityIds.push(m.id);
        totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;

        targetResults.push({
          targetId: m.id,
          impactPosition: cloneVector3(m.position),
          effectiveDamage: dmgRes.effectiveDamage,
          effectiveHeal: 0,
          remainingHp: m.currentHp,
          maxHp: m.maxHp,
          isDead: m.isDead,
          isCritical,
        });

        if (wasAlive && m.isDead) {
          this.handleMonsterDeath(m, player);
        }
      }
    } else if (skill.skillId === 'guerreiro_nv3_3') {
      // Última Resistência Imortal: imunidade contra morte por 5s, cura 40% HP e ondas de fogo marcial em 4m
      const healAmount = Math.round(player.maxHp * 0.40 * upgradeMultiplier);
      const effectiveHeal = player.heal(healAmount);
      totalEffectiveDamageOrHeal = effectiveHeal;
      affectedEntityIds.push(player.id);

      const immortalStatus: ActiveCombatStatus = {
        statusId: `status_${Date.now()}_${++this.statusSequence}`,
        type: 'DEATH_IMMUNITY',
        skillId: skill.skillId,
        sourceEntityId: player.id,
        targetEntityId: player.id,
        durationSec: 5.0,
        remainingSec: 5.0,
        expiresAtTick: this.currentTick + Math.round(5.0 * SERVER_CONFIG.TICK_RATE),
        magnitude: 1.0,
      };
      player.addStatus(immortalStatus);
      appliedStatuses.push(this.toCombatStatusPayload(immortalStatus));
      this.broadcastStatusTransition('APPLIED', immortalStatus);

      targetResults.push({
        targetId: player.id,
        impactPosition: cloneVector3(player.position),
        effectiveDamage: 0,
        effectiveHeal,
        remainingHp: player.currentHp,
        maxHp: player.maxHp,
        isDead: false,
        isCritical: false,
      });

      // Onda de fogo marcial em 4m
      const waveDmg = Math.round((player.attributes.forca * 2.0 + player.attributes.constituicao * 1.0) * upgradeMultiplier * player.getDamageMultiplier());
      const monsters = this.entityManager.getAllMonsters();
      for (const m of monsters) {
        if (!m.isDead && distanceSquared(player.position, m.position) <= 16.0) {
          const wasAlive = !m.isDead;
          const dmgRes = m.takeDamage(waveDmg, player);
          totalEffectiveDamageOrHeal+=dmgRes.effectiveDamage;
          affectedEntityIds.push(m.id);
          targetResults.push({
            targetId: m.id,
            impactPosition: cloneVector3(m.position),
            effectiveDamage: dmgRes.effectiveDamage,
            effectiveHeal: 0,
            remainingHp: m.currentHp,
            maxHp: m.maxHp,
            isDead: m.isDead,
            isCritical: false,
          });

          if (wasAlive && m.isDead) {
            this.handleMonsterDeath(m, player);
          }
        }
      }
    } else if (skill.skillId === 'clerigo_nv1_2') {
      for (const type of ['DAMAGE_BUFF', 'DAMAGE_REDUCTION', 'CRITICAL_BUFF'] as const) {
        const status: ActiveCombatStatus = {statusId:`status_${Date.now()}_${++this.statusSequence}`,type,skillId:skill.skillId,sourceEntityId:player.id,targetEntityId:player.id,durationSec:8,remainingSec:8,expiresAtTick:this.currentTick+8*SERVER_CONFIG.TICK_RATE,magnitude:0.2};
        player.addStatus(status);appliedStatuses.push(this.toCombatStatusPayload(status));this.broadcastStatusTransition('APPLIED',status);
      }
      affectedEntityIds.push(player.id);
      targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal:0,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:false,isCritical:false});
    } else if (skill.skillId === 'barbaro_nv1_1') {
      // Fúria Primitiva: os bônus já descritos no catálogo, com duração autoritativa.
      for (const [type, magnitude] of [['DAMAGE_BUFF', 0.25], ['DAMAGE_REDUCTION', 0.15]] as const) {
        const status: ActiveCombatStatus = { statusId: `status_${Date.now()}_${++this.statusSequence}`, type, skillId:skill.skillId, sourceEntityId:player.id, targetEntityId:player.id, durationSec:6, remainingSec:6, expiresAtTick:this.currentTick + 6 * SERVER_CONFIG.TICK_RATE, magnitude };
        player.addStatus(status); appliedStatuses.push(this.toCombatStatusPayload(status)); this.broadcastStatusTransition('APPLIED', status);
      }
      affectedEntityIds.push(player.id);
      targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal:0,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:false,isCritical:false});
    } else if (player.classType===CharacterClass.BARBARO) {
      if(skill.skillId==='barbaro_nv3_3'){
        const status=this.applySkillStatus(player,player,'SPECTRAL_PACK',MARTIAL_EFFECTS.packSec,finalPower,skill.skillId,{radius:MARTIAL_EFFECTS.packRadius,periodic:{elapsedSec:0,pulsesDone:0,totalPower:finalPower}});
        appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(player.id);
      }else if(skill.skillId==='barbaro_nv2_2'){
        const heal=player.heal(basePower);totalEffectiveDamageOrHeal=heal;affectedEntityIds.push(player.id);
        const status=this.applySkillStatus(player,player,'STONE_SKIN',MARTIAL_EFFECTS.stoneSec,MARTIAL_EFFECTS.stoneReduction,skill.skillId);appliedStatuses.push(this.toCombatStatusPayload(status));
        targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal:heal,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:false,isCritical:false});
      }else{
        if(skill.skillId==='barbaro_nv1_3'&&singleTargetMonster){
          const dx=singleTargetMonster.position.x-player.position.x,dz=singleTargetMonster.position.z-player.position.z,d=Math.hypot(dx,dz);
          if(d>1.5){const travel=d-1.5;player.position.x=Math.max(SERVER_CONFIG.MAP_BOUNDS.minX,Math.min(SERVER_CONFIG.MAP_BOUNDS.maxX,player.position.x+dx/d*travel));player.position.z=Math.max(SERVER_CONFIG.MAP_BOUNDS.minZ,Math.min(SERVER_CONFIG.MAP_BOUNDS.maxZ,player.position.z+dz/d*travel));player.headingYaw=Math.atan2(dx,dz)*180/Math.PI;player.stopMoving();this.spatialGrid.updateEntity(player);}
        }
        if(skill.skillId==='barbaro_nv2_3'){player.headingYaw=Math.atan2(resolvedCenter.x-castOrigin.x,resolvedCenter.z-castOrigin.z)*180/Math.PI;player.position=createVector3(resolvedCenter.x,0,resolvedCenter.z);player.stopMoving();this.spatialGrid.updateEntity(player);}
        for(const monster of targetsToDamage){
          if(player.isDead)break;
          if(monster.isDead)continue;
          if(skill.skillId==='barbaro_nv1_2'){
            const status=this.applySkillStatus(player,monster,'WEAKENED',MARTIAL_EFFECTS.roarSec,Math.min(.5,MARTIAL_EFFECTS.weakness*upgradeMultiplier),skill.skillId);appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(monster.id);continue;
          }
          const power=skill.skillId==='barbaro_nv3_2'&&monster.currentHp/monster.maxHp<.3?finalPower*2:finalPower;
          const previousHp=monster.currentHp;monster.takeDamage(power,player);const damage=Math.max(0,previousHp-monster.currentHp);
          totalEffectiveDamageOrHeal+=damage;affectedEntityIds.push(monster.id);
          targetResults.push({targetId:monster.id,impactPosition:cloneVector3(monster.position),effectiveDamage:damage,effectiveHeal:0,remainingHp:monster.currentHp,maxHp:monster.maxHp,isDead:monster.isDead,isCritical});
          if(skill.skillId==='barbaro_truque_3'){
            const heal=player.heal(Math.floor(damage*.2));totalEffectiveDamageOrHeal+=heal;affectedEntityIds.push(player.id);
            targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal:heal,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:false,isCritical:false});
          }
          if(monster.isDead){this.handleMonsterDeath(monster,player);continue;}
          if(skill.skillId==='barbaro_truque_2')appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'CRIPPLED',MARTIAL_EFFECTS.slowSec,MARTIAL_EFFECTS.slow,skill.skillId)));
          if(skill.skillId==='barbaro_nv1_3')appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'STUN',MARTIAL_EFFECTS.stunSec,1,skill.skillId)));
          if(skill.skillId==='barbaro_nv2_1'){
            const magnitude=Math.max(1,Math.round((player.attributes.forca*.35+player.level)*upgradeMultiplier*player.getDamageMultiplier()));
            appliedStatuses.push(this.toCombatStatusPayload(this.applySkillStatus(player,monster,'BLEED',MARTIAL_EFFECTS.bleedSec,magnitude,skill.skillId)));
          }
        }
        if(skill.skillId==='barbaro_nv3_1'&&!player.isDead){const status=this.applySkillStatus(player,player,'UNBRIDLED_RAGE',MARTIAL_EFFECTS.freeResourceSec,1,skill.skillId);appliedStatuses.push(this.toCombatStatusPayload(status));affectedEntityIds.push(player.id);}
      }
    } else if (skill.skillId === 'clerigo_nv3_2') {
      const effectiveHeal=player.heal(player.maxHp);
      affectedEntityIds.push(player.id);
      totalEffectiveDamageOrHeal=effectiveHeal;
      targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:false,isCritical:false});
      for(const monster of targetsToDamage){
        const wasAlive=!monster.isDead;
        const previousHp=monster.currentHp;
        monster.takeDamage(finalPower,player);
        const damage=Math.max(0,previousHp-monster.currentHp);
        affectedEntityIds.push(monster.id);totalEffectiveDamageOrHeal+=damage;
        targetResults.push({targetId:monster.id,impactPosition:cloneVector3(monster.position),effectiveDamage:damage,effectiveHeal:0,remainingHp:monster.currentHp,maxHp:monster.maxHp,isDead:monster.isDead,isCritical});
        if(wasAlive&&monster.isDead)this.handleMonsterDeath(monster,player);
      }
    } else if (hybridAttack && singleTargetMonster) {
      const monster = singleTargetMonster;
      const wasAlive = !monster.isDead;
      const previousHp = monster.currentHp;
      monster.takeDamage(finalPower, player);
      const hpDamage = Math.max(0, previousHp - monster.currentHp);
      const healing = skill.skillId === 'bruxo_nv2_2' ? Math.floor(hpDamage * 0.5)
        : hpDamage > 0 ? Math.round(player.attributes.sabedoria * 0.5 * upgradeMultiplier) : 0;
      const effectiveHeal = player.heal(healing);
      affectedEntityIds.push(monster.id, player.id);
      totalEffectiveDamageOrHeal = hpDamage + effectiveHeal;
      targetResults.push({targetId:monster.id,impactPosition:cloneVector3(monster.position),effectiveDamage:hpDamage,effectiveHeal:0,remainingHp:monster.currentHp,maxHp:monster.maxHp,isDead:monster.isDead,isCritical});
      targetResults.push({targetId:player.id,impactPosition:cloneVector3(player.position),effectiveDamage:0,effectiveHeal,remainingHp:player.currentHp,maxHp:player.maxHp,isDead:false,isCritical:false});
      if (wasAlive && monster.isDead) this.handleMonsterDeath(monster, player);
    } else {
      // Fallback genérico para habilidades de outras classes
      if (skill.isHeal) {
        const effectiveHeal = player.heal(finalPower);
        affectedEntityIds.push(player.id);
        totalEffectiveDamageOrHeal = effectiveHeal;
        targetResults.push({
          targetId: player.id,
          impactPosition: cloneVector3(player.position),
          effectiveDamage: 0,
          effectiveHeal,
          remainingHp: player.currentHp,
          maxHp: player.maxHp,
          isDead: false,
          isCritical: false,
        });
      } else {
        for (const m of targetsToDamage) {
          const wasAlive = !m.isDead;
          const dmgRes = m.takeDamage(finalPower, player);
          affectedEntityIds.push(m.id);
          totalEffectiveDamageOrHeal += dmgRes.effectiveDamage;

          targetResults.push({
            targetId: m.id,
            impactPosition: cloneVector3(m.position),
            effectiveDamage: dmgRes.effectiveDamage,
            effectiveHeal: 0,
            remainingHp: m.currentHp,
            maxHp: m.maxHp,
            isDead: m.isDead,
            isCritical,
          });

          if (wasAlive && m.isDead) {
            this.handleMonsterDeath(m, player);
          }
        }
      }
    }

    if (skill.skillId === 'clerigo_nv1_3' && singleTargetMonster && !singleTargetMonster.isDead && targetResults.some(result=>result.targetId===singleTargetMonster!.id && result.effectiveDamage>0)) {
      const status: ActiveCombatStatus = {statusId:`status_${Date.now()}_${++this.statusSequence}`,type:'GUIDING_MARK',skillId:skill.skillId,sourceEntityId:player.id,targetEntityId:singleTargetMonster.id,durationSec:6,remainingSec:6,expiresAtTick:this.currentTick+6*SERVER_CONFIG.TICK_RATE,magnitude:1};
      singleTargetMonster.addStatus(status);appliedStatuses.push(this.toCombatStatusPayload(status));this.broadcastStatusTransition('APPLIED',status);
    }

    // Transmissão Autoritativa do Evento de Conjuração
    const castPayload: S2CSkillCastEventPayload = {
      castId,
      serverTick: this.currentTick,
      casterId: player.id,
      skillId: skill.skillId,
      slot: skill.slot,
      skillName: skill.name,
      category,
      geometry,
      coneRange:geometry==='CONE'?(skill.skillId==='monge_nv2_2'?MONK_EFFECTS.coneRange:MAGE_INITIAL_EFFECTS.coneRange):undefined,
      coneAngleDeg:geometry==='CONE'?(skill.skillId==='monge_nv2_2'?MONK_EFFECTS.coneAngleDeg:MAGE_INITIAL_EFFECTS.coneAngleDeg):undefined,
      originPosition: castOrigin,
      targetId: resolvedTargetId,
      targetPosition: resolvedCenter,
      headingYaw: resolvedDirection,
      radius: skill.aoeRadius,
      lineLength: category === 'AOE_LINE' ? skill.range : undefined,
      lineWidth: category === 'AOE_LINE' ? 3.0 : undefined,
      damageOrHeal: totalEffectiveDamageOrHeal,
      isHeal: skill.isHeal,
      isCritical,
      affectedEntityIds,
      targetResults,
      appliedStatuses,
      casterCurrentResource: Math.round(player.currentResource),
      casterMaxResource: player.maxResource,
      cooldownRemainingSec:player.getSkillCooldown(slot),
    };

    this.broadcast(Opcode.S2C_SKILL_CAST_EVENT, castPayload);
    return true;
  }

  /**
   * Equipa uma nova habilidade no Slot indicado (1 a 4) respeitando Classe e Nível
   */
  public equipPlayerSkill(player: Player, slot: number, skillId: string): boolean {
    if (slot < 1 || slot > 4) return false;

    const skill = SKILLS_DATABASE[skillId];
    if (!skill) {
      console.warn(`[World] equipPlayerSkill: Habilidade '${skillId}' não existe no banco.`);
      return false;
    }

    if (skill.classType !== player.classType) {
      console.warn(`[World] equipPlayerSkill: Tentativa de equipar skill de outra classe (${skill.classType} != ${player.classType})`);
      return false;
    }

    if (skill.slot !== slot) {
      console.warn(`[World] equipPlayerSkill: Slot incorreto (${skill.slot} != ${slot})`);
      return false;
    }

    if (player.level < skill.unlockLevel) {
      console.warn(`[World] equipPlayerSkill: Nível insuficiente (${player.level} < ${skill.unlockLevel})`);
      return false;
    }

    // Atualiza o slot equipado no player
    player.setEquippedSkill(slot, skillId);

    // Persiste no SQLite se o personagem já tiver ID de banco
    if (player.dbCharacterId) {
      this.db.updateCharacterSkills(player.dbCharacterId, player.equippedSkills);
    }

    // Envia confirmação via S2C_SKILLS_UPDATE para o cliente do jogador
    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_SKILLS_UPDATE, {
        equippedSkills: player.equippedSkills,
        skillLevels: player.skillLevels,
        message: `Habilidade '${skill.name}' equipada no Slot ${slot}!`,
      } as S2CSkillsUpdatePayload);
    }

    console.log(`[World] Player "${player.name}" equipou "${skill.name}" (${skillId}) no Slot ${slot}.`);
    return true;
  }

  private broadcastSnapshot(): void {
    const now = Date.now();

    for (const [_, conn] of this.connections) {
      if (!conn.isAuthenticated) continue;

      let entitiesToSend: Entity[];

      if (conn.playerId) {
        const player = this.entityManager.getPlayer(conn.playerId);
        if (player) {
          // AOI Partitioning: Only entities within visibility radius from player's spatial neighborhood
          const aoiEntities = this.spatialGrid.getEntitiesInAOI(player.position, SERVER_CONFIG.VISIBILITY_RADIUS);
          // Guarantee own player is always included
          if (!aoiEntities.some((e) => e.id === player.id)) {
            aoiEntities.push(player);
          }
          entitiesToSend = aoiEntities;
        } else {
          entitiesToSend = this.entityManager.getAllEntities();
        }
      } else {
        entitiesToSend = this.entityManager.getAllEntities();
      }

      const entitySnapshots: EntitySnapshotState[] = entitiesToSend.map((e) => e.toSnapshotState());
      const snapshotPayload: S2CWorldSnapshotPayload = {
        serverTick: this.currentTick,
        serverTimestamp: now,
        entities: entitySnapshots,
      };

      conn.send(Opcode.S2C_WORLD_SNAPSHOT, snapshotPayload);
    }
  }

  public broadcast<T>(op: Opcode, data: T, excludeConnectionId?: string): void {
    for (const [id, conn] of this.connections) {
      if (id !== excludeConnectionId && conn.isAuthenticated) {
        conn.send(op, data);
      }
    }
  }

  public handleMonsterDeath(monster: Monster, killer?: Player, devKill = false): void {
    const cleared = monster.clearAllStatuses();
    for (const st of cleared) {
      this.broadcastStatusTransition('CLEARED_ON_DEATH', st, {
        targetRemainingHp: 0,
        isTargetDead: true,
      });
    }

    if (devKill && monster.id === this.activeBossId) {
      this.bossTimerSec = 0;
      return;
    }
    if (monster.devTarget || (devKill && !monster.autoRespawns)) {
      this.removeDevTarget(monster);
      return;
    }
    if (devKill) return;
    // 0. Notifica DungeonManager se este monstro pertencia a uma masmorra ativa
    if (killer && killer instanceof Player) {
      this.dungeonManager.onMonsterKilled(monster.id, killer);
    }

    // 1. Authoritative Experience (EXP) & Level Up Progression
    if (killer && !killer.isDead && killer instanceof Player) {
      killer.huntSession.add('kills');
      const expReward = monster.expReward;
      if (this.partyManager) {
        this.partyManager.distributePartyExp(killer, expReward, this);
      } else {
        const progress = killer.addExperience(expReward);
        killer.huntSession.add('combatExp', expReward);
        this.db.savePlayer(killer);
        this.sendExpUpdate(killer, expReward, monster.name);

        if (progress.leveledUp) {
          this.handlePlayerLevelUp(killer);
        }
      }
    }

    // 2. Boss Defeat & Stage Progression
    const isBossDefeated = (this.isBossActive && monster.id === this.activeBossId) || monster.isBoss;
    if (isBossDefeated) {
      monster.autoRespawns = false;
      this.entityManager.removeMonster(monster.id);
      this.spatialGrid.removeEntity(monster.id);
      this.broadcast(Opcode.S2C_ENTITY_DESPAWN, {
        entityId: monster.id,
        reason: 'DEAD',
      } as S2CEntityDespawnPayload);

      for (const p of this.entityManager.getAllPlayers()) {
        if (p.targetId === monster.id) {
          p.targetId = null;
        }
      }

      if (this.isBossActive && monster.id === this.activeBossId) {
        this.isBossActive = false;
        this.activeBossId = null;
        this.activeBossName = '';
        this.isBossAvailable = false;
        this.isPortalOpen = true;
        this.stageKills = 1;
        for (const participant of this.entityManager.getAllPlayers()) {
          participant.unlockedWorld = Math.max(participant.unlockedWorld, this.currentWorld + 1);
          this.db.savePlayer(participant);
        }

        this.broadcast(Opcode.S2C_BOSS_EVENT, {
          eventType: 'VICTORY',
          bossName: monster.name,
          newWorld: this.currentWorld + 1,
          message: `🎉 O ${monster.name} foi DERROTADO! Você conquistou o Mundo ${this.currentWorld} (${this.getWorldName(this.currentWorld)})! O Portal Rúnico Dourado foi ABERTO no centro da arena!`,
        } as S2CBossEventPayload);

        this.broadcast(Opcode.S2C_STAGE_UPDATE, {
          world: this.currentWorld,
          stage: 10,
          worldName: this.getWorldName(this.currentWorld),
          stageKills: 1,
          killsRequired: 1,
          isBossStage: true,
          bossAvailable: false,
          portalOpen: true,
          portalPosition: this.portalPosition,
          message: `Portal Rúnico Aberto para o Mundo ${this.currentWorld + 1}!`,
        } as S2CStageUpdatePayload);
      }
    } else if (!this.isBossActive) {
      // Normal wave progression (Stages 1 to 9)
      if (this.currentStage < 10 && !(this.automationEnabled && this.currentStage === 9 && this.isBossAvailable)) {
        this.stageKills++;
        if (this.stageKills >= this.killsPerStage) {
          this.stageKills = 0;
          this.currentStage++;

          if (killer) {
            killer.currentStage = this.currentStage;
            this.db.savePlayer(killer);
          }

          if (this.currentStage === 10) {
            // Reached Stage 10: AUTO-SUMMON THE WORLD BOSS!
            this.broadcast(Opcode.S2C_STAGE_UPDATE, {
              world: this.currentWorld,
              stage: 10,
              worldName: this.getWorldName(this.currentWorld),
              stageKills: 0,
              killsRequired: 1,
              isBossStage: true,
              bossAvailable: false,
              portalOpen: false,
              message: `⚠️ FASE 10/10 ATINGIDA! O CHEFÃO DO MUNDO DESPERTOU!`,
            } as S2CStageUpdatePayload);

            this.challengeStageBoss();
          } else {
            // Advanced to next stage (2..9)
            this.broadcast(Opcode.S2C_STAGE_UPDATE, {
              world: this.currentWorld,
              stage: this.currentStage,
              worldName: this.getWorldName(this.currentWorld),
              stageKills: this.stageKills,
              killsRequired: this.killsPerStage,
              isBossStage: false,
              bossAvailable: false,
              portalOpen: false,
              message: `✦ Avançou para a Fase ${this.currentStage}/10!`,
            } as S2CStageUpdatePayload);
          }
        } else {
          this.broadcast(Opcode.S2C_STAGE_UPDATE, {
            world: this.currentWorld,
            stage: this.currentStage,
            worldName: this.getWorldName(this.currentWorld),
            stageKills: this.stageKills,
            killsRequired: this.killsPerStage,
            isBossStage: false,
            bossAvailable: false,
            portalOpen: false,
          } as S2CStageUpdatePayload);
        }
      }
    }

    // 3. Loot Generation & Drop Scattering
    if (this.devSettings.disableDrops) return;
    const rolledDrops = monster.rollLoot(itemId =>
      this.devSettings.doubleLegendary && ITEMS_DATABASE[itemId]?.rarity === ItemRarity.LENDARIO ? 2 : 1);
    const now = Date.now();

    for (const drop of rolledDrops) {
      const itemDef = ITEMS_DATABASE[drop.itemId];
      if (!itemDef) continue;

      const dropId = `drop_${now}_${Math.random().toString(36).substring(2, 7)}`;
      // Slight random scatter offset around monster position (-1.2 to +1.2)
      const dropPos = createVector3(
        monster.position.x + (Math.random() - 0.5) * 2.0,
        monster.position.y,
        monster.position.z + (Math.random() - 0.5) * 2.0
      );

      const dropState: ItemDropState = {
        dropId,
        itemId: itemDef.itemId,
        name: itemDef.name,
        rarity: itemDef.rarity,
        quantity: drop.quantity,
        position: dropPos,
        spawnTime: now,
        despawnSec: 60, // Aumentado para 60 segundos (1 minuto) para loot confortável
      };

      this.activeItemDrops.set(dropId, dropState);

      this.broadcast(Opcode.S2C_ITEM_DROP_SPAWN, {
        dropId: dropState.dropId,
        itemId: dropState.itemId,
        name: dropState.name,
        rarity: dropState.rarity,
        quantity: dropState.quantity,
        position: dropState.position,
        despawnTimeSec: dropState.despawnSec,
      } as S2CItemDropSpawnPayload);
    }
  }

  private getAutoLootRange(player: Player): number {
    // Ranged heroes must reach drops from targets killed at their normal attack
    // range. Scatter is at most sqrt(2)m; melee retains the existing 6m radius.
    return Math.max(6.0, player.attackRange + 1.5);
  }

  public lootItem(player: Player, dropId: string): boolean {
    const drop = this.activeItemDrops.get(dropId);
    if (!drop) return false;

    // The range comes exclusively from server-owned stats/settings, never a packet.
    const pickupRange = player.farmSettings.autoLootEnabled ? Math.max(7.0, this.getAutoLootRange(player)) : 7.0;
    if (distance(player.position, drop.position) > pickupRange) {
      return false;
    }

    if (drop.itemId === 'gold') {
      const previousGold = player.gold;
      player.gold = this.db.updateCharacterGold(player.dbCharacterId, drop.quantity);
      player.huntSession.add('lootGold', player.gold - previousGold);
    } else if (drop.itemId.startsWith('card_')) {
      this.db.addCharacterCard(player.dbCharacterId, drop.itemId);
      player.cards = this.db.getCharacterCards(player.dbCharacterId);
      player.recalculateStatsFromEquipment();

      const conn = this.connections.get(player.id);
      if (conn) {
        const cardDef = CARDS_DATABASE[drop.itemId];
        const cardName = cardDef?.name || drop.itemId;
        conn.send(Opcode.S2C_CARDS_UPDATE, {
          cards: player.cards,
          equippedWeaponCardId: player.cards.find((c) => c.isEquipped && c.equippedSlot === 0)?.cardId,
          equippedArmorCardId: player.cards.find((c) => c.isEquipped && c.equippedSlot === 1)?.cardId,
          message: `🃏 Carta Desbloqueada: ${cardName}!`,
          totalCombatPower: player.CombatPower,
        } as S2CCardsUpdatePayload);

        conn.send(Opcode.S2C_CHAT_MESSAGE, {
          senderId: 'Álbum Cósmico',
          senderName: '🃏 Nova Carta Rara',
          message: `✨ Você obteve a [${cardName}]! Adicionada ao Álbum com bônus permanente de atributos!`,
          channel: 'system',
          timestamp: Date.now(),
        });
      }
    } else {
      const itemDef = ITEMS_DATABASE[drop.itemId];
      const shouldAutoSell = itemDef?.type === ItemType.EQUIPAMENTO && (
        (itemDef.rarity === ItemRarity.COMUM && player.farmSettings.autoSellCommon) ||
        (itemDef.rarity === ItemRarity.INCOMUM && player.farmSettings.autoSellUncommon) ||
        (itemDef.rarity === ItemRarity.RARO && player.farmSettings.autoSellRare)
      );

      if (shouldAutoSell) {
        const earnedGold = (itemDef.sellPrice || 10) * drop.quantity;
        const previousGold = player.gold;
        player.gold = this.db.updateCharacterGold(player.dbCharacterId, earnedGold);
        player.huntSession.add('autoSaleGold', player.gold - previousGold);

        const conn = this.connections.get(player.id);
        if (conn) {
          conn.send(Opcode.S2C_CHAT_MESSAGE, {
            senderId: 'Farm Helper',
            senderName: '🤖 Auto-Venda',
            message: `Auto-Vendido: ${itemDef.name} x${drop.quantity} por +${earnedGold} Ouro!`,
            channel: 'system',
            timestamp: Date.now(),
          });
        }
      } else {
        const added = this.db.addItemToInventory(player.dbCharacterId, drop.itemId, drop.quantity, player.maxInventorySlots);
        if (!added) {
          // Inventory full
          return false;
        }
        player.inventory = this.db.getInventory(player.dbCharacterId);
        if (drop.itemId === 'arcane_dust') player.huntSession.addArcaneDust(drop.quantity);
        player.recalculateStatsFromEquipment();
      }
    }

    this.activeItemDrops.delete(dropId);

    // Broadcast despawn to all players
    this.broadcast(Opcode.S2C_ITEM_DROP_DESPAWN, {
      dropId,
      looterId: player.id,
    } as S2CItemDropDespawnPayload);

    // Send inventory update to looter
    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }

    return true;
  }

  public usePlayerItem(player: Player, slotIndex: number): boolean {
    const item = player.inventory.find((i) => i.slotIndex === slotIndex);
    if (!item) return false;

    const itemDef = ITEMS_DATABASE[item.itemId];
    if (!itemDef) return false;

    if (itemDef.type === ItemType.CONSUMIVEL) {
      if (!this.db.removeItemFromInventory(player.dbCharacterId, slotIndex, 1)) return false;
      if (item.itemId === 'potion_hp_minor') {
        player.heal(50);
      } else if (item.itemId === 'potion_hp_major') {
        player.heal(150);
      } else if (item.itemId === 'potion_mp_minor') {
        player.restoreResource(40);
      } else if (item.itemId === 'potion_mp_major') {
        player.restoreResource(100);
      }
      if (itemDef.healHp) player.huntSession.add('hpPotionsUsed');
      if (itemDef.healResource) player.huntSession.add('resourcePotionsUsed');
    } else if (itemDef.type === ItemType.EQUIPAMENTO) {
      const equipRes = this.db.toggleEquipItem(
        player.dbCharacterId,
        slotIndex,
        player.classType,
        player.level,
        player.attributes
      );
      if (!equipRes.success && equipRes.reason) {
        const conn = this.connections.get(player.id);
        if (conn) {
          conn.send(Opcode.S2C_CHAT_MESSAGE, {
            senderId: 'Sistema',
            senderName: '🛡️ Requisito Inválido',
            message: equipRes.reason,
            channel: 'system',
            timestamp: Date.now(),
          });
        }
        return false;
      }
    }

    player.inventory = this.db.getInventory(player.dbCharacterId);
    player.recalculateStatsFromEquipment();

    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }

    return true;
  }

  public fusePlayerEquipment(player: Player, request: FusionRequest): void {
    const conn = this.connections.get(player.id);
    try {
      const result = this.db.fuseEquipment(player, request);
      player.inventory = this.db.getInventory(player.dbCharacterId);
      player.gold = this.db.getCharacterGold(player.dbCharacterId);
      player.recalculateStatsFromEquipment();
      this.sendInventoryUpdate(player);
      conn?.send(Opcode.S2C_FUSION_RESULT, { requestId: request.requestId, success: true, outputInstanceId: result.outputInstanceId, replayed: result.replayed,
        message: result.replayed ? 'Esta fusão já foi concluída. Mochila sincronizada.' : `Reforja concluída: ${ITEMS_DATABASE[result.outputItemId].name}. O resultado está protegido na mochila.` });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const messages: Record<string, string> = { FUSION_INVALID_REQUEST: 'Pedido de fusão inválido.', FUSION_REQUEST_REUSED: 'Este pedido já foi usado para outra fusão. Atualize a receita.', FUSION_RECIPE_CHANGED: 'A receita mudou. Reabra a prévia.', FUSION_REQUIREMENTS: 'Confira a classe e o nível exigidos.', FUSION_INGREDIENTS: 'As cópias mudaram: use apenas peças da mochila, sem proteção, refino ou gemas.', FUSION_GOLD: 'Ouro insuficiente.', FUSION_MATERIALS: 'Faltam materiais desbloqueados.', FUSION_SPACE: 'Não foi possível guardar o resultado. Nada foi consumido.' };
      conn?.send(Opcode.S2C_FUSION_RESULT, { requestId: request?.requestId ?? '', success: false, message: messages[code] ?? 'Não foi possível confirmar a reforja. Confira a mochila ou reconecte antes de tentar novamente.' });
    }
  }

  public setPlayerItemLocked(player: Player, instanceId: string, isLocked: boolean): void {
    if (!this.db.setItemLocked(player.dbCharacterId, instanceId, isLocked)) return;
    player.inventory = this.db.getInventory(player.dbCharacterId);
    this.sendInventoryUpdate(player);
  }

  public sendEquipmentAdvice(player: Player): void {
    player.inventory = this.db.getInventory(player.dbCharacterId);
    player.recalculateStatsFromEquipment();
    this.connections.get(player.id)?.send(Opcode.S2C_EQUIPMENT_ADVICE, {
      characterId: player.dbCharacterId,
      suggestions: getEquipmentSuggestions(player.inventory, { classType: player.classType, level: player.level, attributes: player.attributes }),
    });
  }

  public autoEquipPlayer(player: Player): void {
    const connection = this.connections.get(player.id);
    let count: number;
    try {
      count = this.db.runInTransaction(() => {
        let equippedCount = 0;
        let attributes = player.attributes;
        while (true) {
          const upgrade = findAutoEquipUpgrade(this.db.getInventory(player.dbCharacterId), {
            classType: player.classType, level: player.level, attributes,
          });
          if (!upgrade) return equippedCount;
          const result = this.db.toggleEquipItem(player.dbCharacterId, upgrade.candidate.slotIndex, player.classType, player.level, attributes);
          if (!result.success) throw new Error(result.reason ?? 'Falha ao equipar item.');
          attributes = upgrade.attributes;
          equippedCount++;
        }
      });
    } catch {
      connection?.send(Opcode.S2C_AUTO_EQUIP_RESULT, { equippedCount: 0, message: 'Não foi possível equipar. Tente novamente.' });
      return;
    }
    if (count > 0) {
      player.inventory = this.db.getInventory(player.dbCharacterId);
      player.recalculateStatsFromEquipment();
      this.sendInventoryUpdate(player);
    }
    connection?.send(Opcode.S2C_AUTO_EQUIP_RESULT, {
      equippedCount: count, message: count ? `${count} troca(s) de equipamento concluída(s).` : 'Nenhuma melhoria elegível disponível.',
    });
  }

  public sellPlayerItem(player: Player, slotIndex: number): boolean {
    const item = this.db.getInventory(player.dbCharacterId).find((i) => i.slotIndex === slotIndex);
    if (!item || item.isEquipped || item.isLocked) return false;

    const itemDef = ITEMS_DATABASE[item.itemId];
    if (!itemDef) return false;

    const earnedGold = (itemDef.sellPrice || 1) * item.quantity;
    const previousGold = player.gold;
    const result = this.db.runInTransaction(() => {
      if (!this.db.removeItemFromInventory(player.dbCharacterId, slotIndex, item.quantity)) throw new Error('ITEM_CHANGED');
      const gold = this.db.updateCharacterGold(player.dbCharacterId, earnedGold);
      return { gold, inventory: this.db.getInventory(player.dbCharacterId) };
    });
    player.gold = result.gold;
    player.inventory = result.inventory;
    player.huntSession.add('manualSaleGold', player.gold - previousGold);

    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
        lootMessage: `Vendido ${itemDef.name} x${item.quantity} por +${earnedGold} Ouro!`,
      } as S2CInventoryUpdatePayload);
    }

    return true;
  }

  /**
   * Processa a automação de poções do Farm Helper a cada tick
   */
  public processPlayerFarmHelper(player: Player): void {
    if (player.isDead) return;

    // 1. Auto-Poção de HP
    if (player.farmSettings.autoHpPotionEnabled && player.potionHpCooldownSec <= 0) {
      const hpPct = (player.currentHp / player.maxHp) * 100;
      if (hpPct <= player.farmSettings.autoHpPotionThreshold) {
        // Busca na mochila (prioriza poção de vida)
        const hpPot = player.inventory.find(
          (i) => !i.isLocked && (i.itemId === 'potion_hp_major' || i.itemId === 'potion_hp_minor') && i.quantity > 0
        );
        if (hpPot) {
          this.usePlayerItem(player, hpPot.slotIndex);
          player.potionHpCooldownSec = 3.0; // Cooldown de 3s
        }
      }
    }

    // 2. Auto-Poção de Recurso (MP / Energia)
    if (player.farmSettings.autoMpPotionEnabled && player.potionMpCooldownSec <= 0) {
      const mpPct = (player.currentResource / player.maxResource) * 100;
      if (mpPct <= player.farmSettings.autoMpPotionThreshold) {
        const mpPot = player.inventory.find(
          (i) => !i.isLocked && (i.itemId === 'potion_mp_major' || i.itemId === 'potion_mp_minor') && i.quantity > 0
        );
        if (mpPot) {
          this.usePlayerItem(player, mpPot.slotIndex);
          player.potionMpCooldownSec = 3.0; // Cooldown de 3s
        }
      }
    }
  }

  /**
   * Atualiza e persiste autoritativamente as preferências do Farm Helper do jogador (0x80)
   */
  public handleUpdateFarmSettings(connection: Connection, payload: C2SUpdateFarmSettingsPayload): void {
    if (!connection.isAuthenticated || !connection.playerId || !payload || !payload.settings) return;
    const player = this.entityManager.getPlayer(connection.playerId);
    if (!player) return;

    const s = payload.settings;
    if (typeof s.autoHpPotionEnabled === 'boolean') player.farmSettings.autoHpPotionEnabled = s.autoHpPotionEnabled;
    if (typeof s.autoHpPotionThreshold === 'number') {
      player.farmSettings.autoHpPotionThreshold = Math.min(90, Math.max(20, s.autoHpPotionThreshold));
    }
    if (typeof s.autoMpPotionEnabled === 'boolean') player.farmSettings.autoMpPotionEnabled = s.autoMpPotionEnabled;
    if (typeof s.autoMpPotionThreshold === 'number') {
      player.farmSettings.autoMpPotionThreshold = Math.min(80, Math.max(20, s.autoMpPotionThreshold));
    }
    if (typeof s.autoSellCommon === 'boolean') player.farmSettings.autoSellCommon = s.autoSellCommon;
    if (typeof s.autoSellUncommon === 'boolean') player.farmSettings.autoSellUncommon = s.autoSellUncommon;
    if (typeof s.autoSellRare === 'boolean') player.farmSettings.autoSellRare = s.autoSellRare;
    if (typeof s.autoLootEnabled === 'boolean') player.farmSettings.autoLootEnabled = s.autoLootEnabled;

    this.db.updateCharacterFarmSettings(player.dbCharacterId, player.farmSettings);

    connection.send(Opcode.S2C_FARM_SETTINGS_UPDATE, {
      settings: player.farmSettings,
      message: 'Configurações de Farm salvas com sucesso!',
    } as S2CFarmSettingsUpdatePayload);
  }

  /**
   * Auto-Salvage em massa ("Vender Lixo da Bag") (0x82)
   * Vende instantaneamente todos os itens comuns e incomuns não equipados da mochila por ouro
   */
  public handleAutoSalvage(connection: Connection, payload?: C2SAutoSalvagePayload): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const player = this.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;

    const includeRare = Boolean(payload?.includeRare);
    let itemsSold = 0;
    let goldEarned = 0;

    this.db.runInTransaction(() => {
    // Clona o array para iterar com segurança enquanto remove do SQLite
    for (const item of this.db.getInventory(player.dbCharacterId)) {
      if (item.isEquipped || item.isLocked) continue;

      const def = ITEMS_DATABASE[item.itemId];
      if (!def) continue;

      if (def.type !== ItemType.EQUIPAMENTO) continue;
      const isCommon = def.rarity === ItemRarity.COMUM;
      const isUncommon = def.rarity === ItemRarity.INCOMUM;
      const isRare = includeRare && def.rarity === ItemRarity.RARO;

      if (isCommon || isUncommon || isRare) {
        const itemGold = (def.sellPrice || 10) * item.quantity;
        if (!this.db.removeItemFromInventory(player.dbCharacterId, item.slotIndex, item.quantity)) continue;
        goldEarned += itemGold;
        itemsSold += item.quantity;
      }
    }

      if (itemsSold > 0) this.db.updateCharacterGold(player.dbCharacterId, goldEarned);
    });

    if (itemsSold > 0) {
      const previousGold = player.gold;
      player.gold = this.db.getCharacterGold(player.dbCharacterId);
      player.huntSession.add('manualSaleGold', player.gold - previousGold);
      player.inventory = this.db.getInventory(player.dbCharacterId);
      player.recalculateStatsFromEquipment();

      connection.send(Opcode.S2C_AUTO_SALVAGE_RESULT, {
        itemsSold,
        goldEarned,
        newGoldTotal: player.gold,
        message: `🧹 Faxina na Bag: ${itemsSold} itens vendidos por +${goldEarned} Ouro!`,
      } as S2CAutoSalvageResultPayload);

      connection.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
        lootMessage: `Vendido ${itemsSold} itens por +${goldEarned} Ouro!`,
      } as S2CInventoryUpdatePayload);
    } else {
      connection.send(Opcode.S2C_AUTO_SALVAGE_RESULT, {
        itemsSold: 0,
        goldEarned: 0,
        newGoldTotal: player.gold,
        message: 'Nenhum item comum/incomum elegível para venda na mochila.',
      } as S2CAutoSalvageResultPayload);
    }
  }

  /**
   * Consulta de Rankings Globais (Leaderboards) (0x86)
   */
  public handleRequestLeaderboard(connection: Connection, payload?: C2SRequestLeaderboardPayload): void {
    const category = payload?.category || 'COMBAT_POWER';
    const limit = payload?.limit || 20;

    const entries = this.db.getLeaderboard(category, limit);

    let myRank: number | undefined;
    let myEntry: LeaderboardEntryPayload | undefined;

    if (connection.playerId) {
      const player = this.entityManager.getPlayer(connection.playerId);
      if (player && player.dbCharacterId) {
        const rankInfo = this.db.getCharacterLeaderboardRank(player.dbCharacterId, category);
        if (rankInfo) {
          myRank = rankInfo.rank;
          myEntry = rankInfo.entry;
        }
      }
    }

    connection.send(Opcode.S2C_LEADERBOARD_UPDATE, {
      category,
      entries,
      myRank,
      myEntry,
      timestamp: Date.now(),
    } as S2CLeaderboardUpdatePayload);
  }

  /**
   * Trata falha no combate contra o chefão (tempo limite esgotado ou herói derrotado).
   * Aciona o Auto-Recuo clássico de Idle RPG para a Fase 9 (Modo Farm Seguro),
   * revivendo heróis, restaurando vida e mantendo o botão de re-desafio ativo.
   */
  private handleBossFailure(reason: 'TIMEOUT' | 'DEATH'): void {
    const boss = this.activeBossId ? this.entityManager.getMonster(this.activeBossId) : null;
    if (boss) {
      boss.autoRespawns = false;
      this.entityManager.removeMonster(boss.id);
      this.spatialGrid.removeEntity(boss.id);
      this.broadcast(Opcode.S2C_ENTITY_DESPAWN, { entityId: boss.id, reason: 'DEAD' } as S2CEntityDespawnPayload);
      for (const p of this.entityManager.getAllPlayers()) {
        if (p.targetId === boss.id) p.targetId = null;
      }
    }

    const prevBossName = this.activeBossName || 'Chefão';
    this.isBossActive = false;
    this.activeBossId = null;
    this.activeBossName = '';
    this.bossTimerSec = 0;

    // Auto-Recuo para a Fase 9 (Modo Farm Seguro)
    this.currentStage = 9;
    this.stageKills = 0;
    this.isBossAvailable = true;

    // Reviver heróis caídos com full HP/MP e recuar para o acampamento seguro
    for (const player of this.entityManager.getAllPlayers()) {
      if (player.isDead) {
        player.currentHp = player.maxHp;
        player.currentResource = player.maxResource;
        player.isDead = false;
        player.position = createVector3(0, 0, -10);
      } else {
        player.currentHp = player.maxHp;
        player.currentResource = player.maxResource;
      }
      player.currentStage = 9;
      this.db.savePlayer(player);
    }

    const message = reason === 'TIMEOUT'
      ? `⌛ O tempo de 60s acabou e o ${prevBossName} escapou! Você recuou para a Fase 9 (Farm Seguro). Fortaleça-se e clique em [DESAFIAR CHEFÃO]!`
      : `💀 O herói caiu perante o ${prevBossName}! Você recuou para a Fase 9 para continuar farmando com segurança. Fortaleça-se e clique em [DESAFIAR CHEFÃO]!`;

    this.broadcast(Opcode.S2C_BOSS_EVENT, {
      eventType: 'TIMEOUT',
      message,
    } as S2CBossEventPayload);

    this.broadcast(Opcode.S2C_STAGE_UPDATE, {
      world: this.currentWorld,
      stage: 9,
      worldName: this.getWorldName(this.currentWorld),
      stageKills: 0,
      killsRequired: this.killsPerStage,
      isBossStage: false,
      bossAvailable: true,
      portalOpen: false,
      message: '🌾 Retornou à Fase 9 (Farm Contínuo). Re-desafie o Chefão quando desejar!',
    } as S2CStageUpdatePayload);
  }

  /**
   * Avalia o tempo decorrido desde o último logout do herói e notifica com o Baú do Tempo (Recompensas AFK)
   * Regras canônicas de Idle RPG:
   * - Mínimo de 300s (5 minutos) para evitar popups incômodos em simples recarregamentos de página
   * - Limite gratuito de 8h; política premium de 12h reservada no backend
   * - Ganhos transparentes e progressivos baseados em Mundo, Fase e Nível do herói
   */
  public checkAndNotifyOfflineRewards(connection: Connection, player: Player): void {
    if (!player.offlineRewardsEvaluated) {
      const now = Date.now();
      const reward = calculateOfflineReward(player, now, player.pendingOfflineReward);
      // Persist before sending. Same Player is retained during channel transfers,
      // so online time is never credited as another offline interval.
      const previous = player.pendingOfflineReward;
      const previousLogout = player.lastLogoutTime;
      player.pendingOfflineReward = reward;
      player.lastLogoutTime = now;
      try {
        this.db.saveOfflineRewardState(player);
      } catch (error) {
        player.pendingOfflineReward = previous;
        player.lastLogoutTime = previousLogout;
        throw error;
      }
      player.offlineRewardsEvaluated = true;
    }
    const reward = player.pendingOfflineReward;
    if (!reward) return;
    connection.send(Opcode.S2C_OFFLINE_REWARD_INFO, {
      offlineSeconds: reward.offlineSeconds,
      cappedSeconds: reward.cappedSeconds,
      maxOfflineSeconds: reward.maxOfflineSeconds,
      accumulatedGold: reward.accumulatedGold,
      accumulatedExp: reward.accumulatedExp,
      lootPreview: reward.loot,
      minThresholdSeconds: OFFLINE_REWARD_POLICY.minimumSeconds,
    } as S2COfflineRewardInfoPayload);
  }

  /**
   * Resgate autoritativo das Recompensas Offline (Baú do Tempo)
   */
  public claimOfflineRewards(player: Player, multiplier: number = 1): { success: boolean; message: string } {
    if (!player.pendingOfflineReward) {
      const conn = this.connections.get(player.id);
      if (conn) {
        conn.send(Opcode.S2C_OFFLINE_REWARDS_CLAIMED, {
          success: false,
          claimedGold: 0,
          claimedExp: 0,
          lootClaimed: [],
          newGold: player.gold,
          newLevel: player.level,
          newExp: player.currentXp,
          message: 'Nenhuma recompensa offline pendente para resgate.',
        } as S2COfflineRewardsClaimedPayload);
      }
      return { success: false, message: 'Nenhuma recompensa offline pendente para resgate.' };
    }

    // Legacy client multipliers are intentionally ignored: only backend entitlements
    // may grant bonuses. Keeping the argument preserves old-client compatibility.
    const reward = player.pendingOfflineReward;
    const finalExp = reward.accumulatedExp;
    const before = {
      gold: player.gold, level: player.level, currentXp: player.currentXp,
      baseAttributes: { ...player.baseAttributes }, attributes: { ...player.attributes },
      currentHp: player.currentHp, maxHp: player.maxHp,
      currentResource: player.currentResource, maxResource: player.maxResource,
      inventory: player.inventory, pendingOfflineReward: reward,
      lastLogoutTime: player.lastLogoutTime,
    };
    let leveledUp = false;
    const claimedLoot: OfflineLootItem[] = [], remainingLoot: OfflineLootItem[] = [];
    try {
      this.db.runInTransaction(() => {
        const persisted = this.db.getCharacterById(player.dbCharacterId);
        if (persisted?.pending_offline_reward !== JSON.stringify(reward)) {
          throw new Error('OFFLINE_REWARD_CHANGED');
        }
        for (const item of reward.loot) {
          const maxStack = ITEMS_DATABASE[item.itemId]?.maxStack;
          if (!maxStack) throw new Error('OFFLINE_ITEM_INVALID');
          const inventory = this.db.getInventory(player.dbCharacterId).filter(entry => !entry.isEquipped);
          const freeSlots = Math.max(0, player.maxInventorySlots - inventory.length);
          const stackRoom = inventory.filter(entry => entry.itemId === item.itemId).reduce((sum, entry) => sum + Math.max(0, maxStack - entry.quantity), 0);
          const quantity = Math.min(item.quantity, freeSlots * maxStack + stackRoom);
          if (quantity > 0) {
            if (!this.db.addItemToInventory(player.dbCharacterId, item.itemId, quantity, player.maxInventorySlots)) throw new Error('OFFLINE_INSERT_FAILED');
            claimedLoot.push({ ...item, quantity });
          }
          if (quantity < item.quantity) remainingLoot.push({ ...item, quantity: item.quantity - quantity });
        }
        if (!claimedLoot.length && !reward.accumulatedGold && !finalExp) throw new Error('OFFLINE_INVENTORY_FULL');
        player.inventory = this.db.getInventory(player.dbCharacterId);
        player.gold = this.db.updateCharacterGold(player.dbCharacterId, reward.accumulatedGold);
        leveledUp = player.addExperience(finalExp).leveledUp;
        player.pendingOfflineReward = remainingLoot.length ? { ...reward, accumulatedGold: 0, accumulatedExp: 0, loot: remainingLoot } : null;
        this.db.savePlayer(player, true);
      });
    } catch (error) {
      Object.assign(player, before);
      const message = error instanceof Error && error.message === 'OFFLINE_INVENTORY_FULL'
        ? 'Libere espaço na mochila para coletar todos os materiais. Seu baú continua guardado.'
        : error instanceof Error && error.message === 'OFFLINE_REWARD_CHANGED'
        ? 'Este baú foi atualizado em outra sessão. Reconecte para sincronizar suas recompensas.'
        : 'Não foi possível resgatar agora. Seu baú continua guardado; tente novamente.';
      const conn = this.connections.get(player.id);
      conn?.send(Opcode.S2C_OFFLINE_REWARDS_CLAIMED, {
        success: false, claimedGold: 0, claimedExp: 0, lootClaimed: [],
        newGold: player.gold, newLevel: player.level, newExp: player.currentXp, message,
      } as S2COfflineRewardsClaimedPayload);
      return { success: false, message };
    }
    const finalGold = player.gold - before.gold;
    if (leveledUp) this.handlePlayerLevelUp(player);
    const remainingReward: S2COfflineRewardInfoPayload | undefined = player.pendingOfflineReward ? {
      ...player.pendingOfflineReward, lootPreview: player.pendingOfflineReward.loot, minThresholdSeconds: OFFLINE_REWARD_POLICY.minimumSeconds,
    } : undefined;
    const message = remainingLoot.length
      ? `Ouro e EXP creditados; itens que couberam foram retirados. Restam ${remainingLoot.reduce((n, item) => n + item.quantity, 0)} unidades no baú. Libere espaço ou expanda a mochila e retire o restante.`
      : `✦ BAÚ DO TEMPO RESGATADO! Você coletou +${finalGold.toLocaleString('pt-BR')} Ouro e +${finalExp.toLocaleString('pt-BR')} EXP!`;

    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_OFFLINE_REWARDS_CLAIMED, {
        success: true,
        claimedGold: finalGold,
        claimedExp: finalExp,
        lootClaimed: claimedLoot,
        newGold: player.gold,
        newLevel: player.level,
        newExp: player.currentXp,
        message,
        remainingReward,
      } as S2COfflineRewardsClaimedPayload);

      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);

      conn.send(Opcode.S2C_PLAYER_EXP_UPDATE, {
        playerId: player.id,
        currentXp: player.currentXp,
        xpToNextLevel: player.xpToNextLevel,
        level: player.level,
        expGained: finalExp,
        source: 'Baú do Tempo (Progresso AFK)',
      } as S2CPlayerExpUpdatePayload);
    }

    console.log(`[World] Herói "${player.name}" resgatou Baú do Tempo com sucesso: +${finalGold} ouro, +${finalExp} exp.`);
    return { success: true, message };
  }

  public handleDevControl(connection: Connection, command?: DevCommand): void {
    if (!connection.isAuthenticated || !connection.playerId || !this.db.isAdminAccount(connection.accountId)) return;
    const player = this.entityManager.getPlayer(connection.playerId);
    if (!player || !command) return;
    let message: string | undefined;
    switch (command.action) {
      case 'state':
        break;
      case 'killVisible': {
        if (!Array.isArray(command.monsterIds) || command.monsterIds.length > 256) return;
        let count = 0;
        for (const id of new Set(command.monsterIds)) {
          if (typeof id !== 'string') continue;
          const monster = this.entityManager.getMonster(id);
          if (!monster || monster.isDead) continue;
          monster.currentHp = 0;
          monster.isDead = true;
          monster.isMoving = false;
          monster.velocity = createVector3(0, 0, 0);
          monster.respawnTimer = 0;
          this.handleMonsterDeath(monster, undefined, true);
          count++;
        }
        message = count ? `Mobs eliminados: ${count}.` : 'Nenhum mob vivo na tela.';
        break;
      }
      case 'refillVitals':
        if (!player.isDead) {
          player.currentHp = player.maxHp;
          player.currentResource = player.maxResource;
        }
        message = player.isDead ? 'Aguarde o renascimento do herói.' : 'HP e recurso restaurados.';
        break;
      case 'clearDrops':
        for (const dropId of this.activeItemDrops.keys()) {
          this.broadcast(Opcode.S2C_ITEM_DROP_DESPAWN, { dropId, reason: 'EXPIRED' } satisfies S2CItemDropDespawnPayload);
        }
        this.activeItemDrops.clear();
        message = 'Drops do chão removidos.';
        break;
      case 'toggle':
        if (typeof command.enabled !== 'boolean') return;
        if (command.key === 'infiniteVitals') {
          player.devInfiniteVitals = command.enabled;
          if (command.enabled && !player.isDead) {
            player.currentHp = player.maxHp;
            player.currentResource = player.maxResource;
          }
        } else if (Object.hasOwn(this.devSettings, command.key)) {
          this.devSettings[command.key] = command.enabled;
        } else return;
        break;
      case 'dummy': {
        const { minX, maxX, minZ, maxZ } = SERVER_CONFIG.MAP_BOUNDS;
        if (!Number.isFinite(command.x) || !Number.isFinite(command.z) ||
            command.x < minX || command.x > maxX || command.z < minZ || command.z > maxZ) {
          message = 'Informe coordenadas dentro do mapa.';
          break;
        }
        if (this.entityManager.getAllMonsters().filter(monster => monster.trainingDummy).length >= 8) {
          message = 'O canal já tem oito bonecos. Remova os alvos para criar mais.';
          break;
        }
        const dummy = new Monster(`dev_dummy_${++this.devTargetSequence}`, 'Boneco de Palha', createVector3(command.x, 0, command.z), 100000, 0, 'training_dummy');
        dummy.trainingDummy = dummy.devTarget = true;
        dummy.autoRespawns = false;
        this.addDevTarget(dummy);
        message = 'Boneco posicionado.';
        break;
      }
      case 'boss': {
        const result = this.challengeStageBoss(player, true);
        message = result.success ? 'Chefe de treino invocado.' : result.reason;
        break;
      }
      case 'reset':
        this.devSettings = { pauseRespawns: false, disableDrops: false, doubleLegendary: false };
        player.devInfiniteVitals = false;
        // Reset also removes the test entities.
      case 'clearTargets':
        for (const monster of this.entityManager.getAllMonsters()) {
          if (monster.devTarget) this.removeDevTarget(monster);
        }
        message = command.action === 'reset' ? 'Configuração restaurada.' : 'Alvos de teste removidos.';
        break;
      default:
        return;
    }
    connection.send(Opcode.S2C_DEV_STATE, { ...this.devSettings, infiniteVitals: player.devInfiniteVitals, message } satisfies DevState);
  }

  private addDevTarget(monster: Monster): void {
    this.entityManager.addMonster(monster);
    this.spatialGrid.updateEntity(monster);
    this.broadcast(Opcode.S2C_ENTITY_SPAWN, { entity: monster.toSnapshotState() } satisfies S2CEntitySpawnPayload);
  }

  private removeDevTarget(monster: Monster): void {
    this.entityManager.removeMonster(monster.id);
    this.spatialGrid.removeEntity(monster.id);
    this.broadcast(Opcode.S2C_ENTITY_DESPAWN, { entityId: monster.id, reason: 'DEAD' } satisfies S2CEntityDespawnPayload);
  }

  public challengeStageBoss(player?: Player, devOnly = false): { success: boolean; reason?: string } {
    if (this.isBossActive) {
      return { success: false, reason: 'Um Chefão já está em combate na arena!' };
    }

    let bossName: string;
    let bossType: string;
    let bossHp: number;
    let bossAtk: number;
    let bossExp: number;

    switch (this.currentWorld) {
      case 1:
        bossName = 'Grimgor, o Senhor Rúnico da Floresta';
        bossType = 'boss_grimgor';
        bossHp = 6000;
        bossAtk = 52;
        bossExp = 1500;
        break;
      case 2:
        bossName = 'Frostbite, a Matriarca dos Lobos Gélidos';
        bossType = 'boss_frostbite';
        bossHp = 15000;
        bossAtk = 95;
        bossExp = 3800;
        break;
      case 3:
        bossName = 'Ignis, o Titã da Forja Vulcânica';
        bossType = 'boss_ignis';
        bossHp = 32000;
        bossAtk = 160;
        bossExp = 9000;
        break;
      default:
        bossName = `Lorde Titânico Astral (Mundo ${this.currentWorld})`;
        bossType = 'boss_astral';
        bossHp = 32000 + (this.currentWorld - 3) * 20000;
        bossAtk = 160 + (this.currentWorld - 3) * 40;
        bossExp = 9000 * this.currentWorld;
        break;
    }

    const boss = new Monster(`boss_${Date.now()}`, bossName, createVector3(0, 0, 4), bossHp, bossAtk, bossType);
    boss.isBoss = true;
    boss.autoRespawns = false;
    boss.aggroRadius = 40.0;
    boss.attackRange = 2.8;
    boss.attackIntervalSec = 1.7;
    boss.speed = 3.2;
    boss.expReward = bossExp;

    if (devOnly) {
      if (this.entityManager.getAllMonsters().some(monster => monster.devTarget && monster.isBoss)) {
        return { success: false, reason: 'Já existe um chefe de treino no canal.' };
      }
      boss.devTarget = true;
      this.addDevTarget(boss);
      return { success: true };
    }
    this.entityManager.addMonster(boss);
    this.spatialGrid.updateEntity(boss);

    this.isBossActive = true;
    this.isBossAvailable = false;
    this.isPortalOpen = false;
    this.currentStage = 10;
    this.stageKills = 0;
    for (const participant of this.entityManager.getAllPlayers()) {
      participant.currentStage = 10;
      this.db.savePlayer(participant);
    }
    this.bossTimerSec = 60.0;
    this.activeBossId = boss.id;
    this.activeBossName = boss.name;

    this.broadcast(Opcode.S2C_BOSS_EVENT, {
      eventType: 'SPAWN',
      bossId: boss.id,
      bossName: boss.name,
      maxHp: boss.maxHp,
      currentHp: boss.currentHp,
      timeLimitSec: 60,
      remainingTimeSec: 60,
      message: `⚔️ O ${boss.name} DESPERTOU! Derrote-o em 60s para abrir o Portal Rúnico Dourado!`,
    } as S2CBossEventPayload);

    this.broadcast(Opcode.S2C_STAGE_UPDATE, {
      world: this.currentWorld,
      stage: 10,
      worldName: this.getWorldName(this.currentWorld),
      stageKills: 0,
      killsRequired: 1,
      isBossStage: true,
      bossAvailable: false,
      portalOpen: false,
    } as S2CStageUpdatePayload);

    this.broadcast(Opcode.S2C_ENTITY_SPAWN, {
      entity: boss.toSnapshotState(),
    } as S2CEntitySpawnPayload);

    return { success: true };
  }

  public enterPortal(player: Player): { success: boolean; reason?: string } {
    if (!this.isPortalOpen) {
      return { success: false, reason: 'Nenhum Portal Rúnico está aberto no momento!' };
    }

    if (distance(player.position, this.portalPosition) > 12.0) {
      return { success: false, reason: 'Aproxime-se do Portal Rúnico em (0, 0, 8) para entrar!' };
    }

    // 1. Remove todos os monstros do mundo anterior da simulação e despawna nos clientes
    const previousMonsters = this.entityManager.getAllMonsters();
    for (const m of previousMonsters) {
      m.autoRespawns = false;
      this.entityManager.removeMonster(m.id);
      this.spatialGrid.removeEntity(m.id);
      this.broadcast(Opcode.S2C_ENTITY_DESPAWN, {
        entityId: m.id,
        reason: 'DEAD',
      } as S2CEntityDespawnPayload);
    }

    // 2. Limpa qualquer estado de chefão ativo
    this.isBossActive = false;
    this.activeBossId = null;
    this.activeBossName = '';
    this.isBossAvailable = false;
    this.isPortalOpen = false;

    // 3. Salto Dimensional para o próximo mundo!
    this.currentWorld += 1;
    this.currentStage = 1;
    this.stageKills = 0;

    player.currentWorld = this.currentWorld;
    player.unlockedWorld = Math.max(player.unlockedWorld, player.currentWorld);
    player.currentStage = this.currentStage;
    this.db.savePlayer(player);

    player.position.x = 0;
    player.position.y = 0;
    player.position.z = -10;
    player.targetDestination = null;
    player.moveDirection = null;

    // Desvincula alvo dos jogadores
    for (const p of this.entityManager.getAllPlayers()) {
      p.targetId = null;
    }

    // 4. Spawna os monstros do novo mundo
    this.spawnWorldMonsters(this.currentWorld);

    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_CHAT_MESSAGE, {
        senderId: 'Portal',
        senderName: '🌀 Salto Dimensional',
        message: `Você viajou através do Portal Rúnico para a Fase 1 do Mundo ${this.currentWorld} (${this.getWorldName(this.currentWorld)})!`,
        channel: 'system',
        timestamp: Date.now(),
      });
    }

    this.broadcast(Opcode.S2C_STAGE_UPDATE, {
      world: this.currentWorld,
      stage: this.currentStage,
      worldName: this.getWorldName(this.currentWorld),
      stageKills: this.stageKills,
      killsRequired: this.killsPerStage,
      isBossStage: false,
      bossAvailable: false,
      portalOpen: false,
      message: `Bem-vindo ao ${this.getWorldName(this.currentWorld)}!`,
    } as S2CStageUpdatePayload);

    return { success: true };
  }

  public static readonly INVENTORY_EXPANSIONS = INVENTORY_EXPANSIONS;

  public expandPlayerInventory(player: Player, expectedMaxSlots?: number): { success: boolean; reason?: string; newMaxSlots?: number } {
    const conn = this.connections.get(player.id);
    if (expectedMaxSlots !== undefined && expectedMaxSlots !== player.maxInventorySlots) {
      const reason = 'A capacidade mudou. Confira a mochila antes de comprar outra expansão.';
      conn?.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, { success: false, newMaxSlots: player.maxInventorySlots, goldSpent: 0, remainingGold: player.gold, message: reason } as S2CExpandInventoryResultPayload);
      return { success: false, reason };
    }


    if (player.maxInventorySlots >= 50) {
      const reason = 'Mochila já atingiu a capacidade máxima (50 slots)!';
      if (conn) {
        conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
          success: false,
          newMaxSlots: player.maxInventorySlots,
          goldSpent: 0,
          remainingGold: player.gold,
          message: reason,
        } as S2CExpandInventoryResultPayload);
      }
      return { success: false, reason };
    }

    const tier = getInventoryExpansion(player.maxInventorySlots);
    if (!tier) return { success: false, reason: 'Capacidade inválida. Reconecte para sincronizar a mochila.' };

    // Validação de Reborn
    if (tier.minReborn && player.rebornCount < tier.minReborn) {
      const reason = `A última linha de expansão (50 slots) requer Transcendência Astral (Reborn ${tier.minReborn}+)!`;
      if (conn) {
        conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
          success: false,
          newMaxSlots: player.maxInventorySlots,
          goldSpent: 0,
          remainingGold: player.gold,
          nextExpansionCost: tier.cost,
          nextExpansionMinLevel: tier.minLevel,
          message: reason,
        } as S2CExpandInventoryResultPayload);
      }
      return { success: false, reason };
    }

    // Validação de Nível (jogadores com Reborn possuem passe livre de nível)
    const hasRequiredLevel = player.rebornCount > 0 || player.level >= tier.minLevel;
    if (!hasRequiredLevel) {
      const reason = `Nível insuficiente! Requer Nível ${tier.minLevel} para expandir para ${tier.newMaxSlots} slots.`;
      if (conn) {
        conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
          success: false,
          newMaxSlots: player.maxInventorySlots,
          goldSpent: 0,
          remainingGold: player.gold,
          nextExpansionCost: tier.cost,
          nextExpansionMinLevel: tier.minLevel,
          message: reason,
        } as S2CExpandInventoryResultPayload);
      }
      return { success: false, reason };
    }

    // Validação de Ouro
    if (player.gold < tier.cost) {
      const reason = `Ouro insuficiente! Necessário ${tier.cost.toLocaleString()} Ouro (Você tem: ${player.gold.toLocaleString()}).`;
      if (conn) {
        conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
          success: false,
          newMaxSlots: player.maxInventorySlots,
          goldSpent: 0,
          remainingGold: player.gold,
          nextExpansionCost: tier.cost,
          nextExpansionMinLevel: tier.minLevel,
          message: reason,
        } as S2CExpandInventoryResultPayload);
      }
      return { success: false, reason };
    }

    const newSlots = this.db.expandInventorySlots(player.dbCharacterId, player.maxInventorySlots, tier.cost);
    if (!newSlots) {
      const reason = 'Falha ao processar expansão de mochila no banco de dados.';
      if (conn) {
        conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
          success: false,
          newMaxSlots: player.maxInventorySlots,
          goldSpent: 0,
          remainingGold: player.gold,
          message: reason,
        } as S2CExpandInventoryResultPayload);
      }
      return { success: false, reason };
    }

    player.maxInventorySlots = newSlots;
    player.gold = this.db.getCharacterGold(player.dbCharacterId);
    this.db.savePlayer(player);

    const nextTier = getInventoryExpansion(player.maxInventorySlots);

    if (conn) {
      conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
        success: true,
        newMaxSlots: player.maxInventorySlots,
        goldSpent: tier.cost,
        remainingGold: player.gold,
        nextExpansionCost: nextTier?.cost,
        nextExpansionMinLevel: nextTier?.minLevel,
        message: `🎉 Mochila expandida com sucesso para ${player.maxInventorySlots} slots (+${tier.slotsAdded} novos slots)! (-${tier.cost.toLocaleString()} Ouro)`,
      } as S2CExpandInventoryResultPayload);

      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
        lootMessage: `🎉 Mochila expandida para ${player.maxInventorySlots} slots! (-${tier.cost.toLocaleString()} Ouro)`,
      } as S2CInventoryUpdatePayload);
    }

    return { success: true, newMaxSlots: player.maxInventorySlots };
  }

  public discardOrRecyclePlayerItem(player: Player, slotIndex: number): boolean {
    const previousGold = player.gold;
    const res = this.db.discardOrRecycleItem(player.dbCharacterId, slotIndex);
    if (!res.success) return false;

    player.inventory = this.db.getInventory(player.dbCharacterId);
    player.gold = this.db.getCharacterGold(player.dbCharacterId);
    player.huntSession.add('manualSaleGold', player.gold - previousGold);
    player.recalculateStatsFromEquipment();

    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
        lootMessage: `♻️ Item reciclado na Forja: +${res.goldGained} Ouro e +${res.dustGained} Pó Arcano!`,
      } as S2CInventoryUpdatePayload);
    }

    return true;
  }

  /**
   * Realiza autoritativamente o ritual da Transcendência Astral (Reborn / Prestígio)
   * - Requer Nível 50
   * - Incrementa rebornCount em +1
   * - Reseta nível para 1 e currentXp para 0
   * - Concede bônus permanente de +10 em todos os atributos D&D 5E, +500 HP e +15% dano
   * - Atualiza SQLite e sincroniza todos os clientes
   */
  public performPlayerReborn(player: Player): { success: boolean; reason?: string } {
    if (player.level < 50) {
      const msg = `Requer Nível 50 para o ritual da Transcendência Astral! (Seu nível atual: ${player.level}/50)`;
      const conn = this.connections.get(player.id);
      if (conn) {
        conn.send(Opcode.S2C_CHAT_MESSAGE, {
          senderId: 'Altar Astral',
          senderName: '🔒 Nível Insuficiente',
          message: msg,
          channel: 'system',
          timestamp: Date.now(),
        });
      }
      return { success: false, reason: msg };
    }

    // 1. Executa a Transcendência
    player.rebornCount += 1;
    player.level = 1;
    player.currentXp = 0;

    // 2. Reseta base attributes para os stats iniciais da classe (os bônus de reborn são aplicados dinamicamente)
    const classDef = CLASS_DEFINITIONS[player.classType] || CLASS_DEFINITIONS[CharacterClass.GUERREIRO];
    player.baseAttributes = { ...classDef.baseStats };

    player.recalculateStatsFromEquipment();
    player.currentHp = player.maxHp;
    player.currentResource = player.maxResource;

    // 3. Persiste no SQLite
    this.db.savePlayer(player);

    // 4. Envia confirmação e novos dados ao jogador
    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_REBORN_RESULT, {
        success: true,
        rebornCount: player.rebornCount,
        newLevel: player.level,
        totalCombatPower: player.CombatPower,
        newAttributes: player.attributes,
        honorTitle: player.HonorTitle,
        message: `✦ TRANSCENDÊNCIA REALIZADA COM SUCESSO! Você ascendeu ao Grau ${player.rebornCount} (${player.HonorTitle}) com +${player.rebornCount * 10} em todos os atributos!`,
      } as S2CRebornResultPayload);

      conn.send(Opcode.S2C_PLAYER_EXP_UPDATE, {
        playerId: player.id,
        currentXp: player.currentXp,
        xpToNextLevel: player.xpToNextLevel,
        level: player.level,
        expGained: 0,
        source: 'Transcendência Astral',
      } as S2CPlayerExpUpdatePayload);

      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }

    // 5. Transmite celebração para todos os jogadores
    this.broadcast(Opcode.S2C_PLAYER_LEVEL_UP, {
      playerId: player.id,
      newLevel: player.level,
      newAttributes: player.attributes,
      newMaxHp: player.maxHp,
      newMaxResource: player.maxResource,
      totalCombatPower: player.CombatPower,
      rebornCount: player.rebornCount,
      honorTitle: player.HonorTitle,
    } as S2CPlayerLevelUpPayload);

    this.broadcast(Opcode.S2C_CHAT_MESSAGE, {
      senderId: 'Altar Astral',
      senderName: '✨ Transcendência Astral',
      message: `🌟 O herói ${player.name} alcançou a Transcendência Divina e renasceu como [${player.HonorTitle}]! (+${player.rebornCount * 10} Stats, +${player.rebornCount * 500} HP, +${player.rebornCount * 15}% Dano)`,
      channel: 'system',
      timestamp: Date.now(),
    });

    console.log(`[World] Player "${player.name}" realizou o Reborn ${player.rebornCount}! Novo CP: ${player.CombatPower}`);
    return { success: true };
  }

  /**
   * Refinamento Autoritativo de Equipamentos (+1 a +15)
   * Baseado na Matriz D&D 5E de Materiais e Taxas de Sucesso
   */
  public refinePlayerEquipment(player: Player, slotIndex: number): void {
    const item = player.inventory.find((i) => i.slotIndex === slotIndex);
    const conn = this.connections.get(player.id);
    if (!item) {
      if (conn) {
        conn.send(Opcode.S2C_REFINE_RESULT, {
          success: false,
          slotIndex,
          oldRefineLevel: 0,
          newRefineLevel: 0,
          isLevelUp: false,
          isLevelDown: false,
          message: 'Equipamento não encontrado!',
          totalCombatPower: player.CombatPower,
          gold: player.gold,
        } as S2CRefineResultPayload);
      }
      return;
    }

    const itemDef = ITEMS_DATABASE[item.itemId];
    if (!itemDef || itemDef.type !== ItemType.EQUIPAMENTO) {
      if (conn) {
        conn.send(Opcode.S2C_REFINE_RESULT, {
          success: false,
          slotIndex,
          oldRefineLevel: 0,
          newRefineLevel: 0,
          isLevelUp: false,
          isLevelDown: false,
          message: 'Este item não é um equipamento aprimorável!',
          totalCombatPower: player.CombatPower,
          gold: player.gold,
        } as S2CRefineResultPayload);
      }
      return;
    }

    const currLevel = item.refineLevel || 0;
    if (currLevel >= 15) {
      if (conn) {
        conn.send(Opcode.S2C_REFINE_RESULT, {
          success: false,
          slotIndex,
          oldRefineLevel: currLevel,
          newRefineLevel: currLevel,
          isLevelUp: false,
          isLevelDown: false,
          message: 'Equipamento já atingiu o nível supremo de refinamento (+15)!',
          totalCombatPower: player.CombatPower,
          gold: player.gold,
        } as S2CRefineResultPayload);
      }
      return;
    }

    // Regras D&D 5E de Custo e Chance de Sucesso (Sec. 2.1)
    let stoneId = 'stone_forge_common';
    let stoneQty = 1;
    let extraMatId: string | null = null;
    let extraMatQty = 0;
    let goldCost = 500;
    let successRate = 1.0;

    if (currLevel < 3) {
      stoneId = 'stone_forge_common';
      stoneQty = 1;
      goldCost = 500;
      successRate = 1.0;
    } else if (currLevel < 6) {
      stoneId = 'stone_forge_common';
      stoneQty = 2;
      goldCost = 2500;
      successRate = 0.85;
    } else if (currLevel < 9) {
      stoneId = 'stone_forge_rare';
      stoneQty = 3;
      goldCost = 15000;
      successRate = 0.60;
    } else if (currLevel < 12) {
      stoneId = 'stone_forge_mystic';
      stoneQty = 2;
      extraMatId = 'rune_fragment';
      extraMatQty = 1;
      goldCost = 75000;
      successRate = 0.40;
    } else {
      stoneId = 'stone_forge_mystic';
      stoneQty = 5;
      extraMatId = 'rune_fragment';
      extraMatQty = 3;
      goldCost = 300000;
      successRate = 0.20;
    }

    // Validações econômicas
    if (player.gold < goldCost) {
      if (conn) {
        conn.send(Opcode.S2C_REFINE_RESULT, {
          success: false,
          slotIndex,
          oldRefineLevel: currLevel,
          newRefineLevel: currLevel,
          isLevelUp: false,
          isLevelDown: false,
          message: `Ouro insuficiente! Requer ${goldCost.toLocaleString()} Ouro.`,
          totalCombatPower: player.CombatPower,
          gold: player.gold,
        } as S2CRefineResultPayload);
      }
      return;
    }

    if (!this.db.hasItemQuantity(player.dbCharacterId, stoneId, stoneQty)) {
      const stoneDef = ITEMS_DATABASE[stoneId];
      if (conn) {
        conn.send(Opcode.S2C_REFINE_RESULT, {
          success: false,
          slotIndex,
          oldRefineLevel: currLevel,
          newRefineLevel: currLevel,
          isLevelUp: false,
          isLevelDown: false,
          message: `Pedras insuficientes! Requer ${stoneQty}x ${stoneDef?.name || stoneId}.`,
          totalCombatPower: player.CombatPower,
          gold: player.gold,
        } as S2CRefineResultPayload);
      }
      return;
    }

    if (extraMatId && extraMatQty > 0 && !this.db.hasItemQuantity(player.dbCharacterId, extraMatId, extraMatQty)) {
      const extraDef = ITEMS_DATABASE[extraMatId];
      if (conn) {
        conn.send(Opcode.S2C_REFINE_RESULT, {
          success: false,
          slotIndex,
          oldRefineLevel: currLevel,
          newRefineLevel: currLevel,
          isLevelUp: false,
          isLevelDown: false,
          message: `Materiais insuficientes! Requer ${extraMatQty}x ${extraDef?.name || extraMatId}.`,
          totalCombatPower: player.CombatPower,
          gold: player.gold,
        } as S2CRefineResultPayload);
      }
      return;
    }

    // Rolagem do Sucesso
    const isSuccess = Math.random() <= successRate;
    let newLevel = currLevel;
    let isLevelUp = false;
    let isLevelDown = false;
    let feedbackMessage = '';

    if (isSuccess) {
      newLevel = currLevel + 1;
      isLevelUp = true;
      feedbackMessage = `🎉 SUCESSO CELESTIAL! "${itemDef.name}" foi aprimorado para +${newLevel}!`;

    } else {
      if (currLevel >= 9) {
        newLevel = Math.max(0, currLevel - 1);
        isLevelDown = true;
        feedbackMessage = `⚠️ FALHA NO RITUAL! A energia oscilou e "${itemDef.name}" regrediu para +${newLevel}.`;
      } else {
        newLevel = currLevel;
        feedbackMessage = `❌ FALHA NA FORJA! "${itemDef.name}" manteve o nível (+${newLevel}).`;
      }
    }

    try {
      if (!item.instanceId) throw new Error('REFINEMENT_CHANGED');
      const result = this.db.commitRefinement(player.dbCharacterId, item.instanceId, currLevel, newLevel, goldCost,
        [{ itemId: stoneId, quantity: stoneQty }, ...(extraMatId ? [{ itemId: extraMatId, quantity: extraMatQty }] : [])]);
      player.gold = result.gold;
      player.inventory = result.inventory;
    } catch {
      conn?.send(Opcode.S2C_REFINE_RESULT, { success: false, slotIndex, oldRefineLevel: currLevel,
        newRefineLevel: currLevel, isLevelUp: false, isLevelDown: false, gold: player.gold,
        totalCombatPower: player.CombatPower, message: 'Refino não concluído. Ouro, materiais e equipamento foram preservados; atualize a mochila.' } as S2CRefineResultPayload);
      return;
    }
    player.recalculateStatsFromEquipment();
    if (isSuccess) {
      if (newLevel >= 10) {
        this.broadcast(Opcode.S2C_CHAT_MESSAGE, {
          senderId: 'Forja Celestial',
          senderName: '⚒️ Sucesso Lendário',
          message: `🔥 O herói ${player.name} forjou com maestria [${itemDef.name}] +${newLevel}!`,
          channel: 'system',
          timestamp: Date.now(),
        });
      }
    }

    if (conn) {
      conn.send(Opcode.S2C_REFINE_RESULT, {
        success: isSuccess,
        slotIndex,
        oldRefineLevel: currLevel,
        newRefineLevel: newLevel,
        isLevelUp,
        isLevelDown,
        message: feedbackMessage,
        totalCombatPower: player.CombatPower,
        gold: player.gold,
      } as S2CRefineResultPayload);

      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }
  }

  /**
   * Engaste Autoritativo de Gemas em Soquetes (0, 1, 2)
   */
  public socketPlayerGem(player: Player, slotIndex: number, socketIndex: number, gemItemId: string): void {
    const conn = this.connections.get(player.id);
    const res = this.db.socketGem(player.dbCharacterId, slotIndex, socketIndex, gemItemId);

    if (!res.success) {
      if (conn) {
        conn.send(Opcode.S2C_SOCKET_RESULT, {
          success: false,
          equipmentSlotIndex: slotIndex,
          socketIndex,
          message: res.reason || 'Falha ao engastar gema!',
          totalCombatPower: player.CombatPower,
        } as S2CSocketResultPayload);
      }
      return;
    }

    player.inventory = this.db.getInventory(player.dbCharacterId);
    player.recalculateStatsFromEquipment();

    if (conn) {
      const gemDef = ITEMS_DATABASE[gemItemId];
      conn.send(Opcode.S2C_SOCKET_RESULT, {
        success: true,
        equipmentSlotIndex: slotIndex,
        socketIndex,
        gemItemId,
        message: `💎 ${gemDef?.name || 'Gema'} engastada com sucesso no Soquete ${socketIndex + 1}!`,
        totalCombatPower: player.CombatPower,
      } as S2CSocketResultPayload);

      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }
  }

  /**
   * Equipar / Desequipar Carta de Monstro na Arma ou Armadura
   */
  public equipPlayerCard(player: Player, cardId: string, targetSlot: 'ARMA' | 'ARMADURA', isEquip: boolean): void {
    const conn = this.connections.get(player.id);
    const res = this.db.setEquippedCard(player.dbCharacterId, cardId, targetSlot, isEquip);

    if (!res.success) {
      if (conn) {
        conn.send(Opcode.S2C_CHAT_MESSAGE, {
          senderId: 'Álbum',
          senderName: '🃏 Erro na Carta',
          message: res.reason || 'Falha ao alterar carta!',
          channel: 'system',
          timestamp: Date.now(),
        });
      }
      return;
    }

    player.cards = this.db.getCharacterCards(player.dbCharacterId);
    player.recalculateStatsFromEquipment();

    if (conn) {
      const weaponCard = player.cards.find((c) => c.isEquipped && c.equippedSlot === 0)?.cardId;
      const armorCard = player.cards.find((c) => c.isEquipped && c.equippedSlot === 1)?.cardId;

      conn.send(Opcode.S2C_CARDS_UPDATE, {
        cards: player.cards,
        equippedWeaponCardId: weaponCard,
        equippedArmorCardId: armorCard,
        message: isEquip ? 'Carta imbuída com sucesso no equipamento!' : 'Carta desequipada!',
        totalCombatPower: player.CombatPower,
      } as S2CCardsUpdatePayload);

      conn.send(Opcode.S2C_INVENTORY_UPDATE, {
        slots: player.inventory,
        gold: player.gold,
        maxSlots: player.maxInventorySlots,
        totalCombatPower: player.CombatPower,
      } as S2CInventoryUpdatePayload);
    }
  }

  /**
   * Envia o Álbum de Cartas atualizado do jogador
   */
  public sendPlayerCardAlbum(player: Player): void {
    const conn = this.connections.get(player.id);
    if (!conn) return;

    player.cards = this.db.getCharacterCards(player.dbCharacterId);
    const weaponCard = player.cards.find((c) => c.isEquipped && c.equippedSlot === 0)?.cardId;
    const armorCard = player.cards.find((c) => c.isEquipped && c.equippedSlot === 1)?.cardId;

    conn.send(Opcode.S2C_CARDS_UPDATE, {
      cards: player.cards,
      equippedWeaponCardId: weaponCard,
      equippedArmorCardId: armorCard,
      totalCombatPower: player.CombatPower,
    } as S2CCardsUpdatePayload);
  }

  /**
   * Envia o inventário e ouro autoritativo atualizado para a conexão do jogador
   */
  public sendInventoryUpdate(player: Player): void {
    const conn = this.connections.get(player.id);
    if (!conn) return;

    conn.send(Opcode.S2C_INVENTORY_UPDATE, {
      slots: player.inventory,
      gold: player.gold,
      maxSlots: player.maxInventorySlots,
      totalCombatPower: player.CombatPower,
    } as S2CInventoryUpdatePayload);
  }

  /**
   * Entrega itens ou cartas autoritativamente na conta do jogador
   */
  public deliverRewardItemToPlayer(player: Player, itemId: string, quantity: number): void {
    if (itemId === 'gold') {
      player.gold = this.db.updateCharacterGold(player.dbCharacterId, quantity);
    } else if (itemId.startsWith('card_')) {
      this.db.addCharacterCard(player.dbCharacterId, itemId);
      player.cards = this.db.getCharacterCards(player.dbCharacterId);
      player.recalculateStatsFromEquipment();
    } else {
      this.db.addItemToInventory(player.dbCharacterId, itemId, quantity, player.maxInventorySlots);
      player.inventory = this.db.getInventory(player.dbCharacterId);
      player.recalculateStatsFromEquipment();
    }
  }

  /**
   * Envia as informações da masmorra diária e ingressos do jogador (0x88 -> 0x89)
   */
  public handleRequestDungeonInfo(player: Player): void {
    const conn = this.connections.get(player.id);
    if (!conn) return;

    const session = this.dungeonManager.getSession(player.id);
    const info = this.db.getDailyDungeonInfo(
      player.dbCharacterId || player.id,
      this.dungeonManager.isPlayerInDungeon(player.id),
      session?.dungeonType
    );
    conn.send(Opcode.S2C_DUNGEON_INFO, info);
  }

  /**
   * Entra na masmorra diária / Boss Rush selecionada (0x8A -> 0x8B)
   */
  public handleEnterDungeon(player: Player, payload: C2SEnterDungeonPayload): void {
    const conn = this.connections.get(player.id);
    const result = this.dungeonManager.startDungeon(player, payload?.dungeonType || 'BOSS_RUSH');
    if (!result.success && conn) {
      conn.send(Opcode.S2C_DUNGEON_EVENT, {
        status: 'DEFEAT',
        dungeonType: payload?.dungeonType || 'BOSS_RUSH',
        currentWave: 0,
        maxWaves: 0,
        timeLimitSec: 0,
        remainingTimeSec: 0,
        message: result.message,
      } as S2CDungeonEventPayload);
    }
  }

  /**
   * Compra ingresso extra de masmorra diária usando ouro (0x8C -> 0x8D)
   */
  public handleBuyDungeonTicket(player: Player): void {
    const conn = this.connections.get(player.id);
    if (!conn) return;

    const result = this.db.buyExtraDungeonTicket(player.dbCharacterId || player.id);
    if (result.success) {
      player.gold = result.remainingGold;
      this.sendInventoryUpdate(player);
    }

    conn.send(Opcode.S2C_BUY_DUNGEON_TICKET_RESULT, {
      success: result.success,
      ticketsRemaining: result.ticketsRemaining,
      extraTicketsBoughtToday: result.extraTicketsBoughtToday,
      goldSpent: result.goldSpent,
      remainingGold: result.remainingGold,
      message: result.message,
    } as S2CBuyDungeonTicketResultPayload);
  }

  /**
   * Abandona voluntariamente a masmorra em andamento (0x8E)
   */
  public handleLeaveDungeon(player: Player): void {
    this.dungeonManager.leaveDungeon(player);
  }
}
