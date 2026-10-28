# 🎨 Diretrizes de UI, Storytelling & Gacha — Frentes do Codex

**Destinatário:** Codex (Engenheiro de UI & Frontend)  
**Autor:** Antigravity (Arquiteto de Sistemas & Backend)  
**Objetivo:** Especificar a arquitetura visual, comportamentos de interface e fila de prioridades para integrar a narrativa viva (*cinemática, balões de monstros, falas de heróis e NPCs*) e o sistema de Gacha ao cliente Web (`client/src/ui/**` e `client/src/renderer/**`).

---

## 📌 1. Fila de Prioridades de Implementação (Roadmap Visual)

```
[ PRIORIDADE 1 ] ──► Cinemática de Abertura (6 Cenas + Skip) & Falas de Hover nos Pedestais
      │
[ PRIORIDADE 2 ] ──► Balões de Diálogo dos Monstros em Combate (Canvas Floating Bubbles)
      │
[ PRIORIDADE 3 ] ──► Banners / Pop-ups Dramáticos de Malakor & Falas de Fases do Chefe
      │
[ PRIORIDADE 4 ] ──► NPCs no Altar Central & Interface dos 2 Gachas (Bigorna e Álbum)
```

---

## 🎬 2. Prioridade 1: Cinemática de Abertura & Tela de Pedestais

### 2.1 Cinemática Inicial (`client/src/ui/CinematicIntro.ts` ou modal em `index.html`)
* **Quando dispara:** No primeiro acesso do jogador ou ao clicar no botão `[📜 Rever História]` na tela inicial.
* **Componentes Visuais:**
  - Container preto fullscreen em overlay com efeito Ken Burns (zoom suave de 1.0x para 1.08x na imagem).
  - Texto narrativo inferior em tipografia rúnica/dourada com fade-in e som de digitação ou narração em áudio.
  - Botão de **`[ Pular Introdução >> ]`** no canto superior direito visível a qualquer momento.
  - Transição de fade-to-black de 500ms entre as 6 cenas (detalhadas na Seção 7 de `Docs/Lore_And_Art_Bible.md`).

### 2.2 Falas de Apresentação no Hover dos Pedestais
* **Onde fica:** Na Sala dos 3 Heróis / Seleção de Personagem.
* **Comportamento:** Ao passar o mouse (`mouseenter`) ou tocar no pedestal da classe:
  - Exibir balão dourado translúcido com a frase de personalidade (ex: Guerreiro: *"A Ordem da Bigorna caiu. Eu não. Meu escudo ainda sustenta o mundo."*).
  - Tocar efeito sonoro ou áudio curto do herói.

---

## 💬 3. Prioridade 2: Balões de Fala dos Monstros em Combate

* **Local de Renderização:** No loop de renderização do `GameRenderer.ts` ou camada de overlay UI (`client/src/ui/FloatingDialogue.ts`).
* **Regras de Exibição:**
  - **Frequência:** Baixa (10% de chance ao spawnar ou tomar dano, com cooldown global de 12s por tipo de monstro para não poluir a tela de grind).
  - **Duração:** Balão sobe 15px com fade-in, permanece 2.5s visível e faz fade-out.
  - **Estilo Visual:** Balão arredondado escuro translúcido com borda suave (`border: 1px solid rgba(255, 215, 0, 0.4)`), texto branco/amarelo de 11px centralizado logo acima da barra de vida do monstro.
* **Dicionário de Falas:** Ver Seção 10 de `Docs/Lore_And_Art_Bible.md` (Slime, Goblin Lanceiro, Goblin Arqueiro, Lobo, Chefe Goblin).

---

## 👑 4. Prioridade 3: Mensagens de Malakor & Encontros com o Chefe

* **Quando o Chefe do Mundo Surge (Fase 10/10):**
  - Banner dramático no topo da tela com o retrato do Boss:
    - Grimgor: *"EU SOU O REI DESTE BOSQUE! A COROA DE FOGO ME ESCOLHEU!"*
  - Aos 50% de HP: Notificação de diálogo na HUD: *"A coroa queima meu crânio... mas o poder é meu!"*
* **Notificações Cósmicas de Malakor:**
  - Mensagens ocasionais enviadas pelo servidor via `Opcode.S2C_CHAT_MESSAGE` no canal `boss` ou `system`.
  - A UI do chat deve estilizar mensagens com sender `'Malakor'` em degradê cinza-obsidiana e ícone de martelo rachado.

---

## 🔮 5. Prioridade 4: NPCs Resgatados & Janela de Gacha

* **Posicionamento dos NPCs:** Conforme o jogador avança de mundo, NPCs aparecem em pedestais menores ou ao redor do Altar Central em `(0, 0)`.
* **Interface do Gacha (Bigorna Portátil & Álbum de Cartas):**
  - Submenu com duas abas:
    1. **Bigorna Celestial:** Animação de martelo batendo na forja ao clicar em "Invocar 1x" ou "Invocar 10x".
    2. **Álbum Rúnico:** Revelação de cartas viradas com brilho dourado em cartas raras/épicas.
  - Contador de Pity visível: `[ 34 / 50 para Item Épico Garantido ]`.

---

## 🤝 6. Divisão de Contratos (Antigravity ↔ Codex)

| Responsabilidade | Antigravity (Backend / Shared) | Codex (Frontend / UI / Renderer) |
| :--- | :--- | :--- |
| **Gatilhos de História** | Envio de pacotes `S2C_CHAT_MESSAGE` com sender/channel adequados | Renderização dos balões, banners e animações |
| **Cinemática** | Fornece textos e dados de cenas em JSON | Implementa o componente visual e transições |
| **Gacha** | Rola os itens no servidor autoritativo e salva no SQLite | Anima a roleta/martelo e exibe os cards de loot |
| **Inventário & Expansão**| Validação de ouro e persistência de slots no SQLite | Botão de expandir e renderização dos novos slots |
