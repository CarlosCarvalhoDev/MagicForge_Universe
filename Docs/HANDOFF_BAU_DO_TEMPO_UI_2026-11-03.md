# 📦 Handoff de UI: Baú do Tempo (Recompensas AFK & Progresso Offline)

> **Data**: 03/11/2026  
> **Autor**: Antigravity (Advanced Agentic Coding)  
> **Destinatário**: Designer / Desenvolvedor de Layout e Arte (Codex / Paulo Riccardo)  
> **Objetivo**: Especificar a entrega do backend autoritativo da Etapa 2 e fornecer o guia completo para refinamento visual, assets, animações e ergonomia mobile do **Baú do Tempo**.

---

## 🧭 1. Visão Geral da Mecânica
O **Baú do Tempo** recompensa o jogador pelo tempo que passou ausente do jogo (celular bloqueado, aba fechada ou offline):
* **Limiar Mínimo**: 300 segundos (5 minutos) de ausência para acionar o modal (evita popups incômodos em F5 ou reconexões rápidas).
* **Teto Máximo**: 43.200 segundos (12 horas).
* **Fórmula de Rendimento Autoritativo**:
  $$\text{Ouro/segundo} = \text{Mundo} \times 15 + \text{Fase} \times 5 + \text{Nível} \times 3$$
  $$\text{EXP/segundo} = \text{Mundo} \times 10 + \text{Fase} \times 4 + \text{Nível} \times 2$$
  *A cada 15 minutos offline*: Concede materiais de forja (`iron_ore`) e poções (`potion_hp_minor`).
* **Resgate**: 100% autoritativo no servidor via WebSocket, atualizando banco SQLite, evoluindo o nível do herói se atingir a meta e sincronizando inventário e HUD instantaneamente.

---

## 🔌 2. Contrato de Mensagens WebSocket & Opcodes

Os pacotes já estão implementados e tipados em `@magicforge/shared`:

### A. Servidor -> Cliente: Notificação de Recompensas
* **Opcode**: `0xB0` (`Opcode.S2C_OFFLINE_REWARD_INFO`)
* **Payload**:
```typescript
export interface S2COfflineRewardInfoPayload {
  offlineSeconds: number;        // Tempo total que o jogador ficou fora (em segundos)
  cappedSeconds: number;         // Tempo efetivo considerado (clampado em até 43.200s / 12h)
  accumulatedGold: number;       // Quantidade de Ouro calculada
  accumulatedExp: number;        // Quantidade de EXP calculada
  lootPreview: OfflineLootItem[]; // Lista de itens/materiais coletados
  minThresholdSeconds: number;   // 300s (5 min)
}

export interface OfflineLootItem {
  itemId: string;   // Ex: 'iron_ore', 'potion_hp_minor'
  name: string;     // Ex: 'Minério de Ferro Bruto'
  rarity: string;   // Ex: 'COMUM', 'RARO'
  quantity: number; // Ex: 8
}
```

### B. Cliente -> Servidor: Resgate
* **Opcode**: `0xB1` (`Opcode.C2S_CLAIM_OFFLINE_REWARDS`)
* **Payload**:
```typescript
export interface C2SClaimOfflineRewardsPayload {
  multiplier?: number; // Padrão 1x. Pronto para bônus VIP / Assistir Vídeo (2x)
}
```

### C. Servidor -> Cliente: Confirmação do Resgate
* **Opcode**: `0xB2` (`Opcode.S2C_OFFLINE_REWARDS_CLAIMED`)
* **Payload**:
```typescript
export interface S2COfflineRewardsClaimedPayload {
  success: boolean;
  claimedGold: number;
  claimedExp: number;
  lootClaimed: OfflineLootItem[];
  newGold: number;
  newLevel: number;
  newExp: number;
  message: string;
}
```

---

## 🎨 3. Estrutura Atual do DOM & IDs para Estilização

O modal foi criado em `client/src/ui/OfflineRewardModal.ts` e seus estilos base estão em `client/src/ui/progression.css`:

```html
<dialog id="offline-reward-dialog" class="offline-reward-dialog modal-content">
  <div class="offline-reward-container">
    <header class="offline-header">
      <div class="offline-icon-crest">⏳</div>
      <h2 class="offline-title">Baú do Tempo</h2>
      <span class="offline-subtitle">Progresso e Recompensas AFK</span>
    </header>

    <div class="offline-time-banner">
      <span class="offline-time-label">Tempo Ausente:</span>
      <span class="offline-time-value" id="offline-time-text">2h 15min</span>
      <span class="offline-time-cap" id="offline-time-cap-text">(Limite máximo: 12h)</span>
    </div>

    <div class="offline-rewards-grid">
      <!-- Card de Ouro -->
      <div class="offline-card reward-gold">
        <span class="reward-icon">🪙</span>
        <div class="reward-info">
          <span class="reward-label">Ouro Acumulado</span>
          <span class="reward-amount" id="offline-gold-text">+125.400 Ouro</span>
        </div>
      </div>

      <!-- Card de EXP -->
      <div class="offline-card reward-exp">
        <span class="reward-icon">⭐</span>
        <div class="reward-info">
          <span class="reward-label">EXP Acumulada</span>
          <span class="reward-amount" id="offline-exp-text">+84.200 EXP</span>
        </div>
      </div>
    </div>

    <!-- Seção de Materiais / Suprimentos -->
    <div class="offline-loot-section" id="offline-loot-container">
      <h4 class="offline-loot-title">📦 Materiais & Suprimentos</h4>
      <div class="offline-loot-list" id="offline-loot-list">
        <!-- Itens inseridos dinamicamente -->
        <div class="offline-loot-item">
          <span class="item-name">Minério de Ferro Bruto</span>
          <span class="item-qty">x8</span>
        </div>
      </div>
    </div>

    <footer class="offline-actions">
      <button type="button" class="btn-rpg-runic btn-claim-offline" id="btn-claim-offline">
        ✨ Coletar Recompensas
      </button>
    </footer>
  </div>
</dialog>
```

---

## 💎 4. Guia de Melhorias Recomendadas para o Designer / Layoutista

Aqui estão os pontos que você pode evoluir livremente sem risco de quebrar regras de negócio:

### 1. Ilustração e Animação do Baú
- **Ideia Visual**: Substituir o emoji estático `⏳` por uma arte temática de Baú do Tempo com filigrana dourada ou sprite sheet animado.
- **Transição de Estados**:
  1. *Apresentação*: Baú fechado com brilho pulsante no centro do modal.
  2. *Ao Clicar em Coletar*: Animação do baú destravando e abrindo a tampa.
  3. *Partículas/Feedback*: Moedas douradas e orbes azuis de EXP voando suavemente em direção ao topo da tela (onde ficam o Ouro e o Nível do herói na HUD).

### 2. Molduras Rúnicas e Cantoneiras
- O modal já herda a classe `.modal-content` com cantoneiras SVG (`corner-tl.svg`, `crest-header-ornament.svg`).
- Fique à vontade para ajustar o gradiente interno (`radial-gradient`), sombras e glow dourado (`#d97706` e `#fbbf24`) para bater com o padrão visual estabelecido nos outros cards.

### 3. Botão de Coleta 2x / VIP (Opcional)
- A infraestrutura já aceita `{ multiplier: 2 }` no pacote `C2S_CLAIM_OFFLINE_REWARDS`.
- Se desejar colocar um botão secundário:
  - Ex: `[🎬 Coletar em Dobro (2x)]` ou `[👑 Bônus de Clã/Passe]`.

### 4. Responsividade Mobile (Smartphone Vertical)
- Em telas estreitas ($< 380\text{px}$), o grid `.offline-rewards-grid` pode ser mantido em duas colunas ou empilhado se os números forem muito longos.
- Garantir `padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px)` para o botão de coleta não encostar na barra de navegação do celular.
- Manter altura de toque confortável ($48\text{px}$ a $52\text{px}$) no botão principal.

---

## 🛠️ 5. Como Testar e Visualizar a Tela Instantaneamente no Navegador

Para testar visualmente no navegador ou DevTools sem precisar esperar horas offline, você pode abrir o console do DevTools (`F12`) na página do jogo e executar:

```javascript
// Dispara o modal com dados simulados para teste de layout
const modal = document.getElementById('offline-reward-dialog');
if (modal) {
  document.getElementById('offline-time-text').textContent = '4h 32min';
  document.getElementById('offline-gold-text').textContent = '+215.800 Ouro';
  document.getElementById('offline-exp-text').textContent = '+142.600 EXP';
  
  const lootList = document.getElementById('offline-loot-list');
  lootList.innerHTML = `
    <div class="offline-loot-item"><span class="item-name">Minério de Ferro Bruto</span><span class="item-qty">x12</span></div>
    <div class="offline-loot-item"><span class="item-name">Poção Menor de Cura</span><span class="item-qty">x6</span></div>
  `;
  document.getElementById('offline-loot-container').style.display = 'block';
  modal.showModal();
}
```

---

## 📋 6. Arquivos Relevantes
- **Lógica e Componente**: [`client/src/ui/OfflineRewardModal.ts`](file:///E:/MagicForge_Universe/client/src/ui/OfflineRewardModal.ts)
- **Folha de Estilos**: [`client/src/ui/progression.css`](file:///E:/MagicForge_Universe/client/src/ui/progression.css) (linhas ao final do arquivo)
- **Tipagens e Contrato**: [`shared/src/messages.ts`](file:///E:/MagicForge_Universe/shared/src/messages.ts)
- **Integração Principal**: [`client/src/main.ts`](file:///E:/MagicForge_Universe/client/src/main.ts)
- **Testes Automatizados**: [`client/tests/offline-rewards-ui.test.mjs`](file:///E:/MagicForge_Universe/client/tests/offline-rewards-ui.test.mjs)
