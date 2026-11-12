# Farm → melhoria → chefe: três classes — 11/11/2026

Medição da versão integrada em `2e215f0`: Guerreiro, Bárbaro e Arqueiro. Foram executadas **1.422 lutas com escolhas de habilidades**, **168 cenários pareados de investimento**, **36 perfis de farm de 5 minutos** e **36 sessões de progressão de 30 minutos**. Todos usam SQLite em memória e automação real a 20 Hz.

## Resultado e decisão

O primeiro ajuste de combate deve ser investigado no **Bárbaro contra Ignis no Mundo 3**, separando escolhas ofensivas de escolhas defensivas. Os 41 timeouts no nível 25 se concentram nesse mundo; no Mundo 2 são 54 vitórias em 54 cenários. Não há evidência para reduzir a dificuldade de todos os chefes.

O ciclo de melhorias já muda resultados: no confronto pareado de Guerreiro nível 10/Mundo 2/semente 101, evolução de habilidade ou refino convertem timeout em vitória. No Bárbaro nível 10/Mundo 2/semente 101, evolução do truque ou Mordida com evolução convertem morte em vitória.

A sustentação tem custo ofensivo: trocar para Pele Rochosa e priorizá-la no nível 25/Mundo 3 converte duas vitórias da build padrão em timeout. Isso exige avaliação de build, consumo e oportunidade de conjuração antes de aumentar dano ou cura globalmente.

Nenhum custo, fórmula, cooldown, drop, limite offline, layout ou asset de produção foi alterado neste bloco. As alterações são ferramentas, correção de medição e testes.

## Matriz de habilidades

Cada nível acima de 1 combina dois mundos e duas sementes. Há 3 escolhas no nível 1, 9 no 10, 27 no 25 e 81 no 50. Os personagens recebem nível, arma inicial, ouro e materiais de fixture; estes resultados não medem o tempo real de alcançar esses níveis.

| Classe | Nível | Casos | Vitórias | Mortes | Timeouts |
|---|---:|---:|---:|---:|---:|
| Guerreiro | 1 | 6 | 0 | 6 | 0 |
| Guerreiro | 10 | 36 | 32 | 3 | 1 |
| Guerreiro | 25 | 108 | 100 | 0 | 8 |
| Guerreiro | 50 | 324 | 324 | 0 | 0 |
| Bárbaro | 1 | 6 | 0 | 6 | 0 |
| Bárbaro | 10 | 36 | 19 | 6 | 11 |
| Bárbaro | 25 | 108 | 64 | 3 | 41 |
| Bárbaro | 50 | 324 | 288 | 0 | 36 |
| Arqueiro | 1 | 6 | 3 | 3 | 0 |
| Arqueiro | 10 | 36 | 36 | 0 | 0 |
| Arqueiro | 25 | 108 | 108 | 0 | 0 |
| Arqueiro | 50 | 324 | 324 | 0 | 0 |

Foram observadas zero rejeições e zero conjurações vazias nessas lutas. Isso verifica execução, não prova equilíbrio entre classes. No nível 25/Mundo 3 do Bárbaro, as 18 combinações com Rugido no slot 2 terminam sem vitória nesta amostra; Fúria vence 9/18 e Carga 1/18. São marginais que variam os outros slots, não efeito causal isolado do slot 2.

## Farm a partir dos marcos de nível

Cada perfil dura 300s, sem compras, venda, reciclagem ou expansão, com equipamento inicial. Mundos iniciais: 1 nos níveis 1/10, 2 no 25 e 3 no 50. XP, fases e portais continuam ativos; taxas são médias de sessões que podem mudar de mundo/nível. O perfil que começa no nível 1 termina aproximadamente no 5–6 e não é uma taxa congelada de nível 1.

Valores abaixo são medianas de três sementes (101/202/303), não intervalos de confiança.

| Classe | Nível inicial | Nível final mediano | Ouro/min | Pó/min | Segundos com mochila cheia |
|---|---:|---:|---:|---:|---:|
| Guerreiro | 1 | 5 | 567,6 | 29,6 | 75 |
| Guerreiro | 10 | 10 | 636,4 | 33,8 | 101 |
| Guerreiro | 25 | 25 | 556 | 29,4 | 171 |
| Guerreiro | 50 | 50 | 534,4 | 32 | 78 |
| Bárbaro | 1 | 5 | 517,6 | 22,2 | 65 |
| Bárbaro | 10 | 10 | 680,4 | 36 | 113 |
| Bárbaro | 25 | 25 | 631,2 | 34,8 | 149 |
| Bárbaro | 50 | 50 | 513,6 | 29 | 105 |
| Arqueiro | 1 | 6 | 804,2 | 41,2 | 141 |
| Arqueiro | 10 | 10 | 830,4 | 42 | 177 |
| Arqueiro | 25 | 25 | 771,4 | 47 | 124 |
| Arqueiro | 50 | 50 | 647,4 | 37,2 | 169 |

A mochila cheia é condição de cenário: expansão e venda existem no jogo, mas não são acionadas nesses perfis. Não interpretar menor coleta de material como falha de expansão nem como rendimento livre de restrições. A comparação seguinte também mantém a mochila inicial para deixar explícito esse efeito.

## Progressão natural de 30 minutos

Cada personagem começa no nível 1 com o kit normal (incluindo 50 de ouro). As políticas usam somente saldo e drops realmente obtidos; não recebem orçamento de fixture. Equipamento usa o botão de pontuação por classe aprovado pelo usuário e refina a arma até +2. Habilidade compra ranks do slot 1; fusão reserva materiais para a primeira arma compatível. São decisões simuladas a cada segundo, não compras automáticas novas no jogo.

| Classe | Política | Nível final mediano | Chefes vencidos | Mortes | Ouro gasto | Primeira compra (s) | Mochila cheia (s) |
|---|---|---:|---:|---:|---:|---:|---:|
| Guerreiro | Guardar | 9 | 2 | 10 | 0 | não observado | 1.575 |
| Guerreiro | Habilidade | 9 | 2 | 10 | 8.350 | 30,05 | 1.579 |
| Guerreiro | Equipar + refinar | 9 | 2 | 10 | 1.000 | 51,05 | 1.590 |
| Guerreiro | Fusão | 9 | 2 | 9 | 1.800 | 232,05 | 1.564 |
| Bárbaro | Guardar | 9 | 2 | 9 | 0 | não observado | 1.548 |
| Bárbaro | Habilidade | 9 | 2 | 10 | 8.350 | 44,05 | 1.571 |
| Bárbaro | Equipar + refinar | 9 | 2 | 8 | 1.000 | 70,05 | 1.573 |
| Bárbaro | Fusão | 9 | 2 | 9 | 1.800 | 238,05 | 1.534 |
| Arqueiro | Guardar | 9 | 2 | 3 | 0 | não observado | 1.641 |
| Arqueiro | Habilidade | 9 | 2 | 3 | 12.400 | 29,05 | 1.655 |
| Arqueiro | Equipar + refinar | 9 | 2 | 2 | 1.000 | 40,05 | 1.655 |
| Arqueiro | Fusão | 9 | 2 | 3 | 1.800 | 160,05 | 1.641 |

Nos cenários sem compras, o primeiro rank de habilidade se torna financiável nos seguintes tempos (saldo disponível simultaneamente para ouro e pó; inclui o kit inicial):

| Classe | Sementes com marco observado | Tempo mediano (s) |
|---|---:|---:|
| Guerreiro | 3/3 | 29,2 |
| Bárbaro | 3/3 | 43,95 |
| Arqueiro | 3/3 | 28,55 |

## Comparação controlada de investimento

O orçamento de chefe é 2.000 ouro, 20 pó e 3 pedras fornecidos igualmente a cada alternativa. A evolução do truque gasta 1.380 ouro/3 pó nesta amostra e o refino usa 1.500 ouro/3 pedras; não são investimentos de custo idêntico. O RNG é reiniciado antes de cada combate, mas escolhas mudam seu consumo posterior. Comparar as linhas exatas de classe/nível/mundo/semente, não medianas de mundos diferentes.

O benchmark antigo selecionava sustentação apenas por `isHeal`. A ferramenta agora reconhece Mordida Voraz como alternativa do Bárbaro quando não há cura pura desbloqueada. No nível 25 continua selecionando Pele Rochosa. O Arqueiro não recebe cura fictícia; a alternativa permanece explicitamente indisponível. Build e ordem reais passam a constar nos resultados de chefe.

## Próximo bloco recomendado

1. Reproduzir Bárbaro nível 25/Ignis com uma base comum, alternando só Fúria/Rugido/Carga e depois Banho/Pele/Salto. Instrumentar tempo sem energia e uso por habilidade; dano total sozinho não identifica o gargalo.
2. Comparar o farm com uma política realista de expansão e gestão de duplicatas. Evitar vender todos os ingredientes numa comparação de fusão.
3. Ajustar um parâmetro de cada vez e repetir os pares que falham, preservando a ordem configurada dos quatro slots. Definir metas de tempo para cada chefe antes de promover números.

As três classes têm seus efeitos implementados, mas este relatório não as declara balanceadas. RNG de crítico/esquiva e equipamento inicial continuam sendo hipóteses relevantes; os resultados não incluem multiplayer, premium, novas artes ou Unity.

## Reprodução e validação

Na pasta `server`:

```powershell
node --import tsx tools/benchmark-core-classes.ts choices ../scratch/core-classes/choices-2026-11-11.json
node --import tsx tools/benchmark-core-classes.ts boss ../scratch/core-classes/boss-2026-11-11.json
node --import tsx tools/benchmark-core-classes.ts profiles ../scratch/core-classes/profiles-2026-11-11.json 300
node --import tsx tools/benchmark-core-classes.ts farm ../scratch/core-classes/farm-2026-11-11.json 1800
```

`npm run test:server`: **299 aprovados**. `npm run build --workspace=@magicforge/server`: aprovado. Novos testes cobrem determinismo, financiamento real do equipamento ponderado, mundo/nível inicial, Mordida no benchmark e seleção explícita de Pele Rochosa/ausência de cura do Arqueiro.

Dados brutos estão em `scratch/core-classes/`; resumos, hipóteses e hashes estão em `EVIDENCIAS_CICLO_TRES_CLASSES_2026-11-11.json`. Os hashes de fonte são capturados no início de cada processo. Farm/perfis começaram antes da correção do seletor de sustentação do benchmark de chefe, que não é utilizado por esses dois modos; a correção foi reexecutada nas matrizes de chefe e escolhas. Houve também ajuste posterior de indentação na ferramenta de progressão, sem alteração de comportamento.

Arquivos alterados/criados: `server/tools/ProgressionSimulation.ts`, `server/tools/BossInvestmentSimulation.ts`, `server/tools/benchmark-core-classes.ts`, `server/tests/earned-progression.test.ts`, `server/tests/boss-investment-simulation.test.ts` e estes dois documentos.

Branch: `master`, raiz `E:\MagicForge_Universe`, trabalho sequencial. Sem commit/push neste bloco. Banco ativo e alterações locais de handoff/arquivo RAR preservados. Validar as hipóteses de gestão de mochila e as metas de progressão com a equipe antes de chamar os números de calibração final.
