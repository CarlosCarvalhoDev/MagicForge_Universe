# Revisão das animações existentes — 27/10/2026

Escopo: Guerreiro, Clérigo e Bárbaro; 15 folhas, inicialmente 66 quadros, 68 no pacote experimental com caminhada de oito quadros do Clérigo. Trabalho do Codex na frente visual, em `master`, no diretório `E:\MagicForge_Universe`. Nenhum commit efetuado. Alterações prévias dos demais agentes preservadas.

## Entrega atual — V4.1 aprovada e integrada

Em 27/10/2026, o usuário aprovou a caminhada completa na prévia: "sim fico bom". Foi promovida a revisão `walk_v4_1` aos destinos canônicos de Web, Unity e Docs: `iso_hero_clerigo_walk_sheet.png` e `frames_individuais/iso_hero_clerigo_walk_00.png` até `_07.png` em cada destino (27 PNGs). Antes da cópia, todos os destinos foram conferidos contra os hashes da V2 arquivada; nenhuma alteração concorrente foi encontrada nesses arquivos. Os `.meta` da folha e dos oito frames, assim como `Clerigo.asset`, ficaram idênticos byte a byte. Nenhum código de gameplay, servidor ou rede foi alterado nesta promoção.

Atualizados também os rótulos de `client/animation-review.html`, este relatório e o README de `Revisoes/walk_v4_1`, além da nota do guia mestre. Mantidos oito quadros, grade 4×2, células 512 px e 12 FPS. Os testes estruturais verificam as três cópias idênticas, fatias, GUIDs e referências; a aprovação artística é do usuário. Unity Play Mode permanece pendente. Branch `master`, worktree original, sem commit.

Validação após a promoção: `Docs/Test-ClericWalkStructure.ps1` passou com revisão ativa `walk_v4_1`; `node --test tests/hero-animations.test.mjs` passou 8/8; TypeScript estrito isolado da prévia passou. `npm.cmd run build` falhou nos mesmos cinco erros de equipamentos/refino em `main.ts` e `ClientNetwork.ts` detalhados no histórico abaixo, antes da etapa Vite. `git diff --check` do guia passou, com aviso de conversão LF→CRLF. Não houve correção desses arquivos de integração nesta tarefa.

## Histórico V4 — orientação da pose base aprovada

O usuário aprovou explicitamente a nova orientação corporal: tronco e quadril em três quartos SE, cabeça acompanhando a direção, braço direito com cajado à frente e braço esquerdo atrás. A aprovação refere-se à pose base, não ao ciclo inteiro. A V3 foi rejeitada por manter o tronco excessivamente frontal da pose de idle.

Foram desenhados oito quadros V4 e preservados em `Revisoes/walk_v4`, com fontes, prompts e manifesto. Na inspeção dessa primeira montagem, os contatos 1 e 5 ficaram semelhantes demais. Uma revisão das poses 4, 5 e 6 está em `Revisoes/walk_v4_1`: a perna próxima cruza à frente no segundo contato, enquanto a outra recua. Os demais cinco desenhos foram preservados. A prévia usa essa revisão a 12 FPS; a primeira montagem continua arquivada. Não promover a montagem inicial como animação final.

Arquivos desta rodada: novos PNGs e manifestos em `Revisoes/walk_v4` e `Revisoes/walk_v4_1`, prompts exatos em `generation-prompts.json` de cada pasta; base e folhas versionadas em `client/public/assets/isometric/review`; atualização de `client/animation-review.html`, `client/src/review/animation-review.ts`, `Docs/Test-ClericWalkStructure.ps1` e deste relatório. Criação/edição via ferramenta integrada `image_gen.imagegen`; somente redução proporcional e montagem técnica pelo script PowerShell.

Os assets canônicos continuam na V2 experimental reprovada, preservados nesta rodada. A nova orientação está sendo revisada na página independente antes da substituição dos destinos de gameplay. Não houve mudança de GUIDs ou `.meta` nesta rodada.

Verificação atual: `node --test tests/hero-animations.test.mjs`: 8/8 passaram. TypeScript estrito isolado da prévia (`tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --strict src/review/animation-review.ts`) passou. A checagem TypeScript geral encontrou cinco erros da integração em andamento: comparações `number` × `EquipmentSlot` em `main.ts` (800/801), `newLevel` ausente em `S2CRefineResultPayload` (2217), e tipo `S2CRefineResultPayload` sem import em `ClientNetwork.ts` (76/418). Esses arquivos/contratos não foram corrigidos na tarefa de sprites; o build completo depende dessa checagem. O teste estrutural passou para V2/V3/V4/V4.1, com V2 ainda ativa. No navegador: 19/19 folhas/versões carregadas, controles em 1× e 0,5× e seleção manual do segundo contato. A fluidez e o fechamento 8→1 ainda exigem avaliação visual; os testes estruturais não certificam qualidade artística. Unity Play Mode não executado.

## Histórico após avaliação do usuário — V2 reprovada, V3 candidata à época

A V2 do walk do Clérigo foi redesenhada em oito poses, montada em 4×2 células de 512 px (2048×1024) e integrada experimentalmente nos três destinos, a 12 FPS. A duração permanece em 667 ms. O GUID da textura, os seis spriteIDs/fileIDs existentes e os GUIDs dos seis frames individuais foram preservados; foram adicionados dois quadros e suas referências. A versão de seis quadros, seus metadados e o estado anterior do ScriptableObject ficaram arquivados em `Revisoes/walk_v1`.

**O usuário reprovou a V2 em movimento:** a alternância das pernas existe, mas os contatos avançam em diagonais divergentes, dando impressão de samba/zigue-zague. A verificação estática dos contatos foi insuficiente. O pacote não deve ser classificado como animação finalizada por ter mais quadros ou metadados corretos.

Foi preparada uma **V3 somente para a prévia**, refazendo os quadros 1, 2, 3, 7 e 8 para orientar as botas na mesma diagonal SE do tronco, reduzir a abertura lateral e evitar sola de bota apresentada como chute para a câmera. Os quadros 4, 5 e 6 foram mantidos da V2. Essa candidata está em `Revisoes/walk_v3` e em `/assets/isometric/review/clerigo_walk_v3_sheet.png`; **não foi promovida aos assets canônicos de Web/Unity**. A revisão deve avaliar continuidade de joelhos, apoio, trajetória e direção, além de comparar contatos isolados.

A página `/animation-review.html` abre pausada e permite comparar Clérigo selecionado × V2 reprovada lado a lado, além da vista das três classes. A V2 experimental ainda é a folha canônica em uso; a V3 está explicitamente rotulada como candidata. Não há alegação de que a direção ou a qualidade final estejam aprovadas. As fontes de 1280 px foram reduzidas proporcionalmente pelo mesmo fator para todos os quadros; não houve espelhamento ou deformação para simular a passada.

Ferramenta de criação: `image_gen.imagegen` integrada, em modo de edição. Os prompts exatos e os nomes dos arquivos gerados estão em `Revisoes/walk_v2/generation-prompts.json` e `Revisoes/walk_v3/generation-prompts.json`. O script `Docs/Build-SpriteSheet.ps1` registra hashes de fontes/frames em `packing-manifest.json` e recusa sobrescrever destinos ou aceitar fontes exatamente duplicadas.

Verificações desta etapa: `Docs/Test-ClericWalkStructure.ps1` passou para as duas revisões e para a integração experimental ativa, verificando dimensões, cópias, identificadores, coordenadas das oito fatias, referências, preservação dos demais campos do asset e GUIDs dos frames antigos. Os oito testes Node e a checagem TypeScript passaram. A compilação C# isolada dos três scripts de Core passou com os dois avisos preexistentes de `GetInstanceID`. Não foi executado Unity Play Mode. **Nenhum desses resultados certifica qualidade artística da caminhada.**

As seções abaixo registram a primeira revisão, anterior à integração experimental V2, e suas constatações históricas.

## Resultado e limite da entrega

Foram corrigidos problemas de reprodução no Web e alinhado o timing do cast no Unity. Foi criada uma prévia independente para revisão dos desenhos. **As três classes não estão certificadas como animações finais.** A caminhada do Clérigo tem defeitos artísticos que não foram resolvidos com segurança pelas candidatas geradas. As imagens e os `.meta` atuais foram preservados, sem substituições.

Abra `/animation-review.html` no cliente Web, por exemplo `http://localhost:5173/animation-review.html` durante o desenvolvimento. A página também é incluída no build de produção. Ela não importa a aplicação principal nem abre WebSocket: não altera conta, combate ou banco de dados.

## Auditoria estrutural

As 15 folhas passaram nas verificações de dimensões reais, número de fatias, pivô técnico, GUID e ordem de fileIDs nos arrays dos três ScriptableObjects. Os hashes das cópias em Docs, Unity e Web coincidem. Não foi necessário recortar novamente nem recriar metadados.

| Ação | Grade verificada | Dimensão | Quadros | Timing adotado |
| --- | --- | --- | --- | --- |
| Idle | 2×2 | 1024×1024 | 4 | 5 FPS, repete |
| Walk | 3×2 | 1536×1024 | 6 | 9 FPS, repete |
| Attack (Guerreiro/Bárbaro) | 3×2 | 1536×1024 | 6 | 11 FPS, 545 ms |
| Cast (Clérigo) | 3×2 | 1536×1024 | 6 | 9 FPS, 667 ms |
| Hit | 2×1 | 1024×512 | 2 | 10 FPS, 200 ms |
| Death | 2×2 | 1024×1024 | 4 | 7 FPS, 571 ms; mantém último quadro |

Todas as células medem 512×512. A leitura é por linhas, da esquerda para a direita. O pivô `(0.5, 0.15)` está configurado nos metadados; isso não comprova por si só que o contato desenhado dos pés permanece estável em todos os quadros.

## Observações artísticas

| Classe | Observação | Situação |
| --- | --- | --- |
| Guerreiro | Ataque, reação e queda apresentam poses distintas. A caminhada muda os membros e a posição da espada; é necessário lapidar a cadência e o encaixe entre o quadro 6 e o 1. Há contornos escuros perto de efeitos que devem ser avaliados sobre fundo claro. | Revisada; não aprovada como ciclo final |
| Clérigo | Na caminhada, o cajado aparece à esquerda da imagem nos quadros 1 e 4 e à direita nos quadros 2, 3, 5 e 6, enquanto a personagem continua orientada para o mesmo lado. A alternância completa das pernas não está clara. As demais folhas mantêm melhor continuidade do cajado. | Caminhada reprovada para aceite final; necessita redesenho |
| Bárbaro | Há mudança de posição e apoio das pernas entre as duas linhas, sem espelhar a tatuagem do corpo inteiro. Os intervalos entre poses, a pegada do machado e o fechamento do ciclo ainda precisam de refinamento visual; idle também alterna a empunhadura. | Revisada; não aprovada como ciclo final |

As demais ações das três classes foram inspecionadas nas folhas e disponibilizadas na prévia. A aprovação artística final exige observar as transições em movimento e corrigir os desenhos, além da configuração de FPS. Não se substituiu uma caminhada por oscilação de uma pose estática.

## Correções implementadas

### Web

- `HeroAnimations.ts` centraliza arquivos, grades, FPS e cálculo de quadros, consumidos pelo jogo e pela prévia.
- O relógio é individual por entidade e reinicia no quadro zero quando muda de idle para walk ou vice-versa. Antes, os loops usavam o tempo global da página.
- Ataque e dano usam quantidade de quadros dividida pelo FPS. O cast do Clérigo passou de 11 para 9 FPS.
- Uma morte recebida por snapshot começa no quadro zero. Ela não salta imediatamente para o cadáver final, não reinicia por eventos repetidos e termina no último quadro. O estado é liberado ao observar o renascimento autoritativo.
- Estados de entidades ausentes são removidos dos caches.
- PNGs que já têm alfa preservam esse alfa e seus detalhes escuros. O chroma key permanece como compatibilidade para imagens inteiramente opacas. Seu gradiente foi alinhado ao Unity; não se recriou alfa a partir da cor sobre um recorte já existente.
- A prévia oferece pausa, reinício, seleção de quadro, velocidade reduzida, fundo claro/preto/quadriculado, imagem original/tratada e guias do pivô. Clicando em uma miniatura, o mesmo número de quadro é mostrado nas três classes.

### Unity

- O controlador reconhece as fatias `_cast_` existentes para reproduzir o cast do Clérigo a 9 FPS, mantendo o array serializado `attackFrames` e suas referências.
- A duração de hit segue os 2 quadros a 10 FPS; eventos repetidos de morte não reiniciam a sequência.
- O tratamento de alfa preserva PNGs já recortados, com a mesma regra de compatibilidade do Web.
- Não foram criados Animator Controllers, cenas, prefabs ou novos GUIDs.

## Tentativas de correção artística

Foram feitas duas edições com a ferramenta integrada `image_gen`, conforme a skill `imagegen`, usando a caminhada do Clérigo como alvo e o idle como referência de identidade e empunhadura. Ambas foram **rejeitadas para integração**: mantêm melhor o cajado, mas não demonstram o ciclo de pernas solicitado e introduzem um halo/fundo amarronzado na apresentação. Os arquivos possuem alfa nas áreas vazias amostradas; não são classificados como imagens sem canal alfa.

As candidatas descartadas ficaram apenas em `C:\Users\cv_de\.codex\generated_images\01a17e58-e961-7972-ac5e-a5db9ac4f0a5\`, arquivos `exec-95df3556-3535-40bf-8cab-81ed2016896c.png` e `exec-b36efae2-f978-49cc-b8ec-be05bcc0af22.png`. Nenhuma delas foi copiada para os destinos de gameplay ou vinculada pelo código.

Especificação do primeiro prompt: editar a folha em 3×2 células de 512 px, preservar identidade/roupas/halo, manter o cajado na mão direita anatômica em todos os quadros, alternar contato direito/esquerdo nos quadros 1/4, incluir poses de passagem, manter direção SE, escala e pés próximos de `(256,435)`, fundo RGBA transparente, sem sombras, rótulos ou espelhamento do corpo.

Segundo prompt (texto enviado):

```text
Use case: precise-object-edit. Correct ONLY the WALK animation sheet of the cleric in image1, preserve her exact face, hood, costume, book, halo, art style and staff. Image2 is idle reference. Six different full-body drawings, 3 columns x2 rows, target1536x1024,512 square cells, top row frames1-3 bottom4-6. Real alternating biped walk. In TOP LEFT frame, the leg on VIEWER RIGHT is FORWARD and leg on VIEWER LEFT is behind. In BOTTOM LEFT frame, explicitly REVERSE: leg on VIEWER LEFT is FORWARD, leg on VIEWER RIGHT is bent BACKWARDS behind body. Frame2 and5 are distinct passing poses,3 and6 contrasting lifted leg poses. BOTH feet clearly visible and separated in ALL six drawings; raise robe hem slightly only if needed to show both knees. Do NOT keep viewer-right leg forward for all frames. Keep all six torsos facing same screen-right, no flipping whole character. Staff ALWAYS held in character's right hand on viewer LEFT, never swaps hands. No repeated frame. Fixed head size and body height, all grounded feet at y435 within cell. No redesign, no VFX, no background shading, no glows behind character, NO BROWN BACKDROP OR GRADIENT: true transparent alpha around all figures, preserve only the tiny halo glow. No grid, labels, ground, shadows. Need animation sprites rather than isolated similar poses.
```

## Validação executada

- `node --test tests/hero-animations.test.mjs`, em `client`: 7 testes passaram. Cobrem duração do cast/ataque, morte por snapshot, evento anterior ao snapshot, renascimento, relógios independentes, remoção de estado, clamp/loop e preservação/tratamento de alfa. Node 24.15.0 exibiu aviso de detecção de módulo TypeScript; nenhuma dependência ou tipo de módulo do pacote foi alterado para suprimir o aviso.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passou após corrigir a inclusão do campo `file` no registro de sheets carregados.
- `npm.cmd run build`: passou e gerou as entradas principal e `animation-review.html`.
- Compilação C# isolada com `dotnet` e `Data/DotNetSdkRoslyn/csc.dll` do Unity 6000.4.10f1, referências NetStandard 2.1, CoreModule e AIModule, compilando `BaseStats.cs`, `CharacterClassSO.cs` e `IsometricEntityVisual.cs`: passou. Houve dois avisos de obsolescência de `GetInstanceID`, já usado pelo código anterior. Saída de verificação fora do repositório.
- Navegador: 15/15 folhas carregadas, sem avisos/erros de console na revisão; cast identificado a 9 FPS, morte parada em 4/4, dano em 2/2 e pausa por miniatura em walk 4/6.
- `git diff --check` nos três arquivos rastreados modificados nesta tarefa: sem erros de whitespace.

Não foi executado Play Mode nem um build completo Unity. A compilação C# isolada não valida importação no Editor, renderização URP, vínculos de cena ou comportamento em dispositivos. Não se iniciou servidor nem se acessou o SQLite nesta revisão.

## Pendências antes de avançar para novas classes

1. Redesenhar o walk do Clérigo com cajado em mão fixa e seis fases de apoio/passagem verificáveis. Gerar ou desenhar cada pose controladamente é preferível a aceitar novamente uma folha com seis poses semelhantes.
2. Refinar o fechamento dos ciclos de caminhada de Guerreiro/Bárbaro, continuidade de empunhadura e estabilidade de escala/contato dos pés, usando a prévia para comparação.
3. Revisar bordas escuras e efeitos sobre fundos claros sem apagar partes escuras legítimas do figurino.
4. Validar no Unity Editor após a revisão artística. Manter os GUIDs/fileIDs existentes se forem aprovadas imagens substitutas de mesma grade.

Até essas pendências serem resolvidas, manter o pacote como **reprodução técnica corrigida / arte em revisão**, sem declarar as três classes finalizadas.
