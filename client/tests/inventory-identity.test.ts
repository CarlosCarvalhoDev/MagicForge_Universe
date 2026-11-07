import test from 'node:test';
import assert from 'node:assert/strict';
import { Opcode } from '@magicforge/shared';
import { ClientNetwork } from '../src/network/ClientNetwork';

test('Cliente envia identidade da instância após troca, incluindo equipado e nível esperado do refino', () => {
  const client = new ClientNetwork('ws://localhost:3000');
  const sent: any[] = [];
  client.send = (op, data) => { sent.push({op,data}); };
  const receive = (slots: unknown[]) => (client as any).handleIncomingRaw(JSON.stringify({op:Opcode.S2C_INVENTORY_UPDATE,data:{slots,gold:0,totalCombatPower:0}}));
  receive([{slotIndex:2,instanceId:'weapon_a',itemId:'sword_iron_broadsword',quantity:1,isEquipped:false,refineLevel:0}]);
  client.sendUseItem(2);
  assert.equal(sent.at(-1).data.expectedInstanceId, 'weapon_a');
  receive([{slotIndex:-1,instanceId:'weapon_a',itemId:'sword_iron_broadsword',quantity:1,isEquipped:true,refineLevel:7},
    {slotIndex:2,instanceId:'weapon_b',itemId:'sword_iron_broadsword',quantity:1,isEquipped:false,refineLevel:0}]);
  client.sendRefineEquipment(-1);
  assert.equal(sent.at(-1).data.expectedInstanceId, 'weapon_a');
  assert.equal(sent.at(-1).data.expectedRefineLevel, 7);
  client.sendSellItem(2);
  assert.equal(sent.at(-1).data.expectedInstanceId, 'weapon_b');
  client.sendSocketGem(-1,1,'gem_ruby_str');
  assert.equal(sent.at(-1).data.expectedInstanceId, 'weapon_a');
  client.sendSetItemLock(-1, true);
  assert.equal(sent.at(-1).op, Opcode.C2S_SET_ITEM_LOCK);
  assert.deepEqual(sent.at(-1).data, { slotIndex:-1, expectedInstanceId:'weapon_a', isLocked:true });
  client.disconnect(false);
  client.sendUseItem(2);
  assert.equal(sent.at(-1).data.expectedInstanceId, undefined);
});
