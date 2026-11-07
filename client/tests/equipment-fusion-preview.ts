import { CharacterClass, FUSION_RECIPES, type InventoryItemPayload } from '@magicforge/shared';
import { setupEquipmentFusion } from '../src/ui/EquipmentFusion';
import '../src/ui/progression.css';
import '../src/ui/inventory-view.css';
import '../src/ui/equipment-fusion.css';

// Real UI, simulated transport: no login, account, SQLite or real items are accessed.
const source=new DOMParser().parseFromString(await (await fetch('/index.html')).text(),'text/html');
for(const style of source.querySelectorAll('style'))document.head.append(document.importNode(style,true));
const modal=document.importNode(source.getElementById('inventory-modal')!,true) as HTMLElement;
document.body.append(modal);modal.style.display='flex';
modal.querySelector('.unified-hero-left-pane')?.remove();
modal.querySelector('.modal-header')!.textContent='Prévia de teste · reforja simulada · nenhuma conta alterada';
const pane=modal.querySelector<HTMLElement>('.unified-submenus-right-pane');if(pane)pane.style.width='100%';
for(const panel of modal.querySelectorAll<HTMLElement>('.submenu-tab-panel'))panel.style.display=panel.id==='tab-fusao'?'flex':'none';
for(const tab of modal.querySelectorAll('.submenu-tab-btn'))tab.classList.toggle('active',tab.id==='tab-btn-fusao');
let items:InventoryItemPayload[]=[
  {itemId:'sword_iron_broadsword',instanceId:'equipped',slotIndex:-1,isEquipped:true,quantity:1},
  ...[0,1,2].map(slot=>({itemId:'sword_iron_broadsword',instanceId:`copy-${slot}`,slotIndex:slot,isEquipped:false,quantity:1})),
  {itemId:'ore_iron_arcane',instanceId:'ore',slotIndex:3,isEquipped:false,quantity:20},
  {itemId:'arcane_dust',instanceId:'dust',slotIndex:4,isEquipped:false,quantity:30},
];
let gold=5000,completed=false;
const ui=setupEquipmentFusion({
  isReady:()=>true,
  send(request){
    if(!completed){
      const recipe=FUSION_RECIPES[request.recipeId];
      items=items.filter(item=>!request.inputInstanceIds.includes(item.instanceId!));
      for(const material of recipe.materials)items.find(item=>item.itemId===material.itemId)!.quantity-=material.quantity;
      items.push({itemId:recipe.outputItemId,instanceId:'preview-output',slotIndex:0,quantity:1,isEquipped:false,isLocked:true});
      gold-=recipe.goldCost;completed=true;
    }
    ui.setContext({items,gold,level:10,classType:CharacterClass.GUERREIRO});
    ui.onResult({requestId:request.requestId,success:true,outputInstanceId:'preview-output',message:'Prévia: resultado protegido. Nenhuma conta real foi alterada.'});
    document.body.dataset.result='pass';
  },
  inspect(){document.getElementById('fusion-status')!.textContent='Prévia: o resultado está protegido na mochila simulada.';},
  openFarm(){document.getElementById('fusion-status')!.textContent='No jogo, este botão abre as configurações reais do Farm.';},
});
ui.setContext({items,gold,level:10,classType:CharacterClass.GUERREIRO});
setInterval(()=>{gold++;ui.setContext({items,gold,level:10,classType:CharacterClass.GUERREIRO});},500);
