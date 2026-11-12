# Expansão da bolsa e progressão de farm — 11/11/2026

## Regra aprovada e implementada

Nenhuma expansão exige nível de personagem ou Reborn. A capacidade máxima continua em 50; acima de 35, ouro sozinho não compra expansão.

| Capacidade | Ouro | Alternativa Cash |
|---|---|---:|
| 20 → 25 | 10.000 | — |
| 25 → 30 | 50.000 | — |
| 30 → 35 | 250.000 | — |
| 35 → 40 | 1.000.000 + 1 Selo de Expansão Astral | 100 |
| 40 → 45 | 3.500.000 + 1 Selo de Expansão Astral | 200 |
| 45 → 50 | 10.000.000 + 1 Selo de Expansão Astral | 400 |

A tabela de Cash foi aprovada como provisória. As alternativas são exclusivas: Cash não cobra ouro nem selo; ouro+selo cobra ambos. Capacidades legadas são respeitadas: 31 → 35 custa 250.000 e concede quatro espaços; 48 → 50 cobra a faixa premium final e concede dois. Nenhum item existente é removido ou reposicionado pela mudança de regra.

## Implementação e integridade

- `accounts.cash_balance` guarda Cash por conta, compartilhado entre seus personagens. Capacidade e ouro continuam por personagem.
- Migração aditiva cria saldo 0 e `account_cash_transactions`. Não foi concedido Cash a nenhuma conta real.
- `creditAccountCash(accountId, amount, reference)` é uma API interna do servidor, sem opcode de crédito para o cliente. Referências repetidas não creditam duas vezes; conflito de conta/valor é rejeitado. A integração com a loja/provedor de pagamento ainda não existe.
- A compra resolve a conta pelo personagem no banco; não aceita conta ou saldo enviados pelo cliente. Capacidade esperada, forma de pagamento e preço confirmado são validados. A interface só atualiza capacidade e saldo após confirmação do servidor.
- Débito de Cash e recibo, ou débito de ouro e consumo de selo, ocorrem na mesma transação da capacidade. Falha SQL reverte tudo. Repetir a capacidade anterior não cobra novamente. O método antigo de ouro também rejeita as faixas premium, evitando um caminho alternativo que burle a regra.
- Selo protegido não é consumido. O novo material `seal_astral_expansion`, de categoria Lendário, não pode ser vendido a NPC ou reciclado. Nenhuma arte existente foi substituída; usa o fallback visual de item do projeto.
- O painel existente recebeu somente as duas opções de pagamento, saldos e requisitos. Ornamentos, identidade e layout do colaborador foram preservados.

O selo está cadastrado e o consumo funciona, mas **drop extremamente raro e oferta da loja ainda precisam de definição/calibração**. Não há compra com dinheiro real nem conversão de dinheiro real implementada neste bloco. A classificação Lendário não representa uma taxa de drop configurada.

## Farm com gestão da mochila

Foram executadas 27 sessões de 30 minutos: Guerreiro/Bárbaro/Arqueiro × sementes 101/202/303 × três políticas. Cada personagem começa no nível 1 com kit normal. A única compra de combate planejada é a primeira fusão de arma; o cenário gerenciado também equipa drops por pontuação. Não há nível, materiais, Cash, selos ou ouro extras fornecidos.

Políticas:

1. **Guardar:** mantém drops, sem expansão, novos equipamentos ou venda.
2. **Expandir:** compra expansão por ouro ao atingir 80% da capacidade, se houver saldo.
3. **Gerenciar:** equipa por pontuação excluindo até três cópias idênticas livres reservadas à primeira fusão; tenta expandir a 80%; a 90%, vende equipamentos comuns/incomuns sem proteção, refino ou gemas até chegar a 75%, preservando a reserva. Materiais, poções e raridades superiores não são vendidos. Depois da primeira fusão, deixa de reservar cópias.

As ações usam métodos reais do servidor. São decisões de um usuário simulado, **não uma nova função de compra/venda automática no jogo**. A política gerenciada combina várias decisões; não atribuir sua diferença apenas aos slots adicionais. Cada política começa com a mesma semente, mas decisões posteriores alteram o consumo do RNG.

Medianas de três sementes. Para expansão, o tempo mediano considera somente as sementes que conseguiram comprar dentro dos 30 minutos; o denominador aparece na tabela.

| Classe | Política | Primeira fusão | Expansão observada | Tempo até expandir | Segundos de bolsa cheia | Mortes |
|---|---|---:|---:|---:|---:|---:|
| Guerreiro | Guardar | 232,05s | 0/3 | — | 1.564 | 9 |
| Guerreiro | Expandir | 232,05s | 0/3 | — | 1.564 | 9 |
| Guerreiro | Gerenciar | 232,05s | 2/3 | 1.568,05s | 619 | 9 |
| Bárbaro | Guardar | 238,05s | 0/3 | — | 1.534 | 9 |
| Bárbaro | Expandir | 238,05s | 0/3 | — | 1.534 | 9 |
| Bárbaro | Gerenciar | 238,05s | 2/3 | 1.653,55s | 1.271 | 8 |
| Arqueiro | Guardar | 160,05s | 0/3 | — | 1.641 | 3 |
| Arqueiro | Expandir | 160,05s | 3/3 | 1.656,05s | 1.532 | 3 |
| Arqueiro | Gerenciar | 160,05s | 3/3 | 1.531,05s | 1.320 | 3 |

Todas as políticas tiveram duas vitórias de chefe e nível final mediano 9. As primeiras expansões observadas foram para 25 espaços. A reserva não atrasou a primeira fusão nesta amostra. Mesmo sem o bloqueio de nível, a disponibilidade de ouro ainda limita a expansão; não foi reduzido o preço inicial de 10.000 aprovado anteriormente. Expandir somente não elimina o enchimento contínuo de drops.

O resultado conecta a melhoria ao rendimento real, mas não demonstra vitória de nível 25 com farm natural: as sessões chegam perto do nível 9. As lutas de nível 25 do relatório do Bárbaro continuam sendo fixtures controladas separadas. Ainda faltam metas econômicas de médio/longo prazo e política para venda/uso de itens de outras raridades.

## Testes, UI e execução

- `npm run test:server`: **309 aprovados**.
- `npm run test:inventory`: **30 aprovados**, incluindo três testes de UI de expansão.
- `npm test`: aprovado.
- `npm run build`: servidor e cliente aprovados; build final do servidor aprovado após restringir o `catch` à transação. Os avisos existentes de `wing-left.svg` e `wing-right.svg` permanecem.
- Testes cobrem nível 1 até 35 com ouro; Cash/ouro+selo até 50 sem Reborn; repetição/stale; preço inválido; saldo insuficiente; selo protegido; conta informada pelo cliente ignorada; rollback após débito e consumo; crédito idempotente; persistência ao reabrir SQLite; falha de notificação posterior ao commit.
- Gestão simulada testa reserva de ingredientes, preservação de itens protegidos, expansão com custo real, conservação de ouro e decisões determinísticas. IDs criptográficos de instâncias são canonizados somente na comparação de testes, sem alterar sua geração de produção.
- Prévia com módulo real e transporte simulado validada no navegador: cash 35→40, ouro+selo 45→50, ouro 20→25, confirmação, capacidade máxima e viewport 393×852 sem overflow horizontal. A imagem `QA_EXPANSAO_MOBILE_2026-11-11.png` identifica explicitamente o ambiente de teste. Não foram feitos pagamentos ou concessões em conta real pela UI.
- Backend atualizado sem jogadores conectados. Página, `/health`, imagens e WebSocket responderam pelo IP `192.168.1.12`. HTTPS e configuração de rede de produção preservados; o servidor HTTP de QA foi isolado em 127.0.0.1.
- Backup consistente antes da migração. Depois da inicialização: hashes de personagens/inventário/gemas/cartas/fusões e campos preexistentes de contas idênticos, **7 personagens, 145 registros de inventário, 26 cartas**, integridade `ok`, zero erros de FK. Saldo total de Cash e transações de Cash: zero.

Dados brutos: `scratch/core-classes/inventory-progression-2026-11-11.json`. Resumos, hipóteses e hashes: `EVIDENCIAS_EXPANSAO_E_FARM_2026-11-11.json`. A medição iniciou antes do refinamento do escopo do `catch` de notificação; o caminho de compra bem-sucedida medido não mudou.

Na pasta `server`, reproduzir:

```powershell
node --import tsx tools/benchmark-inventory-progression.ts ../scratch/core-classes/inventory-progression-2026-11-11.json 1800
node --import tsx --test tests/inventory-expansion.test.ts tests/inventory-simulation-policy.test.ts ../client/tests/inventory-expansion-ui.test.ts
```

## Arquivos deste bloco

- Regras/catálogo/protocolo: `shared/src/inventory-expansion.ts`, `shared/src/items.ts`, `shared/src/messages.ts`.
- Servidor: `server/src/database/DatabaseManager.ts`, `server/src/game/World.ts`, `server/src/network/PacketHandler.ts`.
- Cliente: `client/index.html`, `client/src/main.ts`, `client/src/network/ClientNetwork.ts`, `client/src/ui/InventoryExpansion.ts`, `client/src/ui/inventory-view.css`.
- Ferramentas: `server/tools/ProgressionSimulation.ts`, `server/tools/InventorySimulationPolicy.ts`, `server/tools/benchmark-inventory-progression.ts`.
- Testes: `server/tests/inventory-expansion.test.ts`, `server/tests/inventory-simulation-policy.test.ts`, `client/tests/inventory-expansion-ui.test.ts`, `client/tests/progression-narrative.browser.ts`, `client/tests/auth-farm-integration.browser.ts`, `client/tests/inventory-expansion-preview.ts`, `client/tests/inventory-expansion-payments-preview.html`, `client/tests/inventory-expansion-payments-preview.ts`. A prévia anterior da mochila completa foi preservada e atualizada para a capacidade legada 31→35; a prévia focada de pagamentos é separada.
- Registro: este relatório, `Docs/EVIDENCIAS_EXPANSAO_E_FARM_2026-11-11.json`, `Docs/QA_EXPANSAO_MOBILE_2026-11-11.png`, atualização do roadmap. Banco ativo recebeu somente a migração aditiva descrita.

Branch/worktree: `master`, raiz `E:\MagicForge_Universe`, trabalho sequencial. Sem commit ou push. Documentos, arquivo RAR e demais alterações anteriores preservados. Próximas validações: experimentar a expansão real nos personagens, definir origem do selo e integrar o crédito da futura loja com referências idempotentes verificadas pelo servidor.
