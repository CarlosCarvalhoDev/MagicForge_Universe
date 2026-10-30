# Guerreiro walk V3 — candidata de passo curto

**Estado atual — aprovada e integrada em 28/10/2026.** O usuário aprovou explicitamente esta caminhada: “agora fico muito bom”. O histórico abaixo descreve a preparação anterior ao aceite. A folha V3 foi copiada para Web/Unity/Docs; os seis recortes existentes de Web/Docs usam a numeração local 01–06, correspondente a 00–05 nesta pasta. Recortes substituídos arquivados em `pre-integration-frames/`; folha antiga preservada no baseline. `../active-walk.json` registra aprovação/hash. `.meta`, GUIDs, fileIDs, `.asset`, grade e timing preservados. As demais ações do Guerreiro não estão aprovadas por este aceite; Unity Play Mode pendente.

Revisão de 28/10/2026 após feedback de que a V2 parecia chutar. **Não aprovada e não integrada ao gameplay.** Comparação disponível em `http://localhost:5173/animation-review.html`: V3 à esquerda e V2 à direita; as duas versões anteriores permanecem selecionáveis.

Seis poses editadas individualmente com a ferramenta integrada `image_gen.imagegen`. Objetivo: reduzir alcance dos pés, flexionar a passagem e abaixar a ponta da bota, preservando a orientação SE e a identidade aprovada de tronco, cabeça, capa, espada e escudo. A edição generativa não garante igualdade pixel a pixel dessas partes; conferir pequenas diferenças de contorno/brilho em movimento antes de aceitar.

Sequência desenhada: contato próximo → apoio próximo/passagem distante → aproximação distante → contato distante → apoio distante/passagem próxima → aproximação próxima. Conferidos visualmente os quadris e joelhos nos contatos opostos 1/4. Esta inspeção não substitui o aceite do usuário sobre apoio, fluidez e fechamento 6→1. Conferir também se a altura dos pés nos apoios produz deslizamento ou oscilação; não promover apenas porque os hashes são únicos.

## Arquivos e empacotamento

- `sources/source_00.png` a `source_05.png`: fontes selecionadas RGBA de 1254×1254, guardadas no repositório.
- `iso_hero_guerreiro_walk_00.png` a `05.png`: redução proporcional uniforme para 512×512. Sem deformação, espelhamento, interpolação de poses ou mistura de quadros.
- `iso_hero_guerreiro_walk_sheet.png`: grade 3×2, 1536×1024, 9 FPS, ciclo de 667 ms. `packing-manifest.json` contém hashes e coordenadas.
- `generation-prompts.json`: tentativa de folha rejeitada e primeira rodada individual. `selected-prompts.json`: prompts exatos das fontes selecionadas. Modo integrado; não foi usada API/CLI de geração.
- `opposite-contact-pose-guide.png`: esquema técnico de apoio feito com formas simples, usado somente como referência de anatomia na ferramenta de imagem. Não é sprite nem é carregado pela prévia.
- Cópia de review: `client/public/assets/isometric/review/guerreiro_walk_v3_sheet.png`.

A tentativa inicial de folha inteira foi rejeitada por repetir o apoio e criar fundo colorido. As aproximações iniciais 3/6 ainda sugeriam chute e foram substituídas por edições localizadas; o contato 4 foi redesenhado com guia de quadris. Não restaurar esses rascunhos como sequência aprovada.

## Validação e limites

`Docs/Test-WarriorReview.ps1 -Version walk_v3` passou: seis fontes/quadros únicos, hashes, dimensões/grade, cantos alpha, cópia Web e preservação dos cinco sheets canônicos nos três destinos, `.meta` e `Guerreiro.asset`. A mesma auditoria da V2 e a auditoria da Clériga passaram. Node de animações: 8/8. Build passou após repetir fora do sandbox por EPERM de realpath do Vite. Navegador carregou 22/22 folhas/versões, sem erros/avisos; controles de reprodução, 0,5×, 1× e quadros manuais conferidos. Qualidade artística continua pendente do usuário; Unity Play Mode não executado.

Nenhum PNG canônico, `.meta`, `.asset`, script Unity, backend, rede ou banco foi alterado nesta revisão. Branch `master`, worktree original, sem commit.
