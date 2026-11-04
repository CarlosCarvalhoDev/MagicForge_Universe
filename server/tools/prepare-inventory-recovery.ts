import { DatabaseSync } from 'node:sqlite';
import { existsSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { DatabaseManager } from '../src/database/DatabaseManager';

// Explicitly a scratch-only recovery candidate. This tool never replaces the active database.
const source = resolve(process.argv[2] ?? ''), destination = resolve(process.argv[3] ?? '');
const scratch = resolve(__dirname, '../../scratch');
for (const file of [source, destination]) {
  const path = relative(scratch, file);
  if (!path || path.startsWith('..') || isAbsolute(path)) throw new Error('Recovery accepts scratch paths only.');
}
if (!existsSync(source) || existsSync(destination)) throw new Error('Use an existing source copy and a NEW destination.');
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const input = new DatabaseSync(source, { readOnly: true });
const output = new DatabaseSync(destination);
try {
  const tables = input.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as Array<{name:string;sql:string}>;
  const inventory = input.prepare('SELECT * FROM inventory NOT INDEXED').all() as Array<Record<string, any>>;
  const indexed = new Set((input.prepare('SELECT id FROM inventory INDEXED BY sqlite_autoindex_inventory_1').all() as Array<{id:string}>).map(row => row.id));
  const misplaced = input.prepare(`SELECT character_id AS id, last_reset_date AS character_id, tickets_remaining AS item_id,
    extra_tickets_bought AS quantity, highest_boss_rush_wave AS slot_index, fastest_boss_rush_time_sec AS is_equipped,
    total_dungeons_cleared AS refine_level FROM daily_dungeon_records NOT INDEXED`).all() as Array<Record<string, any>>;
  const characterIds = new Set((input.prepare('SELECT id FROM characters NOT INDEXED').all() as Array<{id:string}>).map(row => row.id));
  const merged = new Map(inventory.map(row => [row.id, row]));
  let recovered = 0, conflictingLegacyCopies = 0;
  for (const row of misplaced) {
    if (merged.has(row.id)) {
      const current = merged.get(row.id)!;
      if (Object.keys(row).some(key => current[key] !== row[key])) conflictingLegacyCopies++;
    } else if (indexed.has(row.id) && characterIds.has(row.character_id) && typeof row.item_id === 'string' && Number.isInteger(row.quantity) && row.quantity > 0) {
      merged.set(row.id, row); recovered++;
    }
  }
  const unresolvedIndexReferences = [...indexed].filter(id => !merged.has(id)).length;
  const orphanInventory = [...merged.values()].filter(row => !characterIds.has(row.character_id));
  const usableInventory = [...merged.values()].filter(row => characterIds.has(row.character_id));
  const counts: Record<string, number> = {};
  output.exec('PRAGMA foreign_keys = OFF');
  output.exec('BEGIN IMMEDIATE');
  try {
    for (const table of tables) output.exec(table.sql);
    for (const table of tables) {
      // This damaged table contains inventory-shaped records, not usable daily-dungeon records.
      const rows = table.name === 'daily_dungeon_records' ? [] : table.name === 'inventory' ? usableInventory :
        input.prepare(`SELECT * FROM ${quote(table.name)} NOT INDEXED`).all();
      const columns = (output.prepare(`PRAGMA table_info(${quote(table.name)})`).all() as Array<{name:string}>).map(row => row.name);
      const insert = output.prepare(`INSERT INTO ${quote(table.name)} (${columns.map(quote).join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
      for (const row of rows) insert.run(...columns.map(column => (row as Record<string, any>)[column]));
      counts[table.name] = rows.length;
    }
    output.exec('CREATE TABLE recovery_quarantine (id INTEGER PRIMARY KEY, source_table TEXT NOT NULL, reason TEXT NOT NULL, row_json TEXT NOT NULL)');
    const quarantine = output.prepare('INSERT INTO recovery_quarantine (source_table, reason, row_json) VALUES (?, ?, ?)');
    for (const row of orphanInventory) quarantine.run('inventory', 'Character missing in source; preserved without inventing an owner', JSON.stringify(row));
    for (const row of input.prepare('SELECT * FROM daily_dungeon_records NOT INDEXED').all()) {
      quarantine.run('daily_dungeon_records', 'Inventory-shaped data in daily table; original row preserved for review', JSON.stringify(row));
    }
    output.exec('COMMIT');
  } catch (error) { output.exec('ROLLBACK'); throw error; }
  const integrity = output.prepare('PRAGMA integrity_check').all();
  const foreignKeys = output.prepare('PRAGMA foreign_key_check').all();
  if (integrity.length !== 1 || Object.values(integrity[0])[0] !== 'ok' || foreignKeys.length) {
    throw new Error('Recovery candidate failed integrity/foreign key checks.');
  }
  output.close();
  new DatabaseManager(destination).close();
  const verified = new DatabaseSync(destination, { readOnly: true });
  try {
    if (Object.values(verified.prepare('PRAGMA integrity_check').get()!)[0] !== 'ok' || verified.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Post-migration check failed');
  } finally { verified.close(); }
  const report = { source, destination, candidateOnly: true, counts, readableInventoryRows: inventory.length,
    recoveredFromMisplacedRecords: recovered, conflictingLegacyCopies, unresolvedIndexReferences,
    orphanInventoryPreservedInQuarantine: orphanInventory.length,
    dailyDungeonRecordsResetInCandidate: true, integrity: 'ok', foreignKeys: 'ok', requiresUserApproval: true };
  writeFileSync(destination + '.report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally {
  input.close();
  try { output.close(); } catch { /* Already closed before the migration verification. */ }
}
