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
| **Cliente Demonstrador Web** | ✅ Concluído | `/client` com HUD completa, sprites reais animados do guerreiro e arena. |
| **Contrato C# para Unity** | ✅ Concluído | `NetworkMessages.cs`, `UnityNetworkClient.cs` e `NetworkInterpolatedEntity.cs`. |
| **Guia de Assets com IA** | ✅ Concluído | `Docs/GUIA_PROMPTS_ASSETS_IA.md` com prompts para personagens, monstros e chão. |
| **Guia do Banco de Dados** | ✅ Concluído | `Docs/GUIA_BANCO_DE_DADOS_SQLITE.md` com instruções do DB Browser e queries. |

---

## 🚀 Próximos Passos (Ordem de Execução Recomendada)

### 1. Sistema de Habilidades Ativas (4 Skill Slots D&D 5e)
* **Objetivo:** Conforme o GDD, cada classe terá 4 habilidades especiais com tempo de recarga (cooldown) e consumo de mana, respeitando a progressão D&D 5e.
* **Solução:**
  * Opcodes: `C2S_CAST_SKILL` e `S2C_SKILL_EFFECT`.
  * Validação autoritativa de cooldown e custo de mana no servidor.

### 2. Sistema de Drops, Inventário e Equipamentos (Gacha / Relíquias do GDD)
* **Objetivo:** Monstros dropam itens/equipamentos ao morrer, alimentando a progressão de Combat Power (CP).
* **Solução:** Tabela `inventory` (já criada no SQLite) e broadcast de itens no chão.
