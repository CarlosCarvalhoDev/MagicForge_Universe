# Itens e inventário: direção e primeira refatoração

## Direção adotada

Priorizar a base de itens antes de novas atividades. Equipamento é parte da build, não carga da mochila. Cada cópia de equipamento tem identidade própria, com refino e gemas que permanecem ligados a ela. A capacidade deve representar somente os itens carregados na bag.

O layout do colaborador e `GUIA_DESIGN_SYSTEM_E_UI_RUNICA.md` continuam prioritários. Nesta entrega, o manequim, a grade, o inspetor e os submenus existentes são reaproveitados; não foi criado outro layout concorrente.

## Referências pesquisadas

Fontes oficiais, consultadas em 04/11/2026:

- [IdleMMO — Inventory](https://support.idle-mmo.com/wiki/items/inventory): ações de item e ocupação por pilha. Referência para a separação das operações e clareza do espaço ocupado.
- [IdleMMO — Items](https://wiki.idle-mmo.com/items/): distingue inventário, equipamento e armazenamento. Banco dedicado é uma etapa posterior, não foi criado neste bloco.
- [Melvor — atualização 1.2](https://news.melvoridle.com/major-update-v1-2/): busca por slot de equipamento e sinalização de melhorias disponíveis. Referência para filtros e comparação futuros.
- [Melvor — prévia dos filtros do banco](https://news.melvoridle.com/update-preview-v1-3-1-new-realm-select-bank-filters-and-more/): filtros por propriedades úteis do item. Evitar que raridade seja o único critério de escolha.
- [Melvor — atualização 1.2.2](https://news.melvoridle.com/game-update-april-fools-2024/): bloqueio de itens em ações rápidas. Referência para proteção de itens na próxima etapa.

São referências de produto, não prova de que copiar uma fórmula ou interface produz sucesso comercial. O MagicForge mantém sua identidade e valida seus próprios efeitos no combate.

## Fundação implementada

1. Equipar move a instância para a posição de equipamento e libera a posição da bag.
2. Trocar devolve o equipamento anterior à posição que o novo item ocupava. Funciona com bag cheia, sem criar uma vaga fictícia nem perder um dos itens.
3. Desequipar precisa de uma vaga real. Sem vaga, mantém o item equipado e informa o motivo. Empilhamento só ajuda quando o item é realmente empilhável; equipamentos são instâncias individuais.
4. IDs, refinos e gemas acompanham a instância durante as trocas e reconexões.
5. Pilhas são completadas e o excedente distribuído em outras vagas. Sem capacidade para a entrega inteira, a operação não entrega parcialmente nem apaga o drop.
6. O cliente transmite a instância esperada. Um comando antigo de equipar, vender, reciclar ou engastar não pode atingir outro item que passou a ocupar aquela posição.
7. Refino inclui o nível esperado, para não cobrar duas melhorias quando um mesmo pedido é repetido. Cobrança, materiais e novo nível são persistidos juntos.
8. Engaste não substitui silenciosamente uma gema. Remover gema sem conseguir devolvê-la à bag mantém a gema no equipamento.
9. Venda individual e reciclagem gravam suas alterações em transação. Reciclar em mochila expandida usa a capacidade correta para entregar o pó.
10. O contador da interface distingue mochila e equipados. Todas as vagas expandidas são exibidas, até as 100 previstas; o limite visual antigo de 50 foi removido.
11. Clicar no equipamento do manequim abre a inspeção. Desequipar passa pela ação explícita do inspetor, em vez de acontecer ao primeiro clique no manequim.

As restrições de classe, nível e atributos foram mantidas. Materiais e poções continuam protegidos da auto-venda, conforme o bloco anterior.

## Persistência e compatibilidade

O armazenamento conserva os registros existentes e suas chaves. Equipados usam endereços reservados de equipamento; a bag usa endereços não negativos. O protocolo inclui `instanceId` e `location` para representar essa distinção. O snapshot continua incluindo ambas as localizações para as rotinas de atributos, manequim e forja.

A migração cria um índice único por personagem/posição e corrige localizações antigas sem deletar itens. Itens duplicados de uma mesma categoria equipada voltam à bag. Refino e soquetes continuam associados ao ID original. Transações aninhadas usam savepoints para não quebrar resgates offline.

Clientes antigos precisam ser atualizados para enviar os IDs esperados nas operações. O cliente Web foi adaptado; o cliente Unity não foi validado nem adaptado neste bloco. Não iniciar um servidor antigo sobre um banco já migrado.

## Problema encontrado no banco local

Antes da aplicação, a auditoria em cópia detectou inconsistência física/lógica no SQLite. A mesma situação já aparece no primeiro backup local de 03/11, anterior a esta refatoração.

- A tabela de masmorras diárias contém registros com formato de inventário.
- O índice do inventário diverge dos registros legíveis.
- Há itens sem personagem correspondente e referências de índice sem registro recuperável nas tabelas e nos backups inspecionados.

Foi preparada uma cópia candidata, posteriormente **aplicada com autorização explícita do usuário em 04/11/2026**:

| Verificação | Resultado da candidata |
| --- | ---: |
| Contas preservadas | 6 |
| Personagens preservados | 6 |
| Itens utilizáveis ligados aos personagens | 77 |
| Itens recuperados da tabela incorreta | 17 |
| Cartas preservadas | 10 |
| Itens sem personagem arquivados em quarentena | 43 |
| Referências órfãs de índice ainda sem registro | 37 |
| Integridade SQLite | ok |
| Chaves estrangeiras | ok |

Identidade, nível, XP, ouro, mundo, fase e reborn dos seis personagens foram comparados e preservados. Uma cópia antiga conflitante de item mantém a versão da tabela principal, e o registro bruto conflitante permanece arquivado. Os registros danificados de masmorras ficam arquivados na quarentena; a candidata os reinicia no jogo.

A pesquisa adicional no histórico Git encontrou metadados antigos de 14 das 37 referências, no commit `0827d02d`. Foram guardados em `scratch/runtime/inventory-historical-candidates.json`, sem reaplicar itens ou alterar a proposta de 77 itens. Essas versões podem representar itens consumidos/vendidos e exigem revisão; 23 referências continuam sem metadados encontrados nas fontes verificadas.

Relatório local: `scratch/runtime/inventory-recovery-candidate-v2-2026-11-04.db.report.json`. Banco candidato preservado: `scratch/runtime/inventory-recovery-candidate-v2-2026-11-04.db`. Originais e backups permanecem preservados. A aplicação ocorreu somente após a resposta do usuário: **Aplicar a recuperação preparada**.

Antes da substituição, foram conferidos os hashes da candidata e dos dados originais para garantir que nada mudou durante a revisão. O backend estava pausado, sem gravações concorrentes. O banco original e seus arquivos auxiliares foram movidos para um arquivo de preservação em `scratch/runtime/original-db-before-approved-recovery-*`, sem exclusão. A cópia aprovada foi instalada em `server/data/magicforge.db`.

Os seis personagens foram carregados pelo código do jogo: 77 itens reconhecidos no catálogo, quatro equipados fora da bag e 73 itens na bag. Integridade SQLite `ok` e zero erros de chave estrangeira após religar o servidor. Desktop, IP da rede e `/health` responderam HTTP 200; WebSocket respondeu PONG. Backend PID 44600, Vite mantido na porta 5173. O arquivo `scratch/runtime/services.json` registra os processos atuais. Os registros diários serão recriados pelo fluxo normal do jogo; a quarentena e os metadados históricos permanecem para revisão.

## Próximas entregas de itens, em ordem

1. **Proteção e organização:** travar/favoritar item no servidor, filtros por tipo/raridade/slot, busca e ordenação sem mudar identidade ou posição lógica por acidente.
2. **Comparação de build:** comparar equipamento candidato com o atual, usando refino e gemas reais; mostrar ganhos e perdas por atributo. CP será um resumo, não a decisão inteira.
3. **Autoequipar revisável:** respeitar classe, nível, atributos, itens travados, escolhas de dano/sustentação e permitir revisão das trocas antes de aplicar.
4. **Forja e fusão:** receitas versionadas, prévia do resultado e dos custos, exclusão de equipados/travados dos ingredientes, confirmação e transação única.
5. **Banco e conjuntos de equipamento:** armazenamento separado da carga e presets de build. Um preset referencia as instâncias existentes; não duplica equipamento. Trocar conjunto também deve respeitar espaço e propriedade dos itens.
6. **Loot e progressão de raridade:** utilidade dos itens comuns como ingredientes, fontes rastreáveis de materiais, destino para duplicatas e comparação do impacto real contra chefes.

Essas etapas não foram apresentadas como funcionalidades já entregues. A primeira entrega é a fundação acima; a reorganização visual completa deve acompanhar esses comportamentos e o padrão do colaborador.

## Arquivos deste bloco

- `shared/src/inventory.ts`, `shared/src/index.ts`, `shared/src/messages.ts`: localizações e contrato por instância.
- `server/src/database/DatabaseManager.ts`: migração, capacidade, pilhas, troca, savepoints, refino e gemas.
- `server/src/network/PacketHandler.ts`: validação da instância/nível esperado e contenção de falhas de operações.
- `server/src/game/World.ts`: refino e venda com persistência atômica.
- `client/src/network/ClientNetwork.ts`, `client/src/main.ts`: snapshot por instância, comandos, bag, capacidade e inspeção do equipamento.
- `server/tests/inventory-locations.test.ts`, `client/tests/inventory-identity.test.ts`: comportamento e contratos novos.
- `server/tests/starter-equipment.test.ts`, `server/tests/warrior-phase1.test.ts`: fixtures atualizadas para localizar equipamentos pela identidade/localização.
- `server/tools/BossInvestmentSimulation.ts`, `server/tools/ProgressionSimulation.ts`: identidade estável na forja e contagem apenas de bag nas métricas.
- `server/tools/audit-inventory-migration.ts`, `server/tools/prepare-inventory-recovery.ts`: verificação e preparação de candidata restritas a cópias em `scratch`.
- `package.json`, `server/package.json`: comando `test:inventory`.
- Este documento; `scratch/runtime/`: logs, cópias, relatórios e estado de manutenção (ignorado pelo Git).

O trabalho do bloco de economia, ainda não commitado, foi preservado. A mudança antiga do handoff permanece intocada. Branch/workspace: `master`, `E:/MagicForge_Universe`; sem commit ou push deste bloco.

## Testes e limites

- `npm run test:server`: **85/85**.
- `npm run test:inventory`: **11/11** (10 já incluídos no servidor e um teste de contrato do cliente).
- `npm run test:skills`: **13/13**.
- `npm test`: **36/36** nos cinco arquivos da suíte geral do cliente.
- `npm run build`: aprovado, servidor TypeScript e cliente TypeScript/Vite; continuam os avisos anteriores dos SVGs `wing-left`/`wing-right`.
- Auditoria da candidata recuperada: integridade SQLite e chaves estrangeiras aprovadas. A migração direta da cópia original foi corretamente interrompida por inconsistência no banco.

Os testes funcionais usam bancos isolados. Após aprovação, o banco real foi substituído e validado conforme descrito acima. O servidor e o Vite estão rodando. Falta a revisão visual e das trocas de equipamento no desktop/celular pelo usuário; recarregar a página é necessário para usar o novo contrato de itens. O histórico da aplicação, o caminho do arquivo original preservado e os hashes estão em `scratch/runtime/inventory-deployment-pending.json`. O estado final é `approved-recovery-running`.

## Complemento: organização visível e comparação na mochila

A entrega anterior mudou o armazenamento e as trocas, mas preservou a aparência da mochila. Após a observação do usuário, esta etapa acrescentou controles visíveis mantendo a estrutura rúnica do colaborador:

- Busca por nome, descrição e slot, sem distinguir acentos; filtros por categoria e raridade; ordenação por posição, nome ou raridade. A ordem visual não altera a posição nem a identidade dos itens no servidor.
- Contagem separada da bag e dos equipados, resultado da filtragem e estado sem resultados; seleção dos itens também pelo teclado.
- Comparação com o equipamento do mesmo slot, incluindo refino e gemas, com ganhos e perdas por atributo. A comparação não aplica trocas nem resume escolhas diferentes de build em um único número.
- Ficha usa o nome e a classe do personagem conectado. Atributos permanentes, HP, dano base e crítico seguem as fórmulas atuais do servidor, incluindo equipamentos, gemas, cartas e reborn; dano base exclui buffs temporários.

Arquivos deste complemento: `client/index.html`, `client/src/main.ts`, `client/src/ui/InventoryView.ts`, `client/src/ui/inventory-view.css`, `client/tests/inventory-view.test.ts`, `server/package.json` e este relatório.

Verificação executada neste complemento:

- `npm run test:inventory`: 13/13 aprovados, incluindo busca, filtros, identidade e comparação com refino/gemas.
- `npm run build`: servidor e cliente aprovados; avisos já existentes dos assets wing-left/wing-right.
- `npm test`: 36/36 aprovados.
- Navegador real: busca `maca` encontrou Maça da Alvorada Divina; comparação exibiu +10 Sabedoria e +40 HP do item em relação ao slot vazio; filtragem de equipamentos retornou 13 itens em ordem alfabética sem mudar seus endereços originais.
- Desktop e viewport de 393×852 verificados. No celular, o painel mantém rolagem vertical e as abas existentes têm rolagem horizontal. Largura do documento = 393px, sem transbordamento horizontal da página. Capturas em `scratch/evidence/inventory-desktop.jpg` e `scratch/evidence/inventory-mobile.jpg`. Nenhuma troca, venda ou reciclagem manual foi executada na conta real durante a inspeção.
- `git diff --check`: o único aviso de espaço é a linha vazia já existente no handoff do Baú do Tempo, preservada sem alteração.

Pendências observadas: a capacidade legada de 31 slots não encontra a tabela de expansão em múltiplos de cinco e mostra expansão indisponível; precisa de tratamento próprio antes de validar a compra nessa conta. O aviso de chefe pode aparecer sobre o cabeçalho do modal no celular. Favoritos/travas, autoequipar e fusão continuam como próximas entregas, não foram implementados neste complemento.

Branch `master`, workspace principal; sem commit/push. O frontend em desenvolvimento recebeu as alterações; não houve nova recuperação do banco nem reinício do backend nesta etapa. Falta validação do usuário na sua própria sessão após recarregar a página.

## Ajuste solicitado: itens no centro e comparação por tooltip

A pedido do usuário, os controles de raridade, ordenação e limpeza foram retirados da interface. A mochila agora apresenta apenas busca e tipo de item na mesma linha. A grade ocupa toda a largura da área central, com ícone maior, nome curto, quantidade e borda de raridade; as ações de equipar/usar/reciclar ficam abaixo da grade, preservando os botões e molduras existentes.

A comparação saiu do painel permanente e passou para um tooltip flutuante com duas colunas: **Equipado** e **Na mochila**. Mostra os bônus reais com refino/gemas e a diferença ao lado de cada atributo, com ganho verde, perda vermelha e igualdade indicada por (=). Slot vazio é identificado explicitamente. Itens consumíveis/materiais mostram sua descrição. O tooltip não executa ações nem altera os itens.

No mouse, aparece ao entrar no item e fecha ao sair. No teclado, aparece ao navegar até o item. Em toque/pen, segurar por 400 ms abre a comparação; soltar fecha. Movimento superior a 10 px cancela a comparação e preserva a rolagem. O clique posterior a um gesto longo ou arrasto é consumido para não selecionar o item por acidente. Um toque curto continua selecionando normalmente. A atualização do inventário consulta a instância atual e recalcula o tooltip; fechar o modal, cancelar o toque ou redimensionar fecha a prévia.

Arquivos deste ajuste: `client/index.html`, `client/src/main.ts`, `client/src/ui/inventory-view.css`, novo `client/src/ui/InventoryTooltip.ts`, `client/tests/inventory-view.test.ts` e este relatório. O backend e o banco não foram modificados por este ajuste.

Validação: `npm run test:inventory` 14/14; `npm test` 36/36; `npm run build --workspace=@magicforge/client` aprovado (avisos existentes wing-left/wing-right); `git diff --check` nos arquivos tocados sem erros de whitespace. Comparação real da armadura equipada com a da mochila conferida no navegador, além de busca, seleção e grade desktop. Em 393×852, o tooltip teve 377 px de largura e permaneceu entre x=8 e x=385; comparação lado a lado e navegação por teclado verificadas. O gesto foi testado com relógio simulado (toque curto, segurar, soltar e arrastar); falta a validação física do toque pelo usuário no celular. Nenhuma troca ou reciclagem manual foi feita na conta durante a inspeção.

Evidências: `scratch/evidence/inventory-tooltip-desktop.jpg` e `scratch/evidence/inventory-tooltip-mobile.jpg`. Branch/workspace `master`, `E:/MagicForge_Universe`, sem commit ou push. Permanecem as pendências anteriores de expansão da capacidade legada e sobreposição do aviso de chefe.
