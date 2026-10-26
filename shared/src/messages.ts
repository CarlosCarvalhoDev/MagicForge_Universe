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
  playerId: string;
  characterName: string;
  classType: CharacterClass;
  position: Vector3;
  stats: CharacterAttributes;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  gold: number;
  serverTickRate: number; // e.g. 20
  tickIntervalMs: number; // e.g. 50
}

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

export interface S2CCombatEventPayload {
  attackerId: string;
  targetId: string;
  damage: number;
  isCritical: boolean;
  isDodged: boolean;
  targetRemainingHp: number;
  targetMaxHp: number;
  isTargetDead: boolean;
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

export interface S2CSkillCastEventPayload {
  casterId: string;
  skillId: string;
  slot: number;
  skillName: string;
  targetId?: string;
  targetPosition?: Vector3;
  damageOrHeal: number;
  isHeal: boolean;
  isCritical: boolean;
  affectedEntityIds: string[];
  casterCurrentResource: number; // remaining mana/energy
  casterMaxResource: number;
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
  slotIndex: number;
  itemId: string;
  quantity: number;
  isEquipped: boolean;
}

export interface S2CInventoryUpdatePayload {
  slots: InventoryItemPayload[];
  gold: number;
  totalCombatPower: number;
  lootMessage?: string;
}

export interface C2SUseItemPayload {
  slotIndex: number;
}

export interface C2SSellItemPayload {
  slotIndex: number;
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
