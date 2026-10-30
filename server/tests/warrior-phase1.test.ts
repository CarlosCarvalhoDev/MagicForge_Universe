import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {
  CharacterClass,
  Opcode,
  SKILLS_DATABASE,
  getDefaultSkillsForClass,
  getSkillsForClass,
  getSkillChoicesForSlot,
  calculateSkillPower,
  createVector3,
  cloneVector3,
  distance,
} from '@magicforge/shared';
import { World } from '../src/game/World';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { Player } from '../src/entities/Player';
import { Monster } from '../src/entities/Monster';
import { Connection } from '../src/network/Connection';

class MockConnection {
  public id: string;
  public playerId: string | null = null;
  public accountId: string | null = null;
  public accountUsername: string | null = null;
  public isAuthenticated: boolean = false;
  public sentPackets: Array<{ op: Opcode; data: any }> = [];

  constructor(id: string) {
    this.id = id;
  }

  public send(op: Opcode, data: any): void {
    this.sentPackets.push({ op, data });
  }

  public getLastPacket(op: Opcode): any | null {
    for (let i = this.sentPackets.length - 1; i >= 0; i--) {
      if (this.sentPackets[i].op === op) return this.sentPackets[i].data;
    }
    return null;
  }

  public getPackets(op: Opcode): any[] {
    return this.sentPackets.filter((p) => p.op === op).map((p) => p.data);
  }

  public clear(): void {
    this.sentPackets = [];
  }
}

function createTestWorld(): { world: World; db: DatabaseManager } {
  const db = new DatabaseManager(':memory:');
  const world = new World(db);
  // Limpa monstros da arena inicial para testes isolados
  for (const m of world.entityManager.getAllMonsters()) {
    world.entityManager.removeMonster(m.id);
    world.spatialGrid.removeEntity(m.id);
  }
  return { world, db };
}

test('1. Conta nova -> Guerreiro -> entrar no mundo apenas após seleção; loadout persistido ao reconectar', () => {
  const { world } = createTestWorld();
  const conn = new MockConnection('conn_1') as unknown as Connection;
  world.registerConnection(conn);

  // 1.1 Tentativa de listar sem autenticação deve ser rejeitada
  world.handleRequestCharacterList(conn);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_AUTH_ERROR)?.errorCode, 'UNAUTHENTICATED');

  // 1.2 Registra e autentica
  world.handleAuthRegister(conn, { username: 'testwarrior', password: 'password123', email: 'warrior@forja.com' });
  assert.ok(conn.isAuthenticated);
  assert.ok(conn.accountId);

  // 1.3 Listar slots (todos vazios inicialmente)
  world.handleRequestCharacterList(conn);
  const list1 = (conn as any).getLastPacket(Opcode.S2C_CHARACTER_LIST);
  assert.equal(list1.slots.length, 3);
  assert.equal(list1.slots[0].isEmpty, true);

  // 1.4 Criação de Guerreiro no Slot 0
  world.handleCreateCharacterSlot(conn, 0, 'SirGalahad', CharacterClass.GUERREIRO);
  const list2 = (conn as any).getLastPacket(Opcode.S2C_CHARACTER_LIST);
  assert.equal(list2.slots[0].isEmpty, false);
  assert.equal(list2.slots[0].name, 'SirGalahad');
  assert.equal(list2.slots[0].classType, CharacterClass.GUERREIRO);

  // Ainda não entrou no mundo (nenhum player ativo)
  assert.equal(world.entityManager.getAllPlayers().length, 0);

  // 1.5 Seleciona o personagem e ingressa no mundo
  world.handleSelectCharacterSlot(conn, 0);
  assert.equal(world.entityManager.getAllPlayers().length, 1);
  const loginSuccess = (conn as any).getLastPacket(Opcode.S2C_LOGIN_SUCCESS);
  assert.equal(loginSuccess.characterName, 'SirGalahad');

  const player = world.entityManager.getPlayer(conn.playerId!);
  assert.ok(player);
  assert.deepEqual(player.equippedSkills, getDefaultSkillsForClass(CharacterClass.GUERREIRO));

  // 1.6 Simula desconexão e reconexão para validar persistência
  world.unregisterConnection(conn);
  assert.equal(world.entityManager.getAllPlayers().length, 0);

  const conn2 = new MockConnection('conn_2') as unknown as Connection;
  world.registerConnection(conn2);
  world.handleAuthLogin(conn2, { username: 'testwarrior', password: 'password123' });
  world.handleSelectCharacterSlot(conn2, 0);

  const reloadedPlayer = world.entityManager.getPlayer(conn2.playerId!);
  assert.ok(reloadedPlayer);
  assert.equal(reloadedPlayer.name, 'SirGalahad');
  assert.equal(reloadedPlayer.equippedSkills[1], 'guerreiro_truque_1');
  assert.equal(reloadedPlayer.equippedSkills[2], 'guerreiro_nv1_1');
  assert.equal(reloadedPlayer.equippedSkills[3], 'guerreiro_nv2_1');
  assert.equal(reloadedPlayer.equippedSkills[4], 'guerreiro_nv3_1');
});

test('2. Níveis 1/10/25/50 verificam bloqueio/desbloqueio e 3 escolhas válidas por slot', () => {
  const { world } = createTestWorld();
  const conn = new MockConnection('conn_lvl') as unknown as Connection;
  world.registerConnection(conn);
  world.handleAuthRegister(conn, { username: 'hero_lvl', password: 'password123', email: 'hero@forja.com' });
  world.handleCreateCharacterSlot(conn, 0, 'LevelTester', CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn, 0);
  const player = world.entityManager.getPlayer(conn.playerId!)!;

  // 12 skills únicas do guerreiro
  const warriorSkills = getSkillsForClass(CharacterClass.GUERREIRO);
  assert.equal(warriorSkills.length, 12);
  assert.equal(getSkillChoicesForSlot(CharacterClass.GUERREIRO, 1).length, 3);
  assert.equal(getSkillChoicesForSlot(CharacterClass.GUERREIRO, 2).length, 3);
  assert.equal(getSkillChoicesForSlot(CharacterClass.GUERREIRO, 3).length, 3);
  assert.equal(getSkillChoicesForSlot(CharacterClass.GUERREIRO, 4).length, 3);

  // Nível 1: Slot 1 liberado, Slots 2, 3, 4 bloqueados
  player.level = 1;
  assert.equal(world.castPlayerSkill(player, 2), false);
  let reject = (conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED);
  assert.equal(reject.reasonCode, 'LEVEL_LOCKED');
  assert.equal(reject.slot, 2);

  assert.equal(world.castPlayerSkill(player, 3), false);
  reject = (conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED);
  assert.equal(reject.reasonCode, 'LEVEL_LOCKED');

  assert.equal(world.castPlayerSkill(player, 4), false);
  reject = (conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED);
  assert.equal(reject.reasonCode, 'LEVEL_LOCKED');

  // Troca para as 3 opções de Slot 1 no nível 1
  assert.ok(world.equipPlayerSkill(player, 1, 'guerreiro_truque_2'));
  assert.equal(player.equippedSkills[1], 'guerreiro_truque_2');
  assert.ok(world.equipPlayerSkill(player, 1, 'guerreiro_truque_3'));
  assert.equal(player.equippedSkills[1], 'guerreiro_truque_3');
  assert.ok(world.equipPlayerSkill(player, 1, 'guerreiro_truque_1'));

  // Nível 10: Slot 2 desbloqueado
  player.level = 10;
  assert.ok(world.equipPlayerSkill(player, 2, 'guerreiro_nv1_2'));
  assert.equal(player.equippedSkills[2], 'guerreiro_nv1_2');
  assert.ok(world.equipPlayerSkill(player, 2, 'guerreiro_nv1_3'));
  assert.equal(player.equippedSkills[2], 'guerreiro_nv1_3');
  assert.ok(world.equipPlayerSkill(player, 2, 'guerreiro_nv1_1'));
  // Slots 3 e 4 ainda bloqueados no nível 10
  assert.equal(world.castPlayerSkill(player, 3), false);
  assert.equal(world.castPlayerSkill(player, 4), false);

  // Nível 25: Slot 3 desbloqueado
  player.level = 25;
  assert.ok(world.equipPlayerSkill(player, 3, 'guerreiro_nv2_2'));
  assert.equal(player.equippedSkills[3], 'guerreiro_nv2_2');
  assert.ok(world.equipPlayerSkill(player, 3, 'guerreiro_nv2_3'));
  assert.equal(player.equippedSkills[3], 'guerreiro_nv2_3');
  assert.ok(world.equipPlayerSkill(player, 3, 'guerreiro_nv2_1'));
  // Slot 4 ainda bloqueado
  assert.equal(world.castPlayerSkill(player, 4), false);

  // Nível 50: Slot 4 desbloqueado
  player.level = 50;
  assert.ok(world.equipPlayerSkill(player, 4, 'guerreiro_nv3_2'));
  assert.equal(player.equippedSkills[4], 'guerreiro_nv3_2');
  assert.ok(world.equipPlayerSkill(player, 4, 'guerreiro_nv3_3'));
  assert.equal(player.equippedSkills[4], 'guerreiro_nv3_3');
  assert.ok(world.equipPlayerSkill(player, 4, 'guerreiro_nv3_1'));
});

test('3. Rejeições estritas: slot inválido, alvo inválido/morto/distante, sem energia, coordenadas inválidas', () => {
  const { world } = createTestWorld();
  const conn = new MockConnection('conn_rej') as unknown as Connection;
  world.registerConnection(conn);
  world.handleAuthRegister(conn, { username: 'hero_rej', password: 'password123', email: 'rej@forja.com' });
  world.handleCreateCharacterSlot(conn, 0, 'RejectionTester', CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn, 0);
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.level = 50;

  const initialResource = player.currentResource;

  // 3.1 Slot fracionado ou fora de 1..4
  assert.equal(world.castPlayerSkill(player, 1.5), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'INVALID_SLOT');
  assert.equal(world.castPlayerSkill(player, 0), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'INVALID_SLOT');
  assert.equal(world.castPlayerSkill(player, 5), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'INVALID_SLOT');
  assert.equal(world.castPlayerSkill(player, NaN), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'INVALID_SLOT');
  assert.equal(player.currentResource, initialResource);

  // 3.2 Coordenadas não finitas
  assert.equal(world.castPlayerSkill(player, 1, undefined, { x: NaN, y: 0, z: 0 }), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'INVALID_POSITION');

  // Coordenadas válidas (0, 0, 0) são aceitas sem falha de posição
  const dummyMob = new Monster('mob_center', 'Treino', createVector3(1, 0, 0), 100, 5);
  world.entityManager.addMonster(dummyMob);
  world.spatialGrid.updateEntity(dummyMob);
  player.position = createVector3(0, 0, 0);

  // 3.3 Alvo inexistente
  assert.equal(world.castPlayerSkill(player, 1, 'inexistente'), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'INVALID_TARGET');
  assert.equal(player.currentResource, initialResource);

  // 3.4 Alvo morto
  dummyMob.isDead = true;
  assert.equal(world.castPlayerSkill(player, 1, dummyMob.id), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'TARGET_DEAD');
  assert.equal(player.currentResource, initialResource);

  // 3.5 Alvo distante (fora de alcance)
  const farMob = new Monster('mob_far', 'Longe', createVector3(20, 0, 20), 100, 5);
  world.entityManager.addMonster(farMob);
  world.spatialGrid.updateEntity(farMob);
  assert.equal(world.castPlayerSkill(player, 1, farMob.id), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'OUT_OF_RANGE');
  assert.equal(player.currentResource, initialResource);

  // 3.6 Recurso insuficiente
  player.currentResource = 5; // Requer 10 para Golpe Firme
  const closeMob = new Monster('mob_close', 'Perto', createVector3(1.5, 0, 0), 100, 5);
  world.entityManager.addMonster(closeMob);
  world.spatialGrid.updateEntity(closeMob);
  assert.equal(world.castPlayerSkill(player, 1, closeMob.id), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'INSUFFICIENT_RESOURCE');

  // 3.7 Em recarga (cooldown)
  player.currentResource = 100;
  player.setSkillCooldown(1, 2.0);
  assert.equal(world.castPlayerSkill(player, 1, closeMob.id), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'ON_COOLDOWN');
  player.setSkillCooldown(1, 0);

  // 3.8 Atordoado
  player.addStatus({
    statusId: 'test_stun',
    type: 'STUN',
    skillId: 'test',
    sourceEntityId: 'enemy',
    targetEntityId: player.id,
    durationSec: 2,
    remainingSec: 2,
    expiresAtTick: 100,
    magnitude: 1,
  });
  assert.equal(world.castPlayerSkill(player, 1, closeMob.id), false);
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'CASTER_STUNNED');
  player.clearAllStatuses();
});

test('4. Dano único, AoE (Redemoinho, Linha Colossal, Lâmina), cura clampada e ausência de alvos', () => {
  const { world } = createTestWorld();
  const conn = new MockConnection('conn_combat') as unknown as Connection;
  world.registerConnection(conn);
  world.handleAuthRegister(conn, { username: 'hero_combat', password: 'password123', email: 'combat@forja.com' });
  world.handleCreateCharacterSlot(conn, 0, 'CombatTester', CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn, 0);
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.level = 50;
  player.position = createVector3(0, 0, 0);

  // 4.1 Golpe Firme: dano único não duplica e devolve 5 Energia
  const mobA = new Monster('mob_A', 'Mob A', createVector3(2, 0, 0), 500, 5);
  world.entityManager.addMonster(mobA);
  world.spatialGrid.updateEntity(mobA);

  player.currentResource = 50;
  assert.ok(world.castPlayerSkill(player, 1, mobA.id));
  assert.equal(player.currentResource, 45); // consumiu 10 e restaurou 5 -> saldo 45
  const castEvt = (conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_EVENT);
  assert.equal(castEvt.affectedEntityIds.length, 1);
  assert.equal(castEvt.affectedEntityIds[0], mobA.id);
  assert.equal(mobA.currentHp < 500, true);

  // 4.2 Ausência de alvo em AoE é rejeitada com NO_VALID_TARGET
  // Afasta mobA para 20m
  mobA.position = createVector3(20, 0, 0);
  world.spatialGrid.updateEntity(mobA);
  assert.equal(world.castPlayerSkill(player, 3), false); // Redemoinho raio 5m
  assert.equal((conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_REJECTED)?.reasonCode, 'NO_VALID_TARGET');

  // 4.3 Redemoinho de Aço (raio 5m): atinge somente os dentro de 5m
  const mobIn1 = new Monster('mob_in1', 'In 1', createVector3(3, 0, 0), 500, 5);
  const mobIn2 = new Monster('mob_in2', 'In 2', createVector3(-2, 0, 2), 500, 5);
  const mobOut = new Monster('mob_out', 'Out', createVector3(6.5, 0, 0), 500, 5);
  world.entityManager.addMonster(mobIn1);
  world.entityManager.addMonster(mobIn2);
  world.entityManager.addMonster(mobOut);
  world.spatialGrid.updateEntity(mobIn1);
  world.spatialGrid.updateEntity(mobIn2);
  world.spatialGrid.updateEntity(mobOut);

  player.setSkillCooldown(3, 0);
  player.currentResource = 100;
  assert.ok(world.castPlayerSkill(player, 3));
  const whirlwindEvt = (conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_EVENT);
  assert.equal(whirlwindEvt.affectedEntityIds.includes('mob_in1'), true);
  assert.equal(whirlwindEvt.affectedEntityIds.includes('mob_in2'), true);
  assert.equal(whirlwindEvt.affectedEntityIds.includes('mob_out'), false);
  assert.equal(mobOut.currentHp, 500);

  // 4.4 Golpe Colossal (linha 4.5m x 3m com empurrão)
  world.equipPlayerSkill(player, 3, 'guerreiro_nv2_3');
  player.setSkillCooldown(3, 0);
  player.headingYaw = 90; // apontando para +X
  const mobLine = new Monster('mob_line', 'Line', createVector3(3, 0, 0), 500, 5);
  const mobBehind = new Monster('mob_behind', 'Behind', createVector3(-2, 0, 0), 500, 5);
  world.entityManager.addMonster(mobLine);
  world.entityManager.addMonster(mobBehind);
  world.spatialGrid.updateEntity(mobLine);
  world.spatialGrid.updateEntity(mobBehind);

  assert.ok(world.castPlayerSkill(player, 3, undefined, createVector3(4, 0, 0)));
  assert.equal(mobBehind.currentHp, 500); // atrás do guerreiro, não recebe dano
  assert.equal(mobLine.currentHp < 500, true);
  assert.ok(mobLine.position.x > 3.0); // empurrado para frente

  // 4.5 Retomar o Fôlego (Cura não excede HP Máximo)
  world.equipPlayerSkill(player, 2, 'guerreiro_nv1_1');
  player.currentHp = player.maxHp - 10;
  player.setSkillCooldown(2, 0);
  assert.ok(world.castPlayerSkill(player, 2));
  assert.equal(player.currentHp, player.maxHp);
  const healEvt = (conn as any).getLastPacket(Opcode.S2C_SKILL_CAST_EVENT);
  assert.equal(healEvt.damageOrHeal, 10); // cura efetiva clampada
});

test('5. Status autoritativos: Bleed ticks, Stun, Armor Break, Shield + Reflexão sem recursão, Avatar Buff, Imunidade', () => {
  const { world } = createTestWorld();
  const conn = new MockConnection('conn_status') as unknown as Connection;
  world.registerConnection(conn);
  world.handleAuthRegister(conn, { username: 'hero_st', password: 'password123', email: 'st@forja.com' });
  world.handleCreateCharacterSlot(conn, 0, 'StatusTester', CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn, 0);
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.level = 50;
  player.position = createVector3(0, 0, 0);

  const mob = new Monster('mob_target', 'Dummy', createVector3(2, 0, 0), 10000, 50);
  world.entityManager.addMonster(mob);
  world.spatialGrid.updateEntity(mob);

  // 5.1 Golpe Dilacerante -> Sangramento (Bleed) por 3s
  world.equipPlayerSkill(player, 1, 'guerreiro_truque_2');
  assert.ok(world.castPlayerSkill(player, 1, mob.id));
  assert.ok(mob.hasStatus('BLEED'));
  const hpAfterHit = mob.currentHp;

  // Avança 1 segundo: Bleed deve dar tick de dano
  world.update(1.0);
  assert.ok(mob.currentHp < hpAfterHit);
  const tickPacket = (conn as any).getLastPacket(Opcode.S2C_COMBAT_STATUS_EVENT);
  assert.equal(tickPacket.event, 'TICK');
  assert.equal(tickPacket.status.type, 'BLEED');

  // Avança até expirar (mais 2.5s)
  world.update(2.5);
  assert.equal(mob.hasStatus('BLEED'), false);

  // 5.2 Escudo Desarmador -> Stun de 1.5s
  world.equipPlayerSkill(player, 2, 'guerreiro_nv1_3');
  player.setSkillCooldown(2, 0);
  assert.ok(world.castPlayerSkill(player, 2, mob.id));
  assert.ok(mob.isStunned());

  // Garante determinismo total: DEX do jogador zerada para 0% de chance de esquiva mascarar falha
  const originalDex = player.attributes.destreza;
  player.attributes.destreza = 0;

  // Monstro atordoado não pode atacar nem se mover, mesmo com attackCooldown zerado
  mob.attackCooldown = 0;
  mob.targetPlayer = player;
  const playerHpBefore = player.currentHp;
  world.update(0.5);
  assert.equal(player.currentHp, playerHpBefore); // monstro não atacou

  // Restaura DEX
  player.attributes.destreza = originalDex;

  world.update(1.2); // expira stun
  assert.equal(mob.isStunned(), false);
  mob.targetPlayer = null;

  // 5.3 Corte de Ruptura -> Armor Break (+15% dano)
  world.equipPlayerSkill(player, 1, 'guerreiro_truque_3');
  player.setSkillCooldown(1, 0);
  assert.ok(world.castPlayerSkill(player, 1, mob.id));
  assert.ok(mob.hasStatus('ARMOR_BREAK'));
  assert.equal(mob.getArmorMultiplier(), 1.15);
  world.update(5.2);
  assert.equal(mob.hasStatus('ARMOR_BREAK'), false);
  assert.equal(mob.getArmorMultiplier(), 1.0);

  // 5.4 Baluarte Inquebrável (Escudo de 30% Max HP + 20% Reflexão sem recursão)
  player.currentHp = player.maxHp;
  player.currentResource = player.maxResource;
  world.equipPlayerSkill(player, 3, 'guerreiro_nv2_2');
  player.setSkillCooldown(3, 0);
  assert.ok(world.castPlayerSkill(player, 3));
  assert.ok(player.hasStatus('SHIELD'));

  const shieldStatus = player.getStatus('SHIELD')!;
  const initialShield = shieldStatus.remainingAbsorption!;
  assert.ok(initialShield > 0);

  // Monstro ataca o jogador com escudo
  const mobHpBeforeReflect = mob.currentHp;
  const dmgRes = player.takeDamage(100, mob);
  assert.equal(dmgRes.reflected, 20); // 20% de 100 = 20 refletido para o monstro
  assert.equal(mob.currentHp, mobHpBeforeReflect - 20); // monstro sofreu a reflexão
  assert.equal(player.currentHp, player.maxHp); // dano foi 100% absorvido pelo escudo
  assert.ok(dmgRes.refreshedShieldStatus);
  assert.equal(dmgRes.refreshedShieldStatus?.remainingAbsorption, initialShield - 100);

  // 5.5 Avatar da Guerra (+30% dano)
  player.currentResource = player.maxResource;
  world.equipPlayerSkill(player, 4, 'guerreiro_nv3_1');
  player.setSkillCooldown(4, 0);
  assert.ok(world.castPlayerSkill(player, 4));
  assert.ok(player.hasStatus('DAMAGE_BUFF'));
  assert.equal(player.getDamageMultiplier(), 1.30);
  world.update(10.2);
  assert.equal(player.hasStatus('DAMAGE_BUFF'), false);
  assert.equal(player.getDamageMultiplier(), 1.0);

  // 5.6 Última Resistência Imortal (HP não cai abaixo de 1 por 5s)
  player.currentResource = player.maxResource;
  world.equipPlayerSkill(player, 4, 'guerreiro_nv3_3');
  player.setSkillCooldown(4, 0);
  player.currentHp = 100;
  assert.ok(world.castPlayerSkill(player, 4));
  assert.ok(player.hasDeathImmunity());

  // Recebe 99999 de dano letal: deve sobreviver com 1 HP
  player.takeDamage(99999);
  assert.equal(player.currentHp, 1);
  assert.equal(player.isDead, false);

  // Expira imunidade
  world.update(5.2);
  assert.equal(player.hasDeathImmunity(), false);

  // Agora recebe dano letal e morre normalmente (sem auto-revive mágico imediato)
  player.takeDamage(player.currentHp);
  assert.equal(player.isDead, true);
  assert.equal(player.currentHp, 0);
});

test('6. PracticeArena é treino local e não envia dados nem altera banco multiplayer', async () => {
  // PracticeArena é estritamente cliente local e não toca no servidor nem no DB
  const { db } = createTestWorld();
  const charsBefore = db.getCharactersByAccountId('acc_local');
  assert.equal(charsBefore.length, 0);
});

test('7. Ciclo de vida do Boss e transição de mundo: vitória -> esperar além do respawn -> sem novas recompensas -> Mundo 2 sem Grimgor', () => {
  const { world } = createTestWorld();
  const conn = new MockConnection('conn_boss') as unknown as Connection;
  world.registerConnection(conn);
  world.handleAuthRegister(conn, { username: 'hero_boss', password: 'password123', email: 'boss@forja.com' });
  world.handleCreateCharacterSlot(conn, 0, 'BossSlayer', CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn, 0);
  const player = world.entityManager.getPlayer(conn.playerId!)!;
  player.level = 50;
  world.currentStage = 10;
  player.currentStage = 10;

  // 1. Inicia desafio do Chefão no Mundo 1 / Fase 10
  const challengeRes = world.challengeStageBoss(player);
  assert.equal(challengeRes.success, true);
  assert.equal(world.isBossActive, true);
  assert.ok(world.activeBossId);

  const boss = world.entityManager.getMonster(world.activeBossId!)!;
  assert.ok(boss);
  assert.equal(boss.name, 'Grimgor, o Senhor Rúnico da Floresta');
  assert.equal(boss.autoRespawns, false);
  assert.equal(boss.isBoss, true);

  const activeDropsBefore = world.activeItemDrops.size;

  // 2. Jogador derrota o Boss
  boss.takeDamage(boss.maxHp, player);
  world.handleMonsterDeath(boss, player);

  // Confirma vitória e abertura do portal
  assert.equal(world.isBossActive, false);
  assert.equal(world.activeBossId, null);
  assert.equal(world.isPortalOpen, true);
  assert.equal(world.entityManager.getMonster(boss.id), undefined);

  // Confirma envio do pacote de despawn com motivo DEAD
  const despawnPacket = (conn as any).getLastPacket(Opcode.S2C_ENTITY_DESPAWN);
  assert.equal(despawnPacket?.entityId, boss.id);
  assert.equal(despawnPacket?.reason, 'DEAD');

  // Confirma geração única de drops
  const activeDropsAfter = world.activeItemDrops.size;
  assert.ok(activeDropsAfter > activeDropsBefore);

  // 3. Esperar além do tempo de respawn padrão (6.5s) -> avança 10s no relógio
  world.update(10.0);

  // Confirma ausência de respawn e ausência de novas recompensas
  assert.equal(boss.isDead, true);
  assert.equal(world.entityManager.getMonster(boss.id), undefined);
  assert.equal(world.isBossActive, false);
  assert.equal(world.activeBossId, null);
  
  // Como o jogador estava a 4m dos drops, o auto-loot os recolheu na mochila
  const goldAfterLoot = player.gold;
  const invAfterLoot = player.inventory.length;
  const xpAfterLoot = player.currentXp;
  assert.equal(world.activeItemDrops.size, 0);

  // Avança mais 10s: confirma que nenhum novo drop, ouro ou EXP foi concedido (recompensa única)
  world.update(10.0);
  assert.equal(world.activeItemDrops.size, 0);
  assert.equal(player.gold, goldAfterLoot);
  assert.equal(player.inventory.length, invAfterLoot);
  assert.equal(player.currentXp, xpAfterLoot);
  assert.equal(world.entityManager.getMonster(boss.id), undefined);

  // 4. Jogador aproxima-se e atravessa o Portal para o Mundo 2
  player.position = cloneVector3(world.portalPosition);
  const portalRes = world.enterPortal(player);
  assert.equal(portalRes.success, true);

  // Confirma transição autoritativa para o Mundo 2 / Fase 1
  assert.equal(world.currentWorld, 2);
  assert.equal(player.currentWorld, 2);
  assert.equal(world.currentStage, 1);
  assert.equal(player.currentStage, 1);
  assert.equal(world.isPortalOpen, false);

  // 5. Confirma ausência total de Grimgor e de monstros da Floresta (Mundo 1) no Mundo 2
  assert.equal(world.entityManager.getMonster(boss.id), undefined);
  const monstersW2 = world.entityManager.getAllMonsters();
  assert.ok(!monstersW2.some((m) => m.name.includes('Grimgor')));
  assert.ok(!monstersW2.some((m) => m.id.startsWith('mob_w1_')));
  assert.ok(monstersW2.some((m) => m.id.startsWith('mob_w2_')));
  assert.ok(monstersW2.some((m) => m.name.includes('Glacial') || m.name.includes('Gelo') || m.name.includes('Jotunheim')));

  // 6. Avança mais 10s no Mundo 2: Grimgor continua sem existir
  world.update(10.0);
  assert.equal(world.entityManager.getMonster(boss.id), undefined);
  assert.ok(!world.entityManager.getAllMonsters().some((m) => m.name.includes('Grimgor')));
});

test('8. Preservação integral do herói com SQLite em disco fechado e reaberto, mochila expandida e configurações de farm', () => {
  const tempDbPath = path.join(os.tmpdir(), `magicforge_test_persist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.db`);
  const db = new DatabaseManager(tempDbPath);
  const world = new World(db);

  try {
    const conn = new MockConnection('conn_persist_test') as unknown as Connection;
    world.registerConnection(conn);
    world.handleAuthRegister(conn, { username: 'hero_persistence', password: 'password123', email: 'pers@forja.com' });
    world.handleCreateCharacterSlot(conn, 0, 'ValenteDeFerro', CharacterClass.GUERREIRO);
    world.handleSelectCharacterSlot(conn, 0);
    const player = world.entityManager.getPlayer(conn.playerId!)!;

    // 1. Configura estado avançado e rico no herói (Nível 50 para liberar slot 4 sem bloqueio)
    player.level = 50;
    player.currentXp = 4850;
    player.gold = 5432;
    player.rebornCount = 1;
    player.currentStage = 10;
    world.currentStage = 10;
    player.maxInventorySlots = 30; // Mochila expandida para 30 slots

    // Configurações de Farm customizadas (FarmHelperSettingsPayload)
    player.farmSettings = {
      autoHpPotionEnabled: true,
      autoHpPotionThreshold: 75,
      autoMpPotionEnabled: false,
      autoMpPotionThreshold: 40,
      autoSellCommon: true,
      autoSellUncommon: true,
      autoSellRare: false,
      autoLootEnabled: true,
    };

    // Equipamentos, Refinos e Gemas via db
    db.addItemToInventory(player.dbCharacterId, 'sword_iron_broadsword', 1, player.maxInventorySlots);
    db.addItemToInventory(player.dbCharacterId, 'armor_chainmail', 1, player.maxInventorySlots);
    db.addItemToInventory(player.dbCharacterId, 'potion_hp_major', 10, player.maxInventorySlots);
    db.addItemToInventory(player.dbCharacterId, 'stone_forge_common', 15, player.maxInventorySlots);
    db.addItemToInventory(player.dbCharacterId, 'gem_ruby_str', 3, player.maxInventorySlots);

    // Adiciona item especificamente alocado no slotIndex 24 (slot expandido acima de 19)
    (db as any).db.prepare(
      'INSERT INTO inventory (id, character_id, slot_index, item_id, quantity, is_equipped, refine_level) VALUES (?, ?, ?, ?, ?, 0, 0)'
    ).run(`inv_slot24_${Date.now()}`, player.dbCharacterId, 24, 'stone_forge_common', 8);

    // Equipa a espada e a armadura
    let inv = db.getInventory(player.dbCharacterId);
    const swordSlot = inv.find((i) => i.itemId === 'sword_iron_broadsword')!.slotIndex;
    const armorSlot = inv.find((i) => i.itemId === 'armor_chainmail')!.slotIndex;
    db.toggleEquipItem(player.dbCharacterId, swordSlot, player.classType, player.level, player.attributes);
    db.toggleEquipItem(player.dbCharacterId, armorSlot, player.classType, player.level, player.attributes);

    // Aplica refinos (+7 na arma, +5 na armadura)
    db.refineEquipmentItem(player.dbCharacterId, swordSlot, 7);
    db.refineEquipmentItem(player.dbCharacterId, armorSlot, 5);

    // Engasta gema de rubi no soquete 0 da espada
    db.socketGem(player.dbCharacterId, swordSlot, 0, 'gem_ruby_str');

    // Adiciona cartas
    db.addCharacterCard(player.dbCharacterId, 'card_wolf');
    db.addCharacterCard(player.dbCharacterId, 'card_slime');
    db.setEquippedCard(player.dbCharacterId, 'card_wolf', 'ARMA', true);

    // Loadout de 4 habilidades desbloqueadas (nível 50 desbloqueia slot 4 com sucesso)
    const eq1 = world.equipPlayerSkill(player, 1, 'guerreiro_truque_2');
    const eq2 = world.equipPlayerSkill(player, 2, 'guerreiro_nv1_3');
    const eq3 = world.equipPlayerSkill(player, 3, 'guerreiro_nv2_2');
    const eq4 = world.equipPlayerSkill(player, 4, 'guerreiro_nv3_1');
    assert.equal(eq1, true, 'Slot 1 deve equipar com sucesso');
    assert.equal(eq2, true, 'Slot 2 deve equipar com sucesso');
    assert.equal(eq3, true, 'Slot 3 deve equipar com sucesso');
    assert.equal(eq4, true, 'Slot 4 deve equipar com sucesso no nível 50');

    // Salva e sincroniza tudo
    player.inventory = db.getInventory(player.dbCharacterId);
    player.cards = db.getCharacterCards(player.dbCharacterId);
    player.recalculateStatsFromEquipment();
    db.savePlayer(player);

    // 2. Snapshot antes do portal
    const snapshotBefore = {
      level: player.level,
      xp: player.currentXp,
      gold: player.gold,
      rebornCount: player.rebornCount,
      maxInventorySlots: player.maxInventorySlots,
      skills: { ...player.equippedSkills },
      inventory: JSON.parse(JSON.stringify(player.inventory)),
      cards: JSON.parse(JSON.stringify(player.cards)),
      attributes: { ...player.attributes },
      combatPower: player.CombatPower,
      farm: { ...player.farmSettings },
    };

    assert.equal(snapshotBefore.maxInventorySlots, 30);
    assert.ok(snapshotBefore.inventory.some((i: any) => i.slotIndex === 24 && i.itemId === 'stone_forge_common' && i.quantity === 8));
    assert.equal(snapshotBefore.inventory.find((i: any) => i.itemId === 'sword_iron_broadsword').refineLevel, 7);
    assert.equal(snapshotBefore.inventory.find((i: any) => i.itemId === 'sword_iron_broadsword').sockets[0].gemId, 'gem_ruby_str');
    assert.equal(snapshotBefore.cards.find((c: any) => c.cardId === 'card_wolf').isEquipped, true);

    // 3. Atravessar o Portal para o Mundo 2
    world.isPortalOpen = true;
    player.position = cloneVector3(world.portalPosition);
    const portalRes = world.enterPortal(player);
    assert.equal(portalRes.success, true);

    // Verifica mudança de localização e estágio
    assert.equal(world.currentWorld, 2);
    assert.equal(player.currentWorld, 2);
    assert.equal(world.currentStage, 1);
    assert.equal(player.currentStage, 1);
    assert.equal(player.position.x, 0);
    assert.equal(player.position.z, -10);

    // Verifica preservação imediata após o portal (incluindo farm e mochila expandida)
    assert.equal(player.level, snapshotBefore.level);
    assert.equal(player.currentXp, snapshotBefore.xp);
    assert.equal(player.gold, snapshotBefore.gold);
    assert.equal(player.rebornCount, snapshotBefore.rebornCount);
    assert.equal(player.maxInventorySlots, 30);
    assert.deepEqual(player.farmSettings, snapshotBefore.farm);
    assert.deepEqual(player.equippedSkills, snapshotBefore.skills);
    assert.deepEqual(player.inventory, snapshotBefore.inventory);
    assert.deepEqual(player.cards, snapshotBefore.cards);
    assert.deepEqual(player.attributes, snapshotBefore.attributes);
    assert.equal(player.CombatPower, snapshotBefore.combatPower);

    // 4. FECHAMENTO REAL DO BANCO E REINÍCIO DO PROCESSO
    world.unregisterConnection(conn);
    db.close(); // Fechamento real do SQLite em disco!

    // Reabre uma NOVA conexão apontando para o MESMO arquivo em disco
    const reloadedDb = new DatabaseManager(tempDbPath);
    const reloadedWorld = new World(reloadedDb);
    const newConn = new MockConnection('conn_reconnect') as unknown as Connection;
    reloadedWorld.registerConnection(newConn);
    reloadedWorld.handleAuthLogin(newConn, { username: 'hero_persistence', password: 'password123' });
    reloadedWorld.handleSelectCharacterSlot(newConn, 0);

    const reconnectedPlayer = reloadedWorld.entityManager.getPlayer(newConn.playerId!)!;
    assert.ok(reconnectedPlayer);

    // 5. Compara estado preservado após reabertura real do banco
    assert.equal(reconnectedPlayer.currentWorld, 2);
    assert.equal(reconnectedPlayer.currentStage, 1);
    assert.equal(reloadedWorld.currentWorld, 2);
    assert.equal(reconnectedPlayer.level, snapshotBefore.level);
    assert.equal(reconnectedPlayer.currentXp, snapshotBefore.xp);
    assert.equal(reconnectedPlayer.gold, snapshotBefore.gold);
    assert.equal(reconnectedPlayer.rebornCount, snapshotBefore.rebornCount);
    assert.equal(reconnectedPlayer.maxInventorySlots, 30);
    assert.deepEqual(reconnectedPlayer.farmSettings, snapshotBefore.farm);
    assert.deepEqual(reconnectedPlayer.equippedSkills, snapshotBefore.skills);
    assert.deepEqual(reconnectedPlayer.inventory, snapshotBefore.inventory);
    assert.deepEqual(reconnectedPlayer.cards, snapshotBefore.cards);
    assert.deepEqual(reconnectedPlayer.attributes, snapshotBefore.attributes);
    assert.equal(reconnectedPlayer.CombatPower, snapshotBefore.combatPower);
    assert.equal(reconnectedPlayer.position.x, 0);
    assert.equal(reconnectedPlayer.position.z, -10);

    // Confirma preservação do item no slot 24 da mochila expandida
    const slot24Item = reconnectedPlayer.inventory.find((i) => i.slotIndex === 24);
    assert.ok(slot24Item, 'Item no slot expandido 24 deve ser preservado após reabertura do banco');
    assert.equal(slot24Item?.itemId, 'stone_forge_common');
    assert.equal(slot24Item?.quantity, 8);

    // 6. Dados dos inimigos do Mundo 2 no novo World
    const monstersMundo2 = reloadedWorld.entityManager.getAllMonsters();
    assert.ok(monstersMundo2.length > 0);
    assert.ok(monstersMundo2.every((m) => m.id.startsWith('mob_w2_')));
    assert.ok(monstersMundo2.some((m) => m.name === 'Slime Glacial'));
    assert.ok(monstersMundo2.some((m) => m.name === 'Guerreiro do Gelo'));
    assert.ok(monstersMundo2.some((m) => m.name === 'Arqueiro da Neve'));
    assert.ok(monstersMundo2.some((m) => m.name === 'Lobo de Jotunheim'));
    assert.ok(monstersMundo2.some((m) => m.name === 'Chefe Yetin'));

    // 7. Dados do Chefe do Mundo 2 (Frostbite)
    reloadedWorld.currentStage = 10;
    reconnectedPlayer.currentStage = 10;
    const challengeFrostbite = reloadedWorld.challengeStageBoss(reconnectedPlayer);
    assert.equal(challengeFrostbite.success, true);
    const frostbite = reloadedWorld.entityManager.getMonster(reloadedWorld.activeBossId!)!;
    assert.ok(frostbite);
    assert.equal(frostbite.name, 'Frostbite, a Matriarca dos Lobos Gélidos');
    assert.equal(frostbite.maxHp, 15000);
    assert.equal(frostbite.attackDamage, 95);
    assert.equal(frostbite.expReward, 3800);
    assert.equal(frostbite.isBoss, true);
    assert.equal(frostbite.autoRespawns, false);

    // Derrota Frostbite e confirma transição/portal para o Mundo 3
    frostbite.takeDamage(frostbite.maxHp, reconnectedPlayer);
    reloadedWorld.handleMonsterDeath(frostbite, reconnectedPlayer);
    assert.equal(reloadedWorld.isPortalOpen, true);
    assert.equal(reloadedWorld.entityManager.getMonster(frostbite.id), undefined);

    reloadedDb.close();
  } finally {
    try {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
      const walPath = `${tempDbPath}-wal`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      const shmPath = `${tempDbPath}-shm`;
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {
      // ignore cleanup errors
    }
  }
});

test('9. Dois jogadores em mundos diferentes: isolamento de dados no banco e diagnóstico da arena física', () => {
  const { world, db } = createTestWorld();

  // Cria Jogador 1 (Mundo 1, Fase 5)
  const conn1 = new MockConnection('conn_p1') as unknown as Connection;
  world.registerConnection(conn1);
  world.handleAuthRegister(conn1, { username: 'player_w1', password: 'password123', email: 'p1@forja.com' });
  world.handleCreateCharacterSlot(conn1, 0, 'GuerreiroMundo1', CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn1, 0);
  const p1 = world.entityManager.getPlayer(conn1.playerId!)!;
  p1.level = 15;
  p1.gold = 1000;
  p1.currentWorld = 1;
  p1.currentStage = 5;
  db.savePlayer(p1);

  // Cria Jogador 2 (Mundo 2, Fase 3)
  const conn2 = new MockConnection('conn_p2') as unknown as Connection;
  world.registerConnection(conn2);
  world.handleAuthRegister(conn2, { username: 'player_w2', password: 'password123', email: 'p2@forja.com' });
  world.handleCreateCharacterSlot(conn2, 0, 'GuerreiroMundo2', CharacterClass.GUERREIRO);
  world.handleSelectCharacterSlot(conn2, 0);
  const p2 = world.entityManager.getPlayer(conn2.playerId!)!;
  p2.level = 30;
  p2.gold = 8000;
  p2.currentWorld = 2;
  p2.currentStage = 3;
  db.savePlayer(p2);

  // 1. Verifica persistência independente no banco
  const p1Record = db.getCharacterById(p1.dbCharacterId)!;
  const p2Record = db.getCharacterById(p2.dbCharacterId)!;

  assert.equal(p1Record.current_world, 1);
  assert.equal(p1Record.current_stage, 5);
  assert.equal(p1Record.level, 15);
  assert.equal(p1Record.gold, 1000);

  assert.equal(p2Record.current_world, 2);
  assert.equal(p2Record.current_stage, 3);
  assert.equal(p2Record.level, 30);
  assert.equal(p2Record.gold, 8000);

  // 2. Simula Jogador 1 avançando e entrando no Mundo 2 pelo portal
  p1.currentStage = 10;
  world.currentStage = 10;
  world.isPortalOpen = true;
  p1.position = cloneVector3(world.portalPosition);
  const portalRes = world.enterPortal(p1);
  assert.equal(portalRes.success, true);
  assert.equal(p1.currentWorld, 2);
  assert.equal(p1.currentStage, 1);

  // Confirma que os dados de P2 no banco não foram alterados ou corrompidos
  const p2RecordAfter = db.getCharacterById(p2.dbCharacterId)!;
  assert.equal(p2RecordAfter.current_world, 2);
  assert.equal(p2RecordAfter.current_stage, 3);
  assert.equal(p2RecordAfter.level, 30);
  assert.equal(p2RecordAfter.gold, 8000);

  // 3. Diagnóstico de Arquitetura:
  // A classe World atual possui uma arena única com 'world.currentWorld'.
  // Se P1 e P2 compartilham a mesma instância de World simultaneamente,
  // os monstros da arena pertencem ao mundo ativo do servidor.
  // A solução definitiva para salas particionadas é um WorldManager multi-instância (proposta documentada).
  assert.equal(world.currentWorld, 2);
  assert.ok(world.entityManager.getAllMonsters().every((m) => m.id.startsWith('mob_w2_')));
});
