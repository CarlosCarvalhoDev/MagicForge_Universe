import {
  DungeonType,
  DungeonEventStatus,
  DungeonRewardItem,
  S2CDungeonEventPayload,
  Opcode,
  createVector3,
} from '@magicforge/shared';
import { Player } from '../entities/Player';
import { Monster } from '../entities/Monster';
import type { World } from './World';

export interface ActiveDungeonSession {
  characterId: string;
  playerId: string;
  dungeonType: DungeonType;
  currentWave: number;
  maxWaves: number;
  timeLimitSec: number;
  remainingTimeSec: number;
  activeBossId: string | null;
  activeBossName: string | null;
  totalDamageDealt: number;
  goldEarned: number;
  expEarned: number;
  itemRewards: DungeonRewardItem[];
  status: DungeonEventStatus;
  waveTransitionTimerSec: number;
  startTime: number;
}

export class DungeonManager {
  private world: World;
  private activeSessions: Map<string, ActiveDungeonSession> = new Map();

  constructor(world: World) {
    this.world = world;
  }

  public getSession(characterId: string): ActiveDungeonSession | undefined {
    return this.activeSessions.get(characterId);
  }

  public isPlayerInDungeon(characterId: string): boolean {
    const session = this.activeSessions.get(characterId);
    return Boolean(session && session.status !== 'VICTORY' && session.status !== 'DEFEAT' && session.status !== 'TIMEOUT' && session.status !== 'LEFT');
  }

  /**
   * Inicia uma sessão de Masmorra Diária / Desafio dos Chefes
   */
  public startDungeon(player: Player, dungeonType: DungeonType): { success: boolean; message: string } {
    if (this.isPlayerInDungeon(player.id)) {
      return { success: false, message: 'Você já está em uma masmorra ativa!' };
    }

    // 1. Validação de Ingressos Diários no SQLite
    const charDbId = player.dbCharacterId || player.id;
    const hasTicket = this.world.db.consumeDailyDungeonTicket(charDbId);
    if (!hasTicket) {
      return {
        success: false,
        message: 'Você não possui ingressos de masmorra disponíveis hoje! Compre um ingresso extra com ouro ou aguarde o reset diário.',
      };
    }

    // 2. Criação da Sessão
    const maxWaves = dungeonType === 'BOSS_RUSH' ? 4 : 3;
    const initialTimeLimit = dungeonType === 'BOSS_RUSH' ? 90 : 60;

    const session: ActiveDungeonSession = {
      characterId: charDbId,
      playerId: player.id,
      dungeonType,
      currentWave: 1,
      maxWaves,
      timeLimitSec: initialTimeLimit,
      remainingTimeSec: initialTimeLimit,
      activeBossId: null,
      activeBossName: null,
      totalDamageDealt: 0,
      goldEarned: 0,
      expEarned: 0,
      itemRewards: [],
      status: 'START',
      waveTransitionTimerSec: 0,
      startTime: Date.now(),
    };

    this.activeSessions.set(player.id, session);

    // 3. Teleporta o jogador para a Arena da Masmorra
    player.position.x = 0;
    player.position.y = 0;
    player.position.z = -12;
    player.targetDestination = null;
    player.moveDirection = null;

    // 4. Spawna a Primeira Onda
    this.spawnWave(player, session);

    console.log(`[DungeonManager] Jogador "${player.name}" entrou na masmorra ${dungeonType} (Onda 1/${maxWaves})`);
    return { success: true, message: `Entrou no ${dungeonType}!` };
  }

  /**
   * Spawna o Chefe da Onda Atual na arena
   */
  private spawnWave(player: Player, session: ActiveDungeonSession): void {
    let bossName = '';
    let bossHp = 10000;
    let bossAtk = 40;
    let timeLimit = 90;

    if (session.dungeonType === 'BOSS_RUSH') {
      switch (session.currentWave) {
        case 1:
          bossName = 'Grimgor, o Furioso da Terra';
          bossHp = 18000;
          bossAtk = 45;
          timeLimit = 90;
          break;
        case 2:
          bossName = 'Frostbite, o Colosso do Gelo';
          bossHp = 42000;
          bossAtk = 80;
          timeLimit = 90;
          break;
        case 3:
          bossName = 'Ignis, o Tirano das Chamas';
          bossHp = 90000;
          bossAtk = 135;
          timeLimit = 90;
          break;
        case 4:
        default:
          bossName = 'Eco de Malakor, o Trono Sombrio';
          bossHp = 195000;
          bossAtk = 190;
          timeLimit = 120;
          break;
      }
    } else {
      // GOLD_TREASURY
      switch (session.currentWave) {
        case 1:
          bossName = 'Guardião Goblin do Tesouro';
          bossHp = 15000;
          bossAtk = 30;
          timeLimit = 60;
          break;
        case 2:
          bossName = 'Slime Dourado Ancião';
          bossHp = 35000;
          bossAtk = 50;
          timeLimit = 60;
          break;
        case 3:
        default:
          bossName = 'Rei Goblin da Fortuna';
          bossHp = 80000;
          bossAtk = 90;
          timeLimit = 60;
          break;
      }
    }

    session.timeLimitSec = timeLimit;
    session.remainingTimeSec = timeLimit;
    session.status = 'WAVE_START';

    const bossPos = createVector3(0, 0, 4);
    const boss = new Monster(`dungeon_boss_${session.characterId}_${session.currentWave}`, bossName, bossPos, bossHp, bossAtk);
    boss.aggroRadius = 60.0;
    boss.attackRange = 3.0;
    boss.attackIntervalSec = 1.6;
    boss.speed = 3.4;
    boss.expReward = 0; // EXP é entregue no resumo da masmorra autoritativamente

    this.world.entityManager.addMonster(boss);
    this.world.spatialGrid.updateEntity(boss);

    session.activeBossId = boss.id;
    session.activeBossName = boss.name;

    // Notifica o jogador
    const conn = this.world.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_DUNGEON_EVENT, {
        status: 'WAVE_START',
        dungeonType: session.dungeonType,
        currentWave: session.currentWave,
        maxWaves: session.maxWaves,
        timeLimitSec: session.timeLimitSec,
        remainingTimeSec: session.remainingTimeSec,
        bossEntityId: boss.id,
        bossName: boss.name,
        bossMaxHp: boss.maxHp,
        bossCurrentHp: boss.currentHp,
        totalDamageDealt: session.totalDamageDealt,
        goldEarned: session.goldEarned,
        expEarned: session.expEarned,
        itemRewards: session.itemRewards,
        message: `⚔️ ONDA ${session.currentWave}/${session.maxWaves}: ${boss.name} apareceu! Você tem ${session.timeLimitSec}s!`,
      } as S2CDungeonEventPayload);
    }
  }

  /**
   * Chamado quando um monstro é derrotado no World
   */
  public onMonsterKilled(monsterId: string, killerPlayer: Player): void {
    const session = this.activeSessions.get(killerPlayer.id);
    if (!session || session.activeBossId !== monsterId) {
      return;
    }

    // Acumula recompensas da onda superada (sem autocura artificial entre ondas)
    this.accumulateWaveRewards(session);

    if (session.currentWave < session.maxWaves) {
      // Avança para a próxima onda após pequeno intervalo
      session.status = 'WAVE_CLEAR';
      session.waveTransitionTimerSec = 2.5;
      session.activeBossId = null;

      const conn = this.world.connections.get(killerPlayer.id);
      if (conn) {
        conn.send(Opcode.S2C_DUNGEON_EVENT, {
          status: 'WAVE_CLEAR',
          dungeonType: session.dungeonType,
          currentWave: session.currentWave,
          maxWaves: session.maxWaves,
          timeLimitSec: session.timeLimitSec,
          remainingTimeSec: session.remainingTimeSec,
          totalDamageDealt: session.totalDamageDealt,
          goldEarned: session.goldEarned,
          expEarned: session.expEarned,
          itemRewards: session.itemRewards,
          message: `✨ Onda ${session.currentWave} Concluída! Prepare-se para a próxima onda!`,
        } as S2CDungeonEventPayload);
      }
    } else {
      // VITÓRIA TOTAL DA MASMORRA!
      this.completeDungeon(killerPlayer, session, 'VICTORY', '🎉 VITÓRIA TRIUNFAL! Todas as ondas da masmorra foram superadas!');
    }
  }

  /**
   * Acumula recompensas por onda
   */
  private accumulateWaveRewards(session: ActiveDungeonSession): void {
    if (session.dungeonType === 'BOSS_RUSH') {
      switch (session.currentWave) {
        case 1:
          session.goldEarned += 20000;
          session.expEarned += 10000;
          this.addItemReward(session, 'stone_forge_rare', 2);
          this.addItemReward(session, 'rune_fragment', 2);
          break;
        case 2:
          session.goldEarned += 45000;
          session.expEarned += 25000;
          this.addItemReward(session, 'stone_forge_rare', 3);
          this.addItemReward(session, 'stone_forge_mystic', 1);
          this.addItemReward(session, 'rune_fragment', 4);
          this.addItemReward(session, 'gem_sapphire_int', 1);
          break;
        case 3:
          session.goldEarned += 95000;
          session.expEarned += 60000;
          this.addItemReward(session, 'stone_forge_mystic', 2);
          this.addItemReward(session, 'rune_fragment', 6);
          this.addItemReward(session, 'gem_ruby_str', 1);
          this.addItemReward(session, 'card_boss_ignis', 1);
          break;
        case 4:
          session.goldEarned += 250000;
          session.expEarned += 150000;
          this.addItemReward(session, 'stone_forge_mystic', 5);
          this.addItemReward(session, 'rune_fragment', 12);
          this.addItemReward(session, 'relic_ancient_forge', 1);
          this.addItemReward(session, 'card_boss_frostbite', 1);
          this.addItemReward(session, 'card_boss_grimgor', 1);
          break;
      }
    } else {
      // GOLD_TREASURY
      session.goldEarned += 60000 * session.currentWave;
      session.expEarned += 15000 * session.currentWave;
      this.addItemReward(session, 'arcane_dust', 10 * session.currentWave);
      this.addItemReward(session, 'potion_hp_major', 2 * session.currentWave);
    }
  }

  private addItemReward(session: ActiveDungeonSession, itemId: string, quantity: number): void {
    const existing = session.itemRewards.find((r) => r.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      session.itemRewards.push({ itemId, quantity });
    }
  }

  /**
   * Finaliza a masmorra entregando loot e gravando recordes
   */
  private completeDungeon(player: Player, session: ActiveDungeonSession, status: DungeonEventStatus, message: string): void {
    session.status = status;
    const elapsedSec = Math.max(1, Math.floor((Date.now() - session.startTime) / 1000));

    // Se houve monstro ativo, remove-o
    if (session.activeBossId) {
      const boss = this.world.entityManager.getMonster(session.activeBossId);
      if (boss) {
        this.world.entityManager.removeMonster(boss.id);
        this.world.spatialGrid.removeEntity(boss.id);
      }
      session.activeBossId = null;
    }

    // 1. Entrega autoritativa de Ouro e EXP
    if (session.goldEarned > 0) {
      player.gold += session.goldEarned;
    }
    if (session.expEarned > 0) {
      player.addExperience(session.expEarned);
    }

    // 2. Entrega autoritativa dos itens de recompensa
    for (const reward of session.itemRewards) {
      this.world.deliverRewardItemToPlayer(player, reward.itemId, reward.quantity);
    }

    // 3. Salva jogador no SQLite
    this.world.db.savePlayer(player);

    // 4. Grava recordes de masmorra no SQLite
    const wavesCleared = status === 'VICTORY' ? session.maxWaves : Math.max(0, session.currentWave - 1);
    this.world.db.recordDungeonClear(player.dbCharacterId || player.id, wavesCleared, elapsedSec);

    // 5. Notifica o jogador do resultado final
    const conn = this.world.connections.get(player.id);
    if (conn) {
      conn.send(Opcode.S2C_DUNGEON_EVENT, {
        status,
        dungeonType: session.dungeonType,
        currentWave: session.currentWave,
        maxWaves: session.maxWaves,
        timeLimitSec: session.timeLimitSec,
        remainingTimeSec: Math.max(0, session.remainingTimeSec),
        totalDamageDealt: session.totalDamageDealt,
        goldEarned: session.goldEarned,
        expEarned: session.expEarned,
        itemRewards: session.itemRewards,
        message,
      } as S2CDungeonEventPayload);

      // Atualiza inventário do jogador na tela
      this.world.sendInventoryUpdate(player);
    }

    // 6. Retorna o jogador para a área de farm padrão
    player.position.x = 0;
    player.position.y = 0;
    player.position.z = 0;

    // Remove sessão ativa
    this.activeSessions.delete(player.id);
    console.log(`[DungeonManager] Masmorra de "${player.name}" encerrada com status ${status} em ${elapsedSec}s (Ondas: ${wavesCleared}/${session.maxWaves})`);
  }

  /**
   * Chamado a cada tick (20Hz) do loop do jogo
   */
  public update(deltaTimeSec: number): void {
    for (const [characterId, session] of this.activeSessions.entries()) {
      const player = this.world.entityManager.getPlayer(session.playerId);
      if (!player) {
        this.activeSessions.delete(characterId);
        continue;
      }

      // Se o jogador morreu na masmorra -> DERROTA
      if (player.isDead) {
        this.completeDungeon(player, session, 'DEFEAT', '💀 Você foi derrotado na masmorra!');
        continue;
      }

      // Transição entre ondas
      if (session.status === 'WAVE_CLEAR') {
        session.waveTransitionTimerSec -= deltaTimeSec;
        if (session.waveTransitionTimerSec <= 0) {
          session.currentWave += 1;
          this.spawnWave(player, session);
        }
        continue;
      }

      // Contagem regressiva do cronômetro da onda ativa
      if (session.status === 'WAVE_START') {
        session.remainingTimeSec -= deltaTimeSec;

        // Tempo esgotado -> DERROTA POR TIMEOUT
        if (session.remainingTimeSec <= 0) {
          this.completeDungeon(player, session, 'TIMEOUT', '⌛ TEMPO ESGOTADO! O chefe não foi derrotado dentro do tempo limite.');
          continue;
        }
      }
    }
  }

  /**
   * Permite ao jogador desistir ou sair da masmorra
   */
  public leaveDungeon(player: Player): void {
    const session = this.activeSessions.get(player.id);
    if (!session) return;

    this.completeDungeon(player, session, 'LEFT', '🚪 Você abandonou a masmorra.');
  }
}
