import { ClientNetwork } from '../src/network/ClientNetwork';
import { setupAuthSelection } from '../src/ui/AuthSelection';
import { setupFarmHelper } from '../src/ui/FarmHelper';
import { setupLeaderboard } from '../src/ui/Leaderboard';
import type { S2CFarmSettingsUpdatePayload, S2CAutoSalvageResultPayload, S2CExpandInventoryResultPayload, LeaderboardCategory, S2CLeaderboardUpdatePayload } from '@magicforge/shared';
import '../src/ui/auth-selection.css';
import '../src/ui/progression.css';
import '../src/ui/narrative.css';

const source = new DOMParser().parseFromString(await (await fetch('/index.html')).text(), 'text/html');
for (const style of source.head.querySelectorAll('style')) document.head.append(document.importNode(style, true));
for (const id of ['modal-auth-selection', 'char-class', 'char-name', 'farm-helper-modal', 'leaderboard-dialog']) document.body.append(document.importNode(source.getElementById(id)!, true));
const output = document.createElement('pre'); output.id = 'integration-result';
output.style.cssText = 'position:relative;z-index:2000;background:#10182a;color:#e2e8f0;padding:16px;white-space:pre-wrap;';
document.body.append(output);
const passed: string[] = [];
function check(condition: boolean, label: string) { if (!condition) throw new Error(label); passed.push(label); }
function until(condition: () => boolean, label: string) {
  return new Promise<void>((resolve, reject) => {
    const start = performance.now();
    const timer = window.setInterval(() => { if (condition()) { clearInterval(timer); resolve(); } else if (performance.now() - start > 8000) { clearInterval(timer); reject(new Error('Timeout: ' + label)); } }, 30);
  });
}
const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const click = (id: string) => document.getElementById(id)!.click();
const submitAccount = () => (document.getElementById('forge-account-form') as HTMLFormElement).requestSubmit();
const endpoint = new URLSearchParams(location.search).get('server') || '';
let network: ClientNetwork | undefined;
try {
  if (!/^ws:\/\/127\.0\.0\.1:\d+$/.test(endpoint)) throw new Error('Provide the disposable fixture endpoint.');
  const proof = await (await fetch(endpoint.replace('ws:', 'http:'))).json();
  if (proof.testFixture !== true || proof.database !== 'memory') throw new Error('Refusing to use a non-fixture server.');
  network = new ClientNetwork(endpoint);
  const net = network;
  let entered = false, queued: S2CFarmSettingsUpdatePayload | null = null;
  let settingsCount = 0, loginCount = 0, authErrors = 0;
  let lastSale: S2CAutoSalvageResultPayload | null = null;
  let lastRanking: S2CLeaderboardUpdatePayload | null = null;
  let lastExpansion: S2CExpandInventoryResultPayload | null = null;
  const ranking = setupLeaderboard({ isReady: () => entered && net.isConnected, request: (category, limit) => net.sendRequestLeaderboard(category, limit) });
  net.onLeaderboardUpdate = payload => { lastRanking = payload; ranking.onUpdate(payload); };
  net.onExpandInventoryResult = payload => { lastExpansion = payload; };
  const events: string[] = [];
  const farm = setupFarmHelper({ isReady: () => entered && net.isConnected, save: settings => net.sendUpdateFarmSettings(settings), salvage: rare => net.sendAutoSalvage(rare) });
  const auth = setupAuthSelection({
    isConnected: () => net.isConnected, connect: () => net.connect(), disconnect: () => net.disconnect(),
    authenticate: (name, password) => net.sendAuthLogin(name, password), register: (name, password, email) => net.sendAuthRegister(name, password, email),
    requestList: name => net.sendRequestCharacterList(name), create: (slot, name, cls) => net.sendCreateCharacterSlot(slot, name, cls), select: slot => net.sendSelectCharacterSlot(slot),
  });
  net.onConnectionStateChange = connected => { if (connected) auth.onConnected(); else { entered = false; queued = null; auth.onDisconnected(); farm.onDisconnected(); } };
  net.onAuthSuccess = payload => { if (payload.isActivated) auth.onAccountAuthenticated(payload.accountUsername, payload.provider); else auth.onAuthenticationError('Conta inativa.'); };
  net.onAuthError = error => { authErrors++; auth.onAuthenticationError(error.errorMessage); };
  net.onCharacterList = payload => auth.onCharacterList(payload);
  net.onCharacterActionError = error => { auth.onError(error); farm.onError(error.errorMessage); };
  net.onFarmSettingsUpdate = payload => { settingsCount++; events.push('farm'); if (!entered) queued = payload; else farm.onSettingsUpdate(payload); };
  net.onLoginSuccess = () => { loginCount++; events.push('login'); entered = true; farm.onCharacterLogin(); if (queued) { farm.onSettingsUpdate(queued); queued = null; } auth.onLogin(); };
  net.onAutoSalvageResult = payload => { lastSale = payload; farm.onSalvageResult(payload); };

  check(input('btn-save-farm-helper').disabled, 'Farm bloqueado antes de receber estado autoritativo');
  input('forge-account-name').value = 'codex_fixture_28'; input('forge-account-password').value = 'fixture-only'; submitAccount();
  await until(() => authErrors === 1, 'nonexistent login');
  check(!document.getElementById('forge-account-form')!.hidden && loginCount === 0, 'Conta inexistente gera erro real sem criar personagem');
  click('forge-toggle-register'); input('forge-account-password').value = 'fixture-only'; input('forge-password-confirm').value = 'fixture-only'; input('forge-account-email').value = 'fixture@example.com'; submitAccount();
  await until(() => !document.querySelector<HTMLButtonElement>('[data-slot-index="0"] button')!.disabled, 'register and list');
  check(loginCount === 0 && net.myPlayerId === null, 'Cadastro autentica e lista slots sem entrar no mundo');
  document.querySelector<HTMLButtonElement>('[data-slot-index="0"] button')!.click();
  input('forge-hero-name').value = 'FixtureHero28';
  (document.getElementById('forge-entry-form') as HTMLFormElement).requestSubmit();
  await until(() => document.querySelector('[data-slot-index="0"] h3')!.textContent === 'FixtureHero28', 'create character');
  check(loginCount === 0 && auth.isOpen(), 'Criação real retorna pedestal ocupado sem login implícito');
  document.querySelector<HTMLElement>('[data-slot-index="0"] .forge-pedestal')!.click();
  check(!document.getElementById('hero-quote-0')!.hidden && document.getElementById('hero-quote-1')!.hidden && loginCount === 0, 'Pedestal ocupado exibe fala sem entrar no mundo; slot vazio fica sem fala');
  document.querySelector<HTMLButtonElement>('[data-slot-index="0"] button')!.click();
  await until(() => loginCount === 1 && !input('btn-save-farm-helper').disabled, 'select and farm sync');
  check(events.indexOf('farm') < events.indexOf('login') && !auth.isOpen(), 'Preferências anteriores ao login são preservadas e aplicadas na seleção');
  document.getElementById('farm-helper-modal')!.style.display = 'flex'; farm.onOpen();
  input('chk-auto-hp-enabled').checked = true; input('slider-auto-hp').value = '75';
  input('chk-auto-mp-enabled').checked = false; input('slider-auto-mp').value = '45';
  input('chk-auto-sell-common').checked = false; input('chk-auto-sell-uncommon').checked = false;
  const before = settingsCount; click('btn-save-farm-helper');
  check(input('btn-save-farm-helper').disabled, 'Salvar bloqueia envio duplicado até o retorno');
  await until(() => settingsCount > before && !input('btn-save-farm-helper').disabled, 'save preferences');
  check(net.farmSettings?.autoHpPotionThreshold === 75 && net.farmSettings?.autoMpPotionEnabled === false && input('slider-auto-mp').disabled, 'Servidor confirma percentuais e flag MP refletidos na UI');
  click('btn-auto-salvage');
  check(lastSale === null && !document.getElementById('farm-salvage-confirm')!.hidden, 'Venda em lote exige confirmação antes de enviar');
  click('btn-confirm-salvage'); await until(() => lastSale !== null, 'salvage');
  check(typeof lastSale!.newGoldTotal === 'number' && Boolean(document.getElementById('farm-salvage-status')!.textContent), 'Venda retorna resultado autoritativo real no SQLite em memória');
  ranking.open();
  for (const category of ['COMBAT_POWER', 'LEVEL', 'STAGE', 'GOLD'] as LeaderboardCategory[]) {
    if (category !== 'COMBAT_POWER') document.querySelector<HTMLButtonElement>('[data-ranking="' + category + '"]')!.click();
    await until(() => lastRanking?.category === category, 'leaderboard ' + category);
    check(lastRanking!.entries.some(entry => entry.name === 'FixtureHero28') && lastRanking!.myRank === 1 && document.getElementById('leaderboard-personal')!.textContent!.includes('#1'), 'SQLite e UI confirmam colocação pessoal: ' + category);
  }
  click('leaderboard-close');
  net.sendExpandInventory(); await until(() => lastExpansion !== null, 'expansion rejection');
  check(lastExpansion!.success === false && lastExpansion!.newMaxSlots === 20 && lastExpansion!.goldSpent === 0 && lastExpansion!.nextExpansionCost === 10000 && lastExpansion!.nextExpansionMinLevel === 15, 'Servidor rejeita expansão prematura sem cobrar e retorna cotação real');
  net.disconnect();
  await until(() => !input('forge-account-password').disabled, 'disconnect');
  check(input('btn-save-farm-helper').disabled && auth.isOpen(), 'Desconexão limpa preferências e retorna ao login');
  output.textContent = 'PASS ' + passed.length + '/' + passed.length + '\nBackend real · SQLite :memory: · nenhuma alteração no banco compartilhado\n' + passed.join('\n');
  output.dataset.result = 'pass';
} catch (error) {
  network?.disconnect(); output.textContent = 'FAIL após ' + passed.length + ': ' + error; output.dataset.result = 'fail'; console.error(error);
}
