import test from 'node:test';
import assert from 'node:assert/strict';
import { setupInventoryExpansion } from '../src/ui/InventoryExpansion';

test('Confirmação funciona com 31 slots, sobrevive ao farm e bloqueia requisitos/duplo envio', t => {
  class Element {
    textContent = ''; hidden = false; disabled = false; dataset: Record<string, string> = {};
    listeners: Record<string, () => void> = {};
    addEventListener(name: string, callback: () => void) { this.listeners[name] = callback; }
    click() { if (!this.disabled) this.listeners.click?.(); }
    setAttribute() {} focus() {} scrollIntoView() {}
  }
  const nodes = new Map<string, Element>();
  const get = (id: string) => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id)!; };
  const oldDocument = globalThis.document, oldWindow = globalThis.window;
  globalThis.document = { getElementById: get } as unknown as Document;
  globalThis.window = { setTimeout, clearTimeout } as unknown as Window & typeof globalThis;
  const sent: number[] = [];
  const ui = setupInventoryExpansion({ isReady: () => true, send: slots => sent.push(slots), apply() {} });
  t.after(() => { ui.onDisconnected(); globalThis.document = oldDocument; globalThis.window = oldWindow; });
  ui.setContext({ maxSlots: 31, gold: 1_000_000, level: 30, reborn: 0 });
  get('btn-expand-inventory').click();
  assert.match(get('inventory-expansion-summary').textContent, /31 → 36/);
  assert.match(get('inventory-expansion-requirements').textContent, /35/);
  assert.equal(get('btn-confirm-expansion').disabled, true);
  ui.setContext({ maxSlots: 31, gold: 1_000_001, level: 35, reborn: 0 });
  assert.equal(get('inventory-expansion-confirm').hidden, false);
  assert.equal(get('btn-confirm-expansion').disabled, false);
  get('btn-confirm-expansion').click(); get('btn-confirm-expansion').click();
  assert.deepEqual(sent, [31]);
  ui.onResult({ success: true, newMaxSlots: 36, goldSpent: 250_000, remainingGold: 750_001, message: 'Expandida' });
  assert.equal(get('inventory-expansion-confirm').hidden, true);
  assert.equal(get('inventory-expansion-status').textContent, 'Expandida');
  ui.setContext({ maxSlots: 36, gold: 100, level: 50, reborn: 0 });
  get('btn-expand-inventory').click();
  assert.equal(get('btn-confirm-expansion').disabled, true);
  assert.match(get('inventory-expansion-requirements').textContent, /Faltam/);
});
