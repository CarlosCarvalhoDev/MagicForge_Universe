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
  C2S_ENTER_PORTAL = 0x23,
  S2C_STAGE_UPDATE = 0x24,

  // --- Combat & Actions (0x30 - 0x3F) ---
  C2S_ATTACK_TARGET = 0x30,
  S2C_COMBAT_EVENT = 0x31,
  S2C_ENTITY_STAT_UPDATE = 0x32,
  C2S_CAST_SKILL = 0x33,
  S2C_SKILL_CAST_EVENT = 0x34,
  C2S_CHALLENGE_BOSS = 0x35,
  S2C_BOSS_EVENT = 0x36,
  C2S_EQUIP_SKILL = 0x37,
  S2C_SKILLS_UPDATE = 0x38,

  // --- Account & Multi-Character Slots (0x39 - 0x3F) ---
  C2S_REQUEST_CHARACTER_LIST = 0x39,
  S2C_CHARACTER_LIST = 0x3A,
  C2S_CREATE_CHARACTER_SLOT = 0x3B,
  C2S_SELECT_CHARACTER_SLOT = 0x3C,
  S2C_SKILL_CAST_REJECTED = 0x3D,
  S2C_COMBAT_STATUS_EVENT = 0x3E,

  // --- Items, Drops & Inventory (0x40 - 0x4F) ---
  S2C_ITEM_DROP_SPAWN = 0x40,
  S2C_ITEM_DROP_DESPAWN = 0x41,
  C2S_LOOT_ITEM = 0x42,
  S2C_INVENTORY_UPDATE = 0x43,
  C2S_USE_ITEM = 0x44,
  C2S_SELL_ITEM = 0x45,
  C2S_EXPAND_INVENTORY = 0x46,
  C2S_DISCARD_ITEM = 0x47,
  C2S_REFINE_EQUIPMENT = 0x48,
  S2C_REFINE_RESULT = 0x49,
  C2S_SOCKET_GEM = 0x4A,
  S2C_SOCKET_RESULT = 0x4B,
  C2S_EQUIP_CARD = 0x4C,
  S2C_CARDS_UPDATE = 0x4D,
  C2S_REQUEST_CARD_ALBUM = 0x4E,
  S2C_EXPAND_INVENTORY_RESULT = 0x4F,

  // --- Progression & Leveling (0x50 - 0x5F) ---
  S2C_PLAYER_EXP_UPDATE = 0x50,
  S2C_PLAYER_LEVEL_UP = 0x51,
  C2S_PERFORM_REBORN = 0x52,
  S2C_REBORN_RESULT = 0x53,

  // --- Chat & Social (0x60 - 0x6F) ---
  C2S_CHAT_MESSAGE = 0x60,
  S2C_CHAT_MESSAGE = 0x61,

  // --- Account Authentication & Security (0x70 - 0x7F) ---
  C2S_AUTH_LOGIN = 0x70,
  C2S_AUTH_REGISTER = 0x71,
  C2S_AUTH_SOCIAL = 0x72,
  C2S_AUTH_CLAIM_LEGACY = 0x73,
  S2C_AUTH_SUCCESS = 0x74,
  S2C_AUTH_ERROR = 0x75,

  // --- Idle Farm Helper & Bag Automation (0x80 - 0x85) ---
  C2S_UPDATE_FARM_SETTINGS = 0x80,
  S2C_FARM_SETTINGS_UPDATE = 0x81,
  C2S_AUTO_SALVAGE = 0x82,
  S2C_AUTO_SALVAGE_RESULT = 0x83,

  // --- Rankings & Leaderboards (0x86 - 0x8F) ---
  C2S_REQUEST_LEADERBOARD = 0x86,
  S2C_LEADERBOARD_UPDATE = 0x87,

  // --- Daily Dungeons & Boss Rush (0x88 - 0x8E) ---
  C2S_REQUEST_DUNGEON_INFO = 0x88,
  S2C_DUNGEON_INFO = 0x89,
  C2S_ENTER_DUNGEON = 0x8A,
  S2C_DUNGEON_EVENT = 0x8B,
  C2S_BUY_DUNGEON_TICKET = 0x8C,
  S2C_BUY_DUNGEON_TICKET_RESULT = 0x8D,
  C2S_LEAVE_DUNGEON = 0x8E,

  // --- Heartbeat & Quality of Service (0xF0 - 0xFF) ---
  C2S_PING = 0xF0,
  S2C_PONG = 0xF1,
  S2C_ERROR = 0xFF,
}
