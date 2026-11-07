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
  delete(slot: number, name: string, confirmation: string): void;
}

/** The server owns every slot; creating a hero never implies entering the world. */
export function setupAuthSelection(
  transport: AuthTransport,
  options: { storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> } = {}
) {
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
  const deletePanel = document.getElementById('forge-delete-panel') as HTMLElement;
  const deleteCharacter = document.getElementById('forge-delete-character')!;
  const deleteHint = document.getElementById('forge-delete-confirmation-hint')!;
  const deleteInput = document.getElementById('forge-delete-confirmation') as HTMLInputElement;
  const deleteStatus = document.getElementById('forge-delete-status')!;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-slot-index]'));
  const background = Array.from(document.body.children)
    .filter((el): el is HTMLElement => el instanceof HTMLElement && el !== root && el.tagName !== 'SCRIPT')
    .map(element => ({ element, wasInert: element.inert }));

  const storage = options.storage || (typeof window !== 'undefined' ? (window.localStorage || window.sessionStorage) : undefined);
  const SESSION_KEY = 'magicforge_active_session_v1';
  let savedPassword = '';
  let autoResuming = false;
  let autoResumeSlot: number | null = null;

  let account = '';
  let authenticated = false;
  let passwordToSend = '';
  let emailToSend: string | undefined;
  let registerMode = false;
  let authKind: 'login' | 'register' | 'guest' = 'login';
  let slots: CharacterSlotSummary[] | null = null;
  let selected: number | null = null;
  let pending: 'authenticate' | 'list' | 'create' | 'select' | 'delete' | null = null;
  let timeout: number | undefined;
  let waitingForConnection = false;
  let inWorld = false;
  let deletingSlot: number | null = null;
  const deletionPhrase = (name: string) => 'desejoexcluiropersonagem' + name.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, '');

  const show = () => {
    root.hidden = false;
    root.style.removeProperty('display');
    background.forEach(({ element }) => { element.inert = true; });
  };
  const close = () => {
    root.hidden = true;
    root.style.display = 'none';
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
    document.getElementById('forge-auth-title')!.textContent = selecting ? 'Sala dos Forjados.' : 'Entre na Forja Astral.';
    document.getElementById('forge-intro-eyebrow')!.textContent = selecting ? 'ESCOLHA SEU HERÓI' : 'ACESSO À FORJA ANCESTRAL';
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
      card.classList.toggle('is-occupied', Boolean(slot && !slot.isEmpty)); card.dataset.classType = slot && !slot.isEmpty && slot.classType ? slot.classType : '';
      card.querySelector('h3')!.textContent = slot ? slot.isEmpty ? 'Uma nova lenda' : slot.name! : 'Destino por revelar';
      card.querySelector('p')!.innerHTML = !slot ? 'Carregue sua conta para revelar este pedestal.'
        : slot.isEmpty ? 'Este pedestal aguarda seu próximo herói.'
        : `<span class="forge-stat-class">${className(slot.classType)} · Nv. ${number(slot.level)}</span>\n<span class="forge-stat-economy"><span class="forge-stat-cp">CP ${number(slot.combatPower)}</span> · <span class="forge-stat-gold">Ouro ${number(slot.gold)}</span></span>\n<span class="forge-stat-hp">Vida ${number(slot.currentHp)}/${number(slot.maxHp)}</span>`;
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
      const deleteButton = card.querySelector<HTMLButtonElement>('[data-slot-delete]');
      if (deleteButton) {
        deleteButton.hidden = !slot || slot.isEmpty;
        deleteButton.disabled = !authenticated || !slot || slot.isEmpty || Boolean(pending) || !transport.isConnected();
        deleteButton.setAttribute('aria-label', slot && !slot.isEmpty ? 'Apagar ' + slot.name : 'Apagar personagem indisponível');
      }
    }
    deletePanel.hidden = deletingSlot === null;
    if (deletingSlot !== null && slots?.[deletingSlot] && !slots[deletingSlot].isEmpty) {
      const name = slots[deletingSlot].name || 'este herói';
      const phrase = deletionPhrase(name);
      deleteCharacter.textContent = name;
      deleteHint.textContent = phrase;
      deleteInput.disabled = Boolean(pending);
      (document.getElementById('forge-confirm-delete') as HTMLButtonElement).disabled = Boolean(pending) || deleteInput.value.trim().toLocaleLowerCase('pt-BR') !== phrase;
      (document.getElementById('forge-cancel-delete') as HTMLButtonElement).disabled = Boolean(pending);
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
    account = username.toLowerCase();
    authenticated = false;
    authKind = registerMode ? 'register' : 'login';
    passwordToSend = passwordInput.value;
    savedPassword = passwordInput.value;
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
    passwordInput.value = ''; confirmInput.value = ''; passwordToSend = ''; savedPassword = ''; emailToSend = undefined;
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

  function performSignOutToLogin() {
    try { storage?.removeItem(SESSION_KEY); } catch {}
    autoResuming = false;
    autoResumeSlot = null;
    account = '';
    authenticated = false;
    passwordToSend = '';
    savedPassword = '';
    passwordInput.value = '';
    confirmInput.value = ''; emailToSend = undefined; registerMode = false;
    slots = null;
    selected = null;
    deletingSlot = null;
    deleteInput.value = '';
    deleteStatus.textContent = '';
    inWorld = false;
    waitingForConnection = false;
    finish();
    transport.disconnect();
    show();
    setStatus('Entre com sua conta para continuar.');
    accountInput.focus();
  }

  function performReturnToCharacterSelect() {
    autoResuming = false;
    autoResumeSlot = null;
    inWorld = false;
    selected = null;
    deletingSlot = null;
    deleteInput.value = '';
    deleteStatus.textContent = '';
    if (account) {
      try {
        storage?.setItem(SESSION_KEY, JSON.stringify({
          account,
          authKind,
          password: savedPassword,
        }));
      } catch {}
    }
    finish();
    show();
    if (authenticated) {
      if (transport.isConnected()) {
        requestList();
      } else {
        setStatus('Escolha quem continuará sua jornada na Sala dos Forjados.');
      }
    } else if (account) {
      if (transport.isConnected()) {
        authenticate();
      } else {
        waitingForConnection = true;
        begin('authenticate', 'Retornando à Sala dos Forjados…');
        transport.connect();
      }
    } else {
      setStatus('Entre com sua conta para acessar a Sala dos Forjados.');
    }
  }

  document.getElementById('forge-sign-out')!.addEventListener('click', performSignOutToLogin);
  document.getElementById('btn-logout-to-login')?.addEventListener('click', performSignOutToLogin);
  document.getElementById('btn-return-char-select')?.addEventListener('click', performReturnToCharacterSelect);

  const btnFullscreen = document.getElementById('btn-fullscreen-toggle');
  if (btnFullscreen) {
    const syncFullscreenState = () => {
      const isFull = Boolean(document.fullscreenElement);
      btnFullscreen.dataset.fullscreen = isFull ? 'true' : 'false';
      btnFullscreen.setAttribute('aria-pressed', String(isFull));
    };
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });
    document.addEventListener('fullscreenchange', syncFullscreenState);
    syncFullscreenState();
  }

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
    card.querySelector<HTMLButtonElement>('[data-slot-delete]')?.addEventListener('click', event => {
      event.stopPropagation();
      if (!authenticated || pending || !slots || !transport.isConnected()) return;
      const index = Number(card.dataset.slotIndex);
      const slot = slots[index];
      if (!slot || slot.isEmpty || !slot.name) return;
      deletingSlot = index;
      deleteInput.value = '';
      deleteStatus.textContent = 'A exclusão exige a frase completa, sem espaços extras.';
      deleteStatus.dataset.state = 'info';
      render();
      deleteInput.focus();
    });
  }

  deleteInput.addEventListener('input', () => render());
  document.getElementById('forge-cancel-delete')!.addEventListener('click', () => {
    deletingSlot = null;
    deleteInput.value = '';
    deleteStatus.textContent = '';
    render();
  });
  document.getElementById('forge-confirm-delete')!.addEventListener('click', () => {
    if (pending || deletingSlot === null || !slots || !transport.isConnected()) return;
    const slot = slots[deletingSlot];
    if (!slot || slot.isEmpty || !slot.name) return;
    const expected = deletionPhrase(slot.name);
    if (deleteInput.value.trim().toLocaleLowerCase('pt-BR') !== expected) {
      deleteStatus.textContent = 'A frase não confere. Copie exatamente o texto exibido acima.';
      deleteStatus.dataset.state = 'error';
      deleteInput.focus();
      render();
      return;
    }
    begin('delete', 'Apagando ' + slot.name + ' da Forja Astral…');
    transport.delete(deletingSlot, slot.name, deleteInput.value.trim());
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!authenticated || pending || selected === null || !slots?.[selected]?.isEmpty || !transport.isConnected()) return;
    const name = nameInput.value.trim();
    if (name.length < 3 || name.length > 20) {
      nameInput.setCustomValidity('Use um nome de 3 a 20 caracteres.');
      nameInput.reportValidity();
      return;
    }
    const allowedClasses = [CharacterClass.GUERREIRO, CharacterClass.CLERIGO, CharacterClass.BARBARO, CharacterClass.ARQUEIRO];
    if (!allowedClasses.includes(classSelect.value as CharacterClass)) {
      setStatus('Esta classe ainda está bloqueada. Escolha uma classe disponível na Forja.', true);
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
  document.getElementById('btn-auth-switch-dev')?.addEventListener('click', () => {
    if (pending) return;
    try { storage?.removeItem(SESSION_KEY); } catch {}
    autoResuming = false;
    autoResumeSlot = null;
    account = '';
    slots = null;
    selected = null;
    close();
    document.getElementById('inspector-panel')?.classList.remove('collapsed');
    document.getElementById('char-name')?.focus();
  });

  let storedSession: { account: string; authKind?: 'login' | 'guest'; password?: string; slotIndex?: number } | null = null;
  try {
    const raw = storage?.getItem(SESSION_KEY);
    if (raw) storedSession = JSON.parse(raw);
  } catch {}

  
  // Dados de Showcase / Mock de Classes para a Página de Rosto (UTF-8 Garantido)
  const COVER_CLASS_MOCKS: Record<string, {
    title: string;
    roleBadge: string;
    description: string;
    portrait: string;
    stats: { forca: number; const: number; destreza: number };
    traits: string[];
  }> = {
    GUERREIRO: {
      title: 'Guerreiro da Bigorna',
      roleBadge: 'D&D 5E · COMBATE CORPO A CORPO & TANQUE',
      description: 'Mestre absoluto em armas forjadas e armaduras pesadas. Absorve o impacto dos golpes inimigos e desfere contra-ataques devastadores no calor da batalha.',
      portrait: '/assets/portraits/GUERREIRO.jpg',
      stats: { forca: 92, const: 88, destreza: 62 },
      traits: ['Provocação & Defesa', 'Golpe Fulminante', 'Linha de Frente']
    },
    BARBARO: {
      title: 'Bárbaro Totêmico',
      roleBadge: 'D&D 5E · FÚRIA PRIMAL & DANO MASSIVO',
      description: 'Guerreiro selvagem imbuído com o espírito dos ursos ancestrais. Quanto mais ferido em combate, mais avassaladores e velozes se tornam seus golpes.',
      portrait: '/assets/portraits/BARBARO.jpg',
      stats: { forca: 98, const: 94, destreza: 55 },
      traits: ['Fúria Incontrolável', 'Resistência Primal', 'Crítico Brutal']
    },
    ARQUEIRO: {
      title: 'Patrulheiro Astral',
      roleBadge: 'D&D 5E · ATAQUE À DISTÂNCIA & CRÍTICOS',
      description: 'Atirador de elite que canaliza flechas de energia rúnica à longa distância. Especialista em armadilhas de campo e dano contínuo acelerado.',
      portrait: '/assets/portraits/ARQUEIRO.jpg',
      stats: { forca: 58, const: 65, destreza: 96 },
      traits: ['Chuva de Flechas', 'Mira Crítica Letal', 'Passo Evasivo']
    },
    CLERIGO: {
      title: 'Clérigo da Luz',
      roleBadge: 'D&D 5E · MILAGRES DIVINOS & SUPORTE',
      description: 'Emissário dos deuses da forja que regenera instantaneamente os pontos de vida da party e purifica maldições e enfraquecimentos cósmicos.',
      portrait: '/assets/portraits/CLERIGO.jpg',
      stats: { forca: 68, const: 82, destreza: 60 },
      traits: ['Cura Milagrosa', 'Escudo da Fé', 'Prece de Guerra']
    },
    MAGO: {
      title: 'Evocador Elemental',
      roleBadge: 'D&D 5E · DESTRUIÇÃO EM ÁREA & ARCANO',
      description: 'Estudioso dos segredos arcanos capaz de incinerar hordas inteiras com tempestades de gelo, meteoros estelares e manipulação do fluxo temporal.',
      portrait: '/assets/portraits/MAGO.jpg',
      stats: { forca: 42, const: 60, destreza: 72 },
      traits: ['Chuva de Meteoros', 'Congelamento Rúnico', 'Teleporte Arcano']
    },
    MONGE: {
      title: 'Mestre do Ki',
      roleBadge: 'D&D 5E · ARTES MARCIAIS & COMBOS VELOZES',
      description: 'Condensa a energia espiritual nos punhos para desferir sequências ultra-rápidas de golpes capazes de atordoar até os monstros mais colossais.',
      portrait: '/assets/portraits/MONGE.jpg',
      stats: { forca: 78, const: 76, destreza: 92 },
      traits: ['Rajada de Golpes', 'Palma Vibratória', 'Evasão Sobrenatural']
    },
    BRUXO: {
      title: 'Arauto do Pacto',
      roleBadge: 'D&D 5E · ENERGIA SINISTRA & DRENO',
      description: 'Firmou um juramento proibido com entidades do vazio astral. Seus feitiços drenam a vitalidade dos alvos para alimentar seus próprios atributos.',
      portrait: '/assets/portraits/BRUXO.jpg',
      stats: { forca: 50, const: 74, destreza: 78 },
      traits: ['Rajada Mística', 'Dreno de Vitalidade', 'Maldição Ancestral']
    }
  };

  function setupCoverPageInteractions() {
    const coverSection = document.getElementById('forge-cover-hero');
    const btnEnterGate = document.getElementById('btn-enter-gate');
    const btnBackToCover = document.getElementById('btn-back-to-cover');
    const btnFooterBackToCover = document.getElementById('btn-footer-back-to-cover');
    const authMain = root.querySelector('.forge-auth');

    // 1. Botão de alternar para a tela de login
    const showLoginScreen = () => {
      root.classList.add('in-auth-mode');
      root.scrollTop = 0;
      setTimeout(() => {
        accountInput?.focus({ preventScroll: true });
        root.scrollTop = 0;
      }, 200);
    };

    // 2. Botão de voltar para a página de apresentação (capa)
    const showCoverScreen = () => {
      root.classList.remove('in-auth-mode');
      root.scrollTop = 0;
    };

    btnEnterGate?.addEventListener('click', showLoginScreen);
    btnBackToCover?.addEventListener('click', showCoverScreen);
    btnFooterBackToCover?.addEventListener('click', showCoverScreen);
    root.querySelectorAll('.btn-back-cover, .forge-back-cover-btn').forEach(btn => {
      btn.addEventListener('click', showCoverScreen);
    });

    // 3. Efeito Paralaxe sutil ao mover o mouse dentro da capa
    if (coverSection) {
      coverSection.addEventListener('mousemove', (e) => {
        const rect = coverSection.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;

        coverSection.style.setProperty('--parallax-y-back', `${normY * -24}px`);
        coverSection.style.setProperty('--parallax-y-mid', `${normY * -12}px`);
        coverSection.style.setProperty('--parallax-y-front', `${normY * -6}px`);
      });
    }

    // 4. Showcase Interativo de Classes com Mock de Movimento
    const railButtons = root.querySelectorAll<HTMLButtonElement>('.class-rail-btn');
    const spriteActor = document.getElementById('cover-hero-sprite-actor');
    const spriteImg = document.getElementById('cover-hero-sprite-img') as HTMLImageElement | null;
    const classBadge = document.getElementById('cover-class-badge');
    const classTitle = document.getElementById('cover-class-title');
    const classDesc = document.getElementById('cover-class-desc');
    const meterForca = document.getElementById('meter-forca');
    const meterConst = document.getElementById('meter-const');
    const meterDestreza = document.getElementById('meter-destreza');
    const traitsContainer = document.getElementById('cover-class-tags');

    railButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const classId = btn.dataset.classId || 'GUERREIRO';
        const data = COVER_CLASS_MOCKS[classId];
        if (!data) return;

        // Atualiza estado ativo dos botões
        railButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Transição suave no mock de sprite em movimento
        if (spriteActor && spriteImg) {
          spriteActor.dataset.actorClass = classId;
          spriteImg.style.opacity = '0.3';
          spriteImg.style.transform = 'scale(0.92)';

          setTimeout(() => {
            spriteImg.src = data.portrait;
            spriteImg.alt = 'Apresentação do ' + data.title;
            spriteImg.style.opacity = '1';
            spriteImg.style.transform = 'scale(1)';
          }, 150);
        }

        // Atualiza card de informações e atributos
        if (classBadge) classBadge.textContent = data.roleBadge;
        if (classTitle) classTitle.textContent = data.title;
        if (classDesc) classDesc.textContent = data.description;
        if (meterForca) meterForca.style.width = data.stats.forca + '%';
        if (meterConst) meterConst.style.width = data.stats.const + '%';
        if (meterDestreza) meterDestreza.style.width = data.stats.destreza + '%';

        if (traitsContainer) {
          traitsContainer.innerHTML = data.traits.map(t => `<span class="trait-tag">${t}</span>`).join('');
        }
      });
    });
  }

root.dataset.ready = 'true';
  setupCoverPageInteractions();

  if (storedSession && storedSession.account) {
    account = storedSession.account;
    authKind = storedSession.authKind || 'login';
    if (storedSession.password) {
      passwordToSend = storedSession.password;
      savedPassword = storedSession.password;
    }
    if (typeof storedSession.slotIndex === 'number') {
      autoResumeSlot = storedSession.slotIndex;
    }
    autoResuming = true;
    close();
    if (transport.isConnected()) {
      authenticate();
    } else {
      waitingForConnection = true;
      begin('authenticate', 'Reconectando à Forja Astral…');
      transport.connect();
    }
  } else {
    show();
    render();
    setStatus(transport.authenticate ? 'Informe sua conta e senha para entrar.' : 'O acesso por conta e senha ainda não está disponível.');
  }

  return {
    isOpen: () => !root.hidden,
    returnToCharacterSelection: performReturnToCharacterSelect,
    logoutToLogin: performSignOutToLogin,
    onConnected() {
      if (!account) return;
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
      try { storage?.removeItem(SESSION_KEY); } catch {}
      autoResuming = false;
      autoResumeSlot = null;
      authenticated = false;
      passwordToSend = '';
      savedPassword = '';
      passwordInput.value = '';
      confirmInput.value = ''; emailToSend = undefined;
      finish();
      show();
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
      if (!autoResuming) {
        show();
        note.textContent = 'Conta: ' + account + ' · aguardando atualização dos pedestais.';
        setStatus(wasInWorld ? 'Conexão interrompida. Entre novamente para voltar à sua jornada.' : 'Conexão interrompida. Entre novamente com sua conta e senha.', true);
      }
    },
    onCharacterList(payload: S2CCharacterListPayload) {
      if (!authenticated || !account) return;
      if (payload.accountUsername && payload.accountUsername.trim().toLowerCase() !== account) {
        if (payload.accountUsername.trim().toLowerCase() === account.toLowerCase()) {
          account = payload.accountUsername.trim().toLowerCase();
        } else {
          return;
        }
      }
      const rawSlots = Array.isArray(payload.slots) ? payload.slots : [];
      const rawSlotIndexes = rawSlots.map(slot => Number(slot.slotIndex));
      if (rawSlots.length !== 3 || new Set(rawSlotIndexes).size !== 3 || rawSlotIndexes.some(index => index < 0 || index > 2)) {
        slots = null;
        selected = null;
        finish();
        setStatus('A lista de heróis veio incompleta. Carregue a conta novamente.', true);
        return;
      }
      // Normaliza garantindo exatamente 3 pedestais (0, 1, 2)
      const normalizedSlots = [0, 1, 2].map(index => {
        const found = rawSlots.find(s => Number(s.slotIndex) === index);
        if (!found) {
          return { slotIndex: index, isEmpty: true, name: String(), classType: undefined };
        }
        const isEmpty = Boolean(found.isEmpty) || (!found.name && !found.classType);
        return {
          ...found,
          slotIndex: index,
          isEmpty,
          name: found.name || '',
          classType: found.classType,
        };
      });

      const valid = normalizedSlots.length === 3 && normalizedSlots.every(slot =>
        slot.isEmpty || (typeof slot.name === 'string' && slot.name.length > 0 && typeof slot.classType === 'string' && slot.classType.length > 0)
      );
      if (!valid) {
        slots = null;
        selected = null;
        finish();
        setStatus('A lista de heróis veio incompleta. Carregue a conta novamente.', true);
        return;
      }
      const wasCreate = pending === 'create';
      const wasDelete = pending === 'delete';
      const createdSlot = selected;
      slots = normalizedSlots;
      selected = null;
      if (wasDelete) {
        deletingSlot = null;
        deleteInput.value = '';
        deleteStatus.textContent = '';
      }
      nameInput.value = '';
      finish();
      note.textContent = 'Conta: ' + (payload.accountUsername || account) + ' · ' + slots.filter(slot => !slot.isEmpty).length + ' de 3 pedestais ocupados.';
      setStatus(payload.message || 'Escolha um herói para entrar ou um pedestal vazio para criar.');

      // Auto-resume character slot if resuming from reload
      if (autoResuming && autoResumeSlot !== null) {
        const target = slots[autoResumeSlot];
        if (target && !target.isEmpty) {
          selected = autoResumeSlot;
          autoResuming = false;
          autoResumeSlot = null;
          begin('select', 'Retomando a jornada de ' + target.name + '…');
          transport.select(selected);
          return;
        }
      }
      autoResuming = false;
      autoResumeSlot = null;

      if (wasCreate && createdSlot !== null) cards[createdSlot].querySelector('button')!.focus();
    },
    onError(error: S2CCharacterActionErrorPayload) {
      if (!pending || root.hidden) return;
      const action = pending;
      if (error.errorCode === 'UNAUTHENTICATED') {
        try { storage?.removeItem(SESSION_KEY); } catch {}
        autoResuming = false;
        autoResumeSlot = null;
        authenticated = false;
        slots = null;
        selected = null;
        finish();
        show();
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
      else if (action === 'delete') {
        deleteStatus.textContent = error.errorMessage || 'A confirmação não foi aceita.';
        deleteStatus.dataset.state = 'error';
        deleteInput.focus();
        render();
      }
    },
    onLogin() {
      inWorld = Boolean(account);
      waitingForConnection = false;
      if (account && selected !== null) {
        try {
          storage?.setItem(SESSION_KEY, JSON.stringify({
            account,
            authKind,
            password: savedPassword,
            slotIndex: selected
          }));
        } catch {}
      }
      finish();
      close();
      document.getElementById('btn-dock-character')?.focus();
    },
  };
}
