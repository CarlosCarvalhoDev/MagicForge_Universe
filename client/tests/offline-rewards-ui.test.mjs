import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOfflineDuration, formatOfflineLimit, OfflineRewardModal } from '../src/ui/OfflineRewardModal.ts';

test('1. formatOfflineDuration formata segundos em formato legível de Idle RPG', () => {
  assert.equal(formatOfflineDuration(45), '45s');
  assert.equal(formatOfflineDuration(125), '2min 5s');
  assert.equal(formatOfflineDuration(3600), '1h 0min');
  assert.equal(formatOfflineDuration(5420), '1h 30min');
  assert.equal(formatOfflineDuration(43200), '12h 0min');
});

test('Limite e tempo creditado vêm do servidor, incluindo 8h grátis e 12h premium futuro', () => {
  assert.equal(formatOfflineLimit({ maxOfflineSeconds: 28800, cappedSeconds: 28800 }),
    'Limite: 8h 0min · Tempo recompensado: 8h 0min');
  assert.equal(formatOfflineLimit({ maxOfflineSeconds: 43200, cappedSeconds: 3600 }),
    'Limite: 12h 0min · Tempo recompensado: 1h 0min');
  assert.match(formatOfflineLimit({ cappedSeconds: 3600 }), /Limite: 8h/);
});

test('Falha de resgate mantém modal e recompensa; sucesso fecha o modal', () => {
  const status = { textContent: '' };
  const button = { disabled: true, textContent: 'Coletando...' };
  const dialog = {
    open: true,
    querySelector(selector) { return selector === '#offline-claim-status' ? status : button; },
    close() { this.open = false; },
  };
  const modal = Object.create(OfflineRewardModal.prototype);
  const pending = { accumulatedGold: 100 };
  Object.assign(modal, { dialog, pendingPayload: pending, isClaiming: true });
  modal.onClaimed({ success: false, message: 'Libere espaço na mochila.' });
  assert.equal(dialog.open, true);
  assert.equal(modal.pendingPayload, pending);
  assert.equal(button.disabled, false);
  assert.equal(status.textContent, 'Libere espaço na mochila.');
  modal.onClaimed({ success: true });
  assert.equal(dialog.open, false);
  assert.equal(modal.pendingPayload, null);
});

test('Resgate parcial mantém o baú aberto e troca a prévia pelo restante já sem ouro/EXP', () => {
  const status = { textContent: '' }, button = { textContent: '' };
  const dialog = { open: true, querySelector: selector => selector === '#offline-claim-status' ? status : button, close() { this.open = false; } };
  const modal = Object.create(OfflineRewardModal.prototype);
  modal.show = payload => { modal.pendingPayload = payload; };
  Object.assign(modal, { dialog, isClaiming: true });
  const remainingReward = { accumulatedGold: 0, accumulatedExp: 0, lootPreview: [{itemId:'ore_iron_arcane',quantity:2}] };
  modal.onClaimed({ success: true, remainingReward, message: 'Restam 2 unidades no baú.' });
  assert.equal(dialog.open, true);
  assert.equal(modal.pendingPayload, remainingReward);
  assert.equal(modal.isClaiming, false);
  assert.match(button.textContent, /itens restantes/);
  assert.match(status.textContent, /2 unidades/);
});
