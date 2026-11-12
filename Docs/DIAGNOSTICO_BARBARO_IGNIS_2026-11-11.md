# Bárbaro contra Ignis — diagnóstico de 11/11/2026

## Decisão

Manter regeneração de **8 energia/s**, coeficientes das habilidades, duração de 60s do chefe e ordem configurada pelo jogador. A energia não explica a maior parte das falhas desta amostra. Aumentar regeneração para 10 elimina a pressão observada, mas converte apenas uma derrota em vitória em 216 pares.

O principal trade-off observado é ofensiva versus sobrevivência. Pele Rochosa evita as mortes, mas, com equipamento inicial e sem investimento, as 72 combinações medidas com ela terminam por tempo. Evoluir o truque ou fundir a arma já converte parte desses resultados em vitória. Isso sustenta o ciclo de melhoria; não justifica aumentar globalmente o dano nem tornar toda combinação vencedora com equipamento inicial.

## Método e resultados

Foram executados **520 cenários**, todos em SQLite `:memory:`, Bárbaro nível 25, Mundo 3, Ignis, ticks de 50ms e automação real. Sementes: 101, 202, 303, 404, 505, 606, 707 e 808.

- 216 combinações de produção: três truques × três habilidades de primeiro círculo × três de segundo círculo × oito sementes.
- Os mesmos 216 pares com regeneração experimental 10, aplicada apenas ao objeto Player temporário.
- 16 confrontos com Cutilada/Fúria/Pele, comparando as ordens explicitamente configuradas `[1,2,3,4]` e `[3,1,2,4]`, sem mudar regeneração ou atributos.
- 72 comparações de evolução do truque, refino e fusão, em três builds fixas de Cutilada e oito sementes. Cada uma usa como controle a build e semente correspondentes da matriz de produção.

| Cenário | Casos | Vitórias | Mortes | Timeouts | Tempo médio com alguma habilidade pronta sem energia |
|---|---:|---:|---:|---:|---:|
| Regeneração atual, 8/s | 216 | 25 | 27 | 164 | 1,14s |
| Experimento, 10/s | 216 | 26 | 27 | 163 | 0s |

O experimento ganhou uma vitória e perdeu zero. Não houve mudança nas 27 mortes. As maiores esperas por energia aparecem com Carga; as medianas dos grupos com Fúria ou Rugido são zero. Falta de energia existe em algumas builds, mas não é o gargalo geral.

Os resultados anteriores com duas sementes continuam válidos para aquela amostra. As oito sementes ampliam a cobertura e revelam mais mortes; não comparar percentuais como se fossem exatamente a mesma matriz.

## O custo de escolher defesa

Na matriz de produção, agrupando os outros dois slots:

| Habilidade do slot 3 | Casos | Vitórias | Mortes | Timeouts |
|---|---:|---:|---:|---:|
| Banho de Sangue | 72 | 14 | 14 | 44 |
| Pele Rochosa | 72 | 0 | 0 | 72 |
| Salto dos Titãs | 72 | 11 | 13 | 48 |

Pele demonstra valor de sobrevivência, mas ocupa o lugar de um ataque e consome energia/tempo de conjuração. Somente antecipar seu slot não resolve: ambas as ordens testadas tiveram oito timeouts, zero mortes e zero espera por energia. A mediana de HP restante do chefe passou de 3,765% para 4,465% na ordem com Pele primeiro.

Rugido também tem um custo ofensivo: as 72 combinações com ele não venceram Ignis nesta amostra com arma inicial; houve dez mortes e 62 timeouts. Esses agrupamentos são comparações marginais; não atribuir toda a diferença a uma habilidade sem considerar os outros slots e o comportamento do RNG.

## As melhorias existentes recuperam parte do dano

Build fixa: **Cutilada Selvagem / Fúria Primitiva / Pele Rochosa**, ordem `[1,2,3,4]`, oito sementes.

| Investimento | Vitórias | Mortes | Timeouts | Ouro | Materiais consumidos |
|---|---:|---:|---:|---:|---|
| Nenhum | 0 | 0 | 8 | 0 | — |
| Evoluir Cutilada | 4 | 0 | 4 | 1.380 | 3 pó |
| Refinar arma inicial | 0 | 0 | 8 | 1.500 | 3 pedras |
| Fusão da arma | 2 | 0 | 6 | 1.800 | 8 pó e 6 minério; 3 armas elegíveis |

Os custos são os efetivamente consumidos, não equivalência de orçamento. Todos recebem o mesmo estoque e orçamento de fixture; materiais e nível são fornecidos. Estes confrontos não provam que o jogador obtém esses materiais nesse nível/tempo de farm.

Nos outros dois controles de Cutilada, Fúria/Banho mantém seis vitórias e duas mortes em cada caminho de investimento. Rugido/Banho continua sem vitórias com esses investimentos e orçamento; a fusão reduz as mortes de duas para uma, mas deixa sete timeouts. Portanto, uma única melhoria não torna todas as builds equivalentes contra esse chefe solo.

## Instrumentação implementada

`BossInvestmentSimulation.ts` agora aceita diagnóstico opcional, ordem explícita e regeneração de fixture. Registra:

- Cada conjuração bem-sucedida com tempo, slot, energia antes/depois e HP anterior do herói/chefe.
- Quantidade de conjurações, gasto real de energia, dano direto, dano periódico e cura efetiva por habilidade.
- Energia mínima/média, tempo abaixo de 20 e amostras com habilidade sem cooldown, em alcance, mas sem recurso.
- Dano recebido e HP mínimo amostrado.

A observação de prontidão ocorre no início de cada tick. É uma medida de pressão potencial de energia, não um evento de rejeição nem uma reprodução exata da decisão interna de movimento/conjuração. Tempos por habilidade podem se sobrepor; não somá-los como duração total. O tempo médio entre cenários mistura vitórias antecipadas e combates completos de 60s.

O wrapper de conjuração fica somente na instância temporária da simulação. Os testes confirmam que ativar instrumentação preserva resultado, duração, HP final do chefe e todos os contadores do combate; regeneração e ordem experimentais não vazam para a simulação seguinte. Não há alteração de protótipo/global de gameplay ou configuração persistida.

## Validação e reprodução

Na pasta `server`:

```powershell
node --import tsx tools/benchmark-barbarian-diagnostics.ts ../scratch/core-classes/barbarian-diagnostics-2026-11-11.json
node --import tsx --test tests/boss-investment-simulation.test.ts
```

Na raiz:

```powershell
npm run test:server
npm run build --workspace=@magicforge/server
```

- Testes específicos: **4 aprovados**.
- Suíte do servidor: **301 aprovados**.
- Build TypeScript do servidor: aprovado.
- Verificação dos 520 resultados: zero rejeições e conjurações vazias; contagens de casts, somas de dano direto e limites de tempo/energia consistentes.
- Whitespace dos arquivos modificados neste bloco: aprovado.

Dados brutos ficam em `scratch/core-classes/barbarian-diagnostics-2026-11-11.json`. O arquivo de evidências ao lado deste documento guarda o hash do resultado, hashes das fontes medidas, hipóteses, resumos e pares de investimento. Depois da medição foi removida somente uma linha vazia adicional no fim de `BossInvestmentSimulation.ts`.

## Próximo foco

Medir a obtenção das melhorias com uma gestão de mochila representativa: expandir usando o custo real, equipar por pontuação e preservar ingredientes de fusão. Esse passo liga a vitória demonstrada aqui ao tempo real de farm, em vez de usar o orçamento fornecido dos confrontos controlados.

Limites: solo, nível fixo e arma inicial; oito sementes não representam distribuição de jogadores. Não houve teste visual novo, alteração de UI/arte, migração, edição do banco ativo ou reinício necessário do servidor. Sem calibração final de PvP, grupos ou conteúdo posterior.

Arquivos deste bloco: `server/tools/BossInvestmentSimulation.ts`, `server/tools/benchmark-barbarian-diagnostics.ts`, `server/tests/boss-investment-simulation.test.ts`, `Docs/DIAGNOSTICO_BARBARO_IGNIS_2026-11-11.md` e `Docs/EVIDENCIAS_DIAGNOSTICO_BARBARO_2026-11-11.json`.

Branch: `master`, raiz `E:\MagicForge_Universe`, execução sequencial. Alterações anteriores do projeto preservadas. Sem commit, merge ou push neste bloco. A política de gestão de inventário e as metas de tempo de progressão ainda precisam de validação de produto; nenhum aumento experimental de regeneração foi promovido.
