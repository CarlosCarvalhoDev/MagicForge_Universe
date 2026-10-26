# 🗺️ Roadmap Arquitetural & Próximos Passos (MagicForge: Universe)

Este roadmap organiza a evolução técnica do nosso MMORPG Mobile, dividida em etapas sólidas e ordenadas para que você sempre saiba exatamente onde estamos e qual o próximo tijolo a ser colocado.

---

## 📌 Status Atual: Fases Concluídas!

| Componente | Status | Detalhes |
| :--- | :---: | :--- |
| **Repositório Git** | ✅ Concluído | Versionado, com `.gitignore` completo para Unity e Node.js. |
| **Protocolo Compartilhado** | ✅ Concluído | `/shared` com Opcodes, DTOs de Login, Movimento, Spawn, Combate e Snapshots. |
| **Servidor Autoritativo 20Hz** | ✅ Concluído | `/server` rodando a 20.0 Hz cravados (50ms por tick) com drift compensation. |
| **Interpolação de Posições** | ✅ Concluído | Buffer temporal LERP + Render Delay de 100ms (elimina solavancos). |
| **Área de Interesse (AOI / Spatial Grid)** | ✅ Concluído | Células de 20x20m no servidor. O cliente só recebe entidades do seu quadrante. |
| **Controles Touch Mobile (Virtual Joystick)** | ✅ Concluído | Joystick analógico virtual com vetor normalizado contínuo + toque na tela. |
| **Banco de Dados & Persistência (SQLite)** | ✅ Concluído | Contas, Heróis, Atributos D&D e Posição salvos em `server/data/magicforge.db`. |
| **Sistema de Skills Ativas (4 Slots D&D 5e)** | ✅ Concluído | 28 magias autoritativas, cooldown sweep, HUD de MP/Energia, teclas 1-4 e botões touch. |
| **Grimório de Habilidades Interativo** | ✅ Concluído | Modal [K] com 28 ícones RPG em alta resolução, abas por classe, filtros D&D e tiers. |
| **Sistema de Drops & Loot no Chão** | ✅ Concluído | Monstros dropam espólios com pilares verticais de luz e auras coloridas por raridade; auto-loot e clique. |
| **Mochila & Inventário Persistido (SQLite)** | ✅ Concluído | 20 slots de inventário, painel de inspeção de itens, bônus de stats, equipamentos, poções consumíveis, cálculo de Poder de Combate (CP) e Ouro salvos no SQLite. |
| **Sistema de Níveis, EXP & Progressão D&D 5e** | ✅ Concluído | Monstros concedem EXP autoritativa; curva suave de níveis, crescimento de stats D&D 5e por classe, full heal no level up, recálculo de HP e Poder de Combate (CP), persistência no SQLite. |
| **HUD de EXP & Banner de Level Up** | ✅ Concluído | Barra de EXP inferior em gradiente ametista/dourado, badges `[Nv. X]`, números flutuantes roxos `+XX XP` e banner de celebração `✦ NÍVEL SUPERADO! ✦`. |
| **Sobrevivência & Auto-Revive nos Testes** | ✅ Concluído | HP robusto inicial (940+ HP), regeneração passiva (+25 HP/s), cura do guerreiro fortalecida (5s CD) e renascimento automático no Altar Central em 3s caso caia em batalha. |
| **Plano Mestre Idle MMORPG** | ✅ Concluído | `Docs/PLANO_IMPLEMENTACAO_IDLE_MMORPG_HUD_FASES.md` estruturando a HUD Mobile (Stickman Go), Fases 1-10, Portais, Paperdoll e Farm Helper. |
| **Cliente Demonstrador Web** | ✅ Concluído | `/client` com HUD completa, sprites reais animados do guerreiro, skills, mochila, EXP bar e arena. |
| **Contrato C# para Unity** | ✅ Concluído | `NetworkMessages.cs` e `UnityNetworkClient.cs` sincronizados com movimento, skills, drops, inventário e level up. |
| **Guia de Assets com IA** | ✅ Concluído | `Docs/GUIA_PROMPTS_ASSETS_IA.md` com prompts para personagens, monstros e chão. |
| **Guia do Banco de Dados** | ✅ Concluído | `Docs/GUIA_BANCO_DE_DADOS_SQLITE.md` com instruções do DB Browser e queries. |

---

## 🚀 Próximos Passos (Plano Mestre de Execução)

Consulte o documento completo em [`Docs/PLANO_IMPLEMENTACAO_IDLE_MMORPG_HUD_FASES.md`](./PLANO_IMPLEMENTACAO_IDLE_MMORPG_HUD_FASES.md).

### 1. Nova HUD Mobile & Janela de Personagem (Paperdoll)
* **Objetivo:** 
  * **Top-Left:** Avatar redondo da classe, Nível, barras de HP/MP com %, **CP grandão dourado em destaque** (`⚔️ CP 1.425`).
  * **Top-Right:** Mini-mapa estilizado com Zona e Fase Atual (`Floresta da Forja (1) [Fase 1/10]`).
  * **Dock Inferior Mobile:** Ícones circulares modernos (`Personagem`, `Mochila`, `Grimório`, `Farm Helper`, `Rankings`, `Fases`).
  * **Janela de Personagem:** Manequim visual com 6 slots de equipamentos (Elmo, Armadura, Calça, Arma, Escudo, Relíquia) em volta do corpo e painel completo de Atributos D&D 5e.

### 2. Farm Helper & Auto-Venda Inteligente na Bag
* **Objetivo:**
  * **Auto-Poção:** Sliders configuráveis de % de HP e MP para consumo automático de poções da bag.
  * **Auto-Venda Direta:** Filtros na bag para auto-vender equipamentos Comuns (Cinza) e Incomuns (Verde) direto por Ouro, sem necessidade de ir a NPCs.

### 3. Sistema de Fases 1 a 10, Chefão & Portais Rúnicos
* **Objetivo:**
  * Contador de wave/monstros por fase. Ao completar a cota, abre um **Portal Rúnico Dourado** que transporta para a próxima fase.
  * **Fase 10 (Boss):** O Chefão do Mundo surge. Se derrotado, abre o portal para o próximo mapa. Se falhar, herói continua farmando na Fase 10 até ficar forte!

### 4. Rankings Competitivos (Leaderboards)
* **Objetivo:**
  * Classificação dos melhores jogadores do servidor no SQLite: Top CP, Top Nível, Top Fases e Top Kills com premiações.

