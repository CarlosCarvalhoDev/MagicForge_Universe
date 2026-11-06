import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CharacterClass } from '@magicforge/shared';
import { simulateProgression, type ProgressionInvestment } from './ProgressionSimulation';

const seconds = Number(process.argv[2] ?? 1800);
const destination = resolve(process.argv[3] ?? '../scratch/progression-audit/earned.json');
const inventoryMode = process.argv[4] ?? 'retain';
if (!['retain', 'sell'].includes(inventoryMode)) throw new Error('Inventory mode must be retain or sell.');
const autoSellEquipment = inventoryMode === 'sell';
// Selling every eligible ingredient makes a fusion policy meaningless; compare saving vs skill spending.
const policies: ProgressionInvestment[] = autoSellEquipment ? ['none', 'skill'] : ['none', 'skill', 'equipment', 'fusion'];
const sources = ['tools/ProgressionSimulation.ts', 'tools/benchmark-earned-progression.ts', 'src/game/World.ts', 'src/entities/Player.ts', 'src/entities/Entity.ts', 'src/database/DatabaseManager.ts', '../shared/src/skills.ts', '../shared/src/items.ts', '../shared/src/skill-progression.ts', '../shared/src/equipment-fusion.ts'];
const sourceHashes = Object.fromEntries(sources.map(path => [path, createHash('sha256').update(readFileSync(resolve(path))).digest('hex')]));
const runs = [CharacterClass.GUERREIRO, CharacterClass.BARBARO].flatMap(classType => [101, 202, 303].flatMap(seed => policies.map(investment => {
  const run = simulateProgression({ classType, seconds, seed, investment, autoSellEquipment, collectFusionMilestones: true });
  console.log(`${classType} seed=${seed} ${investment}: lv${run.finalLevel} world=${run.finalWorld} stage=${run.finalStage} bosses=${run.bossVictories}/${run.bossAttempts} deaths=${run.deaths} spent=${run.spentGold} fullBag=${run.fullInventorySeconds}s`);
  return run;
})));
const report = {
  generatedAt: new Date().toISOString(), nodeVersion: process.version, sourceHashes,
  assumptions: {
    database: ':memory:', tickRate: 20, startingLevel: 1, equippedStarter: true,
    equipmentAutoSale: autoSellEquipment, grantedResources: false, offlineRewardsClaimed: false,
    decisionsEverySeconds: 1, purchasesDuringCombat: true,
    policies: {
      none: 'Starter only; retain all earned resources.',
      skill: 'Purchase slot 1 ranks as soon as affordable with earned gold/dust.',
      equipment: 'Equip conservative nonnegative-stat suggestions; refine equipped weapon to +2 with earned stones/gold.',
      fusion: 'Reserve resources for first compatible weapon fusion, purchase once and attempt to equip it.',
    },
    limitations: 'Sequential deterministic solo samples, not live-player behaviour or endgame balance. Identical starting seeds; decisions can change subsequent RNG use. No inventory expansion, recycling, manual sales or build selection. Balance milestones describe unspent current balances, not cumulative lifetime earnings. Initial potions and 50 gold are the normal character starter kit.',
  }, runs,
};
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
console.log(`Relatório: ${destination}`);
