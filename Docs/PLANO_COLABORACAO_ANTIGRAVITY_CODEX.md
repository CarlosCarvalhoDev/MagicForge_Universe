# 🤝 Plano Mestre de Colaboração Paralela: Antigravity & OpenAI Codex
**MagicForge: Universe — Versão 1.0 (27/10/2026)**  
**Documento de Alinhamento Absoluto com [`AGENTS.md`](../AGENTS.md)**

---

## 1. Princípios Absolutos de Colaboração (Conforme `AGENTS.md`)

1. **Raiz do Projeto:** `E:\MagicForge_Universe`.
2. **Respeito Mútuo de Trabalho:**
   - Nenhum agente tem permissão para apagar, resetar, reverter ou sobrescrever silenciosamente o trabalho do outro.
   - Proibição estrita de comandos destrutivos: `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git push --force`, migrações de banco destrutivas ou exclusões em massa sem autorização explícita do usuário.
3. **Isolamento de Tarefas:**
   - Para trabalhos simultâneos com risco de sobreposição, trabalhar em **branches e Git worktrees separados**:
     - Antigravity: branch `feat/antigravity-authoritative-systems`
     - Codex: branch `codex/visual-login-assets`
   - Esses nomes são propostas, não branches já criadas. Worktrees novas partem de commits e não incluem automaticamente as alterações locais não commitadas; definir a base antes de iniciar a implementação isolada, sem descartar o trabalho atual.
   - Se estiverem trabalhando na mesma pasta local, executar tarefas sequencialmente ou com posse estrita de arquivos exclusivos e sem interseção.
4. **Preservação do Unity:**
   - Manter sempre os arquivos `.meta` e nunca duplicar GUIDs de assets.
   - Não renomear ou mover arquivos sem atualizar todas as referências.

---

## 2. Inventário de Assets Já Disponibilizados no Repositório

O usuário já posicionou e disponibilizou os seguintes pacotes de arte nos diretórios de Web e Unity:

| Categoria | Caminho Web (`client/public/assets/`) | Caminho Unity (`MagicForgeClient/Assets/Textures/`) | Arquivos Prontos |
| :--- | :--- | :--- | :--- |
| **Tela de Login & Pedestais** | `ui/login/` | `UI/Login/` | `bg_login_forja_astral.jpg`, `pedestal_runico_ativo.png`, `pedestal_runico_vazio.png` |
| **Animações: Bárbaro** | `isometric/animations/heroes/barbaro/` | `Sprites/Animations/Heroes/Barbaro/` | Spritesheets completas + frames individuais recortados |
| **Animações: Clérigo** | `isometric/animations/heroes/clerigo/` | `Sprites/Animations/Heroes/Clerigo/` | `cast_sheet`, `death_sheet`, `hit_sheet`, `idle_sheet`, `walk_sheet` + frames |
| **Animações: Guerreiro** | `isometric/animations/heroes/guerreiro/` | `Sprites/Animations/Heroes/Guerreiro/` | `attack_sheet`, `death_sheet`, `hit_sheet`, `idle_sheet`, `walk_sheet` + frames |
| **Chefes de Mundo** | `isometric/` e `bosses/` | `Sprites/` | `iso_boss_frostbite.png`, `iso_boss_grimgor.png`, `iso_boss_ignis.png` |
| **Cartas Colecionáveis** | `ui/cards/` e `cards/` | `UI/Cards/` | Cartas temáticas de monstros para o álbum de cartas |
| **Ícones de Itens & Pedras** | `ui/items/` e `items/` | `UI/Items/` | Ícones para gemas, pedras de refino e equipamentos |

---

## 3. Divisão Estratégica de Responsabilidades (Quem Faz o Quê)

Para acelerar o desenvolvimento sem conflito de merge, dividimos as frentes de atuação de forma clara:

### 🅰️ OpenAI Codex — Frente Visual, Assets, Telas e Unity Client
*Foco: Apresentação visual, montagem de UI, spritesheets, Unity prefabs e front-end.*

1. **Nova Tela de Login & Seleção de Personagens (Web & Unity):**
   - Implementar a tela de login visual com o fundo `bg_login_forja_astral.jpg`.
   - Criar o seletor visual dos **3 Pedestais Rúnicos** usando `pedestal_runico_ativo.png` e `pedestal_runico_vazio.png`.
   - Se o slot tiver personagem: exibir o pedestal ativo com nome, classe, nível, CP e botão `[ENTRAR NO MUNDO]`.
   - Se o slot estiver vazio: exibir pedestal vazio com botão `[+ CRIAR NOVO HERÓI]`.
2. **Integração das Animações no Cliente Web e Unity:**
   - Revisar e completar a integração das folhas do **Bárbaro** e do **Clérigo** no `GameRenderer.ts` e no controlador existente `IsometricEntityVisual` do Unity, preservando os arrays de `CharacterClassSO`, pivôs e referências atuais. As duas classes já possuem configuração de folhas; validar as lacunas antes de implementar novamente. Criar Animator Controller somente se uma tarefa específica justificar e autorizar essa mudança.
3. **Sprites dos Chefes de Mundo:**
   - Conectar os sprites `iso_boss_grimgor.png`, `iso_boss_frostbite.png` e `iso_boss_ignis.png` na renderização de entidades chefes.
4. **Submenus Visuais de Cartas e Refinamento:**
   - Utilizar os ícones de `ui/cards/` e `ui/items/` nas abas já criadas dentro da Janela Unificada de Inventário.

---

### 🅱️ Antigravity — Frente de Arquitetura, Servidor Autoritativo, D&D 5E & Protocolo
*Foco: Lógica de jogo, loop 20Hz, banco de dados SQLite, balanceamento matemático e infraestrutura.*

1. **Persistência dos 3 Slots de Personagens no SQLite:**
   - Atualizar `DatabaseManager.ts` para gerenciar até 3 personagens vinculados à mesma conta (com `slot_index: 0, 1, 2`).
   - Criar opcodes e handlers no servidor para `C2S_SELECT_CHARACTER` e `C2S_CREATE_CHARACTER_SLOT`.
2. **Engine Autoritativa de Fases (1 a 10) & Spawn de Chefão:**
   - Lógica no `World.ts` para contagem autoritativa de monstros abatidos por fase (ex.: 10 monstros necessários).
   - Ao atingir a Fase 10, invocar automaticamente o Boss do Mundo (`Grimgor`, `Frostbite` ou `Ignis`). Se o jogador morrer, retornar ao loop de farm na fase sem descer de mundo.
3. **Mecânica de Reborn / Transcendência (Progressão Lenta):**
   - Sistema de prestígio ao atingir o nível máximo: reset de nível com ganho de atributos permanentes transcendentais e desbloqueio de maestrias passivas.
4. **Auto-Farm Inteligente e Filtros de Venda:**
   - Processamento de auto-loot, regras de descarte e auto-poção validadas autoritativamente pelo servidor.

---

## 4. Matriz de Arquivos & Prevenção de Conflitos

| Arquivo / Diretório | Dono Principal | Regra de Acesso para o Outro Agente |
| :--- | :---: | :--- |
| `server/src/**` | **Antigravity** | Somente leitura para o Codex, exceto se solicitado especificamente. |
| `shared/src/**` | **Antigravity** | Codex consulta os contratos; alterações exigem transferência explícita da posse dos arquivos envolvidos. |
| `MagicForgeClient/**` (Unity) | **Codex** | Inclui rede C#. Antigravity propõe mudanças de contrato; edição direta exige transferência explícita da posse por tarefa. |
| `client/public/assets/**` | **Codex** | Apenas leitura para Antigravity (consumir imagens prontas). |
| `client/src/renderer/**` | **Codex** | Desenho de sprites e animações visuais. |
| `client/src/main.ts` | **Posse por tarefa** | Codex assume para integração visual somente após conferir a liberação pelo Antigravity. Na mesma pasta, seções distintas não autorizam edição simultânea do arquivo. |
| `client/index.html` | **Posse por tarefa** | Codex assume para layout visual somente após conferir a liberação pelo Antigravity. Na mesma pasta, seções distintas não autorizam edição simultânea do arquivo. |
| `client/src/network/ClientNetwork.ts` | **Posse por tarefa** | Fronteira de integração: combinar um único editor antes de adaptar mensagens ou callbacks. |
| `Docs/PADRAO_FRENTE_VISUAL_CODEX.md` | **Codex** | Padrão e critérios de aceite da frente visual. |
| `Docs/ROADMAP_PROXIMOS_PASSOS.md` | **Antigravity, nesta etapa** | Codex registra evidências no padrão visual e propõe a atualização ao responsável. |

O usuário confirmou o Codex como responsável principalmente pela frente visual. Isso não implica posse permanente de todo arquivo nem autorização automática para mudanças de arquitetura. A posse é combinada por tarefa, especialmente para arquivos já modificados. Em caso de sobreposição ativa, parar a edição e informar o usuário conforme `AGENTS.md`.

Para a execução visual, seguir também [`PADRAO_FRENTE_VISUAL_CODEX.md`](./PADRAO_FRENTE_VISUAL_CODEX.md). A descrição de um asset como disponível neste inventário não comprova sua integração em execução.

---

## 5. Como Iniciar a Próxima Ordem

1. O usuário define qual agente executará cada pacote ou instrui os agentes a iniciarem seus respectivos worktrees.
2. Cada agente checa o `git status` e garante que suas modificações estão íntegras e testáveis antes de entregar.
3. Ao término de cada etapa, ambos fornecem o **Relatório de Entrega** estipulado na Seção 7 do `AGENTS.md`.
