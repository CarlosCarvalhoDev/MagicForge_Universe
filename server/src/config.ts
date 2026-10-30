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

  // OAuth & Social Authentication Security
  AUTH: {
    ALLOW_MOCK_SOCIAL_AUTH: process.env.ALLOW_MOCK_SOCIAL_AUTH === 'true' || process.env.NODE_ENV === 'test',
    GOOGLE_CLIENT_IDS: (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    DISCORD_CLIENT_IDS: (process.env.DISCORD_CLIENT_IDS || process.env.DISCORD_CLIENT_ID || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    FACEBOOK_APP_IDS: (process.env.FACEBOOK_APP_IDS || process.env.FACEBOOK_APP_ID || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
} as const;
