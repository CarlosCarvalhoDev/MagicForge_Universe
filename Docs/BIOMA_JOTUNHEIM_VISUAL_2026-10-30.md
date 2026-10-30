# Jotunheim — primeira apresentação pixel do Mundo 2

Data: 30/10/2026. Codex, branch `master`, worktree original `E:\MagicForge_Universe`. Sem commit/merge/push. Seguidos AGENTS.md, padrão visual e migração pixel. Nenhuma edição em servidor, shared, ClientNetwork, Unity ou banco.

## Entrega

- `onStageUpdate` encaminha o mundo e o estado/posição do portal para a apresentação. Mundo 2 seleciona neve/gelo, árvores e rochas nevadas; Mundo 1 mantém a floresta. Ambos os ícones de bioma na HUD passam a acompanhar o evento, em vez de sempre mostrar árvore.
- Neve, fissuras de gelo e portal rúnico de moldura dourada/vórtice violeta são primitivas Canvas. Não definem colisão, alcance, progresso ou regras de entrada. O botão existente continua sendo a ação de travessia.
- Portal desenhado somente com `portalOpen` e posição finita fornecidos pelo servidor. Não adivinha coordenadas. Posição `(0,0,0)` é válida. Atualização de mundo/portal fechado remove o estado anterior. Na desconexão, a apresentação volta ao padrão; não altera personagem salvo.
- Mundos ainda sem arte própria exibem aviso de bioma em preparação, usando o cenário de fallback. Não apresentar o Mundo 3 como concluído.
- Prévia em `pixel-arena.html`: seletor Floresta/Jotunheim e portal decorativo. Troca só a arte: herói, nomes dos alvos, vida, contagem e regras continuam sendo os do treino local. Portal de exemplo fica em posição própria da prévia, explicitamente sem viagem ou progresso salvo.

## Assets nativos

Quatro PNGs importados dos ZIPs locais sem alterar seus bytes:

- `trees.zip`: `PNG/Assets_separately/Trees/Snow_tree1.png` e `Snow_tree2.png` (variantes sem sombra adicional).
- `rocks-stones.zip`: `PNG/Objects_separately/Rokc3_snow_shadow1.png` e `Rokc3_snow_shadow3.png`.
- Destino: `client/public/assets/pixel/craftpix/winter/`.
- Arquivo de origem e SHA256 por imagem: `winter/provenance.json`. Não renomear a grafia original Rokc3 silenciosamente.

Nenhum download, compra, gerador de imagens ou alteração de pixels CraftPix nesta rodada. Licença/limites mantidos em `LICENSE-NOTICE.md`; fontes e ZIPs continuam separados dos assets distribuídos no jogo. As primeiras tentativas de importação não escreveram assets: Python indisponível e nomes duplicados de variantes de sombra no ZIP. Importação final usou caminhos exatos via ZipFile, conferindo arquivo existente antes de escrever.

## Arquivos

- Novo: `client/src/renderer/WorldPresentation.ts` (estado pequeno de aparência/portal, sem gameplay).
- Alterados: `PixelAssets.ts`, `PixelWorld.ts`, `GameRenderer.ts`, `client/src/main.ts`, `client/index.html` (somente identificação do ícone da zona nesta rodada), `client/pixel-arena.html`, `client/src/pixel/pixel-arena.ts`.
- Novos: quatro PNGs e `winter/provenance.json`; `client/tests/world-presentation.test.mjs`; este relatório.
- Atualizados: planos visuais e aviso de assets. Alterações preexistentes nos arquivos grandes preservadas; o diff total contra Git inclui trabalho anterior.

## Verificação

Na pasta `client`:

```text
npm.cmd run build
TypeScript + Vite: passou.

node --test tests/world-presentation.test.mjs tests/pixel-vfx.test.mjs tests/pixel-arena.test.mjs tests/hero-animations.test.mjs tests/warrior-presentation.test.mjs
34/34 passaram.
```

Os quatro testes novos verificam seleção de bioma/fallback, validação e cópia da posição do portal, limpeza entre mundos, rejeição de mundo inválido e integridade dos quatro PNGs.

Navegador: cenário de gelo e portal inspecionados; troca 2 → 1 → 2 manteve HP 160/160 e 0/6 alvos. Console consultado sem erros/avisos. O treino já executado na outra aba não foi reiniciado: foi usada aba separada para a captura final. A sessão de automação apresentou falha de conexão e foi recuperada reinicializando somente sua sessão, sem fechar as abas do usuário.

Captura: `C:/Users/cv_de/.codex/visualizations/2026/10/27/01a17e58-e961-7972-ac5e-a5db9ac4f0a5/jotunheim-previa-2026-10-30.png`. Prévia deixada no Mundo 2 com portal decorativo.

`git diff --check` dos arquivos rastreados de produto alterados passou, com avisos de normalização LF/CRLF. Não repetidos testes do servidor, pois não houve alteração de backend.

## Pendências e próxima execução

1. Codex: validar a mudança de arte no fluxo conectado após portal/reconexão usando ambiente descartável. Nesta rodada houve prévia local, testes de apresentação e build; não foi repetido o fluxo WebSocket completo do Mundo 2 com esta arte.
2. Codex: arte própria para Slime Glacial, Guerreiro do Gelo, Arqueiro da Neve, Lobo de Jotunheim, Yetin e Frostbite. Slimes/Orcs atuais são substitutos; não representam a conclusão dos sprites do Mundo 2.
3. Revisar composição, densidade de objetos, aparência do gelo/portal e desempenho/legibilidade em celular com o usuário. Sem novas colisões locais. Unity não testado nem alterado.
4. Antigravity: continuam os complementos descritos no retorno oficial de `HANDOFF_MUNDO2_PRESERVACAO_ANTIGRAVITY_2026-10-30.md`, principalmente reabertura real de SQLite, farm/mochila expandida, isolamento de dois jogadores e identidade estável de arquétipos. Não é necessário aguardar esses testes para produzir arte.
