import { CharacterClass, EquipmentSlot, ITEMS_DATABASE, ItemType, Opcode, SKILLS_DATABASE, getSkillUpgradeCost, getSkillLevel, FUSION_RECIPES, getFusionPreview } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { World } from '../src/game/World';
import type { Connection } from '../src/network/Connection';

export type BossInvestment = 'none' | 'skill' | 'weapon' | 'sustain' | 'fusion';

/** A controlled one-boss fight. Each alternative starts from the same supplied fixture and gold budget. */
export function simulateBossInvestment(options: {
  classType: CharacterClass; level: number; world: number; seed: number; investment: BossInvestment; goldBudget?: number; skillSelections?: Record<number, string>;
}) {
  if (!Number.isInteger(options.level) || options.level < 1 || !Number.isInteger(options.world) || options.world < 1) {
    throw new Error('Invalid boss fixture');
  }
  const budget = options.goldBudget ?? 1000;
  if (!Number.isInteger(budget) || budget < 0 || budget > 10000) throw new Error('Invalid gold budget');
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
    const combat = { basicAttacks:0, basicDamage:0, skillCasts:0, skillDamage:0, statusDamage:0, periodicHealing:0, effectiveHealing:0, ineffectiveCasts:0, rejections:0, outOfRange:0 };
    const connection = { id: player.id, accountId: account.id, isAuthenticated: true, send(op: Opcode, data: any) {
      if(op===Opcode.S2C_COMBAT_EVENT&&data.attackerId===player.id&&data.damageSource==='BASIC_ATTACK'){combat.basicAttacks++;combat.basicDamage+=data.damage;}
      if(op===Opcode.S2C_COMBAT_EVENT&&data.attackerId===player.id&&data.damageSource==='STATUS_TICK')combat.statusDamage+=data.damage;
      if(op===Opcode.S2C_COMBAT_STATUS_EVENT&&data.status?.sourceEntityId===player.id)combat.periodicHealing+=data.tickHeal??0;
      if(op===Opcode.S2C_SKILL_CAST_EVENT&&data.casterId===player.id){
        combat.skillCasts++;combat.skillDamage+=(data.targetResults??[]).reduce((n:number,r:any)=>n+r.effectiveDamage,0);
        combat.effectiveHealing+=(data.targetResults??[]).reduce((n:number,r:any)=>n+r.effectiveHeal,0);
        if(!data.damageOrHeal&&!data.appliedStatuses?.length)combat.ineffectiveCasts++;
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
      const heal = Object.values(SKILLS_DATABASE).find(skill => skill.classType === player.classType && skill.isHeal && skill.unlockLevel <= player.level);
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
    if (unavailable) return { ...options, budget, unavailable, spentGold, beforeStats, afterStats, skillLevels, weaponRefine, starterEquipped, equippedWeapon, materialsUsed, combat,
      outcome: 'unavailable', seconds: 0, bossHpRemainingPercent: null, hpPotionsUsed: 0 };
    player.currentHp = player.maxHp;
    player.currentResource = player.maxResource;
    player.huntSession.reset();
    // Reset after setup/purchases so paired fights start from the same combat random stream.
    state = options.seed >>> 0;
    world.challengeStageBoss(player);
    const boss = world.entityManager.getMonster(world.activeBossId!)!;
    let outcome = 'timeout';
    for (tick = 0; tick < 1200; tick++) {
      world.update(0.05);
      if (boss.isDead) { outcome = 'victory'; break; }
      if (player.huntSession.snapshot().deaths > 0) { outcome = 'death'; break; }
      if (!world.isBossActive) break;
    }
    return { ...options, budget, unavailable, spentGold, beforeStats, afterStats, skillLevels, weaponRefine, starterEquipped, equippedWeapon, materialsUsed, combat,
      outcome, seconds: Math.min(60, (tick + 1) / 20),
      bossHpRemainingPercent: Number((100 * boss.currentHp / boss.maxHp).toFixed(2)),
      hpPotionsUsed: player.huntSession.snapshot().hpPotionsUsed };
  } finally {
    db?.close(); Math.random = originalRandom; Date.now = originalNow; console.log = originalLog;
  }
}
