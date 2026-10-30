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

export class World {
  public readonly entityManager = new EntityManager();
  public readonly spatialGrid = new SpatialGrid(20.0);
  public readonly db: DatabaseManager;
  public readonly dungeonManager: DungeonManager;
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

  public getWorldName(world: number): string {
    switch (world) {
      case 1: return 'Floresta da Forja';
      case 2: return 'Picos de Jotunheim';
      case 3: return 'Forja Vulcânica';
      default: return `Dimensão Astral ${world}`;
    }
  }

  constructor(customDb?: DatabaseManager) {
    this.db = customDb || new DatabaseManager();
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
    this.connections.delete(connection.id);
    if (connection.playerId) {
      this.handlePlayerDisconnect(connection.playerId);
    }
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
    } as S2CSkillsUpdatePayload);

    // 7. Envia configurações do Farm Helper (Automação Idle)
    connection.send(Opcode.S2C_FARM_SETTINGS_UPDATE, {
      settings: player.farmSettings,
      message: 'Configurações do Farm Helper sincronizadas.',
    } as S2CFarmSettingsUpdatePayload);

    // 8. Envia confirmação definitiva de login bem-sucedido
    connection.send(Opcode.S2C_LOGIN_SUCCESS, {
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
    return player;
  }

  private handlePlayerDisconnect(playerId: string): void {
    const player = this.entityManager.removePlayer(playerId);
    this.spatialGrid.removeEntity(playerId);
    if (player) {
      const clearedStatuses = player.clearAllStatuses();
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

  /**
   * Authoritative Simulation Step called by GameLoop at 20Hz (every 50ms)
   */
  public update(deltaTimeSec: number): void {
    this.currentTick++;

    // 1. Update all Players & Spatial Cell Index
    const players = this.entityManager.getAllPlayers();
    for (const player of players) {
      player.update(deltaTimeSec);
      this.spatialGrid.updateEntity(player);

      // Auto-Combat AI for Players (matching Unity AutoCombatController logic)
      this.processPlayerAutoCombat(player);

      // Farm Helper AI for Players (Auto-Poção HP e MP)
      this.processPlayerFarmHelper(player);
    }

    // 1.1. Update Daily Dungeons & Boss Rush
    this.dungeonManager.update(deltaTimeSec);

    // 2. Update all Monsters & Spatial Cell Index
    const monsters = this.entityManager.getAllMonsters();
    for (const monster of monsters) {
      // Monster Aggro targeting
      if (monster.state === MonsterState.IDLE && !monster.isDead) {
        const nearestPlayer = this.entityManager.findNearestPlayer(monster.position, monster.aggroRadius);
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
        if (!player.isDead && player.farmSettings.autoLootEnabled && distance(player.position, drop.position) <= 6.0) {
          this.lootItem(player, dropId);
          break; // drop picked up, break player loop
        }
      }
    }

    // 4. Build & Broadcast World Snapshot (Partitioned by Area of Interest)
    this.broadcastSnapshot();
  }

  private processPlayerAutoCombat(player: Player): void {
    if (player.isDead) return;

    // If player has a target, check validity
    let target = player.targetId ? this.entityManager.getMonster(player.targetId) : null;

    if (!target || target.isDead) {
      // Auto-target nearest monster within radar (60m)
      target = this.entityManager.findNearestMonster(player.position, 60.0);
      player.targetId = target ? target.id : null;
    }

    if (!target || target.isDead) return;

    const dist = distance(player.position, target.position);

    // If within attack range and cooldown ready, execute attack
    if (dist <= player.attackRange) {
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

  private executePlayerAttack(player: Player, target: Monster): void {
    const wasAlive = !target.isDead;
    const rawDamage = player.BaseDamage;
    // Simple critical strike formula based on DEX
    const isCritical = Math.random() < (player.attributes.destreza * 0.015);
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
    if (player.isDead) return;

    if (monster.attackCooldown <= 0) {
      const damage = monster.attackDamage;
      // Dodge check based on player DEX
      const isDodged = Math.random() < (player.attributes.destreza * 0.01);

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

        if (dmgRes.reflected > 0 && !monster.isDead) {
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
      monster.attackCooldown = monster.attackIntervalSec;

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
    extra?: { tickDamage?: number; targetRemainingHp?: number; isTargetDead?: boolean }
  ): void {
    const payload: CombatStatusTransitionPayload = {
      event,
      serverTick: this.currentTick,
      status: this.toCombatStatusPayload(status),
      tickDamage: extra?.tickDamage,
      targetRemainingHp: extra?.targetRemainingHp,
      isTargetDead: extra?.isTargetDead,
    };
    this.broadcast(Opcode.S2C_COMBAT_STATUS_EVENT, payload);
  }

  public updateCombatStatuses(deltaTimeSec: number): void {
    const allEntities: Entity[] = [
      ...this.entityManager.getAllPlayers(),
      ...this.entityManager.getAllMonsters(),
    ];

    for (const ent of allEntities) {
      if (ent.activeStatuses.size === 0) continue;

      for (const [statusId, status] of Array.from(ent.activeStatuses.entries())) {
        status.remainingSec -= deltaTimeSec;

        // Periodic Tick (e.g. BLEED a cada 1.0s)
        if (status.type === 'BLEED') {
          status.nextTickSec = (status.nextTickSec ?? 1.0) - deltaTimeSec;
          if (status.nextTickSec <= 0 && !ent.isDead) {
            status.nextTickSec = 1.0;
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
  }

  /**
   * Conjuração Autoritativa de Habilidades Ativas (Slots 1 a 4)
   * Valida rigorosamente classe, slot, nível, CD, recurso, alvo, distância e geometria
   * ANTES de consumir qualquer recurso ou acionar cooldown.
   */
  public castPlayerSkill(player: Player, slot: number, targetId?: string, targetPos?: Vector3): boolean {
    if (player.isDead) {
      this.sendSkillRejection(player, slot, 'CASTER_DEAD', 'O herói está derrotado e não pode agir!');
      return false;
    }

    if (player.isStunned()) {
      this.sendSkillRejection(player, slot, 'CASTER_STUNNED', 'Você está atordoado e não pode usar habilidades!');
      return false;
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

    if (player.currentResource < skill.cost) {
      this.sendSkillRejection(
        player,
        slot,
        'INSUFFICIENT_RESOURCE',
        `${skill.resourceType} insuficiente! Necessário ${skill.cost} (Atual: ${Math.round(player.currentResource)}).`,
        skill.skillId
      );
      return false;
    }

    if (targetPos !== undefined && !this.isFiniteVector3(targetPos)) {
      this.sendSkillRejection(player, slot, 'INVALID_POSITION', 'Coordenadas de alvo inválidas ou não finitas.', skill.skillId);
      return false;
    }

    // Classificação da Habilidade
    let category: SkillCategory;
    let geometry: SkillGeometryType;

    if (skill.isHeal && skill.range === 0 && !skill.isAoe) {
      category = 'SELF_HEAL';
      geometry = 'POINT';
    } else if (!skill.isHeal && skill.range === 0 && !skill.isAoe) {
      category = 'SELF_BUFF';
      geometry = 'POINT';
    } else if (skill.isAoe) {
      if (skill.skillId === 'guerreiro_nv2_3') {
        category = 'AOE_LINE';
        geometry = 'LINE';
      } else if (
        skill.range === 0 ||
        skill.skillId === 'guerreiro_nv2_1' ||
        skill.skillId === 'guerreiro_nv3_1' ||
        skill.skillId === 'guerreiro_3' ||
        skill.skillId === 'guerreiro_4'
      ) {
        category = 'AOE_SELF';
        geometry = 'CIRCLE_SELF';
      } else {
        category = 'AOE_TARGET';
        geometry = 'CIRCLE_TARGET';
      }
    } else {
      category = 'SINGLE_TARGET';
      geometry = 'POINT';
    }

    const RANGE_TOLERANCE = 0.5;
    let resolvedTargetId: string | undefined;
    let resolvedCenter: Vector3 = cloneVector3(player.position);
    let resolvedDirection: number = player.headingYaw;
    let targetsToDamage: Monster[] = [];
    let singleTargetMonster: Monster | null = null;

    // Resolução de Alvo e Validação Pré-Consumo
    switch (category) {
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

        if (targetsToDamage.length === 0) {
          this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum inimigo dentro do raio de efeito da habilidade.', skill.skillId);
          return false;
        }
        resolvedTargetId = targetsToDamage[0].id;
        break;
      }

      case 'AOE_LINE': {
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
            this.sendSkillRejection(player, slot, 'INVALID_TARGET', 'Alvo para queda da espada inexistente.', skill.skillId);
            return false;
          }
          if (ent.isDead) {
            this.sendSkillRejection(player, slot, 'TARGET_DEAD', 'O monstro alvo já foi derrotado.', skill.skillId);
            return false;
          }
          const d = distance(player.position, ent.position);
          if (d > skill.range + RANGE_TOLERANCE) {
            this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', 'Alvo de impacto além do alcance máximo de 8m.', skill.skillId);
            return false;
          }
          resolvedCenter = cloneVector3(ent.position);
          resolvedTargetId = ent.id;
        } else if (targetPos) {
          const d = distance(player.position, targetPos);
          if (d > skill.range + RANGE_TOLERANCE) {
            this.sendSkillRejection(player, slot, 'OUT_OF_RANGE', 'Ponto de impacto além do alcance máximo de 8m.', skill.skillId);
            return false;
          }
          resolvedCenter = cloneVector3(targetPos);
        } else {
          const nearest = this.entityManager.findNearestMonster(player.position, skill.range + RANGE_TOLERANCE);
          if (!nearest || nearest.isDead) {
            this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum alvo ao alcance para invocar a lâmina.', skill.skillId);
            return false;
          }
          resolvedCenter = cloneVector3(nearest.position);
          resolvedTargetId = nearest.id;
        }

        const radius = skill.aoeRadius || 5.0;
        const radiusSq = radius * radius;
        const monsters = this.entityManager.getAllMonsters();
        targetsToDamage = monsters.filter((m) => !m.isDead && distanceSquared(resolvedCenter, m.position) <= radiusSq);

        if (targetsToDamage.length === 0) {
          this.sendSkillRejection(player, slot, 'NO_VALID_TARGET', 'Nenhum inimigo dentro do raio de impacto da lâmina.', skill.skillId);
          return false;
        }
        if (!resolvedTargetId) resolvedTargetId = targetsToDamage[0].id;
        break;
      }
    }

    // =========================================================================
    // TODAS AS VALIDAÇÕES PASSARAM: AGORA SIM CONSOME RECURSO E APLICA COOLDOWN
    // =========================================================================
    player.consumeResource(skill.cost);
    player.setSkillCooldown(slot, skill.cooldownSec);

    const castId = `cast_${Date.now()}_${++this.castSequence}`;
    const basePower = calculateSkillPower(skill, player.attributes, player.level, player.maxHp);
    const isCritical = Math.random() < player.attributes.destreza * 0.02;
    let finalPower = isCritical ? Math.round(basePower * 1.5) : basePower;

    if (!skill.isHeal && category !== 'SELF_BUFF') {
      finalPower = Math.round(finalPower * player.getDamageMultiplier());
    }

    const affectedEntityIds: string[] = [];
    const targetResults: SkillTargetResultPayload[] = [];
    const appliedStatuses: CombatStatusStatePayload[] = [];
    let totalEffectiveDamageOrHeal = 0;

    // Aplicação Específica por Habilidade
    if (skill.skillId === 'guerreiro_truque_1' || skill.skillId === 'guerreiro_1') {
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
            magnitude: Math.max(1, Math.round(player.attributes.forca * 0.35 + player.level)),
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
      const shieldValue = Math.round(player.maxHp * 0.30);
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
          m.position.x += pushX;
          m.position.z += pushZ;
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
      const healAmount = Math.round(player.maxHp * 0.40);
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
      const waveDmg = Math.round(player.attributes.forca * 2.0 + player.attributes.constituicao * 1.0);
      const monsters = this.entityManager.getAllMonsters();
      for (const m of monsters) {
        if (!m.isDead && distanceSquared(player.position, m.position) <= 16.0) {
          const wasAlive = !m.isDead;
          const dmgRes = m.takeDamage(waveDmg, player);
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
      originPosition: cloneVector3(player.position),
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

  public handleMonsterDeath(monster: Monster, killer?: Player): void {
    const cleared = monster.clearAllStatuses();
    for (const st of cleared) {
      this.broadcastStatusTransition('CLEARED_ON_DEATH', st, {
        targetRemainingHp: 0,
        isTargetDead: true,
      });
    }

    // 0. Notifica DungeonManager se este monstro pertencia a uma masmorra ativa
    if (killer && killer instanceof Player) {
      this.dungeonManager.onMonsterKilled(monster.id, killer);
    }

    // 1. Authoritative Experience (EXP) & Level Up Progression
    if (killer && !killer.isDead && killer instanceof Player) {
      const expReward = monster.expReward;
      const progress = killer.addExperience(expReward);
      this.db.savePlayer(killer);

      const killerConn = this.connections.get(killer.id);
      if (killerConn) {
        killerConn.send(Opcode.S2C_PLAYER_EXP_UPDATE, {
          playerId: killer.id,
          currentXp: killer.currentXp,
          xpToNextLevel: killer.xpToNextLevel,
          level: killer.level,
          expGained: expReward,
          source: monster.name,
        } as S2CPlayerExpUpdatePayload);
      }

      if (progress.leveledUp) {
        this.broadcast(Opcode.S2C_PLAYER_LEVEL_UP, {
          playerId: killer.id,
          newLevel: killer.level,
          newAttributes: killer.attributes,
          newMaxHp: killer.maxHp,
          newMaxResource: killer.maxResource,
          totalCombatPower: killer.CombatPower,
          rebornCount: killer.rebornCount,
          honorTitle: killer.HonorTitle,
        } as S2CPlayerLevelUpPayload);

        // Notify killer with fresh inventory / CP
        if (killerConn) {
          killerConn.send(Opcode.S2C_INVENTORY_UPDATE, {
            slots: killer.inventory,
            gold: killer.gold,
            maxSlots: killer.maxInventorySlots,
            totalCombatPower: killer.CombatPower,
          } as S2CInventoryUpdatePayload);
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
      if (this.currentStage < 10) {
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
    const rolledDrops = monster.rollLoot();
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

  public lootItem(player: Player, dropId: string): boolean {
    const drop = this.activeItemDrops.get(dropId);
    if (!drop) return false;

    // Validate distance (generous leeway up to 7.0m for tap or lag)
    if (distance(player.position, drop.position) > 7.0) {
      return false;
    }

    if (drop.itemId === 'gold') {
      player.gold = this.db.updateCharacterGold(player.dbCharacterId, drop.quantity);
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
      const shouldAutoSell = itemDef && (
        (itemDef.rarity === ItemRarity.COMUM && player.farmSettings.autoSellCommon) ||
        (itemDef.rarity === ItemRarity.INCOMUM && player.farmSettings.autoSellUncommon) ||
        (itemDef.rarity === ItemRarity.RARO && player.farmSettings.autoSellRare)
      );

      if (shouldAutoSell) {
        const earnedGold = (itemDef.sellPrice || 10) * drop.quantity;
        player.gold = this.db.updateCharacterGold(player.dbCharacterId, earnedGold);

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
      if (item.itemId === 'potion_hp_minor') {
        player.heal(50);
      } else if (item.itemId === 'potion_hp_major') {
        player.heal(150);
      } else if (item.itemId === 'potion_mp_minor') {
        player.restoreResource(40);
      } else if (item.itemId === 'potion_mp_major') {
        player.restoreResource(100);
      }
      this.db.removeItemFromInventory(player.dbCharacterId, slotIndex, 1);
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

  public sellPlayerItem(player: Player, slotIndex: number): boolean {
    const item = player.inventory.find((i) => i.slotIndex === slotIndex);
    if (!item || item.isEquipped) return false;

    const itemDef = ITEMS_DATABASE[item.itemId];
    if (!itemDef) return false;

    const earnedGold = (itemDef.sellPrice || 1) * item.quantity;
    this.db.removeItemFromInventory(player.dbCharacterId, slotIndex, item.quantity);
    player.gold = this.db.updateCharacterGold(player.dbCharacterId, earnedGold);
    player.inventory = this.db.getInventory(player.dbCharacterId);

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
          (i) => (i.itemId === 'potion_hp_major' || i.itemId === 'potion_hp_minor') && i.quantity > 0
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
          (i) => (i.itemId === 'potion_mp_major' || i.itemId === 'potion_mp_minor') && i.quantity > 0
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

    // Clona o array para iterar com segurança enquanto remove do SQLite
    for (const item of [...player.inventory]) {
      if (item.isEquipped) continue;

      const def = ITEMS_DATABASE[item.itemId];
      if (!def) continue;

      const isCommon = def.rarity === ItemRarity.COMUM;
      const isUncommon = def.rarity === ItemRarity.INCOMUM;
      const isRare = includeRare && def.rarity === ItemRarity.RARO;

      if (isCommon || isUncommon || isRare) {
        const itemGold = (def.sellPrice || 10) * item.quantity;
        this.db.removeItemFromInventory(player.dbCharacterId, item.slotIndex, item.quantity);
        goldEarned += itemGold;
        itemsSold += item.quantity;
      }
    }

    if (itemsSold > 0) {
      player.gold = this.db.updateCharacterGold(player.dbCharacterId, goldEarned);
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

  public challengeStageBoss(player?: Player): { success: boolean; reason?: string } {
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

    this.entityManager.addMonster(boss);
    this.spatialGrid.updateEntity(boss);

    this.isBossActive = true;
    this.isBossAvailable = false;
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

  public static readonly INVENTORY_EXPANSIONS: Record<number, { cost: number; minLevel: number; minReborn?: number }> = {
    20: { cost: 10_000, minLevel: 15 },
    25: { cost: 50_000, minLevel: 25 },
    30: { cost: 250_000, minLevel: 35 },
    35: { cost: 1_000_000, minLevel: 45 },
    40: { cost: 3_500_000, minLevel: 50 },
    45: { cost: 10_000_000, minLevel: 50, minReborn: 1 },
  };

  public expandPlayerInventory(player: Player): { success: boolean; reason?: string; newMaxSlots?: number } {
    const conn = this.connections.get(player.id);

    if (player.maxInventorySlots >= 50) {
      const reason = 'Mochila já atingiu a capacidade máxima (50 slots)!';
      if (conn) {
        conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
          success: false,
          newMaxSlots: 50,
          goldSpent: 0,
          remainingGold: player.gold,
          message: reason,
        } as S2CExpandInventoryResultPayload);
      }
      return { success: false, reason };
    }

    const tier = World.INVENTORY_EXPANSIONS[player.maxInventorySlots] || {
      cost: 10_000,
      minLevel: 15,
    };

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
      const reason = `Nível insuficiente! Requer Nível ${tier.minLevel} para expandir para ${player.maxInventorySlots + 5} slots.`;
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

    const nextTier = World.INVENTORY_EXPANSIONS[player.maxInventorySlots];

    if (conn) {
      conn.send(Opcode.S2C_EXPAND_INVENTORY_RESULT, {
        success: true,
        newMaxSlots: player.maxInventorySlots,
        goldSpent: tier.cost,
        remainingGold: player.gold,
        nextExpansionCost: nextTier?.cost,
        nextExpansionMinLevel: nextTier?.minLevel,
        message: `🎉 Mochila expandida com sucesso para ${player.maxInventorySlots} slots (+5 novos slots)! (-${tier.cost.toLocaleString()} Ouro)`,
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
    const res = this.db.discardOrRecycleItem(player.dbCharacterId, slotIndex);
    if (!res.success) return false;

    player.inventory = this.db.getInventory(player.dbCharacterId);
    player.gold = this.db.getCharacterGold(player.dbCharacterId);
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

    // Consumo de materiais e ouro
    player.gold = this.db.updateCharacterGold(player.dbCharacterId, -goldCost);
    this.db.consumeItemQuantity(player.dbCharacterId, stoneId, stoneQty);
    if (extraMatId && extraMatQty > 0) {
      this.db.consumeItemQuantity(player.dbCharacterId, extraMatId, extraMatQty);
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
      if (newLevel >= 10) {
        this.broadcast(Opcode.S2C_CHAT_MESSAGE, {
          senderId: 'Forja Celestial',
          senderName: '⚒️ Sucesso Lendário',
          message: `🔥 O herói ${player.name} forjou com maestria [${itemDef.name}] +${newLevel}!`,
          channel: 'system',
          timestamp: Date.now(),
        });
      }
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

    this.db.refineEquipmentItem(player.dbCharacterId, slotIndex, newLevel);
    player.inventory = this.db.getInventory(player.dbCharacterId);
    player.recalculateStatsFromEquipment();

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
