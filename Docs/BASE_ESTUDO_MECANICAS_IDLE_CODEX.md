# Base de estudo de mecânicas e economia idle — Codex

Data: 03/11/2026. Responsável por esta análise: Codex, a pedido do usuário.
Estado: benchmark recebido e revisado em `REVISAO_BENCHMARK_TOPIDLE_CODEX_2026-11-03.md`; primeira implementação registrada em `ENTREGA_PROGRESSO_OFFLINE_CODEX_2026-11-03.md`.

## 1. Objetivo e coordenação

Transformar referências de idle RPG em especificações verificáveis para o MagicForge: recursos, escolhas, curvas de evolução, receitas e ciclos de desafio. O objetivo é entender quais regras servem ao projeto e demonstrar seus efeitos antes de implementar.

Este documento complementa `ROADMAP_MECANICAS_IDLE_RPG.md`; não altera sua ordem nem declara funcionalidades novas como aprovadas. Nenhum balanceamento ou código de gameplay foi modificado nesta etapa.

Escopo de edição desta preparação: somente este arquivo. O handoff do Baú do Tempo já estava modificado no diretório compartilhado e foi preservado. Antes de qualquer implementação, conferir novamente status, arquivos em edição e responsáveis. Alterações simultâneas nos mesmos arquivos exigem interromper e resolver a posse; implementação paralela com risco de conflito exige worktrees distintos.

## 2. O que podemos preparar antes da extração

- Inventário das regras atuais e suas fontes no código.
- Vocabulário e formato comum para receber dados externos.
- Métricas de comparação e condições de experimentos.
- Perguntas sobre interações entre sistemas já existentes ou previstos.
- Critérios para converter uma observação em proposta de implementação.

Dependem dos dados externos: escolher fórmulas de referência, estimar curvas do jogo estudado, decidir quais padrões adaptar e propor parâmetros finais. A referência principal ainda não foi escolhida. IdleOn e Melvor foram sugeridos como candidatos, não como decisões fechadas.

## 3. Regras de evidência

| Classificação | Significado | Evidência mínima |
| --- | --- | --- |
| Verificado no MagicForge | Regra encontrada no código atual | Arquivo e símbolo; registrar revisão do repositório ao fazer o estudo completo |
| Observado na referência | Comportamento visto durante uma sessão | Jogo, versão, plataforma, estado da conta, data e captura ou registro |
| Extraído | Dado encontrado com REA ou outra análise autorizada | Artefato, ferramenta/versão, localização e trecho relevante sem segredos |
| Inferido | Modelo que explica uma amostra | Amostra, fórmula candidata, erro e alternativas ainda possíveis |
| Proposto | Escolha de design para o MagicForge | Problema, comportamento esperado, impacto e forma de validar |
| Desconhecido | Informação ausente ou inconclusiva | Pergunta e próximo passo para obter evidência |

Encontrar uma constante no cliente não demonstra que ela controla a economia do servidor ou está ativa na versão atual. Um ajuste que reproduz poucos pontos também não prova a fórmula original. Guardar observação e interpretação separadamente.

O sucesso comercial de uma referência não demonstra que uma mecânica isolada causou esse sucesso. Valores de documentos anteriores como multiplicadores “típicos” do mercado serão tratados como hipóteses até haver fontes ou amostras verificáveis.

## 4. Diagnóstico inicial do MagicForge (histórico anterior à implementação)

Leitura estática feita em `master`, no diretório `E:\MagicForge_Universe`. Não equivale a validação em runtime nem confirma os resultados de testes registrados em roadmaps anteriores.

| Área | Regra verificada nesta preparação | Fonte |
| --- | --- | --- |
| Offline | Limiar de 300 segundos; tempo efetivo limitado a 43.200 segundos | `server/src/game/World.ts`, `checkAndNotifyOfflineRewards` |
| Ouro offline | `mundo * 15 + fase * 5 + nível * 3` por segundo | Mesmo método |
| EXP offline | `mundo * 10 + fase * 4 + nível * 2` por segundo | Mesmo método |
| Materiais offline | `intervalos = min(10, floor(tempoEfetivo / 900))`; ferro = `intervalos * 2`; poções = `max(1, floor(intervalos * 1.5))`, quando há intervalos | Mesmo método |
| Reborn | Bônus de +10 por atributo por Reborn, +500 no cálculo de HP por Reborn e fator de dano `1 + rebornCount * 0.15` | `server/src/entities/Player.ts`, `recalculateStatsFromEquipment` e cálculo de dano |
| Refino | Multiplicador `1 + refineLevel * 0.08` aplicado no cálculo dos atributos de equipamento | `server/src/entities/Player.ts`, `recalculateStatsFromEquipment` |
| Party | Limite de quatro membros | `server/src/game/PartyManager.ts`, `Party.maxMembers` |

Exemplo aritmético da regra offline, mantendo mundo 1, fase 5 e nível 10 no cálculo da recompensa:

| Ausência | Ouro | EXP | Ferro | Poções |
| --- | ---: | ---: | ---: | ---: |
| 1 hora | 252.000 | 180.000 | 8 | 6 |
| 2h30 | 630.000 | 450.000 | 20 | 15 |
| 12 horas | 3.024.000 | 2.160.000 | 20 | 15 |

Os materiais saturavam após 2h30; ouro e EXP continuavam até 12 horas. A primeira implementação mudou o teto gratuito para 8h e preservou a curva dos materiais. A tabela acima é histórica; sua aritmética de EXP foi corrigida para 50 EXP/s. Os números são da geração da recompensa; não modelam resgate, inventário cheio ou evolução posterior por EXP.

Outros pontos de investigação:

- A fórmula offline não usa diretamente dano, equipamentos, cooldowns ou sobrevivência. Medir o rendimento online antes de escolher uma relação desejada entre os dois modos.
- O roadmap prevê fusão de itens enquanto já existe automação de descarte/venda. Mapear exatamente quais itens cada operação consome e produz antes de definir receitas.
- Autoequipar por CP pode trocar utilidade de build por um valor agregado maior. Comparar resultados de combate, não apenas o número de CP.
- Evolução de skills precisa preservar diferenças entre farm, chefe e sustentação. Aumentar todos os multiplicadores não demonstra, sozinho, que haverá escolhas interessantes.
- Somar bônus de Reborn, refino, cartas e gemas pode mudar a dificuldade de forma diferente para cada classe. A interação completa ainda não foi calculada.

## 5. Formato para receber a extração do colaborador

O documento pode chegar no formato que já estiver pronto. Estes campos orientam a leitura; não exigem refazer o trabalho.

### Identificação

- Jogo, versão/build, plataforma e data da análise.
- Escopo analisado: cliente, dados locais, comportamento observado ou outro artefato autorizado.
- Ferramentas e versões; limitações, dados incompletos e trechos possivelmente desativados.
- Estado da conta/sessão quando relevante: nível, fase, equipamentos, bônus, compras e eventos ativos.

### Uma ficha por mecânica

| Campo | Conteúdo esperado |
| --- | --- |
| Identificador | Nome estável para referenciar a descoberta |
| Problema resolvido | O que permite ao jogador fazer ou decidir |
| Entrada | Recursos, quantidade, pré-requisitos e estado anterior |
| Transformação | Fórmula, tabela ou sequência observada |
| Saída | Recompensa, estado posterior, permanência e limites |
| Cadência | Por ação, segundo, sessão, dia ou outro intervalo |
| Exceções | Falha, arredondamento, teto, reset, garantia e inventário cheio |
| Evidência | Localização do dado ou registro de sessão |
| Classificação | Observado, extraído, inferido ou desconhecido |
| Limitação | O que ainda não foi demonstrado |

Priorizar dados de custos e ganhos consecutivos, evolução de HP/recompensas por fase, tabelas de drops, receitas, regras offline e condições de desbloqueio. Para uma curva candidata, obter pontos em trechos diferentes e reservar parte deles para conferir a previsão; não ajustar e validar somente nos mesmos pontos.

Não incluir credenciais, tokens, dados pessoais de terceiros, assets copiados ou código proprietário destinado a ser incorporado ao MagicForge. O insumo desejado é a descrição das regras e sua evidência.

## 6. Experimentos e métricas

Usar personagens/estados de teste reproduzíveis, sem tocar no banco de produção. Registrar classe, fase, loadout, recursos iniciais, duração, mortes, deslocamento, consumíveis e modo solo/grupo. Comparações precisam controlar bônus de evento e compras.

| Métrica | Cálculo ou registro | Decisão que ajuda a tomar |
| --- | --- | --- |
| Rendimento líquido | Recursos recebidos menos consumidos, por minuto | Onde vale farmar e quanto custa sobreviver |
| Tempo para upgrade | Custo restante dividido pelo ganho líquido, quando positivo e estável | Cadência de compras |
| Ganho marginal | Diferença de desempenho antes/depois do upgrade | Se o investimento faz diferença perceptível |
| Tempo até chefe | Tempo acumulado para obter a build que supera o desafio | Duração da parede de progressão |
| Consistência de build | Vitórias, duração e consumíveis em tentativas repetidas | Se a escolha funciona além de um resultado favorável |
| Relação offline/online | Ganho por hora em estados comparáveis | Papel desejado de cada modo |
| Retorno de Reborn | Tempo para recuperar o marco anterior e ganho posterior | Se o reinício recompensa o esforço |
| Utilidade do loot | Destino por item: equipar, guardar, fundir, vender ou outro | Se há escolhas ou apenas limpeza de inventário |

Quando houver várias moedas, tempo para upgrade depende de todos os gargalos e da possibilidade de produzi-las simultaneamente. Probabilidades exigem tamanho de amostra e incerteza; não tratar frequência de uma sessão curta como taxa exata de drop.

## 7. Sequência de trabalho após receber os dados

1. Catalogar evidências e lacunas da extração; confirmar jogo e versão.
2. Completar o inventário do MagicForge: fontes e destinos de recursos, custos, loot, evolução de fases e fórmulas de combate. Revalidar o código após o trabalho do Antigravity.
3. Reconstruir o ciclo de uma referência e conferir suas previsões contra dados reservados.
4. Propor um ciclo limitado do MagicForge: farm, melhoria, desafio e recompensa. Definir hipóteses de duração e escolhas para validação, sem apresentá-las como padrões universais.
5. Simular cenários antes da implementação: classes, builds, ausência curta/longa, solo/grupo e diferentes gargalos. Metas de duração serão propostas explicitamente.
6. Entregar especificação incremental com tabelas de parâmetros, contratos preservados, arquivos afetados e critérios de aceitação. Mudanças grandes seguem a aprovação exigida por `AGENTS.md`.
7. Implementar o escopo autorizado e executar verificações adequadas, separando testes de correção de avaliação de diversão e retenção.

Critério para avançar: conseguir explicar o que o jogador escolhe, o custo em tempo/recursos, o efeito esperado e como medir se funcionou. Uma lista de funcionalidades ou números de outro jogo não satisfaz esse critério.

## 8. Pendências e validação desta entrega

- Recebido: `BENCHMARK_TOPIDLE_MECANICAS.md`, JSONs e capturas. A revisão separada registra as lacunas de evidência e de versão dos jogos.
- Pendente: medidas do combate online do MagicForge, inventário completo da economia e metas de ritmo definidas com o usuário.
- REA: instalação local não é necessária para esta preparação; avaliar necessidade depois de ler a extração e identificar perguntas técnicas ainda abertas.
- Verificação desta entrega: leitura estática e conferência aritmética do exemplo offline. Builds e testes de gameplay não são necessários para a criação deste documento e não foram executados nesta etapa.
- Risco de integração: o diagnóstico pode envelhecer enquanto outros colaboradores alteram o código; conferir as fontes antes de implementar. O roadmap existente continua sendo o registro de implementação.
