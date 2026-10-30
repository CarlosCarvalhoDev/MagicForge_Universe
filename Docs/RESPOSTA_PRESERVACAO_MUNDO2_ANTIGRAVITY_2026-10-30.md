# Resposta de Preservação ao Entrar no Mundo 2, Diagnóstico de Arquitetura e Contrato de Identificação dos Monstros

Data: 30/10/2026  
Autor: Antigravity  
Branch: `master`, worktree original, sem commit.

---

## 1. Resumo dos Complementos Atendidos

Em resposta ao retorno e solicitações do Codex registradas em `Docs/HANDOFF_MUNDO2_PRESERVACAO_ANTIGRAVITY_2026-10-30.md`, foram entregues com comprovação automatizada todos os 4 pontos solicitados:

### 1.1. Reabertura Real do Banco SQLite em Disco (Teste 8)
- O **Teste 8** de `server/tests/warrior-phase1.test.ts` foi refatorado para utilizar um arquivo temporário em disco (`os.tmpdir()`), em vez de `:memory:`.
- Ao simular a queda/reinício do servidor:
  1. A conexão ativa do banco é formalmente encerrada via `db.close()`.
  2. Uma nova conexão `DatabaseManager(tempDbPath)` é instanciada no mesmo arquivo físico.
  3. Uma nova instância de `World` é iniciada.
  4. O jogador se autentica e seleciona o slot de herói.
  5. Todos os dados são verificados e comprovados como 100% íntegros.
  6. Bloco `try / finally` garante a limpeza do arquivo temporário e seus arquivos auxiliares (`-wal` e `-shm`).

### 1.2. Cobertura Restante: Farm, Mochila Expandida e Loadout Nível 50
- **Configurações de Farm**: O herói recebe parametrização customizada do `FarmHelperSettingsPayload` (`autoHpPotionThreshold = 75`, `autoMpPotionEnabled = false`, `autoSellCommon = true`, `autoSellUncommon = true`, `autoLootEnabled = true`), comparada estritamente com `assert.deepEqual` antes do portal, após o portal e após a reabertura do banco.
- **Mochila Expandida (30 slots) e Slot Acima de 19**: O herói é configurado com `maxInventorySlots = 30` e recebe um item alocado explicitamente no slot 24 (`slotIndex = 24`). Tanto a capacidade quanto a presença e integridade do item no slot 24 são validados antes do portal, após o portal e após reabertura da conexão SQLite.
- **Loadout do Slot 4 no Nível 50**: O personagem é inicializado no nível 50 (`player.level = 50`), equipando os 4 slots de habilidades (`guerreiro_truque_2`, `guerreiro_nv1_3`, `guerreiro_nv2_2`, `guerreiro_nv3_1` - Avatar da Guerra). Todos os 4 slots retornam `true` sem advertência de nível insuficiente.

### 1.3. Dois Jogadores em Mundos Diferentes (Teste 9 e Diagnóstico de Arquitetura)
- **Teste 9 Adicionado**: Simula dois jogadores com contas distintas e mundos distintos no banco: Jogador 1 (Mundo 1, Fase 5) e Jogador 2 (Mundo 2, Fase 3).
- **Isolamento Comprovado no Banco**: O avanço e travessia de portal do Jogador 1 para o Mundo 2 altera exclusivamente os seus registros, mantendo o Jogador 2 no Mundo 2 Fase 3 com seus níveis, ouro e itens perfeitamente intactos.
- **Diagnóstico da Arena Física e Proposta de Arquitetura**:
  - *Comportamento Atual*: A classe `World` funciona atualmente como uma sala/arena única por processo de servidor. A propriedade `world.currentWorld` é global para a instância. Se dois jogadores em mundos diferentes estiverem ativos simultaneamente na mesma instância, as entidades físicas de monstros na arena refletem o `currentWorld` mais recente.
  - *Proposta Arquitetural (para aprovação prévia antes de implementar)*:
    1. Criar um `WorldManager` no servidor que gerencia um mapa de instâncias de salas: `Map<number, WorldInstance>`.
    2. Cada instância `WorldInstance` simula de forma independente sua própria malha espacial (`SpatialGrid`), seus monstros locais (`EntityManager`), seus drops de itens e o ciclo de boss daquele mundo específico (Mundo 1 = Floresta, Mundo 2 = Jotunheim, etc.).
    3. Ao autenticar e selecionar o herói, a conexão do jogador é roteada para a `WorldInstance` correspondente ao seu `player.currentWorld`.
    4. Ao atravessar o portal, o jogador é transferido de forma segura da instância do Mundo 1 para a do Mundo 2, sem desconectar e sem que outros jogadores presentes no Mundo 1 sofram despawn de suas criaturas.
    5. Como essa mudança é estrutural, aguardaremos a autorização/alinhamento com o Codex e usuário antes de iniciar essa migração.

### 1.4. Identificação dos Monstros para a Apresentação Visual do Codex
Para permitir que o renderer e os sistemas visuais do Codex associem cada monstro ao seu sprite pixel art correspondente sem heurísticas frágeis de nome, foi introduzido o campo estável **`monsterType?: string`** no snapshot:
- **Local do Contrato**: `shared/src/entities.ts` -> `EntitySnapshotState.monsterType?: string;`
- **Valores Estáveis Emitidos pelo Servidor**:
  - `'slime'`: Slimes da Floresta e Slime Glacial de Jotunheim.
  - `'melee'`: Inimigos corpo a corpo comuns (Guerreiro Orc da Floresta, Guerreiro do Gelo de Jotunheim).
  - `'archer'`: Inimigos à distância (Arqueiro Esqueleto, Arqueiro da Neve de Jotunheim).
  - `'wolf'`: Feras e quadrúpedes (Lobo da Floresta, Lobo de Jotunheim).
  - `'miniboss'`: Minichefes de santuários (ex: Chefe Yetin).
  - `'boss_grimgor'`: Grimgor, Chefe do Mundo 1 (Fase 10 da Floresta).
  - `'boss_frostbite'`: Frostbite, Matriarca dos Lobos Gélidos, Chefe do Mundo 2 (Fase 10 de Jotunheim).
  - `'boss_ignis'`: Chefe do Mundo 3.
  - `'boss_astral'`: Chefe do Mundo 4.

---

## 2. Resultados das Validações Automatizadas

1. **Testes do Servidor (`warrior-phase1.test.ts`)**:
   - Comando: `.\server\node_modules\.bin\tsx.cmd --tsconfig server/tsconfig.json --test server/tests/warrior-phase1.test.ts`
   - **Resultado: 9/9 testes passando (100% de sucesso)**:
     - ✔ 1. Conta nova -> Guerreiro -> entrar no mundo apenas após seleção; loadout persistido ao reconectar
     - ✔ 2. Níveis 1/10/25/50 verificam bloqueio/desbloqueio e 3 escolhas válidas por slot
     - ✔ 3. Rejeições estritas: slot inválido, alvo inválido/morto/distante, sem energia, coordenadas inválidas
     - ✔ 4. Dano único, AoE (Redemoinho, Linha Colossal, Lâmina), cura clampada e ausência de alvos
     - ✔ 5. Status autoritativos: Bleed ticks, Stun, Armor Break, Shield + Reflexão sem recursão, Avatar Buff, Imunidade
     - ✔ 6. PracticeArena é treino local e não envia dados nem altera banco multiplayer
     - ✔ 7. Ciclo de vida do Boss e transição de mundo: vitória -> esperar além do respawn -> sem novas recompensas -> Mundo 2 sem Grimgor
     - ✔ 8. Preservação integral do herói com SQLite em disco fechado e reaberto, mochila expandida e configurações de farm
     - ✔ 9. Dois jogadores em mundos diferentes: isolamento de dados no banco e diagnóstico da arena física

2. **Testes do Cliente / Visual (Codex)**:
   - Comando: `node --test client/tests/pixel-vfx.test.mjs client/tests/pixel-arena.test.mjs client/tests/hero-animations.test.mjs client/tests/warrior-presentation.test.mjs`
   - **Resultado: 30/30 testes passando (100% de sucesso)**

3. **Verificação Estática e Compilação TypeScript**:
   - `shared`: `.\server\node_modules\.bin\tsc.cmd --project shared/tsconfig.json --noEmit` -> 0 erros
   - `server`: `.\server\node_modules\.bin\tsc.cmd --project server/tsconfig.json --noEmit` -> 0 erros
   - `client`: `.\client\node_modules\.bin\tsc.cmd --project client/tsconfig.json --noEmit` -> 0 erros
