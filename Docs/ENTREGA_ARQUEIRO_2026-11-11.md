# Arqueiro — efeitos das 12 habilidades

Entrega de 11/11/2026, branch `master`, raiz `E:/MagicForge_Universe`, sem commit/push. Implementação no servidor autoritativo e apresentação no cliente Web. Imagens continuam sob responsabilidade do colega; layout, assets existentes, banco ativo e Unity não foram alterados neste bloco.

## Resultado

As 12 habilidades deixam de depender do fallback genérico para seus efeitos. Custos, cooldowns e níveis de desbloqueio permanecem os mesmos. Os ataques preservam a base de nível **B = 6 + 4 × nível**, e agora usam os coeficientes próprios do catálogo. A base entra uma vez no total de uma rajada ou invocação, nunca uma vez por flecha/pulso.

| Habilidade | Regra implementada |
| --- | --- |
| Tiro Certeiro | B + 1,35 × DEX contra um alvo. |
| Flecha Venenosa | B + 1,1 × DEX no impacto; veneno adicional de 0,6 × DEX total em três pulsos de 1s. Renovar substitui o veneno anterior. |
| Tiro Desacelerador | B + 1,2 × DEX; lentidão de 40% por 4s. Usa a maior lentidão ativa, sem somar percentuais. |
| Marca do Caçador | Sem dano direto; o alvo recebe +25% de dano do próprio arqueiro por 8s. Evolução aumenta o percentual: 26,25% no rank 2, 48,75% no rank 20. Não é consumida por um acerto e não beneficia outros autores. Há uma marca desse tipo por alvo; uma nova aplicação substitui a anterior. |
| Rajada Tripla | B + 1,85 × DEX total, dividido em três disparos reais a cada 0,15s. |
| Armadilha de Espinhos | B + 1,4 × DEX; enraizamento de 2s. Movimento para, mas ataques ao alcance continuam permitidos. Não encurta enraizamento mais longo. |
| Chuva de Flechas | Impacto de B + 2,4 × DEX por alvo no ponto escolhido, raio de 5,5m. |
| Flecha Espectral Perfuradora | B + 2,55 × DEX por alvo em linha de 12m, largura de 3m. Não usa mais um círculo no ponto final; não atinge atrás da origem. |
| Manto da Furtividade | Oculta o herói dos monstros por até 3s. Próximo ataque ofensivo garante crítico e rompe a furtividade; também concede uma esquiva do próximo ataque básico inimigo dentro da janela de 3s. As duas garantias são consumidas separadamente. |
| Flecha da Fênix Solar | B + 4,2 × DEX + 1,5 × SAB por alvo em explosão de raio 8m no ponto escolhido. |
| Bombardeio das Tempestades | B + 4,7 × DEX total, dividido em dez disparos reais a cada 0,1s. Sem multiplicador adicional contra chefes. |
| Fera Guardiã Astral | Área fixa de raio 6m no ponto escolhido, por 12s. B + 4,2 × DEX total por alvo que permaneça nos 12 pulsos de 1s. Sem dano inicial e sem crítico. |

Veneno, intervalos das rajadas, largura da linha e interpretação operacional de furtividade/invocação são parâmetros autorais explicitados neste bloco. Não são apresentados como regras literais de D&D 5e nem como números finais de balanceamento.

## Ciclo dos efeitos

- Ataques e dano periódico respeitam a evolução de potência existente. A Marca evolui seu percentual. O Manto é um buff de duração/garantias fixas e não habilita compra de potência inútil.
- Rajadas capturam potência, crítico e bônus na conjuração e pagam uma única vez. Não perseguem outro monstro quando o alvo original morre. Encerram se o alvo sair do alcance da habilidade (+ tolerância existente de 0,5m), morrer ou deixar de existir. Elas continuam contando como dano periódico nos relatórios de combate.
- Rajada e Bombardeio usam status distintos e coexistem, sem apagar os disparos do outro slot. Outra aplicação do mesmo tipo renova/substitui o efeito anterior.
- Veneno captura sua potência na aplicação, não faz nova rolagem de crítico por pulso e considera a Marca ativa no momento do dano. Atualizações longas recuperam apenas os pulsos previstos dentro da duração.
- O enraizamento para a movimentação real do monstro, não congela o cooldown de seus ataques e não foi disfarçado de atordoamento.
- Monstros não adquirem o arqueiro oculto como alvo novo; podem escolher outro herói visível. Um monstro que já o perseguia pausa rastreamento/ataque durante a ocultação. O próximo ataque básico ou conjuração ofensiva rompe o Manto. Marca e Fera não consomem a garantia de crítico.
- No AUTO, o ataque básico pode acontecer no mesmo tick do Manto e romper a ocultação imediatamente, aproveitando o crítico. Isso não desliga o combate automático. Desligar AUTO de habilidades mantém ataques básicos; efeitos já aplicados continuam até encerrar.
- A esquiva garantida cobre um ataque básico inimigo, não veneno, reflexão ou todos os danos por 3s. O servidor envia evento de esquiva com dano zero e remove a garantia após o uso.
- Veneno, marca e raiz são limpos na saída/morte do autor. Rajadas e invocação também encerram com a morte/saída do arqueiro. Estados temporários não são persistidos como buffs offline.
- Fera usa uma área espiritual fixa, com entrada/saída de inimigos avaliadas a cada pulso. **Não foram criados tigre independente, navegação, aggro ou IA de pet.** A descrição do catálogo informa essa representação. Seu visual é área/status e impactos; arte final/animação da criatura continuam pendentes.

## Apresentação

Novos status: `POISON`, `HUNTERS_MARK`, `ROOT`, `STEALTH`, `AMBUSH_CRITICAL`, `EVASION_READY`, `ARROW_VOLLEY`, `STORM_BARRAGE` e `ASTRAL_GUARDIAN`, pelo protocolo existente. Rótulos legíveis foram adicionados ao renderizador. Não foi criado payload de combate paralelo.

Rajadas/veneno apresentam impactos nos pulsos autoritativos que causam dano; buffs não inventam impacto inicial. A área da Fera fica no centro confirmado pelo servidor e não acompanha o herói. Chuva/Fênix usam seu centro/raio; a Flecha Espectral usa origem, direção e dimensões da linha. Não foram gerados ou substituídos ícones.

## Verificação

- `npm run test:archer`: **30 testes do servidor + 5 de apresentação**, aprovados.
- `npm run test:server`: **235 testes aprovados**, incluindo os 30 do Arqueiro, após a última alteração.
- `npm run test:mage`: **34 testes TypeScript + 9 VFX**, aprovados.
- `npm run test:martial`: **27 testes do servidor + 23 de apresentação**, aprovados.
- `npm test`: **36 testes do cliente**, aprovados.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Permanecem os avisos anteriores de `wing-left.svg` e `wing-right.svg`.
- `git -c core.whitespace=cr-at-eol diff --check -- shared/src server/src client/src/renderer package.json server/package.json`: executado no fechamento.

Testes específicos verificam os 12 efeitos, bordas de áreas/linha, preço único, rank, potência capturada, origem do dano, pulsos atrasados, renovação, sobreposição de rajadas, morte/saída do autor, reflexão, alvo perdido, boss morto pelo veneno com recompensa/portal únicos, stealth/aggro multiplayer, crítico e esquiva de uso único, ausência de cobrança em rejeições e execução automática.

## Medição contra chefes

`npm run benchmark:archer -- E:/MagicForge_Universe/scratch/runtime/archer-loadouts-2026-11-11.json`

474 fixtures: três Truques no nível 1/mundo 1; nove builds no nível 10/mundos 1–2; 27 no nível 25/mundos 2–3; 81 no nível 50/mundos 3–4; duas sementes. Usa arma inicial, níveis fixados e recursos fornecidos pela fixture, sem compras. **Não é progressão com recursos obtidos no farm.**

| Nível | Cenários | Vitórias | Mortes | Timeouts |
| --- | ---: | ---: | ---: | ---: |
| 1 | 6 | 3 | 3 | 0 |
| 10 | 36 | 36 | 0 | 0 |
| 25 | 108 | 108 | 0 | 0 |
| 50 | 324 | 324 | 0 | 0 |

Sem rejeições e sem conjurações classificadas como vazias nesse comparador. As vitórias não provam equilíbrio: equipamento, nível e estoque são fornecidos; as fórmulas herdadas de crítico/esquiva por DEX em níveis altos continuam muito favoráveis ao Arqueiro e não foram recalibradas. Balanceamento, farm longo, equipamentos e sessões humanas permanecem pendentes.

Evidência resumida com hashes: `Docs/EVIDENCIAS_ARQUEIRO_2026-11-11.json`. Relatório completo e logs em `scratch/runtime/archer-*`.

## Arquivos e continuidade

- Compartilhado: novo `shared/src/archer-effects.ts`; alterados `shared/src/index.ts`, `messages.ts`, `skills.ts` e `skill-targeting.ts`.
- Servidor: `server/src/game/World.ts`, `server/src/entities/Entity.ts`, `Monster.ts`; novos `server/tests/archer-effects.test.ts` e `server/tools/benchmark-archer.ts`.
- Cliente: `client/src/renderer/PixelVfx.ts`, `PixelVfxPlayer.ts`; novo `client/tests/archer-effects-vfx.test.mjs`.
- Scripts: `package.json` e `server/package.json`.
- Documentação: este arquivo, JSON de evidências e anotação no `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`.

Com este lote, são cinco classes com os 12 efeitos implementados segundo seu catálogo atual: Guerreiro, Bárbaro, Clérigo, Mago e Arqueiro. **Próximo foco mecânico: Monge; depois Bruxo.** O compilado visual criado antes deste lote é uma captura anterior e ainda descreve o Arqueiro como parcial; para o estado mecânico atualizado, usar esta entrega. Arquivos locais anteriores e o arquivo `.rar` do usuário foram preservados.
