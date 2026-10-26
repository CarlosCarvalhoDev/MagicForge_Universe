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

## 2. Prompts Prontos para as 7 Classes (Heróis)

### 2.1 Guerreiro / Paladino (`GUERREIRO` — STR + CHA) ✅ *(Gerado e salvo em `Assets/Textures/Sprites/iso_hero_guerreiro.jpg`)*
![Sprite Isométrica Guerreiro](./Art/Isometric/iso_hero_guerreiro.jpg)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a heroic fantasy knight warrior character, full body standing stance, stylized low-poly 3D render, mobile RPG game asset, wearing silver plate armor with gold trim and a crimson cape, holding a glowing steel broadsword and kite shield, cute yet valiant proportions, clean silhouette, isolated on a solid pure black background, no shadows, no ground, no floor, cel-shaded fantasy aesthetic, vibrant saturated colors, game-ready sprite asset, --ar 1:1`

### 2.2 Clérigo (`CLERIGO` — WIS)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a holy cleric priestess character, full body standing stance, stylized low-poly 3D render, mobile RPG game asset, white and gold vestments with subtle green nature runes, holding a glowing divine scepter, gentle golden halo light above head, cute yet valiant proportions, clean silhouette, isolated on a solid pure black background, no shadows, no ground, no floor, cel-shaded fantasy aesthetic, vibrant saturated colors, game-ready sprite asset, --ar 1:1`

### 2.3 Bárbaro (`BARBARO` — STR)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a fierce fantasy barbarian berserker character, full body combat stance, stylized low-poly 3D render, mobile RPG game asset, muscular build with fur pelts and glowing blue war paint, wielding a massive fiery two-handed greataxe, cute yet fierce proportions, clean silhouette, isolated on a solid pure black background, no shadows, no ground, no floor, cel-shaded fantasy aesthetic, vibrant saturated colors, game-ready sprite asset, --ar 1:1`

### 2.4 Monge (`MONGE` — DEX)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of an agile fantasy martial arts monk character, full body martial stance, stylized low-poly 3D render, mobile RPG game asset, wearing saffron orange and dark leather robes with prayer beads, fists glowing with cyan and gold Chi energy, cute yet dynamic proportions, clean silhouette, isolated on a solid pure black background, no shadows, no ground, no floor, cel-shaded fantasy aesthetic, vibrant saturated colors, game-ready sprite asset, --ar 1:1`

### 2.5 Bruxo (`BRUXO` — CHA)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a dark fantasy warlock summoner character, full body casting stance, stylized low-poly 3D render, mobile RPG game asset, wearing dark obsidian and violet robes with glowing purple runes, holding an eldritch grimoire in one hand and violet shadow-flame in the other, clean silhouette, isolated on a solid pure black background, no shadows, no ground, no floor, cel-shaded fantasy aesthetic, vibrant saturated colors, game-ready sprite asset, --ar 1:1`

### 2.6 Mago (`MAGO` — INT)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a fantasy wizard mage character, full body casting stance, stylized low-poly 3D render, mobile RPG game asset, wearing deep sapphire blue and crimson robes with gold runes, holding an ancient magical staff with a floating cyan crystal and fire orb, clean silhouette, isolated on a solid pure black background, no shadows, no ground, no floor, cel-shaded fantasy aesthetic, vibrant saturated colors, game-ready sprite asset, --ar 1:1`

### 2.7 Arqueiro (`ARQUEIRO` — DEX)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of an agile elf ranger archer character, full body aiming stance, stylized low-poly 3D render, mobile RPG game asset, wearing leather scout armor and emerald green hood, holding an ornate wooden recurve bow with a glowing green energy arrow and quiver on back, clean silhouette, isolated on a solid pure black background, no shadows, no ground, no floor, cel-shaded fantasy aesthetic, vibrant saturated colors, game-ready sprite asset, --ar 1:1`

---

## 3. Prompts Prontos para Monstros & Bosses (`World.ts`)

### 3.1 Goblin Lanceiro (`mob_1`)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a small fierce fantasy goblin lancer monster, stylized low-poly 3D render, mobile RPG game sprite, green skin, large pointy ears, toothy grin, holding a jagged rune-etched spear and wooden buckler, wearing crude scavenged iron armor, isolated on pure black background, no shadows, no ground, clean edges for cutout, --ar 1:1`

### 3.2 Goblin Arqueiro (`mob_2`)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a sneaky fantasy goblin archer monster, stylized low-poly 3D render, mobile RPG game sprite, green skin, ragged hood, aiming a crude shortbow with a glowing green poison arrow, isolated on pure black background, no shadows, no ground, clean edges for cutout, --ar 1:1`

### 3.3 Slime da Floresta (`mob_3`)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a translucent emerald green gelatinous slime monster, glowing MagicForge crystal shard floating inside its core, cute dangerous expression, slight splash droplets, stylized mobile game asset, clean silhouette isolated on plain black background, no shadows, no ground, high gloss jelly shader, --ar 1:1`

### 3.4 Lobo Selvagem Corrompido (`mob_4`)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a ferocious fantasy dire wolf creature, stylized low-poly 3D render, mobile RPG sprite, dark obsidian fur with glowing violet corruption markings, bared fangs, aggressive combat stance, isolated on solid black background, no shadows, no ground, crisp character sprite asset, --ar 1:1`

### 3.5 Chefe Goblin — Rei da Escória (`mob_5` — Boss Ato I)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a hulking hobgoblin warlord boss monster, wearing spiked iron armor and a glowing molten slag crown, wielding a brutal rune cleaver and heavy shield, stylized mobile fantasy boss sprite, isolated on pure black background, no shadows, no ground, clean silhouette, --ar 1:1`

### 3.6 Malakor, o Arquifalsário Cinzento (Vilão Principal / World Boss)
> **Prompt:**  
> `Top-down 3/4 isometric perspective, 45-degree angled view of a towering undead Lich Warlord boss in obsidian and molten-gold plate armor, glowing crimson skull face, wielding a colossal corrupted warhammer dripping with magma, stylized mobile RPG raid boss sprite, isolated on pure black background, no shadows, no ground, clean silhouette, --ar 1:1`


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
