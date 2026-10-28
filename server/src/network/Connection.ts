import { WebSocket } from 'ws';
import { NetworkMessage, Opcode } from '@magicforge/shared';

export class Connection {
  public readonly id: string;
  public readonly socket: WebSocket;
  public playerId: string | null = null;
  public accountId: string | null = null;
  public accountUsername: string | null = null;
  public isAuthenticated: boolean = false;
  public lastPingTime: number = Date.now();
  public latencyMs: number = 0;

  constructor(id: string, socket: WebSocket) {
    this.id = id;
    this.socket = socket;
  }

  public send<T>(op: Opcode, data: T): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: NetworkMessage<T> = {
      op,
      timestamp: Date.now(),
      data,
    };

    try {
      this.socket.send(JSON.stringify(message));
    } catch (err) {
      console.error(`[Connection ${this.id}] Error sending packet ${Opcode[op]}:`, err);
    }
  }

  public close(code = 1000, reason = 'Normal closure'): void {
    try {
      this.socket.close(code, reason);
    } catch {
      // Ignore already closed errors
    }
  }
}
