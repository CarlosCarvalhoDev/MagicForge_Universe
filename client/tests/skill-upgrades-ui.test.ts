import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS_DATABASE } from '@magicforge/shared';
import { setupSkillUpgrades } from '../src/ui/SkillUpgrades';

class Element {
  children: Element[] = [];
  textContent = '';
  disabled = false;
  listeners: Record<string, () => void> = {};
  append(...items: Element[]) { this.children.push(...items); }
  addEventListener(name: string, fn: () => void) { this.listeners[name] = fn; }
  click() { this.listeners.click?.(); }
}

function setup(t: TestContext) {
  const previous = globalThis.document;
  const status = new Element();
  globalThis.document = { getElementById: () => status, createElement: () => new Element() } as unknown as Document;
  let ready = true;
  const sent: Array<[string, number]> = [];
  const ui = setupSkillUpgrades({ isReady: () => ready, send: (id, level) => sent.push([id, level]), changed() {} });
  t.after(() => { ui.reset(); globalThis.document = previous; });
  const controls = (options = {}) => ui.createControls(SKILLS_DATABASE.guerreiro_truque_1,
    { equipped: true, heroLevel: 50, gold: 10000, dust: 100, ...options }) as unknown as Element;
  return { ui, status, sent, controls, disconnect: () => { ready = false; ui.reset(); } };
}

test('Upgrade só altera nível após confirmação e impede clique duplicado', t => {
  const f = setup(t);
  assert.equal(f.controls().children[2].disabled, true);
  f.ui.onSkillsUpdate({});
  const root = f.controls();
  assert.match(root.children[0].textContent, /Nv. 1\/20/);
  assert.match(root.children[1].textContent, /100 ouro \+ 1 Pó Arcano/);
  root.children[2].click();
  root.children[2].click();
  assert.deepEqual(f.sent, [['guerreiro_truque_1', 1]]);
  assert.equal(f.ui.getLevel('guerreiro_truque_1'), 1);
  assert.equal(f.controls().children[2].disabled, true);
  f.ui.onResult({ skillId: 'guerreiro_truque_1', success: true, skillLevels: { guerreiro_truque_1: 2 }, message: 'Melhorada' });
  assert.equal(f.ui.getLevel('guerreiro_truque_1'), 2);
  assert.equal(f.controls().children[2].disabled, false);
  assert.match(f.controls().children[0].textContent, /\+5%.*\+10%/);
});

test('Recursos, seleção, desbloqueio, teto e suporte sem efeito bloqueiam compra', t => {
  const f = setup(t);
  f.ui.onSkillsUpdate({});
  for (const options of [{ gold: 99 }, { dust: 0 }, { equipped: false }, { heroLevel: 0 }]) {
    assert.equal(f.controls(options).children[2].disabled, true);
  }
  const support = f.ui.createControls(SKILLS_DATABASE.mago_nv1_2, { equipped: true, heroLevel: 50, gold: 10000, dust: 100 }) as unknown as Element;
  assert.equal(support.children[2].disabled, true);
  f.ui.onSkillsUpdate({ guerreiro_truque_1: 20 });
  assert.match(f.controls().children[0].textContent, /\+95%/);
  assert.equal(f.controls().children[2].textContent, 'Nível máximo');
});

test('Erro mantém nível confirmado e reconexão limpa o estado do herói anterior', t => {
  const f = setup(t);
  f.ui.onSkillsUpdate({ guerreiro_truque_1: 4 });
  f.controls().children[2].click();
  f.ui.onResult({ skillId: 'guerreiro_truque_1', success: false, skillLevels: { guerreiro_truque_1: 4 }, message: 'Ouro insuficiente' });
  assert.equal(f.ui.getLevel('guerreiro_truque_1'), 4);
  assert.equal(f.status.textContent, 'Ouro insuficiente');
  assert.equal(f.controls().children[2].disabled, false);
  f.disconnect();
  assert.equal(f.ui.getLevel('guerreiro_truque_1'), 1);
  assert.equal(f.controls().children[2].disabled, true);
  f.ui.onResult({ skillId: 'guerreiro_truque_1', success: true, skillLevels: { guerreiro_truque_1: 5 }, message: 'ACK atrasado' });
  assert.equal(f.ui.getLevel('guerreiro_truque_1'), 1);
});
