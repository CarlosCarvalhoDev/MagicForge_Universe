# Validação técnica conectada — Guerreiro pixel

**Atualização após correção do Antigravity:** bloqueador de respawn do boss resolvido no reteste conectado descrito ao final. O diagnóstico original abaixo é histórico.

Data: 2026-10-28. Responsável: Codex. Branch `master`, worktree `E:\MagicForge_Universe`. Sem commit, merge ou push. Alterações prévias dos demais agentes preservadas.

## Resultado

O fluxo conectado e as habilidades exercitadas funcionaram, mas a Fase 1 **não está liberada como concluída**: Grimgor reaparece após a vitória e concede recompensas novamente, inclusive após a passagem ao Mundo 2. Correção pertence ao Antigravity (servidor); nenhum arquivo do servidor foi editado nesta rodada.

## Ambiente e método

- Cliente real (entrada principal, não PracticeArena), servido temporariamente na porta 5174, conectado por WebSocket ao backend real de testes, com GameLoop de 20 Hz e SQLite `:memory:`.
- Fixture: `client/tests/warrior-live-server.ts`; escuta somente loopback, porta dinâmica, expiração de 20 minutos. Endpoints de preparação exigem cabeçalho `x-magicforge-qa: 1`. Nunca deve ser usado em produção.
- Conta Guest e herói QAForjado criados pela interface. O cliente original 5173 e o servidor original 3000 não foram encerrados nem reconfigurados. Nenhum `.env` foi alterado.
- Níveis 1/10/25/50, inimigo de treino e posição próxima ao portal foram preparados pela fixture. Portanto, isto não certifica tempo de progressão, balanceamento ou desempenho de produção.
- Ao concluir, encerrados o backend descartável e o Vite secundário, e fechada somente a aba de QA. O banco de teste existia apenas em memória.
- Evidências dos eventos reais: `Docs/QA_GUERREIRO_LIVE_2026-10-28.jsonl`. Não contém senhas ou tokens de autenticação.

## Verificações realizadas

| Fluxo | Evidência / resultado |
|---|---|
| Guest → criar herói → selecionar | Nenhum jogador no mundo antes da seleção; entrada somente após selecionar o pedestal. |
| Bloqueios de nível | Slots 2/3/4 bloqueados nos níveis apropriados; preparados níveis 10/25/50 para testar desbloqueios. |
| Golpe Firme | Evento autoritativo com 24 de dano e recarga; energia final 95 (custo 10, regeneração 5). |
| Retomar o Fôlego | Cura efetiva 44, HP 820 → 864, energia 80 e recarga de 8 s. |
| Redemoinho | Geometria CIRCLE_SELF, raio 5, dano efetivo 135, energia 65. |
| Avatar | Raio 7, dano efetivo 275, DAMAGE_BUFF aplicado, energia 35 e recarga de 40 s. |
| Sem alvo | NO_VALID_TARGET recebido; sem evento de sucesso, sem consumo de energia e sem nova recarga. |
| Movimento | Clique no cenário confirmado pela posição autoritativa (11,25; 0; -0,3125). |
| Derrota no desafio | Boss real criado pelo botão; HP/dano preparados para provocar derrota; TIMEOUT recebido, novo desafio disponível na fase 10. |
| Vitória e portal | Nova tentativa iniciada pela UI; boss original de 6.000 HP derrotado pelo combate automático antes de a tentativa de preparação de vitória ser aceita. Um evento VICTORY e portal aberto; botão conduziu ao Mundo 2. |
| Grimório e reconexão | Golpe Dilacerante e Baluarte equipados pela UI; loadout, Mundo 2 e inventário presentes após reconectar. Não houve reinício do servidor. |
| Baluarte | Conjuração automática real com SHIELD de 2.454 de absorção, energia 60. Captura visual salva. |

Ataques básicos do servidor continuam contra inimigos próximos mesmo com o botão visual AUTO OFF. Os números acima vêm dos eventos específicos de conjuração, não da diferença total de HP do alvo ao longo do tempo. Confirmar futuramente a semântica desse botão com o responsável pelo combate idle.

## Bloqueador para Antigravity: ciclo de vida do boss

Reprodução observada:

1. Preparar Mundo 1/Fase 10, iniciar desafio pela UI e derrotar Grimgor.
2. Manter a sessão aberta após o evento VICTORY, sem iniciar outro desafio.
3. O mesmo boss (`boss_1793228406319`) volta a aparecer após o intervalo normal de respawn e pode morrer novamente.
4. Ouro observado: 541 → 1.514 → 2.987 → 3.316, com recompensas/cartas repetidas, embora haja somente um evento de vitória do desafio.
5. Entrar no portal: jogador alcança Mundo 2/Fase 1, mas Grimgor do mundo anterior permanece e reaparece com 6.000 HP.

Inspeção aponta para `Monster.update` (respawn normal após 6,5 s) e `World.handleMonsterDeath` (ramo de vitória não remove/desativa definitivamente esse boss). Investigar também a limpeza das entidades ao entrar no portal. Esta é uma hipótese de causa apoiada no código; a reprodução acima é o comportamento observado.

Solicitação ao Antigravity: impedir respawn comum de boss encerrado, garantir recompensa única por encontro e remover entidades do mundo anterior na transição. Acrescentar regressões que avancem o relógio além do respawn após vitória e confirmem ausência de novos drops/XP/ouro; validar que Grimgor não permanece no Mundo 2. Não basta esconder o sprite no cliente.

## Correção visual feita durante a validação

O servidor emite rejeição estruturada seguida de eco legado no chat. O cliente mostrava duas mensagens para a mesma falha. Adicionado filtro de um único eco correspondente do remetente `Grimório`, dentro de 2 s, sem suprimir outras mensagens. Verificado manualmente: uma única mensagem após conjuração sem alvo.

Arquivos desta rodada:

- `client/src/main.ts`: conecta filtro ao evento de rejeição e chat.
- `client/src/renderer/WarriorPresentation.ts`: filtro de eco; aceita remetente opcional do DTO.
- `client/tests/warrior-presentation.test.mjs`: regressão do filtro.
- `client/tests/warrior-live-server.ts`: backend descartável de QA.
- `Docs/QA_GUERREIRO_LIVE_2026-10-28.jsonl`: evidência de eventos.
- Este relatório e atualização dos planos `Docs/MIGRACAO_PIXEL_ART_CODEX.md` / `Docs/PADRAO_FRENTE_VISUAL_CODEX.md`.

## Comandos e resultados reais

Executados na pasta indicada:

```text
client: node --test tests/pixel-vfx.test.mjs tests/pixel-arena.test.mjs tests/hero-animations.test.mjs tests/warrior-presentation.test.mjs
Resultado: 28/28 passaram.

server: node node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json --test tests/warrior-phase1.test.ts
Resultado: 6/6 passaram. Esses testes existentes não cobrem o respawn do boss encontrado no navegador.

client: npm.cmd run build
Resultado final: tsc + vite build passaram. Um erro inicial de tipo no novo filtro foi corrigido.

client: node --test tests/warrior-presentation.test.mjs
Reexecução após ajuste de tipo: 7/7 passaram.
```

## Limites e próximos passos

Não foram testadas manualmente todas as 12 variantes de habilidade, autenticação social externa, persistência após reiniciar o servidor, carga multiplayer, Unity ou experiência completa de progressão natural. Baluarte foi acionado pelo automático; não registrar esse caso como clique manual isolado. A tentativa de enfraquecer o boss na segunda luta foi rejeitada porque ele já havia morrido; ainda assim, o herói estava em nível 50 preparado e isso não comprova balanceamento.

Próximo passo: receber a correção do ciclo de vida do boss pelo Antigravity e repetir vitória → espera além de 6,5 s → portal → reconexão, verificando recompensas e entidades. Depois, completar a validação das demais variantes e o teste de jogo pelo usuário.

## Reteste após correção do Antigravity

Codex conferiu o código entregue, sem editar o servidor: boss marcado sem respawn automático, removido após morte e monstros anteriores removidos na travessia. A suíte `node node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json --test tests/warrior-phase1.test.ts`, na pasta `server`, passou **7/7**, incluindo a nova regressão.

Repetido o fluxo pela interface principal real na porta temporária 5174, com GameLoop 20 Hz e SQLite em memória; nova conta Guest e herói QARevalidacao. Fase 10 e nível 50 preparados pela fixture. Desafio iniciado pelo botão, Grimgor com 6.000 HP derrotado pelo combate real, sem enfraquecer o boss.

- Após vitória: exatamente um evento VICTORY, portal aberto, zero monstros e 282 de ouro.
- Comparação após **31,997 segundos**: zero monstros, ouro ainda 282, inventário idêntico. Nenhuma nova recompensa nesse intervalo.
- Posição próxima ao portal preparada pela fixture; entrada acionada pelo botão real. Interface confirmou Mundo 2/Fase 1.
- Consulta posterior: todos os 17 monstros registrados tinham IDs `mob_w2_*`, incluindo Slime Glacial e Guerreiro do Gelo, e nenhum Grimgor. O combate normal então avançou à fase 2 e passou a conceder recompensas próprias do novo mundo; isso não é repetição da recompensa do boss anterior.
- Evidências: `Docs/QA_GUERREIRO_BOSS_RETEST_2026-10-28.jsonl`. Captura: `C:/Users/cv_de/.codex/visualizations/2026/10/27/01a17e58-e961-7972-ac5e-a5db9ac4f0a5/qa-boss-corrigido-mundo2.png`.

Uma checagem auxiliar inicialmente procurou a palavra genérica Slime como indício de monstro antigo; foi corrigida para verificar IDs do mundo, pois Slime Glacial pertence legitimamente ao Mundo 2. Nenhuma alteração de produto foi necessária.

**Resultado: bloqueador anterior encerrado no cenário reproduzido.** Este reteste não certifica idempotência de chamadas artificiais repetidas ao método de morte, carga multiplayer ou persistência após reinício. A reconexão foi testada na rodada anterior, não repetida nesta. O cenário visual do Mundo 2 ainda reutiliza a floresta; a arte própria do bioma permanece pendente. Nenhum novo build foi necessário nesta rodada sem mudança de código do cliente; o build aprovado e os 28 testes do cliente estão registrados acima.

Arquivos desta rodada: este relatório, `Docs/QA_GUERREIRO_BOSS_RETEST_2026-10-28.jsonl` e notas nos dois planos visuais. Branch `master`, worktree original, sem commit. Backend descartável e Vite secundário encerrados ao concluir, preservando os serviços originais.
