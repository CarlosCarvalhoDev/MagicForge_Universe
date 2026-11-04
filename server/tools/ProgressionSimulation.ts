import { CharacterClass, Opcode, ITEMS_DATABASE, ItemType, EquipmentSlot, SKILLS_DATABASE, getSkillUpgradeCost, bagItems } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { WorldManager } from '../src/game/WorldManager';
import type { Connection } from '../src/network/Connection';
import { calculateOfflineReward } from '../src/game/OfflineRewards';

export interface SimulationOptions {
  classType: CharacterClass;
  seconds: number;
  seed: number;
  equipStarter?: boolean;
  autoSellEquipment?: boolean;
}

/** Sequential, isolated CLI/test use only: RNG and Date.now are restored before returning. */
export function simulateProgression(options: SimulationOptions) {
  if (!Number.isInteger(options.seconds) || options.seconds < 1 || options.seconds > 7200) {
    throw new Error('Use uma duração inteira de 1 a 7200 segundos.');
  }
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
    const world = manager.getOrCreateChannel(1, 1);
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
    connection.accountId = account.id;
    if (options.autoSellEquipment) {
      player.farmSettings.autoSellCommon = player.farmSettings.autoSellUncommon = true;
    }
    manager.assignPlayerToChannel(connection, player, 1);
    const startingWeapon = player.inventory.find(item => ITEMS_DATABASE[item.itemId]?.type === ItemType.EQUIPAMENTO &&
      ITEMS_DATABASE[item.itemId].equipmentSlot === EquipmentSlot.ARMA);
    if (options.equipStarter !== false && startingWeapon) world.usePlayerItem(player, startingWeapon.slotIndex);
    let maxStage = player.currentStage;
    const levelReachedAt: Record<number, number> = { [player.level]: 0 };
    const phases: Record<string, { world: number; stage: number; seconds: number; gold: number; dust: number; kills: number; deaths: number }> = {};
    let fullInventorySeconds = 0;
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
    }
    const offlineHour = calculateOfflineReward({ ...player, lastLogoutTime: epoch - 3600_000 }, epoch)!;
    return {
      classType: options.classType, seed: options.seed, durationSeconds: options.seconds,
      starterEquipped: options.equipStarter !== false,
      autoSellEquipment: options.autoSellEquipment === true,
      finalLevel: player.level, finalWorld: player.currentWorld, finalStage: player.currentStage,
      maxStage, portalOpen: (connection.currentWorldInstance as typeof world).isPortalOpen, combatPower: player.CombatPower,
      goldBalance: player.gold, inventorySlotsUsed: bagItems(player.inventory).length,
      arcaneDustBalance: player.inventory.filter(item => item.itemId === 'arcane_dust').reduce((sum, item) => sum + item.quantity, 0),
      fullInventorySeconds: Math.round(fullInventorySeconds), milestoneCosts,
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
