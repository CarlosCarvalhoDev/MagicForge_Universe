import type { S2CSkillRotationPayload, SkillDefinition } from '@magicforge/shared';

export function moveRotationSlot(order: number[], from: number, to: number): number[] {
  const result = [...order];
  if (from < 0 || to < 0 || from >= order.length || to >= order.length) return result;
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

export function setupSkillRotation(transport: {
  isReady(): boolean;
  save(order: number[], autoCastEnabled: boolean): void;
  getSkill(slot: number): SkillDefinition | undefined;
  getLevel(): number;
  applyHudOrder(order: number[]): void;
}) {
  const root = document.getElementById('skill-rotation-editor')!;
  const status = document.getElementById('skill-rotation-status')!;
  const save = document.getElementById('btn-save-skill-rotation') as HTMLButtonElement;
  const chooseTab = document.getElementById('grimorio-tab-skills') as HTMLButtonElement;
  const cycleTab = document.getElementById('grimorio-tab-rotation') as HTMLButtonElement;
  const skills = document.getElementById('skillbook-slots-container')!;
  const cycle = document.getElementById('skill-rotation-panel')!;
  const quick = (document.getElementById('btn-toggle-auto-cast') ?? document.getElementById('btn-combat-auto-active')) as HTMLButtonElement;
  const quickLabel = quick.querySelector('.auto-btn-title') ?? quick;
  const combatContainer = document.getElementById('mobile-combat-arc-container');
  const autoView = document.getElementById('combat-auto-view');
  const manualView = document.getElementById('combat-manual-view');
  const autoCast = document.getElementById('chk-auto-cast-enabled') as HTMLInputElement;
  let confirmedAutoCast = true;
  let draftAutoCast = true;
  let confirmed = [1, 2, 3, 4];
  let draft = [...confirmed];
  let loaded = false;
  let pending = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  function tab(rotation: boolean) {
    skills.hidden = rotation;
    cycle.hidden = !rotation;
    chooseTab.setAttribute('aria-selected', String(!rotation));
    cycleTab.setAttribute('aria-selected', String(rotation));
  }
  chooseTab.addEventListener('click', () => tab(false));
  cycleTab.addEventListener('click', () => tab(true));
  function render() {
    autoCast.checked = draftAutoCast;
    autoCast.disabled = quick.disabled = !loaded || !transport.isReady() || pending;
    quickLabel.textContent = confirmedAutoCast ? 'AUTO ON' : 'AUTO OFF';
    quick.title = confirmedAutoCast ? 'Desativar magias automáticas [A]. Movimento e ataque básico continuam automáticos.' : 'Ativar magias automáticas [A]. Movimento e ataque básico continuam automáticos.';
    const basicAttack = document.getElementById('btn-primary-attack');
    if (basicAttack) {
      basicAttack.title = 'Ataque básico automático; clique para priorizar o monstro selecionado';
      const key = basicAttack.querySelector('.skill-square-key');
      if (key) key.textContent = 'AUTO';
    }
    combatContainer?.setAttribute('data-combat-mode', confirmedAutoCast ? 'auto' : 'manual');
    if (autoView) autoView.style.display = 'flex';
    if (manualView) manualView.style.display = 'flex';
    for (const slot of confirmed) {
      document.getElementById('skill-btn-' + slot)?.setAttribute('aria-disabled', String(!loaded || confirmedAutoCast));
    }
    quick.setAttribute('aria-pressed', String(confirmedAutoCast));
    root.replaceChildren();
    draft.forEach((slot, position) => {
      const card = document.createElement('div');
      card.className = 'rotation-slot';
      const skill = transport.getSkill(slot);
      const heading = document.createElement('strong');
      heading.textContent = `${position + 1}º · ${skill?.name ?? `Slot ${slot}`}`;
      const description = document.createElement('span');
      description.textContent = `Categoria ${slot} · ${skill?.tierName ?? ''}${skill && transport.getLevel() < skill.unlockLevel ? ` · Bloqueada até Nv. ${skill.unlockLevel}` : ''}`;
      card.append(heading, description);
      for (const [label, destination] of [['←', position - 1], ['→', position + 1]] as const) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.setAttribute('aria-label', `Mover ${skill?.name ?? `slot ${slot}`} para ${label === '←' ? 'antes' : 'depois'}`);
        button.disabled = !loaded || !transport.isReady() || pending || destination < 0 || destination >= 4;
        button.addEventListener('click', () => { draft = moveRotationSlot(draft, position, destination); render(); });
        card.appendChild(button);
      }
      root.appendChild(card);
    });
    save.disabled = !loaded || !transport.isReady() || pending;
  }
  autoCast.addEventListener('change', () => { draftAutoCast = autoCast.checked; });
  quick.addEventListener('click', () => persist(confirmed, !confirmedAutoCast));
  save.addEventListener('click', () => persist(draft, draftAutoCast));
  function persist(order: number[], enabled: boolean) {
    if (!loaded || !transport.isReady() || pending) return;
    pending = true;
    render();
    status.textContent = 'Salvando ciclo…';
    timeout = setTimeout(() => {
      pending = false;
      draft = [...confirmed];
      draftAutoCast = confirmedAutoCast;
      render();
      status.textContent = 'Sem confirmação. A preferência anterior foi mantida na tela.';
    }, 6000);
    transport.save([...order], enabled);
  }
  function clear() {
    clearTimeout(timeout);
    pending = false;
    loaded = false;
    confirmedAutoCast = draftAutoCast = true;
    confirmed = [1, 2, 3, 4];
    draft = [...confirmed];
    transport.applyHudOrder(confirmed);
    render();
    status.textContent = 'Entre com um herói para configurar o ciclo.';
  }
  tab(false);
  clear();
  return {
    toggleAutoCast: () => persist(confirmed, !confirmedAutoCast),
    canCastManually: () => loaded && !confirmedAutoCast,
    refreshSkills: render,
    onDisconnected: clear,
    onLogin: clear,
    onUpdate(payload: S2CSkillRotationPayload) {
      if (!transport.isReady()) return;
      clearTimeout(timeout);
      pending = false;
      loaded = true;
      confirmedAutoCast = draftAutoCast = payload.autoCastEnabled ?? true;
      confirmed = [...payload.order];
      draft = [...confirmed];
      transport.applyHudOrder(confirmed);
      render();
      status.textContent = payload.message ?? 'Ciclo automático confirmado pelo servidor.';
    },
  };
}
