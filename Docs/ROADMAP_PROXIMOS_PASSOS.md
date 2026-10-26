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
| **Cliente Demonstrador Web** | ✅ Concluído | `/client` com HUD completa, sprites reais animados do guerreiro, skills, mochila e arena. |
| **Contrato C# para Unity** | ✅ Concluído | `NetworkMessages.cs` e `UnityNetworkClient.cs` sincronizados com movimento, skills, drops e inventário. |
| **Guia de Assets com IA** | ✅ Concluído | `Docs/GUIA_PROMPTS_ASSETS_IA.md` com prompts para personagens, monstros e chão. |
| **Guia do Banco de Dados** | ✅ Concluído | `Docs/GUIA_BANCO_DE_DADOS_SQLITE.md` com instruções do DB Browser e queries. |

---

## 🚀 Próximos Passos (Ordem de Execução Recomendada)

### 1. Sistema de Níveis, Experiência (EXP) & Progressão D&D 5e
* **Objetivo:** Matar monstros concede EXP de forma autoritativa. Ao subir de nível, atributos base (STR, DEX, CON, INT, WIS, CHA) aumentam, recalculando HP Máximo, Mana/Energia e Poder de Combate (CP), tudo persistido no SQLite.
* **Solução:**
  * Barra de EXP no HUD inferior e efeito visual de "Level Up!".
  * Notificação na tela e recalculo dinâmico de atributos no servidor.

### 2. Chat do MMORPG (Global, Local & Sistema)
* **Objetivo:** Jogadores podem se comunicar no mapa, ver mensagens de combate/sistema (ex: *"LordAventureiro obteve [Relíquia da Forja Antiga]!"* ou *"Chefe Goblin foi derrotado!"*).
* **Solução:** Caixa de texto colapsável para mobile e desktop com opcodes `C2S_CHAT_SEND` e `S2C_CHAT_BROADCAST`.

### 3. Sistema de Grupos (Party) & Vida dos Aliados
* **Objetivo:** Jogadores podem convidar aliados para formar grupo de até 4 membros, compartilhando EXP e exibindo barras de vida da equipe no canto superior da tela.

