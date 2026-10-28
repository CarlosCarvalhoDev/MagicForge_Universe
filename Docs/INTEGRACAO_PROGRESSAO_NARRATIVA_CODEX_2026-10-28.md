# Integração Web — progressão, Hall da Fama e narrativa

Entrega de 28/10/2026. Branch `master`, worktree original `E:\MagicForge_Universe`. Sem commit, merge ou push. Alterações anteriores de outros agentes preservadas. Nenhuma alteração desta entrega em server, shared, ClientNetwork, Unity, PNGs ou banco compartilhado.

## Comportamento entregue

- Hall da Fama substitui o alerta com nomes fictícios: quatro abas consultam `sendRequestLeaderboard(category, 20)` e consomem `onLeaderboardUpdate`. Exibe título honorífico, posição pessoal mesmo fora do Top 20, destaque do próprio herói, estados vazio/carregando/erro e atualização manual. Mantém a ordem recebida, inclusive Reborn antes de nível; ignora resposta atrasada de outra categoria. Fecha na desconexão. Nomes são texto, sem executar HTML.
- Mochila mostra capacidade real e os próximos cinco slots bloqueados. A expansão exige confirmação, respeita nível/Reborn/ouro e aguarda `onExpandInventoryResult` antes de alterar saldo/capacidade. Mostra falhas, limite de 50 e timeout sem reenvio automático. Mudança de saldo invalida uma confirmação aberta. Eventos de level-up de outros jogadores não podem desbloquear compras do jogador local.
- A fórmula exponencial antiga de preço foi removida. O pacote inicial de inventário não fornece uma cotação: a primeira prévia espelha a tabela atual `World.INVENTORY_EXPANSIONS`, protegida por teste de divergência. Resultados posteriores substituem a prévia por `nextExpansionCost` e `nextExpansionMinLevel`. O servidor continua decidindo requisitos e cobranças. Futuro handoff recomendado: enviar a cotação completa na sincronização inicial, incluindo requisito de Reborn, para remover essa duplicação.
- Introdução de seis cenas, aproximadamente 52,5 segundos com transições, Ken Burns, pular/avançar/voltar, Escape e botão “Rever história”. Primeira exibição controlada por `magicforge_intro_seen_v1` no navegador. Reutiliza ilustrações existentes; não foram produzidas seis imagens exclusivas. Narração por síntese de voz é opcional e começa desligada; depende das vozes do navegador. Não há áudio gravado novo.
- Pedestais ocupados mostram as falas das sete classes no hover, foco e toque. Conhecer o herói não seleciona nem entra no mundo; o botão de entrada permanece explícito. Pedestais vazios não mostram falas.
- Monstros têm balões com chance de 10% em spawn/dano, cooldown global e por tipo de 12 segundos, duração de 3 segundos com fades e subida de 15px. Snapshots repetidos não repetem o sorteio. Falas são removidas na morte/despawn. Classificação usa os nomes reais dos monstros.
- Banners de chefe consomem eventos já existentes, com fala de Grimgor na entrada, metade da vida e vitória. Chat de Malakor recebe tratamento visual próprio. Mensagens de chat agora são montadas com `textContent`, preservando os textos recebidos sem interpolação de HTML.

## Arquivos desta entrega

Alterados:

- `client/index.html`: Hall da Fama, confirmação/status de expansão, botão de história.
- `client/src/main.ts`: conexão dos componentes e callbacks, estados da sessão e renderização segura do chat.
- `client/src/renderer/GameRenderer.ts`: balões de monstros.
- `client/src/ui/AuthSelection.ts`: falas dos pedestais.
- `client/tests/auth-farm-integration.browser.ts`: amplia a fixture existente para rankings, expansão rejeitada e fala do pedestal.
- `Docs/PADRAO_FRENTE_VISUAL_CODEX.md`: ponto de retomada atualizado.

Criados:

- `client/src/ui/InventoryExpansion.ts`, `Leaderboard.ts`, `progression.css`.
- `client/src/ui/NarrativeContent.ts`, `Narration.ts`, `CinematicIntro.ts`, `FloatingDialogue.ts`, `BossNarrative.ts`, `narrative.css`.
- `client/tests/progression-narrative.html`, `progression-narrative.browser.ts`, `progression-contracts.test.ts`.
- Este relatório.

O Git já continha muitas modificações dessas frentes antes desta rodada. A lista acima descreve o incremento desta entrega, não atribui todo o diff acumulado ao Codex.

## Validação executada

Comandos em `client/`:

```powershell
npm.cmd run build
node --test tests/hero-animations.test.mjs tests/guest-session.test.mjs
node ../server/node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json --test tests/progression-contracts.test.ts
node ../server/node_modules/tsx/dist/cli.mjs --tsconfig ../server/tsconfig.json tests/integration-server.ts
```

- Build TypeScript/Vite passou, sem erros. Sem dependências novas. Node emitiu aviso preexistente de módulo sem tipo nos dois testes nativos; não impediu a execução.
- Testes Node de animação/Guest: **10/10**.
- Contratos/preços, existência das imagens, duração da introdução, probabilidade/cooldown dos balões: **4/4**.
- Navegador em `/tests/progression-narrative.html`: **36/36**, incluindo compra simulada confirmada/rejeitada, saldo alterado, limite/Reborn, ranking fora do Top 20, ordem recebida, resposta atrasada, seis cenas, skip/Escape e timeouts reais de 12s.
- Regressões no navegador: `/tests/auth-selection.html` **33/33**; `/tests/farm-helper.html` **15/15**.
- Backend real com WebSocket/SQLite `:memory:` e UI em `/tests/auth-farm-integration.html?server=ws://127.0.0.1:PORT`: **16/16**, incluindo quatro rankings com posição pessoal real e rejeição de expansão por nível, sem cobrança. Cadastro e personagem criados somente na fixture em memória.
- A primeira fixture dentro do sandbox ficou inacessível ao navegador; a repetição fora do sandbox passou. Fixtures encerraram automaticamente (exit 0); nenhuma foi aberta no banco compartilhado. Cada execução exige fixture nova: HMR/reload contra a mesma fixture reaproveita sua conta de teste e invalida a premissa de conta inexistente.
- `git diff --check -- client/src/main.ts client/index.html client/src/renderer/GameRenderer.ts`: passou; somente avisos Git de normalização LF/CRLF.
- Inspeção visual em navegador: Hall da Fama e cinemática. A captura de prévia do ranking usa dados simulados identificados na página; o cliente principal consulta a rede real.

## Pendências e próximo passo

- Validar manualmente a experiência em celular, a voz opcional e a apresentação dos balões/banners durante combate real de 20Hz. A fixture não executa o loop de combate.
- Compra bem-sucedida da expansão foi validada com transporte simulado; no backend real foi validada a rejeição por nível. Compra real com ouro suficiente e persistência após reconexão ainda requer teste isolado específico.
- Unity não foi alterado nem executado; DTOs C# entregues pelo Antigravity não equivalem a uma UI Unity pronta.
- Prioridade 4 de NPCs/gacha permanece pendente de contrato autoritativo de invocação/pity/resultados; não há rolagem de loot local.
- Ilustrações exclusivas por cena e trilha/vozes gravadas são produção artística futura.
- Exigência autoritativa de email no cadastro continua na frente do Antigravity; a interface já exige email válido. Nenhum ajuste de autenticação foi feito no servidor nesta entrega.
- Retomar a correção localizada da caminhada SE do Guerreiro: reduzir aparência de chute, preservando alternância das pernas, corpo, espada e escudo aceitos. V2 continua apenas na prévia, sem promoção ao gameplay. Não iniciar Bárbaro automaticamente.
