# 🗺️ Roadmap Arquitetural & Próximos Passos (MagicForge: Universe)

Este roadmap organiza a evolução técnica do nosso MMORPG Mobile, dividida em etapas sólidas e ordenadas para que você sempre saiba exatamente onde estamos e qual o próximo tijolo a ser colocado.

---

## 📌 Status Atual: Fase 1 Concluída com Sucesso!

| Componente | Status | Detalhes |
| :--- | :---: | :--- |
| **Repositório Git** | ✅ Concluído | Versionado, com `.gitignore` completo para Unity e Node.js. |
| **Protocolo Compartilhado** | ✅ Concluído | `/shared` com Opcodes, DTOs de Login, Movimento, Spawn, Combate e Snapshots. |
| **Servidor Autoritativo 20Hz** | ✅ Concluído | `/server` rodando a 20.0 Hz cravados (50ms por tick) com drift compensation. |
| **Interpolação de Posições** | ✅ Concluído | Buffer temporal LERP + Render Delay de 100ms (elimina solavancos). |
| **Cliente Demonstrador Web** | ✅ Concluído | `/client` com HUD completa, sprites reais animados do guerreiro e arena. |
| **Contrato C# para Unity** | ✅ Concluído | `NetworkMessages.cs`, `UnityNetworkClient.cs` e `NetworkInterpolatedEntity.cs`. |
| **Guia de Assets com IA** | ✅ Concluído | `Docs/GUIA_PROMPTS_ASSETS_IA.md` com prompts para personagens, monstros e chão. |

---

## 🚀 Próximos Passos (Ordem de Execução Recomendada)

### 1. Área de Interesse e Particionamento Espacial (AOI / Spatial Grid)
* **Objetivo:** Em um MMORPG com centenas de jogadores no mesmo mapa, o servidor **não pode** enviar o estado de todos os jogadores para todo mundo (isso causaria gargalo de banda).
* **Solução:** Dividir o mapa de 120x120 em uma grade de células (ex: 20x20 metros cada). O cliente só recebe os snapshots das células vizinhas ao seu campo de visão.

### 2. Controles Touch para Mobile (Virtual Joystick & Trava de Alvo)
* **Objetivo:** No celular, além do toque para andar (*click-to-move*), jogadores de RPG mobile adoram o **Analógico Virtual (Virtual Joystick)** no canto inferior esquerdo e botões de ataque no canto direito.
* **Solução:** Integrar o envio do vetor de movimento contínuo (`dirX, dirZ`) ao protocolo existente.

### 3. Banco de Dados e Persistência de Conta (SQLite / PostgreSQL)
* **Objetivo:** Permitir que o jogador faça login, suba de nível, ganhe ouro/Combat Power e esses dados fiquem salvos ao deslogar.
* **Solução:** Camada de banco de dados no `/server` com tabelas: `accounts`, `characters`, `inventory` e `stats`.

### 4. Sistema de Habilidades Ativas (4 Skill Slots do GDD)
* **Objetivo:** Conforme o GDD, cada classe terá habilidades especiais com tempo de recarga (cooldown) e consumo de mana.
* **Solução:**
  * Opcodes: `C2S_CAST_SKILL` e `S2C_SKILL_EFFECT`.
  * Validação autoritativa de cooldown e custo de mana no servidor.
