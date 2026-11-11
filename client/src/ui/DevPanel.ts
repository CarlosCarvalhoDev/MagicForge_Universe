import type { DevCommand, DevState, DevToggle } from '@magicforge/shared';

export function setupDevPanel(send: (command: DevCommand) => void) {
  const shortcut = document.createElement('button');
  shortcut.type = 'button';
  shortcut.className = 'dock-btn';
  shortcut.textContent = 'Dev';
  shortcut.hidden = true;
  shortcut.style.display = 'none';
  document.getElementById('right-vertical-dock')?.append(shortcut);
  const dialog = document.createElement('dialog');
  dialog.className = 'dev-panel';
  dialog.setAttribute('aria-labelledby', 'dev-panel-title');
  dialog.innerHTML = `
    <header><h2 id="dev-panel-title">Ferramentas de desenvolvimento</h2><button type="button" data-close>Fechar</button></header>
    <p>Respawn e drops valem para o canal atual. HP e recurso valem para o seu herói.</p>
    <fieldset><legend>Controles de teste</legend>
      <label><input type="checkbox" data-key="pauseRespawns"> Pausar reaparecimento de mobs</label>
      <label><input type="checkbox" data-key="disableDrops"> Desligar novos drops</label>
      <label><input type="checkbox" data-key="doubleLegendary"> Dobrar chance de drops lendários (+100%)</label>
      <label><input type="checkbox" data-key="infiniteVitals"> HP e recurso infinitos</label>
    </fieldset>
    <form><label>X <input name="x" type="number" step="any" value="0" required></label>
      <label>Z <input name="z" type="number" step="any" value="4" required></label>
      <button>Criar boneco de palha</button>
    </form>
    <footer><button type="button" data-action="boss">Invocar chefe da área</button>
      <button type="button" data-action="clearTargets">Remover alvos de teste</button>
      <button type="button" data-action="reset">Restaurar configuração</button>
    </footer><p role="status"></p>`;
  document.body.append(dialog);
  shortcut.onclick = () => { dialog.showModal(); send({ action: 'state' }); };
  dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick = () => dialog.close();
  const toggles = dialog.querySelectorAll<HTMLInputElement>('[data-key]');
  toggles.forEach(input => input.addEventListener('change', () => {
    send({ action: 'toggle', key: input.dataset.key as DevToggle, enabled: input.checked });
  }));
  dialog.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => button.onclick = () => {
    send({ action: button.dataset.action as 'boss' | 'clearTargets' | 'reset' });
  });
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
