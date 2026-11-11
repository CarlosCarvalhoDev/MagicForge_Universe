import { ITEMS_DATABASE, RARITY_COLORS, type InventoryItemPayload } from '@magicforge/shared';
import { createItemIcon, renderItemIcon, ITEM_ICON_PATHS } from '../src/ui/ItemIcon';
import { setupInventoryTooltip } from '../src/ui/InventoryTooltip';
import '../src/ui/progression.css';
import '../src/ui/inventory-view.css';

// No network connection to the game server and no real character writes.
const source = new DOMParser().parseFromString(await (await fetch('/index.html')).text(), 'text/html');
for (const style of source.querySelectorAll('style')) document.head.append(document.importNode(style, true));
const modal = document.importNode(source.getElementById('inventory-modal')!, true) as HTMLElement;
document.body.appendChild(modal); modal.style.display = 'flex';
modal.querySelector('.unified-hero-left-pane')?.remove();
modal.querySelector('.modal-header')!.textContent = 'Prévia dos ícones · itens simulados';
const pane = modal.querySelector<HTMLElement>('.unified-submenus-right-pane'); if (pane) pane.style.width = '100%';
document.getElementById('inventory-capacity-text')!.textContent = 'MOCHILA: 20 / 20 · PRÉVIA SEM COMPRAS';
(document.getElementById('btn-expand-inventory') as HTMLButtonElement).disabled = true;
const worn: InventoryItemPayload = { itemId: 'sword_iron_broadsword', slotIndex: -1, instanceId: 'worn', isEquipped: true, quantity: 1 };
const items: InventoryItemPayload[] = [worn, ...Object.keys(ITEM_ICON_PATHS).map((itemId, slotIndex) => ({ itemId, slotIndex, instanceId: `preview-${slotIndex}`, isEquipped: false, quantity: 1 }))];
const grid = document.getElementById('inventory-slots-grid')!; grid.replaceChildren();
setupInventoryTooltip(grid, () => items);
for (const item of items.filter(item => !item.isEquipped)) {
  const def = ITEMS_DATABASE[item.itemId];
  const tile = document.createElement('div'); tile.className = 'inventory-slot'; tile.dataset.instanceId = item.instanceId;
  tile.role = 'button'; tile.tabIndex = 0; tile.setAttribute('aria-label', def.name); tile.style.setProperty('--item-color', RARITY_COLORS[def.rarity].border);
  const icon = document.createElement('span'); icon.className = 'slot-icon-text'; icon.append(createItemIcon(item.itemId));
  const name = document.createElement('span'); name.className = 'inventory-tile-name'; name.textContent = def.name;
  tile.append(icon, name); grid.appendChild(tile);
  tile.onclick = () => { renderItemIcon(document.getElementById('inspector-icon')!, item.itemId); document.getElementById('inspector-name')!.textContent = def.name; };
}
renderItemIcon(document.getElementById('inspector-icon')!, 'sword_runic_tempered');
document.getElementById('inspector-name')!.textContent = ITEMS_DATABASE.sword_runic_tempered.name;
for (const button of modal.querySelectorAll<HTMLButtonElement>('.inspector-actions button')) button.disabled = true;
