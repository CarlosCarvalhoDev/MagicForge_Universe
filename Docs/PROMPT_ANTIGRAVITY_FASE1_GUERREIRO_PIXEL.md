# Para o Antigravity — primeira fase com Guerreiro e VFX pixel art

Pode copiar este documento inteiro como instrução. Preparado pelo Codex em 28/10/2026 após leitura do código atual; conferir novamente antes de alterar, porque há trabalho paralelo não commitado.

## Objetivo e posse

O usuário escolheu fechar a primeira fase com **Guerreiro**, aproveitando as habilidades já estruturadas, e migrou a arte para pixel art. Entregar o ciclo real: login → selecionar/criar Guerreiro → combater → skills → drops/progressão persistidos → desafio do chefe → vitória/derrota/nova tentativa, conforme as regras autoritativas existentes. Não substituir o jogo pela simulação local de treino.

Antigravity: `server/src/**`, `shared/src/**` e `client/src/network/ClientNetwork.ts`. Codex: renderizador, assets, UI Web e integração visual. **Não editar `main.ts`, `index.html`, `client/src/ui/**`, `client/src/pixel/**`, `GameRenderer.ts`, `PixelWorld.ts`, `PixelAssets.ts` ou Unity nesta tarefa**; entregar contrato para Codex conectar. Se houver necessidade de fronteira, combinar handoff primeiro.

Ler `AGENTS.md`, `Docs/MIGRACAO_PIXEL_ART_CODEX.md`, `Docs/PRIMEIRA_ARENA_PIXEL_2026-10-28.md` e este documento. Conferir branch/status e diffs. Branch observada: `master`, worktree original, muitas mudanças dos colaboradores. Não resetar, apagar dados, sobrescrever mudanças, fazer commit/merge/push, comprar pacotes ou adicionar dependências sem a autorização correspondente. Preferir worktree independente se houver sobreposição. Usar banco temporário/em memória nos testes; não alterar `server/data/magicforge.db` compartilhado para criar fixtures.

## Fonte de verdade das skills

`shared/src/skills.ts` atualmente define **12 skills únicas do Guerreiro**, três opções por slot. `getDefaultSkillsForClass` escolhe a opção 1 de cada slot. Há quatro aliases `guerreiro_1..4` apontando para essas mesmas definições; não contar os aliases como quatro habilidades novas. `getSkillsForClass` deduplica corretamente.

Snapshot de apoio: `Docs/GUERREIRO_SKILLS_SNAPSHOT_2026-10-28.json`, exportado diretamente dessas funções. Não promover esse JSON a um segundo banco de balanceamento: o código shared permanece a fonte.

| Slot / nível atual | ID | Nome atual | Energia | CD (s) | VFX desejado (proposta visual) |
|---|---|---|---:|---:|---|
| 1 / 1 | guerreiro_truque_1 | Golpe Firme | 10 | 2,5 | corte curto + impacto no alvo |
| 1 / 1 | guerreiro_truque_2 | Golpe Dilacerante | 12 | 3,2 | corte vermelho; sangramento somente enquanto status confirmado |
| 1 / 1 | guerreiro_truque_3 | Corte de Ruptura | 15 | 3,8 | impacto de quebra; redução de armadura confirmada |
| 2 / 10 | guerreiro_nv1_1 | Retomar o Fôlego | 20 | 8 | pulso verde no próprio Guerreiro |
| 2 / 10 | guerreiro_nv1_2 | Postura Ofensiva | 22 | 7,5 | golpe/investida + aura curta de velocidade confirmada |
| 2 / 10 | guerreiro_nv1_3 | Escudo Desarmador | 25 | 7 | impacto + estrelas de atordoamento confirmado |
| 3 / 25 | guerreiro_nv2_1 | Redemoinho de Aço | 35 | 12 | corte circular, centro no conjurador, raio atual 5 m |
| 3 / 25 | guerreiro_nv2_2 | Baluarte Inquebrável | 40 | 14 | escudo acompanhando conjurador até expirar/quebrar |
| 3 / 25 | guerreiro_nv2_3 | Golpe Colossal | 38 | 13 | impacto no chão; conferir geometria linha versus raio 4 m |
| 4 / 50 | guerreiro_nv3_1 | Avatar da Guerra | 65 | 40 | onda inicial + aura de buff confirmada, raio atual 7 m |
| 4 / 50 | guerreiro_nv3_2 | Lâmina do Julgamento | 70 | 44 | lâmina vertical/impacto no centro autorizado, raio atual 5 m |
| 4 / 50 | guerreiro_nv3_3 | Última Resistência Imortal | 60 | 45 | cura + aura enquanto imunidade estiver ativa |

Os números acima são os encontrados, **não proposta de rebalanceamento**. Não desbloquear tudo no nível 1 para demonstrar VFX. Para QA, criar fixtures isoladas nos níveis 1/10/25/50. O antigo `Docs/SISTEMA_SKILLS_DND5E.md` descreve outro conjunto de quatro nomes/fórmulas e alguns comentários de `skills.ts` mencionam níveis antigos; reconciliar documentação e implementação sem alterar o design silenciosamente.

## Lacunas concretas encontradas: investigar/corrigir antes do handoff

1. `World.castPlayerSkill` hoje valida nível/CD/recurso, consome recurso, abre CD e então resolve alvo. Rejeitar slot não inteiro/fora de 1..4, skill de classe/slot incorreto, alvo morto/inválido e posição não finita/fora do alcance **antes** de consumir recurso ou aplicar CD. Manter tolerâncias de alcance deliberadas/documentadas, sem aceitar AoE em qualquer ponto enviado pelo cliente. Definir explicitamente se cast sem alvos válidos é permitido para cada categoria.
2. AoE usa `targetPos || player.position` sem verificação de alcance mostrada nesse trecho. Resolver no servidor o centro autorizado e a geometria: redemoinho centrado no Guerreiro; ultimate/queda na posição autorizada; linha de Golpe Colossal conforme design. Nunca usar o raio do VFX como área de dano.
3. O executor mostrado só separa `isHeal`, `isAoe` e dano de alvo único. **Baluarte**, com `isHeal=false/isAoe=false/range=0`, passa pela categoria de ataque em vez de ganhar escudo. Implementar categoria/efeito tipado e testar. Postura, sangramento, quebra de defesa, stun, reflexão, buffs e imunidade descritos também precisam de aplicação/expiração autoritativas; não retornar sucesso de status que só existe na descrição.
4. `calculateSkillPower` usa fórmula genérica por slot e uma fórmula única de cura, diferentes dos multiplicadores/percentuais nas descrições. Consolidar regras com os valores aprovados pelo projeto, registrar divergências e não apresentar fórmula descritiva como implementada sem teste. Não inventar novos números para acomodar uma imagem.
5. `castPayload.targetId` atualmente prioriza o ID pedido pelo cliente, mesmo quando o servidor escolhe outro alvo. Publicar o alvo/centro **resolvido**, os alvos efetivamente atingidos e resultados reais. Cura deve apontar ao conjurador. `damageOrHeal` é poder calculado, não necessariamente cura efetiva ou dano por alvo após clamp/mitigação; evitar usá-lo como saldo real em todos os casos.
6. Confirmar persistência do loadout e defaults ao entrar/reconectar; aliases antigos devem continuar legíveis. Autoridade continua a 20 Hz. Expirar/limpar status corretamente em morte, despawn, saída e reinício, evitando acumulação e duração infinita. Sem mudar esquema SQLite de forma destrutiva.

Estas são observações de leitura, não resultados de um teste de exploração ou autorização para reescrever a arquitetura inteira. Se o código tiver mudado, verificar se a correção já existe antes de duplicá-la.

## Contrato existente: conservar compatibilidade

- `C2S_CAST_SKILL=0x33`: `{slot, targetEntityId?, targetPosition?}`.
- `S2C_SKILL_CAST_EVENT=0x34`: `casterId, skillId, slot, skillName, targetId?, targetPosition?, damageOrHeal, isHeal, isCritical, affectedEntityIds, casterCurrentResource, casterMaxResource`.
- `C2S_EQUIP_SKILL=0x37`, `S2C_SKILLS_UPDATE=0x38`.
- `ClientNetwork.onSkillCastEvent` é callback por atribuição. Verificar o método de envio real antes de documentar sua assinatura. Não mudar opcodes já ocupados para acrescentar imagens.

Proposta para discutir/entregar como extensão tipada compatível (não é contrato já implementado):

- `castId` único + `serverTick` para deduplicação/timing;
- `originPosition`, `targetPosition` resolvida e direção autorizada; `radius`/geometria quando pertinentes;
- resultados por alvo: ID, posição do impacto, dano/cura efetivos, HP após impacto e morte. Necessário quando alvo morre/desaparece antes do próximo snapshot;
- status com ID estável, tipo, origem, alvo, duração/expiração autoritativa, intensidade/absorção restante e eventos de remoção/quebra. Pode usar o mecanismo existente se houver; não criar opcode novo sem auditoria de colisões;
- rejeições estruturadas para morto, nível, recurso, CD, slot/alvo/posição inválidos; nenhum VFX de sucesso para ação rejeitada.

Se dano continuar instantâneo, Codex deve mostrar confirmação curta ao receber evento. Se houver windup/impacto atrasado, o servidor deve fornecer a fase/timing e resolver o impacto; **o frame da espada nunca dispara dano no cliente**. Não introduzir atraso de gameplay só porque a animação tem oito quadros de 150 ms.

## Assets e VFX: estado real

- Guerreiro pixel já instalado: `client/public/assets/pixel/craftpix/hero/`, folhas de 64 px, quatro direções, manifesto em `PixelAssets.ts`. Ataque corporal **não é** VFX mágico independente.
- `client/public/assets/skills/` tem ícones legados, incluindo `guerreiro_1..4.png` e nomes numerados antigos. Os **12 caminhos exatos** `${skillId}.png` não existem nesta inspeção; a UI atual tenta esses caminhos e cai no emoji. Codex fará um mapa explícito de ícones. Não renomear ou usar um ícone quadrado como animação de impacto.
- Pastas VFX antigas consultadas não continham PNGs animados. Não afirmar que as magias já estão prontas no runtime.
- **Baixado:** `Imports/CraftPix/pixel-magic-effects.zip` (Free Pixel Magic Sprite Effects Pack). Inventário em `Imports/CraftPix/pixel-magic-effects-inventory.json` e no catálogo geral. 15 folhas em `1 Magic/`, dez ícones individuais e um atlas. As faixas têm altura 72 px e larguras 288/432/576; conferir células/timing reais antes de importar. O rótulo comercial 32×32 refere-se aos ícones, não prova célula de VFX de 32 px.
- Extraído apenas para inspeção em `Imports/CraftPix/extracted/pixel-magic/`; `contact.png` mostra uma amostra de cada folha, **não é uma animação nem pacote final**. `8.png` mostrou símbolo verde de cura na amostra e é candidata a Retomar o Fôlego. Outras amostras incluem raízes, anel roxo, raios/projéteis, petrificação e partículas. Confirmar animação completa/perspectiva antes de mapear. Não usar anel roxo para prometer escudo real ou chamar raio de corte de espada.
- Fonte/licença: https://craftpix.net/freebies/free-pixel-magic-sprite-effects-pack/ e https://craftpix.net/file-licenses/. Pacote gratuito para uso no jogo; não redistribuir biblioteca/ZIP. Não enviar arte CraftPix para geração/edição por IA.
- **Alternativa ainda NÃO baixada:** https://the-cooked-works.itch.io/cooked-fx — tema Pixel nativo 32 px, 12 FPS anunciados, metadados `anims.json`, variantes top-down de efeitos de contato. Tem slash/cross slash, impacto, cura, escudo, buff, stun e ground slam. Licença comercial gratuita com restrição de redistribuir os efeitos separados; ler LICENSE.pdf do download. Navegador devolveu HTTP 429, então não presumir arquivos locais nem inventar nomes/grades.
- **Outra alternativa online, NÃO baixada:** https://nerijs.itch.io/pvfx-foundry — 44 efeitos anunciados, CC0, grade de 96 px/5 colunas e 20 FPS, metadados próprios; inclui Crescent Slash, Earth Rupture, Radiant Heal e Arcane Parry. Pode exigir ajuste de escala/paleta. Não misturar automaticamente com CraftPix.

Codex selecionará/validará efeitos e criará manifesto visual por `skillId`; o backend não deve conhecer nomes de PNG. Os IDs lógicos da tabela são propostas de intenção visual, não afirmação de cobertura dos arquivos baixados.

## Ordem de entrega

1. Auditar o executor e consolidar as 12 definições/defaults, preservando IDs; corrigir validações e discrepâncias que impeçam skills funcionais.
2. Fechar primeiro o loadout padrão: Golpe Firme → Retomar o Fôlego → Redemoinho de Aço → Avatar da Guerra, respeitando níveis. Manter outras escolhas; indicar claramente as ainda não funcionais, sem liberá-las com promessas falsas.
3. Entregar evento real resolvido + erros e estados temporários para Codex plugar as imagens. Não editar UI para simular servidor.
4. Validar fase/mundo 1, chefe, loot e persistência já implementados sem reescrever o sistema. Não confundir fase 1/10 com mundo 1 inteiro; registrar qual ponto fecha a primeira entrega e como evolui até a fase 10/boss.
5. Entregar relatório com arquivos, comandos/resultados reais, DTOs finais e exemplo real capturado. Codex conecta os callbacks à UI e VFX na sequência.

## Testes mínimos de aceitação

- Conta nova de teste → Guerreiro → entrar no mundo apenas após seleção; slots preservados após reconexão.
- Níveis 1/10/25/50 em fixtures temporárias verificam bloqueio/desbloqueio dos quatro slots; três escolhas com ID/classe/slot corretos.
- Slot fracionado, 0/5, NaN; alvo inválido/morto/distante; coordenadas inválidas; sem energia/CD: rejeição e **zero gasto/cooldown/dano indevido**.
- Dano único não duplica, AoE atinge somente alvos válidos no centro autorizado; cura não excede HP; ausência de alvo segue regra explícita.
- Sangramento ticks/expiração, stun impede ação pelo tempo real, armadura restaura, escudo absorve/quebra, reflexão não entra em recursão, buff expira, imunidade termina e não revive morto automaticamente.
- Eventos identificam alvo efetivo, posição inclusive `(0,0,0)`, mortos/despawn, resultado por alvo e remoção de aura; duplicação/reconexão não reaplica dano.
- Testar que um cast do cliente de treino não chega ao multiplayer: `PracticeArena.ts` é local e não deve virar autoridade do jogo.
- Builds detectados em `shared` e `server`: `npm.cmd run build`; no Web também `npm.cmd run build`. Usar harness de testes existente que realmente se aplicar; não chamar o treino local de integração WebSocket/SQLite. Não prometer testes que não foram executados.

## Pendências do Codex após seu handoff

Conectar `onSkillCastEvent` a um player de VFX limitado/descartável, alvo/centro resolvidos, orientação sem deformar sprites, cores legíveis, escala pixel e remoção de auras por evento autoritativo. Corrigir no frontend o uso de `(0,0)` como sentinela de posição ausente e evitar indicar acerto em alvo rejeitado. HUD e ícones vêm do catálogo atual, sem inventar resultados/atributos no cliente.

Nesta rodada Codex preparou somente esta especificação, snapshot e aquisição/inventário de efeitos. Não modificou servidor, shared, rede, SQLite, UI ou mecânicas. Build de produto não necessário para essa entrega documental; o export do shared e a leitura dos PNGs/ZIP foram verificados. Validação em runtime das skills/VFX ainda pendente.
