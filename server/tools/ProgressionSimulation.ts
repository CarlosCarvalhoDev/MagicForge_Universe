import { CharacterClass, Opcode, ITEMS_DATABASE, ItemType, EquipmentSlot, SKILLS_DATABASE, getSkillUpgradeCost, bagItems } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { WorldManager } from '../src/game/WorldManager';
import type { Connection } from '../src/network/Connection';
import { calculateOfflineReward } from '../src/game/OfflineRewards';
import { FUSION_RECIPES, getFusionPreview } from '@magicforge/shared';
import { getEquipmentSuggestions, getSkillLevel } from '@magicforge/shared';
import { manageSimulationInventory, type InventorySimulationPolicy, type SimulationAction } from './InventorySimulationPolicy';

export type ProgressionInvestment = 'none' | 'skill' | 'equipment' | 'fusion';

export interface SimulationOptions {
  classType: CharacterClass;
  seconds: number;
  seed: number;
  equipStarter?: boolean;
  autoSellEquipment?: boolean;
  collectFusionMilestones?: boolean;
  investment?: ProgressionInvestment;
  equipmentScoring?: 'conservative' | 'class-weighted';
  startingLevel?: number;
  startingWorld?: number;
  inventoryPolicy?: InventorySimulationPolicy;
}

/** Sequential, isolated CLI/test use only: RNG and Date.now are restored before returning. */
export function simulateProgression(options: SimulationOptions) {
  if (!Number.isInteger(options.seconds) || options.seconds < 1 || options.seconds > 7200) {
    throw new Error('Use uma duração inteira de 1 a 7200 segundos.');
  }
  const startingLevel = options.startingLevel ?? 1, startingWorld = options.startingWorld ?? 1;
  if (!Number.isInteger(startingLevel) || startingLevel < 1 || startingLevel > 50 ||
      !Number.isInteger(startingWorld) || startingWorld < 1 || startingWorld > 4) throw new Error('Invalid starting fixture.');
  if (options.inventoryPolicy && !['retain', 'expand', 'managed'].includes(options.inventoryPolicy)) throw new Error('Invalid inventory policy.');
  if (options.autoSellEquipment && options.inventoryPolicy === 'managed') throw new Error('Managed inventory requires drops to be retained before decisions.');
  const originalRandom = Math.random;
  const originalNow = Date.now;
  const originalLog = console.log;
  let randomState = options.seed >>> 0;
  let tick = 0;
  const epoch = 1_800_000_000_000;
  const elapsed = () => tick / 20;
  let db: DatabaseManager | undefined;
  try {
    Math.random = () => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 4294967296;
    };
    Date.now = () => epoch + tick * 50;
    console.log = () => {};
    db = new DatabaseManager(':memory:');
    const manager = new WorldManager(db);
    const world = manager.getOrCreateChannel(startingWorld, 1);
    const events = {
      bossAttempts: 0, bossVictories: 0, bossFailures: 0,
      firstBossSeconds: null as number | null,
      firstRefineAffordableSeconds: null as number | null,
      firstSkillAffordableSeconds: null as number | null,
    };
    let attemptOpen = false;
    const connection = {
      id: 'progression_simulation', isAuthenticated: true, playerId: null,
      send(op: Opcode, payload: any) {
        if (op !== Opcode.S2C_BOSS_EVENT) return;
        if (payload.eventType === 'SPAWN') {
          events.bossAttempts++;
          events.firstBossSeconds ??= elapsed();
          attemptOpen = true;
        } else if (attemptOpen && payload.eventType === 'VICTORY') {
          events.bossVictories++;
          attemptOpen = false;
        } else if (attemptOpen && payload.eventType === 'TIMEOUT') {
          events.bossFailures++;
          attemptOpen = false;
        }
      },
    } as unknown as Connection;
    manager.registerConnection(connection);
    const account = db.getOrCreateAccount('progression_simulation');
    const player = db.createCharacterInSlot(connection.id, account.id, 0, 'SimulationHero', options.classType);
    if (startingLevel !== 1 || startingWorld !== 1) {
      player.level = startingLevel;
      player.currentWorld = player.unlockedWorld = startingWorld;
      player.recalculateStatsFromEquipment();
      player.currentHp = player.maxHp;
      player.currentResource = player.maxResource;
      db.savePlayer(player);
    }
    connection.accountId = account.id;
    if (options.autoSellEquipment) {
      player.farmSettings.autoSellCommon = player.farmSettings.autoSellUncommon = true;
    }
    manager.assignPlayerToChannel(connection, player, 1);
    const startingWeapon = player.inventory.find(item => ITEMS_DATABASE[item.itemId]?.type === ItemType.EQUIPAMENTO &&
      ITEMS_DATABASE[item.itemId].equipmentSlot === EquipmentSlot.ARMA);
    if (options.equipStarter !== false && startingWeapon) world.usePlayerItem(player, startingWeapon.slotIndex);
    const startingGold = player.gold;
    const actions: SimulationAction[] = [];
    const investment = options.investment ?? 'none';
    let maxStage = player.currentStage;
    const levelReachedAt: Record<number, number> = { [player.level]: 0 };
    const phases: Record<string, { world: number; stage: number; seconds: number; gold: number; dust: number; kills: number; deaths: number }> = {};
    let fullInventorySeconds = 0;
    const fusionRecipes = options.collectFusionMilestones ? Object.values(FUSION_RECIPES).filter(recipe => recipe.classes.includes(player.classType)) : [];
    const firstFusionReady: Record<string, number | null> = Object.fromEntries(fusionRecipes.map(recipe => [recipe.id, null]));
    const skill = SKILLS_DATABASE[player.getEquippedSkill(1)];
    const milestoneCosts = [2, 5, 10].map(targetLevel => {
      let gold = 0, dust = 0;
      for (let level = 1; level < targetLevel; level++) {
        const cost = getSkillUpgradeCost(skill, level)!;
        gold += cost.gold; dust += cost.dust;
      }
      return { targetLevel, gold, dust, affordableAtSeconds: null as number | null };
    });

    for (tick = 0; tick < options.seconds * 20; tick++) {
      const beforeLevel = player.level;
      const before = player.huntSession.snapshot();
      const phaseKey = `${player.currentWorld}:${player.currentStage}`;
      const phase = phases[phaseKey] ??= { world: player.currentWorld, stage: player.currentStage, seconds: 0, gold: 0, dust: 0, kills: 0, deaths: 0 };
      // No browser/controller inputs: production automation owns the entire cycle.
      manager.update(0.05);
      if (tick % 20 === 0) for (const recipe of fusionRecipes) {
        if (firstFusionReady[recipe.id] === null && !getFusionPreview(recipe, player.inventory, { classType:player.classType, level:player.level, gold:player.gold }).reason) firstFusionReady[recipe.id] = Math.round(elapsed() + .05);
      }
      const after = player.huntSession.snapshot();
      phase.seconds += 0.05;
      phase.gold += after.lootGold - before.lootGold;
      phase.dust += after.arcaneDustLoot - before.arcaneDustLoot;
      phase.kills += after.kills - before.kills;
      phase.deaths += after.deaths - before.deaths;
      if (bagItems(player.inventory).length >= player.maxInventorySlots) fullInventorySeconds += 0.05;
      const dustBalance = player.inventory.filter(item => item.itemId === 'arcane_dust').reduce((sum, item) => sum + item.quantity, 0);
      for (const milestone of milestoneCosts) {
        if (milestone.affordableAtSeconds === null && player.gold >= milestone.gold && dustBalance >= milestone.dust) {
          milestone.affordableAtSeconds = Math.round((elapsed() + 0.05) * 100) / 100;
        }
      }
      events.firstSkillAffordableSeconds = milestoneCosts[0].affordableAtSeconds;
      maxStage = Math.max(maxStage, player.currentStage);
      levelReachedAt[player.level] ??= Math.round((elapsed() + 0.05) * 100) / 100;
      for (let level = beforeLevel + 1; level < player.level; level++) {
        levelReachedAt[level] ??= Math.round((elapsed() + 0.05) * 100) / 100;
      }
      if (events.firstRefineAffordableSeconds === null && player.gold >= 500 &&
        db.hasItemQuantity(player.dbCharacterId, 'stone_forge_common', 1)) {
        events.firstRefineAffordableSeconds = Math.round((elapsed() + 0.05) * 100) / 100;
      }
      // A simulated player's decisions once per second, never a production auto-purchase feature.
      // Use the current world after automatic portals, not the original channel instance.
      if (tick % 20 === 0 && (investment !== 'none' || (options.inventoryPolicy && options.inventoryPolicy !== 'retain')) && !player.isDead) {
        const activeWorld = connection.currentWorldInstance as typeof world;
        actions.push(...manageSimulationInventory(activeWorld, player, {
          policy: options.inventoryPolicy ?? 'retain', seconds: Math.round((elapsed() + .05) * 100) / 100,
          reserveFusion: !actions.some(action => action.kind === 'fusion'),
        }));
        const record = (kind: string, itemOrSkillId: string, beforeGold: number, level?: number) => {
          actions.push({ seconds: Math.round((elapsed() + .05) * 100) / 100, kind, itemOrSkillId, goldSpent: beforeGold - player.gold, level });
        };
        if (investment === 'skill') {
          const skillId = player.getEquippedSkill(1), selected = SKILLS_DATABASE[skillId];
          const level = getSkillLevel(player.skillLevels, skillId), cost = getSkillUpgradeCost(selected, level);
          if (cost && player.gold >= cost.gold && db.hasItemQuantity(player.dbCharacterId, 'arcane_dust', cost.dust)) {
            const beforeGold = player.gold;
            Object.assign(player, db.upgradeCharacterSkill(player, skillId, level));
            record('skill', skillId, beforeGold, level + 1);
          }
        } else if (investment === 'equipment') {
          if (options.inventoryPolicy === 'managed') {
            // Equipping was already evaluated with the reserved ingredients excluded above.
          } else if (options.equipmentScoring === 'class-weighted') {
            const before = new Set(player.inventory.filter(item => item.isEquipped).map(item => item.instanceId));
            // Exercise the same transactional button used by the real client.
            activeWorld.autoEquipPlayer(player);
            for (const item of player.inventory.filter(item => item.isEquipped && !before.has(item.instanceId))) {
              record('equip', item.itemId, player.gold);
            }
          } else {
            // Re-evaluate after each equip; requirements and equipped stats can change.
            for (let n = 0; n < 10; n++) {
              const suggestion = getEquipmentSuggestions(player.inventory, player)[0];
              if (!suggestion) break;
              activeWorld.usePlayerItem(player, suggestion.candidate.slotIndex);
              if (!suggestion.candidate.instanceId || !player.inventory.some(item => item.instanceId === suggestion.candidate.instanceId && item.isEquipped)) break;
              record('equip', suggestion.candidate.itemId, player.gold);
            }
          }
          const weapon = player.inventory.find(item => item.isEquipped && ITEMS_DATABASE[item.itemId]?.equipmentSlot === EquipmentSlot.ARMA);
          // Only the guaranteed early tier; stop at +2, where starter attributes actually improve.
          if (weapon && (weapon.refineLevel ?? 0) < 2 && player.gold >= 500 && db.hasItemQuantity(player.dbCharacterId, 'stone_forge_common', 1)) {
            const beforeGold = player.gold, beforeLevel = weapon.refineLevel ?? 0;
            activeWorld.refinePlayerEquipment(player, weapon.slotIndex);
            const current = player.inventory.find(item => item.instanceId === weapon.instanceId);
            if ((current?.refineLevel ?? 0) > beforeLevel) record('refine', weapon.itemId, beforeGold, current!.refineLevel);
          }
        } else if (investment === 'fusion' && !actions.some(action => action.kind === 'fusion')) {
          // Reserve all earned ingredients for the first compatible weapon; no shop or grants.
          const recipe = Object.values(FUSION_RECIPES).find(recipe => recipe.classes.includes(player.classType) && ITEMS_DATABASE[recipe.outputItemId].equipmentSlot === EquipmentSlot.ARMA);
          if (recipe) {
            const preview = getFusionPreview(recipe, player.inventory, { classType: player.classType, level: player.level, gold: player.gold });
            if (!preview.reason) {
              const beforeGold = player.gold;
              const result = db.fuseEquipment(player, { requestId: 'progression-first-fusion', recipeId: recipe.id, recipeVersion: recipe.version, inputInstanceIds: preview.selected.map(item => item.instanceId!) });
              player.inventory = db.getInventory(player.dbCharacterId);
              player.gold = db.getCharacterGold(player.dbCharacterId);
              record('fusion', result.outputItemId, beforeGold);
              actions[actions.length - 1].inputInstanceIds = preview.selected.map(item => item.instanceId!);
              const output = player.inventory.find(item => item.instanceId === result.outputInstanceId)!;
              activeWorld.usePlayerItem(player, output.slotIndex);
              if (player.inventory.some(item => item.instanceId === output.instanceId && item.isEquipped)) record('equip', output.itemId, player.gold);
            }
          }
        }
      }
    }
    const offlineHour = calculateOfflineReward({ ...player, lastLogoutTime: epoch - 3600_000 }, epoch)!;
    const bagComposition = new Map<string, { itemId: string; slots: number; quantity: number }>();
    for (const item of bagItems(player.inventory)) {
      const entry = bagComposition.get(item.itemId) ?? { itemId: item.itemId, slots: 0, quantity: 0 };
      entry.slots++; entry.quantity += item.quantity;
      bagComposition.set(item.itemId, entry);
    }
    return {
      classType: options.classType, seed: options.seed, durationSeconds: options.seconds,
      startingLevel, startingWorld,
      starterEquipped: options.equipStarter !== false,
      autoSellEquipment: options.autoSellEquipment === true,
      investment, startingGold, actions, spentGold: actions.reduce((total, action) => total + action.goldSpent, 0),
      equipmentScoring: options.equipmentScoring ?? 'conservative',
      inventoryPolicy: options.inventoryPolicy ?? 'retain', maxInventorySlots: player.maxInventorySlots,
      skillLevels: { ...player.skillLevels },
      equippedItems: player.inventory.filter(item => item.isEquipped).map(item => ({ itemId: item.itemId, refineLevel: item.refineLevel ?? 0 })),
      finalLevel: player.level, finalWorld: player.currentWorld, finalStage: player.currentStage,
      maxStage, portalOpen: (connection.currentWorldInstance as typeof world).isPortalOpen, combatPower: player.CombatPower,
      goldBalance: player.gold, inventorySlotsUsed: bagItems(player.inventory).length,
      bagComposition: [...bagComposition.values()],
      arcaneDustBalance: player.inventory.filter(item => item.itemId === 'arcane_dust').reduce((sum, item) => sum + item.quantity, 0),
      fullInventorySeconds: Math.round(fullInventorySeconds), milestoneCosts,
      fusionAvailability: fusionRecipes.map(recipe => ({ recipeId:recipe.id, firstReadySeconds:firstFusionReady[recipe.id], eligibleCopies:getFusionPreview(recipe, player.inventory, { classType:player.classType, level:player.level, gold:player.gold }).eligible.length, finalBlockReason:getFusionPreview(recipe, player.inventory, { classType:player.classType, level:player.level, gold:player.gold }).reason })),
      phases: Object.values(phases).map(phase => ({ ...phase, seconds: Math.round(phase.seconds * 100) / 100,
        goldPerMinute: Number((phase.gold * 60 / phase.seconds).toFixed(2)),
        dustPerMinute: Number((phase.dust * 60 / phase.seconds).toFixed(2)) })),
      commonForgeStones: player.inventory.filter(item => item.itemId === 'stone_forge_common').reduce((sum, item) => sum + item.quantity, 0),
      uniqueCards: player.cards.length, levelReachedAt, ...events, ...player.huntSession.snapshot(),
      offlineAtFinalState: { goldPerHour: offlineHour.accumulatedGold, expPerHour: offlineHour.accumulatedExp },
    };
  } finally {
    db?.close();
    Math.random = originalRandom;
    Date.now = originalNow;
    console.log = originalLog;
  }
}
