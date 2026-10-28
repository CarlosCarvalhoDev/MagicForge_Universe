# Integração Web de autenticação e Farm Helper — 28/10/2026

## Escopo e resultado

Prioridade pedida pelo usuário antes de corrigir o efeito de chute do Guerreiro. Codex integrou a UI aos contratos reais entregues em ClientNetwork/shared pelo Antigravity. Branch `master`, worktree original `E:\MagicForge_Universe`, sem commit/merge/push. Servidor, shared, `ClientNetwork.ts`, Unity, sprites e banco compartilhado não foram editados pelo Codex nesta tarefa.

### Autenticação

- Login de conta/senha e cadastro com confirmação de senha e email obrigatório na UI (regra atualizada pelo usuário), usando `sendAuthLogin` e `sendAuthRegister`. A mesma exigência ainda precisa ser aplicada autoritativamente pelo Antigravity no cadastro do servidor.
- `onAuthSuccess` valida `isActivated` antes de liberar a Sala dos Forjados e pedir a lista. O método real de lista ainda requer username; o backend usa a conta da sessão autenticada.
- `onAuthError` exibe mensagens e retorna ao login quando a sessão deixa de estar autenticada. Contas de teste legadas não ganham formulário de claim: o usuário priorizou contas novas.
- Convidado usa `sendAuthSocial('GUEST', credential)` com identificador aleatório gerado por `crypto.randomUUID`, persistido somente no armazenamento deste navegador para reutilizar a identidade. Senhas de conta não são persistidas. Se o armazenamento não funcionar, a UI pede uso de conta/senha em vez de criar acesso de convidado que se perderia silenciosamente.
- Google/Apple/Discord permanecem desabilitados: o backend inspecionado aceita token/email informado sem verificação real com o provedor. Antigravity deve entregar essa validação antes de habilitar esses botões. Nenhum token falso foi usado para simular OAuth.
- Autenticar/cadastrar não entra no mundo. Criar herói aguarda a lista confirmada. Selecionar pedestal aguarda `S2C_LOGIN_SUCCESS`.
- Refino continua consumindo `newRefineLevel` e `oldRefineLevel` do contrato; a referência incorreta a `newLevel` já estava corrigida.

### Farm Helper

- Controles existentes reaproveitados: HP 20–90%, MP 20–80%, filtros por raridade; adicionadas flags de auto-poção HP/MP e auto-loot.
- Preferências enviadas via `sendUpdateFarmSettings`; `onFarmSettingsUpdate` preenche o estado autoritativo e confirma salvamento. Valores antigos de localStorage não são usados como preferências de outro personagem.
- O servidor envia FARM_SETTINGS_UPDATE **antes** de LOGIN_SUCCESS. `main.ts` guarda esse pacote até confirmar a entrada, depois o aplica ao herói. Desconexão/troca de sessão limpa a fila e os controles.
- Removidos somente os disparos antigos de auto-poção e auto-venda do cliente para evitar duplicação com o processamento já existente no servidor. Uso manual de itens e demais controles foram preservados.
- Vender lixo usa `sendAutoSalvage(includeRare)` após confirmação explícita. Raros excluídos por padrão; inclusão é uma escolha separada, com resumo antes do envio. A UI informa que a regra real inclui todos os itens comuns/incomuns não equipados dessas raridades, inclusive consumíveis e materiais.
- `onAutoSalvageResult` mostra quantidades, lucro e saldo retornados; nenhuma remoção de item ou lucro é simulada antes do servidor. A mochila continua atualizada pelo inventário autoritativo.
- Envios duplicados bloqueados. Timeout de preferências restaura a última confirmação; timeout de venda pede conferência da mochila, sem reenviar venda automaticamente.

## Arquivos desta entrega

- `client/index.html`: cadastro, flags de farm, confirmação de venda e mensagens.
- `client/src/main.ts`: adaptadores/callbacks de autenticação e farm; fila inicial; retirada das duas automações locais duplicadas.
- `client/src/ui/AuthSelection.ts` e `auth-selection.css`: estados de cadastro/convidado e tratamento do retorno.
- Novos `client/src/ui/GuestSession.ts` e `FarmHelper.ts`: credencial de convidado e apresentação do farm.
- Testes: `client/tests/auth-selection.browser.ts`, `guest-session.test.mjs`, `farm-helper.html`, `farm-helper.browser.ts`, `integration-server.ts`, `auth-farm-integration.html`, `auth-farm-integration.browser.ts`.
- Este relatório, `PADRAO_FRENTE_VISUAL_CODEX.md` e `REVISAO_GUERREIRO_2026-10-28.md`: continuidade e feedback do usuário.

## Validação real

- `npm.cmd run build`: TypeScript e Vite passaram (22 módulos). Uma tentativa no sandbox recebeu EPERM na resolução de arquivo; repetição fora da restrição passou.
- `node --test tests/guest-session.test.mjs tests/hero-animations.test.mjs`: **10/10** passaram. Aviso Node de módulo sem tipo no package permanece; configuração do projeto não foi alterada apenas para suprimi-lo.
- `/tests/auth-selection.html`: **30/30** verificações com transporte simulado, incluindo cadastro, senhas divergentes, convidado canônico, autenticação distinta de entrada e timeout real.
- `/tests/farm-helper.html`: **15/15** verificações com transporte simulado: flags, percentuais, confirmação autoritativa, proteção contra duplicação, venda vazia, inclusão explícita de raros, cancelamento, troca de personagem e timeout real.
- Teste com **backend real + WebSocket real + SQLite `:memory:`**: **10/10** passaram. Exercitou erro para conta inexistente, cadastro, lista, criação, seleção, pacote de farm anterior ao login, salvamento, retorno da venda e desconexão. Nenhum dado foi criado no SQLite compartilhado. Sem loop de combate: não certifica a simulação 20Hz ou consumo de poções em combate.
- Comando da fixture: em `client`, `node ../server/node_modules/tsx/dist/cli.mjs --tsconfig ../server/tsconfig.json tests/integration-server.ts`. Usa porta efêmera em 127.0.0.1 e encerra automaticamente em três minutos; encerrou com código 0 após o teste. A primeira instância restrita não ficou acessível; foi encerrada e repetida com rede local permitida. Não foi iniciado o servidor compartilhado na porta 3000.
- Abrir `/tests/auth-farm-integration.html?server=ws://127.0.0.1:PORTA` somente contra a fixture; a página verifica que o endpoint declara banco em memória antes de criar dados de teste. Fixtures de desenvolvimento não fazem parte das entradas do build de produção.

## Pendências e próxima tarefa

Conferir o servidor compartilhado atualizado em execução antes de usar a tela principal (`ws://localhost:3000` é o endpoint padrão existente). Validar OAuth real com Antigravity antes de habilitar provedores externos. Convidado foi exercitado com transporte simulado e testes de reutilização local; o teste ponta a ponta acima usou conta/senha. Unity não foi alterado/testado nesta entrega.

Retomar o Guerreiro após esta integração: o usuário aprovou alternância das pernas, corpo, espada e escudo; reduzir apenas a altura/amplitude da extensão que parece chute, mantendo essas partes aceitas. Não promover a V2 atual nem começar o Bárbaro antes dessa revisão.
