# Diretriz de gameplay: idle 100% automático

Aprovada pelo usuário em 03/11/2026. Esta direção substitui propostas anteriores de combate híbrido com joystick, movimento manual e arco de habilidades. O GDD referencia este documento.

## Experiência do jogador

- O jogador administra sua build, equipamentos e seleção de habilidades. O herói busca alvos, se move e luta automaticamente.
- Não há joystick, movimento por toque/clique no chão ou botão para alternar para controle manual.
- O HUD segue prioritariamente o layout do colaborador, conforme orientação de 04/11/2026: botão AUTO na apresentação compacta e habilidades quadradas na apresentação expandida. A pilha de habilidades segue a disposição visual do colaborador, com o ataque básico automático separado. A ordem de conjuração é a sequência configurada da esquerda para a direita no Grimório. Os controles AUTO/MANUAL alternam somente a conjuração de magias e sincronizam a preferência no servidor. Conjuração manual opcional por toque ou teclas 1–4 continua sujeita às regras do servidor.
- O Grimório mantém a escolha entre habilidades permitidas em cada categoria. A aba **Ciclo automático** configura somente a ordem de execução das quatro habilidades escolhidas.
- Reordenar o ciclo não muda categorias, classe, nível de desbloqueio, recurso ou cooldown. A progressão dos slots continua em níveis 1, 10, 25 e 50, com três escolhas por categoria.

## Ciclo de habilidades

Ordem padrão: `1 → 2 → 3 → 4 → 1`. O jogador pode escolher outra permutação dos quatro slots, sem repetições.

A execução começa pelo primeiro item da ordem configurada. Depois de conjurar, o cursor avança para a próxima posição; ao chegar ao fim, volta ao início. Habilidades em cooldown, bloqueadas pelo nível ou sem recurso suficiente são puladas. Se nenhuma habilidade puder ser usada, o herói continua atacando normalmente. A conjuração automática respeita as validações reais de alvo, alcance e custo.

O servidor decide a movimentação e a rotação. O navegador exibe os resultados e transmite alterações da build ou conjurações manuais opcionais; não precisa enviar comandos periódicos para sustentar o combate. Um comando antigo de movimento recebido do cliente é ignorado no modo automático.

Isso não transforma o personagem desconectado numa entidade permanentemente ativa no mundo. Ao desconectar, o progresso ausente continua sendo calculado pelo Baú do Tempo: oito horas gratuitas e política de doze horas reservada para premium futuro. A fórmula offline ainda precisa de calibração frente ao rendimento real de combate.

## Chefes e mundos

- O primeiro desafio de chefe acontece pela progressão das fases.
- Após uma falha, o herói retorna ao farm da fase 9 e tenta novamente automaticamente após 60 segundos. Esse intervalo é o parâmetro inicial, não uma conclusão de balanceamento de mercado.
- Ao vencer o chefe, o próximo mundo é desbloqueado no registro de cada participante presente na instância. A passagem ocorre automaticamente após cerca de três segundos, sem clique no portal.
- O desbloqueio salvo permite retomar o avanço após reconectar. Um personagem novo que não participou da vitória não recebe o desbloqueio apenas por encontrar um portal aberto.
- A transferência usa as instâncias do WorldManager. Não transforma o mundo antigo no novo mundo para os demais jogadores. A party é preservada, com preferência pelo mesmo número de canal quando há vaga.
- Reconectar na fase de chefe sem desbloqueio pendente reinicia o desafio automaticamente, evitando uma arena parada.

## Persistência e servidor

Migrações aditivas nesta implementação:

- `characters.skill_cast_order`: JSON com a ordem dos quatro slots; padrão `[1,2,3,4]`.
- `characters.unlocked_world`: maior mundo já liberado; personagens existentes preservam, no mínimo, o mundo em que já estão.

Nenhuma migração remove personagens ou inventário. O servidor valida a ordem antes de persistir e confirma o resultado ao cliente. A confirmação, e não uma alteração local isolada, define a ordem mostrada no HUD.

## Entrega de implementação

| Arquivos | Responsabilidade |
| --- | --- |
| `shared/src/automation.ts`, `shared/src/index.ts` | Validação da ordem e avanço circular do cursor |
| `shared/src/messages.ts`, `shared/src/opcodes.ts` | Payloads e opcodes da preferência de rotação |
| `server/src/game/World.ts` | Movimento, conjuração automática, retry de chefe, loot por alcance e desbloqueio de mundo |
| `server/src/game/WorldManager.ts` | Transferência automática entre instâncias, preservando o mundo de origem |
| `server/src/entities/Player.ts` | Cursor, timers e estado de desbloqueio |
| `server/src/database/DatabaseManager.ts` | Migrações e persistência das preferências/desbloqueios |
| `server/src/network/PacketHandler.ts` | Atualização da ordem e rejeição de movimento manual |
| `client/index.html`, `client/src/main.ts` | Remoção do joystick e da navegação/rotação pelo cliente; integração do novo HUD e aba |
| `client/src/network/ClientNetwork.ts` | Envio e confirmação da ordem |
| `client/src/ui/SkillRotation.ts`, `client/src/ui/automatic-play.css` | Editor do ciclo, quatro habilidades em linha e layout responsivo |
| `server/tools/ProgressionSimulation.ts`, `server/tools/benchmark-progression.ts` | Bancada usando a automação real do servidor, sem inputs do navegador |
| `server/tests/automatic-gameplay.test.ts` | Ciclo real, skips, movimento automático, persistência, portais e reconexão |
| `server/tests/loot-range.test.ts`, `server/tests/progression-simulation.test.ts` | Coleta das classes à distância e repetibilidade da bancada |
| `client/tests/skill-rotation-ui.test.mjs`, `client/tests/runic-ui-layout.test.mjs` | Contrato da nova apresentação e reordenação |
| `server/tests/warrior-phase1.test.ts` | Fixture de testes manuais isolada do controlador automático |
| `package.json`, `server/package.json`, `server/tsconfig.json` | Comandos de teste/bancada e compilação das ferramentas |
| `Docs/GDD.md`, este documento | Registro da direção aprovada |

Também foi corrigida a coleta automática das classes à distância: considera alcance de ataque mais a dispersão dos drops. Melee mantém seis metros; com automático desligado, coleta manual continua limitada a sete metros. O alcance é calculado a partir dos atributos do servidor, nunca de um valor enviado pelo cliente.

## Validação de 03/11/2026

- `npm run test:server`: 58/58 testes passaram.
- `npm test`: 24/24 testes do cliente passaram.
- `node --test client/tests/skill-rotation-ui.test.mjs client/tests/hunt-report-ui.test.mjs client/tests/offline-rewards-ui.test.mjs`: 8/8 passaram.
- `npm run build`: TypeScript do servidor/cliente e Vite concluídos. Permanecem os avisos anteriores de `wing-left.svg` e `wing-right.svg` ausentes.
- Instância local atualizada após confirmar zero conexões e criar backup: página e `/health` responderam HTTP 200 pela rede local, WebSocket respondeu PONG (0xF1), HTML servido contém a aba de ciclo e barra em linha sem joystick. As novas colunas foram verificadas no SQLite sem ler dados dos jogadores.
- `npm run benchmark:progression -- 300 ../scratch/progression-audit/automatic-300s.json`: doze cenários, quatro classes e três sementes, cinco minutos simulados cada. Onze chegaram automaticamente ao Mundo 2; um cenário de Clérigo registrou falha no chefe e permaneceu no Mundo 1. Nenhum cenário recebeu comandos de navegação/conjuração do navegador ou comprou upgrades.

Os artefatos `baseline-before-loot-fix.json` e `after-loot-fix.json` em `scratch/progression-audit` foram gerados antes desta direção, com o modelo anterior de autoplay. São históricos e não servem como validação da nova ordem de conjuração. A referência atual da bancada é `automatic-300s.json`.

Ainda dependem de validação manual: aparência em desktop/celular, edição da ordem no Grimório, confirmação após reconexão e passagem de mundo durante uma sessão real. Os testes visuais atuais verificam contratos e formatação, sem substituir inspeção no navegador.

## Operação e continuidade

Desktop: `https://localhost:5173/`. Celular na mesma rede: `https://192.168.1.12:5173/`. HTTPS local usa certificado de desenvolvimento. Os processos foram iniciados ocultos, sem modo watch no backend, para permanecerem ativos entre as mensagens. Logs e backups consistentes do SQLite ficam em `scratch/runtime`, ignorado pelo Git.

Antes de trocar o backend, conferir ausência de conexões e criar backup consistente. O cliente e o servidor precisam estar atualizados juntos para salvar e executar a nova ordem.

Próxima frente: medir novas builds e mundos com esta automação antes de ajustar curvas. O salto de requisito de EXP no nível 10 e a utilidade do refino continuam pontos de investigação; não foram alterados nesta entrega.

Branch/worktree: `master`, diretório principal. Alterações anteriores de outros colaboradores preservadas. Sem commit, merge ou push.

## Controle de conjuração — 03/11/2026

O botão **Magias: AUTO / MANUAL**, acima das quatro habilidades, controla somente a conjuração automática. A mesma preferência fica no Grimório, aba Ciclo automático, e é salva por personagem junto da ordem. Movimento, ataque básico e avanço permanecem automáticos nos dois modos. Em MANUAL, as habilidades continuam disponíveis para clique quando cooldown e recursos permitirem.

O ataque básico tem temporizador independente das magias. Um alvo morto pela magia não consome mais o temporizador do ataque básico naquele tick. A atualização adiciona a coluna não destrutiva `characters.auto_cast_enabled` com padrão ligado; não ativa benefícios pagos.

Verificação responsiva no navegador: 390 × 844, barra centralizada e quatro habilidades na mesma linha. Uma aba já aberta no celular precisa ser recarregada para obter o HTML novo.
