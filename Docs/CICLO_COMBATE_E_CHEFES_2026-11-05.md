# Ciclo de combate e chefes — 05/11/2026

## Entrega

Correções incrementais no ciclo automático, mantendo o layout existente e os contratos de inventário, melhoria e reforja. Nenhuma migração de banco ou substituição de equipamentos de personagens existentes foi executada.

- Cliente manual e servidor usam a mesma classificação de alvo. Áreas pessoais são conjuradas no herói; áreas em alvo e linhas preservam suas geometrias.
- O automático aproxima para habilidades ofensivas prontas de alcance curto. A rotação continua pulando habilidades indisponíveis e preserva ataques básicos.
- Cura pessoal automática espera vida faltante. Ataques híbridos continuam utilizáveis com vida cheia.
- Fúria Primitiva aplica +25% de dano e 15% de redução de dano durante 6 segundos, sem empilhar o mesmo status.
- Golpe Orientador aplica dano de 1,1 × SAB e cura de 0,5 × SAB ao acertar. Toque Vampírico aplica dano de 2,5 × CAR e cura metade da vida efetivamente retirada, evitando cura por dano excedente ao HP do alvo. Os dois respeitam evolução, crítico no dano e alcance.
- Mana usa INT para Mago, SAB para Clérigo e CAR para Bruxo, no nascimento e recálculo. O recurso atual é limitado ao novo máximo ao mudar atributos/equipamento.
- Novos Monges recebem `staff_monk_ash`; novos Bruxos recebem `focus_pact_initiate`. São armas iniciais compatíveis com suas classes. Os equipamentos de personagens existentes permanecem como estavam.
- Buffs pessoais ainda sem implementação ficam sinalizados como “Em preparação” no Grimório; não podem ser equipados pela interface, não consomem recursos por pedido manual e são pulados pelo automático. Isso não significa que todos os efeitos secundários do catálogo estejam implementados.

## Evidência controlada

[Resumo estruturado](EVIDENCIAS_CICLO_COMBATE_2026-11-05.json). Matriz de 420 cenários por versão: sete classes, níveis 5/10/25, mundos 1/2, duas sementes e cinco alternativas de investimento. Cada alternativa recebe 2.000 ouro e estoques artificiais iguais; compras consomem materiais reais das regras do jogo. O limite de luta é 60 segundos. Esta medição não representa o tempo necessário para obter recursos no farm.

Comparação somente dos pares em que a alternativa estava disponível nas duas versões:

| Classe | Pares | Vitórias antes → depois |
|---|---:|---:|
| Clérigo | 60 | 38 → 40 |
| Guerreiro | 56 | 46 → 46 |
| Bárbaro | 52 | 36 → 42 |
| Monge | 44 | 36 → 38 |
| Bruxo | 52 | 36 → 36 |
| Mago | 48 | 32 → 32 |
| Arqueiro | 48 | 40 → 40 |

Doze alternativas de refino do Monge ficaram disponíveis após a correção da arma inicial; estão fora da tabela de pares comuns. As 6.027 rejeições de conjuração do Clérigo caíram para zero. As 235 conjurações sem dano, cura ou status detectadas nos pares comuns caíram para zero. Ataques básicos continuaram presentes. Nem todas as transições foram melhorias: o Clérigo teve também mortes no lugar de timeouts; o JSON registra as transições para evitar interpretar apenas o total de vitórias.

Os resultados não justificam declarar as classes equilibradas. Continuam pendentes efeitos secundários de várias habilidades, progressão longa, nível 50, outras escolhas de habilidades e validação com estoque obtido no farm. Não houve alteração arbitrária nos atributos dos chefes para melhorar a medição.

Reprodução na raiz:

```powershell
npm run test:combat
npm run test:server
npm test
npm run build
npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/combat-loop-replay.json
```

Os relatórios brutos desta execução estão em `scratch/runtime/combat-loop-before.json` e `scratch/runtime/combat-loop-after.json`, fora do Git. O resumo contém os hashes dos fontes utilizados na versão final; executar novamente reproduz a versão atual, não a versão anterior.

## Arquivos deste bloco

- `shared/src/skill-targeting.ts` (novo), `shared/src/index.ts`, `shared/src/entities.ts`, `shared/src/messages.ts`, `shared/src/items.ts`.
- `server/src/game/World.ts`, `server/src/entities/Player.ts`, `server/src/entities/Entity.ts`, `server/src/database/DatabaseManager.ts`.
- `client/src/main.ts`, `client/src/renderer/PixelVfxPlayer.ts`.
- `server/tests/combat-loop.test.ts` (novo), `server/tests/starter-equipment.test.ts`, `server/tests/automatic-gameplay.test.ts`.
- `server/tools/BossInvestmentSimulation.ts`, `server/tools/benchmark-combat-loop.ts` (novo).
- `package.json`, `server/package.json`, este relatório, o JSON de evidência e `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

Alguns desses arquivos já continham alterações dos blocos anteriores; elas foram preservadas. A pasta de propostas da outra IA não foi editada. Para o catálogo externo, preservar os dois novos IDs de equipamento inicial listados acima.

## Verificação e execução local

- `npm run test:server`: **131 testes aprovados**.
- `npm run test:combat`: **24 testes aprovados**, incluindo subcasos; subconjunto da suíte de servidor.
- `npm test`: **36 testes aprovados**, distribuídos nos cinco scripts do cliente.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados.
- Matriz final: **420 cenários**, sem rejeições de conjuração ou conjurações vazias detectadas nesta amostra.
- Backend reiniciado sem conexões TCP estabelecidas na porta 3000; health online, 20 Hz. Prévia HTTPS respondeu 200.
- Backup consistente em `scratch/runtime/before-combat-1793879016962.db`. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos de reforja idêntico antes/depois; 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira.
- Branch/worktree: `master`, `E:\MagicForge_Universe`; alterações sem commit/push neste bloco.

Validação manual pendente: testar no desktop e celular a Fúria, cura após sofrer dano, habilidades híbridas e ordem do Grimório após reconectar. Não foi feita nova inspeção visual neste bloco. Próxima etapa recomendada: completar e testar efeitos de cada classe por família antes de concluir o balanceamento de chefes e ampliar conteúdo social.
