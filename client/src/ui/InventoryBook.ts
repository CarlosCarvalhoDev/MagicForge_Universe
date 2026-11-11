export type InventoryPage = 'mochila' | 'fusao' | 'refino' | 'pedras' | 'cartas';

export function setupInventoryBook(modal: HTMLElement | null, onPage: (page: InventoryPage) => void) {
  const tabs = Array.from(modal?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);

  function show(page: InventoryPage) {
    for (const tab of tabs) {
      const active = tab.dataset.tab === `tab-${page}`;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = modal?.querySelector<HTMLElement>(`#${tab.dataset.tab}`);
      if (panel) panel.style.display = active ? 'flex' : 'none';
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const page = tab.dataset.tab?.slice('tab-'.length) as InventoryPage;
      onPage(page);
    });
    tab.addEventListener('keydown', event => {
      const last = tabs.length - 1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? last
        : event.key === 'ArrowDown' ? (index + 1) % tabs.length
        : event.key === 'ArrowUp' ? (index + last) % tabs.length : null;
      if (next === null) return;
      event.preventDefault();
      event.stopPropagation();
      tabs[next].focus();
      tabs[next].click();
    });
  });

  return { show };
}
