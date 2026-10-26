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

        // Combat & Actions (0x30 - 0x3F)
        C2S_ATTACK_TARGET = 0x30,
        S2C_COMBAT_EVENT = 0x31,
        S2C_ENTITY_STAT_UPDATE = 0x32,
        C2S_CAST_SKILL = 0x33,
        S2C_SKILL_CAST_EVENT = 0x34,

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
}
