# Sistema de Masmorras Diárias & Desafio dos Chefes (Boss Rush)

## 1. Visão Geral
O sistema de **Masmorras Diárias & Boss Rush** oferece aos jogadores desafios cronometrados instanciados com recompensas exclusivas diárias: **Ouro massivo, EXP de elite, Pedras Místicas de Refino, Fragmentos Rúnicos e Cartas Raras de Chefes** para o Álbum Cósmico.

---

## 2. Tipos de Masmorra

### 2.1. Desafio dos Chefes (`BOSS_RUSH`)
Batalha em 4 ondas consecutivas contra os guardiões titânicos do universo:
* **Onda 1:** *Grimgor, o Furioso da Terra* (Nv 20 | HP: 18.000 | Tempo: 90s)
  * Drop acumulado: 20.000 Ouro, 10.000 EXP, 2x Pedra Rara, 2x Fragmento Rúnico.
* **Onda 2:** *Frostbite, o Colosso do Gelo* (Nv 35 | HP: 42.000 | Tempo: 90s)
  * Drop acumulado: +45.000 Ouro, +25.000 EXP, 3x Pedra Rara, 1x Pedra Mística, 4x Fragmento Rúnico, 1x Safira de Inteligência.
* **Onda 3:** *Ignis, o Tirano das Chamas* (Nv 50 | HP: 90.000 | Tempo: 90s)
  * Drop acumulado: +95.000 Ouro, +60.000 EXP, 2x Pedra Mística, 6x Fragmento Rúnico, 1x Rubi de Força, 1x Carta de Ignis.
* **Onda 4 (Clímax Místico):** *Eco de Malakor, o Trono Sombrio* (Nv 65 | HP: 195.000 | Tempo: 120s)
  * Drop acumulado: +250.000 Ouro, +150.000 EXP, 5x Pedra Mística, 12x Fragmento Rúnico, 1x Relíquia da Forja Ancestral, Cartas de Frostbite e Grimgor.

* **Fôlego entre Ondas:** Ao derrotar cada chefe, o jogador recupera instantaneamente **35% do HP máximo** e tem uma pausa de 2.5s antes do spawn do próximo chefe.

### 2.2. Caverna da Fortuna (`GOLD_TREASURY`)
Desafio focado em acúmulo de riqueza com hordas de Slimes Dourados e Goblins do Tesouro (60s por onda, gerando de 100.000 a 300.000 de Ouro).

---

## 3. Economia de Ingressos & Reset Diário
* **Ingressos Gratuitos:** 3 ingressos automáticos por dia.
* **Reset Automático:** Às 00:00 UTC (ou quando a data do SQLite divergir do dia atual `YYYY-MM-DD`).
* **Compra de Ingressos Extras (Gold Sink):**
  * Até 2 compras extras por dia.
  * Custo: **50.000 Ouro** por ingresso.

---

## 4. Opcodes de Rede

| Opcode | Nome | Direção | Descrição |
|---|---|---|---|
| `0x88` | `C2S_REQUEST_DUNGEON_INFO` | Cliente -> Servidor | Solicita status de ingressos e recordes |
| `0x89` | `S2C_DUNGEON_INFO` | Servidor -> Cliente | Envia ingressos disponíveis e recordes |
| `0x8A` | `C2S_ENTER_DUNGEON` | Cliente -> Servidor | Entra no `BOSS_RUSH` ou `GOLD_TREASURY` |
| `0x8B` | `S2C_DUNGEON_EVENT` | Servidor -> Cliente | Notifica início de onda, conclusão, vitória ou derrota |
| `0x8C` | `C2S_BUY_DUNGEON_TICKET` | Cliente -> Servidor | Compra ingresso extra com ouro |
| `0x8D` | `S2C_BUY_DUNGEON_TICKET_RESULT` | Servidor -> Cliente | Confirma compra do ingresso extra |
| `0x8E` | `C2S_LEAVE_DUNGEON` | Cliente -> Servidor | Desistência da masmorra |

---

## 5. Métodos disponíveis no `ClientNetwork.ts`

```ts
// Envio
clientNetwork.sendRequestDungeonInfo();
clientNetwork.sendEnterDungeon('BOSS_RUSH');
clientNetwork.sendBuyDungeonTicket();
clientNetwork.sendLeaveDungeon();

// Callbacks / Listeners
clientNetwork.onDungeonInfo = (info) => {
  console.log(`Ingressos restantes: ${info.ticketsRemaining}/${info.maxDailyFreeTickets}`);
};

clientNetwork.onDungeonEvent = (event) => {
  if (event.status === 'WAVE_START') {
    console.log(`Onda ${event.currentWave}/${event.maxWaves}: ${event.bossName} (${event.timeLimitSec}s)`);
  } else if (event.status === 'VICTORY') {
    console.log(`Vitória! Recompensas entregues no inventário.`);
  }
};

clientNetwork.onBuyDungeonTicketResult = (result) => {
  if (result.success) {
    console.log(`Ingresso comprado! Novos ingressos: ${result.ticketsRemaining}`);
  }
};
```
