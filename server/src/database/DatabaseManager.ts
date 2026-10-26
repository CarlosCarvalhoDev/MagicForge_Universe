import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { CharacterClass, CLASS_DEFINITIONS, createVector3, Vector3 } from '@magicforge/shared';
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

    // 3. Tabela de Inventário (preparada para itens futuros)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        slot_index INTEGER NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE
      );
    `);

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

      // Restaura atributos e nível salvos
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

      return player;
    }

    // Cria novo personagem no banco
    console.log(`[Database] Criando novo personagem no banco: "${characterName}" (${classType})`);
    const classDef = CLASS_DEFINITIONS[classType] || CLASS_DEFINITIONS[CharacterClass.GUERREIRO];
    const initialPos = createVector3(0, 0, 0);
    const player = new Player(connectionId, characterName, classType, initialPos);

    const now = Date.now();
    const charId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
      0, // gold
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

    return player;
  }

  /**
   * Salva o estado atualizado do jogador (posição, vida, nível, atributos)
   */
  public savePlayer(player: Player): void {
    const now = Date.now();
    try {
      this.db.prepare(`
        UPDATE characters SET
          level = ?,
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

  public close(): void {
    this.db.close();
  }
}
