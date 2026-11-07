# Economia inicial, previsão de melhorias e comparação contra chefes

Entrega de 04/11/2026, branch `master`, pasta `E:/MagicForge_Universe`. Sem commit ou push deste bloco. Os números aqui substituem os custos provisórios de 03/11; melhorias já compradas mantêm seu nível.

## Resultado funcional

- O Grimório mostra uma estimativa até a próxima melhoria, dentro dos cards existentes. Nenhum posicionamento, moldura, fonte ou controle do layout do colaborador foi substituído. Foi seguido `GUIA_DESIGN_SYSTEM_E_UI_RUNICA.md`.
- A estimativa considera o saldo atual e o recurso mais demorado entre ouro e Pó Arcano. O ouro inclui drops e auto-vendas da caçada; vendas manuais, reciclagem, baú offline e prêmios diretos não são tratados como renda recorrente.
- Aguarda ao menos 60 segundos de medição. Sem taxa positiva do recurso faltante, informa ausência de amostra; não inventa prazo. Amostras com mais de 30 segundos sem atualização deixam de gerar previsão. O Grimório aberto pede atualização a cada 15 segundos; fechar ou desconectar cancela o polling.
- O relatório Farm ganhou Pó Arcano coletado e por hora. Só coleta bem-sucedida de drop soma ao contador. Drop repetido, mochila sem espaço, prêmio direto e reciclagem não inflam a taxa.
- Auto-venda por raridade e o botão de vender lixo agora preservam materiais e poções e vendem apenas equipamentos elegíveis. Labels e confirmação foram ajustados para explicar isso. A venda individual de itens continua disponível.
- Custo inicial de Truque: **300 ouro + 1 Pó Arcano**. Para categoria `t` e nível atual `n`, ouro = arredondar para cima em dezenas `300 × t × 1,45^(n−1)`; pó = `t × teto(n/3)`. O bônus de potência continua em 5 pontos percentuais por nível; teto 20. Categorias, desbloqueios, cooldowns, ordem e AUTO/MANUAL não mudaram.

## Medição real do início do jogo

12 trajetórias de 30 minutos: quatro classes e três sementes (101/202/303), totalizando seis horas simuladas. Personagens novos em SQLite em memória, arma inicial equipada, 20 slots, poções iniciais, auto-venda de equipamentos comuns/incomuns ligada, sem compras e sem inputs de movimento ou combate do navegador. Os números abaixo são médias de toda a trajetória e não taxas fixas de uma única fase.

| Classe | Ouro de drops/min | Ouro de auto-venda/min | Pó/min | Primeira melhoria disponível | Mundos finais nas 3 sementes |
| --- | ---: | ---: | ---: | --- | --- |
| Guerreiro | 370,48 | 106,89 | 21,78 | 29,9–43,05s | 3 / 3 / 3 |
| Bárbaro | 385,81 | 145,00 | 20,89 | 26–37,05s | 3 / 3 / 3 |
| Arqueiro | 371,92 | 125,78 | 22,08 | 19,25–21,15s | 3 / 3 / 3 |
| Clérigo | 371,94 | 133,67 | 17,84 | 29,6–37,35s | 2 / 2 / 2 |

Na rodada inicial de cinco minutos, a melhoria de 100 ouro estava disponível em 6,15–20,4 segundos. A versão de 300 ouro dá uma decisão inicial em 19,25–43,05 segundos nas mesmas sementes, antes do primeiro chefe. Essa é a calibração do início da progressão, não um equilíbrio definitivo de todas as classes ou do endgame.

Sem gastar o saldo ao longo da simulação, o custo acumulado para levar o Truque do nível 1 ao 5 (2.300 ouro e 5 pó) foi alcançado em 129,35–238,85 segundos. Para chegar ao nível 10 seriam 18.270 ouro e 18 pó; nenhuma trajetória de 30 minutos reuniu esse saldo completo. Estes marcos medem disponibilidade no saldo sem compras; não simulam os benefícios de comprar cada nível imediatamente.

A evidência JSON também contém medição por classe/mundo/fase. Os contadores são atribuídos à fase ocupada no tick da coleta; drops podem ter sido gerados na fase anterior. No resumo por fase, exposições menores que 60 segundos não recebem taxa calculada. Fases e chefes têm ritmos diferentes; não extrapolar os números de uma fase curta como renda garantida.

## Comparação controlada contra chefes

288 cenários: quatro classes, níveis artificiais 8/10, mundos 1/2/3, três sementes e quatro alternativas. Foram 243 lutas reais; 45 cenários de sustentação foram declarados indisponíveis por falta de habilidade de cura liberada. Não foi inventada cura ou loja para essas classes.

Cada alternativa recebeu o mesmo orçamento de 1.000 ouro, estoque de 20 pó, três pedras comuns, arma inicial e poções iniciais. Essas provisões são fixtures de teste. Custos de materiais não são equivalentes, e o gasto efetivo varia:

- Sem compra: 0 ouro.
- Truque até nível 3: 740 ouro, +10% de potência base da habilidade.
- Arma até +2: 1.000 ouro e duas pedras, usando a forja real.
- Sustentação: seleciona uma cura liberada, prioriza seu slot e compra níveis dentro do orçamento. Mede configuração da build mais melhoria; não isola somente o multiplicador da cura.

O relógio e o fluxo aleatório de combate são reiniciados antes de cada par. Ações diferentes podem consumir aleatoriedade de modo diferente depois do início. A bancada usa combate, preços, poções e temporizador reais do servidor. As fixtures de nível 10 não representam necessariamente um personagem que chegou a esse nível em 30 minutos.

Exemplo concreto: **Guerreiro, nível 10, Frostbite, semente 101**. Sem compra: timeout aos 60s com 1,15% de HP no chefe. Com Truque nível 3 ou arma +2: vitória aos 59,1s. Portanto, o investimento muda um resultado limítrofe real.

Também apareceram limites relevantes:

- Bárbaro nível 10 contra Frostbite morreu nas três sementes, mesmo com esses investimentos. Mais dano reduziu o HP restante do chefe, mas não resolveu sobrevivência.
- Clérigo nível 10 contra Frostbite perdeu por tempo nas três sementes. Trocar seu Truque ofensivo por cura prejudicou o dano; sustentação não resolve um problema de DPS.
- Arqueiro venceu os três casos do mesmo recorte sem comprar; melhorias aceleraram a luta. Isso não permite inferir equilíbrio geral entre classes a partir de três sementes.
- O refino arredonda atributos inteiros. Na espada inicial, +1 ainda não aumenta Força; +2 já aumenta. O relatório compara atributos reais e HP do chefe, sem tratar crescimento de CP como prova de aumento de dano.

## Evidências e reprodução

- Resumo versionável: `Docs/EVIDENCIAS_ECONOMIA_2026-11-04.json`, incluindo hashes SHA-256 dos arquivos centrais da simulação, pressupostos, fases e resultados dos 288 cenários.
- Relatórios brutos locais: `scratch/economy-audit/before-tuning-2026-11-04.json` e `scratch/economy-audit/calibrated-2026-11-04.json`.
- Reproduzir: `npm run benchmark:economy -- 1800 ../scratch/economy-audit/latest.json`.
- A bancada restaura relógio, RNG e log ao terminar. Não lê personagens do banco real nem concede recursos a contas reais.

## Arquivos criados ou alterados neste bloco

- `shared/src/upgrade-estimate.ts`, `shared/src/skill-progression.ts`, `shared/src/messages.ts`, `shared/src/index.ts`.
- `server/src/game/HuntSession.ts`, `server/src/game/World.ts`.
- `server/tools/ProgressionSimulation.ts`, `server/tools/BossInvestmentSimulation.ts`, `server/tools/benchmark-economy.ts`.
- `server/tests/economy-calibration.test.ts`, `server/tests/hunt-report.test.ts`, `server/tests/skill-upgrades.test.ts`.
- `client/src/ui/SkillUpgrades.ts`, `client/src/ui/HuntReport.ts`, `client/src/ui/FarmHelper.ts`, `client/src/main.ts`, `client/index.html`.
- `client/tests/skill-upgrades-ui.test.ts`.
- `package.json`, `server/package.json`.
- Este relatório, `Docs/EVIDENCIAS_ECONOMIA_2026-11-04.json` e a atualização do roadmap.
- `scratch/runtime/`: logs, backup consistente e metadados locais dos serviços (ignorados pelo Git).

Nenhum CSS, asset, meta de Unity, dependência ou schema de banco foi alterado. A alteração antiga do handoff e o banco local foram preservados.

## Verificação

- `npm run test:server`: **75/75**.
- `npm run test:skills`: **13/13** (inclui 9 já contados no servidor e 4 de UI).
- `npm test`: **36/36** nos cinco arquivos da suíte geral do cliente.
- `node --test client/tests/hunt-report-ui.test.mjs client/tests/skill-rotation-ui.test.mjs client/tests/offline-rewards-ui.test.mjs`: **9/9**.
- `npm run build`: aprovado, servidor TypeScript e cliente TypeScript/Vite. Avisos anteriores sobre `wing-left.svg` e `wing-right.svg` continuam.

Servidor atualizado após backup e sem jogadores conectados, mantido rodando. Configuração atual em `scratch/runtime/services.json`. A conta real e o layout no aparelho físico dependem da validação manual do usuário.

## Próxima prioridade de balanceamento

O início da economia já tem números medidos e previsão funcional. Antes de considerar as quatro classes equilibradas, revisar DPS do Clérigo, sobrevivência do Bárbaro e curvas de desbloqueio. A mochila permaneceu com todos os slots ocupados por cerca de 23,5–26 minutos das trajetórias de meia hora; isso não impede todas as pilhas existentes, mas bloqueia novos tipos de loot. A fusão/gestão de equipamentos da próxima etapa deve tratar essa pressão. Offline e progressão além da janela auditada ainda precisam de medição própria.
