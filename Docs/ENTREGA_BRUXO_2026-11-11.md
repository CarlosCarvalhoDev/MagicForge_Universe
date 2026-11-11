# Bruxo — efeitos das 12 habilidades e fechamento das sete classes

Entrega de 11/11/2026, branch `master`, raiz `E:/MagicForge_Universe`, sem commit/push. Implementação no servidor autoritativo e apresentação no cliente Web. Imagens, layout, banco ativo, arquivos Unity e alterações locais anteriores foram preservados.

## Habilidades

Ataques que ainda usavam o fallback preservam a base **B = 6 + 4 × nível**, agora com coeficientes próprios. Toque Vampírico mantém sua implementação anterior de 2,5 × CAR, sem acrescentar B. Custos, cooldowns, slots e desbloqueios não mudaram.

| Habilidade | Regra implementada |
| --- | --- |
| Rajada Mística | B + 1,45 × CAR contra um alvo. |
| Toque Necrótico Drenante | B + 1,25 × CAR; reduz cura recebida em 50% por 4s. Não concede autocura. |
| Orbe de Praga Sombria | B + 1,3 × CAR no impacto e 0,6 × CAR adicional total em quatro pulsos de 1s. Renovar substitui a praga. |
| Maldição de Bruxaria | Sem dano direto. Por 8s, amplifica todo dano recebido pela presa em 25% e regenera 8% do HP máximo do Bruxo no total, em oito pulsos, enquanto a presa viver e a maldição pertencer ao autor. Evolução aumenta percentual e cura. |
| Armadura Gélida de Agathys | Escudo de 20% do HP máximo por 6s. Cada ataque com absorção positiva retalia 1,5 × CAR, inclusive no golpe que quebra o escudo. Evolução aumenta absorção e retaliação. |
| Tentáculos de Hadar | B + 1,7 × CAR por alvo em área de 4,5m; raiz de 1,5s, sem impedir ataques básicos ou encurtar raiz mais longa. |
| Fome Voraz de Hadar | Área fixa de raio 5,5m por 6s. Seis pulsos dividem B + 2,4 × CAR total por alvo, sem crítico. Aplica cegueira enquanto o inimigo estiver na área. |
| Toque Vampírico da Alma | 2,5 × CAR com evolução, crítico e bônus de dano; cura 50% do HP efetivamente retirado. Sem cura por overkill ou dano absorvido. |
| Salto das Brumas Etéreas | Teleporta a um ponto no chão até 6m; explosão de B + 2,2 × CAR em raio de 3,5m na posição de partida. Sem inimigos, ainda pode ser usado para deslocar. |
| Singularidade do Vazio | Puxa inimigos vivos originalmente dentro de 8m do ponto escolhido para o centro, atualiza posição/grid e causa B + 4,3 × CAR por alvo. |
| Lorde Demônio Maior | Presença demoníaca em área fixa de 6m por 10s. Dez pulsos dividem B + 4,5 × CAR total, sem crítico e sem dano inicial. |
| Palavra de Poder: Agonia | Principal recebe B + 4,9 × CAR; os demais inimigos em 6m recebem B + 2,5 × CAR. O principal não recebe os dois valores somados. Não existe morte instantânea adicional. |

Tempos, percentual de regeneração, absorção e interpretação de invocação antes ausentes foram explicitados em `shared/src/warlock-effects.ts` e no catálogo. São parâmetros autorais iniciais, não equivalência literal a D&D 5e ou calibração final.

## Contratos e casos de borda

- Redução de cura é aplicada em `Entity.heal()`, com piso inteiro quando há penalidade; não altera HP de respawn, que não é uma cura. A cura normal das outras classes permanece igual sem o debuff. Os monstros atuais não têm uma rotina geral de cura recorrente; o efeito já atua sobre a operação de cura da entidade.
- Praga captura potência, evolução e bônus na aplicação; não rola crítico por pulso. Pulsos atrasados não ultrapassam os quatro previstos e encerram com morte/saída do autor.
- Hex beneficia dano de qualquer autor, ao contrário da Marca do Caçador. Caso ambos se apliquem ao mesmo dano, seus multiplicadores são compostos. Há uma presa ativa por Bruxo e uma instância desse tipo de maldição por alvo: trocar presa limpa a anterior; Hex de outro Bruxo substitui a marca do alvo e encerra a regeneração do autor antigo.
- Regeneração de Hex não exige permanecer próximo da presa, mas exige presa viva, presente e com a maldição do autor. Não continua depois de perda da marca, morte ou desconexão. A cura respeita HP máximo e penalidades de cura recebida.
- Agathys usa o mecanismo de escudo existente. A retaliação é fixa por ataque com absorção, não proporcional ao dano recebido; não recebe crítico nem multiplicador genérico de dano. Pode acontecer no golpe de quebra, mas não depois da quebra/expiração, não ocorre sem atacante válido e não produz cadeia de reflexões. Melhoria de potência foi habilitada no Grimório e validada por compra persistida.
- Raiz não é atordoamento. Tentáculos não encurtam uma raiz mais longa já ativa.
- Cegueira da Fome adiciona uma rolagem independente de falha de 50% aos ataques básicos; esquiva do defensor e esquiva garantida continuam sendo respeitadas. Não paralisa ou impede perseguição. Sair da área remove cegueira. Áreas sobrepostas não acumulam a penalidade e a cobertura de outro autor é preservada quando um sai.
- Brumas valida finitude do destino calculado, altura, distância e limites antes de gastar. Sem ponto escolhido, usa a direção atual. No AUTO, tenta deslocar-se para longe da presa e limita o destino ao mapa; se não houver deslocamento útil, o ciclo pode escolher outra habilidade. Não é uma IA nova de kiting.
- O ataque básico agora revalida distância depois da conjuração, pois um teleporte pode mudar o alcance no mesmo tick. Isso evita acertar com a distância anterior à fuga.
- Singularidade valida o centro no chão e dentro do mapa. Só puxa os inimigos selecionados na área original; não incorpora inimigos extras depois do puxão. O centro pode afetar chefes, conforme a descrição atual, sem imunidade adicional inventada.
- Agonia aceita alvo explícito; por ponto, escolhe o inimigo mais próximo do centro, com desempate por ID. O evento transmite esse principal e os resultados reais por alvo.
- Fome e Demônio são áreas fixas; entrada/saída de inimigos é avaliada por pulso. Terminam na morte/saída do autor. **O Demônio não é uma entidade independente com navegação, aggro ou IA de pet.** Essa representação consta na descrição atual; arte e animação final continuam pendentes.

## Apresentação e medição

Novos status: `HEAL_REDUCTION`, `DARK_PLAGUE`, `HEXED`, `HEX_REGEN`, `HADAR_HUNGER`, `BLINDED` e `DEMON_PRESENCE`. A retaliação fixa é um campo interno do escudo; não cria outro sistema de combate.

Praga/áreas apresentam os impactos dos pulsos autoritativos; regeneração e Vampírico só apresentam cura quando ela acontece. Brumas apresenta a explosão na origem, mesmo com o personagem no destino. Há rótulos e áreas pelos componentes existentes; nenhum ícone foi gerado ou substituído.

Dois ajustes pequenos de apresentação acompanham a integração: buffs e teleporte não animam o próprio herói como se tivesse sido atingido; eventos de consumo de outros status não são rotulados como escudo quebrado. Golpes híbridos podem apresentar acerto no inimigo quando o resultado confirma dano.

O comparador de chefes passou a registrar `movementCasts`. Uma Bruma sem dano é útil quando o evento confirma deslocamento; não é classificada como cast vazio apenas por não ter acertado um inimigo. Isso não muda as regras ou recompensas do jogo.

## Validação

- `npm run test:warlock`: **29 testes de servidor + 6 de apresentação**, aprovados.
- `npm run test:server`: suíte completa final, **292 testes**, incluindo os 29 do Bruxo; resultado confirmado na entrega.
- `npm run test:archer`: **30 servidor + 5 apresentação**, aprovados.
- `npm run test:monk`: **28 servidor + 6 apresentação**, aprovados.
- `npm run test:mage`: **34 TypeScript + 9 VFX**, aprovados.
- `npm run test:martial`: **27 servidor + 23 apresentação**, aprovados.
- `npm test`: **36 testes do cliente**, aprovados.
- `node --test client/tests/cleric-ultimate-vfx.test.mjs`: **3 aprovados**.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite. Permanecem os avisos anteriores de `wing-left.svg` e `wing-right.svg`.
- `git -c core.whitespace=cr-at-eol diff --check -- shared/src server/src server/tools client/src package.json server/package.json Docs/ROADMAP_MECANICAS_IDLE_RPG.md`: conferido no fechamento.

Os totais se sobrepõem; não somar como testes distintos. Casos específicos cobrem as 12 habilidades, renovação, evolução, perda de autor, clipping de cura/dreno, redução de cura, Hex de dois autores, compra persistida de Agathys, absorção/retaliação sem cadeia, raízes, área fixa/cegueira, sobreposição, teleporte sem alvos e rejeições sem cobrança, revalidação do básico, puxão, principal/área de Agonia e chefes mortos por retaliação ou dano periódico sem recompensas repetidas.

## Bancada de combinações

```powershell
npm run benchmark:warlock -- E:/MagicForge_Universe/scratch/runtime/warlock-loadouts-2026-11-11.json
```

474 fixtures solo em SQLite em memória, duas sementes: três Truques no nível 1/mundo 1; nove builds no nível 10/mundos 1–2; 27 no nível 25/mundos 2–3; 81 no nível 50/mundos 3–4.

| Nível | Cenários | Vitórias | Mortes | Timeouts |
| --- | ---: | ---: | ---: | ---: |
| 1 | 6 | 0 | 6 | 0 |
| 10 | 36 | 21 | 6 | 9 |
| 25 | 108 | 65 | 9 | 34 |
| 50 | 324 | 318 | 0 | 6 |

Sem rejeições e sem casts classificados como vazios. São níveis fixados, arma inicial, ouro/estoques fornecidos e nenhuma compra. **Não são trajetórias de farm nem prova de equilíbrio.** Mortes/timeouts são diagnósticos, não motivo para forçar vitória por mudanças arbitrárias em chefes. Calibração deve comparar builds e investimentos obtidos na progressão real.

Evidência resumida com hashes: `Docs/EVIDENCIAS_BRUXO_2026-11-11.json`; relatório completo e logs em `scratch/runtime/warlock-*`. Não houve implantação/reinício de serviço ou validação com personagens reais neste bloco.

## Arquivos e próximo foco

- Novo `shared/src/warlock-effects.ts`; alterados `shared/src/index.ts`, `messages.ts`, `skills.ts`, `skill-targeting.ts` e `skill-progression.ts`.
- `server/src/game/World.ts`, `server/src/entities/Entity.ts` e `server/tools/BossInvestmentSimulation.ts`.
- `client/src/main.ts`, `client/src/renderer/PixelVfx.ts`, `PixelVfxPlayer.ts` e `GameRenderer.ts`.
- Novo `server/tests/warlock-effects.test.ts`; atualização do antigo teste de Agathys indisponível em `server/tests/combat-loop.test.ts`, preservando a guarda contra buff desconhecido.
- Novos `client/tests/warlock-effects-vfx.test.mjs` e `server/tools/benchmark-warlock.ts`; scripts nos dois `package.json`.
- Este documento, JSON de evidências e anotação no roadmap.

Com este lote, **as sete classes têm os 12 efeitos implementados conforme as descrições atuais das entregas**: Guerreiro, Bárbaro, Clérigo, Mago, Arqueiro, Monge e Bruxo. São 84 habilidades; isso não significa que todas tenham arte exclusiva, balanceamento final ou representação como entidade invocada.

Próximo foco: retomar **farm → melhoria → chefe**, incluindo gestão seletiva dos excedentes do inventário e rotas de equipamentos. Continuam pendentes calibração com recursos reais do farm, validação visual em sessão de jogo, imagens finais e paridade com Unity. Os compilados anteriores são capturas anteriores a estes lotes de Arqueiro/Monge/Bruxo; esta entrega e o roadmap descrevem o fechamento mecânico atualizado. Sem commit/push; alterações anteriores e o `.rar` do usuário preservados.
