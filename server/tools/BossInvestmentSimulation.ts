import { CharacterClass, EquipmentSlot, ITEMS_DATABASE, ItemType, Opcode, SKILLS_DATABASE, getSkillUpgradeCost, getSkillLevel, FUSION_RECIPES, getFusionPreview, getSkillTargeting, distance, isValidSkillCastOrder } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import type { Connection } from '../src/network/Connection';

export type BossInvestment = 'none' | 'skill' | 'weapon' | 'sustain' | 'fusion';

/** A controlled one-boss fight. Each alternative starts from the same supplied fixture and gold budget. */
export function simulateBossInvestment(options: {
  classType: CharacterClass; level: number; world: number; seed: number; investment: BossInvestment; goldBudget?: number; skillSelections?: Record<number, string>;
  collectDiagnostics?: boolean;
  /** Fixture-only experiments; never saved to the live database or production defaults. */
  resourceRegenPerSec?: number;
  skillCastOrder?: number[];
}) {
  if (!Number.isInteger(options.level) || options.level < 1 || !Number.isInteger(options.world) || options.world < 1) {
    throw new Error('Invalid boss fixture');
  }
  const budget = options.goldBudget ?? 1000;
  if (!Number.isInteger(budget) || budget < 0 || budget > 10000) throw new Error('Invalid gold budget');
  if (options.resourceRegenPerSec !== undefined && (!Number.isFinite(options.resourceRegenPerSec) || options.resourceRegenPerSec < 0 || options.resourceRegenPerSec > 100)) throw new Error('Invalid fixture regeneration');
  if (options.skillCastOrder && !isValidSkillCastOrder(options.skillCastOrder)) throw new Error('Invalid fixture rotation');
  const originalRandom = Math.random, originalNow = Date.now, originalLog = console.log;
  let state = options.seed >>> 0, tick = 0;
  let db: DatabaseManager | undefined;
  try {
    Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    Date.now = () => 1_800_000_000_000 + tick * 50;
    console.log = () => {};
    db = new DatabaseManager(':memory:');
    const world = new World(db, options.world, 1);
    for (const monster of world.entityManager.getAllMonsters()) {
      world.entityManager.removeMonster(monster.id); world.spatialGrid.removeEntity(monster.id);
    }
    const account = db.getOrCreateAccount('boss_fixture');
    const player = db.createCharacterInSlot('boss_fixture', account.id, 0, 'BossFixture', options.classType);
    player.level = options.level;
    player.currentWorld = player.unlockedWorld = options.world;
    player.currentStage = 9;
    player.recalculateStatsFromEquipment();
    if (options.resourceRegenPerSec !== undefined) player.resourceRegenPerSec = options.resourceRegenPerSec;
    const telemetry = {
      sampledSeconds: 0, energySum: 0, samples: 0, minimumEnergy: 0, energyBelow20Seconds: 0,
      anyReadySkillEnergyBlockedSeconds: 0, noAffordableReadySkillSeconds: 0,
      incomingDamage: 0, minimumHp: 0,
      bySkill: {} as Record<string, { casts: number; energySpent: number; directDamage: number; periodicDamage: number; healing: number; readyButEnergyBlockedSeconds: number }>,
      casts: [] as Array<{ seconds: number; skillId: string; slot: number; energyBefore: number; energyAfter: number; hpBefore: number; bossHpBefore: number }>,
    };
    const skillTelemetry = (id: string) => telemetry.bySkill[id] ??= { casts: 0, energySpent: 0, directDamage: 0, periodicDamage: 0, healing: 0, readyButEnergyBlockedSeconds: 0 };
    const combat = { basicAttacks:0, basicDamage:0, skillCasts:0, skillDamage:0, statusDamage:0, periodicHealing:0, effectiveHealing:0, movementCasts:0, ineffectiveCasts:0, rejections:0, outOfRange:0 };
    const connection = { id: player.id, accountId: account.id, isAuthenticated: true, send(op: Opcode, data: any) {
      if(op===Opcode.S2C_COMBAT_EVENT&&data.attackerId===player.id&&data.damageSource==='BASIC_ATTACK'){combat.basicAttacks++;combat.basicDamage+=data.damage;}
      if(op===Opcode.S2C_COMBAT_EVENT&&data.attackerId===player.id&&data.damageSource==='STATUS_TICK')combat.statusDamage+=data.damage;
      if(op===Opcode.S2C_COMBAT_STATUS_EVENT&&data.status?.sourceEntityId===player.id)combat.periodicHealing+=data.tickHeal??0;
      if (options.collectDiagnostics) {
        if (op === Opcode.S2C_COMBAT_EVENT && data.targetId === player.id) telemetry.incomingDamage += data.damage;
        if (op === Opcode.S2C_COMBAT_STATUS_EVENT && data.status?.sourceEntityId === player.id && data.event === 'TICK') {
          skillTelemetry(data.status.skillId).periodicDamage += data.tickDamage ?? 0;
          skillTelemetry(data.status.skillId).healing += data.tickHeal ?? 0;
        }
        if (op === Opcode.S2C_SKILL_CAST_EVENT && data.casterId === player.id) {
          const row = skillTelemetry(data.skillId);
          row.directDamage += (data.targetResults ?? []).reduce((sum: number, result: any) => sum + result.effectiveDamage, 0);
          row.healing += (data.targetResults ?? []).reduce((sum: number, result: any) => sum + result.effectiveHeal, 0);
        }
      }
      if(op===Opcode.S2C_SKILL_CAST_EVENT&&data.casterId===player.id){
        combat.skillCasts++;combat.skillDamage+=(data.targetResults??[]).reduce((n:number,r:any)=>n+r.effectiveDamage,0);
        combat.effectiveHealing+=(data.targetResults??[]).reduce((n:number,r:any)=>n+r.effectiveHeal,0);
        const moved=data.skillId==='bruxo_nv2_3'&&data.originPosition&&data.targetPosition&&Math.hypot(data.originPosition.x-data.targetPosition.x,data.originPosition.z-data.targetPosition.z)>.1;
        if(moved)combat.movementCasts++;
        if(!data.damageOrHeal&&!data.appliedStatuses?.length&&!moved)combat.ineffectiveCasts++;
      }
      if(op===Opcode.S2C_SKILL_CAST_REJECTED){combat.rejections++;if(data.reasonCode==='OUT_OF_RANGE')combat.outOfRange++;}
    } } as unknown as Connection;
    world.enterWorld(connection, player);
    for (const [slotKey, skillId] of Object.entries(options.skillSelections ?? {})) {
      const slot=Number(slotKey), skill=SKILLS_DATABASE[skillId];
      if (!skill || skill.classType!==player.classType || skill.slot!==slot || skill.unlockLevel>player.level) throw new Error('Invalid skill selection in boss fixture');
      world.equipPlayerSkill(player,slot,skillId);
      if (player.getEquippedSkill(slot)!==skillId) throw new Error('Skill selection rejected in boss fixture');
    }
    const weapon = player.inventory.find(item => ITEMS_DATABASE[item.itemId]?.type === ItemType.EQUIPAMENTO &&
      ITEMS_DATABASE[item.itemId].equipmentSlot === EquipmentSlot.ARMA)!;
    world.usePlayerItem(player, weapon.slotIndex);
    const starterEquipped = player.inventory.some(item=>item.instanceId===weapon.instanceId&&item.isEquipped);
    // Supplied to every alternative; these stocks are fixtures, not farm rewards or a new shop.
    db.addItemToInventory(player.dbCharacterId, 'arcane_dust', 20);
    db.addItemToInventory(player.dbCharacterId, 'stone_forge_common', 3);
    db.addItemToInventory(player.dbCharacterId, 'ore_iron_arcane', 6);
    for(let n=0;n<3;n++)db.addItemToInventory(player.dbCharacterId,'sword_iron_broadsword');
    player.inventory = db.getInventory(player.dbCharacterId);
    player.gold = db.updateCharacterGold(player.dbCharacterId, budget - player.gold);
    player.farmSettings.autoLootEnabled = false;
    const beforeStats = { ...player.attributes, maxHp: player.maxHp };
    let unavailable: string | null = null;
    let upgradeId = player.getEquippedSkill(1);
    if (options.investment === 'sustain') {
      const heal = Object.values(SKILLS_DATABASE).find(skill => skill.classType === player.classType && skill.isHeal && skill.unlockLevel <= player.level)
        ?? (player.classType === CharacterClass.BARBARO ? SKILLS_DATABASE.barbaro_truque_3 : undefined);
      if (!heal) unavailable = 'Nenhuma habilidade de cura implementada e liberada neste nível.';
      else {
        world.equipPlayerSkill(player, heal.slot, heal.skillId);
        player.skillCastOrder = [heal.slot, ...player.skillCastOrder.filter(slot => slot !== heal.slot)];
        upgradeId = heal.skillId;
      }
    }
    if(options.investment==='fusion'){
      const recipe=Object.values(FUSION_RECIPES).find(recipe=>recipe.classes.includes(player.classType)&&ITEMS_DATABASE[recipe.outputItemId].equipmentSlot===EquipmentSlot.ARMA)!;
      const preview=getFusionPreview(recipe,player.inventory,{classType:player.classType,level:player.level,gold:player.gold});
      if(preview.reason)unavailable=preview.reason;
      else {
        const result=db.fuseEquipment(player,{requestId:'boss-fusion-fixture-0001',recipeId:recipe.id,recipeVersion:recipe.version,inputInstanceIds:preview.selected.map(item=>item.instanceId!)});
        player.inventory=db.getInventory(player.dbCharacterId);player.gold=db.getCharacterGold(player.dbCharacterId);
        world.usePlayerItem(player,player.inventory.find(item=>item.instanceId===result.outputInstanceId)!.slotIndex);
      }
    }
    if (options.investment === 'weapon'&&!starterEquipped) unavailable='Arma inicial não equipável pela classe.';
    if (options.investment === 'weapon'&&!unavailable) {
      for (let rank = 0; rank < 3 && player.gold >= 500; rank++) world.refinePlayerEquipment(player, player.inventory.find(item => item.instanceId === weapon.instanceId)!.slotIndex);
    }
    if (!unavailable && (options.investment === 'skill' || options.investment === 'sustain')) {
      const skill = SKILLS_DATABASE[upgradeId];
      for (;;) {
        const level = getSkillLevel(player.skillLevels, upgradeId), cost = getSkillUpgradeCost(skill, level);
        if (!cost || cost.gold > player.gold || !db.hasItemQuantity(player.dbCharacterId, 'arcane_dust', cost.dust)) break;
        const result = db.upgradeCharacterSkill(player, skill.skillId, level);
        Object.assign(player, { skillLevels: result.skillLevels, gold: result.gold, inventory: result.inventory });
      }
    }
    const spentGold = budget - player.gold;
    const afterStats = { ...player.attributes, maxHp: player.maxHp };
    const skillLevels = { ...player.skillLevels };
    const equippedWeapon=player.inventory.find(item=>item.isEquipped&&ITEMS_DATABASE[item.itemId]?.equipmentSlot===EquipmentSlot.ARMA)?.itemId;
    const materialsUsed={dust:20-player.inventory.filter(item=>item.itemId==='arcane_dust').reduce((n,item)=>n+item.quantity,0),stones:3-player.inventory.filter(item=>item.itemId==='stone_forge_common').reduce((n,item)=>n+item.quantity,0),ore:6-player.inventory.filter(item=>item.itemId==='ore_iron_arcane').reduce((n,item)=>n+item.quantity,0)};
    const weaponRefine = player.inventory.find(item => item.instanceId === weapon.instanceId)?.refineLevel ?? 0;
    const selectedSkills = Object.fromEntries([1,2,3,4].map(slot => [slot,player.getEquippedSkill(slot)]));
    if (options.skillCastOrder) { player.skillCastOrder = [...options.skillCastOrder]; player.skillRotationCursor = 0; }
    const skillCastOrder = [...player.skillCastOrder];
    if (unavailable) return { ...options, budget, unavailable, spentGold, beforeStats, afterStats, skillLevels, selectedSkills, skillCastOrder, weaponRefine, starterEquipped, equippedWeapon, materialsUsed, combat,
      diagnostics: undefined, outcome: 'unavailable', seconds: 0, bossHpRemainingPercent: null, hpPotionsUsed: 0 };
    player.currentHp = player.maxHp;
    player.currentResource = player.maxResource;
    player.huntSession.reset();
    // Reset after setup/purchases so paired fights start from the same combat random stream.
    state = options.seed >>> 0;
    world.challengeStageBoss(player);
    const boss = world.entityManager.getMonster(world.activeBossId!)!;
    if (options.collectDiagnostics) {
      telemetry.minimumEnergy = player.currentResource;
      telemetry.minimumHp = player.currentHp;
      const cast = world.castPlayerSkill.bind(world);
      world.castPlayerSkill = (caster, slot, targetId, targetPosition) => {
        const energyBefore = caster.currentResource, hpBefore = caster.currentHp, bossHpBefore = boss.currentHp;
        const id = caster.getEquippedSkill(slot);
        const success = cast(caster, slot, targetId, targetPosition);
        if (success && caster === player) {
          const row = skillTelemetry(id);
          row.casts++;
          row.energySpent += Math.max(0, energyBefore - caster.currentResource);
          telemetry.casts.push({ seconds: (tick + 1) / 20, skillId: id, slot, energyBefore, energyAfter: caster.currentResource, hpBefore, bossHpBefore });
          telemetry.minimumEnergy = Math.min(telemetry.minimumEnergy, caster.currentResource);
        }
        return success;
      };
    }
    let outcome = 'timeout';
    for (tick = 0; tick < 1200; tick++) {
      if (options.collectDiagnostics && !player.isDead && !boss.isDead) {
        telemetry.sampledSeconds += .05;
        telemetry.samples++;
        telemetry.energySum += player.currentResource;
        telemetry.minimumEnergy = Math.min(telemetry.minimumEnergy, player.currentResource);
        telemetry.minimumHp = Math.min(telemetry.minimumHp, player.currentHp);
        if (player.currentResource < 20) telemetry.energyBelow20Seconds += .05;
        let blocked = false, affordable = false;
        for (const slot of player.skillCastOrder) {
          const skill = SKILLS_DATABASE[player.getEquippedSkill(slot)];
          if (!skill || player.level < skill.unlockLevel || player.getSkillCooldown(slot) > 0 || player.isStunned() || player.isSilenced()) continue;
          const targeting = getSkillTargeting(skill);
          if (targeting.category !== 'SELF_BUFF' && targeting.category !== 'SELF_HEAL' && distance(player.position, boss.position) > targeting.reach + .5) continue;
          if (skill.isHeal && !['barbaro_nv2_2','guerreiro_nv3_3','clerigo_nv2_3'].includes(skill.skillId) && player.currentHp >= player.maxHp) continue;
          const cost = player.classType === CharacterClass.BARBARO && player.hasStatus('UNBRIDLED_RAGE') ? 0 : skill.cost;
          if (player.currentResource < cost) { blocked = true; skillTelemetry(skill.skillId).readyButEnergyBlockedSeconds += .05; }
          else affordable = true;
        }
        if (blocked) telemetry.anyReadySkillEnergyBlockedSeconds += .05;
        if (blocked && !affordable) telemetry.noAffordableReadySkillSeconds += .05;
      }
      world.update(0.05);
      if (boss.isDead) { outcome = 'victory'; break; }
      if (player.huntSession.snapshot().deaths > 0) { outcome = 'death'; break; }
      if (!world.isBossActive) break;
    }
    const diagnostics = options.collectDiagnostics ? { ...telemetry, meanEnergy: telemetry.energySum / Math.max(1, telemetry.samples), resourceRegenPerSec: player.resourceRegenPerSec } : undefined;
    return { ...options, budget, unavailable, spentGold, beforeStats, afterStats, skillLevels, selectedSkills, skillCastOrder, weaponRefine, starterEquipped, equippedWeapon, materialsUsed, combat, diagnostics,
      outcome, seconds: Math.min(60, (tick + 1) / 20),
      bossHpRemainingPercent: Number((100 * boss.currentHp / boss.maxHp).toFixed(2)),
      hpPotionsUsed: player.huntSession.snapshot().hpPotionsUsed };
  } finally {
    db?.close(); Math.random = originalRandom; Date.now = originalNow; console.log = originalLog;
  }
}
