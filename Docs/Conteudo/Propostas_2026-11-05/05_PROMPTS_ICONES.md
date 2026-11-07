# 05 — Prompts de Ícones de Habilidades e Equipamentos (2026-11-05)

> **Escopo:** Prompts prontos em inglês para geração, revisão de enquadramento ou substituição dos **84 ícones canônicos de habilidades** de [`shared/src/skills.ts`](file:///e:/MagicForge_Universe/shared/src/skills.ts), além de diretrizes visuais para os itens propostos em [`02_CATALOGO_PROPOSTO.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/02_CATALOGO_PROPOSTO.md).
> **Sincronizado com:** [`04_MANIFESTO_ICONES.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/04_MANIFESTO_ICONES.md).

---

## 1. Template Base e Regras de Direção de Arte

Todos os prompts de habilidades seguem o template oficial da Seção 5:

```text
Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, [DESCRIÇÃO DO EFEITO DA HABILIDADE], [PALETA DA CLASSE], dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
```

### 1.1 Paletas Oficiais por Classe

| Classe | Paleta Principal | Iluminação Secundária |
|---|---|---|
| **GUERREIRO** | *Warm steel silver, crimson battle aura and ember gold* | *Warm forge highlights, disciplined metallic reflections* |
| **BARBARO** | *Feral blood red, primal orange fire and bone bronze* | *Volcanic sparks, raw jagged crimson energy* |
| **MONGE** | *Jade emerald ki, spiritual gold and turquoise wind* | *Serene celadon glow, warm golden ki meridians* |
| **ARQUEIRO** | *Forest emerald, moonlit silver and natural oak gold* | *Sylvan bioluminescence, crisp wind trails* |
| **MAGO** | *Arcane sapphire blue, astral violet and fiery orange for fire spells* | *Luminous ley-line geometry, crystalline frost or solar flare* |
| **BRUXO** | *Eldritch purple, abyssal magenta, necrotic green and void black* | *Corrupted soul-fire, ominous abyssal rim light* |
| **CLERIGO** | *Radiant solar gold, ivory light and celestial white-blue* | *Warm cathedral sunbeams, pure golden halos* |

---

## 2. Mapa Rápido de Ação sobre o Acervo Existente (28 PNGs Únicos)

Antes de acionar geradores de imagem para os 60 ícones ausentes (`[GERAR NOVA ARTE]`), a equipe pode aproveitar imediatamente **23 das 28 artes únicas já existentes** em `client/public/assets/skills/` (12 por reúso direto e 11 após realocação semântica e/ou correção de moldura):

| Categoria | Qtd | IDs Canônicos Cobertos | Observação Técnica |
|---|---:|---|---|
| **`[REUSAR ARTE EXISTENTE]`** | **12** | `guerreiro_base`, `guerreiro_nv1_1`, `clerigo_base`, `clerigo_nv2_2` (`06`), `clerigo_nv2_1` (`07`), `clerigo_nv3_1` (`08`), `mago_base` (`09`), `mago_nv1_1` (`10`), `mago_nv3_1` (`11`), `arqueiro_base` (`13`), `arqueiro_nv1_3` (`14`), `arqueiro_nv2_1` (`15`), `barbaro_base` (`17`), `barbaro_nv1_1` (`18`), `barbaro_nv2_1` (`19`), `barbaro_nv3_1` (`20`) *(12 no slot certo + 4 realocações limpas)* | Moldura dourada 1:1 íntegra e semântica fiel à habilidade real em `shared/src/skills.ts`. |
| **`[REVISAR ENQUADRAMENTO / REALOCAR]`** | **9** | `guerreiro_nv2_1` (`03`), `monge_nv1_1` (`21`), `monge_nv1_3` (`22`), `monge_nv2_2` (`23`), `monge_nv3_1` (`24`), `bruxo_base` (`25`), `bruxo_nv1_1` (`26`), `bruxo_nv2_1` (`27`), `bruxo_nv3_2` (`28`) | Arte central coerente com a habilidade, mas requer reparo de borda (canto superior direito em `03`, sobra inferior em `21–24`, topo cortado em `25–28` e watermark no canto inferior direito de `28`) ou regeneração com o prompt abaixo. |
| **`[REVISAR — FALLBACK TEMPORÁRIO]`** | **2** | `guerreiro_nv3_1` (`04`), `arqueiro_nv1_2` (`16`) | `04` mostra guerreiro furioso genérico (sem terremoto); `16` mostra aljava com 4 flechas (serve provisoriamente para *Rajada Tripla*, mas não para *Fênix Solar*). |
| **`[DESCARTAR / LEGADO D&D]`** | *(1 PNG)* | *(PNG `12_mago_desintegracao_arcana.png` / `mago_4.png`)* | Raio violeta desintegrando cristal verde; não corresponde a nenhuma das 12 skills atuais do Mago. |

---

## 3. Prompts por Classe e Habilidade (84 Skills)

### 3.1 GUERREIRO (12 Habilidades)

#### Slot 1 — Nível 1 (`guerreiro_base`)
- **`guerreiro_base` — Golpe de Espada** `[REUSAR ARTE EXISTENTE: guerreiro_1.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_base.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a disciplined heavy broadsword slashing diagonally with a bright crescent arc of sparks, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 2 — Nível 10 (`guerreiro_nv1_*`)
- **`guerreiro_nv1_1` — Retomar o Fôlego** `[REUSAR ARTE EXISTENTE: guerreiro_2.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv1_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a veteran armored knight chestplate glowing with a revitalizing golden-green breath of stamina and rising vitality runes, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv1_2` — Provocação de Ferro** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv1_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a roaring steel knight helmet emitting concentric crimson shockwaves of challenge and an iron shield emblem, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv1_3` — Golpe Demolidor** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv1_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a massive two-handed greatsword crashing downward and shattering an enemy iron shield into glowing fragments, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 3 — Nível 25 (`guerreiro_nv2_*`)
- **`guerreiro_nv2_1` — Redemoinho de Aço** `[REVISAR ENQUADRAMENTO: guerreiro_3.png]`
  - **Nota de revisão:** A arte atual de `guerreiro_3.png` é excelente para *Redemoinho de Aço*, mas tem o canto superior direito da moldura dourada dobrado/cortado. Corrigir moldura via inpainting ou regenerar com o prompt abaixo.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv2_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a circular cyclone of razor-sharp steel blades spinning in a deadly hurricane of sparks, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv2_2` — Falange Impenetrável** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv2_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, three interlocking heavy tower shields forming an unbreakable golden-steel phalanx barrier with defensive runes, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv2_3` — Surto de Ação** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv2_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, an armored gauntlet gripping a sword leaving trois blazing golden afterimages of sudden relentless speed, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv2_4` — Estandarte de Guerra** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv2_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a royal crimson and gold war banner planted firmly into cracked stone radiating an inspiring aura of courage, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 4 — Nível 50 (`guerreiro_nv3_*`)
- **`guerreiro_nv3_1` — Julgamento da Terra Arrancada** `[REVISAR / SUBSTITUIR: guerreiro_4.png]`
  - **Nota de revisão:** `guerreiro_4.png` exibe um guerreiro em fúria vermelha genérica (`04_guerreiro_avatar_da_guerra.png`). Como a skill atual é um golpe sísmico em área (*Julgamento da Terra Arrancada*), recomenda-se gerar arte dedicada de impacto tectônico.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv3_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a colossal runic greatsword slammed vertically into the earth splitting tectonic rock with erupting golden-crimson fissure shockwaves, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv3_2` — Bastião Imortal** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv3_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a fortress-like golden shield and breastplate encased in an indestructible dome of glowing runic plates and regenerating light, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv3_3` — Executor Implacável** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv3_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a heavy executioner greatsword descending vertically with a lethal crimson guillotine arc and shattered chains, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`guerreiro_nv3_4` — Tempestade de Lâminas** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/guerreiro_nv3_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a maelstrom of multiple glowing spectral longswords and steel slashes converging in a devastating omnidirectional vortex, warm steel silver, crimson battle aura and ember gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

---

### 3.2 BÁRBARO (12 Habilidades)

#### Slot 1 — Nível 1 (`barbaro_base`)
- **`barbaro_base` — Golpe Brutal** `[REUSAR ARTE EXISTENTE: barbaro_1.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_base.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a jagged double-bladed barbarian greataxe cleaving downward with raw primal blood-red impact sparks, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 2 — Nível 10 (`barbaro_nv1_*`)
- **`barbaro_nv1_1` — Fúria Primordial** `[REUSAR ARTE EXISTENTE: barbaro_2.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv1_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a roaring berserker silhouette with glowing fiery eyes and a blazing crimson-orange primal aura erupting around him, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv1_2` — Grito de Guerra Intimidador** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv1_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a horned warhorn and primal skull emblem unleashing jagged blood-red sonic rings that crack stone, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv1_3` — Sangue de Ferro** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv1_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a muscular torso etched with glowing molten bronze tribal runes and hardened iron-like skin deflecting blades, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 3 — Nível 25 (`barbaro_nv2_*`)
- **`barbaro_nv2_1` — Ataque Descuidado** `[REUSAR ARTE EXISTENTE: barbaro_3.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv2_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a wild all-out two-handed axe swing wreathed in volatile crimson lightning and shattered defense shards, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv2_2` — Tornado de Machados** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv2_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, dual heavy battleaxes spinning in a ferocious fiery crimson whirlwind tearing up rocks and embers, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv2_3` — Sede de Sangue** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv2_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a notched bone-handled cleaver absorbing swirling streams of glowing crimson vitality essence into a beating heart rune, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv2_4` — Totem do Urso Ancestral** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv2_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a carved bronze and oak totem topped with a glowing spectral roaring bear spirit radiating protective amber-red light, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 4 — Nível 50 (`barbaro_nv3_*`)
- **`barbaro_nv3_1` — Cataclismo Sísmico** `[REUSAR ARTE EXISTENTE: barbaro_4.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv3_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a colossal primal warhammer/greataxe smashing the ground and triggering a volcanic lava eruption and flying boulders, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv3_2` — Fúria Imortal** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv3_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a defiant berserker skull and crossed chains burning with unquenchable molten orange-red phoenix flames, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv3_3` — Guilhotina Selvagem** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv3_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a massive crescent bone-and-iron executioner greataxe dropping vertically in a blinding crimson-orange arc of lethal force, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`barbaro_nv3_4` — Rugido do Leviatã** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/barbaro_nv3_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a colossal spectral primal beast jaw roaring outward with devastating blood-crimson and bronze shockwave rings, feral blood red, primal orange fire and bone bronze, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

---

### 3.3 MONGE (12 Habilidades)

> **Atenção sobre o acervo atual (`21_monge_...` a `24_monge_...`):** Todos os 4 arquivos atuais do Monge apresentam uma faixa de moldura duplicada na borda inferior do canvas 512×512 e estavam mapeados em slots trocados (`21` mostra 4 socos = `monge_nv1_1`; `22` mostra flor de lótus = `monge_nv1_3`).

#### Slot 1 — Nível 1 (`monge_base`)
- **`monge_base` — Punho de Ki** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_base.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a single cloth-wrapped martial artist fist striking forward surrounded by a focused spiral of glowing jade ki energy, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 2 — Nível 10 (`monge_nv1_*`)
- **`monge_nv1_1` — Rajada de Golpes** `[REVISAR ENQUADRAMENTO + REALOCAR: 21_monge_punho_de_ki.png]`
  - **Nota de revisão:** A arte de `21_monge_punho_de_ki.png` (`monge_1.png`) ilustra 4 punhos em sequência rápida, sendo ideal para `monge_nv1_1` (*Rajada de Golpes*). Requer apenas aparar/corrigir a faixa de moldura duplicada na borda inferior.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv1_1.png`
  - **Prompt (caso deseje regenerar limpo):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, multiple rapid martial arts fists striking simultaneously in a dazzling flurry of jade and golden ki impacts, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv1_2` — Postura do Vento Defletor** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv1_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, graceful open martial arts palms weaving a swirling turquoise and gold wind vortex that deflects incoming arrows, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv1_3` — Cura do Lótus Celestial** `[REVISAR ENQUADRAMENTO + REALOCAR: 22_monge_rajada_de_golpes.png]`
  - **Nota de revisão:** `22_monge_rajada_de_golpes.png` (`monge_2.png`) ilustra uma flor de lótus de jade e ouro sobre mãos em meditação — encaixe semântico perfeito para `monge_nv1_3` (*Cura do Lótus Celestial*). Requer corrigir a borda inferior duplicada.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv1_3.png`
  - **Prompt (caso deseje regenerar limpo):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a luminous jade and golden lotus blossom floating above meditating hands radiating soothing healing ki particles, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 3 — Nível 25 (`monge_nv2_*`)
- **`monge_nv2_1` — Chute Furacão Giratório** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv2_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a dynamic spinning martial arts roundhouse kick generating a sharp crescent cyclone of jade and turquoise wind, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv2_2` — Golpe Atordoante de Meridiano** `[REVISAR ENQUADRAMENTO + REALOCAR: 23_monge_golpe_atordoante.png]`
  - **Nota de revisão:** `23_monge_golpe_atordoante.png` (`monge_3.png`) mostra uma palma de ki atingindo pontos vitais de um elmo — ideal para `monge_nv2_2`. Requer corrigir a borda inferior duplicada.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv2_2.png`
  - **Prompt (caso deseje regenerar limpo):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a precise two-finger and open-palm ki strike hitting glowing golden meridian pressure points with paralyzing jade lightning, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv2_3` — Corpo de Diamante** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv2_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a meditating monk torso crystallized into translucent faceted jade diamond and golden light impervious to harm, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv2_4` — Passo do Vento Sagrado** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv2_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a swift monk sandal leaping across a swirling cloud of turquoise wind and golden ki feathers at blinding speed, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 4 — Nível 50 (`monge_nv3_*`)
- **`monge_nv3_1` — Palma das Cem Mãos de Buda** `[REVISAR ENQUADRAMENTO: 24_monge_palma_vibrante.png]`
  - **Nota de revisão:** `24_monge_palma_vibrante.png` (`monge_4.png`) retrata uma grande palma dourada/jade com ondas sísmicas — excelente para `monge_nv3_1`. Requer corrigir a borda inferior duplicada.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv3_1.png`
  - **Prompt (caso deseje regenerar limpo):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a colossal glowing golden and jade spiritual palm surrounded by a halo of a hundred radiant spectral hands striking forward, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv3_2` — Transcendência do Espírito Puro** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv3_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a levitating enlightened silhouette with seven glowing golden chakras and a serene jade mandala halo restoring pure ki, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv3_3` — Toque da Morte Silenciosa** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv3_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a single glowing jade fingertip touching a golden heart-meridian sigil that shatters with lethal internal vibrations, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`monge_nv3_4` — Dragão Ascendente de Jade** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/monge_nv3_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a majestic translucent jade and gold spirit dragon spiraling upward around a rising martial uppercut, jade emerald ki, spiritual gold and turquoise wind, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

---

### 3.4 ARQUEIRO (12 Habilidades)

#### Slot 1 — Nível 1 (`arqueiro_base`)
- **`arqueiro_base` — Disparo Preciso** `[REUSAR ARTE EXISTENTE: arqueiro_1.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_base.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a drawn carved oak longbow firing a razor-sharp arrow tipped with glowing emerald wind precision, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 2 — Nível 10 (`arqueiro_nv1_*`)
- **`arqueiro_nv1_1` — Marca do Caçador** `[GERAR NOVA ARTE]`
  - **Nota importante:** `arqueiro_2.png` atual mostra uma flecha com espinhos (`14_arqueiro_flecha_espinhosa_enredante.png`), que deve ser realocada para `arqueiro_nv1_3` (*Armadilha de Espinhos*). Gere um ícone de mira/olho predatório para `arqueiro_nv1_1`.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv1_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a glowing emerald predator hawk eye and silver hunter crosshair sigil locking onto a target, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv1_2` — Rajada Tripla** `[REVISAR / FALLBACK: 16_arqueiro_aljava_celere_tempestade_de_flechas.png]`
  - **Nota de revisão:** `16_arqueiro_aljava_celere_tempestade_de_flechas.png` (`arqueiro_4.png`) mostra uma aljava dourada disparando flechas verdes e pode servir provisoriamente aqui, mas o ideal é gerar as 3 flechas simultâneas com o prompt abaixo.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv1_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, three silver-tipped arrows nocked and launched simultaneously in a tight fan of emerald wind trails, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv1_3` — Armadilha de Espinhos** `[REUSAR + REALOCAR ARTE EXISTENTE: 14_arqueiro_flecha_espinhosa_enredante.png]`
  - **Nota de realocação:** Copiar `14_arqueiro_flecha_espinhosa_enredante.png` (atualmente em `arqueiro_2.png`) para `arqueiro_nv1_3.png`.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv1_3.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, wicked thorny sylvan vines and iron ranger spikes erupting from the ground in a glowing emerald snare, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 3 — Nível 25 (`arqueiro_nv2_*`)
- **`arqueiro_nv2_1` — Saraivada de Flechas** `[REUSAR ARTE EXISTENTE: arqueiro_3.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv2_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a dense rain of glowing emerald and silver arrows falling diagonally from the sky onto a battlefield, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv2_2` — Tiro Perfurante de Armadura** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv2_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a heavy spiral-tipped silver bodkin arrow drilling straight through a thick steel breastplate with emerald shock rings, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv2_3` — Camuflagem da Floresta** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv2_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a hooded ranger cloak blending into swirling autumn oak leaves, moonlit mist and glowing emerald fireflies, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv2_4` — Companheiro Lobo Espiritual** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv2_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a fierce spectral wolf head formed of moonlit silver mist and glowing forest emerald runes lunging forward, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 4 — Nível 50 (`arqueiro_nv3_*`)
- **`arqueiro_nv3_1` — Flecha da Fênix Solar** `[GERAR NOVA ARTE]`
  - **Nota importante:** `arqueiro_4.png` atual mostra uma aljava verde (`16_arqueiro_aljava_celere_tempestade_de_flechas.png`) que não representa uma Fênix Solar. Gerar arte dedicada.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv3_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a legendary golden arrow transforming mid-flight into a blazing solar phoenix with emerald and sunlit gold wings, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv3_2` — Vento dos Mil Cortes** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv3_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a hurricane vortex of razor-sharp silver wind blades and emerald leaves slicing in all directions, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv3_3` — Disparo Letal no Coração** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv3_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a gleaming moonlit silver arrow piercing the exact center of a glowing vital heart sigil with emerald critical sparks, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`arqueiro_nv3_4` — Avatar da Caçada Selvagem** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/arqueiro_nv3_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a crowned horned lord of the wild silhouette holding a glowing astral longbow surrounded by emerald and silver gale spirits, forest emerald, moonlit silver and natural oak gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

---

### 3.5 MAGO (12 Habilidades)

#### Slot 1 — Nível 1 (`mago_base`)
- **`mago_base` — Míssil Mágico** `[REUSAR ARTE EXISTENTE: mago_1.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_base.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, three homing darts of pure arcane energy curving through the air with starlight trails, arcane sapphire blue, astral violet and fiery orange for fire spells, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 2 — Nível 10 (`mago_nv1_*`)
- **`mago_nv1_1` — Escudo Arcano** `[REUSAR ARTE EXISTENTE: mago_2.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv1_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a translucent hexagonal barrier of sacred geometry and glowing sapphire runes deflecting an impact, arcane sapphire blue, astral violet and fiery orange for fire spells, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv1_2` — Raio de Gelo** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv1_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a concentrated beam of piercing glacial frost crystallizing into sharp sapphire icicles on impact, arcane sapphire blue, astral violet and icy cyan-white, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv1_3` — Mãos Flamejantes** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv1_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, two outstretched spellcaster hands with thumbs touching unleashing a wide cone of roaring orange fire and arcane blue runes, arcane sapphire blue, astral violet and fiery orange for fire spells, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 3 — Nível 25 (`mago_nv2_*`)
- **`mago_nv2_1` — Nevasca Glacial** `[GERAR NOVA ARTE]`
  - **Nota importante:** `mago_3.png` atual mostra uma bola de fogo (`11_mago_bola_de_fogo.png`), que deve ser movida para `mago_nv3_1` (*Bola de Fogo Apocalíptica*). Gere uma tempestade de gelo real para `mago_nv2_1`.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv2_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a howling arcane blizzard vortex raining jagged sapphire hailstones and freezing frost runes, arcane sapphire blue, astral violet and glacial cyan, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv2_2` — Relâmpago em Cadeia** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv2_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a high-voltage arc of electric sapphire and violet lightning branching across three glowing arcane nodes, arcane sapphire blue, astral violet and electric white, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv2_3` — Evocação Arcana (Recuperar Mana)** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv2_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a levitating sapphire mana crystal and open spellbook drawing in swirling ribbons of astral violet energy, arcane sapphire blue, astral violet and fiery orange for fire spells, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv2_4` — Pele de Pedra Rúnica** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv2_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a mage robe and forearm armored in interlocking floating basalt stone plates carved with glowing sapphire runes, arcane sapphire blue, astral violet and stone silver, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 4 — Nível 50 (`mago_nv3_*`)
- **`mago_nv3_1` — Bola de Fogo Apocalíptica** `[REUSAR + REALOCAR ARTE EXISTENTE: 11_mago_bola_de_fogo.png]`
  - **Nota de realocação:** Copiar `11_mago_bola_de_fogo.png` (atualmente em `mago_3.png`) para `mago_nv3_1.png`, substituindo `mago_4.png` (`12_mago_desintegracao_arcana.png`).
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv3_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a colossal hurtling sphere of apocalyptic solar fire ringed by spinning sapphire and violet arcane runes, arcane sapphire blue, astral violet and fiery orange for fire spells, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv3_2` — Singularidade Temporal** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv3_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a shattered golden astronomical clockwork and hourglass collapsing into a luminous sapphire-violet time vortex, arcane sapphire blue, astral violet and chronos gold, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv3_3` — Raio Desintegrador** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv3_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a hyper-focused beam of blinding astral violet and sapphire arcane energy vaporizing matter into glowing dust, arcane sapphire blue, astral violet and fiery orange for fire spells, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`mago_nv3_4` — Ascensão do Arquimago** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/mago_nv3_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a floating archmage silhouette crowned with an astral halo and surrounded by orbiting spheres of fire, frost and sapphire lightning, arcane sapphire blue, astral violet and fiery orange for fire spells, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

---

### 3.6 BRUXO (12 Habilidades)

> **Atenção sobre o acervo atual (`25_bruxo_...` a `28_bruxo_...`):** Todos os 4 arquivos atuais do Bruxo têm a borda dourada superior cortada, e `28_bruxo_invocacao_do_abismo.png` (`bruxo_4.png`) contém uma marca d'água branca de cursor/varinha no canto inferior direito, além de retratar o *Lorde Demônio Maior* (`bruxo_nv3_2`) em vez da *Singularidade do Vazio* (`bruxo_nv3_1`).

#### Slot 1 — Nível 1 (`bruxo_base`)
- **`bruxo_base` — Rajada Mística** `[REVISAR ENQUADRAMENTO: bruxo_1.png]`
  - **Nota de revisão:** `25_bruxo_rajada_mistica.png` (`bruxo_1.png`) tem ótima leitura para *Rajada Mística*, precisando apenas restaurar a barra dourada superior da moldura.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_base.png`
  - **Prompt (caso deseje regenerar limpo):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a crackling bolt of eldritch purple and abyssal magenta energy spiraling from a clawed warlock hand, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 2 — Nível 10 (`bruxo_nv1_*`)
- **`bruxo_nv1_1` — Maldição da Agonia (Hex)** `[REVISAR ENQUADRAMENTO: bruxo_2.png]`
  - **Nota de revisão:** `26_bruxo_maldicao_de_agonia.png` (`bruxo_2.png`) retrata perfeitamente o crânio amaldiçoado com runas roxas/verdes; basta restaurar a barra dourada superior da moldura.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv1_1.png`
  - **Prompt (caso deseje regenerar limpo):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a cursed skull effigy bound in thorny chains and glowing with necrotic green and eldritch purple hex runes, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv1_2` — Drenar Alma** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv1_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a spectral siphon of necrotic green and abyssal magenta soul essence being pulled into a dark runic talisman, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv1_3` — Armadura de Sombras** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv1_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a warlock breastplate woven from living void-black shadow tendrils and glowing eldritch purple ward sigils, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 3 — Nível 25 (`bruxo_nv2_*`)
- **`bruxo_nv2_1` — Chamas do Inferno Verde** `[REVISAR ENQUADRAMENTO: bruxo_3.png]`
  - **Nota de revisão:** `27_bruxo_fome_de_hadar.png` (`bruxo_3.png`) exibe um vórtice de chamas verde-necróticas e roxas, coerente com *Chamas do Inferno Verde*. Basta restaurar a borda dourada superior da moldura.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv2_1.png`
  - **Prompt (caso deseje regenerar limpo):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, an erupting pillar of cursed necrotic green hellfire intertwined with abyssal magenta and purple smoke, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv2_2` — Pacto de Sangue Proibido** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv2_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, an ornate ritual dagger and floating blood chalice igniting with forbidden abyssal magenta and purple pact runes, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv2_3` — Grilhão de Sombras** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv2_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, heavy void-iron chains and shadowy tentacles rising from a glowing eldritch purple rune circle to bind an enemy, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv2_4` — Invocar Diabrete Sombrio** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv2_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a sinister winged shadow imp with glowing necrotic green eyes emerging from a swirling purple summoning portal, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 4 — Nível 50 (`bruxo_nv3_*`)
- **`bruxo_nv3_1` — Singularidade do Vazio** `[GERAR NOVA ARTE]`
  - **Nota importante:** `bruxo_4.png` (`28_bruxo_invocacao_do_abismo.png`) retrata um demônio chifrudo (que deve ir para `bruxo_nv3_2` após limpeza de watermark). Gere uma singularidade gravitacional abissal para `bruxo_nv3_1`.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv3_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a collapsing void-black gravitational singularity ringed by an accretion disk of abyssal magenta and necrotic green stars, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv3_2` — Invocar Lorde Demônio Maior** `[REVISAR ENQUADRAMENTO + LIMPAR WATERMARK + REALOCAR: 28_bruxo_invocacao_do_abismo.png]`
  - **Nota de revisão:** `28_bruxo_invocacao_do_abismo.png` (`bruxo_4.png`) retrata um imponente Lorde Demônio emergindo de um portal — perfeito para `bruxo_nv3_2`. É obrigatório remover a marca d'água branca no canto inferior direito e restaurar a borda dourada superior, ou regenerar com o prompt abaixo.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv3_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a towering horned abyssal demon lord wreathed in eldritch purple and necrotic green hellfire rising from a rift, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv3_3` — Ceifar Essência Vital** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv3_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a spectral abyssal scythe blade slicing through a glowing soul orb and releasing streams of necrotic green vitality, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`bruxo_nv3_4` — Avatar de Hadar** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/bruxo_nv3_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a cosmic eldritch entity silhouette cloaked in void-black nebula tentacles and glowing magenta eyes of Hadar, eldritch purple, abyssal magenta, necrotic green and void black, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

---

### 3.7 CLÉRIGO (12 Habilidades)

#### Slot 1 — Nível 1 (`clerigo_base`)
- **`clerigo_base` — Chama Sagrada** `[REUSAR ARTE EXISTENTE: clerigo_1.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_base.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a descending pillar of sacred golden-white solar fire striking down with celestial runes, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 2 — Nível 10 (`clerigo_nv1_*`)
- **`clerigo_nv1_1` — Palavra de Cura** `[GERAR NOVA ARTE]`
  - **Nota importante:** `clerigo_2.png` atual mostra um martelo flutuante (`06_clerigo_arma_espiritual.png`), que pertence semanticamente a `clerigo_nv2_2` (*Arma Espiritual Flutuante*). Gere mãos em prece/escritura curativa para `clerigo_nv1_1`.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv1_1.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, praying hands holding a floating scroll of golden-white celestial scripture radiating soothing healing light, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv1_2` — Escudo da Fé** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv1_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a floating translucent golden aegis shield emblazoned with a radiant sun crest and protective ivory wings, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv1_3` — Luz Punitiva** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv1_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a blinding spear-like beam of solar gold and white-blue judgment light piercing through dark shadow mist, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 3 — Nível 25 (`clerigo_nv2_*`)
- **`clerigo_nv2_1` — Guardiões Espirituais** `[REUSAR ARTE EXISTENTE: clerigo_3.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv2_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, luminous winged angelic spirit guardians orbiting in a protective ring of solar gold and celestial light, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv2_2` — Arma Espiritual Flutuante** `[REUSAR + REALOCAR ARTE EXISTENTE: 06_clerigo_arma_espiritual.png]`
  - **Nota de realocação:** Copiar `06_clerigo_arma_espiritual.png` (atualmente em `clerigo_2.png`) para `clerigo_nv2_2.png`.
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv2_2.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a levitating spectral warhammer forged of pure golden sunlight and ivory runes hovering in mid-air, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv2_3` — Oração de Restauração** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv2_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a golden chalice overflowing with luminous celestial white-blue nectar and rising dove-shaped light motes, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv2_4` — Bênção do Sol** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv2_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a radiant golden sunburst crest crowning an upward-pointing sword and shield with warm ivory rays, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

#### Slot 4 — Nível 50 (`clerigo_nv3_*`)
- **`clerigo_nv3_1` — Cólera dos Céus (Nova Solar)** `[REUSAR ARTE EXISTENTE: clerigo_4.png]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv3_1.png`
  - **Prompt (caso deseje regenerar no futuro):**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a cataclysmic solar supernova explosion of golden-white divine light and angelic wings parting the heavens, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv3_2` — Intervenção Divina (Milagre)** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv3_2.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a colossal luminous celestial hand descending from golden clouds to bestow a miracle halo of ivory light, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv3_3` — Julgamento do Arcanjo** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv3_3.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a blazing archangel greatsword flanked by two golden-white feathered wings striking downward in divine judgment, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```
- **`clerigo_nv3_4` — Santuário Eterno** `[GERAR NOVA ARTE]`
  - **Caminho rascunho:** `Docs/Conteudo/Propostas_2026-11-05/rascunhos_icones/clerigo_nv3_4.png`
  - **Prompt:**
    ```text
    Game skill icon for a dark medieval fantasy RPG, 1:1 square format, centered focal composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged gold runic border integrated at the edges, high contrast silhouette, a sacred cathedral dome of interlocking golden halos and celestial white-blue pillars protecting an altar of light, radiant solar gold, ivory light and celestial white-blue, dramatic magical lighting, no text, no letters, no numbers, no watermark, no external UI chrome, no extra frames outside the square.
    ```

---

## 4. Diretrizes de Prompts para Ícones dos Novos Equipamentos Propostos (`02_CATALOGO_PROPOSTO.md`)

Caso a equipe aprove a geração dos ícones para os **47 itens propostos** em [`02_CATALOGO_PROPOSTO.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/02_CATALOGO_PROPOSTO.md), utilize o mesmo padrão de ícone quadrado 1:1 com fundo de obsidiana escura para manter coesão com o inventário:

```text
Game equipment icon for a dark medieval fantasy RPG, 1:1 square format, centered single object composition, readable at 48x48 and 64x64 pixels, rich hand-painted digital illustration, dark obsidian vignette background, subtle aged bronze/gold border integrated at the edges, high contrast silhouette, [DESCRIÇÃO DO OBJETO FÍSICO], [PALETA DA RARIDADE E CLASSE], dramatic studio rim lighting, no text, no letters, no numbers, no watermark, no characters holding the item.
```

### Exemplos Prioritários (Itens das Receitas `v2` de Nível 5 e 15)

1. **`foco_novico_4` (Símbolo de Madeira Consagrada — Clérigo Lv 5):**
   - `...a carved oak solar reliquary pendant inlaid with warm brass and a glowing ivory sunstone in the center, radiant solar gold and warm oak palette...`
2. **`orbe_pacto_4` (Grimório de Sussurros — Bruxo Lv 5):**
   - `...a dark leather-bound pact tome clasped with blackened bronze and a glowing eldritch purple amethyst eye on the cover, eldritch purple and abyssal magenta palette...`
3. **`manopla_ki_4` (Faixas de Linho do Templo — Monge Lv 5):**
   - `...a pair of reinforced monastery linen hand-wraps and bronze knuckle guards glowing with subtle jade ki runes, jade emerald and warm gold palette...`
4. **`carta_fusao_2` (Carta de Fusão Rúnica — Ingrediente Lv 15):**
   - `...an ornate stone-and-gold runic tarot tablet etched with two converging anvil flames and sapphire-amber fusion sigils, warm forge gold and runic cyan palette...`

