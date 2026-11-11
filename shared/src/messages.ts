import { Opcode } from './opcodes';
import { Vector3 } from './math';
import { CharacterClass, EntitySnapshotState, EntityType, CharacterAttributes } from './entities';
import { ItemRarity } from './items';

// ==========================================
// Base Packet Structure
// ==========================================
export interface NetworkMessage<T = unknown> {
  op: Opcode;
  timestamp: number; // Client or Server local timestamp (ms)
  seq?: number;      // Optional sequence number for order checking
  data: T;
}

// ==========================================
// Login / Authentication Payloads
// ==========================================
export interface C2SLoginPayload {
  characterName: string;
  classType: CharacterClass;
  clientVersion: string;
}

export interface S2CLoginSuccessPayload {
  isAdmin?: boolean;
  playerId: string;
  characterName: string;
  classType: CharacterClass;
  position: Vector3;
  stats: CharacterAttributes;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  gold: number;
  rebornCount?: number;
  honorTitle?: string;
  currentWorld?: number;
  currentStage?: number;
  serverTickRate: number; // e.g. 20
  tickIntervalMs: number; // e.g. 50
}

export type DevToggle = 'pauseRespawns' | 'disableDrops' | 'doubleLegendary' | 'infiniteVitals';
export type DevCommand =
  | { action: 'state' | 'boss' | 'clearTargets' | 'reset' | 'refillVitals' | 'clearDrops' }
  | { action: 'killVisible'; monsterIds: string[] }
  | { action: 'toggle'; key: DevToggle; enabled: boolean }
  | { action: 'dummy'; x: number; z: number };
export type DevState = Record<DevToggle, boolean> & { message?: string };

export interface S2CLoginFailurePayload {
  reason: string;
  errorCode: number;
}

// ==========================================
// Entity Lifecycle Payloads
// ==========================================
export interface S2CEntitySpawnPayload {
  entity: EntitySnapshotState;
}

export interface S2CEntityDespawnPayload {
  entityId: string;
  reason: 'DISCONNECTED' | 'DEAD' | 'OUT_OF_RANGE';
}

// ==========================================
// Movement & World Sync Payloads
// ==========================================
export interface C2SMoveInputPayload {
  // Mobile touch/click destination OR virtual joystick direction vector
  targetPosition?: Vector3;
  moveDirection?: Vector3; // Normalized direction vector (X, Z) from virtual joystick
  currentClientPosition: Vector3;
  inputSequence: number;
}

export interface S2CWorldSnapshotPayload {
  serverTick: number;
  serverTimestamp: number;
  entities: EntitySnapshotState[];
}

export interface S2CPositionCorrectionPayload {
  lastProcessedInputSeq: number;
  authoritativePosition: Vector3;
  reason: 'DESYNC' | 'OBSTACLE' | 'SPEED_VIOLATION';
}

// ==========================================
// Combat Action Payloads
// ==========================================
export interface C2SAttackTargetPayload {
  targetEntityId: string;
}

export type CombatDamageSource = 'BASIC_ATTACK' | 'SKILL' | 'STATUS_TICK' | 'REFLECTION';

export interface S2CCombatEventPayload {
  attackerId: string;
  targetId: string;
  damage: number;
  isCritical: boolean;
  isDodged: boolean;
  targetRemainingHp: number;
  targetMaxHp: number;
  isTargetDead: boolean;
  damageSource?: CombatDamageSource;
}

export interface S2CEntityStatUpdatePayload {
  entityId: string;
  currentHp: number;
  maxHp: number;
  level: number;
  combatPower: number;
}

export interface C2SCastSkillPayload {
  slot: number; // 1 to 4
  targetEntityId?: string;
  targetPosition?: Vector3;
}

export type SkillCategory = 'SINGLE_TARGET' | 'AOE_SELF' | 'AOE_TARGET' | 'AOE_LINE' | 'SELF_HEAL' | 'SELF_BUFF';
export type SkillGeometryType = 'POINT' | 'CIRCLE_SELF' | 'CIRCLE_TARGET' | 'LINE' | 'CONE';

export interface SkillTargetResultPayload {
  targetId: string;
  impactPosition: Vector3;
  effectiveDamage: number;
  effectiveHeal: number;
  shieldGranted?: number;
  remainingHp: number;
  maxHp: number;
  isDead: boolean;
  isCritical: boolean;
}

export type CombatStatusType =
  | 'HEAL_REDUCTION'
  | 'DARK_PLAGUE'
  | 'HEXED'
  | 'HEX_REGEN'
  | 'HADAR_HUNGER'
  | 'BLINDED'
  | 'DEMON_PRESENCE'
  | 'CHI_PALMS'
  | 'FLURRY'
  | 'ATTACK_SLOW'
  | 'WIND_STEP'
  | 'DRAGON_STRIDE'
  | 'ZEN_DOME'
  | 'SILENCED'
  | 'POISON'
  | 'HUNTERS_MARK'
  | 'ROOT'
  | 'STEALTH'
  | 'AMBUSH_CRITICAL'
  | 'EVASION_READY'
  | 'ARROW_VOLLEY'
  | 'STORM_BARRAGE'
  | 'ASTRAL_GUARDIAN'
  | 'BLEED'
  | 'ARMOR_BREAK'
  | 'ATTACK_SPEED_BUFF'
  | 'STUN'
  | 'SHIELD'
  | 'DAMAGE_BUFF'
  | 'DAMAGE_REDUCTION'
  | 'CRITICAL_BUFF'
  | 'GUIDING_MARK'
  | 'GUARDIANS_AURA'
  | 'SPIRITUAL_WEAPON'
  | 'SANCTUARY'
  | 'SANCTUARY_WARD'
  | 'SLOW'
  | 'FROST_SLOW'
  | 'BURN'
  | 'FROZEN'
  | 'ARCANE_HASTE'
  | 'COMET_RAIN'
  | 'CRIPPLED'
  | 'WEAKENED'
  | 'STONE_SKIN'
  | 'UNBRIDLED_RAGE'
  | 'SPECTRAL_PACK'
  | 'DEATH_IMMUNITY';

export type CombatStatusEventReason =
  | 'APPLIED'
  | 'REFRESHED'
  | 'TICK'
  | 'EXPIRED'
  | 'BROKEN'
  | 'CLEARED_ON_DEATH'
  | 'CLEARED_ON_DISCONNECT';

export interface CombatStatusStatePayload {
  areaCenter?: Vector3;
  radius?: number;
  statusId: string;
  type: CombatStatusType;
  skillId: string;
  sourceEntityId: string;
  targetEntityId: string;
  durationSec: number;
  remainingSec: number;
  expiresAtTick: number;
  magnitude: number;
  remainingAbsorption?: number;
  maxAbsorption?: number;
  reflectRatio?: number;
}

export interface CombatStatusTransitionPayload {
  tickHeal?: number;
  event: CombatStatusEventReason;
  serverTick: number;
  status: CombatStatusStatePayload;
  tickDamage?: number;
  targetRemainingHp?: number;
  isTargetDead?: boolean;
}

export type SkillCastRejectCode =
  | 'CASTER_DEAD'
  | 'CASTER_STUNNED'
  | 'CASTER_SILENCED'
  | 'INVALID_SLOT'
  | 'INVALID_SKILL'
  | 'UNIMPLEMENTED_EFFECT'
  | 'WRONG_CLASS'
  | 'LEVEL_LOCKED'
  | 'ON_COOLDOWN'
  | 'INSUFFICIENT_RESOURCE'
  | 'INVALID_TARGET'
  | 'TARGET_DEAD'
  | 'INVALID_POSITION'
  | 'OUT_OF_RANGE'
  | 'NO_VALID_TARGET';

export interface S2CSkillCastRejectedPayload {
  casterId: string;
  slot: number;
  skillId?: string;
  reasonCode: SkillCastRejectCode;
  message: string;
  serverTick: number;
  cooldownRemainingSec?: number;
  casterCurrentResource: number;
  casterMaxResource: number;
}

export interface S2CSkillCastEventPayload {
  cooldownRemainingSec?: number;
  coneRange?: number;
  coneAngleDeg?: number;
  castId?: string;
  serverTick?: number;
  casterId: string;
  skillId: string;
  slot: number;
  skillName: string;
  category?: SkillCategory;
  geometry?: SkillGeometryType;
  originPosition?: Vector3;
  targetId?: string;
  targetPosition?: Vector3;
  headingYaw?: number;
  radius?: number;
  lineLength?: number;
  lineWidth?: number;
  damageOrHeal: number;
  isHeal: boolean;
  isCritical: boolean;
  affectedEntityIds: string[];
  targetResults?: SkillTargetResultPayload[];
  appliedStatuses?: CombatStatusStatePayload[];
  casterCurrentResource: number; // remaining mana/energy
  casterMaxResource: number;
}

export interface C2SEquipSkillPayload {
  slot: number; // 1, 2, 3, 4
  skillId: string;
}

export interface S2CSkillsUpdatePayload {
  equippedSkills: Record<number, string>;
  skillLevels?: Record<string, number>;
  message?: string;
}

export interface C2SUpgradeSkillPayload {
  skillId: string;
  expectedLevel: number;
}

export interface S2CSkillUpgradeResultPayload {
  skillId: string;
  success: boolean;
  skillLevels: Record<string, number>;
  message: string;
}

// ==========================================
// Items, Drops & Inventory Payloads
// ==========================================
export interface S2CItemDropSpawnPayload {
  dropId: string;
  itemId: string;
  name: string;
  rarity: ItemRarity;
  quantity: number;
  position: Vector3;
  despawnTimeSec: number;
}

export interface S2CItemDropDespawnPayload {
  dropId: string;
  looterId?: string;
  reason: 'LOOTED' | 'EXPIRED';
}

export interface C2SLootItemPayload {
  dropId: string;
}

export interface InventoryItemPayload {
  isLocked?: boolean;
  instanceId?: string;
  location?: 'bag' | 'equipment';
  slotIndex: number;
  itemId: string;
  quantity: number;
  isEquipped: boolean;
  refineLevel?: number;
  sockets?: Array<{ socketIndex: number; gemId: string }>;
}

export interface S2CInventoryUpdatePayload {
  slots: InventoryItemPayload[];
  gold: number;
  totalCombatPower: number;
  maxSlots?: number;
  lootMessage?: string;
}

export interface C2SUseItemPayload {
  slotIndex: number;
  expectedInstanceId?: string;
}

export interface C2SSellItemPayload {
  slotIndex: number;
  expectedInstanceId?: string;
}

export interface C2SExpandInventoryPayload { expectedMaxSlots?: number; }

export interface C2SDiscardItemPayload {
  slotIndex: number;
  expectedInstanceId?: string;
}

export interface C2SSetItemLockPayload { slotIndex: number; expectedInstanceId: string; isLocked: boolean; }

// --- SUBMENU 2: REFINAMENTO DE EQUIPAMENTOS (+1 A +15) ---
export interface C2SRefineEquipmentPayload {
  slotIndex: number;
  expectedInstanceId?: string;
  expectedRefineLevel?: number;
}

export interface S2CRefineResultPayload {
  success: boolean;
  slotIndex: number;
  oldRefineLevel: number;
  newRefineLevel: number;
  isLevelUp: boolean;
  isLevelDown: boolean;
  message: string;
  totalCombatPower: number;
  gold: number;
}

// --- SUBMENU 3: ENGASTE DE GEMAS (SOCKETS) ---
export interface C2SSocketGemPayload {
  equipmentSlotIndex: number;
  expectedInstanceId?: string;
  socketIndex: number;
  gemItemId: string;
}

export interface S2CSocketResultPayload {
  success: boolean;
  equipmentSlotIndex: number;
  socketIndex: number;
  gemItemId?: string;
  message: string;
  totalCombatPower: number;
}

// --- SUBMENU 4: ÁLBUM DE CARTAS DE MONSTROS ---
export interface CardAlbumEntryPayload {
  cardId: string;
  name: string;
  rarity: string;
  icon: string;
  image?: string;
  count: number;
  isEquipped: boolean;
  equippedSlot: number;
  statsBonus: Partial<CharacterAttributes> & { maxHp?: number; maxResource?: number };
  activeEffectText: string;
}

export interface C2SEquipCardPayload {
  cardId: string;
  targetSlot: 'ARMA' | 'ARMADURA';
  isEquip: boolean;
}

export interface S2CCardsUpdatePayload {
  cards: CardAlbumEntryPayload[];
  equippedWeaponCardId?: string;
  equippedArmorCardId?: string;
  message?: string;
  totalCombatPower: number;
}

export interface C2SRequestCardAlbumPayload {}

export interface C2SChallengeBossPayload {}

export interface S2CBossEventPayload {
  eventType: 'SPAWN' | 'TICK' | 'TIMEOUT' | 'DEFEAT' | 'VICTORY';
  bossId?: string;
  bossName?: string;
  maxHp?: number;
  currentHp?: number;
  remainingTimeSec?: number;
  timeLimitSec?: number;
  newStage?: number;
  newWorld?: number;
  message?: string;
}

export interface C2SEnterPortalPayload {}

export interface S2CStageUpdatePayload {
  world: number;
  stage: number;
  worldName: string;
  stageKills: number;
  killsRequired: number;
  isBossStage: boolean;
  bossAvailable: boolean;
  portalOpen: boolean;
  portalPosition?: Vector3;
  message?: string;
}

// ==========================================
// Chat Payloads
// ==========================================
export interface C2SChatMessagePayload {
  message: string;
  channel?: 'general' | 'party' | 'guild' | 'system';
}

export interface S2CChatMessagePayload {
  senderId?: string;
  senderName: string;
  message: string;
  channel: 'general' | 'party' | 'guild' | 'system';
  timestamp?: number;
}

// ==========================================
// Progression & Leveling Payloads
// ==========================================
export interface S2CPlayerExpUpdatePayload {
  playerId: string;
  currentXp: number;
  xpToNextLevel: number;
  level: number;
  expGained: number;
  sourceText?: string;
}

export interface S2CPlayerLevelUpPayload {
  playerId: string;
  newLevel: number;
  newAttributes: CharacterAttributes;
  newMaxHp: number;
  newMaxResource: number;
  totalCombatPower: number;
  rebornCount?: number;
  honorTitle?: string;
}

export interface C2SPerformRebornPayload {}

export interface S2CRebornResultPayload {
  success: boolean;
  rebornCount: number;
  newLevel: number;
  totalCombatPower: number;
  newAttributes: CharacterAttributes;
  honorTitle: string;
  message: string;
}

// ==========================================
// Quality of Service / Ping-Pong Payloads
// ==========================================
export interface C2SPingPayload {
  clientSendTime: number;
}

export interface S2CPongPayload {
  clientSendTime: number;
  serverReceiveTime: number;
}

// ==========================================
// Account & Multi-Character Slots Payloads (D&D 5E Pedestais)
// ==========================================
export interface C2SRequestCharacterListPayload {
  accountUsername: string;
}

export interface CharacterSlotSummary {
  slotIndex: number; // 0, 1 ou 2
  isEmpty: boolean;
  id?: string;
  name?: string;
  classType?: CharacterClass;
  level?: number;
  currentWorld?: number;
  currentStage?: number;
  combatPower?: number;
  currentHp?: number;
  maxHp?: number;
  gold?: number;
  rebornCount?: number;
  lastPlayedAt?: number;
  attributes?: CharacterAttributes;
  equippedItems?: Array<{ itemId: string; refineLevel: number }>;
  slot1Skill?: string;
  slot2Skill?: string;
  slot3Skill?: string;
  slot4Skill?: string;
}

export interface S2CCharacterListPayload {
  accountId: string;
  accountUsername: string;
  slots: CharacterSlotSummary[]; // Sempre exatamente 3 posições (índices 0, 1 e 2)
  message?: string;
}

export interface C2SCreateCharacterSlotPayload {
  slotIndex: number; // 0, 1 ou 2
  characterName: string;
  classType: CharacterClass;
}

export interface C2SSelectCharacterSlotPayload {
  slotIndex: number; // 0, 1 ou 2
}

export interface C2SDeleteCharacterSlotPayload {
  slotIndex: number; // 0, 1 ou 2
  characterName: string;
  confirmation: string;
}

export interface S2CCharacterActionErrorPayload {
  errorCode: 'INVALID_SLOT' | 'SLOT_OCCUPIED' | 'NAME_TAKEN' | 'INVALID_NAME' | 'CHARACTER_NOT_FOUND' | 'UNAUTHENTICATED' | 'DELETE_CONFIRMATION_REQUIRED' | 'CHARACTER_ACTIVE';
  errorMessage: string;
  slotIndex?: number;
}

// ==========================================
// Account Authentication & Security Payloads (0x70 - 0x75)
// ==========================================
export type SocialAuthProvider = 'GOOGLE' | 'APPLE' | 'DISCORD' | 'FACEBOOK' | 'GUEST';

export interface C2SAuthLoginPayload {
  username: string;
  password?: string;
}

export interface C2SAuthRegisterPayload {
  username: string;
  password?: string;
  email?: string;
}

export interface C2SAuthSocialPayload {
  provider: SocialAuthProvider;
  token?: string;
  email?: string;
  displayName?: string;
}

export interface C2SAuthClaimLegacyPayload {
  username: string;
  verifyHeroName: string;
  verifyHeroClass: CharacterClass;
  newPassword: string;
  adminKey?: string;
}

export interface S2CAuthSuccessPayload {
  accountId: string;
  accountUsername: string;
  provider: string;
  isActivated: boolean;
  message?: string;
}

export interface S2CAuthErrorPayload {
  errorCode:
    | 'INVALID_CREDENTIALS'
    | 'USER_NOT_FOUND'
    | 'USER_EXISTS'
    | 'INVALID_PASSWORD'
    | 'INVALID_EMAIL'
    | 'LEGACY_ACCOUNT_UNCLAIMED'
    | 'LEGACY_CLAIM_FAILED'
    | 'UNAUTHENTICATED'
    | 'SOCIAL_AUTH_FAILED';
  errorMessage: string;
}

// ==========================================
// Idle Farm Helper & Bag Automation Payloads (0x80 - 0x8F)
// ==========================================
export interface FarmHelperSettingsPayload {
  autoHpPotionEnabled: boolean;
  autoHpPotionThreshold: number; // 20 a 90 (%)
  autoMpPotionEnabled: boolean;
  autoMpPotionThreshold: number; // 20 a 80 (%)
  autoSellCommon: boolean;
  autoSellUncommon: boolean;
  autoSellRare: boolean;
  autoLootEnabled: boolean;
}

export interface C2SUpdateFarmSettingsPayload {
  settings: Partial<FarmHelperSettingsPayload>;
}

export interface C2SUpdateSkillRotationPayload { order: number[]; autoCastEnabled?: boolean; }
export interface S2CSkillRotationPayload {
  order: number[];
  autoCastEnabled?: boolean;
  success: boolean;
  message?: string;
}

export interface S2CFarmSettingsUpdatePayload {
  settings: FarmHelperSettingsPayload;
  message?: string;
}

export interface C2SAutoSalvagePayload {
  includeRare?: boolean;
}

export interface S2CAutoSalvageResultPayload {
  itemsSold: number;
  goldEarned: number;
  newGoldTotal: number;
  message: string;
}

// ==========================================
// Inventory Expansion Payloads (0x84 - 0x85)
// ==========================================
export interface C2SExpandInventoryPayload {}

export interface S2CExpandInventoryResultPayload {
  success: boolean;
  newMaxSlots: number;
  goldSpent: number;
  remainingGold: number;
  nextExpansionCost?: number;
  nextExpansionMinLevel?: number;
  message: string;
}

// ==========================================
// Leaderboards & Rankings Payloads (0x86 - 0x87)
// ==========================================
export type LeaderboardCategory = 'COMBAT_POWER' | 'LEVEL' | 'STAGE' | 'GOLD';

export interface LeaderboardEntryPayload {
  rank: number;
  characterId: string;
  name: string;
  classType: CharacterClass;
  level: number;
  rebornCount: number;
  combatPower: number;
  currentWorld: number;
  currentStage: number;
  gold: number;
  honorTitle?: string;
}

export interface C2SRequestLeaderboardPayload {
  category: LeaderboardCategory;
  limit?: number;
}

export interface S2CLeaderboardUpdatePayload {
  category: LeaderboardCategory;
  entries: LeaderboardEntryPayload[];
  myRank?: number;
  myEntry?: LeaderboardEntryPayload;
  timestamp: number;
}

// ==========================================
// Daily Dungeons & Boss Rush Payloads (0x88 - 0x8E)
// ==========================================
export type DungeonType = 'BOSS_RUSH' | 'GOLD_TREASURY';

export type DungeonEventStatus = 
  | 'START' 
  | 'WAVE_START' 
  | 'WAVE_CLEAR' 
  | 'VICTORY' 
  | 'DEFEAT' 
  | 'TIMEOUT' 
  | 'LEFT';

export interface DungeonRewardItem {
  itemId: string;
  quantity: number;
}

export interface DailyDungeonInfoPayload {
  ticketsRemaining: number;
  maxDailyFreeTickets: number;
  extraTicketsBoughtToday: number;
  maxExtraTicketsPerDay: number;
  extraTicketCostGold: number;
  highestBossRushWave: number;
  fastestBossRushTimeSec: number;
  totalDungeonsCleared: number;
  resetDate: string;
  isDungeonActive: boolean;
  activeDungeonType?: DungeonType;
}

export interface C2SEnterDungeonPayload {
  dungeonType: DungeonType;
}

export interface S2CDungeonEventPayload {
  status: DungeonEventStatus;
  dungeonType: DungeonType;
  currentWave: number;
  maxWaves: number;
  timeLimitSec: number;
  remainingTimeSec: number;
  bossEntityId?: string;
  bossName?: string;
  bossMaxHp?: number;
  bossCurrentHp?: number;
  totalDamageDealt?: number;
  goldEarned?: number;
  expEarned?: number;
  itemRewards?: DungeonRewardItem[];
  message: string;
}

export interface C2SBuyDungeonTicketPayload {}

export interface S2CBuyDungeonTicketResultPayload {
  success: boolean;
  ticketsRemaining: number;
  extraTicketsBoughtToday: number;
  goldSpent: number;
  remainingGold: number;
  message: string;
}

export interface C2SLeaveDungeonPayload {}

// ==========================================
// Channels, Worlds & Instances Payloads (0x90 - 0x99)
// ==========================================

export type ChannelLoadStatus = 'LIVRE' | 'POVOADO' | 'LOTADO';

export interface ChannelSummaryPayload {
  channelId: number;
  worldIndex: number;
  worldName: string;
  activePlayers: number;
  maxPlayers: number;
  loadStatus: ChannelLoadStatus;
  isCurrentChannel: boolean;
}

export interface C2SRequestChannelListPayload {
  worldIndex?: number;
}

export interface S2CChannelListPayload {
  worldIndex: number;
  worldName: string;
  currentChannelId: number;
  channels: ChannelSummaryPayload[];
}

export interface C2SChangeChannelPayload {
  targetChannelId: number;
}

export interface S2CChangeChannelResultPayload {
  success: boolean;
  channelId?: number;
  worldIndex?: number;
  worldName?: string;
  reason?: string;
  message: string;
}

// ==========================================
// Party & Social Systems Payloads (0xA0 - 0xAF)
// ==========================================

export interface PartyMemberPayload {
  playerId: string;
  name: string;
  classType: CharacterClass;
  level: number;
  currentHp: number;
  maxHp: number;
  currentResource: number;
  maxResource: number;
  isLeader: boolean;
  isOnline: boolean;
  worldIndex: number;
  channelId: number;
}

export interface S2CPartyUpdatePayload {
  partyId: string | null;
  leaderId: string | null;
  members: PartyMemberPayload[];
  isDisbanded?: boolean;
  message?: string;
}

export interface C2SPartyInvitePayload {
  targetPlayerId?: string;
  targetPlayerName?: string;
}

export interface S2CPartyInviteReceivedPayload {
  partyId?: string;
  inviterId: string;
  inviterName: string;
  inviterLevel: number;
  inviterClass: CharacterClass;
}

export interface C2SPartyInviteResponsePayload {
  inviterId: string;
  accept: boolean;
}

export interface C2SPartyKickPayload {
  targetPlayerId: string;
}

export interface C2SPartyPromoteLeaderPayload {
  targetPlayerId: string;
}

export interface C2SPartyLeavePayload {}

export interface C2SPartyDisbandPayload {}

export interface S2CPartyActionResultPayload {
  action: 'INVITE' | 'JOIN' | 'LEAVE' | 'KICK' | 'PROMOTE' | 'DISBAND';
  success: boolean;
  reason?: string;
  message: string;
}

// ==========================================
// Offline Progress & AFK Rewards Payloads (0xB0 - 0xB2)
// ==========================================
export interface OfflineLootItem {
  itemId: string;
  name: string;
  rarity: string;
  quantity: number;
}

export interface S2COfflineRewardInfoPayload {
  offlineSeconds: number;
  cappedSeconds: number; // Tempo efetivamente recompensado
  maxOfflineSeconds?: number; // Limite decidido pelo servidor
  accumulatedGold: number;
  accumulatedExp: number;
  lootPreview: OfflineLootItem[];
  minThresholdSeconds: number; // 300s (5 min)
}

export interface OfflineRewardState {
  accumulatedGold: number;
  accumulatedExp: number;
  loot: OfflineLootItem[];
  offlineSeconds: number;
  cappedSeconds: number;
  maxOfflineSeconds: number;
}

/** Online session only. Sales, offline chests and dungeon completion prizes are excluded from hourly rates. */
export interface S2CHuntReportPayload {
  characterId: string;
  characterName: string;
  classType: CharacterClass;
  level: number;
  world: number;
  stage: number;
  channel: number;
  elapsedSeconds: number;
  kills: number; // Own final blows; party members still receive their actual EXP share.
  combatExp: number;
  lootGold: number;
  arcaneDustLoot?: number; // Only successfully collected combat drops; excludes rewards and recycling.
  autoSaleGold: number;
  manualSaleGold: number;
  hpPotionsUsed: number;
  resourcePotionsUsed: number;
  deaths: number;
  expPerHour: number | null; // null until a full minute has been simulated
  goldPerHour: number | null;
  arcaneDustPerHour?: number | null;
}

export interface C2SClaimOfflineRewardsPayload {
  // Legado: ignorado pelo servidor. Bônus dependem de autorização no backend.
  multiplier?: number;
}

export interface S2COfflineRewardsClaimedPayload {
  success: boolean;
  remainingReward?: S2COfflineRewardInfoPayload; // Only unclaimed rewards; never repeat credited gold/EXP.
  claimedGold: number;
  claimedExp: number;
  lootClaimed: OfflineLootItem[];
  newGold: number;
  newLevel: number;
  newExp: number;
  message: string;
}





