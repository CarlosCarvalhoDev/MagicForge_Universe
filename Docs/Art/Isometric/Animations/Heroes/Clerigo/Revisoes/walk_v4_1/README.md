# V4.1 — caminhada em SE aprovada

Usa a orientação corporal da pose base aprovada pelo usuário em `../walk_v4`. Redesenha os quadros 4, 5 e 6 da primeira montagem para diferenciar o segundo contato: perna próxima à câmera cruza na frente, perna distante recua. Os quadros 1, 2, 3, 7 e 8 permanecem da V4.

Oito células 512×512, grade 4×2, folha 2048×1024, 12 FPS (667 ms/ciclo). PNG com alfa transparente, redução uniforme, sem espelhamento ou deformação para fabricar poses. `generation-prompts.json` registra cada fonte e prompt da ferramenta integrada; `packing-manifest.json` registra hashes e coordenadas.

Em 27/10/2026, o usuário aprovou o ciclo completo na prévia ("sim fico bom"). Folha e oito frames individuais promovidos aos destinos canônicos Web, Unity e Docs. Os 27 PNGs anteriores foram conferidos contra a V2 arquivada antes da substituição; os `.meta` e `Clerigo.asset` permaneceram idênticos byte a byte. A grade e o timing já eram compatíveis. A revisão continua disponível em `/animation-review.html`; Unity Play Mode ainda precisa de validação manual.
