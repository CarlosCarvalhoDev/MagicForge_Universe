import { CharacterClass, type S2CCharacterListPayload } from '@magicforge/shared';
import { setupAuthSelection } from '../src/ui/AuthSelection';
import '../src/ui/auth-selection.css';

// Real UI markup/controller, fake transport: no WebSocket, server or SQLite writes.
const source = new DOMParser().parseFromString(await (await fetch('/index.html')).text(), 'text/html');
for (const style of source.head.querySelectorAll('style')) document.head.append(document.importNode(style, true));
for (const id of ['modal-auth-selection', 'char-class', 'char-name']) {
  document.body.append(document.importNode(source.getElementById(id)!, true));
}
const result = document.createElement('p');
result.id = 'test-results';
result.style.cssText = 'padding:16px;background:#172035;color:#e2e8f0;white-space:pre-line;max-height:90px;overflow:auto;margin-bottom:20px';
document.querySelector('.forge-auth')!.prepend(result);
const calls: string[] = [];
let connected = false;
const ui = setupAuthSelection({
  isConnected: () => connected,
  connect: () => calls.push('connect'),
  disconnect: () => { connected = false; calls.push('disconnect'); },
  authenticate: (name, password) => { if (password !== 'fixture-only') throw new Error('Senha de teste inesperada'); calls.push('auth:' + name); },
  register: (name, password, email) => { if (password !== 'fixture-only') throw new Error('Senha de teste inesperada'); calls.push('register:' + name + ':' + email); },
  authenticateSocial: provider => calls.push('social:' + provider),
  requestList: name => calls.push('list:' + name),
  create: (slot, name, cls) => calls.push('create:' + slot + ':' + name + ':' + cls),
  select: slot => calls.push('select:' + slot),
});
const passed: string[] = [];
function check(condition: boolean, label: string) {
  if (!condition) throw new Error(label);
  passed.push(label);
}
const accountForm = document.getElementById('forge-account-form') as HTMLFormElement;
const createForm = document.getElementById('forge-entry-form') as HTMLFormElement;
const accountInput = document.getElementById('forge-account-name') as HTMLInputElement;
const passwordInput = document.getElementById('forge-account-password') as HTMLInputElement;
const nameInput = document.getElementById('forge-hero-name') as HTMLInputElement;
const card = (index: number) => document.querySelector<HTMLElement>('[data-slot-index="' + index + '"]')!;
const button = (index: number) => card(index).querySelector('button')!;
const submit = (form: HTMLFormElement) => form.dispatchEvent(new Event('submit', { cancelable: true }));
const payload: S2CCharacterListPayload = {
  accountId: 'fixture-account', accountUsername: 'conta de teste', slots: [
    { slotIndex: 2, isEmpty: true },
    { slotIndex: 0, isEmpty: false, id: 'fixture-warrior', name: 'Herói de teste', classType: CharacterClass.GUERREIRO, level: 44, combatPower: 6935, currentHp: 100, maxHp: 200, gold: 39664 },
    { slotIndex: 1, isEmpty: true },
  ],
};
try {
  check(button(0).disabled && calls.length === 0, 'Abertura não conecta nem inventa personagens');
  check((document.getElementById('forge-account-email') as HTMLInputElement).disabled, 'Login não exige campos de cadastro ocultos');
  check(document.querySelector<HTMLElement>('.forge-roster')!.hidden && passwordInput.type === 'password', 'Primeira tela é conta e senha; sala oculta');
  check(Array.from(document.querySelectorAll<HTMLButtonElement>('[data-auth-provider]')).every(button => button.disabled === (button.dataset.authProvider !== 'GUEST')), 'Somente convidado disponível; provedores externos bloqueados');
  accountInput.value = 'Conta de Teste';
  passwordInput.value = 'fixture-only';
  submit(accountForm); submit(accountForm);
  check(calls.join() === 'connect', 'Conexão única; duplo envio bloqueado');
  connected = true; ui.onConnected();
  check(calls.at(-1) === 'auth:conta de teste' && !calls.some(c => c.startsWith('list:')) && !passwordInput.value, 'Conexão autentica antes da lista e limpa senha do campo');
  ui.onCharacterList(payload);
  check(document.querySelector<HTMLElement>('.forge-roster')!.hidden, 'Lista não libera sala antes de autenticação');
  ui.onAuthenticationError('Conta ou senha incorreta.');
  check(!passwordInput.disabled && document.querySelector<HTMLElement>('.forge-roster')!.hidden, 'Senha incorreta mantém a tela de login');
  passwordInput.value = 'fixture-only'; submit(accountForm);
  ui.onAccountAuthenticated(payload.accountUsername);
  check(calls.at(-1) === 'list:conta de teste' && accountForm.hidden, 'Confirmação de autenticação abre sala e solicita lista');
  check(document.getElementById('forge-social-login')!.hidden, 'Opções de login social não aparecem dentro da sala');
  ui.onCharacterList({ ...payload, accountUsername: 'Outra conta' });
  check(button(0).disabled, 'Resposta de outra conta ignorada');
  ui.onCharacterList({ ...payload, slots: [payload.slots[0]] });
  check(button(0).disabled && document.getElementById('forge-auth-status')!.dataset.state === 'error', 'Lista incompleta não habilita os pedestais');
  document.getElementById('forge-refresh-slots')!.click(); ui.onCharacterList(payload);
  check(card(0).querySelector('h3')!.textContent === 'Herói de teste' && !button(2).disabled, 'Slots fora de ordem são mapeados por índice');
  button(1).click(); nameInput.value = '   '; submit(createForm);
  check(!calls.some(c => c.startsWith('create:')) && !nameInput.validity.valid, 'Nome vazio após trim não é enviado');
  nameInput.value = 'NovoClerigo'; nameInput.dispatchEvent(new Event('input'));
  (document.getElementById('forge-hero-class') as HTMLSelectElement).value = CharacterClass.CLERIGO;
  submit(createForm); submit(createForm);
  check(calls.filter(c => c.startsWith('create:')).length === 1 && calls.at(-1) === 'create:1:NovoClerigo:CLERIGO', 'Criação usa slot/classe e bloqueia repetição');
  check(card(1).querySelector('h3')!.textContent === 'Uma nova lenda' && ui.isOpen(), 'Criar não preenche slot nem entra antes da resposta');
  ui.onError({ errorCode: 'NAME_TAKEN', errorMessage: 'Nome já utilizado.' });
  check(!createForm.hidden && nameInput.value === 'NovoClerigo' && !nameInput.disabled, 'Erro de nome preserva formulário para correção');
  submit(createForm);
  const created = { ...payload, slots: payload.slots.map(slot => slot.slotIndex === 1 ? { slotIndex: 1, isEmpty: false, id: 'fixture-cleric', name: '<HeroNovo>', classType: CharacterClass.CLERIGO, level: 1, combatPower: 100 } : slot) };
  ui.onCharacterList(created);
  check(ui.isOpen() && createForm.hidden && card(1).querySelector('h3')!.textContent === '<HeroNovo>' && !card(1).querySelector('HeroNovo'), 'Confirmação atualiza lista sem login; nome exibido como texto');
  button(1).click(); button(1).click();
  check(calls.filter(c => c === 'select:1').length === 1 && ui.isOpen(), 'Seleção única aguarda login success');
  ui.onLogin();
  check(!ui.isOpen(), 'Somente login confirmado fecha a tela');
  connected = false; ui.onDisconnected();
  check(ui.isOpen() && button(0).disabled && !accountForm.hidden, 'Desconexão retorna ao login sem reutilizar sessão');
  const listCallsBeforeReconnect = calls.filter(c => c.startsWith('list:')).length;
  connected = true; ui.onConnected(); ui.onCharacterList(created);
  check(calls.filter(c => c.startsWith('list:')).length === listCallsBeforeReconnect && !accountForm.hidden, 'Reconexão não solicita lista sem reautenticar');
  passwordInput.value = 'fixture-only'; submit(accountForm); ui.onAccountAuthenticated(payload.accountUsername); ui.onCharacterList(created);
  button(2).click(); document.getElementById('forge-cancel-create')!.click();
  check(createForm.hidden && document.activeElement === button(2), 'Cancelar criação devolve foco ao pedestal');
  document.getElementById('forge-refresh-slots')!.click();
  result.textContent = 'TESTE ISOLADO · aguardando cenário de timeout (12 segundos)…';
  await new Promise(resolve => window.setTimeout(resolve, 12500));
  check(button(0).disabled && !accountInput.disabled && document.getElementById('forge-auth-status')!.dataset.state === 'error', 'Timeout exige relistar e libera nova tentativa');
  document.getElementById('forge-refresh-slots')!.click(); ui.onCharacterList(created);
  check(!button(0).disabled && ui.isOpen(), 'Nova lista recupera interface após timeout');
  document.getElementById('forge-sign-out')!.click();
  check(!accountForm.hidden && calls.at(-1) === 'disconnect', 'Trocar conta desconecta e volta ao login');
  document.getElementById('forge-toggle-register')!.click();
  accountInput.value = 'ContaNova_28'; passwordInput.value = 'fixture-only';
  const confirmation = document.getElementById('forge-password-confirm') as HTMLInputElement;
  confirmation.value = 'diferente'; submit(accountForm);
  check(!calls.some(c => c.startsWith('register:')) && !confirmation.validity.valid, 'Cadastro rejeita senhas divergentes');
  confirmation.value = 'fixture-only'; confirmation.dispatchEvent(new Event('input'));
  const emailField = document.getElementById('forge-account-email') as HTMLInputElement;
  emailField.value = ''; submit(accountForm);
  check(!calls.some(c => c.startsWith('register:')) && emailField.required && !emailField.validity.valid, 'Email vazio bloqueia cadastro sem envio');
  emailField.value = 'email-invalido'; submit(accountForm);
  check(!calls.some(c => c.startsWith('register:')) && !emailField.validity.valid, 'Email inválido bloqueia cadastro sem envio');
  emailField.value = 'fixture@example.com';
  submit(accountForm); connected = true; ui.onConnected();
  check(calls.at(-1) === 'register:contanova_28:fixture@example.com' && !passwordInput.value && !confirmation.value, 'Cadastro usa contrato e limpa campos de senha');
  ui.onAccountAuthenticated('contanova_28');
  const emptySlots = [0, 1, 2].map(slotIndex => ({ slotIndex, isEmpty: true }));
  ui.onCharacterList({ accountId: 'new-fixture', accountUsername: 'contanova_28', slots: emptySlots });
  check(accountForm.hidden && card(0).querySelector('h3')!.textContent === 'Uma nova lenda', 'Cadastro confirmado revela pedestais vazios');
  document.getElementById('forge-sign-out')!.click();
  document.querySelector<HTMLButtonElement>('[data-auth-provider="GUEST"]')!.click();
  connected = true; ui.onConnected();
  check(calls.at(-1) === 'social:GUEST' && document.querySelector<HTMLElement>('.forge-roster')!.hidden, 'Convidado também aguarda autenticação');
  ui.onAccountAuthenticated('guest_fixture', 'GUEST');
  ui.onCharacterList({ accountId: 'guest-fixture', accountUsername: 'guest_fixture', slots: emptySlots });
  check(calls.at(-1) === 'list:guest_fixture' && accountForm.hidden, 'Convidado usa identidade canônica retornada pelo servidor');
  result.textContent = 'TESTE ISOLADO · dados fictícios · nenhum acesso ao banco\nPASS: ' + passed.length + '/' + passed.length + '\n' + passed.join('\n');
  result.dataset.result = 'pass';
} catch (error) {
  result.textContent = 'FAIL após ' + passed.length + ' verificações: ' + error;
  result.dataset.result = 'fail';
  console.error(error);
}
