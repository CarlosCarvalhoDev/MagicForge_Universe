import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { Connection } from './Connection';
import { PacketHandler } from './PacketHandler';
import { World } from '../game/World';
import { SERVER_CONFIG } from '../config';

export class ServerNetwork {
  private wss: WebSocketServer;
  private world: World;
  private packetHandler: PacketHandler;
  private connections = new Map<string, Connection>();
  private connectionCounter: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer, world: World) {
    this.world = world;
    this.packetHandler = new PacketHandler(world);

    this.wss = new WebSocketServer({ server });
    this.setupListeners();
    this.startHeartbeat();
  }

  private setupListeners(): void {
    this.wss.on('connection', (socket: WebSocket, req) => {
      this.connectionCounter++;
      const connId = `conn_${Date.now()}_${this.connectionCounter}`;
      const connection = new Connection(connId, socket);

      this.connections.set(connId, connection);
      this.world.registerConnection(connection);

      const ip = req.socket.remoteAddress;
      console.log(`[ServerNetwork] Client connected: ${connId} (IP: ${ip}). Active connections: ${this.connections.size}`);

      socket.on('message', (data) => {
        const rawString = typeof data === 'string' ? data : data.toString('utf-8');
        this.packetHandler.handlePacket(connection, rawString);
      });

      socket.on('close', (code, reason) => {
        console.log(`[ServerNetwork] Client disconnected: ${connId} (code: ${code}, reason: ${reason || 'none'})`);
        this.connections.delete(connId);
        this.world.unregisterConnection(connection);
      });

      socket.on('error', (err) => {
        console.error(`[ServerNetwork] Socket error on ${connId}:`, err);
      });
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, conn] of this.connections) {
        if (now - conn.lastPingTime > SERVER_CONFIG.CLIENT_TIMEOUT_MS) {
          console.warn(`[ServerNetwork] Client ${id} timed out. Terminating connection.`);
          conn.close(1001, 'Heartbeat timeout');
          this.connections.delete(id);
          this.world.unregisterConnection(conn);
        }
      }
    }, SERVER_CONFIG.PING_INTERVAL_MS);
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}
