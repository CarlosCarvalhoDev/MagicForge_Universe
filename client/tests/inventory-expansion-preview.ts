import { setupInventoryExpansion } from '../src/ui/InventoryExpansion';
import { getInventoryExpansion } from '@magicforge/shared';
import '../src/ui/progression.css';
import '../src/ui/inventory-view.css';

// Uses the production DOM and styles, with simulated transport and no account access.
const source = new DOMParser().parseFromString(await (await fetch('/index.html')).text(), 'text/html');
for (const style of source.querySelectorAll('style')) document.head.append(document.importNode(style, true));
const modal = document.importNode(source.getElementById('inventory-modal')!, true) as HTMLElement;
document.body.appendChild(modal); modal.style.display = 'flex';
modal.querySelector('.unified-hero-left-pane')?.remove();
const title = modal.querySelector('.modal-header');
if (title) title.textContent = 'Prévia de teste · nenhuma compra na conta real';
const pane = modal.querySelector<HTMLElement>('.unified-submenus-right-pane');
if (pane) pane.style.width = '100%';
modal.querySelector('#inventory-inspector')?.remove();
const context = { maxSlots: 31, gold: 1_000_000, level: 1, reborn: 0, cash: 0, seals: 0 };
function draw() {
  document.getElementById('inventory-capacity-text')!.textContent = `MOCHILA: 31 / ${context.maxSlots}`;
  const grid = document.getElementById('inventory-slots-grid')!;
  grid.replaceChildren();
  for (let index = 0; index < context.maxSlots; index++) {
    const slot = document.createElement('div'); slot.className = 'inventory-slot';
    slot.textContent = index < 31 ? '💎' : '—'; grid.appendChild(slot);
  }
}
let requests = 0;
const expansion = setupInventoryExpansion({
  isReady: () => true,
  send(expectedMaxSlots) {
    requests++;
    if (expectedMaxSlots !== context.maxSlots) throw new Error('Stale quote');
    const next = getInventoryExpansion(context.maxSlots)!;
    context.maxSlots = next.newMaxSlots; context.gold -= next.cost;
    expansion.onResult({ success: true, newMaxSlots: context.maxSlots, remainingGold: context.gold, goldSpent: next.cost, message: 'Prévia: espaços liberados. Nenhum ouro real foi gasto.' });
    document.body.dataset.result = requests === 1 && context.maxSlots === 35 ? 'pass' : 'fail';
  },
  apply() { draw(); expansion.setContext(context); },
});
draw(); expansion.setContext(context);
// Replicates live farm income: opening the confirmation must survive these updates.
setInterval(() => { context.gold++; expansion.setContext(context); }, 500);
