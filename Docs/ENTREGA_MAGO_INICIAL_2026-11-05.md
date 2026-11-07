# Mago — habilidades iniciais — 05/11/2026

## Entrega funcional

Implementados os efeitos das três escolhas de truque e das três escolhas do primeiro círculo. Preservados desbloqueios nos níveis 1/10, slots, mana, cooldowns, ordem automática e layout. O Mago de níveis 25/50 ainda tem efeitos incompletos; este lote não conclui a classe.

| Habilidade | Comportamento |
|---|---|
| Dardo de Fogo | Potência base de 1,4 × INT, com evolução, crítico e bônus de dano. |
| Raio de Gelo | Potência de 1,25 × INT e redução de movimento de 35% por 3s. Coexiste com a lentidão dos Guardiões, usando a maior redução, sem somar percentuais. |
| Toque Chocante | Potência de 1,3 × INT por alvo. Atinge até dois inimigos no total, dentro de 3m do alvo/ponto escolhido até 8m. Prioriza o alvo selecionado, depois proximidade e ID para desempate. |
| Mísseis Arcanos | Três impactos contra um alvo até 10m, sem teste de esquiva. Potência total de 1,85 × INT dividida entre os impactos, com uma única cobrança. Se um impacto mata, os restantes não são aplicados ao cadáver. |
| Escudo Arcano Espelhado | Barreira de 25% do HP máximo por até 5s; reflete 20% do dano efetivamente absorvido, arredondado. Não reflete dano que ultrapassou a barreira e não causa reflexão em cadeia. Evolução aumenta a absorção. |
| Orbe de Chamas Devoradoras | Cone frontal de 6m e 60 graus: impacto de 1,65 × INT e queima adicional de 0,8 × INT no total, em quatro pulsos de 1s sem crítico. |

Fórmulas genéricas por slot substituídas pelas fórmulas explícitas dessas seis habilidades. As descrições esclarecem parâmetros antes ambíguos: dois alvos no total, potência total dos três mísseis, duração/percentual da reflexão e geometria/queima do Orbe. São regras do nosso RPG idle, sem afirmar equivalência literal a D&D 5e.

## Regras e integração

- Lentidão gélida usa `FROST_SLOW`; não apaga a lentidão da aura do Clérigo. Queima usa `BURN`. Renovação substitui o mesmo status, sem empilhamento.
- Dano da queima é capturado na conjuração, incluindo evolução e bônus, distribuído com arredondamento cumulativo. Mudar atributos depois não aumenta pulsos já conjurados.
- Queima/lentidão encerram com expiração, morte do alvo ou morte/saída do conjurador. Não há processamento offline nem persistência desses status em banco.
- Cone usa posição do herói, direção e distância reais; não é um círculo deslocado para o inimigo. Ponto/alcance/alvos são validados antes da cobrança.
- Escudo pode ser conjurado pelo automático com vida cheia. Agora aceita compra de evolução porque possui absorção real; Haste continua indisponível até seu próprio lote.
- Corrigido o fluxo de reflexão que deixava de reconhecer recompensa quando o dano refletido matava o monstro. A política anterior do escudo do Guerreiro foi preservada; somente o escudo novo limita a reflexão ao dano absorvido.
- AUTO desligado continua impedindo conjurações, mantendo ataques básicos. Mísseis têm impactos autoritativos na mesma conjuração; a separação de 100ms dos VFX é apenas visual, sem alterar dano ou cooldown.
- Reutilizados VFX e primitivas de canvas. Não foram adicionadas imagens, dependências, migrações ou alterações no inventário. A nova geometria `CONE` inclui alcance/ângulo no evento; clientes antigos precisam ser atualizados para apresentá-la corretamente.

## Testes reais

- `npm run test:server`: **167 testes aprovados**.
- `npm run test:mage`: **13 testes do Mago + 4 da interface de melhorias + 3 de VFX aprovados**. Os 13 do Mago estão incluídos nos 167 acima.
- `npm run test:skills`: **13 testes aprovados**, incluindo os quatro de interface já contados acima.
- `npm test`: **36 testes do cliente aprovados**.
- `node --test client/tests/warrior-presentation.test.mjs client/tests/barbarian-presentation.test.mjs`: **19 testes aprovados**; os 12 do Bárbaro já estão nos 36 acima. Total de testes distintos de cliente executados: **50**.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Permanecem os avisos existentes dos assets `wing-left.svg`/`wing-right.svg` e avisos Node de detecção automática de módulo nos testes que importam TypeScript.
- Verificação de whitespace dos arquivos rastreados do lote aprovada, considerando CRLF como final de linha.

Os testes novos cobrem potência e evolução, compra persistida sem cobrança repetida, redução de deslocamento, coexistência de lentidões, limite/prioridade de alvos, três impactos, interrupção ao matar, capacidade/reflexão/expiração do escudo, recompensa por reflexão, cone e fronteiras, pulsos/renovação da queima, morte/saída, rejeições sem cobrança e AUTO/MANUAL. Testes de suporte indisponível passaram a usar Haste; o Escudo agora tem efeito e melhoria reais.

## Medições e limites

[Resumo estruturado e hashes](EVIDENCIAS_MAGO_INICIAL_2026-11-05.json).

- Matriz geral: **420 cenários**, sem alteração de resultado vitória/derrota/timeout em relação ao lote anterior; zero rejeições/casts vazios detectados. Mago manteve 32 vitórias, mas a média de duração dessas vitórias passou de **25,58s para 29,32s**. Alinhar fórmulas reduziu sua velocidade nesta amostra; isso precisa entrar na calibração, não ser apresentado como melhoria de balanceamento.
- Matriz inicial do Mago: **48 lutas**, três escolhas de truque no nível 5 e nove combinações no nível 10, mundos 1/2 e duas sementes. Resultado: **24 vitórias, 18 mortes e 6 timeouts**, sem rejeições ou casts vazios.
- No nível 10, as combinações com Escudo tiveram seis vitórias e seis timeouts, sem mortes. As combinações com Mísseis ou Orbe tiveram seis vitórias e seis mortes cada. Esses resultados indicam uma diferença de sustentação na amostra; não demonstram equilíbrio nem progresso obtido no farm.

Fixtures em memória, recursos fornecidos, equipamento inicial e nenhuma compra na matriz de escolhas. Não havia medição anterior das mesmas 48 escolhas para afirmar melhora de vitória. Os chefes e custos não foram alterados para favorecer o resultado. Relatórios brutos em `scratch/runtime/mage-initial-combat.json` e `scratch/runtime/mage-initial-loadouts.json`, fora do Git.

Reprodução na raiz:

```powershell
npm run test:mage
npm run test:server
npm run test:skills
npm test
npm run build
npm run benchmark:mage -- E:/MagicForge_Universe/scratch/runtime/mage-replay.json
npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/mage-combat-replay.json
```

## Apresentação e execução local

Prévia isolada em `/tests/mage-initial-preview.html`, usando o renderer e a geometria reais com entidades simuladas, sem conta ou banco. Conferidos cone para direita/cima e largura de celular 393×852, sem erros no console observado. Capturas: `scratch/evidence/mage-initial-desktop.jpg` e `scratch/evidence/mage-initial-mobile.jpg`.

Backend foi ativado sem conexões estabelecidas e backup consistente em `scratch/runtime/before-mage-initial-1793884993561.db`. Após a interrupção da sessão, os dois serviços estavam parados e foram restaurados: health online a 20 Hz e prévia HTTPS respondendo 200. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos idêntico ao backup antes da atualização; 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira.

Pendente testar com personagem real de nível 10 no desktop/celular, sobretudo Escudo, ordem automática, seleção do cone e reconexão. A prévia isolada não substitui gameplay real. Unity não foi alterado nem compilado; suporte à geometria/status novos nesse cliente e balanceamento com equipamento/farm reais continuam pendentes.

Próximo lote: Nevasca Glacial, Relâmpago em Cadeia e Haste, de nível 25. Não declarar as 12 habilidades do Mago concluídas.

## Arquivos deste lote

- Novos: `shared/src/mage-effects.ts`, `server/tests/mage-initial.test.ts`, `server/tools/benchmark-mage.ts`, `client/tests/mage-initial-vfx.test.mjs`, `client/tests/mage-initial-preview.html`, `client/tests/mage-initial-preview.ts`, este relatório e `Docs/EVIDENCIAS_MAGO_INICIAL_2026-11-05.json`.
- Alterados: `shared/src/index.ts`, `shared/src/skills.ts`, `shared/src/skill-targeting.ts`, `shared/src/skill-progression.ts`, `shared/src/messages.ts`, `server/src/entities/Entity.ts`, `server/src/game/World.ts`, `server/tests/skill-upgrades.test.ts`, `client/tests/skill-upgrades-ui.test.ts`, `client/src/renderer/PixelVfx.ts`, `client/src/renderer/PixelVfxPlayer.ts`, `client/src/pixel/pixel-arena.ts`, `server/package.json`, `package.json`, `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

A alteração na arena de prévia apenas completa o rótulo do novo tipo de VFX para manter o build válido. A pequena alteração na fila de VFX preserva efeitos visuais atrasados até sua apresentação; não modifica a simulação de combate.

Branch/worktree: `master`, `E:\MagicForge_Universe`. Sem commit/push deste lote. O commit documental `6c85f45`, da entrega da outra IA, foi preservado; a pasta de propostas e alterações anteriores não foram sobrescritas.
