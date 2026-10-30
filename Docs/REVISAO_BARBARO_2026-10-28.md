# Revisão do Bárbaro — 28/10/2026

Branch `master`, worktree original. Frente visual Codex; Antigravity continua em server/shared/rede. Nenhum commit, merge ou push nesta tarefa. Não tocar nas alterações de autenticação do outro agente.

## Diagnóstico e preservação

**Estado mais recente — V3 aprovada e integrada em 28/10/2026:** usuário: “ok esta bom”. Três sheets canônicos (Web/Unity/Docs) e o recorte walk_01 em cada destino atualizados; somente seis PNGs canônicos substituídos. Cinco quadros originais permanecem pixel-idênticos às fontes individuais anteriores. `.meta`, GUIDs/fileIDs, `Barbaro.asset`, grade e timing preservados. Arquivo `Revisoes/active-walk.json` registra a versão; backup dos três recortes substituídos em `walk_v3/pre-integration-frames`. V2 continua reprovada. As notas de avaliação abaixo são históricas. O aceite abrange esta caminhada SE, não idle/attack/hit/death ou novas direções; Unity Play Mode pendente.

Arquivos deste incremento: três `iso_hero_barbaro_walk_sheet.png`, três `frames_individuais/iso_hero_barbaro_walk_01.png`, aprovação/backup/hashes na revisão, HTML/TS da prévia, `Docs/Test-BarbarianReview.ps1`, README V3, este relatório e plano de continuidade. Auditorias V3/V2, Guerreiro V3 e Clériga passaram após integração. O teste de preservação foi ajustado para usar as fontes individuais arquivadas e autenticadas pelos hashes originais: algumas fatias do atlas legado já diferiam dos recortes individuais. Os demais arquivos do inventário permanecem iguais ao baseline. Sem mudanças em backend/shared/rede/banco, commits, merges ou pushes pelo Codex.

Validação final pós-integração: `npm.cmd run build` passou; `node --test tests/hero-animations.test.mjs` passou 8/8 (aviso Node preexistente de módulo sem tipo). No navegador, 27/27 folhas/versões carregadas, sem erros/avisos, e reprodução confirmada da opção “Em uso no jogo · V3”. Unity Play Mode não executado. Branch `master`, worktree original.

Cinco sheets existentes inspecionados: idle 4 quadros/2×2/5 FPS; walk 6/3×2/9 FPS; attack 6/3×2/11 FPS; hit 2/2×1/10 FPS; death 4/2×2/7 FPS. Células 512 px. PNGs originais têm fundo preto opaco. A folha walk perde a lâmina do machado no quadro 2 e varia pegada e escala. Idle alterna poses e pegadas amplas; ataque, dano e morte têm poses distintas e permanecem sem aceite específico. Não alterar todas as ações de uma vez.

Baseline em `Art/Isometric/Animations/Heroes/Barbaro/Revisoes/2026-10-28_baseline`: cinco folhas, cópias textuais dos `.meta` e `Barbaro.asset`; inventário com SHA256 dos 110 arquivos nos três destinos e class asset. `Test-BarbarianReview.ps1` verifica preservação integral, geometria, alpha e cópias de review. Guerreiro V3 e Clériga V4.1 preservados.

## V2 reprovada — não promover

Seis quadros individuais gerados pela ferramenta integrada `image_gen.imagegen`, com guias técnicos de pernas, fontes e prompts preservados em `Revisoes/walk_v2`. Folha 1536×1024, 3×2, 512 px, 9 FPS, RGBA. Somente a prévia referencia essa versão. Auditoria passou (110 arquivos canônicos preservados), build passou, Node 8/8 e navegador carregou 25/25 folhas. Esses resultados estruturais não validaram a direção da marcha.

**Feedback do usuário:** “a versão anterior mantém as pernas na mesma direção ... fica sambando ... com o tronco parado”. A V2 abriu lateralmente a trajetória das pernas e foi reprovada. Não repetir esse desenho nem restaurá-lo como candidata válida após perda de contexto. A prévia volta a iniciar na versão anterior e mantém a V2 identificada como reprovada.

## Próximo ajuste localizado autorizado

**Resultado posterior — V3 disponível para avaliação:** preservados cinco quadros originais, com igualdade de pixels confirmada pela auditoria. Somente o quadro 2 foi editado pela ferramenta integrada para reconstruir o machado; direção das pernas do original mantida como referência, sem redesenho completo do ciclo. Fonte gerada, prompt, seis fontes/quadros, sheet e manifesto em [walk_v3](./Art/Isometric/Animations/Heroes/Barbaro/Revisoes/walk_v3/README.md). Preto opaco legado mantido no empacotamento; a fonte RGBA gerada também foi preservada. Nenhum PNG canônico alterado.

Validação V3: `Docs/Test-BarbarianReview.ps1 -Version walk_v3` passou (cinco quadros pixel-idênticos, só o segundo diferente, 110 arquivos canônicos preservados). Também passaram auditorias V2, Guerreiro e Clériga e `npm.cmd run build`. Navegador carregou 26/26 folhas/versões sem erros/avisos; quadro 2 comparado e reprodução em 0,5×/1× conferida. V3 ainda depende de avaliação artística do usuário; Unity Play Mode pendente. Arquivos deste ajuste: `walk_v3`, PNG de review V3, HTML/TS da prévia, parâmetro/checagem de pixels na auditoria PowerShell, READMEs e documentação de continuidade. Sem alterações em servidor/shared/rede/Unity ou banco e sem commit.

Usar a caminhada anterior como base de direção, sem reabrir a passada e sem espelhar o corpo. Corrigir primeiro apenas a lâmina ausente do machado no quadro 2, tomando o quadro 1 como referência da arma e preservando pernas, tronco e posição das mãos do quadro 2. Os outros cinco quadros devem permanecer na sequência anterior. A nova versão ainda precisa ser inspecionada e comparada antes de promoção. Não prometer igualdade pixel a pixel da imagem reparada sem verificar; a edição generativa pode modificar detalhes não solicitados.

Arquivos desta tarefa até a reprovação: baseline, `walk_v2` com fontes/prompts/frames/sheet/guias/manifesto, cópias `barbaro_walk_baseline_sheet.png` e `barbaro_walk_v2_sheet.png` em Web review, HTML/TS da prévia e `Docs/Test-BarbarianReview.ps1`. Nenhum arquivo canônico, `.meta`, `.asset`, controlador, rede, servidor ou banco alterado. Unity Play Mode pendente.
