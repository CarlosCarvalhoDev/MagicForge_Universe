import test from 'node:test';
import assert from 'node:assert/strict';
import { setupEquipmentAdvice } from '../src/ui/EquipmentAdvice';

test('Sugestão só inspeciona; mudança de equipamento invalida resposta, ouro/materiais não', t => {
  class Element {
    textContent = ''; disabled = false; children: Element[] = [];
    listeners: Record<string, () => void> = {};
    addEventListener(name: string, callback: () => void) { this.listeners[name] = callback; }
    click() { if (!this.disabled) this.listeners.click?.(); }
    append(...items: Element[]) { this.children.push(...items); }
    appendChild(item: Element) { this.children.push(item); }
    prepend(...items: Element[]) { this.children.unshift(...items); }
    setAttribute(_name: string, _value: string) {}
    replaceChildren() { this.children = []; }
  }
  const nodes = new Map<string, Element>();
  const get = (id: string) => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id)!; };
  const oldDocument = globalThis.document, oldWindow = globalThis.window;
  globalThis.document = { getElementById: get, createElement: () => new Element() } as unknown as Document;
  globalThis.window = { setTimeout, clearTimeout } as unknown as Window & typeof globalThis;
  let requests = 0; const inspected: number[] = [];
  const ui = setupEquipmentAdvice({ isReady: () => true, request: () => requests++, inspect: slot => inspected.push(slot) });
  t.after(() => { ui.reset(); globalThis.document = oldDocument; globalThis.window = oldWindow; });
  const candidate = { itemId:'sword_runic_bastard', slotIndex:5, instanceId:'candidate', isEquipped:false, quantity:1 };
  const payload = { characterId:'hero', suggestions:[{ candidate, delta:{ forca:18 } }] };
  ui.sync([candidate]);
  get('btn-equipment-advice').click(); get('btn-equipment-advice').click(); assert.equal(requests, 1);
  ui.sync([candidate, { itemId:'arcane_dust', slotIndex:7, quantity:500, isEquipped:false }]);
  ui.onResult(payload);
  const rows = get('equipment-advice-list').children;
  assert.equal(rows.length, 1); assert.deepEqual(inspected, []);
  rows[0].children[3].click(); assert.deepEqual(inspected, [5]);
  get('btn-equipment-advice').click();
  ui.sync([{ ...candidate, isLocked:true }]);
  ui.onResult(payload);
  assert.equal(get('equipment-advice-list').children.length, 0);
  assert.match(get('equipment-advice-status').textContent, /atualizados/);
});
