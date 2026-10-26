import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import {
  CharacterClass,
  CLASS_DEFINITIONS,
  createVector3,
  Vector3,
  InventoryItemPayload,
  ITEMS_DATABASE,
} from '@magicforge/shared';
import { Player } from '../entities/Player';

export interface AccountRecord {
  id: string;
  username: string;
  created_at: number;
  last_login: number;
}

export interface CharacterRecord {
  id: string;
  account_id: string;
  name: string;
  class_type: string;
  level: number;
  experience: number;
  gold: number;
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

    console.log('[Database] Tabelas do banco de dados verificadas e prontas!');
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
   * Carrega um personagem do SQLite ou cria um novo com base na classe escolhida
   */
  public loadOrCreatePlayer(
    connectionId: string,
    accountId: string,
    characterName: string,
    classType: CharacterClass
  ): Player {
    const existing = this.getCharacterByName(characterName);

    if (existing) {
      console.log(`[Database] Carregando personagem existente: "${existing.name}" (Lvl ${existing.level})`);
      const savedPos = createVector3(existing.pos_x, existing.pos_y, existing.pos_z);
      const player = new Player(connectionId, existing.name, existing.class_type as CharacterClass, savedPos);

      player.dbCharacterId = existing.id;
      player.gold = existing.gold || 0;
      player.level = existing.level;
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
      player.recalculateStatsFromEquipment();
      return player;
    }

    // Cria novo personagem no banco
    console.log(`[Database] Criando novo personagem no banco: "${characterName}" (${classType})`);
    const classDef = CLASS_DEFINITIONS[classType] || CLASS_DEFINITIONS[CharacterClass.GUERREIRO];
    const initialPos = createVector3(0, 0, 0);
    const player = new Player(connectionId, characterName, classType, initialPos);

    const now = Date.now();
    const charId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    player.dbCharacterId = charId;
    player.gold = 50; // Ouro inicial de aventureiro

    this.db.prepare(`
      INSERT INTO characters (
        id, account_id, name, class_type, level, experience, gold,
        current_hp, max_hp, pos_x, pos_y, pos_z,
        forca, destreza, constituicao, inteligencia, sabedoria, carisma,
        combat_power, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      charId,
      accountId,
      characterName,
      classType,
      player.level,
      0, // exp
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
      this.addItemToInventory(charId, 'bow_hunting', 1);
    } else {
      this.addItemToInventory(charId, 'sword_iron_broadsword', 1);
    }

    // Auto-equipa a arma inicial no slot 2
    this.toggleEquipItem(charId, 2);

    player.inventory = this.getInventory(charId);
    player.recalculateStatsFromEquipment();
    return player;
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
          gold = ?,
          current_hp = ?,
          max_hp = ?,
          pos_x = ?,
          pos_y = ?,
          pos_z = ?,
          forca = ?,
          destreza = ?,
          constituicao = ?,
          inteligencia = ?,
          sabedoria = ?,
          carisma = ?,
          combat_power = ?,
          updated_at = ?
        WHERE name = ?
      `).run(
        player.level,
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
        player.name
      );
    } catch (err) {
      console.error(`[Database] Erro ao salvar personagem "${player.name}":`, err);
    }
  }

  public getInventory(characterId: string): InventoryItemPayload[] {
    const query = this.db.prepare(
      'SELECT slot_index, item_id, quantity, is_equipped FROM inventory WHERE character_id = ? ORDER BY slot_index ASC'
    );
    const rows = query.all(characterId) as Array<{
      slot_index: number;
      item_id: string;
      quantity: number;
      is_equipped: number;
    }>;

    return rows.map((r) => ({
      slotIndex: r.slot_index,
      itemId: r.item_id,
      quantity: r.quantity,
      isEquipped: r.is_equipped === 1,
    }));
  }

  public addItemToInventory(characterId: string, itemId: string, quantity: number = 1): boolean {
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

    // Acha primeiro slot livre entre 0 e 19 (capacidade de 20 slots)
    const usedSlotsQuery = this.db.prepare('SELECT slot_index FROM inventory WHERE character_id = ?');
    const usedRows = usedSlotsQuery.all(characterId) as Array<{ slot_index: number }>;
    const usedSlots = new Set(usedRows.map((r) => r.slot_index));

    let freeSlot = -1;
    for (let i = 0; i < 20; i++) {
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

  public toggleEquipItem(characterId: string, slotIndex: number): boolean {
    const query = this.db.prepare('SELECT id, item_id, is_equipped FROM inventory WHERE character_id = ? AND slot_index = ?');
    const item = query.get(characterId, slotIndex) as { id: string; item_id: string; is_equipped: number } | undefined;
    if (!item) return false;

    const itemDef = ITEMS_DATABASE[item.item_id];
    if (!itemDef || itemDef.type !== 'EQUIPAMENTO') return false;

    const newEquippedState = item.is_equipped === 1 ? 0 : 1;
    this.db.prepare('UPDATE inventory SET is_equipped = ? WHERE id = ?').run(newEquippedState, item.id);
    return true;
  }

  public updateCharacterGold(characterId: string, goldDelta: number): number {
    this.db.prepare('UPDATE characters SET gold = MAX(0, gold + ?) WHERE id = ?').run(goldDelta, characterId);
    const query = this.db.prepare('SELECT gold FROM characters WHERE id = ?');
    const row = query.get(characterId) as { gold: number } | undefined;
    return row ? row.gold : 0;
  }

  public close(): void {
    this.db.close();
  }
}
