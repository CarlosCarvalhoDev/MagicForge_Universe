import { setupInventoryExpansion } from '../src/ui/InventoryExpansion';
import { getInventoryExpansion } from '@magicforge/shared';
import '../src/ui/progression.css';
import '../src/ui/inventory-view.css';
const source = new DOMParser().parseFromString(await (await fetch('/index.html')).text(),'text/html');
for(const style of source.head.querySelectorAll('style')) document.head.append(document.importNode(style,true));
for(const id of ['btn-expand-inventory','inventory-expansion-status','inventory-expansion-confirm']) {
  document.getElementById('preview-content')!.append(document.importNode(source.getElementById(id)!,true));
}
let context={maxSlots:35,gold:2_000_000,level:1,reborn:0,cash:100,seals:1};
const ui=setupInventoryExpansion({isReady:()=>true,send(slots,payment){
  const next=getInventoryExpansion(slots)!;
  context={...context,maxSlots:next.newMaxSlots,gold:context.gold-(payment==='cash'?0:next.cost),
    cash:context.cash-(payment==='cash'?next.cashCost!:0),seals:context.seals-(payment==='gold_item'?1:0)};
  ui.onResult({success:true,newMaxSlots:context.maxSlots,remainingGold:context.gold,goldSpent:payment==='cash'?0:next.cost,
    cashBalance:context.cash,sealsAvailable:context.seals,message:'Compra simulada confirmada. Nenhum saldo real foi alterado.'});
},apply(){}});
const select=document.getElementById('preview-scenario') as HTMLSelectElement;
function scenario(){
  context=select.value==='gold'?{maxSlots:20,gold:10_000,level:1,reborn:0,cash:0,seals:0}:
    select.value==='seal'?{maxSlots:45,gold:10_000_000,level:1,reborn:0,cash:0,seals:1}:
    {maxSlots:35,gold:2_000_000,level:1,reborn:0,cash:100,seals:1};
  ui.onDisconnected();ui.setContext(context);ui.requestConfirmation();
}
select.addEventListener('change',scenario);scenario();
