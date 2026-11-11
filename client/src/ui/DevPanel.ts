import type { DevCommand, DevState, DevToggle } from '@magicforge/shared';

export function setupDevPanel(send: (command: DevCommand) => void, visibleMonsters: () => string[]) {
  const shortcut = document.createElement('button');
  shortcut.type = 'button';
  shortcut.className = 'dev-shortcut';
  shortcut.textContent = 'Dev';
  shortcut.hidden = true;
  shortcut.style.display = 'none';
  shortcut.setAttribute('aria-controls', 'dev-panel');
  shortcut.setAttribute('aria-expanded', 'false');
  document.getElementById('hud-header')?.append(shortcut);
  const party = document.getElementById('party-hud-card');
  if (party) {
    const align = () => shortcut.style.setProperty('--dev-party-bottom', `${party.getBoundingClientRect().bottom}px`);
    new ResizeObserver(align).observe(party);
    window.addEventListener('resize', align);
    align();
  }
  const dialog = document.createElement('dialog');
  dialog.id = 'dev-panel';
  dialog.className = 'dev-panel';
  dialog.setAttribute('aria-labelledby', 'dev-panel-title');
  dialog.innerHTML = `
    <header><h2 id="dev-panel-title">Dev</h2><button type="button" data-close aria-label="Fechar painel Dev">×</button></header>
    <fieldset aria-label="Controles de teste">
      <label><input type="checkbox" data-key="pauseRespawns"> Pausar respawn</label>
      <label><input type="checkbox" data-key="disableDrops"> Bloquear drops</label>
      <label><input type="checkbox" data-key="doubleLegendary"> Lendários +100%</label>
      <label><input type="checkbox" data-key="infiniteVitals"> HP e recurso infinitos</label>
    </fieldset>
    <form><label>X <input name="x" type="number" step="any" value="0" required></label>
      <label>Z <input name="z" type="number" step="any" value="4" required></label>
      <button>Criar boneco</button>
    </form>
    <footer><button type="button" data-kill>Matar mobs na tela</button>
      <button type="button" data-action="boss">Invocar chefe</button>
      <button type="button" data-action="refillVitals">Restaurar HP e recurso</button>
      <button type="button" data-action="clearDrops">Limpar drops</button>
      <button type="button" data-action="clearTargets">Remover alvos de teste</button>
      <button type="button" data-action="reset">Restaurar configuração</button>
    </footer><p role="status"></p>`;
  document.body.append(dialog);
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
    send({ action: button.dataset.action as 'boss' | 'clearTargets' | 'reset' | 'refillVitals' | 'clearDrops' });
  });
  dialog.querySelector<HTMLButtonElement>('[data-kill]')!.onclick = () => {
    send({ action: 'killVisible', monsterIds: visibleMonsters().slice(0, 256) });
  };
  dialog.querySelector('form')!.onsubmit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    send({ action: 'dummy', x: Number(data.get('x')), z: Number(data.get('z')) });
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
