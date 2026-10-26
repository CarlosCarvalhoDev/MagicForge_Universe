/**
 * MagicForge: Universe - Network Packet Opcodes
 * 
 * Naming convention:
 * C2S = Client to Server
 * S2C = Server to Client
 */
export enum Opcode {
  // --- Handshake & Authentication (0x01 - 0x0F) ---
  C2S_LOGIN = 0x01,
  S2C_LOGIN_SUCCESS = 0x02,
  S2C_LOGIN_FAILURE = 0x03,

  // --- Entity Lifecycle & Visibility (0x10 - 0x1F) ---
  S2C_ENTITY_SPAWN = 0x10,
  S2C_ENTITY_DESPAWN = 0x11,

  // --- Movement & World Sync (0x20 - 0x2F) ---
  C2S_MOVE_INPUT = 0x20,
  S2C_WORLD_SNAPSHOT = 0x21,
  S2C_POSITION_CORRECTION = 0x22,

  // --- Combat & Actions (0x30 - 0x3F) ---
  C2S_ATTACK_TARGET = 0x30,
  S2C_COMBAT_EVENT = 0x31,
  S2C_ENTITY_STAT_UPDATE = 0x32,
  C2S_CAST_SKILL = 0x33,
  S2C_SKILL_CAST_EVENT = 0x34,

  // --- Heartbeat & Quality of Service (0xF0 - 0xFF) ---
  C2S_PING = 0xF0,
  S2C_PONG = 0xF1,
  S2C_ERROR = 0xFF,
}
