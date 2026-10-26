import {
  C2SAttackTargetPayload,
  C2SLoginPayload,
  C2SMoveInputPayload,
  C2SPingPayload,
  CharacterClass,
  NetworkMessage,
  Opcode,
  S2CCombatEventPayload,
  S2CLoginSuccessPayload,
  S2CPongPayload,
  S2CPositionCorrectionPayload,
  S2CWorldSnapshotPayload,
  Vector3,
} from '@magicforge/shared';

export type MessageListener<T> = (data: T) => void;

export class ClientNetwork {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private inputSequence: number = 0;
  private pingIntervalId: number | null = null;

  public isConnected: boolean = false;
  public myPlayerId: string | null = null;
  public currentLatencyMs: number = 0;

  // Listeners
  public onLoginSuccess: MessageListener<S2CLoginSuccessPayload> | null = null;
  public onSnapshot: MessageListener<S2CWorldSnapshotPayload> | null = null;
  public onCombatEvent: MessageListener<S2CCombatEventPayload> | null = null;
  public onPositionCorrection: MessageListener<S2CPositionCorrectionPayload> | null = null;
  public onLatencyUpdated: ((pingMs: number) => void) | null = null;
  public onConnectionStateChange: ((connected: boolean) => void) | null = null;

  constructor(serverUrl = 'ws://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  public connect(): void {
    if (this.ws) {
      this.disconnect();
    }

    console.log(`[ClientNetwork] Connecting to ${this.serverUrl}...`);
    this.ws = new WebSocket(this.serverUrl);

    this.ws.onopen = () => {
      console.log('[ClientNetwork] Connected to WebSocket server!');
      this.isConnected = true;
      this.onConnectionStateChange?.(true);
      this.startPingHeartbeat();
    };

    this.ws.onclose = () => {
      console.warn('[ClientNetwork] Disconnected from WebSocket server.');
      this.isConnected = false;
      this.onConnectionStateChange?.(false);
      this.stopPingHeartbeat();
    };

    this.ws.onerror = (err) => {
      console.error('[ClientNetwork] WebSocket error:', err);
    };

    this.ws.onmessage = (event) => {
      this.handleIncomingRaw(event.data);
    };
  }

  public disconnect(): void {
    this.stopPingHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public send<T>(op: Opcode, data: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const msg: NetworkMessage<T> = {
      op,
      timestamp: Date.now(),
      seq: ++this.inputSequence,
      data,
    };

    this.ws.send(JSON.stringify(msg));
  }

  public login(characterName: string, classType: CharacterClass): void {
    const payload: C2SLoginPayload = {
      characterName,
      classType,
      clientVersion: '1.0.0',
    };
    this.send(Opcode.C2S_LOGIN, payload);
  }

  public sendMoveInput(targetPosition: Vector3, currentClientPosition: Vector3): number {
    const seq = ++this.inputSequence;
    const payload: C2SMoveInputPayload = {
      targetPosition,
      currentClientPosition,
      inputSequence: seq,
    };
    this.send(Opcode.C2S_MOVE_INPUT, payload);
    return seq;
  }

  public sendAttackTarget(targetEntityId: string): void {
    const payload: C2SAttackTargetPayload = { targetEntityId };
    this.send(Opcode.C2S_ATTACK_TARGET, payload);
  }

  private startPingHeartbeat(): void {
    this.stopPingHeartbeat();
    this.pingIntervalId = window.setInterval(() => {
      if (this.isConnected) {
        const payload: C2SPingPayload = { clientSendTime: performance.now() };
        this.send(Opcode.C2S_PING, payload);
      }
    }, 2000);
  }

  private stopPingHeartbeat(): void {
    if (this.pingIntervalId !== null) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private handleIncomingRaw(rawData: string): void {
    try {
      const packet = JSON.parse(rawData) as NetworkMessage;
      switch (packet.op) {
        case Opcode.S2C_LOGIN_SUCCESS: {
          const data = packet.data as S2CLoginSuccessPayload;
          this.myPlayerId = data.playerId;
          this.onLoginSuccess?.(data);
          break;
        }

        case Opcode.S2C_WORLD_SNAPSHOT: {
          this.onSnapshot?.(packet.data as S2CWorldSnapshotPayload);
          break;
        }

        case Opcode.S2C_COMBAT_EVENT: {
          this.onCombatEvent?.(packet.data as S2CCombatEventPayload);
          break;
        }

        case Opcode.S2C_POSITION_CORRECTION: {
          this.onPositionCorrection?.(packet.data as S2CPositionCorrectionPayload);
          break;
        }

        case Opcode.S2C_PONG: {
          const pong = packet.data as S2CPongPayload;
          const rtt = performance.now() - pong.clientSendTime;
          this.currentLatencyMs = Math.round(rtt);
          this.onLatencyUpdated?.(this.currentLatencyMs);
          break;
        }
      }
    } catch (err) {
      console.error('[ClientNetwork] Error parsing incoming packet:', err);
    }
  }
}
