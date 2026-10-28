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
  S2CWorldSnapshotPayload,
  SKILLS_DATABASE,
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
} from '@magicforge/shared';
import { EntityManager } from './EntityManager';
import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Monster, MonsterState } from '../entities/Monster';
import { Connection } from '../network/Connection';
import { SpatialGrid } from './SpatialGrid';
import { SERVER_CONFIG } from '../config';
import { DatabaseManager } from '../database/DatabaseManager';
import { SocialAuthService } from '../auth/SocialAuthService';

export class World {
  public readonly entityManager = new EntityManager();
  public readonly spatialGrid = new SpatialGrid(20.0);
  public readonly db: DatabaseManager;
  public currentTick: number = 0;
  public activeItemDrops = new Map<string, ItemDropState>();
  private connections = new Map<string, Connection>();

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
    this.spawnInitialMonsters();
  }

  private spawnInitialMonsters(): void {
    const mobSpawns = [
      // Quadrante Noroeste (12m - 32m)
      { name: 'Slime da Floresta', pos: createVector3(-14, 0, 12), hp: 120, damage: 8 },
      { name: 'Goblin Lanceiro', pos: createVector3(-20, 0, 18), hp: 90, damage: 12 },
      { name: 'Goblin Arqueiro', pos: createVector3(-26, 0, 14), hp: 70, damage: 16 },
      { name: 'Lobo Selvagem', pos: createVector3(-16, 0, 26), hp: 100, damage: 14 },

      // Quadrante Nordeste (12m - 32m)
      { name: 'Slime da Floresta', pos: createVector3(14, 0, 14), hp: 120, damage: 8 },
      { name: 'Lobo Selvagem', pos: createVector3(22, 0, 12), hp: 100, damage: 14 },
      { name: 'Goblin Lanceiro', pos: createVector3(25, 0, 22), hp: 90, damage: 12 },
      { name: 'Goblin Arqueiro', pos: createVector3(18, 0, 26), hp: 70, damage: 16 },

      // Quadrante Sudoeste (12m - 32m)
      { name: 'Slime da Floresta', pos: createVector3(-12, 0, -15), hp: 120, damage: 8 },
      { name: 'Lobo Selvagem', pos: createVector3(-22, 0, -14), hp: 100, damage: 14 },
      { name: 'Goblin Lanceiro', pos: createVector3(-16, 0, -25), hp: 90, damage: 12 },
      { name: 'Goblin Arqueiro', pos: createVector3(-26, 0, -22), hp: 70, damage: 16 },

      // Quadrante Sudeste (12m - 32m)
      { name: 'Goblin Lanceiro', pos: createVector3(15, 0, -14), hp: 90, damage: 12 },
      { name: 'Lobo Selvagem', pos: createVector3(24, 0, -12), hp: 100, damage: 14 },
      { name: 'Slime da Floresta', pos: createVector3(14, 0, -24), hp: 120, damage: 8 },
      { name: 'Goblin Arqueiro', pos: createVector3(25, 0, -24), hp: 70, damage: 16 },

      // Santuários Externos (Mini-Chefes a 30m - 36m)
      { name: 'Chefe Goblin', pos: createVector3(-32, 0, 20), hp: 350, damage: 28 },
      { name: 'Chefe Goblin', pos: createVector3(32, 0, -20), hp: 350, damage: 28 },
    ];

    mobSpawns.forEach((spawn, idx) => {
      const monster = new Monster(`mob_${idx + 1}`, spawn.name, spawn.pos, spawn.hp, spawn.damage);
      this.entityManager.addMonster(monster);
      this.spatialGrid.updateEntity(monster);
    });

    console.log(`[World] Spawned ${mobSpawns.length} active combat monsters in the battle arena.`);
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

    // 2. Envia entidades existentes na arena para o jogador recém-conectado
    const allEntities = this.entityManager.getAllEntities();
    for (const ent of allEntities) {
      if (ent.id !== player.id) {
        connection.send(Opcode.S2C_ENTITY_SPAWN, {
          entity: ent.toSnapshotState(),
        } as S2CEntitySpawnPayload);
      }
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

    // 3. Update Boss Challenge Timer
    if (this.isBossActive) {
      this.bossTimerSec -= deltaTimeSec;
      if (this.bossTimerSec <= 0) {
        const boss = this.activeBossId ? this.entityManager.getMonster(this.activeBossId) : null;
        if (boss) {
          this.entityManager.removeMonster(boss.id);
          this.spatialGrid.removeEntity(boss.id);
          this.broadcast(Opcode.S2C_ENTITY_DESPAWN, { entityId: boss.id } as S2CEntityDespawnPayload);
        }
        this.isBossActive = false;
        this.activeBossId = null;
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
        player.attackTimer = player.attackIntervalSec;
      }
    }
  }

  private executePlayerAttack(player: Player, target: Monster): void {
    const wasAlive = !target.isDead;
    const rawDamage = player.BaseDamage;
    // Simple critical strike formula based on DEX
    const isCritical = Math.random() < (player.attributes.destreza * 0.015);
    const finalDamage = isCritical ? Math.round(rawDamage * 1.5) : rawDamage;

    target.takeDamage(finalDamage);

    const combatEvent: S2CCombatEventPayload = {
      attackerId: player.id,
      targetId: target.id,
      damage: finalDamage,
      isCritical,
      isDodged: false,
      targetRemainingHp: target.currentHp,
      targetMaxHp: target.maxHp,
      isTargetDead: target.isDead,
    };

    this.broadcast(Opcode.S2C_COMBAT_EVENT, combatEvent);

    if (wasAlive && target.isDead) {
      this.handleMonsterDeath(target, player);
    }
  }

  private processMonsterCombat(monster: Monster): void {
    if (monster.isDead || monster.state !== MonsterState.ATTACKING || !monster.targetPlayer) return;

    const player = monster.targetPlayer as Player;
    if (player.isDead) return;

    if (monster.attackCooldown <= 0) {
      const damage = monster.attackDamage;
      // Dodge check based on player DEX
      const isDodged = Math.random() < (player.attributes.destreza * 0.01);

      if (!isDodged) {
        player.takeDamage(damage);
      }

      const combatEvent: S2CCombatEventPayload = {
        attackerId: monster.id,
        targetId: player.id,
        damage: isDodged ? 0 : damage,
        isCritical: false,
        isDodged,
        targetRemainingHp: player.currentHp,
        targetMaxHp: player.maxHp,
        isTargetDead: player.isDead,
      };

      this.broadcast(Opcode.S2C_COMBAT_EVENT, combatEvent);
      monster.attackCooldown = monster.attackIntervalSec;

      if (player.isDead && this.isBossActive && monster.id === this.activeBossId) {
        // O jogador foi derrotado pelo chefão: o chefão recua para não causar spawn-camp
        this.entityManager.removeMonster(monster.id);
        this.spatialGrid.removeEntity(monster.id);
        this.broadcast(Opcode.S2C_ENTITY_DESPAWN, { entityId: monster.id } as S2CEntityDespawnPayload);
        this.isBossActive = false;
        this.activeBossId = null;
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

  /**
   * Conjuração Autoritativa de Habilidades Ativas (Slots 1 a 4)
   */
  public castPlayerSkill(player: Player, slot: number, targetId?: string, targetPos?: Vector3): boolean {
    if (player.isDead) return false;

    const skillKey = player.getEquippedSkill(slot) || `${player.classType.toLowerCase()}_${slot}`;
    const skill = SKILLS_DATABASE[skillKey];
    if (!skill) {
      console.warn(`[World] Skill não encontrada: ${skillKey}`);
      return false;
    }

    // 0. Validação de Nível Mínimo do Slot (D&D 5E Spell Slot Unlock)
    if (player.level < skill.unlockLevel) {
      const conn = this.connections.get(player.id);
      if (conn) {
        conn.send(Opcode.S2C_CHAT_MESSAGE, {
          senderId: 'Grimório',
          senderName: '🔒 Nível Insuficiente',
          message: `O Slot ${slot} (${skill.tierName}) requer Nível ${skill.unlockLevel} para ser conjurado!`,
          channel: 'system',
          timestamp: Date.now(),
        });
      }
      return false;
    }

    // 1. Validação de Cooldown
    if (player.getSkillCooldown(slot) > 0) {
      return false;
    }

    // 2. Validação de Recurso (Mana / Energia)
    if (!player.consumeResource(skill.cost)) {
      return false;
    }

    // 3. Inicia o Cooldown
    player.setSkillCooldown(slot, skill.cooldownSec);

    // 4. Calcula Poder (Fórmula D&D)
    const power = calculateSkillPower(skill, player.attributes, player.level);
    const isCritical = Math.random() < (player.attributes.destreza * 0.02);
    const finalPower = isCritical ? Math.round(power * 1.5) : power;

    const affectedIds: string[] = [];

    // 5. Aplica Efeito
    if (skill.isHeal) {
      player.heal(finalPower);
      affectedIds.push(player.id);
    } else if (skill.isAoe) {
      // Habilidade em Área
      const aoeOrigin = targetPos || player.position;
      const radiusSq = (skill.aoeRadius || 5.0) * (skill.aoeRadius || 5.0);

      const nearbyMonsters = this.entityManager.getAllMonsters();
      for (const m of nearbyMonsters) {
        if (!m.isDead && distanceSquared(aoeOrigin, m.position) <= radiusSq) {
          const wasAlive = !m.isDead;
          m.takeDamage(finalPower);
          affectedIds.push(m.id);
          if (wasAlive && m.isDead) {
            this.handleMonsterDeath(m, player);
          }
        }
      }
    } else {
      // Alvo Único
      let target: Entity | null = targetId ? (this.entityManager.getEntity(targetId) || null) : null;
      if (!target || target.isDead) {
        target = this.entityManager.findNearestMonster(player.position, skill.range);
      }

      if (target && !target.isDead && target instanceof Monster) {
        const d = distance(player.position, target.position);
        if (d <= skill.range * 1.3) {
          const wasAlive = !target.isDead;
          target.takeDamage(finalPower);
          affectedIds.push(target.id);
          if (wasAlive && target.isDead) {
            this.handleMonsterDeath(target, player);
          }
        }
      }
    }

    // 6. Transmite Evento de Conjuração para Todos na Área
    const castPayload: S2CSkillCastEventPayload = {
      casterId: player.id,
      skillId: skill.skillId,
      slot: skill.slot,
      skillName: skill.name,
      targetId: targetId || (affectedIds.length > 0 ? affectedIds[0] : undefined),
      targetPosition: targetPos,
      damageOrHeal: finalPower,
      isHeal: skill.isHeal,
      isCritical,
      affectedEntityIds: affectedIds,
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
    if (this.isBossActive && monster.id === this.activeBossId) {
      this.isBossActive = false;
      this.activeBossId = null;
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
    let bossHp: number;
    let bossAtk: number;
    let bossExp: number;

    switch (this.currentWorld) {
      case 1:
        bossName = 'Grimgor, o Senhor Rúnico da Floresta';
        bossHp = 6000;
        bossAtk = 52;
        bossExp = 1500;
        break;
      case 2:
        bossName = 'Frostbite, a Matriarca dos Lobos Gélidos';
        bossHp = 15000;
        bossAtk = 95;
        bossExp = 3800;
        break;
      case 3:
        bossName = 'Ignis, o Titã da Forja Vulcânica';
        bossHp = 32000;
        bossAtk = 160;
        bossExp = 9000;
        break;
      default:
        bossName = `Lorde Titânico Astral (Mundo ${this.currentWorld})`;
        bossHp = 32000 + (this.currentWorld - 3) * 20000;
        bossAtk = 160 + (this.currentWorld - 3) * 40;
        bossExp = 9000 * this.currentWorld;
        break;
    }

    const boss = new Monster(`boss_${Date.now()}`, bossName, createVector3(0, 0, 4), bossHp, bossAtk);
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

    // Salto Dimensional para o próximo mundo!
    this.isPortalOpen = false;
    this.currentWorld += 1;
    this.currentStage = 1;
    this.stageKills = 0;
    this.isBossActive = false;
    this.isBossAvailable = false;

    player.currentWorld = this.currentWorld;
    player.currentStage = this.currentStage;
    this.db.savePlayer(player);

    player.position.x = 0;
    player.position.y = 0;
    player.position.z = -10;
    player.targetDestination = null;
    player.moveDirection = null;

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
}
