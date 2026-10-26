# 🎨 Guia Mestre de Prompts para Geração de Assets com IA (MMORPG Mobile)

Este guia foi elaborado para você copiar e colar diretamente em agentes de IA de imagem (como **Midjourney**, **DALL-E 3**, **Stable Diffusion**, **Leonardo.ai**, **Recraft** ou **Photoshop Firefly**) para obter imagens padronizadas e profissionais para o **MagicForge: Universe**.

---

## 1. A Fórmula de Ouro para Jogos Mobile Top-Down

Para evitar estilos desconexos e imagens que não encaixam no jogo, **todo prompt deve conter os 5 pilares**:

```
[Sujeito & Função] + [Ângulo de Câmera] + [Estilo Artístico] + [Iluminação & Detalhes] + [Fundo & Formato]
```

* **Ângulo Essencial:** `top-down 3/4 isometric perspective, 45-degree angled view` (é o ângulo padrão de jogos como *Brawl Stars*, *Ragnarok Online*, *Clash of Clans*, *Hades* e *Diablo*).
* **Fundo Limpo:** `isolated on solid plain black background, no shadows, no ground, clean silhouette` (facilita 100% o recorte transparente para PNG).
* **Estilo Unificado:** `stylized low-poly 3D render, mobile RPG game asset, vibrant colors, clean outlines, cel-shaded fantasy aesthetic`.

---

## 2. Prompts Prontos para Personagens (Heróis)

### Guerreiro / Paladino (STR)
> **Prompt:**  
> `Top-down 3/4 isometric perspective of a heroic fantasy knight character, stylized mobile RPG art style, wearing silver plate armor with gold trim and a crimson cape, holding a glowing steel broadsword and kite shield, cute yet valiant proportions, clean silhouette, isolated on a solid dark background, cel-shaded, vibrant saturated colors, game-ready sprite asset, high resolution, Unreal Engine 5 stylized render, --ar 1:1 --no background, floor, shadow`

### Mago / Bruxo (INT / CHA)
> **Prompt:**  
> `Top-down 3/4 isometric view of a fantasy wizard character, stylized mobile game art, wearing deep sapphire blue hooded robes with glowing gold runes, holding an ancient wooden magical staff with a floating cyan crystal, arcane particle aura, isolated on pure black background, clean edges, crisp details, mobile RPG character sprite, --ar 1:1`

### Arqueiro / Caçador (DEX)
> **Prompt:**  
> `Top-down 3/4 isometric view of an agile elf ranger archer character, stylized mobile RPG, wearing leather scout armor and green hood, holding an ornate wooden recurve bow with quiver on back, nimble stance, isolated on plain black background, clean sprite asset, vibrant cartoon shading, --ar 1:1`

### Clérigo (WIS)
> **Prompt:**  
> `Top-down 3/4 isometric view of a holy cleric priestess, stylized mobile RPG, white and gold vestments, holding a glowing divine scepter, gentle halo light above head, isolated on solid dark background, mobile game character sprite asset, --ar 1:1`

---

## 3. Prompts Prontos para Monstros & Inimigos

### Goblin Guerreiro
> **Prompt:**  
> `Top-down 3/4 angled view of a small fierce fantasy goblin monster, stylized mobile RPG game sprite, green skin, large pointy ears, toothy grin, holding a jagged bone spear and wooden buckler, wearing crude leather rags, isolated on pure black background, clean edges for cutout, --ar 1:1`

### Slime Mágico da Floresta
> **Prompt:**  
> `Top-down 3/4 angled view of a translucent green gelatinous slime monster, glowing inner core, cute dangerous expression with big cartoon eyes, slight splash droplets, stylized mobile game asset, clean silhouette isolated on plain black background, high gloss jelly shader, --ar 1:1`

### Lobo Selvagem Alfa
> **Prompt:**  
> `Top-down 3/4 isometric view of a ferocious fantasy dire wolf creature, stylized mobile RPG, dark slate fur with glowing cyan markings, bared fangs, aggressive combat stance, isolated on solid black background, crisp character sprite asset, --ar 1:1`

### Chefe Golem de Pedra / Chefe da Floresta
> **Prompt:**  
> `Top-down 3/4 isometric view of a massive ancient stone golem boss monster, glowing emerald moss and runic carvings across giant boulder shoulders, menacing glowing eyes, heavy stone fists, stylized mobile fantasy boss sprite, isolated on pure black background, --ar 1:1`

---

## 4. Prompts Prontos para Texturas de Cenário (Tilesets)

Para o chão da arena não ficar liso ou quadriculado:

### Piso de Pedra de Masmorra / Arena (Seamless Tileable)
> **Prompt:**  
> `Seamless tileable texture of ancient stone arena floor, top-down orthographic view, stylized hand-painted mobile game texture, mossy paving stones, subtle cracked cobblestone, warm dungeon lighting, high quality video game texture map, 2D game background, --ar 1:1`

### Grama de Fantasia com Flores Mágicas (Seamless Tileable)
> **Prompt:**  
> `Seamless repeating texture of lush enchanted fantasy grass terrain, top-down orthographic view, stylized vibrant green RPG lawn with scattered tiny yellow and blue wildflowers, soft mobile cartoon aesthetics, clean game environment texture, --ar 1:1`

---

## 5. Como Gerar Sprite Sheets Completos (Andar, Atacar, Parado)

Se você quiser pedir animações prontas em grade:

> **Prompt de Sprite Sheet:**  
> `Sprite sheet of a fantasy warrior walking animation cycle, 8 frames in horizontal sequence, top-down 3/4 isometric angle, stylized mobile RPG game character, clean black background between frames, even spacing, consistent scale and lighting across all frames, game asset sheet, --ar 16:9`

---

## 6. Fluxo Rápido: Da Geração para o Jogo

1. **Gerar a Imagem:** Use um dos prompts acima no gerador de sua escolha.
2. **Remover o Fundo (PNG Transparente):**
   * Use ferramentas gratuitas online como **remove.bg**, **Photoroom** ou o comando nativo do Photoshop (*Quick Action > Remove Background*).
3. **Salvar no Projeto:**
   * **Para o Web Client:** Salve em `e:\MagicForge_Universe\client\public\assets\`.
   * **Para o Unity:** Salve em `e:\MagicForge_Universe\MagicForgeClient\Assets\Textures\Sprites\` e nas configurações do Unity no Inspector, marque **Texture Type: Sprite (2D and UI)**.
