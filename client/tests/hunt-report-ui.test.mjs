import test from 'node:test';
import assert from 'node:assert/strict';
import { formatHuntDuration, formatHuntReport, setupHuntReport } from '../src/ui/HuntReport.ts';

const sample = {
  characterId: 'hero_1', characterName: 'Heroína', classType: 'GUERREIRO', level: 10,
  world: 1, stage: 5, channel: 2, elapsedSeconds: 120, kills: 3, combatExp: 600,
  lootGold: 120, autoSaleGold: 10000, manualSaleGold: 5000,
  hpPotionsUsed: 2, resourcePotionsUsed: 1, deaths: 0, expPerHour: 18000, goldPerHour: 3600,
};

test('Formatação separa vendas das taxas e trata período inicial sem amostra', () => {
  assert.equal(formatHuntDuration(3661.9), '1h 1min 1s');
  assert.equal(formatHuntDuration(-1), '0h 0min 0s');
  const fields = formatHuntReport(sample);
  assert.equal(fields.expRate, '18.000/h');
  assert.equal(fields.goldRate, '3.600/h');
  assert.equal(fields.autoSales, '10.000');
  assert.equal(fields.manualSales, '5.000');
  assert.equal(fields.gold, '120');
  assert.equal(formatHuntReport({ ...sample, expPerHour: null }).expRate, 'Aguardando 1 min');
});

function panel(t) {
  const nodes = Object.fromEntries(Object.keys(formatHuntReport(sample)).map(key => [key, {
    dataset: { hunt: key }, textContent: '',
  }]));
  const button = { disabled: true, addEventListener(type, handler) { this[type] = handler; } };
  const status = { textContent: '' };
  const root = {
    className: '', innerHTML: '', setAttribute() {},
    querySelector(selector) {
      if (selector === '[data-hunt-reset]') return button;
      if (selector === '[data-hunt-status]') return status;
      if (selector === '[data-hunt="context"]') return nodes.context;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    querySelectorAll() { return Object.values(nodes); },
  };
  const previousDocument = globalThis.document;
  globalThis.document = {
    querySelector() { return { appendChild() {} }; },
    createElement() { return root; },
  };
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  let ready = true, requests = 0, resets = 0;
  const ui = setupHuntReport({ isReady: () => ready, request: () => requests++, reset: () => resets++ });
  return { nodes, button, status, ui, setReady(value) { ready = value; }, requests: () => requests, resets: () => resets };
}

test('Zerar aguarda confirmação e impede cliques repetidos; desconexão limpa dados do herói', (t) => {
  const p = panel(t);
  p.ui.onCharacterLogin();
  assert.equal(p.requests(), 1);
  p.ui.onReport(sample);
  assert.equal(p.nodes.kills.textContent, '3');
  p.button.click();
  p.button.click();
  assert.equal(p.resets(), 1);
  assert.equal(p.button.disabled, true);
  assert.equal(p.nodes.kills.textContent, '3', 'Não deve zerar antes da confirmação do servidor');
  p.ui.onReport({ ...sample, kills: 0, combatExp: 0, elapsedSeconds: 0, expPerHour: null, goldPerHour: null });
  assert.equal(p.button.disabled, false);
  assert.equal(p.nodes.kills.textContent, '0');
  p.setReady(false);
  p.ui.onDisconnected();
  p.ui.onReport(sample);
  assert.equal(p.button.disabled, true);
  assert.equal(p.nodes.kills.textContent, '—');
  p.ui.onOpen();
  assert.equal(p.requests(), 1);
});

test('Reset sem resposta libera nova tentativa; desconexão cancela espera', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const p = panel(t);
  p.ui.onReport(sample);
  p.button.click();
  t.mock.timers.tick(6000);
  assert.equal(p.button.disabled, false);
  assert.match(p.status.textContent, /Sem resposta/);
  p.button.click();
  p.setReady(false);
  p.ui.onDisconnected();
  t.mock.timers.tick(6000);
  assert.equal(p.button.disabled, true);
  assert.equal(p.status.textContent, '');
});
