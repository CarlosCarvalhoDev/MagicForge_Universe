import { Opcode } from './opcodes';
import { Vector3 } from './math';
import { CharacterClass, EntitySnapshotState, EntityType, CharacterAttributes } from './entities';

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
  // Mobile touch/click destination or virtual joystick direction
  targetPosition: Vector3;
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
