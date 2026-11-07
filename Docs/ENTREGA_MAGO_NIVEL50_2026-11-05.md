# Mago — habilidades de nível 50 — 05/11/2026

## Entrega

Concluídos os efeitos das três escolhas finais. Com os lotes anteriores, as 12 habilidades do Mago estão implementadas segundo as descrições atuais do nosso RPG idle. Balanceamento final, Unity e validação com personagens reais continuam pendentes.

| Habilidade | Regra funcional |
|---|---|
| Bola de Fogo Apocalíptica | Potência base de 4,3 × INT em raio de 8m no ponto escolhido até 10m. Evolução, crítico e bônus de dano aplicáveis. |
| Chuva de Cometas Arcanos | Área fixa de raio 6,5m, escolhida até 10m. Três impactos reais após 0,5s, 1s e 1,5s, dividindo potência total de 4,7 × INT. Sem crítico; evolução e bônus capturados na conjuração. |
| Estase do Zero Absoluto | Potência de 3,9 × INT em raio de 6m, ponto escolhido até 8m. Congela sobreviventes por 3s; não encurta congelamento mais longo já ativo nem soma durações. |

Preservados nível 50, slots, mana, cooldowns e layout. As potências genéricas por slot foram substituídas pelas fórmulas explícitas. São adaptações do nosso jogo, sem afirmar equivalência literal a D&D 5e.

Cometas verificam os inimigos dentro da área em cada impacto: sair evita os impactos seguintes; entrar permite recebê-los. A área não acompanha o conjurador. Morte/saída do conjurador cancela os impactos pendentes; renovar substitui a chuva anterior. Não há cobrança por impacto, persistência offline ou repetição de recompensa por cadáver. Desligar AUTO não desfaz a chuva já conjurada, mas impede novas conjurações automáticas.

Nevasca e Estase agora preservam o congelamento mais longo ainda ativo. Mantida a política de uma instância por tipo, com autoria do efeito preservado para limpeza na saída/morte da fonte; não foi criado um sistema de empilhamento de controle por múltiplas fontes.

## Apresentação

Bola de Fogo e Estase reutilizam impacto e anel de área. Cometas não apresentam impacto na conjuração: os VFX são disparados pelos três pulsos autoritativos, inclusive quando um impacto cai sem inimigos. Área/raio são enviados desde a aplicação inicial do status `COMET_RAIN`; não são inferidos da posição atual do herói. Nenhuma imagem ou janela nova foi adicionada.

## Testes e medição

- `npm run test:server`: **184 testes aprovados**.
- `npm run test:mage`: **34 testes TypeScript aprovados** (30 de servidor e 4 de interface), mais **9 testes de VFX aprovados**. Os 30 de servidor estão nos 184 acima.
- `npm test`: **36 testes do cliente aprovados**.
- `node --test client/tests/warrior-presentation.test.mjs client/tests/barbarian-presentation.test.mjs`: **19 testes aprovados**, dos quais os 12 do Bárbaro também fazem parte do comando anterior.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Permanecem avisos existentes dos assets `wing-left.svg`/`wing-right.svg` e de detecção automática de módulo em testes Node com imports TypeScript.
- Verificação de whitespace dos arquivos rastreados do lote: aprovada, considerando CRLF como final de linha.

Oito testes novos de servidor cobrem fórmula/fronteira/evolução da Bola de Fogo; ausência de dano inicial e tempo/total dos três cometas; centro fixo e entrada/saída de inimigos; potência capturada, renovação, morte/saída e recompensa única; Estase sem encurtar controle; validações sem cobrança parcial; automático e desligamento de AUTO durante efeito ativo. Três testes novos de VFX cobrem centro confirmado, pulsos autoritativos e rejeição de centro inválido.

[Evidência resumida e hashes](EVIDENCIAS_MAGO_NIVEL50_2026-11-05.json):

- **420 cenários gerais**: sem mudança de vitória/derrota/timeout em relação ao lote anterior; zero rejeições/casts vazios detectados.
- **480 lutas de escolhas do Mago**, incluindo todas as 81 combinações de nível 50 nos mundos 3/4, duas sementes. Os 156 casos dos patamares anteriores mantiveram seus resultados.
- Nas 324 lutas novas de nível 50, cada escolha venceu as 54 lutas contra o mundo 3. Nenhuma venceu o mundo 4: Bola de Fogo teve 27 mortes e 27 timeouts; Cometas 25 mortes e 29 timeouts; Estase 10 mortes e 44 timeouts.

Esses números indicam diferença de sobrevivência nessa amostra, não equilíbrio ou superioridade geral. Fixtures usam equipamento inicial, habilidades no rank 1 e recursos fornecidos; não representam progresso obtido no farm. Não havia amostra anterior dessas mesmas 324 escolhas para afirmar melhora de vitória causada pelo lote. Chefes e custos não foram enfraquecidos para favorecer o resultado.

Reprodução na raiz:

```powershell
npm run test:mage
npm run test:server
npm test
npm run build
npm run benchmark:mage -- E:/MagicForge_Universe/scratch/runtime/mage-ultimate-replay.json
npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/mage-ultimate-combat-replay.json
```

Relatórios brutos em `scratch/runtime/mage-ultimate-loadouts.json` e `scratch/runtime/mage-ultimate-combat.json`, fora do Git.

## Execução, pendências e sequência

Backend atualizado sem conexões TCP estabelecidas, com backup consistente em `scratch/runtime/before-mage-ultimate-1793919624827.db`. Health online a 20 Hz e prévia HTTPS respondendo 200. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos idêntico antes/depois: 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira. Nenhuma migração necessária.

Pendente validar com personagem real de nível 50 no desktop/celular: impactos espaçados, entrada/saída da área, ordem com Haste/Estase, reconexão e mudança de mundo. Não foi feita nova inspeção visual de gameplay neste bloco; VFX foram verificados por testes do planejador e build. Unity não foi alterado/compilado e precisa consumir os novos status para apresentá-los corretamente.

Prioridade seguinte solicitada pelo usuário: **Guerreiro, depois Bárbaro**. A revisão inicial está em `Docs/REVISAO_GUERREIRO_BARBARO_2026-11-05.md`. Não iniciar outra classe antes dessa sequência.

## Arquivos deste lote

- Novos: `server/tests/mage-ultimate.test.ts`, `client/tests/mage-ultimate-vfx.test.mjs`, este relatório, `Docs/EVIDENCIAS_MAGO_NIVEL50_2026-11-05.json` e `Docs/REVISAO_GUERREIRO_BARBARO_2026-11-05.md`.
- Alterados: `shared/src/mage-effects.ts`, `shared/src/skills.ts`, `shared/src/messages.ts`, `server/src/game/World.ts`, `client/src/renderer/PixelVfx.ts`, `client/src/renderer/PixelVfxPlayer.ts`, `client/src/renderer/GameRenderer.ts`, `server/tools/benchmark-mage.ts`, `server/package.json`, `package.json`, `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

Branch/worktree: `master`, `E:\MagicForge_Universe`. Sem commit/push deste lote. Trabalho anterior, layout e pasta de propostas da outra IA preservados.
