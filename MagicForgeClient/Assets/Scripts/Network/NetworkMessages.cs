using System;
using UnityEngine;

namespace MagicForge.Network
{
    public enum Opcode
    {
        // Handshake & Authentication (0x01 - 0x0F)
        C2S_LOGIN = 0x01,
        S2C_LOGIN_SUCCESS = 0x02,
        S2C_LOGIN_FAILURE = 0x03,

        // Entity Lifecycle & Visibility (0x10 - 0x1F)
        S2C_ENTITY_SPAWN = 0x10,
        S2C_ENTITY_DESPAWN = 0x11,

        // Movement & World Sync (0x20 - 0x2F)
        C2S_MOVE_INPUT = 0x20,
        S2C_WORLD_SNAPSHOT = 0x21,
        S2C_POSITION_CORRECTION = 0x22,
        C2S_ENTER_PORTAL = 0x23,
        S2C_STAGE_UPDATE = 0x24,

        // Combat & Actions (0x30 - 0x3F)
        C2S_ATTACK_TARGET = 0x30,
        S2C_COMBAT_EVENT = 0x31,
        S2C_ENTITY_STAT_UPDATE = 0x32,
        C2S_CAST_SKILL = 0x33,
        S2C_SKILL_CAST_EVENT = 0x34,
        C2S_CHALLENGE_BOSS = 0x35,
        S2C_BOSS_EVENT = 0x36,
        C2S_REQUEST_CHARACTER_LIST = 0x39,
        S2C_CHARACTER_LIST = 0x3A,
        C2S_CREATE_CHARACTER_SLOT = 0x3B,
        C2S_SELECT_CHARACTER_SLOT = 0x3C,

        // Items, Drops & Inventory (0x40 - 0x4F)
        S2C_ITEM_DROP_SPAWN = 0x40,
        S2C_ITEM_DROP_DESPAWN = 0x41,
        C2S_LOOT_ITEM = 0x42,
        S2C_INVENTORY_UPDATE = 0x43,
        C2S_USE_ITEM = 0x44,
        C2S_EXPAND_INVENTORY = 0x46,
        C2S_REFINE_EQUIPMENT = 0x48,
        S2C_REFINE_RESULT = 0x49,
        C2S_SOCKET_GEM = 0x4A,
        S2C_SOCKET_RESULT = 0x4B,
        C2S_EQUIP_CARD = 0x4C,
        S2C_CARDS_UPDATE = 0x4D,
        C2S_REQUEST_CARD_ALBUM = 0x4E,
        S2C_EXPAND_INVENTORY_RESULT = 0x4F,

        // Level, Progression & EXP (0x50 - 0x5F)
        S2C_PLAYER_EXP_UPDATE = 0x50,
        S2C_PLAYER_LEVEL_UP = 0x51,
        C2S_PERFORM_REBORN = 0x52,
        S2C_REBORN_RESULT = 0x53,

        // Account Authentication & Security (0x70 - 0x7F)
        C2S_AUTH_LOGIN = 0x70,
        C2S_AUTH_REGISTER = 0x71,
        C2S_AUTH_SOCIAL = 0x72,
        C2S_AUTH_CLAIM_LEGACY = 0x73,
        S2C_AUTH_SUCCESS = 0x74,
        S2C_AUTH_ERROR = 0x75,

        // Idle Farm Helper & Bag Automation (0x80 - 0x8F)
        C2S_UPDATE_FARM_SETTINGS = 0x80,
        S2C_FARM_SETTINGS_UPDATE = 0x81,
        C2S_AUTO_SALVAGE = 0x82,
        S2C_AUTO_SALVAGE_RESULT = 0x83,

        // Rankings & Leaderboards (0x86 - 0x8F)
        C2S_REQUEST_LEADERBOARD = 0x86,
        S2C_LEADERBOARD_UPDATE = 0x87,

        // Daily Dungeons & Boss Rush (0x88 - 0x8E)
        C2S_REQUEST_DUNGEON_INFO = 0x88,
        S2C_DUNGEON_INFO = 0x89,
        C2S_ENTER_DUNGEON = 0x8A,
        S2C_DUNGEON_EVENT = 0x8B,
        C2S_BUY_DUNGEON_TICKET = 0x8C,
        S2C_BUY_DUNGEON_TICKET_RESULT = 0x8D,
        C2S_LEAVE_DUNGEON = 0x8E,

        // Heartbeat (0xF0 - 0xFF)
        C2S_PING = 0xF0,
        S2C_PONG = 0xF1,
        S2C_ERROR = 0xFF
    }

    [Serializable]
    public struct Vector3DTO
    {
        public float x;
        public float y;
        public float z;

        public Vector3DTO(float x, float y, float z)
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public Vector3 ToUnityVector3() => new Vector3(x, y, z);
        public static Vector3DTO FromUnityVector3(Vector3 v) => new Vector3DTO(v.x, v.y, v.z);
    }

    [Serializable]
    public class EntitySnapshotDTO
    {
        public string id;
        public string type;
        public string name;
        public Vector3DTO position;
        public Vector3DTO velocity;
        public float headingYaw;
        public int currentHp;
        public int maxHp;
        public int currentResource;
        public int maxResource;
        public string resourceType;
        public bool isMoving;
        public string targetId;
        public string classType;
        public int level;
    }

    [Serializable]
    public class WorldSnapshotDTO
    {
        public int serverTick;
        public long serverTimestamp;
        public EntitySnapshotDTO[] entities;
    }

    [Serializable]
    public class MoveInputDTO
    {
        public Vector3DTO targetPosition;
        public Vector3DTO currentClientPosition;
        public int inputSequence;
    }

    [Serializable]
    public class LoginRequestDTO
    {
        public string characterName;
        public string classType;
        public string clientVersion;
    }

    [Serializable]
    public class LoginSuccessDTO
    {
        public string playerId;
        public string characterName;
        public string classType;
        public Vector3DTO position;
        public int serverTickRate;
        public int tickIntervalMs;
        public int level;
        public int currentXp;
        public int xpToNextLevel;
        public int gold;
    }

    [Serializable]
    public class CombatEventDTO
    {
        public string attackerId;
        public string targetId;
        public int damage;
        public bool isCritical;
        public bool isDodged;
        public int targetRemainingHp;
        public int targetMaxHp;
        public bool isTargetDead;
    }

    [Serializable]
    public class CastSkillRequestDTO
    {
        public int slot;
        public string targetEntityId;
        public Vector3DTO targetPosition;
    }

    [Serializable]
    public class SkillCastEventDTO
    {
        public string casterId;
        public string skillId;
        public int slot;
        public string skillName;
        public string targetId;
        public Vector3DTO targetPosition;
        public int damageOrHeal;
        public bool isHeal;
        public bool isCritical;
        public string[] affectedEntityIds;
        public int casterCurrentResource;
        public int casterMaxResource;
    }

    [Serializable]
    public class ItemDropSpawnDTO
    {
        public string dropId;
        public string itemId;
        public string name;
        public string rarity;
        public int quantity;
        public Vector3DTO position;
        public int despawnTimeSec;
    }

    [Serializable]
    public class ItemDropDespawnDTO
    {
        public string dropId;
        public string looterId;
        public string reason;
    }

    [Serializable]
    public class LootItemRequestDTO
    {
        public string dropId;
    }

    [Serializable]
    public class InventoryItemDTO
    {
        public int slotIndex;
        public string itemId;
        public int quantity;
        public bool isEquipped;
    }

    [Serializable]
    public class InventoryUpdateDTO
    {
        public InventoryItemDTO[] slots;
        public int gold;
        public int totalCombatPower;
        public string lootMessage;
    }

    [Serializable]
    public class UseItemRequestDTO
    {
        public int slotIndex;
    }

    [Serializable]
    public class PlayerExpUpdateDTO
    {
        public string playerId;
        public int currentXp;
        public int xpToNextLevel;
        public int level;
        public int expGained;
        public string source;
    }

    [Serializable]
    public class CharacterAttributesDTO
    {
        public int forca;
        public int destreza;
        public int constituicao;
        public int inteligencia;
        public int sabedoria;
        public int carisma;
    }

    [Serializable]
    public class PlayerLevelUpDTO
    {
        public string playerId;
        public int newLevel;
        public CharacterAttributesDTO newAttributes;
        public int newMaxHp;
        public int newMaxResource;
        public int totalCombatPower;
    }

    [Serializable]
    public class StageUpdateDTO
    {
        public int world;
        public int stage;
        public string worldName;
        public int stageKills;
        public int killsRequired;
        public bool isBossStage;
        public bool bossAvailable;
        public bool portalOpen;
        public Vector3DTO portalPosition;
        public string message;
    }

    [Serializable]
    public class BossEventDTO
    {
        public string eventType;
        public string bossId;
        public string bossName;
        public int maxHp;
        public int currentHp;
        public int remainingTimeSec;
        public int timeLimitSec;
        public int newStage;
        public int newWorld;
        public string message;
    }

    [Serializable]
    public class RebornResultDTO
    {
        public bool success;
        public int rebornCount;
        public int newLevel;
        public int totalCombatPower;
        public CharacterAttributesDTO newAttributes;
        public string honorTitle;
        public string message;
    }

    [Serializable]
    public class RefineResultDTO
    {
        public bool success;
        public int slotIndex;
        public int oldRefineLevel;
        public int newRefineLevel;
        public bool isLevelUp;
        public bool isLevelDown;
        public string message;
        public int totalCombatPower;
        public int gold;
    }

    [Serializable]
    public class SocketResultDTO
    {
        public bool success;
        public int equipmentSlotIndex;
        public int socketIndex;
        public string gemItemId;
        public string message;
        public int totalCombatPower;
    }

    [Serializable]
    public class CardAlbumEntryDTO
    {
        public string cardId;
        public string name;
        public string rarity;
        public string icon;
        public string image;
        public int count;
        public bool isEquipped;
        public int equippedSlot;
        public string activeEffectText;
    }

    [Serializable]
    public class CardsUpdateDTO
    {
        public CardAlbumEntryDTO[] cards;
        public string equippedWeaponCardId;
        public string equippedArmorCardId;
        public string message;
        public int totalCombatPower;
    }

    [Serializable]
    public class CharacterSlotSummaryDTO
    {
        public int slotIndex;
        public bool isEmpty;
        public string id;
        public string name;
        public string classType;
        public int level;
        public int currentWorld;
        public int currentStage;
        public int combatPower;
        public int currentHp;
        public int maxHp;
        public int gold;
        public int rebornCount;
        public string slot1Skill;
        public string slot2Skill;
        public string slot3Skill;
        public string slot4Skill;
    }

    [Serializable]
    public class CharacterListDTO
    {
        public string accountId;
        public string accountUsername;
        public CharacterSlotSummaryDTO[] slots;
        public string message;
    }

    [Serializable]
    public class AuthSuccessDTO
    {
        public string accountId;
        public string accountUsername;
        public string provider;
        public bool isActivated;
        public string message;
    }

    [Serializable]
    public class AuthErrorDTO
    {
        public string errorCode;
        public string errorMessage;
    }

    [Serializable]
    public class FarmHelperSettingsDTO
    {
        public bool autoHpPotionEnabled;
        public int autoHpPotionThreshold;
        public bool autoMpPotionEnabled;
        public int autoMpPotionThreshold;
        public bool autoSellCommon;
        public bool autoSellUncommon;
        public bool autoSellRare;
        public bool autoLootEnabled;
    }

    [Serializable]
    public class FarmSettingsUpdateDTO
    {
        public FarmHelperSettingsDTO settings;
        public string message;
    }

    [Serializable]
    public class AutoSalvageResultDTO
    {
        public int itemsSold;
        public int goldEarned;
        public int newGoldTotal;
        public string message;
    }

    [Serializable]
    public class ExpandInventoryResultDTO
    {
        public bool success;
        public int newMaxSlots;
        public int goldSpent;
        public int remainingGold;
        public int nextExpansionCost;
        public int nextExpansionMinLevel;
        public string message;
    }

    [Serializable]
    public class LeaderboardEntryDTO
    {
        public int rank;
        public string characterId;
        public string name;
        public string classType;
        public int level;
        public int rebornCount;
        public int combatPower;
        public int currentWorld;
        public int currentStage;
        public int gold;
        public string honorTitle;
    }

    [Serializable]
    public class LeaderboardUpdateDTO
    {
        public string category;
        public LeaderboardEntryDTO[] entries;
        public int myRank;
        public LeaderboardEntryDTO myEntry;
        public long timestamp;
    }

    [Serializable]
    public class DungeonRewardItemDTO
    {
        public string itemId;
        public int quantity;
    }

    [Serializable]
    public class DailyDungeonInfoDTO
    {
        public int ticketsRemaining;
        public int maxDailyFreeTickets;
        public int extraTicketsBoughtToday;
        public int maxExtraTicketsPerDay;
        public int extraTicketCostGold;
        public int highestBossRushWave;
        public int fastestBossRushTimeSec;
        public int totalDungeonsCleared;
        public string resetDate;
        public bool isDungeonActive;
        public string activeDungeonType;
    }

    [Serializable]
    public class EnterDungeonDTO
    {
        public string dungeonType;
    }

    [Serializable]
    public class DungeonEventDTO
    {
        public string status;
        public string dungeonType;
        public int currentWave;
        public int maxWaves;
        public int timeLimitSec;
        public int remainingTimeSec;
        public string bossEntityId;
        public string bossName;
        public int bossMaxHp;
        public int bossCurrentHp;
        public int totalDamageDealt;
        public int goldEarned;
        public int expEarned;
        public DungeonRewardItemDTO[] itemRewards;
        public string message;
    }

    [Serializable]
    public class BuyDungeonTicketResultDTO
    {
        public bool success;
        public int ticketsRemaining;
        public int extraTicketsBoughtToday;
        public int goldSpent;
        public int remainingGold;
        public string message;
    }
}
