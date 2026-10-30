# Padrão da frente visual — MagicForge: Universe

Data: 27/10/2026. Responsável principal: OpenAI Codex, conforme divisão aceita pelo usuário. Este documento complementa o [plano de colaboração](./PLANO_COLABORACAO_ANTIGRAVITY_CODEX.md) e segue o [AGENTS.md](../AGENTS.md).

## Ponto de retomada — ordem aprovada pelo usuário em 27/10/2026

**Próxima retomada após a entrega de Jotunheim (30/10/2026):** ler [BIOMA_JOTUNHEIM_VISUAL_2026-10-30.md](./BIOMA_JOTUNHEIM_VISUAL_2026-10-30.md). Mundo 2 já possui primeira arte de neve/gelo ligada ao evento de fase, props nativos e portal pixel; prévia tem seletor de bioma. Build e 34/34 testes passaram. Próximo: QA conectado da mudança de arte, depois sprites próprios de inimigos e Frostbite. Arte ainda sujeita ao aceite; não confundir substitutos Orc/Slime com personagens finais. Complementos do Antigravity continuam no handoff de preservação. Não editar arquivos de backend/rede durante a execução paralela.

**Estado atual em 30/10/2026:** seguir primeiro [REVISAO_VFX_GUERREIRO_2026-10-30.md](./REVISAO_VFX_GUERREIRO_2026-10-30.md). Foram exercitadas as 12 escolhas no cliente conectado com banco em memória; build e 30/30 testes cliente passaram. Corte básico aprovado preservado, quatro técnicas diferenciadas, prévias/Ultimate/Julgamento revisados. Aceite artístico novo não presumido. Boss já corrigido e retestado; históricos abaixo não reabrem esse bloqueador. Próxima frente Codex: apresentação pixel do bioma de gelo Picos de Jotunheim. Pedido ao Antigravity: [preservação completa após portal e reinício e dados do Mundo 2](./HANDOFF_MUNDO2_PRESERVACAO_ANTIGRAVITY_2026-10-30.md). Sem edição em servidor/shared/rede/Unity/banco nesta rodada.

**Handoff corrigido e conferido:** suíte servidor repetida pelo Codex agora **6/6**, cliente build e **27/27**. `damageSource` e contador autoritativo de escudo conectados; corte V2 mantido aprovado provisoriamente. A antiga falha de stun abaixo é histórica. Próxima frente: validação em jogo conectado da primeira fase, sem declarar o ciclo inteiro pronto só com testes unitários. Ver atualização no [RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md](./RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md).

**Aceite mais recente do corte:** V2 aprovada provisoriamente pelo usuário em 28/10/2026 (“esta bom esse corte por enquanto”). Não refazer nem restaurar V1 pontilhada. Aceite visual separado da pendência de stun do backend e do QA conectado. Atualização apenas documental.

**Retomada mais recente:** handoff de skills/status ligado à apresentação, rejeições sem sucesso falso, resultados por alvo e castId, remoção de escudo/buffs, corte V2 em avaliação. Cliente passou build e 26 testes; servidor apresentou falha no teste de stun (5/6). Repassar [RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md](./RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md). Não marcar ciclo/fase como concluídos antes da correção e QA conectado.

**VFX pixel do Guerreiro — primeira integração:** ver [INTEGRACAO_VFX_GUERREIRO_2026-10-28.md](./INTEGRACAO_VFX_GUERREIRO_2026-10-28.md). Corte/cura/redemoinho/Avatar conectados à confirmação atual de cast; impactos, level up e seis prévias visuais disponíveis. Build e 21 testes passaram. Buffs/escudo persistentes e oito escolhas adicionais continuam pendentes do contrato do Antigravity; não aplicar gameplay no player de VFX.

**Próximo handoff de skills:** usuário priorizou Guerreiro para fechar a primeira fase. Enviar ao Antigravity [PROMPT_ANTIGRAVITY_FASE1_GUERREIRO_PIXEL.md](./PROMPT_ANTIGRAVITY_FASE1_GUERREIRO_PIXEL.md), com 12 IDs atuais, lacunas do executor, proposta compatível de eventos e testes. Novo pacote gratuito de magia adquirido/inventariado; VFX ainda não integrados. Não tratar o antigo guia de quatro skills como o catálogo atual nem fazer o player visual aplicar dano/status.

**Estado mais recente pixel art:** primeira clareira funcional em `client/pixel-arena.html`, com movimento/clique, combate local, auto e reset; renderizador principal usa apresentação pixel. Arte nativa de Guerreiro/slime/orc, terreno e objetos; classes/chefes restantes e Unity pendentes. Relatório: [PRIMEIRA_ARENA_PIXEL_2026-10-28.md](./PRIMEIRA_ARENA_PIXEL_2026-10-28.md). Não retomar produção da arte HD sem nova decisão do usuário. Nenhuma mudança desta entrega em rede, shared, servidor, banco, login ou main.

**Mudança de direção aprovada em 28/10/2026:** o usuário decidiu migrar todo o visual para pixel art, incluindo mapa, pedras, monstros e personagens. Suspender produção de novas direções da arte HD anterior. Aquisição de gratuitos CraftPix iniciada em `Imports/CraftPix/`, com catálogo, hashes e dimensões reais; pacotes ainda não integrados. Não apagar arte antiga nem sobrescrever mudanças locais. Retomar por [MIGRACAO_PIXEL_ART_CODEX.md](./MIGRACAO_PIXEL_ART_CODEX.md), que tem a sequência e limites atuais. As aprovações e prioridades HD abaixo são histórico.

**Leia esta seção primeiro ao retomar o projeto após perda de contexto.** As seções posteriores contêm histórico; decisões atuais abaixo substituem propostas antigas incompatíveis. O registro inicial foi apenas documental; as atualizações datadas abaixo indicam as tarefas posteriormente iniciadas e seu estado real.

### O que já foi feito

- Caminhada SE da Clériga V4.1 aprovada explicitamente pelo usuário em movimento e integrada nos PNGs canônicos Web, Unity e Docs. São oito quadros, 12 FPS, grade 4×2, células de 512 px e folha 2048×1024. GUIDs e `.meta` preservados. Base: [walk_v4_1](./Art/Isometric/Animations/Heroes/Clerigo/Revisoes/walk_v4_1/README.md). V2 e V3 foram reprovadas e permanecem arquivadas; não restaurá-las como versão aprovada.
- A aprovação refere-se à caminhada SE da Clériga, não a todas as direções, ações ou classes. Unity Play Mode dessa integração permanece pendente.
- Prévia independente de animações disponível em `client/animation-review.html` (`http://localhost:5173/animation-review.html` com Vite ativo), com comparação, seleção de quadros e velocidade ajustável. Código: `client/src/review/animation-review.ts`; manifesto de reprodução: `client/src/renderer/HeroAnimations.ts`.
- Reprodução Web corrigida para timing por ação e estados de morte/revival; ajustes correspondentes de timing no Core Unity. Detalhes e limitações em [REVISAO_ANIMACOES_HEROIS.md](./REVISAO_ANIMACOES_HEROIS.md).
- Interface Web preparada com telas separadas: conta/senha → Sala dos Forjados → seleção/criação → mundo. Pedestais ocultos antes de autenticar. Google, Apple, Discord e Convidado previstos visualmente, ainda desabilitados na última entrega da interface; nenhum login social real foi validado pelo Codex.
- Última validação de código da interface: build passou, 24/24 verificações de UI com transporte simulado e 8/8 testes Node de animação passaram. Resultados históricos não dispensam repetir os checks pertinentes após novas alterações. Não houve validação ponta a ponta de autenticação/persistência pelo Codex.

### Próxima tarefa e sequência de arte aprovada

**Atualização mais recente — Arqueiro V1 aprovado e integrado (28/10/2026):** usuário aprovou “esta bom”. Cinco folhas/22 quadros promovidos ao Web/Unity/Docs; manifesto Web e arrays de `Arqueiro.asset` conectados. GUIDs existentes e propriedades da classe preservados. Build, oito testes Node e auditoria da integração passaram. Unity Play Mode e combate/projétil ponta a ponta pendentes. Relatório: [REVISAO_ARQUEIRO_2026-10-28.md](./REVISAO_ARQUEIRO_2026-10-28.md). Retomar pela validação em jogo antes de outras direções/classes ou UI de Masmorras. Os registros de candidata abaixo são históricos.

**Estado atual — Arqueiro básico V1 candidato (28/10/2026):** cinco folhas e 22 quadros preparados (idle 4, walk 6, attack 6, hit 2, death 4), células de 512 px. Disponível na prévia independente, com referência estática original ao lado e 32/32 folhas/versões carregadas. Build, oito testes Node e auditorias de assets do Arqueiro e das três caminhadas aprovadas passaram. **Aguardando avaliação visual, sem integração ao gameplay/Unity.** Próximo passo: conferir apoios e transição 6→1, eixo SE, arco/corda/flecha e transições; corrigir por nova revisão se necessário, depois integrar somente o aprovado preservando GUIDs. Relatório e lista de arquivos: [REVISAO_ARQUEIRO_2026-10-28.md](./REVISAO_ARQUEIRO_2026-10-28.md). As notas antigas abaixo não substituem este estado.

**Handoff recebido — Masmorras Diárias/Boss Rush (28/10/2026):** conferidos [SISTEMA_MASMORRAS_DIARIAS_E_BOSS_RUSH.md](./SISTEMA_MASMORRAS_DIARIAS_E_BOSS_RUSH.md), os DTOs de shared e os métodos/callbacks reais em `ClientNetwork.ts`. Opcodes `0x88`–`0x8E` presentes. Frente futura de UI registrada sem substituir a prioridade atual do Arqueiro; ainda não implementada nem validada ponta a ponta pelo Codex.

- Painel de entrada: `sendRequestDungeonInfo()` → `onDungeonInfo`, exibindo ingressos, limite/compras extras, custo oficial, recordes e masmorra ativa. Não usar `ticketsRemaining/maxDailyFreeTickets` como limite total, pois ingressos extras podem ultrapassar a cota gratuita.
- Entrar: `sendEnterDungeon('BOSS_RUSH' | 'GOLD_TREASURY')`. Confirmar início apenas com `onDungeonEvent`; tratar `START`, `WAVE_START`, `WAVE_CLEAR`, `VICTORY`, `DEFEAT`, `TIMEOUT` e `LEFT`. HUD mostra onda, chefe/HP, tempo e recompensas recebidas; contador visual não decide vitória/derrota nem distribui loot localmente.
- Comprar ingresso: confirmação com `extraTicketCostGold` autoritativo, envio único `sendBuyDungeonTicket()` e retorno `onBuyDungeonTicketResult` para atualizar ingressos e saldo. Não embutir no cliente os 50.000 ouro ou os limites descritos no texto como fonte de verdade.
- Sair/desistir: confirmação → `sendLeaveDungeon()` → evento `LEFT`. Prever erro, timeout e desconexão sem inventar sucesso ou permitir gasto duplicado.
- Consumo dos callbacks por atribuição de propriedades, conforme implementação real da rede; não confundir com inscrição via chamada de função. Revisar sessão/retomada e campos de tempo/reset quando esta frente começar. Backend/shared/rede continuam de posse do Antigravity.

Esta conferência alterou somente este plano. Branch `master`, worktree original; sem commit. Build/testes de gameplay não executados porque não houve alteração de código ou assets.

**Estado mais recente do Bárbaro — aprovado e integrado:** em 28/10/2026 o usuário aprovou a V3 (“ok esta bom”). Ativa em Web/Unity/Docs; cinco quadros originais preservados e apenas walk_01 corrigido para recuperar a lâmina. Seis quadros/9 FPS/3×2/512 px; GUIDs, `.meta`, fileIDs e class asset intactos. `Barbaro/Revisoes/active-walk.json` registra o hash aprovado. V2 permanece reprovada pelo samba lateral; não restaurar. As notas de avaliação abaixo são históricas. **Próximo pacote do plano de quatro classes: inventariar e preparar o Arqueiro básico**, sem refazer as caminhadas aprovadas de Bárbaro, Guerreiro e Clériga. As demais ações dessas classes continuam sem aceite específico e Unity Play Mode pendente. Relatório: [REVISAO_BARBARO_2026-10-28.md](./REVISAO_BARBARO_2026-10-28.md).

**Bárbaro — decisão mais recente:** revisão iniciada; baseline dos 110 arquivos preservado. V2 foi **reprovada pelo usuário** por abrir as pernas lateralmente e “sambar” com tronco fixo. Preservar a direção da caminhada anterior. Próximo ajuste é localizado na lâmina ausente do machado no quadro 2, sem redesenhar toda a passada; comparar antes de promover. Ver [REVISAO_BARBARO_2026-10-28.md](./REVISAO_BARBARO_2026-10-28.md). Guerreiro V3 e Clériga V4.1 continuam aprovados e ativos; não alterar. Não avançar ao Arqueiro enquanto esta correção estiver em avaliação.

**Atualização do Bárbaro:** V3 com marcha anterior + reparo do machado disponível somente na prévia, comparada com o original. Cinco quadros pixel-idênticos confirmados; só o quadro 2 mudou. Os 110 arquivos canônicos permanecem intactos. Auditorias e build passaram; navegador 26/26 folhas sem erros. Aguardar avaliação da V3, especialmente registro do quadro reparado. Não confundir com a V2 reprovada nem promover automaticamente. Fontes, prompt e limites em [walk_v3/README.md](./Art/Isometric/Animations/Heroes/Barbaro/Revisoes/walk_v3/README.md).

**Orientação posterior do usuário — continuar a produção aqui:** usuário considera o Guerreiro viável e prefere manter o processo atual a adotar o gerador Universal LPC. Preservar a caminhada SE V3 aprovada. A especificação externa de folhas foi avaliada, com os ajustes abaixo para os próximos pacotes; não foi autorização para regenerar em lote as oito entidades nem alterar importadores.

- Exportar células finais de 512×512 e folhas com dimensões exatas conforme manifesto de cada ação. Fontes individuais maiores e quadradas, como os PNGs 1254×1254 usados na V3, são válidas antes do empacotamento proporcional; não confundi-las com sheets finais 3×2.
- Não impor seis quadros de caminhada a todos: Clériga aprovada usa 8/12 FPS/4×2; Guerreiro usa 6/9 FPS/3×2; o guia atual prevê quatro quadros para walk/attack dos monstros básicos. Conferir metadados reais antes de cada pacote. Web usa descritores de grade/timing, Unity usa fatias `.meta` e arrays de sprites; não há dedução universal automática de todas as grades.
- Contatos opostos nos quadros 1/4 de um ciclo humano de seis quadros, com apoio, passagem e preparação do contato intermediários; não manter a mesma perna adiantada durante toda a linha da folha. Lobo precisa de marcha quadrúpede; slime precisa de deformação volumétrica, sem pernas humanas.
- Fixar registro corporal e apoio coerentes com cada pacote aprovado; X=256 pode orientar o eixo corporal, sem centralizar pelo brilho da arma. Não deslocar a arte aprovada só para forçar pés em Y=480: o pivô Unity atual do Guerreiro é (0.5,0.15), e a prévia marca essa referência a 85% da altura contando do topo. Linha de contato e pivô são medidas distintas.
- Preferir RGBA transparente sem chão/sombra pintados: o renderer Web já desenha sombra elíptica. Não acrescentar sombra dupla. Preservar o tratamento legado dos arquivos pretos existentes até revisão específica.
- Usar os personagens aprovados como referência de estilo, proporção e direção; o termo genérico “dark fantasy pintado” não autoriza mudar a identidade cel-shaded atual. Nenhuma arma/capa/efeito deve vazar da própria célula.
- Processo mantido: inventário → base consistente → quadros individuais → empacotamento técnico → comparação em movimento → aceite → integração preservando GUIDs. Fazer checagem objetiva do Bárbaro existente e, na sequência da meta de quatro classes, completar o Arqueiro básico; produzir Mago/Bruxo/Monge e monstros em etapas posteriores. As demais ações do Guerreiro continuam sem aceite artístico específico, mas não refazer sua caminhada nem tratá-lo como bloqueio para ampliar o elenco.

Fonte externa consultada: [Universal LPC Generator](https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/) e seu [repositório oficial](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator). É uma alternativa de pixel art; misturá-la aos heróis atuais exigiria adaptação visual. Nenhum asset externo baixado ou incorporado. Esta atualização alterou somente este plano, na branch `master`/worktree original; conferência estática, sem build/teste de código porque não houve alteração de código ou imagem.

**Estado mais recente — caminhada do Guerreiro aprovada e integrada em 28/10/2026:** usuário aprovou V3 (“agora fico muito bom”). Ativa em Web/Unity/Docs, seis quadros/9 FPS/grade 3×2/512 px; recortes 01–06 de Web/Docs sincronizados. GUIDs, `.meta`, fileIDs, `.asset` e controladores preservados. `Guerreiro/Revisoes/active-walk.json` registra o hash ativo; versões anteriores e recortes substituídos arquivados. As notas de candidata abaixo são históricas. **Próximo trabalho do Guerreiro: revisar transições e ações idle/attack/hit/death; não refazer a caminhada aprovada nem iniciar outra classe automaticamente.** Direções extras e Unity Play Mode continuam pendentes.

**Retomada mais recente do Guerreiro — 28/10/2026:** V3 de passo curto criada em `Guerreiro/Revisoes/walk_v3` e exposta somente na prévia, comparada à V2 com chute. São seis quadros a 9 FPS, com aproximações dos pés e contato oposto redesenhados individualmente; fontes, prompts e manifesto preservados. Auditorias V3/V2/Clériga, Node 8/8 e build passaram; navegador 22/22 folhas sem erros. **Aguardar avaliação visual da V3 antes de promover:** conferir apoios 1/4, passagem, variações generativas de arma/contorno, altura de contato e fechamento 6→1. Nenhum asset canônico ou referência Unity mudou. Se houver nova correção, partir desta candidata e preservar V2/baseline; não avançar automaticamente ao Bárbaro. Detalhes em [walk_v3/README.md](./Art/Isometric/Animations/Heroes/Guerreiro/Revisoes/walk_v3/README.md).

**Atualização de 28/10/2026:** iniciada a revisão do Guerreiro. Baseline dos cinco sheets e metadados preservado; primeira candidata da caminhada SE V2 (seis quadros, 9 FPS) preparada somente na prévia, com comparação lado a lado. Build, oito testes Node e auditorias de integridade passaram. Ainda aguarda avaliação visual dos contatos 1/4 e fechamento 6→1; não foi promovida ao jogo nem aprovada como final. Os demais sheets do Guerreiro continuam pendentes de revisão artística. Retomar por [REVISAO_GUERREIRO_2026-10-28.md](./REVISAO_GUERREIRO_2026-10-28.md) e `Guerreiro/Revisoes/walk_v2/README.md`, sem reiniciar a geração ou avançar automaticamente ao Bárbaro.

**Feedback posterior do usuário:** a alternância das pernas está correta e corpo, espada e escudo foram considerados bons; a passada foi reprovada porque parece chute para a frente. Preservar essas partes aceitas e reduzir altura/amplitude da extensão das pernas, revisar flexão de joelho/tornozelo e contato no chão. O usuário pediu integrar autenticação e Farm Helper antes dessa correção. A V2 continua fora do gameplay. Depois da entrega dessas integrações, retomar esse ajuste localizado do Guerreiro, não refazer sua identidade ou avançar ao Bárbaro.

| Ordem | Tarefa | Resultado esperado |
| --- | --- | --- |
| **1 — próxima** | **Corrigir o Guerreiro** | Inspecionar primeiro os sprites reais e a reprodução; revisar caminhada, eixo do tronco, direção dos pés e continuidade. Corrigir incrementalmente e apresentar em movimento antes de promover os assets. |
| 2 | Revisar o Bárbaro | Conferir o pacote existente e corrigir o necessário, incluindo alternância real das pernas, apoio, arma e direção corporal. Não refazer o que já estiver correto. |
| 3 | Completar o Arqueiro | Inventariar o que existe e preparar o pacote básico: idle, caminhada, ataque, dano e morte. Validar arma/projétil e timing com a implementação real. Meta: quatro classes com base visual consistente — Guerreiro, Clériga, Bárbaro e Arqueiro. |
| 4 | Expandir direções | Começar pela Clériga aprovada. Confirmar direções e convenções realmente usadas pelo renderer antes de produzir; validar cada direção em movimento antes de multiplicar para as demais classes. A quantidade de direções ainda não foi definida nesta conversa. |
| 5 | Arte das habilidades | Depois da base das quatro classes, inventariar habilidades efetivamente usadas e produzir seus ícones e/ou efeitos necessários, conforme cada caso. Conferir comportamento, alcance visual, timing e origem do efeito no jogo; não inventar regras de combate na arte. |

Prioridade acordada: quatro classes com animações básicas consistentes antes de ampliar direções e efeitos. Acrescentar frames somente se necessário para a fluidez; contagem maior não comprova animação correta. Não espelhar o corpo inteiro, repetir pose ou deformar imagem para simular a troca de pernas. Manter tronco, cabeça e arma coerentes com o mesmo eixo de deslocamento e verificar o fechamento do ciclo.

Critério de entrega de cada pacote: inventário real → candidata versionada → inspeção de contatos/passagens e loop em velocidade normal e reduzida → avaliação visual do usuário → promoção dos assets aprovados aos destinos pertinentes, com cópias consistentes e referências Unity preservadas. Não promover uma candidata por ter passado somente em testes estruturais.

### Login e divisão com Antigravity

**Conferência social posterior — 28/10/2026:** email obrigatório foi encontrado no handler autoritativo de cadastro, resolvendo a pendência de implementação registrada abaixo. A ativação de Google/Discord/Facebook ainda depende dos pontos em [HANDOFF_AUTH_SOCIAL_CODEX_2026-10-28.md](./HANDOFF_AUTH_SOCIAL_CODEX_2026-10-28.md): bypass `mock_test_token_` sem isolamento no serviço real, ausência de conferência de `aud` Google e ausência de aquisição OAuth de tokens no cliente. Opcode confirmado no código: `0x72`; `0x82` é auto-salvage. Não reativar provedores enviando a credencial Guest nem fabricar tokens. Nenhum código/banco foi alterado nesta conferência; somente documentação. Guest permanece disponível, demais botões mantidos no estado anterior.

**Entrega de progressão e narrativa — 28/10/2026:** Hall da Fama Web conectado às quatro categorias e posição pessoal autoritativa; expansão de mochila com preço verificado, confirmação e resultado do servidor; introdução de seis cenas com pular/rever, falas dos pedestais, balões de monstros e banners do chefe. Detalhes, arquivos e limites em [INTEGRACAO_PROGRESSAO_NARRATIVA_CODEX_2026-10-28.md](./INTEGRACAO_PROGRESSAO_NARRATIVA_CODEX_2026-10-28.md). Build passou; Node 10/10 + 4/4; navegador 36/36 de progressão/narrativa, 33/33 de auth, 15/15 de farm e 16/16 com backend real/SQLite em memória. Nenhuma alteração no banco compartilhado ou nos arquivos de posse do Antigravity. Cinemática usa imagens existentes e voz sintética opcional; arte exclusiva/áudio gravado, NPCs/gacha e UI Unity ficam pendentes. Após esta entrega, retomar o ajuste da passada do Guerreiro descrito acima; não promover V2 sem nova aprovação visual.

**Regra de cadastro atualizada pelo usuário:** email é obrigatório para novas contas locais. A UI removeu o rótulo opcional, exige email válido antes de enviar e desabilita os campos de cadastro no modo login para não bloquear acessos existentes. Os contratos/backend ainda precisam aplicar a mesma exigência autoritativa pelo Antigravity; Codex não editou server/shared/rede nesta correção. As menções históricas abaixo a email opcional não representam a regra atual.

Validação desta correção: `npm.cmd run build` passou; teste isolado de autenticação passou **33/33**, incluindo bloqueio de email vazio/inválido sem envio e campos ocultos desabilitados no login. Atualizados `client/index.html`, `client/src/ui/AuthSelection.ts`, os dois testes de UI/integração relacionados e a documentação. Nenhuma conta foi criada no banco compartilhado. Branch `master`, sem commit.

**Entrega posterior — 28/10/2026:** autenticação e Farm Helper integrados em Web; ver [INTEGRACAO_AUTH_FARM_CODEX_2026-10-28.md](./INTEGRACAO_AUTH_FARM_CODEX_2026-10-28.md). Login/senha e cadastro consomem `onAuthSuccess`/`onAuthError`; Convidado usa credencial aleatória local reutilizável; Google/Apple/Discord continuam desabilitados sem validação real dos provedores. Farm usa preferências confirmadas e venda com confirmação; retirados disparos locais duplicados de poção/venda. Corrigida a ordem de inicialização: FARM_SETTINGS_UPDATE chega antes de LOGIN_SUCCESS e é guardado até confirmar o herói. Build passou, 30 verificações simuladas de auth, 15 de farm, 10 testes Node e 10 verificações com backend real/WebSocket/SQLite em memória passaram. O banco compartilhado não foi alterado; a fixture efêmera encerrou. Esta entrega atualiza os registros históricos abaixo que diziam que os callbacks ainda não estavam conectados. Próxima tarefa visual: reduzir o chute da caminhada do Guerreiro sem mudar as partes aceitas pelo usuário.

- Antigravity permanece responsável por servidor, SQLite, shared e `client/src/network/ClientNetwork.ts`. Codex cuida da apresentação e consome os contratos entregues; verificar posse antes de qualquer ajuste de fronteira. Não tocar em arquivo que o outro agente esteja editando.
- **Decisão mais recente do usuário: priorizar contas novas daqui para frente; recuperação/claim de personagens e contas de teste antigos fica fora do fluxo atual.** Isso não autoriza apagar dados, reiniciar banco ou fazer migração destrutiva. As discussões históricas de CLAIM_LEGACY abaixo não representam uma tarefa pendente prioritária.
- Fluxo pretendido: cadastro ou login disponível → autenticação confirmada da conta → lista dos três slots → seleção explícita de personagem → `S2C_LOGIN_SUCCESS` para entrada no mundo.
- Snapshot de leitura nesta rodada: os métodos `sendAuthLogin`, `sendAuthRegister`, `sendAuthSocial`, `sendAuthClaimLegacy` e callbacks `onAuthSuccess`/`onAuthError` já aparecem em `ClientNetwork.ts`. Isso atualiza o registro anterior de ausência dos métodos, mas não comprova funcionamento ou handoff completo. **Não foram conectados pelo Codex nesta tarefa documental.** Conferir a entrega e os tipos reais antes de integrar.
- Integração do login pode avançar como pacote visual próprio assim que a entrega do Antigravity for conferida, sem misturar essa mudança com produção de sprites. Provedores sociais só serão habilitados com fluxo real disponível e validado; não fabricar tokens ou confirmação de autenticação.

### Como retomar com segurança

1. Usar `E:\MagicForge_Universe`; ler integralmente `AGENTS.md`, este ponto de retomada e os guias aplicáveis, especialmente `GUIA_PROMPTS_ASSETS_IA.md` e `GUIA_MESTRE_PRODUCAO_SPRITE_SHEETS.md` antes de arte.
2. Executar `git status`, conferir branch/worktrees, alterações locais e tarefas do Antigravity. Última branch usada pelo Codex: `master`, worktree original. Existem muitas mudanças não commitadas de múltiplos colaboradores; não atribuí-las todas ao Codex nem descartá-las.
3. Reconfirmar arquivos atribuídos, inspecionar diferenças e anunciar os arquivos previstos. Para sobreposição simultânea, combinar handoff ou worktrees independentes; nunca sobrescrever silenciosamente.
4. **Retomar pela validação em jogo do Arqueiro V1 aprovado e integrado**, conforme o estado mais recente acima. Guerreiro V3, Clériga V4.1 e Bárbaro V3 têm caminhadas aprovadas; não refazê-las. Conferir o estado real atual; não presumir que grades, arquivos ou versões continuam iguais a este registro.
5. Validar conforme o que mudou: testes de animação (`node --test tests/hero-animations.test.mjs` em `client`), TypeScript e build (`npm.cmd run build`) para código Web; validação visual e de grade/alpha/GUIDs para assets; Unity Play Mode quando disponível e pertinente. Não executar testes como substituto do aceite visual nem afirmar testes não realizados.
6. Ao entregar, atualizar este ponto de retomada com versão ativa, aprovação, arquivos alterados, resultados reais, pendências e próxima tarefa. Não fazer commit/merge/push sem autorização específica.

## 1. Escopo e coordenação

O Codex cuida principalmente da apresentação Web e Unity: login, seleção de heróis, renderização, animações e exibição de cartas, gemas e materiais. O Antigravity cuida principalmente do servidor, SQLite, protocolo e regras autoritativas. Essa divisão permite colaboração entre áreas, mediante atribuição explícita dos arquivos necessários.

Antes de cada implementação:

1. Conferir branch, `git status`, worktrees e alterações nos arquivos previstos.
2. Informar objetivo, arquivos a tocar e validação planejada.
3. Confirmar a posse por tarefa de `client/src/main.ts`, `client/index.html` e `client/src/network/ClientNetwork.ts` quando forem necessários. Não editar simultaneamente esses arquivos na mesma pasta, mesmo em seções diferentes.
4. Preservar as alterações existentes e interromper a edição se outro agente estiver trabalhando no mesmo arquivo.
5. Usar worktrees independentes para tarefas simultâneas com risco de conflito. A base deve incluir o trabalho necessário por um procedimento acordado; não criar uma worktree supondo que ela já contém as alterações locais.

Branch sugerida para trabalho isolado: `codex/visual-login-assets`. Nenhuma branch ou worktree é criada por este documento. Não fazer commit, merge, rebase ou push sem autorização para a tarefa.

## 2. Padrão visual e comportamento

- Preservar a identidade existente: fundo `#0a0f1d`, dourado rúnico `#fbbf24`, ametista `#c084fc` e tipografia já adotada. Ajustar contraste e legibilidade antes de ampliar efeitos.
- Reutilizar os assets entregues e os componentes atuais. Criar novos módulos visuais pequenos quando necessário, sem reorganizar a aplicação inteira nem adicionar dependências para mudanças pontuais.
- No login, usar `bg_login_forja_astral.jpg` com sobreposição que preserve a leitura dos controles. Usar pedestais ativo/vazio para representar slots, mantendo as proporções originais das imagens.
- A seleção deve mostrar nome, classe, nível e CP recebidos do servidor. Não inventar personagens, contas, disponibilidade de servidores ou persistência. Se faltar contrato, registrar a dependência e manter a entrada existente funcional.
- Exibir carregamento, erro de conexão, lista vazia e ação em andamento. Prevenir duplo envio e permitir recuperar a interação após falha.
- Garantir navegação por teclado, foco visível, rótulos dos controles e botões de toque com alvo mínimo de 44 px. Não depender apenas de cor ou hover.
- Validar desktop, celular horizontal e telas estreitas, sem sobreposição de botões nem rolagem horizontal involuntária. Respeitar a preferência por movimento reduzido nos efeitos da interface.
- Cartas, gemas e refinamento devem refletir os dados e permissões reais. Uma imagem disponível não significa carta adquirida, bônus aplicado ou refinamento implementado. Ações sem suporte devem indicar indisponibilidade, sem simular sucesso.

## 3. Assets e animação

Consultar [guia de prompts](./GUIA_PROMPTS_ASSETS_IA.md) e [guia de sprite sheets](./GUIA_MESTRE_PRODUCAO_SPRITE_SHEETS.md) antes de tarefas de arte.

- Usar `ui/items/`, `ui/cards/` e `ui/login/` como caminhos preferenciais para novas referências Web de interface; usar `isometric/` para os chefes do mundo. Preservar os aliases e referências existentes, sem mover ou excluir arquivos.
- Verificar dimensões, grade, ordem, transparência e pivô reais antes de consumir uma folha. Não inferir grade apenas pelo nome.
- Manter como referência os timings existentes: idle 5 FPS, walk 9, attack 11, hit 10 e death 7. O guia propõe cast a 9 FPS; o Web atualmente trata o cast do Clérigo como ataque a 11 FPS. Resolver essa divergência em tarefa de animação, com validação, sem alteração silenciosa.
- Idle e caminhada repetem; ataque, cast, dano e morte são ações de execução única. Conferir o reinício e a duração de cada estado ao integrá-lo.
- Caminhada só é aprovada após inspeção quadro a quadro e em movimento, mostrando alternância real das pernas direita e esquerda. Dimensões e hashes não comprovam qualidade da animação.
- Preservar `.meta`, GUIDs, identificadores de fatias e referências serializadas. Não executar o importador em massa sem revisar seus destinos e o efeito sobre os metadados existentes.
- No Unity, reutilizar `IsometricEntityVisual` e `CharacterClassSO`; não introduzir Animator, prefabs ou mudanças de cena sem necessidade e escopo definidos para a tarefa.
- Inspecionar o efeito do chroma key atual sobre PNGs com alfa: pode apagar partes escuras legítimas ou alterar bordas. Validar antes de mudar o tratamento compartilhado das imagens.

## 4. Dependências com o servidor

Antigravity define contratos e regras; Codex adapta a apresentação aos contratos efetivamente disponíveis. Antes de integrar os três slots, combinar mensagens para listar, criar e selecionar personagens, identificação da conta, índices dos slots, campos retornados e respostas de erro. Nomes de opcodes propostos no plano não comprovam que os handlers existem.

Para chefes, alinhar a identificação enviada pelo servidor e o mapeamento do renderer. Preferir um identificador visual estável se for incluído no contrato acordado; até lá, respeitar os campos existentes. Não alterar o servidor nem inventar identificadores no cliente para encobrir uma divergência.

A interface não decide dano, loot, propriedade de itens, custo de refino, bônus de cartas ou progressão. Mudanças no protocolo, banco ou balanceamento são encaminhadas ao responsável. Rede C# fica com o Codex por padrão; qualquer transferência exige delimitar arquivos e tarefa.

## 5. Estado observado e sequência proposta

Este registro descreve inspeções anteriores e deve ser conferido novamente antes da implementação, pois o Antigravity segue trabalhando.

| Pacote | Evidência disponível | Próximo passo visual |
| --- | --- | --- |
| Login e três pedestais | Fundo e pedestais presentes no Web, Unity e Docs | Integrar layout após conferir posse dos arquivos; conectar seleção real quando o contrato estiver disponível |
| Guerreiro, Bárbaro e Clérigo | 15 sheets com dimensões verificadas, cópias iguais entre destinos e arrays Unity configurados | Revisar estados, cast, recortes e alternância real das pernas; não reintegrar o que já funciona |
| Três chefes | PNGs e mapeamento por nomes presentes no renderer | Conferir nomes/identificação atuais do servidor e validar aparição no jogo |
| Pedras, gemas e cartas | 8 ícones e 4 cartas presentes nos destinos | Conectar imagens aos submenus e distinguir catálogo visual de inventário adquirido |
| Unity conectado | Cliente de rede e interpolador existentes; inspeção inicial encontrou recepção de snapshots incompleta | Tratar como pacote próprio, sem declarar paridade com o Web até validar em execução |

Ordem sugerida: primeiro login e pedestais; depois submenus de cartas/gemas; em seguida chefes e revisão de animações; por fim os pacotes de UI e integração Unity correspondentes. Cada pacote deve produzir uma entrega pequena e revisável. Dependências de contrato não impedem a execução de outro pacote visual com arquivos liberados.

## 6. Validação e entrega

Para uma alteração Web, executar no diretório `client`:

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Quando a tarefa incluir validação do empacotamento, executar `npm.cmd run build` e registrar o resultado real. Conferir no navegador os fluxos alterados, ausência de imagens faltantes, proporções, foco, toque e erros de console. Não iniciar o servidor compartilhado nem gerar dados de teste no SQLite de uso dos outros agentes sem coordenação.

Para Unity, conferir importação e referências no Editor, estados visuais em Play Mode e logs. Informar explicitamente quando essas verificações não forem executadas. Não apresentar checagem TypeScript como validação Unity.

Classificar cada pacote como **disponível em disco**, **referenciado no código** ou **validado em execução**, conforme a evidência. Finalizar com arquivos alterados, comandos e resultados, pendências, limitações e branch/worktree. O roadmap é atualizado pelo responsável combinado, sem promover automaticamente uma proposta ou asset instalado a funcionalidade concluída.

## 7. Primeira entrega visual — 27/10/2026

O layout Web da Sala dos Forjados usa o fundo entregue e os três pedestais vazios, com formulário da entrada existente por nome/classe e prévia de retrato. Implementação em `client/index.html`, `client/src/main.ts`, `client/src/ui/AuthSelection.ts` e `client/src/ui/auth-selection.css`. Os slots permanecem em estado de espera até a entrega e integração do contrato de conta. Não há criação simulada de heróis nem CP fixo nos pedestais.

A conexão passa a iniciar por ação explícita; a confirmação de login fecha a tela. Há validação de nome obrigatório, prevenção de duplo envio, mensagem de desconexão e prazo de espera. O painel de rede existente continua acessível. O layout foi inspecionado no navegador em 1280×900, 390×844 e 844×390, sem rolagem horizontal no contêiner de login; retratos e pedestais carregaram. A entrada legada também foi observada chegando ao jogo com personagem existente. Timeout e desconexão não foram simulados nesta entrega.

Próxima integração: após o hand-off do Antigravity, consumir a lista autoritativa e substituir os estados de espera por heróis ou slots vazios confirmados, usando o pedestal ativo para heróis existentes. `ClientNetwork.ts`, servidor, contratos, assets e Unity não foram editados nesta entrega. A validação funcional dos três slots ainda está pendente.

## 8. Histórico: integração Web dos três slots — 27/10/2026

Após liberação explícita do usuário, Codex conectou a identificação da conta, a lista autoritativa dos pedestais, criação em slot vazio e seleção de personagem. Arquivos: `client/index.html`, `client/src/main.ts`, `client/src/ui/AuthSelection.ts` e `client/src/ui/auth-selection.css`. Transporte consumido: `sendRequestCharacterList`, `sendCreateCharacterSlot`, `sendSelectCharacterSlot`, `onCharacterList` e `onCharacterActionError`. Não houve edição de `ClientNetwork.ts`, servidor, shared, Unity ou SQLite por Codex nesta tarefa.

O nome da conta é normalizado para minúsculas, conforme `DatabaseManager`. A lista deve conter os índices 0, 1 e 2; respostas incompletas ou de outra conta não habilitam slots. Ocupados mostram retrato, classe, nível, CP, ouro e vida; vazios abrem nome/classe para criar. Os retratos usam os assets existentes, sem inventar aparência de equipamento. Criação aguarda lista atualizada e não entra automaticamente no mundo; seleção aguarda `S2C_LOGIN_SUCCESS`. Envios duplicados são bloqueados. Timeout exige nova lista antes de outra ação; reconexão relista e solicita nova seleção em vez de repetir criação ou entrada. Erros preservam o formulário quando possível. O painel legado de rede continua separado por ação explícita.

Correções pequenas em `main.ts`, combinadas com o usuário para liberar o build: cartas usam destinos numéricos 0 (arma) e 1 (armadura), como confirmado em `DatabaseManager.setEquippedCard`; refino consome `newRefineLevel` do contrato atual. A correção do import de rede ficou com Antigravity; a checagem TypeScript e `npm.cmd run build` passaram na cópia compartilhada.

Teste isolado em `client/tests/auth-selection.html` e `auth-selection.browser.ts`: usa o HTML/controller reais e transporte simulado, sem WebSocket ou persistência. Não é incluído entre as entradas do build de produção. A validação contra o servidor compartilhado e sua persistência continua sendo uma etapa distinta; não iniciar servidor nem criar contas/personagens de teste no banco compartilhado sem coordenação.

Resultados reais: **18/18 verificações no navegador passaram**, incluindo normalização da conta, resposta fora de ordem, conta divergente, lista incompleta, nome inválido, criação com duplo clique, erro de nome, atualização confirmada sem login automático, nome tratado como texto, seleção aguardando login, desconexão, reconexão, cancelamento com foco restaurado, timeout real de 12 segundos e recuperação. Console do teste sem erros/avisos. Conferidos visualmente o estado inicial na página real e os pedestais preenchidos no teste isolado. A tentativa de ajustar viewport não alterou o tamanho observado da aba de teste; não se considera validado um novo cenário mobile nesta rodada. `node --test tests/hero-animations.test.mjs`: 8/8; `tsc --noEmit --incremental false`: passou; `npm.cmd run build`: passou (20 módulos). `git diff --check` dos arquivos grandes continua apontando whitespace preexistente em `index.html` e fim de `main.ts`, preservado para evitar limpeza fora do escopo. Branch `master`, worktree original, nenhum commit/merge/push.

## 9. Fluxo corrigido: login antes da Sala dos Forjados

O usuário esclareceu que a entrada exige conta e senha; somente depois deve abrir a Sala dos Forjados. O fluxo da seção 8 identificava conta por nome e não autenticava senha. Inspeção de `server/src`, `shared/src` e `ClientNetwork.ts` não encontrou senha, cadastro ou validação de credenciais. `C2S_LOGIN` cria/carrega personagem pelo nome; não é autenticação de conta. Solicitar a lista atualmente associa uma conta pelo username, portanto esconder a tela no cliente não protege o backend.

Codex separou a apresentação em três estados: login com conta/senha; Sala dos Forjados; criação no pedestal escolhido. A primeira tela esconde os pedestais e o acesso ao painel legado. O formulário da conta desaparece da sala; criação aparece apenas ao escolher um vazio. Há ação de trocar conta e atualizar lista. Após desconexão a UI exige nova autenticação. O login real fica desabilitado enquanto o transporte não fornecer autenticação; não aceita senha arbitrária nem usa o pedido de lista como confirmação de senha.

Preparação local: `AuthTransport.authenticate?` e os métodos de UI `onAccountAuthenticated(username)` / `onAuthenticationError(message)` são pontos de adaptação para um futuro contrato, não opcodes oficiais já entregues. `main.ts` não fornece `authenticate` nesta etapa, pois nenhum método real existe em `ClientNetwork.ts`. A senha não é armazenada em localStorage, logs ou banco pelo cliente; é apagada do campo e mantida apenas até o envio pendente da conexão, depois descartada. Senhas de teste são fictícias, utilizadas somente pelo transporte simulado.

Handoff necessário ao Antigravity, preservando sua posse de server/shared/rede:

1. Implementar autenticação real de conta/senha e entregar respostas distintas de sucesso/falha da autenticação e de entrada de personagem no mundo.
2. Definir cadastro/ativação de contas existentes e persistência segura das credenciais, preservando personagens, itens e progresso. Não há autorização do Codex para migrar o banco ou definir senhas para usuários.
3. Vincular sessão autenticada à conexão; listar, criar e selecionar devem usar essa sessão e rejeitar acesso antes dela. Resolver o caminho legado de `C2S_LOGIN` para que ele não permita contornar autenticação.
4. Entregar métodos/callbacks tipados em `ClientNetwork.ts`, erros de credenciais e sessão expirada, e comportamento de desconexão/logout. Informar o contrato para Codex conectar o adaptador visual.

Arquivos desta correção: `client/index.html`, `client/src/main.ts`, `client/src/ui/AuthSelection.ts`, `client/src/ui/auth-selection.css`, `client/tests/auth-selection.browser.ts` e este documento. Backend, protocolo e banco não foram alterados pelo Codex. `npm.cmd run build` passou após a alteração. Branch `master`, worktree original, sem commit.

Validação atual: **22/22 cenários do teste isolado passaram**, acrescentando bloqueio da sala antes de autenticar, senha incorreta, limpeza do campo, confirmação de autenticação distinta de login no mundo e reautenticação após reconectar. Testado manualmente o botão Trocar conta: escondeu a sala, desconectou o transporte simulado e retornou ao formulário. Console sem erros/avisos. Inspecionada a página real: apenas conta/senha, pedestais ocultos e login indisponível pela ausência do backend de autenticação. Não houve envio de senha real nem gravação no banco.

## 10. Handoff proposto pelo Antigravity: credenciais e provedores sociais

O usuário repassou a proposta do Antigravity: backend SQLite, shared e `ClientNetwork.ts` permanecem com ele; interface com Codex. Prever conta/senha, cadastro e provedores GOOGLE, APPLE, DISCORD e GUEST. Foram incluídos no layout quatro botões sociais desabilitados; eles desaparecem após autenticar. Não há tokens fabricados nem envio de email/displayName como prova de identidade. A seção é apenas preparação visual até cada fluxo real estar disponível.

Contratos PROPOSTOS, ainda ausentes na inspeção desta rodada:

- Login: `{ username: string; password?: string }`, via `sendAuthLogin`.
- Cadastro: `{ username: string; password?: string; email?: string }`, via contrato a entregar.
- Social: `{ provider: 'GOOGLE' | 'APPLE' | 'DISCORD' | 'GUEST'; token?: string; email?: string; displayName?: string }`, via `sendAuthSocial`.
- Sucesso: `{ accountId; accountUsername; provider; isActivated; message? }`, via `onAuthSuccess`.
- Erro: `{ errorCode; errorMessage }`, via `onAuthError`, com INVALID_CREDENTIALS, USER_NOT_FOUND, USER_EXISTS, INVALID_PASSWORD, UNAUTHENTICATED e SOCIAL_AUTH_FAILED.

Após o contrato oficial: `transport.authenticate` adapta `sendAuthLogin`; preparar `transport.authenticateSocial` junto do fluxo real que obtém a credencial do provedor. `onAuthSuccess` só libera a Sala dos Forjados quando a ativação exigida estiver confirmada e dispara pedido de lista da sessão; `onAuthError` mantém o login. `S2C_LOGIN_SUCCESS` continua reservado à entrada do personagem após seleção do pedestal. A proposta sem username no pedido de lista exige atualização do método atual, que ainda recebe username; consumir o contrato efetivamente entregue em shared. Não reutilizar o sucesso de autenticação como sucesso de entrada no mundo.

Pendências obrigatórias de alinhamento antes de ligar o transporte:

1. **Colisão de opcodes:** a proposta usa AUTH_LOGIN 0x50, AUTH_REGISTER 0x51, AUTH_SOCIAL 0x52 e AUTH_SUCCESS 0x53, mas os quatro valores já pertencem a EXP_UPDATE, LEVEL_UP, PERFORM_REBORN e REBORN_RESULT. AUTH_ERROR foi proposto como 0x54. Antigravity precisa escolher uma faixa livre e verificar unicidade; Codex não altera shared/rede durante a posse dele.
2. **Posse das contas legadas:** registrar a primeira senha enviada para um username existente permitiria assumir personagens de outra pessoa. O procedimento de ativação deve comprovar posse e preservar os slots/progresso. Esse procedimento ainda precisa de definição pelo responsável; o frontend não o implementa implicitamente.
3. **Provedores reais:** entregar configuração/validação das credenciais e comportamento de cancelamento/erro. Somente provedores disponíveis devem habilitar seus botões. Google/Apple/Discord não podem ser simulados com token fixo ou apenas email/displayName. Guest precisa de identidade e regras de recuperação/persistência definidas no backend.
4. **Cadastro e sessão:** confirmar entrega de cadastro, ativação, logout/expiração e bloqueio dos handlers antes de autenticar, incluindo o caminho legado. A UI de cadastro será conectada quando existir resposta oficial, sem criar conta implicitamente durante login.

Nesta rodada, alterações limitadas ao HTML/CSS visual, ao estado da seção social em `AuthSelection.ts` e a este plano. A integração dos provedores e callbacks de rede aguarda o handoff real do Antigravity.

Validação: `npm.cmd run build` passou; teste isolado atualizado passou **24/24**, incluindo quatro botões sociais indisponíveis e ocultação da seção após autenticação simulada; testes Node de animação passaram 8/8. Atualizado também `client/tests/auth-selection.browser.ts`. Nenhuma autenticação social real foi executada. Branch `master`, worktree original, sem commit.

### Revisão da proposta recebida: faixa 0x70–0x75 e contas legadas

O usuário repassou a revisão do Antigravity: AUTH_LOGIN 0x70, AUTH_REGISTER 0x71, AUTH_SOCIAL 0x72, AUTH_CLAIM_LEGACY 0x73, AUTH_SUCCESS 0x74 e AUTH_ERROR 0x75. Essa proposta deixa a faixa de progressão 0x50–0x53 preservada. O novo AUTH_SUCCESS não contém `isActivated`; o adaptador deverá seguir os tipos efetivamente entregues, sem continuar esperando o campo anterior. Métodos previstos: `sendAuthLogin`, `sendAuthRegister`, `sendAuthSocial`, `sendAuthClaimLegacy`, `onAuthSuccess` e `onAuthError`.

A proposta de claim usa `{ username; verifyHeroName; verifyHeroClass; newPassword; adminKey? }` e erros LEGACY_ACCOUNT_UNCLAIMED / LEGACY_CLAIM_FAILED. **Nome e classe de herói não comprovam posse**, pois podem ser conhecidos por terceiros no jogo. Essa checagem não deve, sozinha, autorizar a primeira senha de uma conta com personagens existentes. A recuperação continua pendente de comprovação privada: por exemplo, código individual entregue ao dono por canal verificado, ou ativação assistida pelo administrador. O responsável deve definir emissão, validade e validação dessa prova e preservação do progresso. Não coletar uma chave administrativa compartilhada em formulário público nem embuti-la no cliente.

Na UI, LEGACY_ACCOUNT_UNCLAIMED deverá encaminhar a recuperação quando houver contrato válido para comprovar posse; não abrir automaticamente um formulário que prometa recuperar com nome/classe apenas. AUTH_SUCCESS permanece separado de S2C_LOGIN_SUCCESS, e nenhum botão social é habilitado até a respectiva integração real. Até o handoff verificável de código e callbacks, a preparação visual existente permanece desabilitada.

## Validação conectada do Guerreiro — 2026-10-28

Codex verificou o cliente real via WebSocket e servidor real com SQLite em memória: autenticação Guest, seleção, skills nos níveis preparados 1/10/25/50, rejeição sem custo, derrota/revanche, portal e reconexão. Testes: cliente 28/28, servidor 6/6, build do cliente passou. Corrigido eco duplicado de rejeição no chat.

**Bloqueador aberto para Antigravity:** Grimgor respawna após vitória e concede recompensas repetidas; permanece após portal ao Mundo 2. Não considerar a Fase 1 concluída. Corrigir ciclo de vida/recompensa única/limpeza de entidades no servidor e repetir esse fluxo. Nenhum arquivo do servidor foi editado pelo Codex nesta validação.

Relatório, reprodução, arquivos e limites: `Docs/VALIDACAO_TECNICA_GUERREIRO_2026-10-28.md`. Evidências: `Docs/QA_GUERREIRO_LIVE_2026-10-28.jsonl`. Níveis e cenários preparados não certificam balanceamento nem progressão natural.

### Reteste conectado do boss — correção confirmada

Após o handoff do Antigravity, Codex repetiu desafio real de Grimgor no cliente principal com servidor/SQLite em memória: um evento de vitória, zero monstros, ouro e inventário estáveis por 32 segundos. Portal levou ao Mundo 2, contendo somente IDs mob_w2_* e nenhum Grimgor. Teste servidor 7/7 passou aqui. Bloqueador anterior de respawn/recompensa repetida encerrado no cenário reproduzido. Relatório atualizado em Docs/VALIDACAO_TECNICA_GUERREIRO_2026-10-28.md; evidência nova em Docs/QA_GUERREIRO_BOSS_RETEST_2026-10-28.jsonl. Sem mudança de código de produto nesta rodada. Arte de bioma do Mundo 2 ainda pendente (cenário reutiliza floresta); demais limites de validação permanecem no relatório.
