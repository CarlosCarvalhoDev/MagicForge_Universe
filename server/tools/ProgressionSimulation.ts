import { CharacterClass, Opcode, ITEMS_DATABASE, ItemType, EquipmentSlot } from '@magicforge/shared';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { WorldManager } from '../src/game/WorldManager';
import type { Connection } from '../src/network/Connection';
import { calculateOfflineReward } from '../src/game/OfflineRewards';

export interface SimulationOptions {
  classType: CharacterClass;
  seconds: number;
  seed: number;
  equipStarter?: boolean;
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
    manager.assignPlayerToChannel(connection, player, 1);
    const startingWeapon = player.inventory.find(item => ITEMS_DATABASE[item.itemId]?.type === ItemType.EQUIPAMENTO &&
      ITEMS_DATABASE[item.itemId].equipmentSlot === EquipmentSlot.ARMA);
    if (options.equipStarter !== false && startingWeapon) world.usePlayerItem(player, startingWeapon.slotIndex);
    let maxStage = player.currentStage;
    const levelReachedAt: Record<number, number> = { [player.level]: 0 };

    for (tick = 0; tick < options.seconds * 20; tick++) {
      const beforeLevel = player.level;
      // No browser/controller inputs: production automation owns the entire cycle.
      manager.update(0.05);
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
      finalLevel: player.level, finalWorld: player.currentWorld, finalStage: player.currentStage,
      maxStage, portalOpen: (connection.currentWorldInstance as typeof world).isPortalOpen, combatPower: player.CombatPower,
      goldBalance: player.gold, inventorySlotsUsed: player.inventory.length,
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
