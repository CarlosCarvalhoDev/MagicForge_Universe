import {
  CharacterClass,
  Opcode,
  PartyMemberPayload,
  S2CPartyUpdatePayload,
  S2CPartyInviteReceivedPayload,
  S2CPartyActionResultPayload,
  distance,
} from '@magicforge/shared';
import { Player } from '../entities/Player';
import { Connection } from '../network/Connection';
import { World } from './World';

export class Party {
  public readonly id: string;
  public leaderId: string;
  public members = new Map<string, Player>();
  public readonly maxMembers: number = 4;
  public createdAt: number = Date.now();

  constructor(id: string, leader: Player) {
    this.id = id;
    this.leaderId = leader.id;
    this.members.set(leader.id, leader);
  }

  public getMemberCount(): number {
    return this.members.size;
  }

  public isLeader(playerId: string): boolean {
    return this.leaderId === playerId;
  }

  public addMember(player: Player): boolean {
    if (this.members.size >= this.maxMembers) return false;
    this.members.set(player.id, player);
    return true;
  }

  public removeMember(playerId: string): boolean {
    return this.members.delete(playerId);
  }

  public getAllMembers(): Player[] {
    return Array.from(this.members.values());
  }
}

export class PartyManager {
  private parties = new Map<string, Party>();
  private playerToParty = new Map<string, string>(); // playerId -> partyId
  private pendingInvites = new Map<string, string>(); // targetPlayerId -> inviterPlayerId
  private connectionsProvider: () => Iterable<Connection>;

  constructor(connectionsProvider: () => Iterable<Connection>) {
    this.connectionsProvider = connectionsProvider;
  }

  private findConnectionByPlayerId(playerId: string): Connection | null {
    for (const conn of this.connectionsProvider()) {
      if (conn.playerId === playerId && conn.isAuthenticated) {
        return conn;
      }
    }
    return null;
  }

  private findConnectionByPlayerName(name: string): Connection | null {
    const cleanName = name.trim().toLowerCase();
    for (const conn of this.connectionsProvider()) {
      const world = conn.currentWorldInstance as World | null;
      if (world && conn.playerId) {
        const player = world.entityManager.getPlayer(conn.playerId);
        if (player && player.name.toLowerCase() === cleanName) {
          return conn;
        }
      }
    }
    return null;
  }

  public getPlayerParty(playerId: string): Party | null {
    const partyId = this.playerToParty.get(playerId);
    if (!partyId) return null;
    return this.parties.get(partyId) || null;
  }

  /**
   * Envia convite de grupo para um jogador específico
   */
  public invitePlayer(
    inviterConn: Connection,
    targetPlayerIdOrName: string
  ): { success: boolean; reason?: string; message: string } {
    if (!inviterConn.isAuthenticated || !inviterConn.playerId) {
      return { success: false, reason: 'UNAUTHENTICATED', message: 'Você precisa estar logado.' };
    }

    const inviterWorld = inviterConn.currentWorldInstance as World | null;
    if (!inviterWorld) {
      return { success: false, reason: 'NO_WORLD', message: 'Nenhuma arena ativa.' };
    }

    const inviter = inviterWorld.entityManager.getPlayer(inviterConn.playerId);
    if (!inviter) {
      return { success: false, reason: 'PLAYER_NOT_FOUND', message: 'Personagem não encontrado.' };
    }

    // Localiza o jogador alvo por ID ou por Nome
    let targetConn = this.findConnectionByPlayerId(targetPlayerIdOrName);
    if (!targetConn) {
      targetConn = this.findConnectionByPlayerName(targetPlayerIdOrName);
    }

    if (!targetConn || !targetConn.playerId) {
      return { success: false, reason: 'TARGET_NOT_FOUND', message: 'Jogador não encontrado ou offline.' };
    }

    if (targetConn.playerId === inviter.id) {
      return { success: false, reason: 'CANNOT_INVITE_SELF', message: 'Você não pode convidar a si mesmo.' };
    }

    // Se o inviter já estiver em uma party, verifica se ele é o líder e se há vaga
    const existingParty = this.getPlayerParty(inviter.id);
    if (existingParty) {
      if (!existingParty.isLeader(inviter.id)) {
        return { success: false, reason: 'NOT_LEADER', message: 'Apenas o líder do grupo pode convidar membros.' };
      }
      if (existingParty.getMemberCount() >= existingParty.maxMembers) {
        return { success: false, reason: 'PARTY_FULL', message: 'O grupo já atingiu o limite de 4 membros.' };
      }
    }

    // Verifica se o alvo já tem grupo
    if (this.playerToParty.has(targetConn.playerId)) {
      return { success: false, reason: 'TARGET_ALREADY_IN_PARTY', message: 'Este jogador já faz parte de um grupo.' };
    }

    // Registra convite pendente
    this.pendingInvites.set(targetConn.playerId, inviter.id);

    // Envia notificação de convite para o alvo
    targetConn.send(Opcode.S2C_PARTY_INVITE_RECEIVED, {
      partyId: existingParty?.id,
      inviterId: inviter.id,
      inviterName: inviter.name,
      inviterLevel: inviter.level,
      inviterClass: inviter.classType,
    } as S2CPartyInviteReceivedPayload);

    inviterConn.send(Opcode.S2C_PARTY_ACTION_RESULT, {
      action: 'INVITE',
      success: true,
      message: `Convite de grupo enviado com sucesso para "${targetPlayerIdOrName}".`,
    } as S2CPartyActionResultPayload);

    return { success: true, message: 'Convite enviado.' };
  }

  /**
   * Resposta a um convite recebido
   */
  public respondInvite(connection: Connection, inviterId: string, accept: boolean): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const targetPlayerId = connection.playerId;

    const expectedInviterId = this.pendingInvites.get(targetPlayerId);
    if (!expectedInviterId || expectedInviterId !== inviterId) {
      connection.send(Opcode.S2C_PARTY_ACTION_RESULT, {
        action: 'JOIN',
        success: false,
        reason: 'INVITE_EXPIRED',
        message: 'O convite expirou ou não é válido.',
      } as S2CPartyActionResultPayload);
      return;
    }

    this.pendingInvites.delete(targetPlayerId);

    const inviterConn = this.findConnectionByPlayerId(inviterId);
    if (!accept) {
      if (inviterConn) {
        inviterConn.send(Opcode.S2C_PARTY_ACTION_RESULT, {
          action: 'INVITE',
          success: false,
          reason: 'REJECTED',
          message: 'O jogador recusou o seu convite de grupo.',
        } as S2CPartyActionResultPayload);
      }
      return;
    }

    // Aceitou: valida existência e instâncias
    const targetWorld = connection.currentWorldInstance as World | null;
    const targetPlayer = targetWorld?.entityManager.getPlayer(targetPlayerId);
    if (!targetWorld || !targetPlayer) return;

    if (!inviterConn || !inviterConn.currentWorldInstance) {
      connection.send(Opcode.S2C_PARTY_ACTION_RESULT, {
        action: 'JOIN',
        success: false,
        reason: 'INVITER_OFFLINE',
        message: 'O líder do grupo desconectou.',
      } as S2CPartyActionResultPayload);
      return;
    }

    const inviterWorld = inviterConn.currentWorldInstance as World;
    const inviterPlayer = inviterWorld.entityManager.getPlayer(inviterId);
    if (!inviterPlayer) return;

    let party = this.getPlayerParty(inviterId);
    if (!party) {
      // Cria novo grupo
      const partyId = `party_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      party = new Party(partyId, inviterPlayer);
      this.parties.set(partyId, party);
      this.playerToParty.set(inviterPlayer.id, partyId);
    }

    if (party.getMemberCount() >= party.maxMembers) {
      connection.send(Opcode.S2C_PARTY_ACTION_RESULT, {
        action: 'JOIN',
        success: false,
        reason: 'PARTY_FULL',
        message: 'O grupo atingiu a capacidade máxima.',
      } as S2CPartyActionResultPayload);
      return;
    }

    party.addMember(targetPlayer);
    this.playerToParty.set(targetPlayer.id, party.id);

    this.broadcastPartyUpdate(party, `"${targetPlayer.name}" entrou no grupo!`);
  }

  /**
   * Jogador sai voluntariamente do grupo
   */
  public leaveParty(connection: Connection): void {
    if (!connection.isAuthenticated || !connection.playerId) return;
    const playerId = connection.playerId;

    const party = this.getPlayerParty(playerId);
    if (!party) return;

    party.removeMember(playerId);
    this.playerToParty.delete(playerId);

    // Notifica o jogador que saiu que ele não tem mais grupo
    connection.send(Opcode.S2C_PARTY_UPDATE, {
      partyId: null,
      leaderId: null,
      members: [],
      isDisbanded: true,
      message: 'Você saiu do grupo.',
    } as S2CPartyUpdatePayload);

    // Se sobrou 1 ou nenhum membro, desfaz a party
    if (party.getMemberCount() <= 1) {
      const remainingPlayer = party.getAllMembers()[0];
      if (remainingPlayer) {
        this.playerToParty.delete(remainingPlayer.id);
        const remConn = this.findConnectionByPlayerId(remainingPlayer.id);
        if (remConn) {
          remConn.send(Opcode.S2C_PARTY_UPDATE, {
            partyId: null,
            leaderId: null,
            members: [],
            isDisbanded: true,
            message: 'O grupo foi desfeito por falta de membros.',
          } as S2CPartyUpdatePayload);
        }
      }
      this.parties.delete(party.id);
      return;
    }

    // Se quem saiu era o líder, transfere a liderança para o próximo membro
    if (party.leaderId === playerId) {
      const newLeader = party.getAllMembers()[0];
      party.leaderId = newLeader.id;
      this.broadcastPartyUpdate(party, `"${newLeader.name}" é o novo líder do grupo.`);
    } else {
      this.broadcastPartyUpdate(party, 'Um membro deixou o grupo.');
    }
  }

  /**
   * Líder expulsa um membro do grupo
   */
  public kickMember(leaderConn: Connection, targetPlayerId: string): void {
    if (!leaderConn.isAuthenticated || !leaderConn.playerId) return;

    const party = this.getPlayerParty(leaderConn.playerId);
    if (!party || !party.isLeader(leaderConn.playerId)) {
      leaderConn.send(Opcode.S2C_PARTY_ACTION_RESULT, {
        action: 'KICK',
        success: false,
        reason: 'NOT_LEADER',
        message: 'Apenas o líder pode expulsar membros do grupo.',
      } as S2CPartyActionResultPayload);
      return;
    }

    if (targetPlayerId === leaderConn.playerId) {
      leaderConn.send(Opcode.S2C_PARTY_ACTION_RESULT, {
        action: 'KICK',
        success: false,
        reason: 'CANNOT_KICK_SELF',
        message: 'O líder não pode expulsar a si mesmo (use Sair do Grupo).',
      } as S2CPartyActionResultPayload);
      return;
    }

    const kickedPlayer = party.members.get(targetPlayerId);
    party.removeMember(targetPlayerId);
    this.playerToParty.delete(targetPlayerId);

    const kickedConn = this.findConnectionByPlayerId(targetPlayerId);
    if (kickedConn) {
      kickedConn.send(Opcode.S2C_PARTY_UPDATE, {
        partyId: null,
        leaderId: null,
        members: [],
        isDisbanded: true,
        message: 'Você foi removido do grupo pelo líder.',
      } as S2CPartyUpdatePayload);
    }

    if (party.getMemberCount() <= 1) {
      const remainingPlayer = party.getAllMembers()[0];
      if (remainingPlayer) {
        this.playerToParty.delete(remainingPlayer.id);
        const remConn = this.findConnectionByPlayerId(remainingPlayer.id);
        if (remConn) {
          remConn.send(Opcode.S2C_PARTY_UPDATE, {
            partyId: null,
            leaderId: null,
            members: [],
            isDisbanded: true,
            message: 'O grupo foi desfeito por falta de membros.',
          } as S2CPartyUpdatePayload);
        }
      }
      this.parties.delete(party.id);
      return;
    }

    this.broadcastPartyUpdate(party, `"${kickedPlayer?.name || 'Membro'}" foi removido do grupo.`);
  }

  /**
   * Transfere liderança do grupo
   */
  public promoteLeader(leaderConn: Connection, targetPlayerId: string): void {
    if (!leaderConn.isAuthenticated || !leaderConn.playerId) return;

    const party = this.getPlayerParty(leaderConn.playerId);
    if (!party || !party.isLeader(leaderConn.playerId)) return;

    if (!party.members.has(targetPlayerId)) return;

    party.leaderId = targetPlayerId;
    const newLeader = party.members.get(targetPlayerId);
    this.broadcastPartyUpdate(party, `A liderança do grupo foi transferida para "${newLeader?.name}".`);
  }

  /**
   * Líder desfaz a party
   */
  public disbandParty(leaderConn: Connection): void {
    if (!leaderConn.isAuthenticated || !leaderConn.playerId) return;

    const party = this.getPlayerParty(leaderConn.playerId);
    if (!party || !party.isLeader(leaderConn.playerId)) return;

    for (const member of party.getAllMembers()) {
      this.playerToParty.delete(member.id);
      const memberConn = this.findConnectionByPlayerId(member.id);
      if (memberConn) {
        memberConn.send(Opcode.S2C_PARTY_UPDATE, {
          partyId: null,
          leaderId: null,
          members: [],
          isDisbanded: true,
          message: 'O grupo foi desfeito pelo líder.',
        } as S2CPartyUpdatePayload);
      }
    }

    this.parties.delete(party.id);
  }

  /**
   * Trata desconexão de um membro
   */
  public handlePlayerDisconnect(playerId: string): void {
    this.pendingInvites.delete(playerId);
    const party = this.getPlayerParty(playerId);
    if (!party) return;

    // Se era o líder e há outros membros, passa liderança
    if (party.isLeader(playerId) && party.getMemberCount() > 1) {
      party.removeMember(playerId);
      this.playerToParty.delete(playerId);
      const nextLeader = party.getAllMembers()[0];
      party.leaderId = nextLeader.id;
      this.broadcastPartyUpdate(party, `Líder desconectou. Liderança transferida para "${nextLeader.name}".`);
    } else {
      party.removeMember(playerId);
      this.playerToParty.delete(playerId);
      if (party.getMemberCount() <= 1) {
        const remaining = party.getAllMembers()[0];
        if (remaining) {
          this.playerToParty.delete(remaining.id);
          const remConn = this.findConnectionByPlayerId(remaining.id);
          if (remConn) {
            remConn.send(Opcode.S2C_PARTY_UPDATE, {
              partyId: null,
              leaderId: null,
              members: [],
              isDisbanded: true,
              message: 'O grupo foi desfeito.',
            } as S2CPartyUpdatePayload);
          }
        }
        this.parties.delete(party.id);
      } else {
        this.broadcastPartyUpdate(party, 'Um membro desconectou e saiu do grupo.');
      }
    }
  }

  /**
   * Envia atualização autoritativa do grupo para todos os membros
   */
  public broadcastPartyUpdate(party: Party, message?: string): void {
    const memberPayloads: PartyMemberPayload[] = [];
    for (const player of party.getAllMembers()) {
      const conn = this.findConnectionByPlayerId(player.id);
      memberPayloads.push({
        playerId: player.id,
        name: player.name,
        classType: player.classType,
        level: player.level,
        currentHp: player.currentHp,
        maxHp: player.maxHp,
        currentResource: player.currentResource,
        maxResource: player.maxResource,
        isLeader: party.isLeader(player.id),
        isOnline: conn !== null,
        worldIndex: player.currentWorld,
        channelId: conn?.currentChannelId || 1,
      });
    }

    const payload: S2CPartyUpdatePayload = {
      partyId: party.id,
      leaderId: party.leaderId,
      members: memberPayloads,
      isDisbanded: false,
      message,
    };

    for (const player of party.getAllMembers()) {
      const conn = this.findConnectionByPlayerId(player.id);
      if (conn) {
        conn.send(Opcode.S2C_PARTY_UPDATE, payload);
      }
    }
  }

  /**
   * Bônus de EXP Cooperativa em Grupo:
   * Membros no mesmo canal a até 25 metros de distância ganham EXP compartilhada
   * com bônus de cooperação (+10% de EXP por membro próximo adicional).
   */
  public distributePartyExp(killer: Player, baseExp: number, world: World): void {
    const party = this.getPlayerParty(killer.id);
    if (!party) {
      // Sem grupo: killer recebe EXP normal
      killer.addExperience(baseExp);
      world.sendExpUpdate(killer, baseExp);
      return;
    }

    // Filtra membros da party no mesmo mundo/canal e dentro de 25m do killer
    const nearbyMembers: Player[] = [];
    for (const member of party.getAllMembers()) {
      const conn = this.findConnectionByPlayerId(member.id);
      if (conn && conn.currentWorldInstance === world && distance(killer.position, member.position) <= 25.0) {
        nearbyMembers.push(member);
      }
    }

    if (nearbyMembers.length <= 1) {
      // Nenhum companheiro próximo: killer ganha EXP normal
      killer.addExperience(baseExp);
      world.sendExpUpdate(killer, baseExp);
      return;
    }

    // Bônus cooperativo: +10% por membro adicional no raio de compartilhamento
    const bonusMultiplier = 1.0 + (nearbyMembers.length - 1) * 0.10;
    const totalGroupExp = Math.round(baseExp * bonusMultiplier);
    const expPerMember = Math.max(1, Math.round(totalGroupExp / nearbyMembers.length));

    for (const member of nearbyMembers) {
      member.addExperience(expPerMember);
      world.sendExpUpdate(member, expPerMember);
    }
  }
}

