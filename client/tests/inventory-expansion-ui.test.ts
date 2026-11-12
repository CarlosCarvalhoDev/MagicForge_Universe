import test from 'node:test';
import assert from 'node:assert/strict';
import { setupInventoryExpansion } from '../src/ui/InventoryExpansion';

function fixture(t: { after(fn: () => void): void }) {
  class Element {
    textContent = ''; hidden = false; disabled = false; dataset: Record<string, string> = {};
    attributes: Record<string, string> = {}; listeners: Record<string, () => void> = {};
    addEventListener(name: string, callback: () => void) { this.listeners[name] = callback; }
    click() { if (!this.disabled) this.listeners.click?.(); }
    setAttribute(name: string, value: string) { this.attributes[name] = value; }
    focus() {} scrollIntoView() {}
  }
  const nodes = new Map<string, Element>();
  const get = (id: string) => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id)!; };
  const oldDocument = globalThis.document, oldWindow = globalThis.window;
  globalThis.document = { getElementById: get } as unknown as Document;
  globalThis.window = { setTimeout, clearTimeout } as unknown as Window & typeof globalThis;
  const sent: unknown[][] = [];
  const ui = setupInventoryExpansion({ isReady: () => true, send: (...args) => sent.push(args), apply() {} });
  t.after(() => { ui.onDisconnected(); globalThis.document = oldDocument; globalThis.window = oldWindow; });
  return { get, sent, ui };
}

test('Nível 1 expande capacidade legada só com ouro, preserva confirmação e impede duplo envio', t => {
  const {get,sent,ui}=fixture(t);
  ui.setContext({ maxSlots:31,gold:249999,level:1,reborn:0 });
  get('btn-expand-inventory').click();
  assert.match(get('inventory-expansion-summary').textContent,/31 → 35/);
  assert.match(get('inventory-expansion-requirements').textContent,/Faltam/);
  assert.equal(get('inventory-expansion-payments').hidden,true);
  assert.equal(get('btn-confirm-expansion').disabled,true);
  ui.setContext({maxSlots:31,gold:250001,level:1,reborn:0});
  assert.equal(get('inventory-expansion-confirm').hidden,false);
  get('btn-confirm-expansion').click();get('btn-confirm-expansion').click();
  assert.deepEqual(sent,[[31,'gold',250000]]);
  ui.onResult({success:true,newMaxSlots:35,goldSpent:250000,remainingGold:1,message:'Expandida',cashBalance:0,sealsAvailable:0});
  assert.equal(get('inventory-expansion-confirm').hidden,true);
  assert.equal(get('inventory-expansion-payments').hidden,false);
  assert.match(get('expand-cost-label').textContent,/Cash ou Ouro/);
});

test('Acima de 35 escolhe cash com saldo autoritativo e envia o preço confirmado', t => {
  const {get,sent,ui}=fixture(t);
  ui.setContext({maxSlots:35,gold:0,level:1,reborn:0,cash:100,seals:0});
  get('btn-expand-inventory').click();
  assert.equal(get('btn-confirm-expansion').disabled,true);
  get('btn-expansion-cash').click();
  assert.equal(get('btn-confirm-expansion').disabled,false);
  assert.match(get('btn-confirm-expansion').textContent,/100 Cash/);
  get('btn-confirm-expansion').click();get('btn-confirm-expansion').click();
  assert.deepEqual(sent,[[35,'cash',100]]);
  assert.equal(get('btn-expansion-gold-item').disabled,true);
  ui.onResult({success:true,newMaxSlots:40,goldSpent:0,remainingGold:0,cashBalance:0,cashSpent:100,message:'Expandida'});
  ui.setContext({maxSlots:40,gold:0,level:1,reborn:0,cash:0,seals:0});
  get('btn-expand-inventory').click();get('btn-expansion-cash').click();
  assert.equal(get('btn-confirm-expansion').disabled,true);
  assert.match(get('inventory-expansion-requirements').textContent,/200 Cash/);
});

test('Ouro com selo exige ambos sem nível/Reborn, respeita selo protegido e reconexão', t => {
  const {get,sent,ui}=fixture(t);
  ui.setContext({maxSlots:45,gold:10000000,level:1,reborn:0,cash:0,seals:0});
  get('btn-expand-inventory').click();
  assert.match(get('inventory-expansion-requirements').textContent,/Selo/);
  assert.equal(get('btn-confirm-expansion').disabled,true);
  ui.setContext({maxSlots:45,gold:10000000,level:1,reborn:0,cash:0,seals:1});
  get('btn-confirm-expansion').click();
  assert.deepEqual(sent,[[45,'gold_item',10000000]]);
  ui.onDisconnected();
  assert.equal(get('inventory-expansion-confirm').hidden,true);
  ui.setContext({maxSlots:45,gold:10000000,level:1,reborn:0,cash:400,seals:0});
  get('btn-expand-inventory').click();get('btn-expansion-cash').click();
  assert.equal(get('btn-confirm-expansion').disabled,false);
  ui.onResult({success:true,newMaxSlots:50,goldSpent:0,remainingGold:10000000,cashBalance:0,message:'Máxima'});
  assert.equal(get('btn-expand-inventory').disabled,true);
});
