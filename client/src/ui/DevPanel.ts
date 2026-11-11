import type { DevCommand, DevState, DevToggle } from '@magicforge/shared';

function enableDragging(dialog: HTMLDialogElement) {
  const handle = dialog.querySelector<HTMLElement>('[data-drag]')!;
  let drag: { id: number; x: number; y: number } | undefined;
  const move = (x: number, y: number) => {
    const maxX = Math.max(0, document.documentElement.clientWidth - dialog.offsetWidth);
    const maxY = Math.max(0, document.documentElement.clientHeight - dialog.offsetHeight);
    dialog.style.inset = `${Math.max(0, Math.min(y, maxY))}px auto auto ${Math.max(0, Math.min(x, maxX))}px`;
  };
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    const { left, top } = dialog.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX - left, y: event.clientY - top };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) move(event.clientX - drag.x, event.clientY - drag.y);
  });
  handle.addEventListener('lostpointercapture', () => { drag = undefined; });
  const fit = () => {
    if (!dialog.open || !dialog.style.inset) return;
    const { left, top } = dialog.getBoundingClientRect();
    move(left, top);
  };
  new ResizeObserver(fit).observe(dialog);
  window.addEventListener('resize', fit);
}

export function setupDevPanel(send: (command: DevCommand) => void, visibleMonsters: () => string[]) {
  const shortcut = document.createElement('button');
  shortcut.type = 'button';
  shortcut.className = 'dev-shortcut';
  shortcut.textContent = 'Dev';
  shortcut.hidden = true;
  shortcut.style.display = 'none';
  shortcut.setAttribute('aria-controls', 'dev-panel');
  shortcut.setAttribute('aria-expanded', 'false');
  document.querySelector('.hud-profile-column')?.append(shortcut);
  const dialog = document.createElement('dialog');
  dialog.id = 'dev-panel';
  dialog.className = 'dev-panel';
  dialog.setAttribute('aria-labelledby', 'dev-panel-title');
  dialog.innerHTML = `
    <header><h2 id="dev-panel-title" data-drag title="Arraste para mover o painel">Dev</h2><button type="button" data-close aria-label="Fechar painel Dev">×</button></header>
    <fieldset aria-label="Controles de teste">
      <label><input type="checkbox" data-key="pauseRespawns"> Pausar surgimento (global)</label>
      <label><input type="checkbox" data-key="disableDrops"> Bloquear drops</label>
      <label><input type="checkbox" data-key="doubleLegendary"> Lendários +100%</label>
      <label><input type="checkbox" data-key="infiniteVitals"> HP e recurso infinitos</label>
      <label><input type="checkbox" data-key="freezeMonsters"> Congelar IA do canal</label>
    </fieldset>
    <form><label>X <input name="x" type="number" step="any" value="0" required></label>
      <label>Z <input name="z" type="number" step="any" value="4" required></label>
      <button type="submit" value="dummy">Criar boneco</button>
      <button type="submit" value="teleport">Teleportar herói</button>
    </form>
    <footer><button type="button" data-kill>Matar mobs na tela</button>
      <button type="button" data-action="boss">Invocar chefe</button>
      <button type="button" data-action="refillVitals">Restaurar HP e recurso</button>
      <button type="button" data-action="resetCooldowns">Zerar recargas</button>
      <button type="button" data-action="clearDrops">Limpar drops</button>
      <button type="button" data-action="clearTargets">Remover alvos de teste</button>
      <button type="button" data-action="reset">Restaurar configuração</button>
    </footer><p role="status"></p>`;
  document.body.append(dialog);
  enableDragging(dialog);
  shortcut.onclick = () => {
    if (dialog.open) { dialog.close(); return; }
    dialog.show();
    shortcut.setAttribute('aria-expanded', 'true');
    send({ action: 'state' });
  };
  dialog.addEventListener('close', () => shortcut.setAttribute('aria-expanded', 'false'));
  dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick = () => dialog.close();
  const toggles = dialog.querySelectorAll<HTMLInputElement>('[data-key]');
  toggles.forEach(input => input.addEventListener('change', () => {
    send({ action: 'toggle', key: input.dataset.key as DevToggle, enabled: input.checked });
  }));
  dialog.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => button.onclick = () => {
    send({ action: button.dataset.action as 'boss' | 'clearTargets' | 'reset' | 'refillVitals' | 'clearDrops' | 'resetCooldowns' });
  });
  dialog.querySelector<HTMLButtonElement>('[data-kill]')!.onclick = () => {
    send({ action: 'killVisible', monsterIds: visibleMonsters().slice(0, 256) });
  };
  dialog.querySelector('form')!.onsubmit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const action = (event.submitter as HTMLButtonElement | null)?.value === 'teleport' ? 'teleport' : 'dummy';
    send({ action, x: Number(data.get('x')), z: Number(data.get('z')) });
  };
  return {
    setAdmin(allowed: boolean) {
      shortcut.hidden = !allowed;
      shortcut.style.display = allowed ? '' : 'none';
      if (!allowed && dialog.open) dialog.close();
    },
    update(state: DevState) {
      toggles.forEach(input => { input.checked = state[input.dataset.key as DevToggle]; });
      dialog.querySelector('[role="status"]')!.textContent = state.message ?? '';
    },
  };
}
