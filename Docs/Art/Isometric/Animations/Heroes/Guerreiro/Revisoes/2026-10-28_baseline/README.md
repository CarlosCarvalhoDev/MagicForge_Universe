# Guerreiro — estado preservado antes da revisão de 28/10/2026

Cinco sheets atuais copiados sem modificação, junto dos `.meta` Unity em arquivos de texto e do `Guerreiro.asset`. `inventory.json` registra dimensões e hashes nos três destinos; todas as cópias coincidiam na captura. Os sheets de walk e attack já tinham mudanças não commitadas anteriores: este arquivo preserva o conteúdo local, sem atribuir autoria ou restaurar versões do Git.

Grade real: idle/death 2×2 (1024×1024), walk/attack 3×2 (1536×1024), hit 2×1 (1024×512), células 512 px. Guerreiro.asset usa seis referências de walk com GUID `10269989391b4c6e84f78ff18cffc819`; não recriar identificadores. Idle-reference-00 é somente recorte técnico da primeira célula para referência de identidade na edição por IA.

Inspeção inicial: contatos de walk pouco diferenciados, transição de pernas insuficiente em parte da sequência, abertura lateral no último quadro e oscilação importante da espada. Outras ações foram inspecionadas como folhas, mas não aprovadas em movimento nesta rodada. Primeiro pacote de correção: caminhada SE candidata, mantendo inicialmente seis quadros a 9 FPS para comparar com a duração existente (667 ms). Quantidade maior somente se necessária.
