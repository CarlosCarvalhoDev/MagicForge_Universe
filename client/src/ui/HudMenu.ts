export function setupHudMenu(root: HTMLElement | null) {
  const trigger = root?.querySelector<HTMLButtonElement>('[data-hud-menu-trigger]');
  const panel = root?.querySelector<HTMLElement>('[data-hud-menu-panel]');
  if (!root || !trigger || !panel) return;

  const close = (returnFocus = false) => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus({ preventScroll: true });
  };

  trigger.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    panel.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  });
  panel.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('button')) close(true);
  }, { capture: true });
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && event.target instanceof Node && !root.contains(event.target)) close();
  }, { capture: true });
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    close(true);
  }, { capture: true });
}
