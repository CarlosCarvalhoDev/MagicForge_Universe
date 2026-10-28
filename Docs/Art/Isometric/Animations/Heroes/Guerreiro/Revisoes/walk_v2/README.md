# Guerreiro walk V2 — candidata SE, não integrada

Seis desenhos individuais editados com `image_gen.imagegen` integrada, empacotados proporcionalmente em células 512×512, folha 3×2 (1536×1024), 9 FPS, ciclo de 667 ms. `generation-prompts.json` registra prompts exatos, fontes selecionadas e tentativas rejeitadas; `packing-manifest.json` registra hashes e coordenadas. Não houve espelhamento global nem deformação de pose no empacotamento.

Fases pretendidas, ainda sujeitas a inspeção visual: contato distante, passagem próxima, extensão próxima, contato próximo, passagem distante e extensão distante. A armadura cobre parte da ligação dos quadris: verificar se os contatos 1 e 4 realmente comunicam apoios opostos e se a extensão do quadro 6 mantém a mesma trajetória, sem abertura lateral ou efeito de chute. Os dois quadros de passagem têm joelhos visualmente diferentes avançando; isso não basta para aprovar todo o ciclo.

Somente a prévia `client/animation-review.html` referencia esta candidata em `/assets/isometric/review/guerreiro_walk_v2_sheet.png`. Os sheets canônicos Web/Unity/Docs, os `.meta` e `Guerreiro.asset` continuam preservados. A versão de entrada está arquivada em `../2026-10-28_baseline`; o guia de pose nessa pasta é um diagrama técnico, não arte final.

Antes da promoção: avaliar em movimento a 1× e 0,5×, alternância, apoio, orientação de pés/tronco, constância de arma e escala, fechamento 6→1 e transição para idle/attack. Não executar o importador legado que recria GUIDs/spriteIDs. Os metadados atuais já suportam seis quadros 3×2; eventual cópia dos PNGs aprovados deve preservar suas referências.
