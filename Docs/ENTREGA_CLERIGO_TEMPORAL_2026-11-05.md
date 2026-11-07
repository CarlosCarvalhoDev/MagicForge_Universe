# Clérigo — efeitos temporais de nível 25 — 05/11/2026

## Entrega funcional

As três escolhas do segundo círculo agora executam efeitos temporais no servidor autoritativo. Mantidos desbloqueio no nível 25, slots, mana, cooldowns, evolução e layout existentes. As descrições passaram a explicitar duração, frequência e limites; estes parâmetros são a primeira calibração do nosso RPG idle, não uma implementação literal de D&D 5e.

| Habilidade | Efeito implementado |
|---|---|
| Espíritos Guardiões | Aura acompanha o conjurador por 6s, raio de 5m. Dano total base de 2,5 × SAB por alvo que permaneça nos seis pulsos de 1s. Lentidão de movimento de 40% somente dentro da aura; sair remove a lentidão. |
| Arma Espiritual Flutuante | Dura 8s, quatro golpes com intervalo de 2s; dano total base de 2,4 × SAB. Mantém o alvo enquanto vivo e até 8m do conjurador; procura o mais próximo nesse alcance quando necessário. Sem alvo, o golpe daquele intervalo é perdido. |
| Santuário Consagrado | Círculo fixo no local de conjuração, raio de 6m, duração de 6s. Cura base de 5% do HP máximo capturado por segundo e reduz dano recebido pelo conjurador em 25% enquanto dentro. Sair suspende cura/proteção; entrar novamente permite os pulsos futuros, sem recuperar pulsos perdidos. |

Potência é capturada no momento da conjuração, incluindo evolução e bônus de dano aplicáveis. O arredondamento cumulativo mantém o total previsto ao dividir entre pulsos. Esses três efeitos não dão crítico nem consomem a marca do Raio Guia; a descrição da marca agora diferencia impacto direto de efeito periódico. Cura respeita o teto de HP e evolução aumenta sua potência, sem aumentar a duração ou o percentual de redução.

O Santuário pode ser conjurado preventivamente no automático com vida cheia. A proteção usa a maior redução entre Bênção/Fúria e Santuário, sem somar percentuais. Duas auras não somam lentidão; cada conjurador conserva seu próprio dano periódico. Benefícios do Santuário são pessoais neste lote, não cura/proteção de grupo.

Os efeitos usam status temporários existentes, sem tabelas novas, entidade de invocação persistida, timers independentes ou alterações nos saves. Morte do conjurador, saída/troca de mundo e expiração encerram os efeitos; renovar o mesmo efeito substitui o anterior. Morte por pulso passa pelo fluxo normal de recompensa uma única vez.

## Apresentação

Indicadores de raio seguem a mesma escala do renderer: círculo dourado para Guardiões, verde fixo para Santuário. Rótulos mostram efeito, proteção e lentidão; cura periódica positiva produz texto flutuante. Corrigido o texto da marca consumida, que antes reutilizava “escudo quebrado”. Não foram integradas imagens ou propostas da outra IA, nem alterado o layout de janelas.

Prévia isolada em `/tests/cleric-periodic-preview.html`, com o renderer real e entidades/status simulados, sem conta ou banco. Inspeção visual realizada em desktop e 393×852, incluindo mover o herói para fora do círculo; sem erros no console observado. Capturas locais:

- `scratch/evidence/cleric-periodic-desktop.jpg`.
- `scratch/evidence/cleric-periodic-mobile.jpg`.

## Testes e medição

- `npm run test:server`: **145 testes aprovados**.
- `npm run test:combat`: **38 testes aprovados**, subconjunto da suíte acima.
- `npm test`: **36 testes do cliente aprovados**.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Permanecem os avisos existentes dos assets `wing-left.svg` e `wing-right.svg`.
- Dez testes novos de efeitos temporais: contagem/total de pulsos, fronteira de área, deslocamento com lentidão, aura móvel, alvo morto/distante, recompensa única, círculo fixo, HP máximo, redução sem soma, morte/desconexão, renovação, potência capturada, rejeições sem cobrança, automático preventivo e coexistência de duas auras.
- `benchmark:combat`: **420 cenários**, sem mudança de resultado vitória/derrota/timeout em relação ao bloco anterior; zero rejeições de conjuração ou casts vazios detectados.
- `benchmark:cleric`: **144 lutas**. Nível 10: nove combinações × dois mundos × duas sementes; nível 25: 27 combinações × dois mundos × duas sementes. Zero rejeições/casts vazios; dano periódico e cura efetiva registrados separadamente no comparador.

Resultados do nível 25: 36 vitórias com cada escolha do segundo círculo. Somando as 36 lutas de cada grupo, Guardiões aplicou 17.257 de dano periódico, Arma Espiritual 14.801 e Santuário 26.315 de cura efetiva. O nível 10 manteve 18 vitórias, 11 mortes e 7 timeouts. Não são metas de equilíbrio: mundos 1/2 foram fáceis para os personagens de nível 25 fornecidos pelas fixtures, e não foi medido o farm necessário para obtê-los.

[Resumo e hashes dos fontes](EVIDENCIAS_CLERIGO_TEMPORAL_2026-11-05.json). Arquivos brutos em `scratch/runtime/cleric-periodic-combat.json` e `scratch/runtime/cleric-periodic-loadouts.json`.

Reprodução na raiz:

```powershell
npm run test:combat
npm run test:server
npm test
npm run build
npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/periodic-combat-replay.json
npm run benchmark:cleric -- E:/MagicForge_Universe/scratch/runtime/periodic-cleric-replay.json
```

## Execução local e validação restante

Backend atualizado sem conexões TCP estabelecidas na porta 3000, health online a 20 Hz e prévia HTTPS respondendo 200. Backup consistente em `scratch/runtime/before-cleric-periodic-1793882356389.db`. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos idêntico antes/depois; 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira.

Pendente validação manual com personagem real de nível 25 no desktop/celular, sobretudo alternar escolhas, ordem automática, sair/reentrar e trocar de mundo. A prévia visual não substitui esse teste completo. Balanceamento contra chefes mais fortes, suporte de grupo e consumo desses novos status pelo cliente Unity continuam pendentes; Unity não foi alterado nem compilado.

Próximo lote: concluir as três habilidades de nível 50 do Clérigo, com cura/área híbrida da Intervenção Divina, e então seguir para outra classe. Os nove efeitos dos níveis 1/10/25 estão implementados; não declarar as 84 habilidades completas.

## Arquivos deste bloco

- Novos: `shared/src/cleric-effects.ts`, `server/tests/cleric-periodic.test.ts`, `client/tests/cleric-periodic-preview.html`, `client/tests/cleric-periodic-preview.ts`, este relatório e `Docs/EVIDENCIAS_CLERIGO_TEMPORAL_2026-11-05.json`.
- Alterados: `shared/src/index.ts`, `shared/src/messages.ts`, `shared/src/skills.ts`, `server/src/entities/Entity.ts`, `server/src/entities/Monster.ts`, `server/src/game/World.ts`, `server/tools/BossInvestmentSimulation.ts`, `server/tools/benchmark-cleric.ts`, `server/package.json`, `client/src/renderer/PixelVfxPlayer.ts`, `client/src/renderer/GameRenderer.ts`, `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

Branch/worktree: `master`, `E:\MagicForge_Universe`. Sem commit/push neste bloco. Trabalho anterior e pasta reservada à IA de conteúdo preservados.
