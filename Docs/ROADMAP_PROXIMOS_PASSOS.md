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
| **Janela Unificada de Herói & Inventário** | ✅ Concluído | Ficha do Herói com Paperdoll no pedestal, CP em destaque, 6 slots de equipamento com badges de refino (+1..+15), atributos D&D 5e e submenus integrados: **Mochila (Sacola)**, **Refinamento**, **Pedras (Gemas)** e **Cartas (Monstros)**. |
| **Regra de Substituição de Equipamentos** | ✅ Concluído | Ao equipar um item com outro já alocado no mesmo slot, o anterior é automaticamente desequipado e substituído no servidor SQLite. |
| **Zoom Interativo da Câmera (Scroll & Touch)** | ✅ Concluído | Controles de aproximação e afastamento (5.5x a 18x) via scroll do mouse, botões flutuantes `[+]` e `[-]` na HUD e gesto pinch no mobile. |
| **Espaçamento e Respawn Aleatório de Monstros** | ✅ Concluído | Monstros distribuídos pela arena de 120m com respawn em coordenadas aleatórias e elevação dos textos flutuantes sobre a cabeça. |
| **Matriz de 84 Habilidades D&D 5E & 81 Builds** | ✅ Concluído | `Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md` com 3 escolhas por slot para as 7 classes, balanceamento e prompts de IA. |
| **Grimório Modular por Slot & Troca Instantânea** | ✅ Concluído | Grimório filtrado exclusivamente para a classe do jogador, 4 slots (Círculos D&D), substituição imediata autoritativa no servidor e no HUD. |
| **Sistema de 3 Slots por Conta (SQLite)** | ✅ Concluído | Suporte a 3 heróis por conta com seleção autoritativa, criação em slots vazios e preservação integral dos personagens existentes no SQLite. |
| **Autenticação, Multi-Provider & Segurança** | ✅ Concluído | Opcodes 0x70..0x75, criptografia scrypt + salt, comprovação de posse (proof-of-ownership) para contas legadas, suporte a Local/Guest/Social (Google, Apple, Discord) e bloqueio autoritativo de pedestais antes do login. |
| **Engine Autoritativa de Fases (1 a 10), Chefão & Portais** | ✅ Concluído | Progressão 1 a 10 cravada no servidor; invocação automática do Chefão do Mundo na Fase 10/10 (Grimgor, Frostbite, Ignis); looping seguro na Fase 10 em caso de falha; abertura do Portal Rúnico Dourado na vitória com persistência no SQLite. |
| **Curva de Níveis & Sistema de Reborn D&D 5E** | ✅ Concluído | Progressão calibrada (fórmula D&D 5E com desaceleração pós-nível 10); cap no Nível 50; ritual autoritativo de Transcendência Astral (Reborn I..IV); reset ao Nível 1 com retenção de bônus permanentes transcendentais (+10 em todos os 6 atributos por Reborn, +500 HP fixo, +15% dano multiplicativo, +3500 CP); títulos de honra cósmicos; validação estrita de níveis mínimos para slots de skills e persistência integral no SQLite. |
| **Submenus Econômicos no SQLite (Refino, Gemas & Cartas)** | ✅ Concluído | Refinamento autoritativo de equipamentos (+1..+15) com regras D&D 5E de custos, taxas de sucesso (100% a 20%), perda de nível em falhas (+9..+15) e scaling (+8% atributos por nível); engaste autoritativo de gemas (soquetes 0..2) persistido na tabela `equipment_gems`; e álbum de cartas de monstros com drops (10-15% comuns, 100% chefes), coleção passiva e bônus ativo 2x persistido em `character_cards`. Integrado na UI Web, backend e Unity C#. |
| **Farm Helper & Automação Idle Inteligente** | ✅ Concluído | Opcodes 0x80..0x83, auto-poção de HP/MP com cooldown de 3s no tick de 20Hz, auto-venda direta de itens no chão por ouro, comando autoritativo de Faxina na Bag (*Auto-Salvage* em massa), persistência de preferências no SQLite e contratos Unity C#. |
| **Expansão de Inventário (Gold Sink Exponencial)** | ✅ Concluído | Opcodes 0x46 e 0x4F, compra autoritativa de +5 slots (20 até 50 slots) com escala de custo (10k a 10M de ouro), requisitos de nível (15 a 50) e Reborn 1+, persistência no SQLite e validação estrita. |
| **Rankings Globais & Hall da Fama (Leaderboards)** | ✅ Concluído | Opcodes 0x86 e 0x87, consultas autoritativas no SQLite em 4 categorias (`COMBAT_POWER`, `LEVEL`, `STAGE`, `GOLD`), cálculo automático de colocação pessoal (`myRank`), títulos honoríficos de Reborn e sincronização no cliente Web e Unity C#. |
| **Bíblia de Lore, Storytelling & Economia Gacha** | ✅ Concluído | `Docs/Lore_And_Art_Bible.md` e `Docs/DIRETRIZES_UI_NARRATIVA_E_GACHA_CODEX.md` com abertura cinemática de 6 cenas, falas de hover dos heróis, falas de combate dos monstros, 4 encontros de Malakor, prompts de voz IA (ElevenLabs), 6 roteiros para YouTube e arquitetura de 2 Gachas com Mercado Livre de Jogadores. |
| **Colaboração Paralela (Antigravity & Codex)** | ✅ Concluído | `Docs/PLANO_COLABORACAO_ANTIGRAVITY_CODEX.md` e `AGENTS.md` definindo limites de trabalho, inventário de novos assets e prevenção de conflitos. |
| **Cliente Demonstrador Web** | ✅ Concluído | `/client` com HUD completa, sprites reais animados do guerreiro, skills, mochila, EXP bar e arena. |
| **Contrato C# para Unity** | ✅ Concluído | `NetworkMessages.cs` e `UnityNetworkClient.cs` sincronizados com movimento, skills, drops, inventário, level up, slots, fases e boss. |
| **Guia de Assets com IA** | ✅ Concluído | `Docs/GUIA_PROMPTS_ASSETS_IA.md` com prompts para personagens, monstros e chão. |
| **Guia do Banco de Dados** | ✅ Concluído | `Docs/GUIA_BANCO_DE_DADOS_SQLITE.md` com instruções do DB Browser e queries. |

---

## 🚀 Próximos Passos (Plano Mestre de Execução)

Consulte o documento completo em [`Docs/PLANO_IMPLEMENTACAO_IDLE_MMORPG_HUD_FASES.md`](./PLANO_IMPLEMENTACAO_IDLE_MMORPG_HUD_FASES.md).

### 1. Sistema de Fases 1 a 10, Chefão & Portais Rúnicos
* **Objetivo:**
  * Contador de wave/monstros por fase. Ao completar a cota de monstros, surge o botão/evento do Chefão ou abertura de **Portal Rúnico Dourado** que transporta para a próxima fase.
  * **Fase 10 (Boss do Mapa):** O Chefão do Mundo surge. Se derrotado, abre o portal para o próximo mapa temático. Se falhar, herói continua farmando na Fase 10 até acumular poder suficiente!

### 2. Farm Helper & Automação Idle Inteligente
* **Objetivo:**
  * **Auto-Poção:** Consumo automático de poções de Vida e Mana da mochila ao atingir o limiar configurado nos sliders.
  * **Auto-Venda Direta:** Filtros na bag para converter automaticamente itens Comuns (Cinza) e Incomuns (Verde) em Ouro durante a caçada.

### 3. Aprofundamento dos Sistemas dos Submenus
* **Objetivo:**
  * **Refinamento:** Persistência no SQLite das pedras de refinamento e níveis de forja (`+1` a `+15`).
  * **Engaste de Gemas:** Adicionar tabela no SQLite para joias alocadas em cada equipamento.
  * **Álbum de Cartas:** Drops de cartas raras de monstros e encantamentos passivos na armadura/arma (estilo Ragnarok Mobile e Laplace M).

### 4. Rankings Globais Competitivos (Leaderboards)
* **Objetivo:**
  * Classificação dos melhores aventureiros no SQLite: Top CP, Top Nível, Top Fases e Top Monstros Abatidos.

