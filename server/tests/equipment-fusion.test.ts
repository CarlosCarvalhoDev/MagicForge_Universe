import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CharacterClass, FUSION_RECIPES, ITEMS_DATABASE, Opcode, getFusionPreview, type FusionRequest } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import { PacketHandler } from '../src/network/PacketHandler';
import { Connection } from '../src/network/Connection';

function setup(t: TestContext, filename = ':memory:') {
  const db = new DatabaseManager(filename); t.after(()=>db.close());
  const account = db.getOrCreateAccount('fusion-test');
  const player = db.createCharacterInSlot('fusion', account.id, 0, 'FusionHero', CharacterClass.GUERREIRO);
  player.level=10; player.gold=10000; db.savePlayer(player);
  const inventory=()=>db.getInventory(player.dbCharacterId);
  const starter=inventory().find(item=>item.itemId==='sword_iron_broadsword')!;
  db.toggleEquipItem(player.dbCharacterId,starter.slotIndex,player.classType,player.level,player.attributes);
  for(let n=0;n<3;n++) assert.equal(db.addItemToInventory(player.dbCharacterId,'sword_iron_broadsword'),true);
  db.addItemToInventory(player.dbCharacterId,'ore_iron_arcane',20); db.addItemToInventory(player.dbCharacterId,'arcane_dust',30);
  const recipe=FUSION_RECIPES.forge_blade_v1;
  const request: FusionRequest={requestId:randomUUID(),recipeId:recipe.id,recipeVersion:recipe.version,inputInstanceIds:getFusionPreview(recipe,inventory(),{classType:player.classType,level:player.level,gold:player.gold}).selected.map(item=>item.instanceId!)};
  return {db,player,inventory,recipe,request};
}

test('Fusão reduz duplicatas, cobra custos reais e cria resultado protegido sem tocar no equipado', t=>{
  const f=setup(t), before=f.inventory(), worn=before.find(item=>item.isEquipped)!;
  const result=f.db.fuseEquipment(f.player,f.request), after=f.inventory();
  assert.equal(f.db.getCharacterGold(f.player.dbCharacterId),8200);
  assert.equal(after.find(item=>item.itemId==='ore_iron_arcane')!.quantity,14);
  assert.equal(after.find(item=>item.itemId==='arcane_dust')!.quantity,22);
  assert.deepEqual(after.find(item=>item.instanceId===worn.instanceId),worn);
  assert.ok(f.request.inputInstanceIds.every(id=>!after.some(item=>item.instanceId===id)));
  const output=after.find(item=>item.instanceId===result.outputInstanceId)!;
  assert.equal(output.itemId,f.recipe.outputItemId); assert.equal(output.isLocked,true);
  assert.equal(output.isEquipped,false); assert.equal(output.refineLevel,0); assert.deepEqual(output.sockets,[]);
  assert.equal(after.filter(item=>!item.isEquipped).length,before.filter(item=>!item.isEquipped).length-2);
  const second=f.db.fuseEquipment(f.player,{...f.request,inputInstanceIds:[...f.request.inputInstanceIds].reverse()});
  assert.equal(second.replayed,true); assert.equal(second.outputInstanceId,result.outputInstanceId);
  assert.deepEqual(f.inventory(),after); assert.equal(f.db.getCharacterGold(f.player.dbCharacterId),8200);
  assert.throws(()=>f.db.fuseEquipment(f.player,{...f.request,recipeId:'forge_mail_v1'}),/FUSION_REQUEST_REUSED/);
});

test('Mochila cheia usa os espaços liberados pelas cópias',t=>{
  const f=setup(t);
  while(f.inventory().filter(item=>!item.isEquipped).length<20) assert.equal(f.db.addItemToInventory(f.player.dbCharacterId,'sword_iron_broadsword'),true);
  assert.ok(f.db.fuseEquipment(f.player,f.request).outputInstanceId);
  assert.equal(f.inventory().filter(item=>!item.isEquipped).length,18);
});

test('Alvos protegidos, refinados, com gemas, equipados, repetidos e sem propriedade não são consumidos',async t=>{
  for(const mutation of ['locked','refined','gem','equipped','duplicate','mixed','foreign','version','level','class','gold','material'] as const) await t.test(mutation,sub=>{
    const f=setup(sub), id=f.request.inputInstanceIds[0], target=f.inventory().find(item=>item.instanceId===id)!;
    if(mutation==='locked') f.db.setItemLocked(f.player.dbCharacterId,id,true);
    if(mutation==='refined') f.db.refineEquipmentItem(f.player.dbCharacterId,target.slotIndex,1);
    if(mutation==='gem'){f.db.addItemToInventory(f.player.dbCharacterId,'gem_ruby_str');f.db.socketGem(f.player.dbCharacterId,target.slotIndex,0,'gem_ruby_str');}
    if(mutation==='equipped') f.db.toggleEquipItem(f.player.dbCharacterId,target.slotIndex,f.player.classType,10,f.player.attributes);
    if(mutation==='duplicate') f.request.inputInstanceIds[1]=id;
    if(mutation==='mixed'){f.db.addItemToInventory(f.player.dbCharacterId,'armor_chainmail');f.request.inputInstanceIds[0]=f.inventory().find(item=>item.itemId==='armor_chainmail')!.instanceId!;}
    if(mutation==='foreign'){
      const account=f.db.getOrCreateAccount('foreign');
      const player=f.db.createCharacterInSlot('foreign',account.id,0,'ForeignHero',CharacterClass.GUERREIRO);
      f.request.inputInstanceIds[0]=f.db.getInventory(player.dbCharacterId).find(item=>item.itemId==='sword_iron_broadsword')!.instanceId!;
    }
    if(mutation==='version') f.request.recipeVersion=999;
    if(mutation==='level') f.player.level=1;
    if(mutation==='class') f.player.classType=CharacterClass.MAGO;
    if(mutation==='gold') f.db.updateCharacterGold(f.player.dbCharacterId,-10000);
    if(mutation==='material') f.db.setItemLocked(f.player.dbCharacterId,f.inventory().find(item=>item.itemId==='arcane_dust')!.instanceId!,true);
    const before=f.inventory(),gold=f.db.getCharacterGold(f.player.dbCharacterId);
    assert.throws(()=>f.db.fuseEquipment(f.player,f.request),/FUSION_/);
    assert.deepEqual(f.inventory(),before);assert.equal(f.db.getCharacterGold(f.player.dbCharacterId),gold);
  });
});

test('Falha após criar resultado reverte itens, materiais, ouro e recibo; mesmo pedido pode ser retomado',t=>{
  const f=setup(t),before=f.inventory();
  const fail=t.mock.method(f.db,'setItemLocked',()=>false);
  assert.throws(()=>f.db.fuseEquipment(f.player,f.request),/FUSION_OUTPUT/);
  assert.deepEqual(f.inventory(),before);assert.equal(f.db.getCharacterGold(f.player.dbCharacterId),10000);
  fail.mock.restore();assert.equal(f.db.fuseEquipment(f.player,f.request).replayed,false);
});

test('Pacote não escolhe preço nem resultado; replay sincroniza estado sem conceder outro item',t=>{
  const f=setup(t),world=new World(f.db),packets:any[]=[];
  const conn=new Connection('fusion',{readyState:1,send:(raw:string)=>packets.push(JSON.parse(raw))} as any);
  conn.isAuthenticated=true;conn.playerId=f.player.id;world.registerConnection(conn);world.entityManager.addPlayer(f.player);
  const handler=new PacketHandler(world);
  const send=()=>handler.handlePacket(conn,JSON.stringify({op:Opcode.C2S_FUSE_EQUIPMENT,data:{...f.request,goldCost:0,outputItemId:'relic_ancient_forge'}}));
  send();send();
  assert.equal(f.db.getCharacterGold(f.player.dbCharacterId),8200);
  assert.equal(f.inventory().filter(item=>item.itemId===f.recipe.outputItemId).length,1);
  assert.equal(f.inventory().some(item=>item.itemId==='relic_ancient_forge'),false);
  const results=packets.filter(packet=>packet.op===Opcode.S2C_FUSION_RESULT);
  assert.equal(results.length,2);assert.equal(results[1].data.replayed,true);
});

test('Receitas têm IDs existentes, afinidade utilizável e cobertura de todas as classes',()=>{
  const covered=new Set<CharacterClass>();
  for(const recipe of Object.values(FUSION_RECIPES)){
    const input=ITEMS_DATABASE[recipe.preferredInputItemId],output=ITEMS_DATABASE[recipe.outputItemId];
    assert.ok(input&&output);assert.equal(input.maxStack,1);assert.equal(output.maxStack,1);
    for(const cls of recipe.classes){covered.add(cls);assert.ok(output.allowedClasses?.includes(cls));}
  }
  assert.deepEqual([...covered].sort(),Object.values(CharacterClass).sort());
});

test('Recibo e proteção sobrevivem ao fechamento/reabertura do SQLite',t=>{
  const filename=join(tmpdir(),`magicforge-fusion-${randomUUID()}.db`),f=setup(t,filename);
  let reopened:DatabaseManager|undefined;
  t.after(()=>{f.db.close();reopened?.close();for(const suffix of ['', '-wal','-shm'])rmSync(filename+suffix,{force:true});});
  const first=f.db.fuseEquipment(f.player,f.request);f.db.close();reopened=new DatabaseManager(filename);
  const loaded=reopened.loadPlayerFromRecord('again',reopened.getCharacterByName(f.player.name)!);
  const second=reopened.fuseEquipment(loaded,f.request);
  assert.equal(second.replayed,true);assert.equal(second.outputInstanceId,first.outputInstanceId);
  assert.equal(reopened.getCharacterGold(loaded.dbCharacterId),8200);
  assert.equal(reopened.getInventory(loaded.dbCharacterId).find(item=>item.instanceId===first.outputInstanceId)!.isLocked,true);
});

test('Todas as receitas podem ser executadas por uma classe compatível',async t=>{
  for(const recipe of Object.values(FUSION_RECIPES)) await t.test(recipe.id,sub=>{
    const db=new DatabaseManager(':memory:');sub.after(()=>db.close());
    const account=db.getOrCreateAccount(recipe.id),player=db.createCharacterInSlot('recipe',account.id,0,'RecipeHero',recipe.classes[0]);
    player.level=10;player.gold=10000;db.savePlayer(player);
    for(let n=0;n<3;n++)db.addItemToInventory(player.dbCharacterId,recipe.preferredInputItemId);
    for(const material of recipe.materials)db.addItemToInventory(player.dbCharacterId,material.itemId,material.quantity);
    const preview=getFusionPreview(recipe,db.getInventory(player.dbCharacterId),{classType:player.classType,level:10,gold:10000});
    assert.equal(preview.reason,'');
    const result=db.fuseEquipment(player,{requestId:randomUUID(),recipeId:recipe.id,recipeVersion:recipe.version,inputInstanceIds:preview.selected.map(item=>item.instanceId!)});
    assert.equal(result.outputItemId,recipe.outputItemId);
  });
});
