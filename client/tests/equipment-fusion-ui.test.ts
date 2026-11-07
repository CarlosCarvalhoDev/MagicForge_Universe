import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, type FusionRequest, type InventoryItemPayload } from '@magicforge/shared';
import { setupEquipmentFusion } from '../src/ui/EquipmentFusion';

test('Prévia congela identidades, exige confirmação e repete o mesmo pedido após timeout', t => {
  t.mock.timers.enable({ apis:['setTimeout'] });
  class Element {
    textContent=''; value=''; hidden=false; disabled=false; dataset:Record<string,string>={}; children:Element[]=[];
    listeners:Record<string,()=>void>={}; constructor(public id=''){}
    addEventListener(name:string,callback:()=>void){this.listeners[name]=callback;}
    click(){if(!this.disabled)this.listeners.click?.();}
    append(...items:Element[]){this.children.push(...items);}
    appendChild(item:Element){this.children.push(item);if(this.id==='fusion-recipe'&&!this.value)this.value=item.value;return item;}
    replaceChildren(){this.children=[];if(this.id==='fusion-recipe')this.value='';}
  }
  const nodes=new Map<string,Element>();const get=(id:string)=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)!;};
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  globalThis.document={getElementById:get,createElement:()=>new Element()} as unknown as Document;
  globalThis.window={setTimeout,clearTimeout} as unknown as Window & typeof globalThis;
  let ready=true;const requests:FusionRequest[]=[],inspected:string[]=[];
  const ui=setupEquipmentFusion({isReady:()=>ready,send:request=>requests.push(request),inspect:id=>inspected.push(id),openFarm(){}});
  t.after(()=>{ready=false;ui.onDisconnected();globalThis.document=oldDocument;globalThis.window=oldWindow;});
  const copies:InventoryItemPayload[]=[1,2,3].map(slot=>({itemId:'sword_iron_broadsword',slotIndex:slot,instanceId:`copy-${slot}`,quantity:1,isEquipped:false}));
  const materials:InventoryItemPayload[]=[{itemId:'ore_iron_arcane',slotIndex:4,instanceId:'ore',quantity:20,isEquipped:false},{itemId:'arcane_dust',slotIndex:5,instanceId:'dust',quantity:20,isEquipped:false}];
  let context={items:[...copies,...materials],gold:10000,level:10,classType:CharacterClass.GUERREIRO};
  ui.setContext(context);get('fusion-prepare').click();assert.equal(requests.length,0);
  assert.equal(get('fusion-confirmation').hidden,false);
  context={...context,gold:10001,items:[{...copies[0],slotIndex:0,instanceId:'new-copy'},...context.items]};
  ui.setContext(context);get('fusion-confirm').click();get('fusion-confirm').click();
  assert.equal(requests.length,1);assert.deepEqual(requests[0].inputInstanceIds,['copy-1','copy-2','copy-3']);
  t.mock.timers.tick(10000);
  ui.setContext({...context,items:materials,gold:8201});
  assert.match(get('fusion-confirm').textContent,/Verificar resultado/);
  get('fusion-confirm').click();assert.deepEqual(requests[1],requests[0]);
  ui.onResult({requestId:requests[0].requestId,success:true,message:'Concluída',outputInstanceId:'new-result'});
  assert.equal(get('fusion-confirmation').hidden,true);assert.deepEqual(inspected,[]);
  get('fusion-inspect-result').click();assert.deepEqual(inspected,['new-result']);
});

test('Prévia não considera protegido, equipado, refino ou gemas como cópias livres', async () => {
  const { FUSION_RECIPES, getFusionPreview }=await import('@magicforge/shared');
  const base={itemId:'sword_iron_broadsword',slotIndex:0,instanceId:'copy',quantity:1,isEquipped:false};
  const copies=[{...base,isLocked:true},{...base,isEquipped:true},{...base,refineLevel:1},{...base,sockets:[{socketIndex:0,gemId:'gem_ruby_str'}]}];
  const preview=getFusionPreview(FUSION_RECIPES.forge_blade_v1,copies,{classType:CharacterClass.GUERREIRO,level:10,gold:10000});
  assert.equal(preview.eligible.length,0);assert.match(preview.reason,/cópias livres/);
});
