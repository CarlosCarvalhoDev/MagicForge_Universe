# Mago — segundo círculo, nível 25 — 05/11/2026

## Entrega funcional

Implementados os efeitos de Nevasca Glacial, Relâmpago em Cadeia e Mente Acelerada. Mantidos nível de desbloqueio, slots, mana, cooldowns base, ordem automática, ataque básico e layout. O Mago agora tem nove habilidades implementadas; as três escolhas de nível 50 continuam pendentes.

| Habilidade | Regra funcional |
|---|---|
| Nevasca Glacial | Potência base de 2,4 × INT em raio de 5,5m no ponto escolhido até 10m. Inimigos atingidos ficam congelados por 1,5s, sem movimento ou ataques. Evolução aumenta dano, não duração. |
| Relâmpago em Cadeia | Potência base de 2,35 × INT por alvo. Primeiro inimigo até 10m, depois até três saltos de no máximo 5m entre atingidos. Escolhe o vizinho vivo mais próximo, usa ID para desempate e não repete alvos. Pode alcançar inimigos além da área do primeiro alvo por meio dos saltos. |
| Mente Acelerada — Haste | Dura 7s. Cadência nominal de decisões automáticas multiplicada por 1,35; novos cooldowns do truque são reduzidos à metade. Cooldowns já iniciados não são alterados. Percentuais/duração fixos, sem compra de evolução de potência. |

O jogo usa conjurações instantâneas; não foi introduzido um tempo global de cast. Os 35% de Haste se aplicam à cadência de decisões do automático, não à velocidade de ataque básico ou ao input manual. O temporizador preserva a fração entre ticks para que o bônus não desapareça no passo de 50ms do servidor, com no máximo uma conjuração automática por tick e sem acumular múltiplas ações durante inatividade.

Novos cooldowns de truque capturam o benefício no momento da conjuração. Exemplo: Dardo de Fogo inicia 1,2s em vez de 2,4s durante Haste. Esse cooldown permanece como iniciado se o buff expirar; conjurações posteriores voltam ao valor base. Mana, outros cooldowns e ordem escolhida não mudam.

O servidor agora informa `cooldownRemainingSec` no evento de conjuração. O cliente usa esse valor no contador, mantendo fallback para o cooldown do catálogo quando o campo não existir. Os campos são opcionais e não exigem opcode ou tabela novos.

## Controle, apresentação e limites

- `FROZEN` bloqueia movimento/ataque pelo mesmo ponto central de controle usado para atordoamento, preservando regras existentes de cooldown durante controle.
- Congelamento renova sem empilhar. Morte/saída do conjurador, morte do alvo e expiração removem o efeito; Haste é removido com os status pessoais na morte/saída.
- Rejeições de nível, mana, alcance e cooldown não aplicam efeitos parciais nem cobram duas vezes.
- Relâmpago resolve os impactos na mesma conjuração. Os atrasos entre VFX são apenas visuais, sem alterar o instante do dano ou ampliar o número de alvos.
- Reutilizados VFX de área/impacto/aura e adicionados rótulos de congelamento/Haste. Não foram criadas imagens nem alteradas janelas do layout.
- São adaptações do nosso RPG idle, sem afirmar implementação literal de D&D 5e. O congelamento também afeta os chefes atuais; não foi introduzida imunidade de chefe neste lote.

## Testes executados

- `npm run test:server`: **176 testes aprovados**.
- `npm run test:mage`: **26 testes TypeScript aprovados** (22 do servidor e 4 da interface de melhorias), mais **6 testes de VFX aprovados**. Os 22 de servidor são subconjunto dos 176 acima.
- `npm run test:automatic`: **10 testes do servidor + 3 do cliente aprovados**.
- `npm run test:skills`: **13 testes aprovados**, incluindo os quatro de interface já contados acima.
- `npm test`: **36 testes do cliente aprovados**.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Permanecem os avisos existentes dos assets `wing-left.svg`/`wing-right.svg` e de detecção automática de módulo nos testes Node com imports TypeScript.
- Verificação de whitespace dos arquivos rastreados deste lote: aprovada, considerando CRLF como final de linha.

Nove testes novos de servidor verificam potência/fronteira da Nevasca, movimento e ataque congelados, renovação, morte/saída, quatro alvos, saltos reais e lacunas maiores que 5m, Haste a 20Hz, ordem sem duplicação no tick, cooldown já iniciado, cooldown real no evento, expiração/renovação, percentuais fixos, validações e AUTO/MANUAL. Três testes novos de VFX verificam centro da Nevasca, impactos confirmados do Relâmpago e aura pessoal de Haste.

O teste de habilidade pessoal ainda não implementada passou a usar Agathys do Bruxo. Os testes de upgrade de Haste continuam bloqueando a compra por falta de evolução de potência, sem afirmar que seu efeito esteja indisponível.

## Medição controlada

[Resumo estruturado e hashes](EVIDENCIAS_MAGO_NIVEL25_2026-11-05.json).

- Matriz geral de **420 cenários**: nenhum resultado de vitória/derrota/timeout mudou em relação ao lote anterior; zero rejeições de conjuração/casts vazios detectados. A média das vitórias do Mago passou de 29,32s para 29,48s; não é evidência de ganho de DPS.
- Matriz do Mago ampliada de 48 para **156 lutas**: as 48 escolhas iniciais mantiveram resultados; acrescentadas todas as 27 combinações de nível 25 nos mundos 2/3, duas sementes.
- Nas 108 lutas de nível 25, cada escolha de segundo círculo teve **18 vitórias, 12 mortes e 6 timeouts** em 36 casos. Médias de duração: Nevasca 43,37s; Relâmpago 41,07s; Haste 41,08s. Esses grupos incluem combinações diferentes de truque/primeiro círculo; a média isolada não demonstra superioridade de uma habilidade.
- Total das 156 lutas: **78 vitórias, 54 mortes e 24 timeouts**, sem rejeições/casts vazios detectados.

Fixtures em memória, equipamento inicial, recursos fornecidos, sem investimento. Não representam o tempo de farm nem comprovam equilíbrio da progressão. Não havia amostra anterior dessas mesmas 108 combinações para atribuir ganho de vitória ao lote. Nenhum chefe ou custo foi alterado para favorecer o resultado.

Reprodução na raiz:

```powershell
npm run test:mage
npm run test:server
npm run test:automatic
npm run test:skills
npm test
npm run build
npm run benchmark:mage -- E:/MagicForge_Universe/scratch/runtime/mage-second-replay.json
npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/mage-second-combat-replay.json
```

Relatórios brutos: `scratch/runtime/mage-second-loadouts.json` e `scratch/runtime/mage-second-combat.json`, fora do Git.

## Execução e pendências

Backend atualizado sem conexões TCP estabelecidas na porta 3000, com backup consistente em `scratch/runtime/before-mage-second-1793919012722.db`. Health online a 20 Hz e prévia HTTPS respondendo 200. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos idêntico antes/depois: 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira. Nenhuma migração necessária.

Pendente testar com personagem real de nível 25 no desktop/celular: contador reduzido do truque, ordem de Haste, salto entre inimigos espaçados, congelamento, reconexão e troca de mundo. Não foi feita nova inspeção visual de gameplay neste bloco; apresentação foi verificada pelos testes de VFX e build. Unity não foi alterado/compilado; precisa consumir os novos status/cooldown para apresentar esses efeitos corretamente.

Próximo lote: Bola de Fogo Apocalíptica, Chuva de Cometas Arcanos e Estase do Zero Absoluto, de nível 50. Balanceamento final e progressão com equipamento obtido no farm permanecem abertos.

## Arquivos deste lote

- Novos: `server/tests/mage-second-circle.test.ts`, `client/tests/mage-second-vfx.test.mjs`, este relatório e `Docs/EVIDENCIAS_MAGO_NIVEL25_2026-11-05.json`.
- Alterados: `shared/src/mage-effects.ts`, `shared/src/skills.ts`, `shared/src/skill-targeting.ts`, `shared/src/messages.ts`, `server/src/entities/Entity.ts`, `server/src/game/World.ts`, `client/src/main.ts`, `client/src/renderer/PixelVfx.ts`, `client/src/renderer/PixelVfxPlayer.ts`, `server/tests/combat-loop.test.ts`, `server/tests/skill-upgrades.test.ts`, `client/tests/skill-upgrades-ui.test.ts`, `server/tools/benchmark-mage.ts`, `server/package.json`, `package.json`, `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

Branch/worktree: `master`, `E:\MagicForge_Universe`. Sem commit/push deste lote. Trabalho anterior e pasta de propostas da outra IA preservados.
