# Revisão do Guerreiro — 28/10/2026

## Escopo e estado

**Aprovação e integração posterior — 28/10/2026:** usuário: “agora fico muito bom”. A caminhada SE V3 está ativa nos três sheets canônicos Web/Unity/Docs, com seis recortes 01–06 atualizados em Web/Docs e fontes 00–05 preservadas na revisão. Estado registrado em `Revisoes/active-walk.json`; recortes anteriores arquivados em `walk_v3/pre-integration-frames`. Manifestos Web/Unity identificam `walk_v3` e alpha. Grade 3×2, células 512 px e 9 FPS mantidos; nenhum `.meta`, GUID, fileID, `.asset` ou controlador alterado. A prévia identifica V3 aprovada e oferece seleção explícita da folha em uso. O aceite não inclui idle/ataque/dano/morte, direções adicionais ou Play Mode Unity. Os registros de “candidata não aprovada” abaixo são históricos.

Validação pós-integração: `Docs/Test-WarriorReview.ps1 -Version walk_v3`, a mesma auditoria sem parâmetro (V2) e `Docs/Test-ClericWalkStructure.ps1` passaram. A auditoria agora exige a caminhada aprovada de `active-walk.json`, os doze recortes sincronizados e os outros quatro sheets do baseline, preservando todos os metadados Unity. `npm.cmd run build` passou. Navegador carregou 23/23 folhas/versões e reproduziu a opção “Em uso no jogo · V3”. Arquivos deste incremento: três PNGs de sheet, doze recortes PNG existentes, dois `ANIMACOES_MANIFEST.json` (Web/Unity), arquivo `Revisoes/active-walk.json`, arquivo de hashes e cópias de backup dos recortes anteriores, HTML/TS da prévia, auditoria PowerShell, README V3, este relatório e ponto de retomada. Branch `master`, worktree original; sem commit/merge/push realizados pelo Codex. Play Mode Unity continua pendente.

**Atualização posterior: V3 de passo curto preparada somente para avaliação.** Detalhes em [walk_v3/README.md](./Art/Isometric/Animations/Heroes/Guerreiro/Revisoes/walk_v3/README.md). Seis fontes individuais e três refinamentos de contato/aproximação, gerados pela ferramenta integrada; redução uniforme para 512 px e grade 3×2 a 9 FPS. A prévia inicia V3 × V2 (a versão com chute), mantendo seleção da V2 e do baseline. Os contatos 1/4 foram inspecionados para distinguir as pernas; ainda é necessário validar naturalidade, altura dos apoios e fechamento em movimento. Tronco/arma/escudo mantidos como referência; pequenas diferenças generativas de contorno/brilho devem ser avaliadas, não presumidas idênticas.

Auditorias de V3, V2 e Clériga passaram, confirmando preservação dos assets em uso e referências Unity; Node 8/8; build passou após EPERM do sandbox e repetição autorizada fora dele. Navegador: 22/22 folhas, sem erros/avisos. Arquivos desta rodada: pasta `Revisoes/walk_v3` com fontes/frames/sheet/manifesto/prompts/guia/README; PNG V3 em `client/public/assets/isometric/review`; `client/animation-review.html`, `client/src/review/animation-review.ts`, parâmetro `-Version` em `Docs/Test-WarriorReview.ps1`, este relatório e o ponto de retomada. V3 não aprovada nem promovida. Branch `master`, worktree original, sem commit.

Primeiro pacote da ordem de arte aprovada: revisar os sheets existentes do Guerreiro, começando pela caminhada SE. Trabalho visual do Codex em `master`, worktree original `E:\MagicForge_Universe`; sem commit. Antigravity mantém servidor/shared/rede. Não houve alteração de autenticação, banco ou combate nesta tarefa.

As cinco folhas atuais foram inspecionadas e preservadas em `Art/Isometric/Animations/Heroes/Guerreiro/Revisoes/2026-10-28_baseline`, com hashes nos três destinos, `.meta` como cópias de texto e `Guerreiro.asset`. Walk/attack já tinham alterações locais anteriores: não foram revertidas nem sobrescritas. As cópias de cada sheet coincidiam entre Web, Unity e Docs.

| Ação | Grade real | Dimensões | Reprodução existente |
| --- | --- | --- | --- |
| Idle | 2×2 | 1024×1024 | 4 quadros, 5 FPS, loop |
| Walk | 3×2 | 1536×1024 | 6 quadros, 9 FPS, loop |
| Attack | 3×2 | 1536×1024 | 6 quadros, 11 FPS, uma vez |
| Hit | 2×1 | 1024×512 | 2 quadros, 10 FPS, uma vez |
| Death | 2×2 | 1024×1024 | 4 quadros, 7 FPS, mantém último |

## Diagnóstico inicial e candidata

A caminhada existente apresenta contatos pouco diferenciados entre as passadas, passagem de joelho insuficiente em parte da sequência, abertura lateral no último quadro e variação ampla da espada. O primeiro ajuste é uma candidata redesenhada em seis poses, preservando a grade e a duração de 667 ms, para comparação antes de qualquer promoção aos assets do jogo.

Identidade preservada como alvo: armadura prateada com detalhes dourados, capacete alado, capa carmesim com leão, espada ciano na mão direita próxima à câmera e escudo na esquerda distante. Cabeça, peito e quadril devem acompanhar SE. A espada é carregada baixa de forma estável, sem balanço de ataque durante caminhada.

Uma tentativa de transição produziu contorno extra de joelho/perna e foi rejeitada. Outras repetiram contato semelhante ou trocaram qual perna estava avançando; não usar essas tentativas como validação de alternância. Um diagrama técnico de pose foi criado como orientação para a edição por IA, nunca como sprite final. A arte é desenhada pela ferramenta integrada `image_gen.imagegen`; o empacotamento técnico usa redução proporcional uniforme, sem espelhamento ou deformação para inventar poses.

## Entrega da primeira candidata

Preparada `Art/Isometric/Animations/Heroes/Guerreiro/Revisoes/walk_v2` com seis PNGs, sheet, manifesto e prompts exatos da ferramenta integrada. A prévia usa cópias versionadas em `client/public/assets/isometric/review/guerreiro_walk_v2_sheet.png` e `guerreiro_walk_baseline_sheet.png`. A comparação do Guerreiro é a vista inicial da página; Clériga e três classes continuam disponíveis. Alterados `client/animation-review.html` e `client/src/review/animation-review.ts` somente para essa comparação. Não foi alterado o manifesto de gameplay.

**Qualidade ainda não aprovada:** conferir os contatos 1/4 e a extensão 6, especialmente a leitura de profundidade dos quadris cobertos pela armadura, a amplitude lateral e o fechamento do ciclo. Não declarar o Guerreiro finalizado nem promover esta candidata sem a avaliação em movimento.

Validação real: `Docs/Test-WarriorReview.ps1` passou, verificando seis fontes/frames únicos, grade 3×2, tamanho, cantos transparentes, cópia da prévia e preservação dos cinco sheets canônicos em três destinos, seus `.meta` Unity e do class asset. `Docs/Test-ClericWalkStructure.ps1` passou com V4.1 ainda ativa. `node --test tests/hero-animations.test.mjs` passou 8/8 (aviso Node preexistente de módulo sem tipo no package). `npm.cmd run build` passou, incluindo TypeScript e Vite. No navegador, 21/21 folhas/versões carregadas, sem erros/avisos de console; controles observados em 1×, 0,5× e quadro manual, além da comparação da Clériga e três classes/ataque. Esses resultados não certificam qualidade artística. Unity Play Mode não executado.

Arquivos criados/alterados desta tarefa: baseline e `walk_v2` em Docs, duas cópias PNG de review em Web, os dois arquivos de prévia acima, `Docs/Test-WarriorReview.ps1`, este relatório e o ponto de retomada em `Docs/PADRAO_FRENTE_VISUAL_CODEX.md`. Nenhum PNG canônico, `.meta`, script Unity, `.asset`, arquivo de servidor/shared/rede ou banco foi alterado pelo Codex nesta rodada.

## Próximas verificações

**Feedback recebido após a prévia:** o usuário confirmou troca correta das pernas e considerou corpo, espada e escudo bons. A passada ainda parece chute à frente e não está aprovada. Próxima alteração artística deve preservar as partes aceitas e reduzir a extensão/altura da passada, com flexão e contato mais naturais. Antes dessa correção, o usuário priorizou integrar os contratos de autenticação e Farm Helper entregues pelo Antigravity. Nenhum sprite foi alterado durante essa integração de UI.

- Inspecionar a candidata completa em movimento, especialmente profundidade das pernas, amplitude da passada, apoio, orientação dos pés e fechamento 6→1.
- Obter avaliação visual do usuário antes de substituir folhas em uso. Hashes diferentes e contagem de quadros não comprovam qualidade da passada.
- Revisar transições com idle/attack/hit/death e depois os desenhos dessas ações conforme necessário. Nesta rodada não há aprovação artística dessas quatro folhas.
- Unity Play Mode não executado; cenas, prefabs, Animator, `.asset` e `.meta` originais permanecem preservados.

O próximo pacote do plano geral continua sendo o Guerreiro até concluir esta revisão; depois Bárbaro, Arqueiro, direções e habilidades.
