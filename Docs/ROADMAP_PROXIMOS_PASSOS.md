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
| **Cliente Demonstrador Web** | ✅ Concluído | `/client` com HUD completa, sprites reais animados do guerreiro, skills e arena. |
| **Contrato C# para Unity** | ✅ Concluído | `NetworkMessages.cs` e `UnityNetworkClient.cs` com suporte a movimento e skills. |
| **Guia de Assets com IA** | ✅ Concluído | `Docs/GUIA_PROMPTS_ASSETS_IA.md` com prompts para personagens, monstros e chão. |
| **Guia do Banco de Dados** | ✅ Concluído | `Docs/GUIA_BANCO_DE_DADOS_SQLITE.md` com instruções do DB Browser e queries. |

---

## 🚀 Próximos Passos (Ordem de Execução Recomendada)

### 1. Sistema de Drops, Loot no Chão & Inventário
* **Objetivo:** Monstros dropam itens, ouro e relíquias ao morrer, alimentando a progressão de Combat Power (CP) e o inventário persistido em SQLite.
* **Solução:**
  * Opcodes: `S2C_ITEM_DROP_SPAWN`, `C2S_LOOT_ITEM`, `S2C_INVENTORY_UPDATE`.
  * Visualização de baú/sacos brilhantes no chão que podem ser coletados com clique ou proximidade.

### 2. Sistema de Níveis, Experiência (EXP) & Progressão D&D 5e
* **Objetivo:** Matar monstros concede EXP. Ao subir de nível, atributos base (STR, DEX, CON, INT, WIS, CHA) sobem, aumentando HP máximo, Mana/Energia e dano.
* **Solução:** Barra de EXP no HUD e fórmulas D&D autoritativas no servidor.

### 3. Chat do MMORPG (Global, Local & Sistema)
* **Objetivo:** Jogadores podem se comunicar no mapa, ver avisos do sistema (ex: "Chefe Goblin derrotado!") e conversar entre si.
* **Solução:** Caixa de texto expansível na interface mobile/desktop com opcodes `C2S_CHAT_SEND` e `S2C_CHAT_BROADCAST`.
