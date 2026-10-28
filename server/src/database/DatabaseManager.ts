import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'path';
import {
  CharacterClass,
  CLASS_DEFINITIONS,
  createVector3,
  Vector3,
  InventoryItemPayload,
  ITEMS_DATABASE,
  CharacterAttributes,
  CharacterSlotSummary,
  CardAlbumEntryPayload,
  CARDS_DATABASE,
  FarmHelperSettingsPayload,
  LeaderboardCategory,
  LeaderboardEntryPayload,
} from '@magicforge/shared';
import { Player } from '../entities/Player';
import { VerifiedSocialProfile } from '../auth/SocialAuthService';

export interface AccountRecord {
  id: string;
  username: string;
  password_hash?: string | null;
  password_salt?: string | null;
  auth_provider?: string | null;
  provider_user_id?: string | null;
  email?: string | null;
  is_activated?: number;
  created_at: number;
  last_login: number;
}

export interface CharacterRecord {
  id: string;
  account_id: string;
  name: string;
  class_type: string;
  level: number;
  slot_index: number;
  reborn_count?: number;
  current_world?: number;
  current_stage?: number;
  experience: number;
  gold: number;
  max_inventory_slots?: number;
  slot1_skill?: string;
  slot2_skill?: string;
  slot3_skill?: string;
  slot4_skill?: string;
  auto_hp_enabled?: number;
  auto_hp_threshold?: number;
  auto_mp_enabled?: number;
  auto_mp_threshold?: number;
  auto_sell_common?: number;
  auto_sell_uncommon?: number;
  auto_sell_rare?: number;
  auto_loot?: number;
  current_hp: number;
  max_hp: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  forca: number;
  destreza: number;
  constituicao: number;
  inteligencia: number;
  sabedoria: number;
  carisma: number;
  combat_power: number;
  created_at: number;
  updated_at: number;
}

export class DatabaseManager {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.resolve(__dirname, '../../data/magicforge.db');
    console.log(`[Database] Conectando ao SQLite em: ${resolvedPath}`);
    this.db = new DatabaseSync(resolvedPath);
    
    // Ativa suporte a Foreign Keys e WAL mode para alta concorrência
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');

    this.initTables();
  }

  public close(): void {
    try {
      this.db.close();
    } catch {}
  }

  /**
   * Cria as tabelas iniciais caso não existam (DDL idêntico ao SQL Server / ANSI SQL)
   */
  private initTables(): void {
    // 1. Tabela de Contas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL,
        last_login INTEGER NOT NULL
      );
    `);

    // 2. Tabela de Personagens (Heróis)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        name TEXT UNIQUE NOT NULL,
        class_type TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        experience INTEGER NOT NULL DEFAULT 0,
        gold INTEGER NOT NULL DEFAULT 0,
        current_hp INTEGER NOT NULL,
        max_hp INTEGER NOT NULL,
        pos_x REAL NOT NULL DEFAULT 0.0,
        pos_y REAL NOT NULL DEFAULT 0.0,
        pos_z REAL NOT NULL DEFAULT 0.0,
        forca INTEGER NOT NULL,
        destreza INTEGER NOT NULL,
        constituicao INTEGER NOT NULL,
        inteligencia INTEGER NOT NULL,
        sabedoria INTEGER NOT NULL,
        carisma INTEGER NOT NULL,
        combat_power INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_characters_account ON characters(account_id);
      CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
    `);

    // 3. Tabela de Inventário
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        slot_index INTEGER NOT NULL,
        is_equipped INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE
      );
    `);

    try {
      this.db.exec('ALTER TABLE inventory ADD COLUMN is_equipped INTEGER NOT NULL DEFAULT 0;');
    } catch {
      // Ignora se a coluna já existir
    }

    try {
      this.db.exec('ALTER TABLE characters ADD COLUMN max_inventory_slots INTEGER NOT NULL DEFAULT 20;');
    } catch {
      // Ignora se a coluna já existir
    }

    try {
      this.db.exec('ALTER TABLE characters ADD COLUMN slot1_skill TEXT;');
      this.db.exec('ALTER TABLE characters ADD COLUMN slot2_skill TEXT;');
      this.db.exec('ALTER TABLE characters ADD COLUMN slot3_skill TEXT;');
      this.db.exec('ALTER TABLE characters ADD COLUMN slot4_skill TEXT;');
    } catch {
      // Ignora se as colunas já existirem
    }

    try {
      this.db.exec('ALTER TABLE characters ADD COLUMN slot_index INTEGER NOT NULL DEFAULT 0;');
    } catch {
      // Ignora se a coluna já existir
    }

    try {
      this.db.exec('ALTER TABLE characters ADD COLUMN reborn_count INTEGER NOT NULL DEFAULT 0;');
    } catch {
      // Ignora se a coluna já existir
    }

    try {
      this.db.exec('ALTER TABLE characters ADD COLUMN current_world INTEGER NOT NULL DEFAULT 1;');
    } catch {
      // Ignora se a coluna já existir
    }

    try {
      this.db.exec('ALTER TABLE characters ADD COLUMN current_stage INTEGER NOT NULL DEFAULT 1;');
    } catch {
      // Ignora se a coluna já existir
    }

    // Configurações do Farm Helper (Automação Idle)
    try {
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_hp_enabled INTEGER NOT NULL DEFAULT 1;');
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_hp_threshold INTEGER NOT NULL DEFAULT 60;');
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_mp_enabled INTEGER NOT NULL DEFAULT 1;');
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_mp_threshold INTEGER NOT NULL DEFAULT 40;');
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_sell_common INTEGER NOT NULL DEFAULT 0;');
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_sell_uncommon INTEGER NOT NULL DEFAULT 0;');
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_sell_rare INTEGER NOT NULL DEFAULT 0;');
      this.db.exec('ALTER TABLE characters ADD COLUMN auto_loot INTEGER NOT NULL DEFAULT 1;');
    } catch {
      // Ignora se as colunas já existirem
    }

    try {
      this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_account_slot ON characters(account_id, slot_index);');
    } catch {
      // Ignora se o índice já existir
    }

    try {
      this.db.exec('ALTER TABLE inventory ADD COLUMN refine_level INTEGER NOT NULL DEFAULT 0;');
    } catch {
      // Ignora se a coluna já existir
    }

    // Tabela de Gemas Engastadas nos Equipamentos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS equipment_gems (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        inventory_id TEXT NOT NULL,
        socket_index INTEGER NOT NULL,
        gem_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
        UNIQUE(inventory_id, socket_index)
      );
    `);

    // Tabela do Álbum de Cartas de Monstros
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS character_cards (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        card_id TEXT NOT NULL,
        is_equipped INTEGER NOT NULL DEFAULT 0,
        equipped_slot INTEGER NOT NULL DEFAULT -1,
        count INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE,
        UNIQUE(character_id, card_id)
      );
    `);

    // Migrações da Tabela de Contas (Autenticação e Multi-Provider)
    try {
      this.db.exec('ALTER TABLE accounts ADD COLUMN password_hash TEXT;');
    } catch {}
    try {
      this.db.exec('ALTER TABLE accounts ADD COLUMN password_salt TEXT;');
    } catch {}
    try {
      this.db.exec("ALTER TABLE accounts ADD COLUMN auth_provider TEXT DEFAULT 'LOCAL';");
    } catch {}
    try {
      this.db.exec('ALTER TABLE accounts ADD COLUMN provider_user_id TEXT;');
    } catch {}
    try {
      this.db.exec('ALTER TABLE accounts ADD COLUMN email TEXT;');
    } catch {}
    try {
      this.db.exec('ALTER TABLE accounts ADD COLUMN is_activated INTEGER NOT NULL DEFAULT 1;');
    } catch {}

    // Migração de contas legadas: Contas criadas anteriormente sem senha ficam com is_activated = 0
    // até serem ativadas com nova senha por comprovação de posse do herói
    try {
      this.db.exec(`UPDATE accounts SET is_activated = 0 WHERE (password_hash IS NULL OR password_hash = '') AND is_activated = 1;`);
    } catch {}

    console.log('[Database] Tabelas do banco de dados verificadas e prontas!');
  }

  private hashPassword(password: string, salt: string): string {
    return scryptSync(password, salt, 64).toString('hex');
  }

  private generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  public getAccountByUsername(username: string): AccountRecord | null {
    const cleanUsername = username.trim().toLowerCase();
    const query = this.db.prepare('SELECT * FROM accounts WHERE LOWER(username) = ?');
    const existing = query.get(cleanUsername) as AccountRecord | undefined;
    return existing || null;
  }

  public getAccountById(accountId: string): AccountRecord | null {
    const query = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
    const existing = query.get(accountId) as AccountRecord | undefined;
    return existing || null;
  }

  /**
   * Autentica uma conta local existente via usuário e senha
   */
  public authenticateAccount(
    username: string,
    password?: string
  ): { success: boolean; account?: AccountRecord; error?: 'USER_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'LEGACY_ACCOUNT_UNCLAIMED'; message?: string } {
    const cleanUsername = username.trim().toLowerCase();
    const account = this.getAccountByUsername(cleanUsername);

    if (!account) {
      return { success: false, error: 'USER_NOT_FOUND', message: `Conta "${cleanUsername}" não foi encontrada.` };
    }

    // Se a conta não possui hash de senha, ela é uma conta legada criada antes do sistema de senhas
    if (!account.password_hash || !account.password_salt) {
      return {
        success: false,
        error: 'LEGACY_ACCOUNT_UNCLAIMED',
        message: 'Esta conta é legada e precisa ser ativada comprovando a posse do herói.',
      };
    }

    if (!password) {
      return { success: false, error: 'INVALID_CREDENTIALS', message: 'Senha não fornecida.' };
    }

    const computedHash = this.hashPassword(password, account.password_salt);
    const isValid =
      computedHash.length === account.password_hash.length &&
      timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(account.password_hash, 'hex'));

    if (!isValid) {
      return { success: false, error: 'INVALID_CREDENTIALS', message: 'Nome de usuário ou senha incorretos.' };
    }

    const now = Date.now();
    this.db.prepare('UPDATE accounts SET last_login = ? WHERE id = ?').run(now, account.id);
    account.last_login = now;

    return { success: true, account };
  }

  /**
   * Cadastra uma nova conta com usuário e senha
   */
  public registerAccount(
    username: string,
    password?: string,
    email?: string
  ): { success: boolean; account?: AccountRecord; error?: 'USER_EXISTS' | 'INVALID_CREDENTIALS' | 'INVALID_PASSWORD' | 'INVALID_EMAIL'; message?: string } {
    const cleanUsername = username.trim().toLowerCase();

    // Validação de formato de usuário (3 a 20 caracteres alfanuméricos e underscore)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'O nome da conta deve conter de 3 a 20 caracteres (apenas letras, números e _).',
      };
    }

    if (!password || password.length < 4) {
      return {
        success: false,
        error: 'INVALID_PASSWORD',
        message: 'A senha deve possuir pelo menos 4 caracteres.',
      };
    }

    // Validação estrita de Email (obrigatório e válido para cadastro de conta)
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
      return {
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Informe um email válido para criar sua conta.',
      };
    }

    const existing = this.getAccountByUsername(cleanUsername);
    if (existing) {
      return {
        success: false,
        error: 'USER_EXISTS',
        message: `O nome de usuário "${cleanUsername}" já está em uso.`,
      };
    }

    const salt = this.generateSalt();
    const hash = this.hashPassword(password, salt);
    const now = Date.now();
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    this.db.prepare(`
      INSERT INTO accounts (id, username, password_hash, password_salt, auth_provider, email, is_activated, created_at, last_login)
      VALUES (?, ?, ?, ?, 'LOCAL', ?, 1, ?, ?)
    `).run(accountId, cleanUsername, hash, salt, cleanEmail, now, now);

    const newAccount: AccountRecord = {
      id: accountId,
      username: cleanUsername,
      password_hash: hash,
      password_salt: salt,
      auth_provider: 'LOCAL',
      email: cleanEmail,
      is_activated: 1,
      created_at: now,
      last_login: now,
    };

    console.log(`[Database] Nova conta registrada com sucesso: "${cleanUsername}" (ID: ${accountId})`);
    return { success: true, account: newAccount };
  }

  /**
   * Ativação segura de conta legada por Comprovação de Posse (Proof-of-Ownership)
   * Evita sequestro de contas criadas em testes anteriores exigindo o nome e classe de um herói na conta.
   */
  public claimLegacyAccount(
    username: string,
    verifyHeroName: string,
    verifyHeroClass: CharacterClass,
    newPassword: string,
    adminKey?: string
  ): { success: boolean; account?: AccountRecord; error?: 'USER_NOT_FOUND' | 'LEGACY_CLAIM_FAILED' | 'INVALID_PASSWORD'; message?: string } {
    const cleanUsername = username.trim().toLowerCase();
    const account = this.getAccountByUsername(cleanUsername);

    if (!account) {
      return { success: false, error: 'USER_NOT_FOUND', message: `Conta "${cleanUsername}" não foi encontrada.` };
    }

    if (account.password_hash && account.is_activated === 1) {
      return {
        success: false,
        error: 'LEGACY_CLAIM_FAILED',
        message: 'Esta conta já foi ativada com senha anteriormente. Utilize o login comum.',
      };
    }

    if (!newPassword || newPassword.length < 4) {
      return {
        success: false,
        error: 'INVALID_PASSWORD',
        message: 'A nova senha deve ter pelo menos 4 caracteres.',
      };
    }

    // Comprovação de posse:
    // Verifica se a conta possui um herói com o nome e classe informados, ou bypass com chave de admin
    const isAdmin = adminKey === 'magicforge_dev_claim_2026';
    let isOwnerVerified = isAdmin;

    if (!isOwnerVerified) {
      const charQuery = this.db.prepare(`
        SELECT id FROM characters
        WHERE account_id = ? AND LOWER(name) = LOWER(?) AND UPPER(class_type) = UPPER(?)
      `);
      const row = charQuery.get(account.id, verifyHeroName.trim(), verifyHeroClass);
      if (row) {
        isOwnerVerified = true;
      }
    }

    if (!isOwnerVerified) {
      console.warn(`[Database] Tentativa inválida de resgate de conta legada "${cleanUsername}" com herói "${verifyHeroName}" (${verifyHeroClass})`);
      return {
        success: false,
        error: 'LEGACY_CLAIM_FAILED',
        message: 'Comprovação de posse falhou: nome do herói ou classe não correspondem aos registros desta conta.',
      };
    }

    const salt = this.generateSalt();
    const hash = this.hashPassword(newPassword, salt);
    const now = Date.now();

    this.db.prepare(`
      UPDATE accounts
      SET password_hash = ?, password_salt = ?, is_activated = 1, auth_provider = 'LOCAL', last_login = ?
      WHERE id = ?
    `).run(hash, salt, now, account.id);

    account.password_hash = hash;
    account.password_salt = salt;
    account.is_activated = 1;
    account.auth_provider = 'LOCAL';
    account.last_login = now;

    console.log(`[Database] Conta legada "${cleanUsername}" ativada e reivindicada com sucesso por comprovação de posse!`);
    return { success: true, account };
  }

  /**
   * Autenticação via Perfil Social Criptograficamente Verificado
   */
  public authenticateVerifiedProfile(
    profile: VerifiedSocialProfile
  ): { success: boolean; account?: AccountRecord; error?: string; message?: string } {
    return this.authenticateSocial(profile.provider, profile.providerUserId, profile.email, profile.displayName);
  }

  /**
   * Autenticação via Provedores Sociais (Google, Apple, Discord, Facebook, Guest)
   * Pronta para produção com suporte a tokens de terceiros e modo Guest imediato.
   */
  public authenticateSocial(
    provider: string,
    token?: string,
    email?: string,
    displayName?: string
  ): { success: boolean; account?: AccountRecord; error?: string; message?: string } {
    const cleanProvider = provider.toUpperCase();
    const now = Date.now();

    if (cleanProvider === 'GUEST') {
      const guestToken = token || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      // Tenta achar a conta guest existente por token
      const existingQuery = this.db.prepare('SELECT * FROM accounts WHERE auth_provider = ? AND provider_user_id = ?');
      let account = existingQuery.get('GUEST', guestToken) as AccountRecord | undefined;

      if (account) {
        this.db.prepare('UPDATE accounts SET last_login = ? WHERE id = ?').run(now, account.id);
        account.last_login = now;
        return { success: true, account };
      }

      // Cria nova conta Guest
      const guestUsername = `guest_${Math.random().toString(36).substring(2, 8)}`;
      const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      this.db.prepare(`
        INSERT INTO accounts (id, username, auth_provider, provider_user_id, is_activated, created_at, last_login)
        VALUES (?, ?, 'GUEST', ?, 1, ?, ?)
      `).run(accountId, guestUsername, guestToken, now, now);

      account = {
        id: accountId,
        username: guestUsername,
        auth_provider: 'GUEST',
        provider_user_id: guestToken,
        is_activated: 1,
        created_at: now,
        last_login: now,
      };

      console.log(`[Database] Nova conta Convidado (GUEST) criada: "${guestUsername}" (ID: ${accountId})`);
      return { success: true, account };
    }

    // Google, Apple, Discord
    const providerUserId = token || email || `${cleanProvider.toLowerCase()}_${Date.now()}`;
    let account: AccountRecord | undefined;

    if (email) {
      account = this.db.prepare('SELECT * FROM accounts WHERE email = ?').get(email) as AccountRecord | undefined;
    }
    if (!account && providerUserId) {
      account = this.db.prepare('SELECT * FROM accounts WHERE auth_provider = ? AND provider_user_id = ?').get(cleanProvider, providerUserId) as AccountRecord | undefined;
    }

    if (account) {
      this.db.prepare('UPDATE accounts SET last_login = ?, auth_provider = ? WHERE id = ?').run(now, cleanProvider, account.id);
      account.last_login = now;
      account.auth_provider = cleanProvider;
      return { success: true, account };
    }

    // Criação de nova conta social
    let baseUsername = (displayName || (email ? email.split('@')[0] : cleanProvider.toLowerCase())).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (baseUsername.length < 3) baseUsername = `${cleanProvider.toLowerCase()}_user`;
    if (baseUsername.length > 15) baseUsername = baseUsername.substring(0, 15);

    let candidateUsername = baseUsername;
    let suffix = 1;
    while (this.getAccountByUsername(candidateUsername)) {
      candidateUsername = `${baseUsername.substring(0, 14)}_${suffix++}`;
    }

    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.db.prepare(`
      INSERT INTO accounts (id, username, auth_provider, provider_user_id, email, is_activated, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(accountId, candidateUsername, cleanProvider, providerUserId, email || null, now, now);

    account = {
      id: accountId,
      username: candidateUsername,
      auth_provider: cleanProvider,
      provider_user_id: providerUserId,
      email: email || null,
      is_activated: 1,
      created_at: now,
      last_login: now,
    };

    console.log(`[Database] Nova conta Social (${cleanProvider}) registrada: "${candidateUsername}" (ID: ${accountId})`);
    return { success: true, account };
  }

  /**
   * Busca ou cria uma conta de jogador pelo nome de usuário
   */
  public getOrCreateAccount(username: string): AccountRecord {
    const cleanUsername = username.trim().toLowerCase();

    // SELECT igual ao SQL Server: SELECT * FROM accounts WHERE username = ...
    const query = this.db.prepare('SELECT * FROM accounts WHERE username = ?');
    const existing = query.get(cleanUsername) as AccountRecord | undefined;

    const now = Date.now();
    if (existing) {
      // UPDATE last_login
      this.db.prepare('UPDATE accounts SET last_login = ? WHERE id = ?').run(now, existing.id);
      return existing;
    }

    // INSERT INTO accounts
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.db.prepare(`
      INSERT INTO accounts (id, username, created_at, last_login)
      VALUES (?, ?, ?, ?)
    `).run(accountId, cleanUsername, now, now);

    return {
      id: accountId,
      username: cleanUsername,
      created_at: now,
      last_login: now,
    };
  }

  /**
   * Busca um personagem salvo pelo nome
   */
  public getCharacterByName(name: string): CharacterRecord | null {
    const query = this.db.prepare('SELECT * FROM characters WHERE name = ?');
    const row = query.get(name) as CharacterRecord | undefined;
    return row || null;
  }

  /**
   * Busca um personagem salvo pelo ID único
   */
  public getCharacterById(id: string): CharacterRecord | null {
    const query = this.db.prepare('SELECT * FROM characters WHERE id = ?');
    const row = query.get(id) as CharacterRecord | undefined;
    return row || null;
  }

  /**
   * Busca todos os personagens pertencentes a uma conta, ordenados pelo slot (0, 1, 2)
   */
  public getCharactersByAccountId(accountId: string): CharacterRecord[] {
    const query = this.db.prepare('SELECT * FROM characters WHERE account_id = ? ORDER BY slot_index ASC');
    return (query.all(accountId) as unknown as CharacterRecord[]) || [];
  }

  /**
   * Busca um personagem em um slot específico da conta
   */
  public getCharacterByAccountAndSlot(accountId: string, slotIndex: number): CharacterRecord | null {
    const query = this.db.prepare('SELECT * FROM characters WHERE account_id = ? AND slot_index = ?');
    const row = query.get(accountId, slotIndex) as unknown as CharacterRecord | undefined;
    return row || null;
  }

  /**
   * Retorna o resumo dos 3 slots de personagens da conta (para os pedestais rúnicos de login)
   */
  public getCharacterSlotsSummary(accountId: string): CharacterSlotSummary[] {
    const characters = this.getCharactersByAccountId(accountId);
    const map = new Map<number, CharacterRecord>();
    for (const c of characters) {
      map.set(c.slot_index, c);
    }

    const summaries: CharacterSlotSummary[] = [];
    for (let slot = 0; slot < 3; slot++) {
      const char = map.get(slot);
      if (char) {
        summaries.push({
          slotIndex: slot,
          isEmpty: false,
          id: char.id,
          name: char.name,
          classType: char.class_type as CharacterClass,
          level: char.level,
          currentWorld: char.current_world ?? 1,
          currentStage: char.current_stage ?? 1,
          combatPower: char.combat_power,
          currentHp: char.current_hp,
          maxHp: char.max_hp,
          gold: char.gold,
          rebornCount: char.reborn_count || 0,
          slot1Skill: char.slot1_skill,
          slot2Skill: char.slot2_skill,
          slot3Skill: char.slot3_skill,
          slot4Skill: char.slot4_skill,
        });
      } else {
        summaries.push({
          slotIndex: slot,
          isEmpty: true,
        });
      }
    }
    return summaries;
  }

  /**
   * Instancia e hidrata um objeto Player em memória a partir de um CharacterRecord do SQLite
   */
  public loadPlayerFromRecord(connectionId: string, existing: CharacterRecord): Player {
    console.log(`[Database] Carregando personagem do Slot ${existing.slot_index}: "${existing.name}" (Lvl ${existing.level})`);
    const savedPos = createVector3(existing.pos_x, existing.pos_y, existing.pos_z);
    const player = new Player(connectionId, existing.name, existing.class_type as CharacterClass, savedPos);

    player.dbCharacterId = existing.id;
    player.slotIndex = existing.slot_index;
    player.rebornCount = existing.reborn_count || 0;
    player.currentWorld = existing.current_world ?? 1;
    player.currentStage = existing.current_stage ?? 1;
    player.gold = existing.gold || 0;
    player.maxInventorySlots = existing.max_inventory_slots || 20;
    if (existing.slot1_skill) player.equippedSkills[1] = existing.slot1_skill;
    if (existing.slot2_skill) player.equippedSkills[2] = existing.slot2_skill;
    if (existing.slot3_skill) player.equippedSkills[3] = existing.slot3_skill;
    if (existing.slot4_skill) player.equippedSkills[4] = existing.slot4_skill;
    player.level = existing.level || 1;
    player.currentXp = existing.experience || 0;
    player.currentHp = Math.min(existing.max_hp, existing.current_hp);
    player.attributes = {
      forca: existing.forca,
      destreza: existing.destreza,
      constituicao: existing.constituicao,
      inteligencia: existing.inteligencia,
      sabedoria: existing.sabedoria,
      carisma: existing.carisma,
    };

    player.inventory = this.getInventory(player.dbCharacterId);
    player.cards = this.getCharacterCards(player.dbCharacterId);
    player.farmSettings = {
      autoHpPotionEnabled: existing.auto_hp_enabled !== undefined ? Boolean(existing.auto_hp_enabled) : true,
      autoHpPotionThreshold: existing.auto_hp_threshold ?? 60,
      autoMpPotionEnabled: existing.auto_mp_enabled !== undefined ? Boolean(existing.auto_mp_enabled) : true,
      autoMpPotionThreshold: existing.auto_mp_threshold ?? 40,
      autoSellCommon: Boolean(existing.auto_sell_common),
      autoSellUncommon: Boolean(existing.auto_sell_uncommon),
      autoSellRare: Boolean(existing.auto_sell_rare),
      autoLootEnabled: existing.auto_loot !== undefined ? Boolean(existing.auto_loot) : true,
    };
    player.recalculateStatsFromEquipment();
    player.currentHp = player.maxHp;
    player.isDead = false;
    return player;
  }

  /**
   * Cria autoritativamente um novo personagem em um slot específico (0, 1 ou 2)
   */
  public createCharacterInSlot(
    connectionId: string,
    accountId: string,
    slotIndex: number,
    characterName: string,
    classType: CharacterClass
  ): Player {
    if (slotIndex < 0 || slotIndex > 2) {
      throw new Error('INVALID_SLOT');
    }

    const trimmedName = characterName.trim();
    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 20) {
      throw new Error('INVALID_NAME');
    }

    if (this.getCharacterByName(trimmedName)) {
      throw new Error('NAME_TAKEN');
    }

    if (this.getCharacterByAccountAndSlot(accountId, slotIndex)) {
      throw new Error('SLOT_OCCUPIED');
    }

    console.log(`[Database] Criando novo herói no Slot ${slotIndex}: "${trimmedName}" (${classType}) para conta "${accountId}"`);
    const initialPos = createVector3(0, 0, 0);
    const player = new Player(connectionId, trimmedName, classType, initialPos);

    const now = Date.now();
    const charId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    player.dbCharacterId = charId;
    player.slotIndex = slotIndex;
    player.rebornCount = 0;
    player.gold = 50;

    this.db.prepare(`
      INSERT INTO characters (
        id, account_id, slot_index, reborn_count, current_world, current_stage, name, class_type, level, experience, gold,
        current_hp, max_hp, pos_x, pos_y, pos_z,
        forca, destreza, constituicao, inteligencia, sabedoria, carisma,
        combat_power, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      charId,
      accountId,
      slotIndex,
      0,
      1,
      1,
      trimmedName,
      classType,
      player.level,
      0,
      player.gold,
      player.currentHp,
      player.maxHp,
      player.position.x,
      player.position.y,
      player.position.z,
      player.attributes.forca,
      player.attributes.destreza,
      player.attributes.constituicao,
      player.attributes.inteligencia,
      player.attributes.sabedoria,
      player.attributes.carisma,
      player.CombatPower,
      now,
      now
    );

    // Concede pacote de suprimentos e equipamento inicial
    this.addItemToInventory(charId, 'potion_hp_minor', 3);
    this.addItemToInventory(charId, 'potion_mp_minor', 2);

    if (classType === CharacterClass.MAGO || classType === CharacterClass.BRUXO) {
      this.addItemToInventory(charId, 'staff_apprentice', 1);
    } else if (classType === CharacterClass.CLERIGO) {
      this.addItemToInventory(charId, 'mace_cleric_dawn', 1);
    } else if (classType === CharacterClass.ARQUEIRO) {
      this.addItemToInventory(charId, 'bow_short_apprentice', 1);
    } else {
      this.addItemToInventory(charId, 'sword_novice', 1);
    }

    player.inventory = this.getInventory(charId);
    player.recalculateStatsFromEquipment();
    return player;
  }

  /**
   * Carrega um personagem do SQLite ou cria um novo com base na classe escolhida (compatibilidade legada)
   */
  public loadOrCreatePlayer(
    connectionId: string,
    accountId: string,
    characterName: string,
    classType: CharacterClass
  ): Player {
    const existing = this.getCharacterByName(characterName);

    if (existing) {
      return this.loadPlayerFromRecord(connectionId, existing);
    }

    // Se não existir, cria no primeiro slot livre (0, 1 ou 2)
    let targetSlot = 0;
    while (targetSlot < 3 && this.getCharacterByAccountAndSlot(accountId, targetSlot)) {
      targetSlot++;
    }
    if (targetSlot > 2) targetSlot = 0; // fallback

    return this.createCharacterInSlot(connectionId, accountId, targetSlot, characterName, classType);
  }

  /**
   * Salva o estado atualizado do jogador (posição, vida, nível, atributos, ouro)
   */
  public savePlayer(player: Player): void {
    const now = Date.now();
    try {
      this.db.prepare(`
        UPDATE characters SET
          level = ?,
          experience = ?,
          reborn_count = ?,
          gold = ?,
          current_hp = ?,
          max_hp = ?,
          pos_x = ?,
          pos_y = ?,
          pos_z = ?,
          current_world = ?,
          current_stage = ?,
          forca = ?,
          destreza = ?,
          constituicao = ?,
          inteligencia = ?,
          sabedoria = ?,
          carisma = ?,
          combat_power = ?,
          auto_hp_enabled = ?,
          auto_hp_threshold = ?,
          auto_mp_enabled = ?,
          auto_mp_threshold = ?,
          auto_sell_common = ?,
          auto_sell_uncommon = ?,
          auto_sell_rare = ?,
          auto_loot = ?,
          max_inventory_slots = ?,
          updated_at = ?
        WHERE name = ?
      `).run(
        player.level,
        player.currentXp,
        player.rebornCount,
        player.gold,
        player.currentHp,
        player.maxHp,
        player.position.x,
        player.position.y,
        player.position.z,
        player.currentWorld,
        player.currentStage,
        player.attributes.forca,
        player.attributes.destreza,
        player.attributes.constituicao,
        player.attributes.inteligencia,
        player.attributes.sabedoria,
        player.attributes.carisma,
        player.CombatPower,
        player.farmSettings.autoHpPotionEnabled ? 1 : 0,
        player.farmSettings.autoHpPotionThreshold,
        player.farmSettings.autoMpPotionEnabled ? 1 : 0,
        player.farmSettings.autoMpPotionThreshold,
        player.farmSettings.autoSellCommon ? 1 : 0,
        player.farmSettings.autoSellUncommon ? 1 : 0,
        player.farmSettings.autoSellRare ? 1 : 0,
        player.farmSettings.autoLootEnabled ? 1 : 0,
        player.maxInventorySlots,
        now,
        player.name
      );
    } catch (err) {
      console.error(`[Database] Erro ao salvar personagem "${player.name}":`, err);
    }
  }

  public updateCharacterFarmSettings(characterId: string, settings: FarmHelperSettingsPayload): void {
    try {
      this.db.prepare(`
        UPDATE characters SET
          auto_hp_enabled = ?,
          auto_hp_threshold = ?,
          auto_mp_enabled = ?,
          auto_mp_threshold = ?,
          auto_sell_common = ?,
          auto_sell_uncommon = ?,
          auto_sell_rare = ?,
          auto_loot = ?
        WHERE id = ?
      `).run(
        settings.autoHpPotionEnabled ? 1 : 0,
        settings.autoHpPotionThreshold,
        settings.autoMpPotionEnabled ? 1 : 0,
        settings.autoMpPotionThreshold,
        settings.autoSellCommon ? 1 : 0,
        settings.autoSellUncommon ? 1 : 0,
        settings.autoSellRare ? 1 : 0,
        settings.autoLootEnabled ? 1 : 0,
        characterId
      );
    } catch (err) {
      console.error(`[Database] Erro ao salvar configurações de farm para "${characterId}":`, err);
    }
  }

  public getInventory(characterId: string): InventoryItemPayload[] {
    const query = this.db.prepare(
      'SELECT id, slot_index, item_id, quantity, is_equipped, refine_level FROM inventory WHERE character_id = ? ORDER BY slot_index ASC'
    );
    const rows = query.all(characterId) as Array<{
      id: string;
      slot_index: number;
      item_id: string;
      quantity: number;
      is_equipped: number;
      refine_level: number;
    }>;

    // Busca gemas engastadas nos itens desse personagem
    const gemQuery = this.db.prepare(
      'SELECT inventory_id, socket_index, gem_id FROM equipment_gems WHERE character_id = ?'
    );
    const gemRows = gemQuery.all(characterId) as Array<{
      inventory_id: string;
      socket_index: number;
      gem_id: string;
    }>;

    const gemMap = new Map<string, Array<{ socketIndex: number; gemId: string }>>();
    for (const g of gemRows) {
      if (!gemMap.has(g.inventory_id)) gemMap.set(g.inventory_id, []);
      gemMap.get(g.inventory_id)!.push({ socketIndex: g.socket_index, gemId: g.gem_id });
    }

    return rows.map((r) => ({
      slotIndex: r.slot_index,
      itemId: r.item_id,
      quantity: r.quantity,
      isEquipped: r.is_equipped === 1,
      refineLevel: r.refine_level || 0,
      sockets: gemMap.get(r.id) || [],
    }));
  }

  public addItemToInventory(characterId: string, itemId: string, quantity: number = 1, maxSlots: number = 20): boolean {
    const itemDef = ITEMS_DATABASE[itemId];
    if (!itemDef) return false;

    // Se for stackable, procura slot existente
    if (itemDef.maxStack > 1) {
      const existingQuery = this.db.prepare(
        'SELECT id, slot_index, quantity FROM inventory WHERE character_id = ? AND item_id = ? AND quantity < ?'
      );
      const existing = existingQuery.get(characterId, itemId, itemDef.maxStack) as {
        id: string;
        slot_index: number;
        quantity: number;
      } | undefined;

      if (existing) {
        const newQty = existing.quantity + quantity;
        this.db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?').run(newQty, existing.id);
        return true;
      }
    }

    // Acha primeiro slot livre entre 0 e maxSlots - 1
    const usedSlotsQuery = this.db.prepare('SELECT slot_index FROM inventory WHERE character_id = ?');
    const usedRows = usedSlotsQuery.all(characterId) as Array<{ slot_index: number }>;
    const usedSlots = new Set(usedRows.map((r) => r.slot_index));

    let freeSlot = -1;
    for (let i = 0; i < maxSlots; i++) {
      if (!usedSlots.has(i)) {
        freeSlot = i;
        break;
      }
    }

    if (freeSlot === -1) {
      return false; // Inventário cheio!
    }

    const rowId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.db.prepare(`
      INSERT INTO inventory (id, character_id, item_id, quantity, slot_index, is_equipped)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(rowId, characterId, itemId, quantity, freeSlot);

    return true;
  }

  public removeItemFromInventory(characterId: string, slotIndex: number, quantity: number = 1): boolean {
    const query = this.db.prepare('SELECT id, quantity FROM inventory WHERE character_id = ? AND slot_index = ?');
    const existing = query.get(characterId, slotIndex) as { id: string; quantity: number } | undefined;
    if (!existing) return false;

    if (existing.quantity > quantity) {
      this.db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?').run(existing.quantity - quantity, existing.id);
    } else {
      this.db.prepare('DELETE FROM inventory WHERE id = ?').run(existing.id);
    }
    return true;
  }

  public toggleEquipItem(
    characterId: string,
    slotIndex: number,
    playerClass?: CharacterClass,
    playerLevel?: number,
    playerAttrs?: CharacterAttributes
  ): { success: boolean; reason?: string } {
    const query = this.db.prepare('SELECT id, item_id, is_equipped FROM inventory WHERE character_id = ? AND slot_index = ?');
    const item = query.get(characterId, slotIndex) as { id: string; item_id: string; is_equipped: number } | undefined;
    if (!item) return { success: false, reason: 'Item não encontrado!' };

    const itemDef = ITEMS_DATABASE[item.item_id];
    if (!itemDef || itemDef.type !== 'EQUIPAMENTO') return { success: false, reason: 'Item não é um equipamento!' };

    if (item.is_equipped === 1) {
      // Desequipar o item atual
      this.db.prepare('UPDATE inventory SET is_equipped = 0 WHERE id = ?').run(item.id);
      return { success: true };
    }

    // Validação rígida de Classe (ex: Guerreiro não usa Cajado)
    if (playerClass && itemDef.allowedClasses && !itemDef.allowedClasses.includes(playerClass)) {
      return {
        success: false,
        reason: `Sua classe (${playerClass}) não possui proficiência com ${itemDef.name}!`,
      };
    }

    // Validação de Nível Mínimo
    if (playerLevel !== undefined && itemDef.minLevel && playerLevel < itemDef.minLevel) {
      return {
        success: false,
        reason: `Nível insuficiente! Requer Nível ${itemDef.minLevel} para empunhar este item.`,
      };
    }

    // Validação de Atributos Requeridos
    if (playerAttrs && itemDef.requiredAttributes) {
      for (const [attrKey, minVal] of Object.entries(itemDef.requiredAttributes)) {
        const currentVal = (playerAttrs as any)[attrKey] || 0;
        if (currentVal < (minVal || 0)) {
          return {
            success: false,
            reason: `Atributos insuficientes! Requer ${attrKey.toUpperCase()}: ${minVal}.`,
          };
        }
      }
    }

    // Ao equipar um novo item: desequipa automaticamente qualquer outro item do MESMO slot de equipamento
    const targetSlot = itemDef.equipmentSlot;
    if (targetSlot) {
      const equippedItemsQuery = this.db.prepare('SELECT id, item_id FROM inventory WHERE character_id = ? AND is_equipped = 1');
      const equippedItems = equippedItemsQuery.all(characterId) as Array<{ id: string; item_id: string }>;

      for (const eq of equippedItems) {
        const def = ITEMS_DATABASE[eq.item_id];
        if (def && def.equipmentSlot === targetSlot) {
          this.db.prepare('UPDATE inventory SET is_equipped = 0 WHERE id = ?').run(eq.id);
        }
      }
    }

    // Equipa o novo item selecionado
    this.db.prepare('UPDATE inventory SET is_equipped = 1 WHERE id = ?').run(item.id);
    return { success: true };
  }

  public expandInventorySlots(characterId: string, currentSlots: number, cost: number): number | null {
    const goldQuery = this.db.prepare('SELECT gold FROM characters WHERE id = ?');
    const charRow = goldQuery.get(characterId) as { gold: number } | undefined;
    if (!charRow || charRow.gold < cost) return null;

    const newSlots = currentSlots + 5;
    this.db.prepare('UPDATE characters SET gold = gold - ?, max_inventory_slots = ? WHERE id = ?').run(
      cost,
      newSlots,
      characterId
    );
    return newSlots;
  }

  public discardOrRecycleItem(
    characterId: string,
    slotIndex: number
  ): { success: true; goldGained: number; dustGained: number } | { success: false; reason: string } {
    const query = this.db.prepare('SELECT id, item_id, quantity, is_equipped FROM inventory WHERE character_id = ? AND slot_index = ?');
    const item = query.get(characterId, slotIndex) as { id: string; item_id: string; quantity: number; is_equipped: number } | undefined;
    if (!item) return { success: false, reason: 'Item não encontrado no slot' };
    if (item.is_equipped === 1) return { success: false, reason: 'Desequipe o item antes de reciclar!' };

    const itemDef = ITEMS_DATABASE[item.item_id];
    const sellPrice = itemDef?.sellPrice || 5;
    const goldGained = Math.max(1, Math.round(sellPrice * item.quantity * 0.5));
    const dustGained = itemDef?.type === 'EQUIPAMENTO' ? 2 : 1;

    this.db.prepare('DELETE FROM inventory WHERE id = ?').run(item.id);
    this.updateCharacterGold(characterId, goldGained);

    // Se for equipamento ou material mágico, concede pó arcano na bag
    if (dustGained > 0) {
      this.addItemToInventory(characterId, 'arcane_dust', dustGained);
    }

    return { success: true, goldGained, dustGained };
  }

  public getCharactersByAccount(accountId: string): CharacterRecord[] {
    const query = this.db.prepare('SELECT * FROM characters WHERE account_id = ? ORDER BY created_at ASC LIMIT 3');
    return (query.all(accountId) as unknown) as CharacterRecord[];
  }

  public getCharacterGold(characterId: string): number {
    const query = this.db.prepare('SELECT gold FROM characters WHERE id = ?');
    const row = query.get(characterId) as { gold: number } | undefined;
    return row ? Number(row.gold) : 0;
  }

  public updateCharacterGold(characterId: string, goldDelta: number): number {
    this.db.prepare('UPDATE characters SET gold = MIN(2000000000, MAX(0, gold + ?)) WHERE id = ?').run(goldDelta, characterId);
    const query = this.db.prepare('SELECT gold FROM characters WHERE id = ?');
    const row = query.get(characterId) as { gold: number } | undefined;
    return row ? Number(row.gold) : 0;
  }

  public updateCharacterSkills(characterId: string, skills: Record<number, string>): void {
    this.db.prepare(`
      UPDATE characters 
      SET slot1_skill = ?, slot2_skill = ?, slot3_skill = ?, slot4_skill = ?, updated_at = ?
      WHERE id = ?
    `).run(
      skills[1] || null,
      skills[2] || null,
      skills[3] || null,
      skills[4] || null,
      Date.now(),
      characterId
    );
  }

  // --- SUBMENU 2: REFINAMENTO DE EQUIPAMENTOS ---
  public refineEquipmentItem(characterId: string, slotIndex: number, newLevel: number): boolean {
    const res = this.db.prepare('UPDATE inventory SET refine_level = ? WHERE character_id = ? AND slot_index = ?').run(newLevel, characterId, slotIndex);
    return res.changes > 0;
  }

  // --- SUBMENU 3: ENGASTE DE GEMAS (SOCKETS) ---
  public socketGem(
    characterId: string,
    slotIndex: number,
    socketIndex: number,
    gemItemId: string
  ): { success: boolean; reason?: string } {
    if (socketIndex < 0 || socketIndex > 2) return { success: false, reason: 'Soquete inválido (deve ser 0, 1 ou 2)!' };

    // 1. Encontra o item de equipamento no slotIndex
    const itemQuery = this.db.prepare('SELECT id, item_id, is_equipped FROM inventory WHERE character_id = ? AND slot_index = ?');
    const item = itemQuery.get(characterId, slotIndex) as { id: string; item_id: string; is_equipped: number } | undefined;
    if (!item) return { success: false, reason: 'Equipamento não encontrado!' };

    // 2. Verifica se a gema existe no inventário do jogador
    const gemQuery = this.db.prepare('SELECT id, quantity FROM inventory WHERE character_id = ? AND item_id = ? AND quantity >= 1');
    const gemRow = gemQuery.get(characterId, gemItemId) as { id: string; quantity: number } | undefined;
    if (!gemRow) return { success: false, reason: 'Você não possui esta gema na mochila!' };

    // 3. Consome 1 gema da mochila
    if (gemRow.quantity > 1) {
      this.db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?').run(gemRow.quantity - 1, gemRow.id);
    } else {
      this.db.prepare('DELETE FROM inventory WHERE id = ?').run(gemRow.id);
    }

    // 4. Insere ou substitui no soquete
    const gemSocketId = `gem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.db.prepare(`
      INSERT OR REPLACE INTO equipment_gems (id, character_id, inventory_id, socket_index, gem_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(gemSocketId, characterId, item.id, socketIndex, gemItemId, Date.now());

    return { success: true };
  }

  public unsocketGem(
    characterId: string,
    slotIndex: number,
    socketIndex: number
  ): { success: boolean; gemId?: string; reason?: string } {
    const itemQuery = this.db.prepare('SELECT id FROM inventory WHERE character_id = ? AND slot_index = ?');
    const item = itemQuery.get(characterId, slotIndex) as { id: string } | undefined;
    if (!item) return { success: false, reason: 'Equipamento não encontrado!' };

    const socketQuery = this.db.prepare('SELECT id, gem_id FROM equipment_gems WHERE inventory_id = ? AND socket_index = ?');
    const socket = socketQuery.get(item.id, socketIndex) as { id: string; gem_id: string } | undefined;
    if (!socket) return { success: false, reason: 'Nenhuma gema engastada neste soquete!' };

    // Remove do soquete e devolve para o inventário
    this.db.prepare('DELETE FROM equipment_gems WHERE id = ?').run(socket.id);
    this.addItemToInventory(characterId, socket.gem_id, 1);

    return { success: true, gemId: socket.gem_id };
  }

  // --- SUBMENU 4: ÁLBUM DE CARTAS DE MONSTROS ---
  public getCharacterCards(characterId: string): CardAlbumEntryPayload[] {
    const query = this.db.prepare('SELECT card_id, is_equipped, equipped_slot, count FROM character_cards WHERE character_id = ?');
    const rows = query.all(characterId) as Array<{
      card_id: string;
      is_equipped: number;
      equipped_slot: number;
      count: number;
    }>;

    return rows.map((r) => {
      const def = CARDS_DATABASE[r.card_id];
      return {
        cardId: r.card_id,
        name: def?.name || r.card_id,
        rarity: def?.rarity || 'COMUM',
        icon: def?.icon || '🃏',
        image: def?.image,
        count: r.count,
        isEquipped: r.is_equipped === 1,
        equippedSlot: r.equipped_slot,
        statsBonus: def?.statsBonus || {},
        activeEffectText: def?.activeEffectText || '',
      };
    });
  }

  public addCharacterCard(characterId: string, cardId: string): number {
    const query = this.db.prepare('SELECT id, count FROM character_cards WHERE character_id = ? AND card_id = ?');
    const row = query.get(characterId, cardId) as { id: string; count: number } | undefined;

    if (row) {
      const newCount = row.count + 1;
      this.db.prepare('UPDATE character_cards SET count = ? WHERE id = ?').run(newCount, row.id);
      return newCount;
    } else {
      const cardRowId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.db.prepare(`
        INSERT INTO character_cards (id, character_id, card_id, is_equipped, equipped_slot, count, created_at)
        VALUES (?, ?, ?, 0, -1, 1, ?)
      `).run(cardRowId, characterId, cardId, Date.now());
      return 1;
    }
  }

  public setEquippedCard(
    characterId: string,
    cardId: string,
    targetSlot: 'ARMA' | 'ARMADURA',
    isEquip: boolean
  ): { success: boolean; reason?: string } {
    const targetSlotIndex = targetSlot === 'ARMA' ? 0 : 1;

    const query = this.db.prepare('SELECT id, is_equipped, equipped_slot FROM character_cards WHERE character_id = ? AND card_id = ?');
    const card = query.get(characterId, cardId) as { id: string; is_equipped: number; equipped_slot: number } | undefined;
    if (!card) return { success: false, reason: 'Carta não encontrada no Álbum!' };

    if (!isEquip) {
      this.db.prepare('UPDATE character_cards SET is_equipped = 0, equipped_slot = -1 WHERE id = ?').run(card.id);
      return { success: true };
    }

    // Ao equipar: desequipa qualquer outra carta que esteja ocupando este slot (ARMA ou ARMADURA)
    this.db.prepare('UPDATE character_cards SET is_equipped = 0, equipped_slot = -1 WHERE character_id = ? AND equipped_slot = ?').run(characterId, targetSlotIndex);

    // Equipa a nova carta
    this.db.prepare('UPDATE character_cards SET is_equipped = 1, equipped_slot = ? WHERE id = ?').run(targetSlotIndex, card.id);
    return { success: true };
  }

  // --- CONTROLE DE MATERIAIS PARA FORJA ---
  public hasItemQuantity(characterId: string, itemId: string, requiredQuantity: number): boolean {
    const query = this.db.prepare('SELECT SUM(quantity) as total FROM inventory WHERE character_id = ? AND item_id = ?');
    const row = query.get(characterId, itemId) as { total: number | null } | undefined;
    return (row?.total || 0) >= requiredQuantity;
  }

  public consumeItemQuantity(characterId: string, itemId: string, quantityToConsume: number): boolean {
    if (!this.hasItemQuantity(characterId, itemId, quantityToConsume)) return false;

    const query = this.db.prepare('SELECT id, quantity FROM inventory WHERE character_id = ? AND item_id = ? ORDER BY quantity ASC');
    const rows = query.all(characterId, itemId) as Array<{ id: string; quantity: number }>;

    let remaining = quantityToConsume;
    for (const r of rows) {
      if (remaining <= 0) break;
      if (r.quantity <= remaining) {
        remaining -= r.quantity;
        this.db.prepare('DELETE FROM inventory WHERE id = ?').run(r.id);
      } else {
        this.db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?').run(r.quantity - remaining, r.id);
        remaining = 0;
      }
    }

    return true;
  }

  // --- RANKINGS & LEADERBOARDS GLOBAIS ---
  public getLeaderboard(
    category: LeaderboardCategory = 'COMBAT_POWER',
    limit: number = 20
  ): LeaderboardEntryPayload[] {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    let orderByClause = 'combat_power DESC, level DESC';

    switch (category) {
      case 'LEVEL':
        orderByClause = 'reborn_count DESC, level DESC, experience DESC';
        break;
      case 'STAGE':
        orderByClause = 'current_world DESC, current_stage DESC, combat_power DESC';
        break;
      case 'GOLD':
        orderByClause = 'gold DESC, combat_power DESC';
        break;
      case 'COMBAT_POWER':
      default:
        orderByClause = 'combat_power DESC, level DESC';
        break;
    }

    const query = this.db.prepare(`
      SELECT
        id,
        name,
        class_type,
        level,
        reborn_count,
        combat_power,
        current_world,
        current_stage,
        gold
      FROM characters
      ORDER BY ${orderByClause}
      LIMIT ?
    `);

    const rows = query.all(safeLimit) as Array<{
      id: string;
      name: string;
      class_type: string;
      level: number;
      reborn_count: number;
      combat_power: number;
      current_world: number;
      current_stage: number;
      gold: number;
    }>;

    return rows.map((row, idx) => ({
      rank: idx + 1,
      characterId: row.id,
      name: row.name,
      classType: row.class_type as CharacterClass,
      level: row.level,
      rebornCount: row.reborn_count || 0,
      combatPower: row.combat_power,
      currentWorld: row.current_world || 1,
      currentStage: row.current_stage || 1,
      gold: row.gold,
      honorTitle: this.getHonorTitleForReborn(row.reborn_count || 0),
    }));
  }

  public getCharacterLeaderboardRank(
    characterId: string,
    category: LeaderboardCategory = 'COMBAT_POWER'
  ): { rank: number; entry: LeaderboardEntryPayload } | null {
    const list = this.getLeaderboard(category, 100);
    const foundIndex = list.findIndex((e) => e.characterId === characterId);
    if (foundIndex !== -1) {
      return { rank: foundIndex + 1, entry: list[foundIndex] };
    }

    const charRow = this.getCharacterById(characterId);
    if (!charRow) return null;

    let whereCondition = 'combat_power > ?';
    let compareVal: any = charRow.combat_power;

    if (category === 'LEVEL') {
      whereCondition = '(reborn_count > ? OR (reborn_count = ? AND level > ?))';
    } else if (category === 'STAGE') {
      whereCondition = '(current_world > ? OR (current_world = ? AND current_stage > ?))';
    } else if (category === 'GOLD') {
      whereCondition = 'gold > ?';
      compareVal = charRow.gold;
    }

    const countQuery = this.db.prepare(`SELECT COUNT(*) as rankCount FROM characters WHERE ${whereCondition}`);
    let rankCount = 0;
    if (category === 'LEVEL') {
      const res = countQuery.get(charRow.reborn_count || 0, charRow.reborn_count || 0, charRow.level) as { rankCount: number } | undefined;
      rankCount = res?.rankCount || 0;
    } else if (category === 'STAGE') {
      const res = countQuery.get(charRow.current_world || 1, charRow.current_world || 1, charRow.current_stage || 1) as { rankCount: number } | undefined;
      rankCount = res?.rankCount || 0;
    } else {
      const res = countQuery.get(compareVal) as { rankCount: number } | undefined;
      rankCount = res?.rankCount || 0;
    }

    const entry: LeaderboardEntryPayload = {
      rank: rankCount + 1,
      characterId: charRow.id,
      name: charRow.name,
      classType: charRow.class_type as CharacterClass,
      level: charRow.level,
      rebornCount: charRow.reborn_count || 0,
      combatPower: charRow.combat_power,
      currentWorld: charRow.current_world || 1,
      currentStage: charRow.current_stage || 1,
      gold: charRow.gold,
      honorTitle: this.getHonorTitleForReborn(charRow.reborn_count || 0),
    };

    return { rank: rankCount + 1, entry };
  }

  private getHonorTitleForReborn(rebornCount: number): string {
    switch (rebornCount) {
      case 1: return 'Desperto Cósmico';
      case 2: return 'Iluminado Astral';
      case 3: return 'Mestre da Bigorna';
      case 4: return 'Semideus Primordial';
      default: return rebornCount > 4 ? `Divindade Astral +${rebornCount}` : 'Aventureiro';
    }
  }
}
