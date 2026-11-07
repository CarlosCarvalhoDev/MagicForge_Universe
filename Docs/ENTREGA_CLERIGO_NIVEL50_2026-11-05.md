# Clérigo — habilidades de nível 50 — 05/11/2026

## Entrega

Concluídos os efeitos das três escolhas do terceiro círculo. Com os lotes anteriores, as 12 habilidades do Clérigo têm implementação dos efeitos descritos no catálogo atual. Isso não equivale a balanceamento final nem cobre as habilidades das outras seis classes.

| Habilidade | Regra funcional |
|---|---|
| Coluna do Fogo Sagrado | Potência base de 4,1 × SAB + 1,5 × CON, área de raio 7,5m no ponto escolhido até 10m do conjurador. Evolução, crítico e bônus de dano aplicáveis. |
| Intervenção Divina: Graça | Restaura a própria vida até o HP máximo e causa potência base de 4,3 × SAB nos inimigos em 8m ao redor do herói, na mesma cobrança/evento. Evolução e bônus aumentam o dano; a cura continua limitada ao HP máximo. Crítico aplica-se ao dano, não aumenta a cura. |
| Raio do Sol da Aurora | Potência base de 4,8 × SAB contra um alvo até 12m. Evolução e bônus aplicáveis; pode consumir a marca do Raio Guia para garantir crítico. Não recebeu multiplicador especial contra chefes, pois o catálogo não define esse bônus. |

Preservados desbloqueio no nível 50, slots, custos de mana, cooldowns, ordem automática e layout. Fórmulas genéricas por slot foram substituídas pelas fórmulas explícitas dessas habilidades. São parâmetros do nosso RPG idle; não se afirma equivalência literal às regras de mesa de D&D.

## Comportamentos importantes

- Intervenção é híbrida: pode atacar no automático com vida cheia e inimigo próximo, sem ser descartada como uma cura pessoal sem utilidade. Cura pessoal pura continua esperando vida faltante.
- Desligar AUTO continua impedindo conjurações automáticas; os básicos permanecem ativos.
- Intervenção manual pode curar sem inimigos próximos. Corrigida a resolução de alvo das áreas pessoais de cura, que ainda acessava o primeiro monstro de uma lista vazia; o teste inclui também Santuário sem inimigos.
- Rejeições de nível, recurso, ponto fora de alcance e cooldown não aplicam parte da cura/dano nem cobram recursos parcialmente.
- Intervenção e Coluna não consomem marca destinada a impacto de alvo único; Raio Solar consome uma única vez. Monstros nunca recebem a cura da Intervenção.
- Morte por supernova passa pelo fluxo normal de recompensa uma única vez.
- A apresentação usa resultados autoritativos: cura e onda da Intervenção só aparecem se houve cura/dano, a Coluna usa o centro escolhido e o Raio Solar preserva o ponto de impacto mesmo após o alvo desaparecer. Reutilizados VFX existentes, sem imagens novas ou mudança de layout.

## Validação executada

- `npm run test:server`: **154 testes aprovados**.
- `npm run test:combat`: **47 testes do servidor + 3 testes de VFX aprovados**; os 47 são subconjunto da suíte acima.
- `npm test`: **36 testes do cliente aprovados**. Total de testes distintos executados: 154 de servidor e 39 de cliente.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Permanecem avisos existentes de `wing-left.svg`/`wing-right.svg`; testes Node que importam TypeScript emitem aviso de detecção automática de módulo, sem falha.
- Nove testes novos de servidor cobrem fórmulas, centro/fronteira de área, evolução, crítico com marca, cura/dano simultâneos, limite de HP, cura sem inimigos, automático/MANUAL, rejeições sem aplicação parcial, recompensa e Santuário sem alvo.
- Três testes novos de cliente cobrem onda/cura híbrida, centro da Coluna e impacto após despawn.
- `git diff --check` nos arquivos rastreados deste bloco: aprovado, considerando CRLF como final de linha.

## Medição controlada

[Evidência resumida e hashes dos fontes](EVIDENCIAS_CLERIGO_NIVEL50_2026-11-05.json).

- Matriz geral de **420 cenários**: nenhum resultado de vitória/derrota/timeout mudou em relação ao lote anterior. Zero rejeições de conjuração e casts vazios detectados.
- Matriz de escolhas do Clérigo ampliada de 144 para **468 lutas**: nove combinações no nível 10 e 27 no nível 25, mundos 1/2; todas as 81 combinações no nível 50, mundos 3/4; duas sementes. Os 144 casos comuns mantiveram seus resultados.
- Nível 50: **324 lutas**, sem rejeições/casts vazios. Contra o mundo 3, Coluna venceu 53/54; Intervenção 54/54; Raio Solar 54/54. Contra o mundo 4, as 162 lutas terminaram por timeout. Não houve morte nesses casos de nível 50.
- A amostra indica limite de dano contra o mundo 4 com equipamento inicial e habilidades no rank 1; não prova que o chefe esteja equilibrado ou que seja impossível vencê-lo com investimento. Nenhum chefe foi enfraquecido para melhorar o resultado.

Fixtures novas em memória, equipamentos iniciais, recursos fornecidos e sem investimento; não representam progresso obtido no farm. Não comparar a taxa de vitória de níveis/mundos diferentes como se fossem a mesma dificuldade. Não existe medição anterior dessas 324 combinações de nível 50 para afirmar ganho de vitória causado pelo lote.

Reprodução na raiz:

```powershell
npm run test:combat
npm run test:server
npm test
npm run build
npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/ultimate-combat-replay.json
npm run benchmark:cleric -- E:/MagicForge_Universe/scratch/runtime/ultimate-cleric-replay.json
```

Relatórios brutos desta execução: `scratch/runtime/cleric-ultimate-combat.json` e `scratch/runtime/cleric-ultimate-loadouts.json`, fora do Git.

## Execução e pendências

Backend reiniciado sem conexões TCP estabelecidas na porta 3000; health online a 20 Hz e prévia HTTPS respondendo 200. Backup consistente em `scratch/runtime/before-cleric-ultimate-1793883286821.db`. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos de reforja idêntico antes/depois; 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira. Nenhuma migração ou alteração de progressão de personagens existentes foi necessária.

Pendente validar com personagem real de nível 50 no desktop/celular, especialmente ordem de Raio Guia/Raio Solar, cura e área da Intervenção, reconexão e seleção das três escolhas. Não foi feita nova inspeção visual de gameplay neste bloco; os efeitos foram verificados pelos testes do planejador de VFX e pelo build. Unity não foi alterado nem compilado. Balanceamento com equipamento/refino/fusão obtidos no farm e contra mundos posteriores permanece aberto.

Próximo foco recomendado: efeitos do Mago, mantendo a mesma sequência de entregas pequenas por patamar. A IA de conteúdo continua com catálogo/receitas/ícones em sua pasta reservada.

## Arquivos deste bloco

- Novos: `server/tests/cleric-ultimate.test.ts`, `client/tests/cleric-ultimate-vfx.test.mjs`, este relatório e `Docs/EVIDENCIAS_CLERIGO_NIVEL50_2026-11-05.json`.
- Alterados: `shared/src/skills.ts`, `shared/src/skill-targeting.ts`, `server/src/game/World.ts`, `client/src/renderer/PixelVfx.ts`, `server/tools/benchmark-cleric.ts`, `server/package.json`, `package.json`, `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

Branch/worktree: `master`, `E:\MagicForge_Universe`. Sem commit/push neste bloco. Alterações anteriores e pasta de propostas da outra IA preservadas.
