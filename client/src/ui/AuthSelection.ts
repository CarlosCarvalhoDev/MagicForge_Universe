import { CLASS_DEFINITIONS, CREATABLE_CHARACTER_CLASSES, CharacterClass, type CharacterSlotSummary, type S2CCharacterListPayload, type S2CCharacterActionErrorPayload } from '@magicforge/shared';
import { renderHeroPreview } from './HeroPreview';
import { renderClassArtwork } from './WarriorStage';
import { renderHeroStats } from './HeroStats';
import { renderClassSkillShowcase } from './ClassSkillShowcase';

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
  const cover = root.querySelector<HTMLElement>('#forge-cover-hero');
  const authScreen = root.querySelector<HTMLElement>('.forge-auth');
  const authTitle = document.getElementById('forge-auth-title')!;
  const enterGate = root.querySelector<HTMLButtonElement>('#btn-enter-gate');
  const backToCover = root.querySelector<HTMLButtonElement>('#btn-back-to-cover');
  const steps = root.querySelectorAll<HTMLElement>('[data-forge-step]');
  let presenting = Boolean(cover);
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
  const inspection = root.querySelector<HTMLElement>('.forge-inspection')!;
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
  const lastHeroKey = () => 'magicforge_last_hero_v1:' + account;
  const refreshSlots = document.getElementById('forge-refresh-slots') as HTMLButtonElement;
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
  classSelect.addEventListener('change', render);

  function render() {
    const selecting = authenticated;
    const screen = selecting ? 'characters' : presenting ? 'cover' : 'login';
    const previousScreen = root.dataset.screen;
    root.dataset.screen = screen;
    if (cover) cover.hidden = screen !== 'cover';
    if (authScreen) authScreen.hidden = screen === 'cover';
    if (backToCover) backToCover.hidden = screen !== 'login';
    for (const step of steps) {
      if (step.dataset.forgeStep === screen) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    }
    root.querySelector<HTMLElement>('.forge-roster')!.hidden = !selecting;
    accountForm.hidden = selecting;
    document.getElementById('forge-social-login')!.hidden = selecting;
    document.getElementById('forge-account-session')!.hidden = !selecting;
    document.getElementById('forge-session-name')!.textContent = selecting ? 'Conta: ' + account : '';
    authTitle.textContent = selecting ? 'Sala dos Forjados' : 'Entre na Forja Astral';
    document.getElementById('forge-intro-eyebrow')!.textContent = selecting ? 'Escolha seu herói' : 'Acesso à Forja';
    document.getElementById('forge-intro-copy')!.textContent = selecting ? 'Escolha um herói para continuar ou ocupe um pedestal vazio.' : 'Acesse sua conta para criar um herói ou retomar sua aventura.';
    const creating = selecting && selected !== null && Boolean(slots?.[selected]?.isEmpty);
    const inspected = selected === null ? slots?.find(slot => !slot.isEmpty) : slots?.[selected];
    const previewClass = creating ? classSelect.value as CharacterClass : inspected?.classType;
    const previewHero = selecting && previewClass && CLASS_DEFINITIONS[previewClass]
      ? { classType: previewClass, character: creating ? undefined : inspected }
      : undefined;
    inspection.hidden = !selecting;
    const previewKey = JSON.stringify(previewHero ?? null);
    if (selecting && inspection.dataset.preview !== previewKey) {
      inspection.dataset.preview = previewKey;
      renderHeroPreview(inspection, previewHero);
    }
    root.querySelector<HTMLElement>('.forge-entry')!.hidden = selecting && !creating && deletingSlot === null;
    document.getElementById('forge-entry-title')!.textContent = selecting
      ? deletingSlot === null ? 'Forje um novo herói' : 'Excluir personagem'
      : registerMode ? 'Crie sua conta' : 'Acesse sua conta';
    const entryCopy = document.getElementById('forge-entry-copy')!;
    entryCopy.hidden = deletingSlot !== null;
    entryCopy.textContent = selecting ? 'Escolha o nome e a classe para o pedestal selecionado.' : 'Use o nome e a senha da sua conta.';
    accountForm.setAttribute('aria-busy', String(pending === 'authenticate'));
    form.setAttribute('aria-busy', String(pending === 'create'));
    for (const control of root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button')) {
      control.disabled = Boolean(pending);
    }
    refreshSlots.hidden = !selecting || Boolean(slots || pending);
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
      const highlighted = selected === index || deletingSlot === index || (selected === null && Boolean(inspected && slot === inspected));
      card.classList.toggle('is-selected', highlighted);
      card.classList.toggle('is-occupied', Boolean(slot && !slot.isEmpty)); card.dataset.classType = slot && !slot.isEmpty && slot.classType ? slot.classType : '';
      card.querySelector('h3')!.textContent = slot ? slot.isEmpty ? 'Uma nova lenda' : slot.name! : 'Destino por revelar';
      card.querySelector('p')!.innerHTML = !slot ? 'Carregue sua conta para revelar este pedestal.'
        : slot.isEmpty ? 'Este pedestal aguarda seu próximo herói.'
        : `<span class="forge-stat-class">${className(slot.classType)} · Nv. ${number(slot.level)}</span>
          <span class="forge-stat-economy"><span class="forge-stat-cp">CP ${number(slot.combatPower)}</span><span>Ouro ${number(slot.gold)}</span><span title="Saldo de diamantes indisponível">Diamantes —</span></span>
          <span class="forge-stat-hp">Vida ${number(slot.currentHp)}/${number(slot.maxHp)}</span>`;
      const pedestal = card.querySelector('.forge-pedestal')!;
      (pedestal as HTMLElement).tabIndex = slot && !slot.isEmpty ? 0 : -1;
      if (slot && !slot.isEmpty) {
        pedestal.setAttribute('role', 'button');
        pedestal.setAttribute('aria-label', 'Visualizar ' + slot.name);
        pedestal.setAttribute('aria-pressed', String(highlighted));
      } else {
        pedestal.removeAttribute('role');
        pedestal.removeAttribute('aria-label');
        pedestal.removeAttribute('aria-pressed');
      }
      const image = pedestal.querySelector('img') as HTMLImageElement;
      image.src = '/assets/ui/login/pedestal_runico_' + (slot && !slot.isEmpty ? 'ativo' : 'vazio') + '.png';
      let hero = pedestal.querySelector<HTMLElement>('.forge-slot-portrait');
      if (slot && !slot.isEmpty && slot.classType) {
        if (!hero) { hero = document.createElement('div'); hero.className = 'forge-slot-portrait'; pedestal.append(hero); }
        renderClassArtwork(hero, slot.classType, 'portrait');
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
    if (previousScreen && screen !== previousScreen && !root.hidden) {
      root.scrollTop = 0;
      const heading = screen === 'cover' ? document.getElementById('forge-cover-title') : authTitle;
      heading?.focus({ preventScroll: true });
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
  refreshSlots.addEventListener('click', () => {
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
    const pedestal = card.querySelector<HTMLElement>('.forge-pedestal')!;
    const inspect = () => {
      const index = Number(card.dataset.slotIndex);
      const slot = slots?.[index];
      if (!authenticated || pending || deletingSlot !== null || !slot || slot.isEmpty) return;
      selected = index;
      render();
    };
    card.addEventListener('click', event => {
      if (!(event.target instanceof Element) || event.target.closest('button')) return;
      inspect();
    });
    pedestal.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        inspect();
      }
    });
    card.querySelector('button')!.addEventListener('click', () => {
      if (!authenticated || pending || !slots || !transport.isConnected()) return;
      deletingSlot = null;
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
      selected = null;
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
    const index = deletingSlot;
    deletingSlot = null;
    deleteInput.value = '';
    deleteStatus.textContent = '';
    render();
    if (index !== null) cards[index]?.querySelector<HTMLButtonElement>('[data-slot-delete]')?.focus();
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
    if (!CREATABLE_CHARACTER_CLASSES.includes(classSelect.value as CharacterClass)) {
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

  const classDescriptions: Record<CharacterClass, { role: string; description: string }> = {
    GUERREIRO: { role: 'Defesa', description: 'Usa armadura pesada e contra-ataques para sustentar a linha de frente.' },
    BARBARO: { role: 'Fúria', description: 'Converte a fúria em golpes pesados e pressiona os inimigos de perto.' },
    ARQUEIRO: { role: 'Precisão', description: 'Mantém distância e usa a destreza para acertar disparos precisos.' },
    CLERIGO: { role: 'Cura', description: 'Invoca proteção e cura para prolongar o combate.' },
    MAGO: { role: 'Magia elemental', description: 'Combina feitiços de fogo e gelo para atingir grupos e controlar o campo.' },
    MONGE: { role: 'Artes marciais', description: 'Canaliza o ki em sequências rápidas de golpes corpo a corpo.' },
    BRUXO: { role: 'Maldições', description: 'Usa o poder de um pacto para amaldiçoar e drenar a vitalidade dos inimigos.' },
  };

  const classButtons = root.querySelectorAll<HTMLButtonElement>('[data-class-id]');
  const classArt = root.querySelector<HTMLElement>('#cover-class-art');
  if (classArt) renderClassArtwork(classArt, CharacterClass.GUERREIRO);
  const warriorThumbnail = root.querySelector<HTMLElement>('.class-rail-art');
  if (warriorThumbnail) renderClassArtwork(warriorThumbnail, CharacterClass.GUERREIRO, 'portrait');
  const classTitle = root.querySelector('#cover-class-title');
  const classRole = root.querySelector('#cover-class-badge');
  const classDescription = root.querySelector('#cover-class-desc');
  const classAttributes = root.querySelector<HTMLElement>('#cover-class-attributes');
  const classSkills = root.querySelector<HTMLElement>('#cover-class-skills');
  if (classAttributes) renderHeroStats(classAttributes, CLASS_DEFINITIONS.GUERREIRO.baseStats);
  if (classArt && classSkills) renderClassSkillShowcase(classSkills, classArt, CharacterClass.GUERREIRO);

  for (const button of classButtons) {
    button.addEventListener('click', () => {
      const classId = button.dataset.classId as CharacterClass;
      const definition = CLASS_DEFINITIONS[classId];
      const details = classDescriptions[classId];
      if (!definition || !details || !classArt || !classTitle || !classRole || !classDescription) return;

      for (const option of classButtons) {
        option.setAttribute('aria-pressed', String(option === button));
      }
      renderClassArtwork(classArt, classId);
      classTitle.textContent = definition.displayName;
      classRole.textContent = (definition.isRanged ? 'À distância' : 'Corpo a corpo') + ' · ' + details.role;
      classDescription.textContent = details.description;
      if (classAttributes) renderHeroStats(classAttributes, definition.baseStats);
      if (classSkills) renderClassSkillShowcase(classSkills, classArt, classId);
    });
  }

  enterGate?.addEventListener('click', () => {
    presenting = false;
    render();
  });
  backToCover?.addEventListener('click', () => {
    presenting = true;
    render();
  });

  root.dataset.ready = 'true';

  if (storedSession && storedSession.account) {
    presenting = false;
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
      const occupied = normalizedSlots.filter(slot => !slot.isEmpty);
      let remembered: { id?: string; at?: number } | null = null;
      try { remembered = JSON.parse(storage?.getItem(lastHeroKey()) ?? 'null'); } catch { /* Storage is optional. */ }
      const recent = occupied.reduce<(typeof occupied)[number] | undefined>((best, slot) =>
        !best || (slot.lastPlayedAt ?? 0) > (best.lastPlayedAt ?? 0) ? slot : best, undefined);
      const local = occupied.find(slot => slot.id && slot.id === remembered?.id);
      selected = local && (remembered?.at ?? 0) >= (recent?.lastPlayedAt ?? 0)
        ? local.slotIndex : recent?.slotIndex ?? null;
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
          const id = slots?.[selected]?.id;
          if (id) storage?.setItem(lastHeroKey(), JSON.stringify({ id, at: Date.now() }));
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
