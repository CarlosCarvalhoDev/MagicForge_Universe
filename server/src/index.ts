import http from 'http';
import { SERVER_CONFIG } from './config';
import { World } from './game/World';
import { GameLoop } from './game/GameLoop';
import { ServerNetwork } from './network/ServerNetwork';

console.log('========================================================');
console.log('       ⚔️  MAGICFORGE: UNIVERSE - GAME SERVER ⚔️        ');
console.log('========================================================');

// 1. Create HTTP Server (for health-checks and WebSocket upgrade)
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        game: 'MagicForge: Universe',
        tickRate: `${SERVER_CONFIG.TICK_RATE}Hz`,
        tickIntervalMs: `${SERVER_CONFIG.TICK_INTERVAL_MS}ms`,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: Date.now(),
      })
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

// 2. Initialize Game World
const world = new World();

// 3. Initialize Authoritative 20Hz Game Loop
const gameLoop = new GameLoop((deltaTimeSec) => {
  world.update(deltaTimeSec);
});

// 4. Initialize Network Layer (WebSockets)
const network = new ServerNetwork(httpServer, world);

// 5. Start Server
httpServer.listen(SERVER_CONFIG.PORT, () => {
  console.log(`[Server] HTTP & WebSocket listening on port :${SERVER_CONFIG.PORT}`);
  console.log(`[Server] Tick Rate: ${SERVER_CONFIG.TICK_RATE}Hz | Delta Time: ${SERVER_CONFIG.TICK_DELTA_TIME_SEC}s`);
  console.log(`[Server] Health Check available at http://localhost:${SERVER_CONFIG.PORT}/health`);
  console.log(`[Server] WebSocket endpoint: ws://localhost:${SERVER_CONFIG.PORT}`);

  // Start authoritative loop
  gameLoop.start();
});

// Graceful Shutdown
function handleShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Gracefully stopping server...`);
  world.saveAllPlayers();
  gameLoop.stop();
  network.close();
  httpServer.close(() => {
    console.log('[Server] Server closed successfully.');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
