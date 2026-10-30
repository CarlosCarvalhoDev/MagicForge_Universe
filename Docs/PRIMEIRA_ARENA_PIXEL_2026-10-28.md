# Clareira dos Forjados — primeira tela pixel art

Branch `master`, worktree original, sem commit. Autorização: usuário decidiu migrar toda a arte e pediu a primeira tela funcional. Esta entrega é o primeiro recorte da migração, não o encerramento da troca de todos os assets.

## Comportamento

- `http://127.0.0.1:5173/pixel-arena.html`: treino local jogável com espadachim, quatro slimes e dois orcs, chão de grama/pedra, árvores, rochas e cristais. Movimento por clique, WASD/setas e direcional de toque; espaço/botão de ataque, auto, dano, morte, resultado e reinício. Treino explicitamente sem progresso salvo; não escreve em conta, rede ou banco.
- O `GameRenderer` principal também usa `PixelWorld` por padrão. No jogo conectado, consome os mesmos snapshots/eventos autoritativos e conserva textos de combate, drops, diálogos, camera e conversão de coordenadas. A simulação local de treino é módulo separado e não participa do multiplayer.
- A autenticação e o HUD completo do jogo não foram redesenhados nesta entrega: `main.ts`, `index.html`, `AuthSelection.ts`, CSS de autenticação, rede, shared e servidor apresentavam trabalho paralelo. O link da arena encaminha ao login existente.
- Guerreiro tem arte nativa própria (espadachim nível visual 3 do fornecedor, sem alterar nível do personagem). Outras classes são marcadas como arte pendente, sem disfarçar espadachim como classe diferente. Monstros do jogo usam slime ou orc como substituições visuais iniciais; nomes e stats do servidor não mudam. Chefes e criaturas restantes ainda precisam de arte própria.
- Objetos de cenário são decorativos; não criam colisões locais sobrepostas à autoridade do servidor. Biomas, portais e UI completa permanecem no próximo lote. Unity não foi migrado nesta entrega.

## Contrato técnico medido

15 folhas originais sem sombra, células 64×64, quatro linhas direcionais. **Não usar a grade antiga de 512 px.**

| Família | idle | walk | attack | hit | death | Linhas |
|---|---:|---:|---:|---:|---:|---|
| Espadachim | 12 | 6 | 8 | 5 | 7 | frente, esquerda, direita, costas |
| Slime | 6 | 8 | 10 | 5 | 10 | frente, costas, esquerda, direita |
| Orc | 4 | 6 | 8 | 6 | 8 | frente, costas, esquerda, direita |

Timing de 150 ms por quadro conforme Tiled do fornecedor consultado. A direção usa `headingYaw` (0 sul, 90 leste, 180 norte, 270 oeste), sem espelhamento para inventar direções. Idle/walk repetem; dano/ataque/morte usam o relógio existente de ações. Filtragem desativada e escalas inteiras para sprites; pés alinhados conforme o conteúdo, não pelo limite da célula. PNGs mantidos byte a byte: nada gerado ou redesenhado por IA.

Dois recortes nativos de tiles de 16 px: grama em Ground_grass `(48,320)` e pavimento em Road1_ground `(32,32)`. Sete imagens de cenário e quinze folhas, total 22 PNGs efetivamente usados. Imagens extraídas não utilizadas foram movidas para `Imports/CraftPix/extracted/not-shipped/` (ignorada), sem exclusão de fontes ou assets antigos. Origem/hash: `client/public/assets/pixel/craftpix/provenance.json`; licença no mesmo diretório.

## Arquivos desta entrega

- Novos: `client/pixel-arena.html`, `client/src/pixel/{PracticeArena.ts,pixel-arena.ts,pixel-arena.css}`, `client/src/renderer/{PixelAssets.ts,PixelWorld.ts}`, `client/tests/pixel-arena.test.mjs`, `client/public/assets/pixel/craftpix/**`, este relatório.
- Alterados: `client/src/renderer/GameRenderer.ts` (seleção de apresentação e encaminhamento de eventos), `client/vite.config.ts` (somente entrada pixelArena adicionada, alteração host preexistente preservada), plano de migração e ponto de retomada.
- Código/arte legado preservados; opção `new GameRenderer(canvas, 'legacy')` mantém a apresentação anterior disponível para comparação. Nenhum `.meta`, GUID, asset Unity, regra, protocolo ou banco alterado nesta entrega.

## Validação e limitações

Build TypeScript/Vite passou após tornar a seleção pixel/legacy explícita (a primeira tentativa de retorno incondicional tornou o trecho legado inalcançável e invalidou narrowing TypeScript; corrigido). Treze testes Node passaram: oito existentes e cinco da nova arena, cobrindo grids reais, direções, movimento normalizado, limites, alcance/cooldown, morte/reset e disponibilidade dos assets. A validação final após ajustes menores está registrada abaixo ao concluir.

Não afirmar autenticação/combate multiplayer ponta a ponta ou Unity Play Mode validados nesta tarefa. A prévia local é jogável e testa o mesmo renderizador, mas não comprova integração de todas as telas ou cobertura das sete classes.

### Resultado final desta entrega

- `npm.cmd run build`: passou (TypeScript + Vite, três páginas incluindo pixel-arena). A repetição final dentro do sandbox falhou com EPERM no realpath da página antiga de revisão; repetida fora da restrição, passou sem alteração adicional de código.
- `node --test tests/pixel-arena.test.mjs tests/hero-animations.test.mjs`: **14/14 passaram** (seis novos, oito existentes). Aviso preexistente MODULE_TYPELESS_PACKAGE_JSON, sem falhas.
- Verificação de proveniência: **22/22 PNGs usados** mantêm o SHA256 das imagens extraídas. `git diff --check` dos arquivos rastreados alterados passou, somente avisos de normalização LF/CRLF.
- Navegador real: assets carregaram sem erro; clique no chão moveu o personagem (posição X observada de 0 para 1,50 durante movimento), Auto ligado completou **6/6 alvos com 63/160 HP** e abriu Clareira protegida. Reinício retornou a **160/160 HP, 0/6 e Auto desligado**. Console consultado sem erros/avisos. Captura final salva e arena deixada aberta.
- Teclado e direcional touch implementados; teste físico em celular, multiplayer ponta a ponta e Unity Play Mode permanecem pendentes. Nenhuma conta criada, dados persistidos ou mensagem enviada a terceiros durante o treino.

## Classes gratuitas

Na coleção https://craftpix.net/sets/rpg-top-down-pixel-art-assets-collection/, o espadachim é gratuito, enquanto Mago/Arqueiro das linhas consultadas são premium. Existem bases humanas gratuitas de quatro direções e outros personagens gratuitos; isso não equivale a sete classes equipadas. Há também um mago gratuito em https://craftpix.net/freebies/wizard-character-free-sprite/, identificado como vector e com outro padrão de apresentação, portanto não adotado como substituto pixel top-down compatível. Não afirmar que todo mago/arqueiro em todo o site é pago. Nenhuma compra autorizada ou realizada.
