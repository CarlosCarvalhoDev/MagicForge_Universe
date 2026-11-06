import { CharacterClass, ITEMS_DATABASE, getEquipmentSuggestions, type InventoryItemPayload } from '@magicforge/shared';
import { setupEquipmentAdvice } from '../src/ui/EquipmentAdvice';
import { setupInventoryTooltip } from '../src/ui/InventoryTooltip';
import '../src/ui/progression.css';
import '../src/ui/inventory-view.css';

const source = new DOMParser().parseFromString(await (await fetch('/index.html')).text(), 'text/html');
for (const style of source.querySelectorAll('style')) document.head.append(document.importNode(style, true));
const modal = document.importNode(source.getElementById('inventory-modal')!, true) as HTMLElement;
document.body.appendChild(modal); modal.style.display = 'flex';
document.getElementById('inventory-capacity-text')!.textContent = 'MOCHILA: 3 / 20 · EQUIPADOS: 1';
modal.querySelector('.unified-hero-left-pane')?.remove();
modal.querySelector('.modal-header')!.textContent = 'Prévia de teste · proteção e melhorias · dados simulados';
const pane = modal.querySelector<HTMLElement>('.unified-submenus-right-pane'); if (pane) pane.style.width = '100%';
(document.getElementById('btn-expand-inventory') as HTMLButtonElement).disabled = true;
const items: InventoryItemPayload[] = [
  { instanceId:'worn', itemId:'sword_iron_broadsword', slotIndex:-1, quantity:1, isEquipped:true },
  { instanceId:'upgrade', itemId:'sword_runic_bastard', slotIndex:0, quantity:1, isEquipped:false },
  { instanceId:'armor', itemId:'armor_chainmail', slotIndex:1, quantity:1, isEquipped:false, isLocked:true },
  { instanceId:'gem', itemId:'gem_ruby_str', slotIndex:2, quantity:4, isEquipped:false, isLocked:true },
];
// Look up the actual catalog armor ID rather than relying on an asset alias.
items[2].itemId = Object.values(ITEMS_DATABASE).find(def => def.name === 'Cota de Malha de Aço')!.itemId;
const hero = { classType:CharacterClass.GUERREIRO, level:30, attributes:{ forca:50, destreza:30, constituicao:40, inteligencia:10, sabedoria:10, carisma:10 } };
const grid = document.getElementById('inventory-slots-grid')!;
const tooltip = setupInventoryTooltip(grid, () => items);
const advice = setupEquipmentAdvice({ isReady:()=>true, request:()=>advice.onResult({characterId:'preview',suggestions:getEquipmentSuggestions(items,hero)}), inspect:select });
function select(slot: number) {
  const item = items.find(item => item.slotIndex === slot)!, def = ITEMS_DATABASE[item.itemId];
  document.getElementById('inspector-name')!.textContent = def.name;
  document.getElementById('inspector-icon')!.textContent = def.icon;
  document.getElementById('inspector-tag')!.textContent = item.isLocked ? 'PROTEGIDO' : 'Mochila';
  const lock = document.getElementById('btn-inventory-lock') as HTMLButtonElement;
  lock.hidden = false; lock.textContent = item.isLocked ? '🔓 Desproteger' : '🔒 Proteger'; lock.setAttribute('aria-pressed',String(!!item.isLocked));
  lock.onclick = () => { item.isLocked = !item.isLocked; draw(); select(slot); };
  const recycle = document.getElementById('btn-inventory-discard') as HTMLButtonElement;
  recycle.style.display='block'; recycle.disabled=!!item.isLocked; recycle.title='Prévia simulada: nenhuma reciclagem real';
  document.getElementById('inspector-recycle-preview')!.textContent = item.isLocked ? 'Item protegido' : 'Prévia: sem operação real';
}
function draw() {
  grid.replaceChildren();
  for (const item of items.filter(item=>!item.isEquipped)) {
    const tile = document.createElement('div'); tile.className='inventory-slot'; tile.dataset.instanceId=item.instanceId;
    tile.role='button'; tile.tabIndex=0; tile.setAttribute('aria-label',ITEMS_DATABASE[item.itemId].name);
    const icon=document.createElement('span'); icon.className='slot-icon-text'; icon.textContent=ITEMS_DATABASE[item.itemId].icon;
    const name=document.createElement('span'); name.className='inventory-tile-name'; name.textContent=ITEMS_DATABASE[item.itemId].name;
    tile.append(icon,name);
    if(item.isLocked){const lock=document.createElement('span'); lock.className='inventory-lock-badge';lock.textContent='🔒';tile.append(lock);}
    tile.onclick=()=>select(item.slotIndex);grid.append(tile);
  }
  advice.sync(items);tooltip.refresh();
}
draw();select(1);
