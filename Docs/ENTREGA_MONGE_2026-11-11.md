# Monge — efeitos das 12 habilidades

Entrega de 11/11/2026 na branch `master`, raiz `E:/MagicForge_Universe`, sem commit/push. Implementação no servidor autoritativo e apresentação no cliente Web; imagens, layout e dados dos personagens preservados. Não há migração de banco ou implementação equivalente no Unity neste bloco.

## Habilidades

Os ataques usam **B = 6 + 4 × nível**, preservando a base do fallback anterior, com os coeficientes próprios abaixo. Em sequências, B entra uma vez no total, não uma vez por soco. Custos, cooldowns, slots e desbloqueios foram preservados.

| Habilidade | Regra implementada |
| --- | --- |
| Palma de Chi | Dois impactos reais, a cada 0,1s, dividem B + 1,35 × DEX. |
| Chute do Vendaval | B + 1,2 × DEX + 0,3 × SAB por alvo; alvo principal e até um secundário dentro de 3m do monge. |
| Golpe no Ponto Vital | B + 1,3 × DEX; frequência de ataque do alvo reduzida em 20% por 4s. Novos intervalos ficam 25% maiores; intervalo já iniciado não é recalculado. |
| Rajada de Golpes | Quatro impactos reais ao longo de 0,5s dividem B + 1,85 × DEX. |
| Passo do Vento Evasivo | Soma 35 pontos percentuais à esquiva e 15 ao crítico durante 5s, com teto de 100%. Não teleporta nem concede velocidade extra. Bônus fixos, sem compra de evolução de potência. |
| Cura do Lótus Celestial | Cura instantânea de 1,6 × SAB + 1,2 × DEX, evoluível, sem crítico e limitada à vida faltante. Não usa a antiga cura genérica de todas as classes. |
| Golpe Atordoante Celestial | B + 2,3 × DEX; atordoamento de 2,5s, sem encurtar um atordoamento mais longo. |
| Sopro do Dragão de Chi | Cone frontal de 5m e 60 graus: B + 2,4 × SAB + DEX por alvo. Não usa círculo no ponto final. |
| Dança das Sombras Ilusórias | Três impactos simultâneos por alvo, dividindo B + 2,2 × DEX total, em área de 4,5m. Sombras são golpes; não foram criadas entidades ou IA de invocação. |
| Palma dos Cinco Pontos | Impacto único de B + 4,6 × DEX + 2 × SAB. Sem execução por percentual de vida ou morte instantânea adicional. |
| Ascensão do Dragão Dourado | Impacto de B + 3,8 × DEX + 2 × SAB em raio de 8m no ponto escolhido; dobra corrida por 6s. |
| Domo do Vazio Sereno | Área fixa de raio 6m por 6s. Seis pulsos dividem B + 3,9 × SAB de dano por inimigo e 30% do HP máximo em cura própria; o monge só se cura dentro da área. Silencia habilidades dos inimigos dentro da zona. Sem crítico. |

Durações não especificadas no catálogo original, o percentual de regeneração do Domo e a interpretação em pontos percentuais do Passo são parâmetros autorais iniciais, explicitados em `shared/src/monk-effects.ts` e nas descrições atuais. Não se afirma equivalência literal a D&D 5e nem balanceamento definitivo.

## Contratos importantes

- Palma e Rajada pagam uma vez, capturam potência/crítico/evolução na conjuração e não escolhem outra vítima. Encerram se o alvo morrer, desaparecer ou sair do alcance (+ tolerância existente de 0,5m), ou se o autor for atordoado, morrer ou sair do mundo. Cada habilidade tem seu próprio status e as duas podem coexistir.
- A execução periódica dirigida já usada pelas flechas foi reaproveitada e renomeada de `updateArcherPeriodic` para `updateTargetedPeriodic`. Veneno e rajadas do Arqueiro mantêm seus contratos; atordoamento cancela apenas as sequências do Monge.
- Ponto Vital não diminui o dano do golpe nem congela o alvo. Seu debuff renova sem acumular e desaparece na saída/morte do autor.
- Passo afeta as rolagens reais de crítico e esquiva. Não ativa uma garantia de crítico/esquiva do Arqueiro, não altera duração ao evoluir e não permite compra de potência sem efeito.
- A corrida usa um multiplicador temporário nos dois caminhos de movimento do servidor (direção e destino), sem alterar o atributo base `speed`. Renovar não multiplica o bônus. Expiração, morte e saída devolvem a velocidade normal; limites do mapa continuam aplicados.
- O atordoamento próprio do Monge é limpo na saída/morte do autor. Um controle mais longo já ativo não é sobrescrito só para atribuí-lo ao Monge.
- Domo captura dano, cura e evolução ao ser aplicado. Bônus de dano aumentam somente o dano; não inflam a cura percentual. Pulsos recuperam atraso sem ultrapassar os seis previstos e sem causar dano/cura instantâneos adicionais.
- Domo não acompanha o personagem. Entrar/sair da área muda dano, cura própria e silêncio. A zona pode ser colocada em local vazio para regeneração manual. O automático a utiliza durante combate mesmo com HP cheio, pois ela também causa dano.
- Em sobreposição, os silêncios não se acumulam; se um autor sair e houver outro Domo cobrindo o alvo, a cobertura restante é mantida. Sair da zona, morte ou desconexão do autor limpam o efeito.
- Novos status: `CHI_PALMS`, `FLURRY`, `ATTACK_SLOW`, `WIND_STEP`, `DRAGON_STRIDE`, `ZEN_DOME` e `SILENCED`. O protocolo existente foi estendido; não há sistema paralelo de eventos.

## Limite do silêncio no PvE atual

Silêncio impede conjurar habilidades e não bloqueia movimento ou ataques básicos. A validação autoritativa rejeita conjuração de personagem silenciado com `CASTER_SILENCED`; o AUTO evita tentativas rejeitadas e mantém básicos. `Entity.canUseSkills()` expõe a mesma condição para executores de habilidades.

**Os monstros atuais atacam pelo caminho de ataques básicos e ainda não têm um executor de conjurações próprias.** Assim, recebem o status de silêncio do Domo, mas seus ataques básicos continuam funcionando. Não foi inventada uma paralisia para simular silêncio, nem criado um sistema novo de habilidades de chefes. Quando esse sistema existir, deverá consultar o bloqueio de habilidades da entidade.

## Apresentação e arte

- Impactos de Palma/Rajada chegam nos pulsos confirmados, sem dano visual inventado no início.
- Lótus apresenta cura somente quando o servidor confirma vida recuperada.
- Sopro usa origem/direção/cone confirmados; Ascensão usa o ponto e raio reais.
- Sombras apresentam os três impactos reais por alvo. Não há pet ou animação final de criaturas adicionados.
- Domo tem indicação de área fixa e efeitos separados de dano e cura; a cura acompanha a entidade do monge, não o centro da zona.
- Rótulos dos novos status foram adicionados ao renderizador existente. Ícones e layout não foram modificados. O colega pode continuar produzindo as imagens separadamente.

## Testes e bancada

- `npm run test:monk`: **28 testes de servidor + 6 de apresentação**, aprovados.
- `npm run test:server`: **263 testes aprovados**, incluindo os 28 do Monge.
- `npm run test:archer`: **30 testes de servidor + 5 de apresentação**, aprovados após o reaproveitamento do executor periódico.
- `npm run test:mage`: **34 testes TypeScript + 9 VFX**, aprovados.
- `npm test`: **36 testes do cliente**, aprovados.
- `node --test client/tests/cleric-ultimate-vfx.test.mjs client/tests/martial-effects-vfx.test.mjs client/tests/warrior-presentation.test.mjs`: **14 testes aprovados**.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Permanecem avisos anteriores de `wing-left.svg` e `wing-right.svg`.
- `git -c core.whitespace=cr-at-eol diff --check -- shared/src server/src client/src/renderer package.json server/package.json`: verificação no fechamento.

Os totais das suites se sobrepõem; não devem ser somados como testes distintos. Casos específicos cobrem impactos separados, custo único, renovação, sobreposição, clipping de cura, direção/borda do cone, dano SAB+DEX, velocidade efetiva nos dois modos de movimento, limites do mapa, debuff de frequência, controles sem encurtamento, cura/dano do Domo, entrada/saída da área, silêncio sem stun, dois autores, morte/saída e vitória de chefe sem recompensas repetidas.

Reprodução da bancada:

```powershell
npm run benchmark:monk -- E:/MagicForge_Universe/scratch/runtime/monk-loadouts-2026-11-11.json
```

474 fixtures solo em SQLite em memória, duas sementes: três Truques no nível 1/mundo 1; nove builds no nível 10/mundos 1–2; 27 no nível 25/mundos 2–3; 81 no nível 50/mundos 3–4.

| Nível | Cenários | Vitórias | Mortes | Timeouts |
| --- | ---: | ---: | ---: | ---: |
| 1 | 6 | 2 | 4 | 0 |
| 10 | 36 | 35 | 1 | 0 |
| 25 | 108 | 108 | 0 | 0 |
| 50 | 324 | 324 | 0 | 0 |

Zero rejeições e zero casts classificados como vazios nesse comparador. São níveis fixos, arma inicial e estoques fornecidos pela fixture, sem compras: **não representam progressão com recursos obtidos no farm nem equilíbrio final**. Crítico/esquiva por DEX em níveis altos continuam muito favoráveis às classes ágeis; essa fórmula herdada não foi recalibrada neste bloco.

Evidência com hashes: `Docs/EVIDENCIAS_MONGE_2026-11-11.json`. Relatório completo e logs locais em `scratch/runtime/monk-*`. Nenhum teste usou o banco ativo dos jogadores. Validação visual em sessão real, balanceamento, progressão longa e paridade Unity continuam pendentes.

## Arquivos deste bloco

- Novo `shared/src/monk-effects.ts`; alterações em `shared/src/index.ts`, `messages.ts`, `skill-targeting.ts` e `skills.ts`.
- `server/src/game/World.ts`, `server/src/entities/Entity.ts` e `Player.ts`.
- `client/src/renderer/PixelVfx.ts` e `PixelVfxPlayer.ts`.
- Novos `server/tests/monk-effects.test.ts`, `client/tests/monk-effects-vfx.test.mjs` e `server/tools/benchmark-monk.ts`.
- Scripts em `package.json` e `server/package.json`.
- Este documento, JSON de evidências e anotação no roadmap.

Alterações anteriores do Arqueiro/inventário e o arquivo `.rar` do usuário foram preservados. Não houve commit/push. São agora seis classes com os efeitos implementados conforme o catálogo atual; **próxima classe para fechar os efeitos: Bruxo**.
