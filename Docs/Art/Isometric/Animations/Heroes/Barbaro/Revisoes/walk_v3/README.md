# Bárbaro V3 — marcha anterior com reparo do machado

**Aprovada pelo usuário e integrada em 28/10/2026** (“ok esta bom”). Substitui a proposta V2 reprovada por samba lateral. Preserva cinco quadros originais e troca somente o segundo quadro da caminhada para restaurar a lâmina ausente.

Arte do quadro 2 editada com `image_gen.imagegen` integrada: alvo original `walk_01`, referência de arma `walk_00`; prompt exato em `generation-prompt.json`, fonte gerada preservada em `sources/generated-weapon-repair.png`. Não foi usada CLI/API externa. A ferramenta pode alterar pequenos detalhes do quadro reparado; comparar sua pose e registro com o original antes de aceitar. Os outros cinco quadros são comprovadamente idênticos em pixels.

Empacotamento técnico: fonte reparada reduzida proporcionalmente a 512×512 e composta sobre preto para manter o formato legado dos cinco quadros originais. Sem edição de poses por código, sem espelhamento ou deformação. Manter fundo consistente evita que o detector de alpha do renderer trate um atlas misto como inteiramente transparente e deixe cinco fundos pretos visíveis. O PNG com alpha originalmente gerado continua preservado na pasta de fontes.

Folha final: 1536×1024, 3×2 células de 512×512, seis quadros a 9 FPS. Fundo preto opaco como o pacote anterior, removido pela compatibilidade de chroma-key já existente na prévia. Nenhuma alteração no algoritmo de reprodução ou tratamento de fundo. Manifesto com hashes/coordenadas em `packing-manifest.json`; cópia Web em `/assets/isometric/review/barbaro_walk_v3_sheet.png`.

Validação: `Docs/Test-BarbarianReview.ps1 -Version walk_v3` passou, incluindo igualdade de pixels dos cinco quadros originais, diferença apenas do quadro 2 e preservação dos 110 arquivos canônicos. Auditorias V2, Guerreiro V3 e Clériga passaram; build passou. Navegador carregou 26/26 folhas, sem erros/avisos; comparação do quadro reparado e reprodução em 0,5×/1× disponíveis.

A caminhada está aprovada; o aceite não abrange as demais ações ou direções. Unity Play Mode pendente. Não promover V2. Branch `master`, worktree original, sem commit/merge/push.

Integração: três sheets canônicos e somente o recorte `frames_individuais/iso_hero_barbaro_walk_01.png` em Web/Unity/Docs atualizados. Outros quadros e `.meta`/GUIDs/fileIDs/`Barbaro.asset` preservados; grade e timing mantidos. `../active-walk.json` registra aprovação e hashes. Os três recortes substituídos estão em `pre-integration-frames/`, e a folha anterior permanece no baseline. A auditoria compara os cinco quadros às fontes individuais originais autenticadas pelos hashes anteriores; essas fontes não eram todas idênticas às fatias do atlas legado. Nenhuma imagem foi refeita para resolver essa diferença de arquivo.
