import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { DatabaseManager } from '../src/database/DatabaseManager';

const target = resolve(process.argv[2] ?? '');
const scratch = resolve(__dirname, '../../scratch');
const inside = relative(scratch, target);
if (!inside || inside.startsWith('..') || isAbsolute(inside) || !existsSync(target)) {
  throw new Error('Forneça uma cópia existente do banco dentro de scratch/. O banco ativo nunca é aceito.');
}
function snapshot() {
  const db = new DatabaseSync(target, { readOnly: true });
  try {
    const items = db.prepare('SELECT id, character_id, item_id, quantity, refine_level FROM inventory ORDER BY id').all();
    const gems = db.prepare('SELECT inventory_id, socket_index, gem_id FROM equipment_gems ORDER BY inventory_id, socket_index').all();
    const gold = db.prepare('SELECT id, gold FROM characters ORDER BY id').all();
    return { items: items.length, gems: gems.length,
      signature: createHash('sha256').update(JSON.stringify({ items, gems, gold })).digest('hex'),
      equippedInBag: (db.prepare('SELECT COUNT(*) AS n FROM inventory WHERE is_equipped = 1 AND slot_index >= 0').get() as {n:number}).n };
  } finally { db.close(); }
}
const before = snapshot();
new DatabaseManager(target).close();
const after = snapshot();
if (before.signature !== after.signature || after.equippedInBag !== 0) throw new Error('Falha na validação: interrompa a migração.');
console.log(JSON.stringify({ itemsPreserved: after.items, gemsPreserved: after.gems, itemAndGoldIntegrity: true,
  equipmentMovedOutOfBag: before.equippedInBag, equippedInBagAfter: after.equippedInBag }));
