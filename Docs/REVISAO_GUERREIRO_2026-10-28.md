# Revisão do Guerreiro — 28/10/2026

## Escopo e estado

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
