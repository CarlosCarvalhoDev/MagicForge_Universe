# Arqueiro básico V1 — candidato

**Atualização em 28/10/2026:** usuário aprovou “esta bom”. Pacote promovido ao Web/Unity/Docs, com manifesto Web e 22 referências no class asset Unity. `integration-approved.json` registra hashes, GUIDs e fileIDs. Metadados preexistentes preservados. Auditoria da integração, build e oito testes Node passaram; Unity Play Mode e combate/projétil ponta a ponta pendentes. O texto abaixo registra a fase candidata anterior ao aceite.

Cinco ações, 22 quadros RGBA, células de 512×512. Prévia somente: nenhuma aprovação artística ou promoção ao gameplay/Unity nesta entrega.

`sources/` guarda as fontes selecionadas; `generation-prompts.json` registra os prompts e tentativas. `normalized/` guarda os recortes normalizados e a transformação uniforme por ação. Cada pasta de ação contém frames, folha e manifesto de empacotamento. `ANIMACOES_MANIFEST.json` registra grade, contagem, FPS e SHA256. `baseline-hashes.json` registra as oito referências existentes preservadas; `Arqueiro.asset-original.txt` arquiva o class asset original.

Idle: 4 quadros/2×2/5 FPS; caminhada: 6/3×2/9 FPS; ataque: 6/3×2/11 FPS; dano: 2/2×1/10 FPS; morte: 4/2×2/7 FPS. As dimensões das folhas derivam dessas grades, sem dedução pela aparência.

Ferramentas técnicas na raiz `Docs/`: `Prepare-ArcherCandidate.ps1` e `Test-ArcherCandidate.ps1`. Não executar o empacotamento sobre os resultados existentes para substituir uma versão silenciosamente; gerar nova revisão para ajustes posteriores. A auditoria admite somente alpha residual ≤1/255 na borda por interpolação, verifica hashes e não certifica naturalidade da passada.

Relatório completo: [REVISAO_ARQUEIRO_2026-10-28.md](../../../../../../../REVISAO_ARQUEIRO_2026-10-28.md). Avaliar no seletor Arqueiro da página `animation-review.html` antes de integrar. Caminhadas aprovadas das demais classes ficam preservadas.
