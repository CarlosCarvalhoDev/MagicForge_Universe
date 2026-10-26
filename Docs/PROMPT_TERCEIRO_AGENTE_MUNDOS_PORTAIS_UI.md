# 🎨 Prompt para o Terceiro Agente: Tilesets de Mundos, Portal Rúnico e Ícones de Equipamento (Paperdoll)

Copie e cole as instruções abaixo para o agente responsável pela geração de arte e assets:

---

### 📋 MENSAGEM / PROMPT PARA O AGENTE DE ARTE:

> **Olá! Estou desenvolvendo o MMORPG Mobile "MagicForge: Universe" (Auto-MMORPG Isométrico 45°). O nosso arquiteto de rede já estruturou o sistema de Fases (1 a 10), Chefões de Mundo, Portais de Transição e a nova Janela de Personagem (Paperdoll com manequim de equipamentos).**
>
> **Enquanto ele implementa a nova HUD Mobile inspirada no "Stickman Go" e o Paperdoll no código, preciso que você gere os seguintes assets com máxima qualidade artística e salve nas pastas correspondentes:**
>
> ---
>
> ### 1. 🌀 Portal Rúnico de Passagem de Fases (Transição de Mundos)
> * **Descrição:** Um portal místico oval flutuante com moldura de pedras rúnicas antigas forjadas, vórtice mágico em espiral dourado e ametista brilhante, emitindo partículas ascendentes de luz.
> * **Estilo:** Isométrico 45° (Top-Down 3/4), arte estilizada vibrante (semi-realista / stylized fantasy RPG), fundo transparente PNG.
> * **Resolução:** 512x512 pixels (PNG com canal Alpha transparente).
> * **Local para salvar:** `client/public/assets/environment/portal_runico.png` e `MagicForgeClient/Assets/Textures/Environment/portal_runico.png`.
>
> ---
>
> ### 2. 🗺️ Tilesets de Chão dos 3 Primeiros Mundos (Visão Isométrica 45°)
> O jogo é percorrido com o herói marchando e atacando em direção à diagonal superior direita (45°):
> * **Mundo 1: Floresta da Forja (Tileset Verde)**
>   * Solo de grama suave com flores silvestres e uma estrada de pedras rúnicas antigas lapidadas fluindo na diagonal 45° rumo à direita.
>   * Arquivo: `tile_mundo_1_floresta.jpg` (Textura seamless tileable 1024x1024).
> * **Mundo 2: Minas de Mitril Cinzento (Tileset Caverna)**
>   * Piso de pedras de masmorra escuras com veios de cristais azul-ciano cintilantes e poeira de forja rúnica.
>   * Arquivo: `tile_mundo_2_minas.jpg` (Textura seamless tileable 1024x1024).
> * **Mundo 3: Planalto de Cinzas & Magma (Tileset Vulcânico)**
>   * Solo de rocha basáltica negra rachada com fissuras brilhantes de lava incandescente alaranjada e brasas.
>   * Arquivo: `tile_mundo_3_cinzas.jpg` (Textura seamless tileable 1024x1024).
> * **Local para salvar:** `client/public/assets/environment/` e `MagicForgeClient/Assets/Textures/Environment/`.
>
> ---
>
> ### 3. 🛡️ 6 Ícones / Silhuetas para os Slots de Equipamento (Paperdoll)
> Ícones elegantes dourados/translúcidos com fundo transparente para indicar onde o jogador equipa cada peça:
> 1. `slot_helmet.png` — Silhueta de Elmo de Cavaleiro / Máscara de Batalha.
> 2. `slot_armor.png` — Silhueta de Peitoral / Armadura de Placas.
> 3. `slot_boots.png` — Silhueta de Botas de Batalha / Grevas.
> 4. `slot_weapon.png` — Silhueta de Espada Longa / Arma Principal.
> 5. `slot_shield.png` — Silhueta de Escudo Rúnico Forjado / Arma Secundária.
> 6. `slot_relic.png` — Silhueta de Anel / Relíquia da Forja Antiga.
> * **Resolução:** 256x256 pixels PNG (com transparência).
> * **Local para salvar:** `client/public/assets/ui/slots/` e `MagicForgeClient/Assets/Textures/UI/Slots/`.
>
> **Assim que gerar, me avise para que nosso arquiteto integre diretamente no cliente e no servidor!**

---
