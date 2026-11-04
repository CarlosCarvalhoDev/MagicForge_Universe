import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterClass, Opcode, createVector3 } from '@magicforge/shared';
import { HuntSession } from '../src/game/HuntSession';
import { World } from '../src/game/World';
import { WorldManager } from '../src/game/WorldManager';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { Connection } from '../src/network/Connection';
import { PacketHandler } from '../src/network/PacketHandler';
import { Monster } from '../src/entities/Monster';

class MockSocket {
  readyState = 1;
  messages: Array<{ op: number; data: any }> = [];
  send(raw: string) { this.messages.push(JSON.parse(raw)); }
  last(op: Opcode) { return this.messages.filter(packet => packet.op === op).at(-1)?.data; }
}

let counter = 0;
function setup(t: TestContext) {
  const db = new DatabaseManager(':memory:');
  t.after(() => db.close());
  const world = new World(db);
  const socket = new MockSocket();
  const conn = new Connection(`hunt_${++counter}`, socket as any);
  const account = db.getOrCreateAccount(`hunt_account_${counter}`);
  conn.accountId = account.id;
  conn.isAuthenticated = true;
  const player = db.createCharacterInSlot(conn.id, account.id, 0, `Hunter_${counter}`, CharacterClass.GUERREIRO);
  world.enterWorld(conn, player);
  return { db, world, player, conn, socket };
}

function killWithLoot(world: World, player: ReturnType<typeof setup>['player'], itemId: string, quantity: number, exp = 20) {
  const monster = new Monster(`hunt_monster_${++counter}`, 'Monstro de teste', createVector3(0, 0, 0));
  monster.expReward = exp;
  monster.lootTable = [{ itemId, dropChance: 1, minQty: quantity, maxQty: quantity }];
  monster.takeDamage(monster.maxHp, player);
  world.handleMonsterDeath(monster, player);
  const drop = [...world.activeItemDrops.values()].find(drop => drop.itemId === itemId)!;
  assert.ok(drop);
  assert.equal(world.lootItem(player, drop.dropId), true);
  return drop;
}

test('Taxas esperam 1 min, incluem tempo sem abates e resetam sem alterar economia', () => {
  const hunt = new HuntSession();
  hunt.add('combatExp', 120);
  hunt.add('lootGold', 60);
  hunt.add('autoSaleGold', 1000);
  hunt.addArcaneDust(2);
  hunt.advance(59);
  assert.equal(hunt.snapshot().expPerHour, null);
  assert.equal(hunt.snapshot().arcaneDustPerHour, null);
  hunt.advance(1);
  assert.equal(hunt.snapshot().expPerHour, 7200);
  assert.equal(hunt.snapshot().goldPerHour, 3600);
  assert.equal(hunt.snapshot().arcaneDustPerHour, 120);
  hunt.advance(60);
  assert.equal(hunt.snapshot().expPerHour, 3600);
  hunt.add('combatExp', -100);
  hunt.advance(NaN);
  assert.equal(hunt.snapshot().combatExp, 120);
  hunt.reset();
  assert.equal(hunt.snapshot().elapsedSeconds, 0);
  assert.equal(hunt.snapshot().combatExp, 0);
  assert.equal(hunt.snapshot().goldPerHour, null);
  assert.equal(hunt.snapshot().arcaneDustLoot, 0);
});

test('Auto-venda e venda de lixo preservam pó, pedras e poções; só coleta real conta para previsão', t => {
  const { db, world, player, conn } = setup(t);
  player.farmSettings.autoSellCommon = player.farmSettings.autoSellUncommon = true;
  const dust = killWithLoot(world, player, 'arcane_dust', 3);
  assert.equal(world.lootItem(player, dust.dropId), false);
  killWithLoot(world, player, 'stone_forge_common', 1);
  killWithLoot(world, player, 'potion_hp_minor', 1);
  assert.equal(player.huntSession.snapshot().arcaneDustLoot, 3);
  assert.equal(player.huntSession.snapshot().autoSaleGold, 0);
  world.handleAutoSalvage(conn);
  assert.ok(db.hasItemQuantity(player.dbCharacterId, 'arcane_dust', 3));
  assert.ok(db.hasItemQuantity(player.dbCharacterId, 'stone_forge_common', 1));
  assert.ok(db.hasItemQuantity(player.dbCharacterId, 'potion_hp_minor', 4));
  world.deliverRewardItemToPlayer(player, 'arcane_dust', 2);
  assert.equal(player.huntSession.snapshot().arcaneDustLoot, 3);
});

test('Mochila sem espaço não soma pó não coletado à taxa', t => {
  const { db, world, player } = setup(t);
  player.maxInventorySlots = player.inventory.length;
  const monster = new Monster('dust_full', 'Alvo', createVector3(0, 0, 0));
  monster.lootTable = [{ itemId: 'arcane_dust', dropChance: 1, minQty: 3, maxQty: 3 }];
  monster.takeDamage(monster.maxHp, player);
  world.handleMonsterDeath(monster, player);
  const drop = [...world.activeItemDrops.values()].find(item => item.itemId === 'arcane_dust')!;
  assert.equal(world.lootItem(player, drop.dropId), false);
  assert.equal(player.huntSession.snapshot().arcaneDustLoot, 0);
  assert.equal(db.hasItemQuantity(player.dbCharacterId, 'arcane_dust', 1), false);
});

test('Combate, loot e vendas são separados; baú e prêmio direto não inflam taxas', (t) => {
  const { db, world, player, conn } = setup(t);
  player.huntSession.advance(60);
  const goldDrop = killWithLoot(world, player, 'gold', 100);
  assert.equal(world.lootItem(player, goldDrop.dropId), false, 'Drop já coletado não pode contar novamente');
  player.farmSettings.autoSellCommon = true;
  player.farmSettings.autoSellUncommon = true;
  killWithLoot(world, player, 'sword_iron_broadsword', 1);
  const material = player.inventory.find(item => item.itemId === 'potion_mp_minor')!;
  assert.equal(world.sellPlayerItem(player, material.slotIndex), true);
  const beforeOffline = player.huntSession.snapshot();
  assert.equal(beforeOffline.kills, 2);
  assert.equal(beforeOffline.combatExp, 40);
  assert.equal(beforeOffline.lootGold, 100);
  assert.equal(beforeOffline.autoSaleGold, 80);
  assert.equal(beforeOffline.manualSaleGold, 30);
  player.lastLogoutTime = Date.now() - 3600_000;
  player.offlineRewardsEvaluated = false;
  world.checkAndNotifyOfflineRewards(conn, player);
  assert.equal(world.claimOfflineRewards(player).success, true);
  world.deliverRewardItemToPlayer(player, 'gold', 1000);
  assert.deepEqual(player.huntSession.snapshot(), beforeOffline);
  assert.equal(db.getCharacterByName(player.name)!.pending_offline_reward, null);
});

test('Poções manuais e automáticas contam só quando removidas, sem contar equipamento', (t) => {
  const { world, player, db } = setup(t);
  const sword = player.inventory.find(item => item.itemId === 'sword_iron_broadsword')!;
  world.usePlayerItem(player, sword.slotIndex);
  assert.equal(player.huntSession.snapshot().hpPotionsUsed, 0);
  player.currentHp = 1;
  player.currentResource = 0;
  world.processPlayerFarmHelper(player);
  let report = player.huntSession.snapshot();
  assert.equal(report.hpPotionsUsed, 1);
  assert.equal(report.resourcePotionsUsed, 1);
  const hp = player.inventory.find(item => item.itemId === 'potion_hp_minor')!;
  assert.equal(world.usePlayerItem(player, hp.slotIndex), true);
  report = player.huntSession.snapshot();
  assert.equal(report.hpPotionsUsed, 2);
  const mp = player.inventory.find(item => item.itemId === 'potion_mp_minor')!;
  db.removeItemFromInventory(player.dbCharacterId, mp.slotIndex, mp.quantity);
  player.currentResource = 0;
  assert.equal(world.usePlayerItem(player, mp.slotIndex), false);
  assert.equal(player.currentResource, 0, 'Snapshot antigo da mochila não concede poção já removida do banco');
  assert.equal(player.huntSession.snapshot().resourcePotionsUsed, 1);
});

test('Morte conta uma vez; respawn e inatividade fazem parte da duração', (t) => {
  const { world, player } = setup(t);
  for (const monster of world.entityManager.getAllMonsters()) {
    world.entityManager.removeMonster(monster.id);
    world.spatialGrid.removeEntity(monster.id);
  }
  player.takeDamage(player.maxHp * 2);
  player.takeDamage(1000);
  assert.equal(player.huntSession.snapshot().deaths, 1);
  world.update(2);
  assert.equal(player.huntSession.snapshot().elapsedSeconds, 2);
  world.update(2);
  assert.equal(player.isDead, false);
  player.takeDamage(player.maxHp * 2);
  assert.equal(player.huntSession.snapshot().deaths, 2);
  assert.equal(player.huntSession.snapshot().elapsedSeconds, 4);
});

test('Pedido/reset usam somente o herói autenticado e não aceitam contadores do cliente', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1_800_000_000_000 });
  const { world, player, conn, socket } = setup(t);
  const handler = new PacketHandler(world);
  player.huntSession.add('kills', 3);
  player.huntSession.advance(60);
  conn.isAuthenticated = false;
  handler.handlePacket(conn, JSON.stringify({ op: Opcode.C2S_RESET_HUNT_REPORT, data: {} }));
  assert.equal(player.huntSession.snapshot().kills, 3);
  conn.isAuthenticated = true;
  handler.handlePacket(conn, JSON.stringify({ op: Opcode.C2S_REQUEST_HUNT_REPORT, data: { kills: 999, characterId: 'other' } }));
  assert.ok(socket.last(Opcode.S2C_HUNT_REPORT), JSON.stringify({ expectedOp: Opcode.S2C_HUNT_REPORT, receivedOps: socket.messages.map(packet => packet.op) }));
  assert.equal(socket.last(Opcode.S2C_HUNT_REPORT).kills, 3);
  assert.equal(socket.last(Opcode.S2C_HUNT_REPORT).characterId, player.dbCharacterId);
  const gold = player.gold;
  handler.handlePacket(conn, JSON.stringify({ op: Opcode.C2S_RESET_HUNT_REPORT, data: { combatExp: 999 } }));
  assert.equal(socket.last(Opcode.S2C_HUNT_REPORT).elapsedSeconds, 0);
  assert.equal(player.gold, gold);
  player.huntSession.add('kills', 1);
  handler.handlePacket(conn, JSON.stringify({ op: Opcode.C2S_RESET_HUNT_REPORT, data: {} }));
  assert.equal(player.huntSession.snapshot().kills, 1, 'Reset repetido no mesmo segundo é ignorado');
});

test('Canal preserva medição; reconectar cria outra sessão; EXP de party conta a parte recebida', (t) => {
  const db = new DatabaseManager(':memory:');
  t.after(() => db.close());
  const manager = new WorldManager(db);
  function join(name: string) {
    const conn = new Connection(name, new MockSocket() as any);
    const account = db.getOrCreateAccount(name);
    conn.accountId = account.id;
    conn.isAuthenticated = true;
    manager.registerConnection(conn);
    const player = db.createCharacterInSlot(conn.id, account.id, 0, name, CharacterClass.GUERREIRO);
    manager.assignPlayerToChannel(conn, player, 1);
    return { conn, player };
  }
  const leader = join('HuntLeader');
  const ally = join('HuntAlly');
  const world = leader.conn.currentWorldInstance as World;
  manager.handlePartyInvite(leader.conn, { targetPlayerId: ally.player.id });
  manager.handlePartyInviteResponse(ally.conn, { inviterId: leader.player.id, accept: true });
  const monster = new Monster('party_hunt_test', 'Alvo grupo', createVector3(0, 0, 0));
  monster.expReward = 100;
  monster.lootTable = [];
  monster.takeDamage(monster.maxHp, leader.player);
  world.handleMonsterDeath(monster, leader.player);
  assert.equal(leader.player.huntSession.snapshot().combatExp, 55);
  assert.equal(ally.player.huntSession.snapshot().combatExp, 55);
  assert.equal(leader.player.huntSession.snapshot().kills, 1);
  assert.equal(ally.player.huntSession.snapshot().kills, 0);
  leader.player.huntSession.advance(60);
  const beforeTransfer = leader.player.huntSession.snapshot();
  assert.equal(manager.changePlayerChannel(leader.conn, 2).success, true);
  assert.deepEqual(leader.player.huntSession.snapshot(), beforeTransfer);
  manager.unregisterConnection(leader.conn);
  const loaded = db.loadPlayerFromRecord(leader.conn.id, db.getCharacterByName(leader.player.name)!);
  assert.equal(loaded.huntSession.snapshot().combatExp, 0);
  assert.equal(loaded.huntSession.snapshot().elapsedSeconds, 0);
});

test('Sync periódico e ouro limitado ao saldo máximo refletem somente valores creditados', (t) => {
  const { world, player, socket, db } = setup(t);
  for (const monster of world.entityManager.getAllMonsters()) {
    world.entityManager.removeMonster(monster.id);
    world.spatialGrid.removeEntity(monster.id);
  }
  player.gold = 1_999_999_995;
  db.savePlayer(player);
  killWithLoot(world, player, 'gold', 100);
  assert.equal(player.huntSession.snapshot().lootGold, 5);
  world.update(5.1);
  assert.ok(socket.last(Opcode.S2C_HUNT_REPORT), JSON.stringify({ expectedOp: Opcode.S2C_HUNT_REPORT, receivedOps: socket.messages.map(packet => packet.op) }));
  assert.equal(socket.last(Opcode.S2C_HUNT_REPORT).lootGold, 5);
  assert.equal(socket.last(Opcode.S2C_HUNT_REPORT).elapsedSeconds, 5.1);
});
