# Arqueiro — pacote básico V1 candidato

## Atualização: aprovado e integrado em 28/10/2026

O usuário aprovou o pacote V1: “esta bom”. Cinco folhas foram promovidas com hashes idênticos aos destinos canônicos Web/Unity/Docs. `HERO_SHEETS` inclui ARQUEIRO e a prévia usa esse manifesto. `Arqueiro.asset` recebeu somente cinco arrays de animação, com 22 referências. Cinco novos PNGs Unity têm GUIDs/spriteIDs próprios; metadados existentes, sprite estático e demais propriedades da classe preservados.

Arquivos adicionais desta integração: `Docs/Integrate-ArcherApproved.ps1`, `basico_v1/integration-approved.json`, cinco PNGs e manifesto em cada destino canônico, cinco `.png.meta` novos em Unity, `MagicForgeClient/Assets/Arqueiro.asset`, `client/src/renderer/HeroAnimations.ts`; atualizados prévia, auditoria e plano. O script recusa sobrescrita. `ArcherCandidate.ts` e as cópias de revisão permanecem arquivados, sem importação pela prévia ativa.

Build TypeScript/Vite passou, testes Node 8/8 e auditoria do Arqueiro passou, incluindo hashes das cópias, dimensões das fatias, GUIDs únicos e referências da classe. Unity Play Mode e combate/projétil ponta a ponta permanecem pendentes. Branch `master`, worktree original; sem commit. Os registros abaixo são anteriores ao aceite.

Data: 28/10/2026. Codex, branch `master`, worktree original, sem commit. Estado: **prévia para avaliação visual; não aprovado nem integrado ao gameplay/Unity**.

## Entrega e origem

O inventário encontrou sprite estático, retrato e habilidades do Arqueiro, mas não folhas de animação. A identidade foi baseada no sprite isométrico existente: elfo loiro, capuz e capa verdes, detalhes dourados, placas prateadas, aljava e arco rúnico. O retrato não substituiu essa referência.

Foram produzidas poses por geração de imagem, incluindo seis fontes individuais para a caminhada. O empacotamento técnico recorta, aplica uma transformação uniforme compartilhada pelos quadros de cada ação e organiza as células; não cria passadas por espelhamento, deformação ou reciclagem de uma pose estática. Fontes, prompts, transformações, hashes e manifesto estão em [basico_v1](./Art/Isometric/Animations/Heroes/Arqueiro/Revisoes/basico_v1/README.md). Tentativas com margens insuficientes foram substituídas antes do empacotamento.

| Ação | Quadros | Grade | Folha (px) | FPS da prévia |
|---|---:|---|---|---:|
| idle | 4 | 2×2 | 1024×1024 | 5 |
| walk | 6 | 3×2 | 1536×1024 | 9 |
| attack | 6 | 3×2 | 1536×1024 | 11 |
| hit | 2 | 2×1 | 1024×512 | 10 |
| death | 4 | 2×2 | 1024×1024 | 7 |

Todas as células são RGBA de 512×512. A normalização usa conteúdo inferior em Y=480 e centro horizontal técnico X=256; não realinha separadamente cada pé ou cada quadro. A queda naturalmente altera os contatos. A auditoria tolera alpha residual de até 1/255 nas bordas por interpolação bicúbica, não promete zero absoluto em todo pixel de borda.

## Arquivos desta tarefa

- `Docs/Art/Isometric/Animations/Heroes/Arqueiro/Revisoes/basico_v1/**`: fontes, 22 frames, cinco folhas, manifestos, hashes e documentação.
- `client/public/assets/isometric/review/arqueiro_basico_v1/*`: cinco cópias para revisão.
- `client/src/review/ArcherCandidate.ts`: definições exclusivas da prévia.
- `client/src/review/animation-review.ts` e `client/animation-review.html`: quarta classe e referência estática identificada explicitamente.
- `Docs/Prepare-ArcherCandidate.ps1`, `Docs/Test-ArcherCandidate.ps1`, este relatório e `Docs/PADRAO_FRENTE_VISUAL_CODEX.md`.

O manifesto de gameplay não recebe a candidata. Sprite canônico do Arqueiro, class asset, referências Unity e `.meta` foram preservados por hash. Nenhuma mudança desta tarefa em servidor, shared, rede, banco, Animator ou prefabs. As mudanças locais preexistentes dos colaboradores permanecem no repositório.

## Validação executada

- `./Docs/Prepare-ArcherCandidate.ps1`: empacotamento concluído.
- `./Docs/Test-ArcherCandidate.ps1`: passou para cinco ações/22 quadros, dimensões, frames distintos, margens, cópias Web e oito referências existentes preservadas. Hashes diferentes não comprovam qualidade de animação.
- `./Docs/Test-BarbarianReview.ps1 -Version walk_v3`, `./Docs/Test-WarriorReview.ps1 -Version walk_v3` e `./Docs/Test-ClericWalkStructure.ps1`: passaram.
- Em `client`: `npm.cmd run build` passou (TypeScript/Vite); `node --test tests/hero-animations.test.mjs` passou 8/8.
- Navegador: [prévia local](http://127.0.0.1:5173/animation-review.html) carregou 32/32 folhas/versões; seleção das cinco ações, seleção de quadro, reprodução e retenção do último quadro da morte verificadas. Console consultado sem erros/avisos. A aba antiga de localhost estava com conexão recusada; Vite foi iniciado em 127.0.0.1 e uma aba funcional foi deixada aberta.

## Avaliação pendente e próximo passo

Avaliar em movimento, sobretudo contatos alternados e passagem 6→1 da caminhada, orientação SE constante do corpo e pés, ausência de chute/abertura lateral, estabilidade do arco/aljava, mãos/corda/flecha no disparo e transições entre ações. O aceite ainda não foi dado; não apresentar a classe como finalizada. Inspeção geométrica e reprodução no navegador não substituem essa avaliação.

Após aceite, integrar incrementalmente as ações aprovadas ao Web e preparar Unity com os GUIDs existentes preservados, conferindo escala/pivô/timing e sincronização real do projétil. Unity Play Mode e teste de combate com o Arqueiro ainda não executados. Demais direções, ícones de habilidades e interface de Masmorras permanecem na fila, sem misturar escopos.
