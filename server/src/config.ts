export const SERVER_CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  
  // Game Loop Configuration (20Hz = 50ms per tick)
  TICK_RATE: 20,
  TICK_INTERVAL_MS: 50, // 1000 / 20
  TICK_DELTA_TIME_SEC: 0.05, // 1 / 20

  // Server Authoritative Bounds & Anticheat Constraints
  MAX_ALLOWED_SPEED: 8.0, // Hard cap to detect speed hack / teleportation
  MAP_BOUNDS: {
    minX: -60,
    maxX: 60,
    minZ: -60,
    maxZ: 60,
  },

  // Visibility / Snapshot radius (units)
  VISIBILITY_RADIUS: 120.0,

  // QoS / Heartbeat
  PING_INTERVAL_MS: 5000,
  CLIENT_TIMEOUT_MS: 15000,
} as const;
