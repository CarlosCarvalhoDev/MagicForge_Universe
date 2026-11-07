# Correção da expansão e coleta offline — 04/11/2026

## Entrega

- Política única de expansão em `shared/src/inventory-expansion.ts`, consumida pelo servidor e pela interface. Capacidades preservadas pela migração, como 31, usam sua faixa correta: 31→36 por 250.000 ouro, nível 35 ou Reborn. Custos, requisitos e teto de 50 foram mantidos. A última compra respeita os espaços efetivos restantes até 50.
- Confirmação compacta antes da grade, com capacidade antes/depois, preço, requisito faltante e ações Comprar/Agora não. Farm e atualizações de saldo não fecham a confirmação. Saldo insuficiente desabilita Comprar; capacidade alterada invalida a cotação anterior.
- Compra envia a capacidade esperada. Replay de uma compra antiga não compra a próxima expansão. SQL debita e altera capacidade com uma única atualização condicional, exigindo saldo e capacidade persistida correspondentes.
- Baú entrega ouro, EXP e as quantidades que couberem nas pilhas/espaços disponíveis. Apenas o restante permanece no JSON já existente do personagem; não há mudança de schema nem descarte de recompensas. Ouro e EXP são zerados na pendência, impedindo repetição de crédito.
- Resgate sem nenhum progresso possível preserva a pendência. Falhas de persistência revertem a transação inteira e o estado em memória, como antes.
- Reconexão soma apenas os novos intervalos de materiais ao restante, sem recriar itens já retirados. O teto temporal acumulado do baú pendente permanece conforme a política anterior até o resgate completo.
- O Baú continua acessível pelo dock e ganhou um atalho na própria mochila. Resgate parcial mantém o modal e atualiza sua prévia; reabrir uma pendência só de itens explica que ouro e EXP já foram creditados.

## Arquivos

- `shared/src/inventory-expansion.ts`, `shared/src/index.ts`, `shared/src/messages.ts`.
- `server/src/database/DatabaseManager.ts`, `server/src/game/World.ts`, `server/src/game/OfflineRewards.ts`, `server/src/network/PacketHandler.ts`.
- `client/index.html`, `client/src/main.ts`, `client/src/network/ClientNetwork.ts`, `client/src/ui/InventoryExpansion.ts`, `client/src/ui/OfflineRewardModal.ts`, `client/src/ui/inventory-view.css`.
- `server/tests/inventory-expansion.test.ts`, `server/tests/offline-policy.test.ts`, `server/tests/offline-rewards.test.ts`, `client/tests/inventory-expansion-ui.test.ts`, `client/tests/offline-rewards-ui.test.mjs`.
- `client/tests/progression-contracts.test.ts`, `client/tests/progression-narrative.browser.ts`: contratos atualizados para a política compartilhada e confirmação preservada durante farm.
- `client/tests/inventory-expansion-preview.html` e `.ts`: prévia isolada com DOM/CSS de produção e transporte simulado; sem compra na conta real.
- `server/package.json`: inclui os testes novos no comando de inventário. Este relatório.

## Verificação

- `npm run test:server`: 88/88 no servidor após as correções. O teste adicional de expansão seguida da retirada completa foi acrescentado depois e passou na suíte offline abaixo.
- `npm run test:inventory`: 17/17, incluindo legado 31, limite final, Reborn, saldo, replay e confirmação que sobrevive ao farm.
- `npm run test:offline`: 16/16 no servidor e 4/4 na interface, incluindo resgate parcial, reconexão, falha de save e ciclo bag cheia→expansão→retirada do restante.
- `npm test`: 36/36.
- `client/tests/progression-contracts.test.ts` executado com tsx e tsconfig do servidor, cwd client: 4/4.
- `npm run build`: aprovado; build final do cliente também aprovado. Permanecem os avisos anteriores dos assets wing-left/wing-right.
- Harness em navegador `/tests/progression-narrative.html`: PASS 36/36, transporte simulado.
- Prévia isolada em navegador: confirmação mantida com saldo mudando a cada 500 ms; compra simulada libera 31→36 e renderiza 36 slots. Em 393×852, largura do documento de 393 px, sem transbordamento horizontal. Capturas em `scratch/evidence/inventory-expansion-desktop.jpg` e `inventory-expansion-mobile.jpg`.
- `git diff --check` dos arquivos deste bloco sem erros de whitespace. Handoff antigo preservado.

## Aplicação e validação restante

Backend reiniciado somente após verificar ausência de jogadores conectados e salvar backup SQLite consistente em `scratch/runtime/before-expansion-fix-1793811295991.db`. Nenhum reset, recuperação adicional de banco ou concessão de saldo/nível foi feito. Backend PID 30308, HTTP /health online a 20Hz; Vite permaneceu rodando. Estado atualizado em `scratch/runtime/services.json`. A inspeção do jogo não efetuou compra nem coleta na conta real; a compra visual foi feita na prévia simulada.

É necessário recarregar o cliente e entrar novamente se a sessão expirar. Validar a compra na conta/aparelho do usuário com os requisitos reais: a capacidade 31 ainda exige nível 35 ou Reborn e 250.000 ouro; o conserto não remove essa regra. Ouro/EXP podem ser retirados do baú mesmo sem espaço para todos os itens.

Branch `master`, workspace `E:/MagicForge_Universe`. Sem commit/push deste bloco. Banco ativo, backups, logs e evidências locais permanecem fora do Git.
