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
| **Cliente Demonstrador Web** | ✅ Concluído | `/client` com HUD completa, sprites reais animados do guerreiro, skills, mochila, EXP bar e arena. |
| **Contrato C# para Unity** | ✅ Concluído | `NetworkMessages.cs` e `UnityNetworkClient.cs` sincronizados com movimento, skills, drops, inventário e level up. |
| **Guia de Assets com IA** | ✅ Concluído | `Docs/GUIA_PROMPTS_ASSETS_IA.md` com prompts para personagens, monstros e chão. |
| **Guia do Banco de Dados** | ✅ Concluído | `Docs/GUIA_BANCO_DE_DADOS_SQLITE.md` com instruções do DB Browser e queries. |

---

## 🚀 Próximos Passos (Ordem de Execução Recomendada)

### 1. Chat do MMORPG (Global, Local & Sistema)
* **Objetivo:** Jogadores podem se comunicar no mapa, ver mensagens de combate/sistema (ex: *"LordAventureiro alcançou o Nível 2!"*, *"LordAventureiro obteve [Relíquia da Forja Antiga]!"* ou *"Chefe Goblin foi derrotado!"*).
* **Solução:** Caixa de texto colapsável para mobile e desktop com opcodes `C2S_CHAT_SEND` e `S2C_CHAT_BROADCAST`.

### 2. Sistema de Grupos (Party) & Vida dos Aliados
* **Objetivo:** Jogadores podem convidar aliados para formar grupo de até 4 membros, compartilhando EXP e exibindo barras de vida da equipe no canto superior da tela.

### 3. Sistema de Missões (Quests) & NPCs Interativos
* **Objetivo:** NPCs com diálogos que concedem tarefas (abater 5 goblins, coletar essências) recompensando com EXP, ouro e itens especiais da forja.

