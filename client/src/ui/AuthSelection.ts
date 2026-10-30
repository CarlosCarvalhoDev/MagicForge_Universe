import { CharacterClass, type CharacterSlotSummary, type S2CCharacterListPayload, type S2CCharacterActionErrorPayload } from '@magicforge/shared';
import { HERO_QUOTES } from './NarrativeContent';
import { speakNarrative } from './Narration';

interface AuthTransport {
  isConnected(): boolean;
  connect(): void;
  disconnect(): void;
  authenticate?(username: string, password: string): void;
  register?(username: string, password: string, email?: string): void;
  authenticateSocial?(provider: 'GUEST'): void;
  requestList(username: string): void;
  create(slot: number, name: string, classType: CharacterClass): void;
  select(slot: number): void;
}

/** The server owns every slot; creating a hero never implies entering the world. */
export function setupAuthSelection(transport: AuthTransport) {
  const root = document.getElementById('modal-auth-selection')!;
  const accountForm = document.getElementById('forge-account-form') as HTMLFormElement;
  const accountInput = document.getElementById('forge-account-name') as HTMLInputElement;
  const passwordInput = document.getElementById('forge-account-password') as HTMLInputElement;
  const confirmInput = document.getElementById('forge-password-confirm') as HTMLInputElement;
  const emailInput = document.getElementById('forge-account-email') as HTMLInputElement;
  const form = document.getElementById('forge-entry-form') as HTMLFormElement;
  const nameInput = document.getElementById('forge-hero-name') as HTMLInputElement;
  const classSelect = document.getElementById('forge-hero-class') as HTMLSelectElement;
  const legacyClass = document.getElementById('char-class') as HTMLSelectElement;
  const status = document.getElementById('forge-auth-status')!;
  const portrait = document.getElementById('forge-preview-portrait') as HTMLImageElement;
  const classLabel = document.getElementById('forge-preview-class')!;
  const note = document.getElementById('forge-roster-note')!;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-slot-index]'));
  const background = Array.from(document.body.children)
    .filter((el): el is HTMLElement => el instanceof HTMLElement && el !== root && el.tagName !== 'SCRIPT')
    .map(element => ({ element, wasInert: element.inert }));
  let account = '';
  let authenticated = false;
  let passwordToSend = '';
  let emailToSend: string | undefined;
  let registerMode = false;
  let authKind: 'login' | 'register' | 'guest' = 'login';
  let slots: CharacterSlotSummary[] | null = null;
  let selected: number | null = null;
  let pending: 'authenticate' | 'list' | 'create' | 'select' | null = null;
  let timeout: number | undefined;
  let waitingForConnection = false;
  let inWorld = false;

  const show = () => {
    root.hidden = false;
    background.forEach(({ element }) => { element.inert = true; });
  };
  const close = () => {
    root.hidden = true;
    background.forEach(({ element, wasInert }) => { element.inert = wasInert; });
  };
  const setStatus = (message: string, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? 'error' : 'info';
  };
  const className = (value?: CharacterClass) =>
    Array.from(classSelect.options).find(option => option.value === value)?.textContent?.split(' (')[0] || 'Herói';
  const number = (value?: number) => value === undefined ? '—' : value.toLocaleString('pt-BR');

  classSelect.replaceChildren(...Array.from(legacyClass.options, option => option.cloneNode(true)));
  classSelect.value = legacyClass.value;
  const preview = () => {
    portrait.src = '/assets/portraits/' + classSelect.value + '.png';
    portrait.onerror = () => { portrait.src = '/assets/portraits/' + classSelect.value + '.jpg'; };
    classLabel.textContent = className(classSelect.value as CharacterClass);
    portrait.alt = 'Retrato da classe ' + classLabel.textContent;
  };
  classSelect.addEventListener('change', preview);
  preview();

  function render() {
    const selecting = authenticated;
    root.dataset.screen = selecting ? 'characters' : 'login';
    root.querySelector<HTMLElement>('.forge-roster')!.hidden = !selecting;
    accountForm.hidden = selecting;
    document.getElementById('forge-social-login')!.hidden = selecting;
    document.getElementById('forge-account-session')!.hidden = !selecting;
    document.getElementById('forge-session-name')!.textContent = selecting ? 'Conta: ' + account : '';
    document.getElementById('forge-auth-title')!.textContent = selecting ? 'Sala dos Forjados' : 'Entre na Forja Astral.';
    document.getElementById('forge-intro-copy')!.textContent = selecting ? 'Escolha quem continuará sua jornada. Cada pedestal guarda uma nova lenda.' : 'Acesse sua conta para encontrar seus heróis e continuar sua jornada.';
    const creating = selecting && selected !== null && Boolean(slots?.[selected]?.isEmpty);
    root.querySelector<HTMLElement>('.forge-entry')!.hidden = selecting && !creating;
    document.getElementById('forge-entry-title')!.textContent = selecting ? 'Forje um novo herói' : registerMode ? 'Crie sua conta' : 'Acesse sua conta';
    document.getElementById('forge-entry-copy')!.textContent = selecting ? 'Escolha o nome e a classe para o pedestal selecionado.' : 'Seus heróis estarão esperando na Sala dos Forjados.';
    accountForm.setAttribute('aria-busy', String(pending === 'authenticate'));
    form.setAttribute('aria-busy', String(pending === 'create'));
    for (const control of root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button')) {
      control.disabled = Boolean(pending);
    }
    const canUseCredentials = registerMode ? Boolean(transport.register) : Boolean(transport.authenticate);
    accountForm.querySelector('button')!.textContent = pending === 'authenticate' ? 'AGUARDE…' : registerMode ? 'CRIAR CONTA' : 'ENTRAR';
    (accountForm.querySelector('button') as HTMLButtonElement).disabled = Boolean(pending) || !canUseCredentials;
    passwordInput.disabled = Boolean(pending) || !canUseCredentials;
    passwordInput.autocomplete = registerMode ? 'new-password' : 'current-password';
    passwordInput.minLength = registerMode ? 4 : 1;
    confirmInput.required = registerMode;
    confirmInput.disabled = Boolean(pending) || !registerMode;
    emailInput.required = registerMode;
    emailInput.disabled = Boolean(pending) || !registerMode;
    document.getElementById('forge-register-fields')!.hidden = !registerMode;
    const toggleRegister = document.getElementById('forge-toggle-register') as HTMLButtonElement;
    toggleRegister.disabled = Boolean(pending) || !transport.register;
    toggleRegister.textContent = registerMode ? 'Já tenho conta · entrar' : 'Criar uma nova conta';
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-auth-provider]')) {
      button.disabled = Boolean(pending) || button.dataset.authProvider !== 'GUEST' || !transport.authenticateSocial;
    }
    form.querySelector('button[type=submit]')!.textContent = pending === 'create' ? 'FORJANDO HERÓI…' : 'CRIAR HERÓI';
    form.hidden = !creating;
    for (const card of cards) {
      const index = Number(card.dataset.slotIndex);
      const slot = slots?.[index];
      card.classList.toggle('is-selected', selected === index);
      card.classList.toggle('is-occupied', Boolean(slot && !slot.isEmpty));
      card.querySelector('h3')!.textContent = slot ? slot.isEmpty ? 'Uma nova lenda' : slot.name! : 'Destino por revelar';
      card.querySelector('p')!.textContent = !slot ? 'Carregue sua conta para revelar este pedestal.'
        : slot.isEmpty ? 'Este pedestal aguarda seu próximo herói.'
        : className(slot.classType) + ' · Nv. ' + number(slot.level) + '\nCP ' + number(slot.combatPower) + ' · Ouro ' + number(slot.gold) + '\nVida ' + number(slot.currentHp) + '/' + number(slot.maxHp);
      const pedestal = card.querySelector('.forge-pedestal')!;
      (pedestal as HTMLElement).tabIndex = slot && !slot.isEmpty ? 0 : -1;
      if (slot && !slot.isEmpty) { pedestal.setAttribute('role', 'button'); pedestal.setAttribute('aria-label', 'Conhecer ' + slot.name); }
      else { pedestal.removeAttribute('role'); pedestal.removeAttribute('aria-label'); }
      const quote = card.querySelector<HTMLElement>('.forge-hero-quote'); if (quote) quote.hidden = true;
      const image = pedestal.querySelector('img') as HTMLImageElement;
      image.src = '/assets/ui/login/pedestal_runico_' + (slot && !slot.isEmpty ? 'ativo' : 'vazio') + '.png';
      let hero = pedestal.querySelector<HTMLImageElement>('.forge-slot-portrait');
      if (slot && !slot.isEmpty) {
        if (!hero) { hero = document.createElement('img'); hero.className = 'forge-slot-portrait'; pedestal.append(hero); }
        hero.src = '/assets/portraits/' + slot.classType + '.png';
        const portraitImg = hero; hero.onerror = () => { portraitImg.src = '/assets/portraits/' + slot.classType + '.jpg'; };
        hero.alt = 'Retrato de ' + slot.name + ', ' + className(slot.classType);
      } else hero?.remove();
      (pedestal.querySelector('span') as HTMLElement).hidden = Boolean(slot && !slot.isEmpty);
      const button = card.querySelector('button')!;
      button.disabled = !authenticated || !slot || Boolean(pending) || !transport.isConnected();
      button.textContent = !slot ? 'AGUARDANDO CONTA' : pending === 'select' && selected === index ? 'ENTRANDO…' : slot.isEmpty ? '+ CRIAR NOVO HERÓI' : 'ENTRAR NO MUNDO →';
      button.setAttribute('aria-label', 'Pedestal ' + (index + 1) + ': ' + (!slot ? 'aguardando conta' : slot.isEmpty ? 'criar novo herói' : 'entrar com ' + slot.name));
    }
  }

  function finish() {
    window.clearTimeout(timeout);
    timeout = undefined;
    pending = null;
    render();
  }
  function begin(action: NonNullable<typeof pending>, message: string) {
    pending = action;
    setStatus(message);
    render();
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      // An unconfirmed create may already exist. Require a fresh list before retrying.
      waitingForConnection = false;
      passwordToSend = '';
      passwordInput.value = '';
      confirmInput.value = '';
      emailToSend = undefined;
      if (action === 'authenticate') authenticated = false;
      slots = null;
      selected = null;
      finish();
      setStatus(action === 'authenticate' ? 'Sem confirmação do servidor. Tente entrar novamente.' : 'Sem confirmação do servidor. Atualize os heróis antes de tentar outra ação.', true);
    }, 12000);
  }
  function requestList() {
    if (!authenticated) return;
    waitingForConnection = false;
    begin('list', 'Revelando os heróis da conta ' + account + '…');
    transport.requestList(account);
  }
  document.getElementById('forge-refresh-slots')!.addEventListener('click', () => {
    if (authenticated && !pending && transport.isConnected()) requestList();
  });

  accountForm.addEventListener('submit', event => {
    event.preventDefault();
    if (pending || !(registerMode ? transport.register : transport.authenticate)) return;
    const username = accountInput.value.trim();
    if (!username) { accountInput.setCustomValidity('Informe o nome da conta.'); accountInput.reportValidity(); return; }
    if (!passwordInput.value) { passwordInput.reportValidity(); return; }
    if (registerMode && (!/^[a-zA-Z0-9_]{3,20}$/.test(username) || passwordInput.value.length < 4)) {
      setStatus('Use conta de 3 a 20 letras, números ou _ e senha de pelo menos 4 caracteres.', true);
      return;
    }
    if (registerMode && passwordInput.value !== confirmInput.value) {
      confirmInput.setCustomValidity('As senhas precisam ser iguais.'); confirmInput.reportValidity(); return;
    }
    if (registerMode) {
      emailInput.value = emailInput.value.trim();
      if (!emailInput.value || !emailInput.checkValidity()) {
        setStatus('Informe um email válido para criar sua conta.', true);
        emailInput.reportValidity(); return;
      }
    }
    // DatabaseManager normalizes account usernames to lowercase.
    account = username.toLowerCase();
    authenticated = false;
    authKind = registerMode ? 'register' : 'login';
    passwordToSend = passwordInput.value;
    emailToSend = registerMode ? emailInput.value.trim() || undefined : undefined;
    passwordInput.value = '';
    confirmInput.value = '';
    slots = null;
    selected = null;
    note.textContent = 'Aguardando os pedestais da conta ' + account + '.';
    if (transport.isConnected()) authenticate();
    else {
      waitingForConnection = true;
      begin('authenticate', 'Conectando à Forja Astral…');
      transport.connect();
    }
  });
  accountInput.addEventListener('input', () => accountInput.setCustomValidity(''));
  confirmInput.addEventListener('input', () => confirmInput.setCustomValidity(''));
  document.getElementById('forge-toggle-register')!.addEventListener('click', () => {
    if (pending || !transport.register) return;
    registerMode = !registerMode;
    passwordInput.value = ''; confirmInput.value = ''; confirmInput.setCustomValidity('');
    render();
    setStatus(registerMode ? 'Crie sua conta para começar uma nova jornada.' : 'Informe sua conta e senha para entrar.');
    accountInput.focus();
  });
  root.querySelector<HTMLButtonElement>('[data-auth-provider="GUEST"]')!.addEventListener('click', () => {
    if (pending || !transport.authenticateSocial) return;
    authKind = 'guest'; account = 'guest'; authenticated = false; slots = null; selected = null;
    passwordInput.value = ''; confirmInput.value = ''; passwordToSend = ''; emailToSend = undefined;
    if (transport.isConnected()) authenticate();
    else { waitingForConnection = true; begin('authenticate', 'Conectando como convidado…'); transport.connect(); }
  });
  function authenticate() {
    if (authKind === 'guest') {
      if (!transport.authenticateSocial) return;
      waitingForConnection = false;
      begin('authenticate', 'Entrando como convidado neste navegador…');
      try { transport.authenticateSocial('GUEST'); }
      catch { finish(); setStatus('Não foi possível manter o acesso de convidado neste navegador. Use conta e senha.', true); }
      return;
    }
    if (!transport.authenticate || !passwordToSend) return;
    waitingForConnection = false;
    begin('authenticate', 'Validando sua conta…');
    const password = passwordToSend;
    passwordToSend = '';
    const email = emailToSend; emailToSend = undefined;
    if (authKind === 'register') transport.register?.(account, password, email);
    else transport.authenticate(account, password);
  }

  document.getElementById('forge-sign-out')!.addEventListener('click', () => {
    account = '';
    authenticated = false;
    passwordToSend = '';
    passwordInput.value = '';
    confirmInput.value = ''; emailToSend = undefined; registerMode = false;
    slots = null;
    selected = null;
    inWorld = false;
    waitingForConnection = false;
    finish();
    transport.disconnect();
    setStatus('Entre com sua conta para continuar.');
    accountInput.focus();
  });

  for (const card of cards) {
    const quote = document.createElement('div'); quote.className = 'forge-hero-quote'; quote.hidden = true; quote.setAttribute('role', 'tooltip'); quote.id = 'hero-quote-' + card.dataset.slotIndex; card.append(quote);
    const pedestal = card.querySelector<HTMLElement>('.forge-pedestal')!;
    const showQuote = (speak = false) => {
      const slot = slots?.[Number(card.dataset.slotIndex)];
      const text = slot && !slot.isEmpty ? HERO_QUOTES[slot.classType || ''] : '';
      if (!text) return;
      quote.textContent = text; quote.hidden = false; pedestal.setAttribute('aria-describedby', quote.id);
      if (speak) speakNarrative(text);
    };
    const hideQuote = () => { quote.hidden = true; pedestal.removeAttribute('aria-describedby'); };
    card.addEventListener('mouseenter', () => showQuote()); card.addEventListener('mouseleave', hideQuote);
    card.addEventListener('focusin', () => showQuote());
    card.addEventListener('focusout', event => { if (!(event.relatedTarget instanceof Node) || !card.contains(event.relatedTarget)) hideQuote(); });
    pedestal.addEventListener('click', () => showQuote(true));
    pedestal.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showQuote(true); } });
    card.querySelector('button')!.addEventListener('click', () => {
      if (!authenticated || pending || !slots || !transport.isConnected()) return;
      selected = Number(card.dataset.slotIndex);
      const slot = slots[selected];
      if (slot.isEmpty) {
        render();
        document.getElementById('forge-create-title')!.textContent = 'Novo herói · pedestal ' + (selected + 1);
        setStatus('Escolha o nome e a classe do novo herói.');
        nameInput.focus();
      } else {
        begin('select', 'Preparando a entrada de ' + slot.name + '…');
        transport.select(selected);
      }
    });
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!authenticated || pending || selected === null || !slots?.[selected]?.isEmpty || !transport.isConnected()) return;
    const name = nameInput.value.trim();
    if (name.length < 3 || name.length > 20) {
      nameInput.setCustomValidity('Use um nome de 3 a 20 caracteres.');
      nameInput.reportValidity();
      return;
    }
    begin('create', 'Forjando ' + name + ' no pedestal ' + (selected + 1) + '…');
    transport.create(selected, name, classSelect.value as CharacterClass);
  });
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  document.getElementById('forge-cancel-create')!.addEventListener('click', () => {
    const index = selected;
    selected = null;
    render();
    setStatus('Escolha um herói para entrar ou um pedestal vazio para criar.');
    cards[index ?? 0].querySelector('button')!.focus();
  });
  document.getElementById('btn-auth-switch-dev')!.addEventListener('click', () => {
    if (pending) return;
    account = '';
    slots = null;
    selected = null;
    close();
    document.getElementById('inspector-panel')?.classList.remove('collapsed');
    document.getElementById('char-name')?.focus();
  });

  show();
  render();
  setStatus(transport.authenticate ? 'Informe sua conta e senha para entrar.' : 'O acesso por conta e senha ainda não está disponível.');
  return {
    isOpen: () => !root.hidden,
    onConnected() {
      if (!account || root.hidden) return;
      if (waitingForConnection && pending === 'authenticate') authenticate();
    },
    onAccountAuthenticated(username: string, provider = 'LOCAL') {
      if (pending !== 'authenticate' || !username.trim()) return;
      if (authKind === 'guest' ? provider !== 'GUEST' : username.trim().toLowerCase() !== account) return;
      account = username.trim().toLowerCase();
      authenticated = true;
      passwordToSend = '';
      passwordInput.value = '';
      confirmInput.value = ''; emailToSend = undefined; registerMode = false;
      requestList();
    },
    onAuthenticationError(message: string) {
      if (pending !== 'authenticate') return;
      authenticated = false;
      passwordToSend = '';
      passwordInput.value = '';
      confirmInput.value = ''; emailToSend = undefined;
      finish();
      setStatus(message || 'Não foi possível entrar. Confira sua conta e senha.', true);
      passwordInput.focus();
    },
    onDisconnected() {
      if (!account) return;
      const wasInWorld = inWorld;
      inWorld = false;
      authenticated = false;
      passwordToSend = '';
      passwordInput.value = '';
      confirmInput.value = ''; emailToSend = undefined; registerMode = false;
      waitingForConnection = false;
      slots = null;
      selected = null;
      finish();
      show();
      note.textContent = 'Conta: ' + account + ' · aguardando atualização dos pedestais.';
      setStatus(wasInWorld ? 'Conexão interrompida. Entre novamente para voltar à sua jornada.' : 'Conexão interrompida. Entre novamente com sua conta e senha.', true);
    },
    onCharacterList(payload: S2CCharacterListPayload) {
      if (!authenticated || !account || root.hidden || payload.accountUsername?.trim().toLowerCase() !== account) return;
      const valid = Array.isArray(payload.slots) && payload.slots.length === 3
        && [0, 1, 2].every(index => payload.slots.some(slot => slot.slotIndex === index && typeof slot.isEmpty === 'boolean'
          && (slot.isEmpty || (typeof slot.name === 'string' && Object.values(CharacterClass).includes(slot.classType!)))));
      if (!valid) {
        slots = null;
        selected = null;
        finish();
        setStatus('A lista de heróis veio incompleta. Carregue a conta novamente.', true);
        return;
      }
      const wasCreate = pending === 'create';
      const createdSlot = selected;
      slots = [...payload.slots].sort((a, b) => a.slotIndex - b.slotIndex);
      selected = null;
      nameInput.value = '';
      finish();
      note.textContent = 'Conta: ' + payload.accountUsername + ' · ' + slots.filter(slot => !slot.isEmpty).length + ' de 3 pedestais ocupados.';
      setStatus(payload.message || 'Escolha um herói para entrar ou um pedestal vazio para criar.');
      if (wasCreate && createdSlot !== null) cards[createdSlot].querySelector('button')!.focus();
    },
    onError(error: S2CCharacterActionErrorPayload) {
      if (!pending || root.hidden) return;
      const action = pending;
      if (error.errorCode === 'UNAUTHENTICATED') {
        authenticated = false;
        slots = null;
        selected = null;
        finish();
        setStatus('Sua sessão não está autenticada. Entre novamente com sua conta e senha.', true);
        return;
      }
      finish();
      setStatus(error.errorMessage || 'Não foi possível concluir a ação. Tente novamente.', true);
      if (['UNAUTHENTICATED', 'SLOT_OCCUPIED', 'CHARACTER_NOT_FOUND', 'INVALID_SLOT'].includes(error.errorCode)) {
        slots = null;
        selected = null;
        render();
        setStatus((error.errorMessage || 'Não foi possível concluir a ação.') + ' Carregue os heróis novamente.', true);
      } else if (action === 'create') nameInput.focus();
    },
    onLogin() {
      inWorld = Boolean(account);
      waitingForConnection = false;
      finish();
      close();
      document.getElementById('btn-dock-character')?.focus();
    },
  };
}
