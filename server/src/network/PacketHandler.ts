import {
  C2SAttackTargetPayload,
  C2SLoginPayload,
  C2SMoveInputPayload,
  C2SPingPayload,
  NetworkMessage,
  Opcode,
  S2CLoginSuccessPayload,
  S2CPongPayload,
  S2CPositionCorrectionPayload,
  distance,
} from '@magicforge/shared';
import { Connection } from './Connection';
import { World } from '../game/World';
import { SERVER_CONFIG } from '../config';

export class PacketHandler {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  public handlePacket(connection: Connection, rawData: string): void {
    let message: NetworkMessage;
    try {
      message = JSON.parse(rawData) as NetworkMessage;
    } catch {
      console.warn(`[PacketHandler] Invalid JSON received from connection ${connection.id}`);
      return;
    }

    if (!message || typeof message.op !== 'number') {
      return;
    }

    switch (message.op) {
      case Opcode.C2S_LOGIN:
        this.handleLogin(connection, message.data as C2SLoginPayload);
        break;

      case Opcode.C2S_MOVE_INPUT:
        this.handleMoveInput(connection, message.data as C2SMoveInputPayload);
        break;

      case Opcode.C2S_ATTACK_TARGET:
        this.handleAttackTarget(connection, message.data as C2SAttackTargetPayload);
        break;

      case Opcode.C2S_PING:
        this.handlePing(connection, message.data as C2SPingPayload);
        break;

      default:
        console.warn(`[PacketHandler] Unhandled opcode: 0x${message.op.toString(16)}`);
        break;
    }
  }

  private handleLogin(connection: Connection, payload: C2SLoginPayload): void {
    if (!payload || !payload.characterName) {
      connection.close(1008, 'Invalid login credentials');
      return;
    }

    const player = this.world.createPlayer(connection, payload.characterName, payload.classType);

    const successPayload: S2CLoginSuccessPayload = {
      playerId: player.id,
      characterName: player.name,
      classType: player.classType,
      position: player.position,
      stats: player.attributes,
      serverTickRate: SERVER_CONFIG.TICK_RATE,
      tickIntervalMs: SERVER_CONFIG.TICK_INTERVAL_MS,
    };

    connection.send(Opcode.S2C_LOGIN_SUCCESS, successPayload);
  }

  private handleMoveInput(connection: Connection, payload: C2SMoveInputPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) {
      return;
    }

    const player = this.world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) {
      return;
    }

    if (!payload.targetPosition) {
      return;
    }

    // Anticheat: Check if client claims to be radically far away from server authoritative position
    if (payload.currentClientPosition) {
      const clientServerDrift = distance(player.position, payload.currentClientPosition);
      const maxAllowedDrift = 5.0; // 5 meters tolerance for latency
      if (clientServerDrift > maxAllowedDrift) {
        // Force client position reconciliation / snap-back
        connection.send(Opcode.S2C_POSITION_CORRECTION, {
          lastProcessedInputSeq: payload.inputSequence,
          authoritativePosition: player.position,
          reason: 'DESYNC',
        } as S2CPositionCorrectionPayload);
      }
    }

    // Set authoritative destination
    player.setMoveDestination(payload.targetPosition, payload.inputSequence);
  }

  private handleAttackTarget(connection: Connection, payload: C2SAttackTargetPayload): void {
    if (!connection.isAuthenticated || !connection.playerId) return;

    const player = this.world.entityManager.getPlayer(connection.playerId);
    if (!player || player.isDead) return;

    player.targetId = payload.targetEntityId || null;
  }

  private handlePing(connection: Connection, payload: C2SPingPayload): void {
    const now = Date.now();
    connection.lastPingTime = now;
    if (payload && payload.clientSendTime) {
      connection.latencyMs = Math.max(0, (now - payload.clientSendTime) / 2);
    }

    const pongPayload: S2CPongPayload = {
      clientSendTime: payload ? payload.clientSendTime : 0,
      serverReceiveTime: now,
    };

    connection.send(Opcode.S2C_PONG, pongPayload);
  }
}
