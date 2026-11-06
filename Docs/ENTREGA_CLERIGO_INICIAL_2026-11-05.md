# Habilidades iniciais do Clérigo — 05/11/2026

Este lote completa os efeitos das três escolhas de truque e das três escolhas do primeiro círculo. Mantém os slots, desbloqueios 1/10/25/50, cooldowns, custos, ordem automática e layout existentes. As habilidades de nível 25/50 ainda têm efeitos secundários pendentes; o catálogo completo não está concluído.

## Comportamento entregue

| Habilidade | Comportamento |
|---|---|
| Chama Sagrada | Potência base de 1,35 × SAB, substituindo a fórmula genérica por slot. |
| Tributo aos Mortos | Potência de 1,45 × SAB e +25% de dano se o alvo já estava ferido antes do impacto. |
| Golpe Orientador | Preservado dano de 1,1 × SAB e cura de 0,5 × SAB ao acertar, inclusive ataque com vida cheia. |
| Palavra de Cura | Potência base de 2 × SAB + nível, substituindo a cura genérica. O automático espera vida faltante. |
| Bênção da Batalha | Bônus pessoais por 8s: dano ×1,20, dano recebido ×0,80 e chance crítica ×1,20. Exemplo: 20% vira 24%, não 40%. |
| Raio Guia Fulgurante | Potência base de 2,15 × SAB. Após acertar um alvo sobrevivente, aplica marca de 6s que garante crítico no próximo ataque básico ou habilidade de alvo único do próprio conjurador. |

As potências de dano/cura respeitam evolução e crítico do sistema existente. Bênção tem percentuais fixos e continua sem compra de evolução de potência, evitando cobrar por um rank sem efeito. As descrições esclarecem os parâmetros antes ausentes, como duração da marca e bônus contra alvo ferido. São regras do nosso RPG idle, sem afirmar equivalência literal às regras de mesa.

Buffs do mesmo tipo renovam em vez de empilhar, conforme a política existente de status. A marca é consumida uma única vez; cura pessoal, conjuração rejeitada e ataque de outro jogador não devem consumi-la. Ela não marca um alvo morto pelo próprio Raio Guia. Uma nova marca no mesmo alvo substitui a anterior, seguindo a política atual de um status por tipo.

Os dois status novos, `CRITICAL_BUFF` e `GUIDING_MARK`, usam o protocolo de status existente e têm rótulos no renderer. Nenhuma alteração de layout, banco ou assets foi necessária.

## Validação

- `npm run test:server`: **135 testes aprovados**.
- `npm run test:combat`: **28 testes aprovados**, subconjunto da suíte acima. Os testes cobrem duração, renovação sem empilhamento, dano recebido, chance crítica, consumo único da marca por básico/magia, autoria da marca, rejeição sem gasto, fórmulas, alvo ferido, evolução e automático.
- `npm test`: **36 testes do cliente aprovados**.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Persistem os avisos de build de `wing-left.svg`/`wing-right.svg`, fora deste escopo.
- `npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/cleric-combat-after.json`: **420 cenários** com as escolhas padrão/alternativas de investimento do benchmark anterior; nenhuma mudança de vitória/derrota/timeout em relação ao bloco anterior e zero rejeições/casts vazios detectados. Isso não significa que dano, cura ou duração das lutas ficaram idênticos.
- `npm run benchmark:cleric -- E:/MagicForge_Universe/scratch/runtime/cleric-loadouts.json`: **36 lutas**, todas as nove combinações iniciais do Clérigo, nível 10, mundos 1/2 e duas sementes. Resultado: 18 vitórias, 11 mortes, 7 timeouts; zero rejeições/casts vazios. Não é uma meta de taxa de vitória nem prova de equilíbrio; não há comparação anterior dessas nove combinações.

[Resumo das simulações](EVIDENCIAS_CLERIGO_INICIAL_2026-11-05.json). Fixtures em memória com recursos fornecidos, sem tocar em contas reais ou representar tempo de farm. A matriz nova de escolhas é reproduzível pelo script `benchmark:cleric`; os resultados brutos ficam em `scratch/runtime/` fora do Git.

## Execução local e pendências

Backend reiniciado sem conexões TCP estabelecidas, health online a 20 Hz e prévia HTTPS respondendo 200. Backup consistente: `scratch/runtime/before-cleric-1793879814420.db`. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos igual antes/depois; 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira.

Validação manual pendente: testar Bênção e Raio Guia no desktop/celular e observar a ordem escolhida. Com Raio Guia, o básico pode consumir a marca imediatamente; isso é intencional e permite escolher a ordem para favorecer outro golpe. Não foi feita inspeção visual nova neste bloco.

Próximo lote: efeitos temporais do Clérigo de nível 25, incluindo área persistente dos Guardiões, ataques da Arma Espiritual e sustentação do Santuário. Durações, frequência dos ticks, movimento, morte e saída do mundo precisam ser definidos e testados antes de habilitar esses efeitos.

## Arquivos e integração

- Alterados: `shared/src/skills.ts`, `shared/src/skill-targeting.ts`, `shared/src/messages.ts`, `server/src/entities/Entity.ts`, `server/src/game/World.ts`, `client/src/renderer/PixelVfxPlayer.ts`.
- Testes/ferramentas: `server/tests/combat-loop.test.ts`, `server/tools/BossInvestmentSimulation.ts`, `server/tools/benchmark-cleric.ts` (novo), `package.json`, `server/package.json`.
- Documentação: este relatório, `Docs/EVIDENCIAS_CLERIGO_INICIAL_2026-11-05.json`, `Docs/REVISAO_PROPOSTA_CONTEUDO_2026-11-05.md` e `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

Branch/worktree: `master`, `E:\MagicForge_Universe`. Sem commit/push neste bloco. Alterações anteriores preservadas; a pasta reservada à outra IA não foi editada. Unity não foi alterado ou compilado; integrar o novo vocabulário de status no cliente Unity fica pendente caso esse cliente seja utilizado.
