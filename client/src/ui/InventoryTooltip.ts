import { ITEMS_DATABASE, RARITY_COLORS, type InventoryItemPayload, type ItemAttributesBonus } from '@magicforge/shared';
import { compareEquipment, itemBonuses } from './InventoryView';
import { createItemIcon } from './ItemIcon';

const labels: Record<keyof ItemAttributesBonus, string> = { forca: 'Força', destreza: 'Destreza', constituicao: 'Constituição', inteligencia: 'Inteligência', sabedoria: 'Sabedoria', carisma: 'Carisma', maxHp: 'Vida do item', maxResource: 'Recurso do item' };

/** A swipe must never become a comparison or a subsequent item action. */
export class InventoryHold {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private origin: { x: number; y: number } | undefined;
  private consumed = false;
  start(x: number, y: number, show: () => void) {
    this.cancel(); this.consumed = false; this.origin = { x, y };
    this.timer = setTimeout(() => { this.timer = undefined; this.consumed = true; show(); }, 400);
  }
  move(x: number, y: number) {
    if (this.origin && Math.hypot(x - this.origin.x, y - this.origin.y) > 10) { this.consumed = true; this.cancel(); return true; }
    return false;
  }
  cancel() { clearTimeout(this.timer); this.timer = undefined; this.origin = undefined; }
  consumeClick() { const consumed = this.consumed; this.consumed = false; return consumed; }
}

export function setupInventoryTooltip(grid: HTMLElement, getItems: () => readonly InventoryItemPayload[]) {
  const popup = document.createElement('div');
  popup.id = 'inventory-item-tooltip'; popup.role = 'tooltip'; popup.hidden = true;
  document.body.appendChild(popup);
  const hold = new InventoryHold();
  let active: string | undefined;
  let described: HTMLElement | undefined;
  const tile = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>('[data-instance-id]') : null;
  const hide = () => { popup.hidden = true; active = undefined; described?.removeAttribute('aria-describedby'); described = undefined; };
  const text = (tag: string, value: string, parent: HTMLElement) => { const el = document.createElement(tag); el.textContent = value; parent.appendChild(el); return el; };
  function refresh() {
    if (!active) return;
    const anchor = [...grid.querySelectorAll<HTMLElement>('[data-instance-id]')].find(el => el.dataset.instanceId === active);
    const candidate = getItems().find(item => (item.instanceId ?? `slot:${item.slotIndex}`) === active);
    if (!anchor || !candidate) { hide(); return; }
    const def = ITEMS_DATABASE[candidate.itemId];
    if (!def) { hide(); return; }
    described?.removeAttribute('aria-describedby'); described = anchor; anchor.setAttribute('aria-describedby', popup.id);
    popup.replaceChildren();
    const comparison = compareEquipment(candidate, getItems());
    const next = itemBonuses(candidate), current = comparison?.equipped ? itemBonuses(comparison.equipped) : {};
    const keys = Object.keys(comparison?.delta ?? next) as Array<keyof ItemAttributesBonus>;
    const cards = document.createElement('div'); cards.className = comparison ? 'item-tooltip-cards' : 'item-tooltip-cards single'; popup.appendChild(cards);
    function card(item: InventoryItemPayload | undefined, caption: string, isCandidate: boolean) {
      const section = document.createElement('section'); cards.appendChild(section);
      text('h4', caption, section);
      const itemDef = item && ITEMS_DATABASE[item.itemId];
      if (item && itemDef) {
        const name = text('strong', `${item.isLocked ? '🔒 ' : ''}${itemDef.name}${item.refineLevel ? ` +${item.refineLevel}` : ''}`, section);
        name.prepend(createItemIcon(item.itemId));
        name.className = 'item-tooltip-name'; name.style.color = RARITY_COLORS[itemDef.rarity]?.text ?? '#fef08a';
        text('small', `${itemDef.rarity} · ${itemDef.equipmentSlot ?? itemDef.type}`, section);
        text('small', `Nível ${itemDef.minLevel ?? 1} · ${itemDef.allowedClasses?.join(', ') || 'Todas as classes'}`, section);
      } else {
        text('strong', 'Slot vazio', section).className = 'item-tooltip-name';
        text('small', 'Sem equipamento', section); text('small', '—', section);
      }
      for (const key of keys) {
        const value = (isCandidate ? next : current)[key] ?? 0;
        const delta = comparison?.delta[key] ?? 0;
        const row = text('p', `${labels[key]}: ${value}`, section);
        if (isCandidate && comparison) {
          row.dataset.delta = delta > 0 ? 'gain' : delta < 0 ? 'loss' : 'same';
          text('b', delta === 0 ? ' (=)' : ` (${delta > 0 ? '+' : ''}${delta})`, row);
        }
      }
    }
    if (comparison) card(comparison.equipped, 'Equipado', false);
    card(candidate, comparison ? 'Na mochila' : 'Item na mochila', true);
    text('p', comparison ? 'Diferença dos bônus com refino e gemas.' : def.description, popup).className = 'item-tooltip-note';
    popup.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const width = popup.offsetWidth, height = popup.offsetHeight;
    const left = Math.max(8, Math.min(innerWidth - width - 8, rect.left + rect.width / 2 - width / 2));
    const top = rect.top - height - 10 >= 8 ? rect.top - height - 10 : rect.bottom + height + 10 < innerHeight - 8 ? rect.bottom + 10 : Math.max(8, (innerHeight - height) / 2);
    popup.style.left = `${left}px`; popup.style.top = `${top}px`;
  }
  function show(anchor: HTMLElement) { active = anchor.dataset.instanceId; refresh(); }
  grid.addEventListener('pointerover', event => { const anchor = tile(event.target); if (event.pointerType === 'mouse' && anchor) show(anchor); });
  grid.addEventListener('pointerout', event => { if (event.pointerType === 'mouse' && tile(event.target) !== tile(event.relatedTarget)) hide(); });
  grid.addEventListener('focusin', event => { const anchor = tile(event.target); if (anchor?.matches(':focus-visible')) show(anchor); });
  grid.addEventListener('focusout', hide);
  grid.addEventListener('pointerdown', event => {
    const anchor = tile(event.target);
    if (event.pointerType !== 'mouse' && anchor) hold.start(event.clientX, event.clientY, () => show(anchor));
  });
  grid.addEventListener('pointermove', event => { if (event.pointerType !== 'mouse' && hold.move(event.clientX, event.clientY)) hide(); });
  document.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') { hold.cancel(); hide(); } });
  document.addEventListener('pointercancel', () => { hold.cancel(); hide(); });
  grid.addEventListener('click', event => { if (hold.consumeClick()) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  grid.addEventListener('contextmenu', event => { if (tile(event.target)) event.preventDefault(); });
  document.addEventListener('scroll', () => {
    hold.cancel();
    if (described === document.activeElement && described?.matches(':focus-visible')) refresh();
    else hide();
  }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  window.addEventListener('resize', hide);
  return { refresh, hide: () => { hold.cancel(); hide(); } };
}
