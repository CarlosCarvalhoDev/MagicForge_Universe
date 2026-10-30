import { DatabaseManager } from '../server/src/database/DatabaseManager';
import { World } from '../server/src/game/World';
import { Player } from '../server/src/entities/Player';
import { CharacterClass, Opcode } from '../shared/src';
import path from 'path';
import fs from 'fs';

async function runDailyDungeonTests() {
  console.log('=== TESTE DE MASMORRAS DIÁRIAS & DESAFIO DOS CHEFES (BOSS RUSH) ===\n');

  const testDbPath = path.resolve(__dirname, 'test_dungeon.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const db = new DatabaseManager(testDbPath);
  const world = new World(db);

  // 1. Setup: Criar conta e herói
  const regResult = db.registerAccount('dungeon_tester', 'StrongPass123!', 'dungeon@magicforge.io');
  if (!regResult.success || !regResult.account) {
    throw new Error('Falha ao criar conta de teste.');
  }

  const player = db.createCharacterInSlot('p_dungeon_1', regResult.account.id, 0, 'ValiantHero', CharacterClass.GUERREIRO);
  player.level = 45;
  player.gold = 500;
  world.entityManager.addPlayer(player);

  const mockPacketsSent: Array<{ op: number; data: any }> = [];
  const mockConnection = {
    isAuthenticated: true,
    playerId: player.id,
    send: (op: number, data: any) => {
      mockPacketsSent.push({ op, data });
    },
  } as any;
  world.connections.set(player.id, mockConnection);

  // ----------------------------------------------------
  // TESTE 1: Ingressos Diários Gratuitos (Reset Diário)
  // ----------------------------------------------------
  console.log('[TEST 1] Consultando status diário de masmorras (3 ingressos gratuitos iniciais)...');
  const initialInfo = db.getDailyDungeonInfo(player.dbCharacterId);
  console.log(`  -> Ingressos disponíveis: ${initialInfo.ticketsRemaining}/${initialInfo.maxDailyFreeTickets}`);
  console.log(`  -> Ingressos extras comprados hoje: ${initialInfo.extraTicketsBoughtToday}/${initialInfo.maxExtraTicketsPerDay}`);
  if (initialInfo.ticketsRemaining !== 3 || initialInfo.extraTicketsBoughtToday !== 0) {
    throw new Error(`Falha no Teste 1: Esperado 3 ingressos, obtido ${initialInfo.ticketsRemaining}`);
  }
  console.log('  -> SUCESSO: 3 Ingressos gratuitos diários confirmados!');

  // ----------------------------------------------------
  // TESTE 2: Compra de Ingresso Extra com Ouro (Gold Sink)
  // ----------------------------------------------------
  console.log('\n[TEST 2] Testando compra de ingressos extras com ouro...');
  // Tentativa sem ouro suficiente (tem 500, precisa 50.000)
  const buyFail = db.buyExtraDungeonTicket(player.dbCharacterId);
  if (!buyFail.success && buyFail.message.includes('Ouro insuficiente')) {
    console.log(`  -> SUCESSO: Bloqueado por ouro insuficiente: "${buyFail.message}"`);
  } else {
    throw new Error('Falha no Teste 2: Compra sem ouro foi permitida!');
  }

  // Adiciona ouro ao jogador e compra o 1º ingresso extra
  player.gold = 150000;
  db.updateCharacterGold(player.dbCharacterId, 150000);
  const buy1 = db.buyExtraDungeonTicket(player.dbCharacterId);
  if (buy1.success && buy1.ticketsRemaining === 4 && buy1.extraTicketsBoughtToday === 1) {
    console.log(`  -> SUCESSO: 1º Ingresso extra adquirido! (Total: ${buy1.ticketsRemaining} ingressos, Restante: ${buy1.remainingGold} Ouro)`);
  } else {
    throw new Error(`Falha no Teste 2.1: ${JSON.stringify(buy1)}`);
  }

  // Compra o 2º ingresso extra
  const buy2 = db.buyExtraDungeonTicket(player.dbCharacterId);
  if (buy2.success && buy2.ticketsRemaining === 5 && buy2.extraTicketsBoughtToday === 2) {
    console.log(`  -> SUCESSO: 2º Ingresso extra adquirido! (Total: ${buy2.ticketsRemaining} ingressos, Restante: ${buy2.remainingGold} Ouro)`);
  } else {
    throw new Error(`Falha no Teste 2.2: ${JSON.stringify(buy2)}`);
  }

  // Tentativa do 3º ingresso extra (limite diário é 2)
  const buyLimit = db.buyExtraDungeonTicket(player.dbCharacterId);
  if (!buyLimit.success && buyLimit.message.includes('Limite diário')) {
    console.log(`  -> SUCESSO: Limite diário de 2 compras extras respeitado: "${buyLimit.message}"`);
  } else {
    throw new Error('Falha no Teste 2.3: Limite de ingressos extras excedido!');
  }

  // ----------------------------------------------------
  // TESTE 3: Entrada no Boss Rush & Consumo de Ingresso
  // ----------------------------------------------------
  console.log('\n[TEST 3] Entrando no Desafio dos Chefes (Boss Rush)...');
  const startResult = world.dungeonManager.startDungeon(player, 'BOSS_RUSH');
  if (!startResult.success) {
    throw new Error(`Falha no Teste 3 ao iniciar masmorra: ${startResult.message}`);
  }
  const session = world.dungeonManager.getSession(player.id);
  if (!session || session.currentWave !== 1 || !session.activeBossId) {
    throw new Error('Falha no Teste 3: Sessão não iniciada corretamente na Onda 1.');
  }

  const postStartInfo = db.getDailyDungeonInfo(player.dbCharacterId);
  console.log(`  -> Ingresso consumido! Restam: ${postStartInfo.ticketsRemaining} ingressos`);
  console.log(`  -> Chefe spawnado: "${session.activeBossName}" na Onda 1/${session.maxWaves} (Tempo: ${session.timeLimitSec}s)`);
  if (postStartInfo.ticketsRemaining !== 4) {
    throw new Error(`Falha no Teste 3: Esperava 4 ingressos restantes, obtido ${postStartInfo.ticketsRemaining}`);
  }
  console.log('  -> SUCESSO: Entrada e consumo autoritativo de ingresso validados!');

  // ----------------------------------------------------
  // TESTE 4: Progressão pelas 4 Ondas (Grimgor -> Frostbite -> Ignis -> Malakor)
  // ----------------------------------------------------
  console.log('\n[TEST 4] Simulando progressão pelas 4 ondas consecutivas do Boss Rush...');

  // Onda 1: Derrota Grimgor
  console.log(`  -> [Onda 1] Derrotando ${session.activeBossName}...`);
  world.dungeonManager.onMonsterKilled(session.activeBossId, player);
  if (session.status !== 'WAVE_CLEAR') {
    throw new Error(`Falha no Teste 4.1: Esperava status WAVE_CLEAR, obtido ${session.status}`);
  }
  console.log(`    -> Onda 1 Concluída! Fôlego recuperado, aguardando transição.`);

  // Simula tick de transição de 3 segundos
  world.dungeonManager.update(3.0);
  if (session.currentWave !== 2 || !session.activeBossName?.includes('Frostbite')) {
    throw new Error(`Falha no Teste 4.2: Esperava Onda 2 com Frostbite, obtido ${session.activeBossName} (Onda ${session.currentWave})`);
  }
  console.log(`  -> [Onda 2] ${session.activeBossName} despertou!`);

  // Onda 2: Derrota Frostbite
  world.dungeonManager.onMonsterKilled(session.activeBossId, player);
  world.dungeonManager.update(3.0);
  if (session.currentWave !== 3 || !session.activeBossName?.includes('Ignis')) {
    throw new Error(`Falha no Teste 4.3: Esperava Onda 3 com Ignis, obtido ${session.activeBossName}`);
  }
  console.log(`  -> [Onda 3] ${session.activeBossName} despertou!`);

  // Onda 3: Derrota Ignis
  world.dungeonManager.onMonsterKilled(session.activeBossId, player);
  world.dungeonManager.update(3.0);
  if (session.currentWave !== 4 || !session.activeBossName?.includes('Malakor')) {
    throw new Error(`Falha no Teste 4.4: Esperava Onda 4 com Malakor, obtido ${session.activeBossName}`);
  }
  console.log(`  -> [Onda 4 - CLÍMAX] ${session.activeBossName} emergiu do Vazio Astral!`);

  // ----------------------------------------------------
  // TESTE 5: Vitória Triunfal & Entrega do Loot no Inventário
  // ----------------------------------------------------
  console.log('\n[TEST 5] Derrotando o Eco de Malakor na Onda Final...');
  const preVictoryGold = player.gold;
  world.dungeonManager.onMonsterKilled(session.activeBossId, player);

  if (world.dungeonManager.isPlayerInDungeon(player.id)) {
    throw new Error('Falha no Teste 5: Sessão de masmorra ainda consta como ativa após vitória final!');
  }

  const goldGained = player.gold - preVictoryGold;
  console.log(`  -> Ouro ganho total: +${goldGained.toLocaleString('pt-BR')} Ouro`);
  console.log(`  -> EXP total acumulada entregue.`);

  // Verifica entrega de itens e cartas de chefe no SQLite
  const updatedInv = db.getInventory(player.dbCharacterId);
  const mysticStones = updatedInv.find((i) => i.itemId === 'stone_forge_mystic')?.quantity || 0;
  const runeFragments = updatedInv.find((i) => i.itemId === 'rune_fragment')?.quantity || 0;
  const bossCards = db.getCharacterCards(player.dbCharacterId);

  console.log(`  -> Pedras da Forja Místicas recebidas: ${mysticStones}`);
  console.log(`  -> Fragmentos Rúnicos recebidos: ${runeFragments}`);
  console.log(`  -> Cartas de Chefe desbloqueadas no Álbum: ${bossCards.map((c) => c.cardId).join(', ')}`);

  if (mysticStones < 8 || runeFragments < 24 || bossCards.length === 0) {
    throw new Error('Falha no Teste 5: Itens de recompensa não foram entregues corretamente.');
  }

  // Verifica gravação dos recordes no SQLite
  const finalInfo = db.getDailyDungeonInfo(player.dbCharacterId);
  console.log(`  -> Recorde no SQLite: Maior Onda = ${finalInfo.highestBossRushWave}/4, Masmorras Concluídas = ${finalInfo.totalDungeonsCleared}`);
  if (finalInfo.highestBossRushWave !== 4 || finalInfo.totalDungeonsCleared !== 1) {
    throw new Error('Falha no Teste 5: Recorde de masmorra não gravado no SQLite.');
  }
  console.log('  -> SUCESSO: Vitória, entrega autoritativa de loot e persistência de recordes 100% validadas!');

  // ----------------------------------------------------
  // TESTE 6: Proteção contra Timeout
  // ----------------------------------------------------
  console.log('\n[TEST 6] Testando falha por tempo esgotado (Timeout)...');
  world.dungeonManager.startDungeon(player, 'GOLD_TREASURY');
  const timeoutSession = world.dungeonManager.getSession(player.id);
  if (!timeoutSession) throw new Error('Falha ao iniciar masmorra para teste de timeout.');

  // Avança o tempo além do limite de 60s
  world.dungeonManager.update(65.0);
  if (world.dungeonManager.isPlayerInDungeon(player.id)) {
    throw new Error('Falha no Teste 6: Masmorra não foi encerrada após esgotar o tempo!');
  }
  console.log('  -> SUCESSO: Masmorra encerrada corretamente por Timeout quando o cronômetro zerou!');

  console.log('\n=== TODOS OS 6 TESTES DE MASMORRAS DIÁRIAS & BOSS RUSH PASSARAM COM 100% DE SUCESSO! ===');

  db.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}

runDailyDungeonTests().catch((err) => {
  console.error('ERRO NOS TESTES:', err);
  process.exit(1);
});
