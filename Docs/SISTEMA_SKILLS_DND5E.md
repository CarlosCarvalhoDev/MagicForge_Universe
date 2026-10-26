# ⚔️ Sistema de Habilidades Ativas (D&D 5e) — MagicForge: Universe

Este documento estrutura as **28 Habilidades Ativas** (4 Slots × 7 Classes) seguindo rigorosamente a progressão de círculos de magia e marcos marciais da **5ª Edição de Dungeons & Dragons**, adaptadas para o loop dinâmico de um **MMORPG Mobile**.

---

## 📐 Arquitetura de Progressão (Curva de Poder D&D 5e)

| Slot | Tier | Nível de Desbloqueio | Equivalência D&D 5e | Papel no Combate Mobile | Cooldown Médio |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Slot 1** | **Tier 1** | **Nível 1** | Truques (*Cantrips*) & 1º Círculo / Nível 1 Marcial | **Spammable / Rotação Base:** Dano direto de alvo único e aplicação de efeito leve. | `3s – 4s` |
| **Slot 2** | **Tier 2** | **Nível 10** | Magias de 2º Círculo / Características Táticas | **Tático / Sustain / Buff:** Cura pessoal, escudos, invocações de suporte ou debuffs táticos. | `10s – 14s` |
| **Slot 3** | **Tier 3** | **Nível 25** | Magias de 3º Círculo (*Power Spike*) | **Controle de Grupo (CC) & Área (AoE):** Limpeza de hordas, *Stun*, *Knock-up* ou zonas persistentes. | `14s – 18s` |
| **Slot 4** | **Tier 4** | **Nível 50** | Poderes Supremos de 5º Círculo (*Ultimate*) | **Ultimate Devastadora:** Alto impacto visual, mudança de estado (*Avatar*) ou aniquilação em área. | `45s – 50s` |

---

## 📊 1. Tabela Completa das 28 Habilidades por Classe

### 🛡️ 1.1. Guerreiro — Atributo Principal: Força (`STR`) | Recurso: Energia

| Slot | Nome da Skill (Ref. D&D 5e) | Custo | Cooldown | Fórmula de Dano / Cura | Efeito e Mecânica em Jogo |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** *(Nv. 1)* | **Ataque Poderoso** *(Great Weapon Master / Menacing Strike)* | 15 Energia | `4s` | `1d10 + (1.5 × STR)` | Golpe vertical pesado com espada longa. Causa dano físico elevado e reduz a Armadura (CA) do alvo em **10% por 4s**. |
| **2** *(Nv. 10)* | **Retomar o Fôlego** *(Second Wind)* | 25 Energia | `12s` | `Cura: 1d10 + (1.2 × STR) + Nível` | Recupera Vida instantaneamente com seu vigor marcial e concede **+20% de Redução de Dano** por **6s**. |
| **3** *(Nv. 25)* | **Golpe Amplo** *(Sweeping Attack / Shockwave)* | 40 Energia | `14s` | `2d8 + (1.8 × STR)` | Giro devastador em **360° (raio 4m)**. Atinge todos os inimigos ao redor, aplica **Provocação (Taunt)** e **Atordoamento (Stun) por 1.5s**. |
| **4** *(Nv. 50)* | **Avatar da Fúria** *(Action Surge + Destructive Wave 5º Círculo)* | 70 Energia | `45s` | `Impacto: 4d10 + (3.0 × STR)` | Crava a espada no chão gerando uma explosão sísmica dourada (raio 6m). Por **8s**, ganha **+35% ATQ**, **+30% Vel. de Ataque** e **Imunidade a CC**. |

---

### ☀️ 1.2. Clérigo — Atributo Principal: Sabedoria (`WIS`) | Recurso: Mana

| Slot | Nome da Skill (Ref. D&D 5e) | Custo | Cooldown | Fórmula de Dano / Cura | Efeito e Mecânica em Jogo |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** *(Nv. 1)* | **Chama Sagrada** *(Sacred Flame / Cure Wounds 1º Círculo)* | 15 Mana | `3.5s` | `Dano: 1d8 + (1.4 × WIS)`<br>`Cura: 1d6 + (1.0 × WIS)` | Faz descer um feixe de luz celestial no inimigo (ignora cobertura). Uma centelha sagrada ricocheteia curando levemente o Clérigo ou o aliado mais ferido. |
| **2** *(Nv. 10)* | **Arma Espiritual** *(Spiritual Weapon 2º Círculo)* | 35 Mana | `14s` | `1d8 + (1.2 × WIS) por golpe` *(6 golpes)* | Invoca uma maça espectral dourada flutuante que persegue e golpeia autonomamente o alvo a cada 1.3s durante **8s**. |
| **3** *(Nv. 25)* | **Guardiões Espirituais** *(Spirit Guardians 3º Círculo)* | 55 Mana | `18s` | `3d8 + (1.5 × WIS) / seg` *(por 6s)* | Espíritos angelicais orbitam o Clérigo (raio 4.5m) por **6s**, causando dano Radiante contínuo por segundo e **Lentidão de 40%** nos inimigos. |
| **4** *(Nv. 50)* | **Coluna de Chamas Divinas** *(Flame Strike + Mass Cure Wounds 5º Círculo)* | 90 Mana | `45s` | `Dano: 4d6 Fogo + 4d6 Rad + (2.8 × WIS)`<br>`Cura Área: 3d8 + (2.0 × WIS)` | Abre os céus em um cilindro colossal de fogo divino e luz solar (raio 5m), incinerando os inimigos e curando em massa todos os aliados na área. |

---

### 🔥 1.3. Mago — Atributo Principal: Inteligência (`INT`) | Recurso: Mana

| Slot | Nome da Skill (Ref. D&D 5e) | Custo | Cooldown | Fórmula de Dano / Cura | Efeito e Mecânica em Jogo |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** *(Nv. 1)* | **Raio de Fogo** *(Fire Bolt - Truque)* | 12 Mana | `3s` | `1d10 + (1.6 × INT)`<br>`+ Queimadura (0.4 × INT/s)` | Dispara um projétil volátil de fogo arcano que causa dano imediato e incendeia o alvo por **3s**. |
| **2** *(Nv. 10)* | **Lâmina Flamejante Arcana** *(Scorching Ray / Flame Blade 2º Círculo)* | 35 Mana | `10s` | `3 feixes × [2d6 + (0.8 × INT)]`<br>*(Total: 6d6 + 2.4 × INT)* | Conjura 3 lâminas de plasma ígneo em rápida sucessão contra o alvo, derretendo sua **Resistência Mágica em 15% por 5s**. |
| **3** *(Nv. 25)* | **Bola de Fogo** *(Fireball 3º Círculo)* | 60 Mana | `16s` | `8d6 + (2.2 × INT)` | Detona uma esfera colossal de chamas (raio 5m), causando altíssimo dano em área e aplicando **Empurrão (Knockback)** nos sobreviventes. |
| **4** *(Nv. 50)* | **Desintegração Arcana** *(Disintegrate - Ultimate)* | 95 Mana | `45s` | `10d6 + 40 + (3.5 × INT)` | Dispara um feixe esmeralda-violeta concentrado em linha (12m) de dano de Energia Pura (*Force*). Alvos eliminados viram pó e explodem em mana. |

---

### 🏹 1.4. Arqueiro — Atributo Principal: Destreza (`DEX`) | Recurso: Energia

| Slot | Nome da Skill (Ref. D&D 5e) | Custo | Cooldown | Fórmula de Dano / Cura | Efeito e Mecânica em Jogo |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** *(Nv. 1)* | **Disparo Perfurante com Marca** *(Hunter's Mark + Piercing Shot 1º Círculo)* | 15 Energia | `4s` | `1d8 + (1.5 × DEX)`<br>`Marca: +1d6 por hit` | Dispara uma flecha veloz que aplica a **Marca do Caçador por 5s**, adicionando `+1d6` de dano extra a todos os ataques básicos contra o alvo. |
| **2** *(Nv. 10)* | **Flecha Espinhosa Enredante** *(Spike Growth / Ensnaring Strike 2º Círculo)* | 30 Energia | `11s` | `2d6 + (1.4 × DEX)`<br>`+ Sangramento 1d4/s (4s)` | A flecha explode em vinhas espinhosas no impacto (raio 3m), aplicando **Enraizar (Root) por 2.5s** e dano de sangramento contínuo. |
| **3** *(Nv. 25)* | **Saraivada Relâmpago** *(Conjure Barrage / Lightning Arrow 3º Círculo)* | 45 Energia | `15s` | `4d8 + (2.0 × DEX)` | Faz chover dezenas de flechas eletrificadas em um círculo de 5m, causando dano em área e **Lentidão de 50% por 3s**. |
| **4** *(Nv. 50)* | **Aljava Célere: Tempestade de Flechas** *(Swift Quiver + Conjure Volley 5º Círculo)* | 75 Energia | `45s` | `8d8 + (3.2 × DEX)`<br>`Buff: +50% Vel. ATQ (6s)` | Bombardeia o campo (raio 6m) com centenas de flechas espectrais douradas e esmeraldas, e aumenta a **Velocidade de Ataque em +50% por 6s**. |

---

### 🪓 1.5. Bárbaro — Atributo Principal: Força (`STR`) | Recurso: Fúria / Energia

| Slot | Nome da Skill (Ref. D&D 5e) | Custo | Cooldown | Fórmula de Dano / Cura | Efeito e Mecânica em Jogo |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** *(Nv. 1)* | **Ataque Descuidado** *(Reckless Attack)* | 15 Energia | `4s` | `1d12 + (1.7 × STR)` | Golpe selvagem de machado que ignora a guarda para ganhar **+25% de Chance de Acerto Crítico garantida**. |
| **2** *(Nv. 10)* | **Fúria Totêmica do Urso** *(Totem Spirit: Bear + Rage)* | 30 Energia | `14s` | `Escudo: (2.0 × STR) + 15% HP Máx` | Urro primal que invoca o espírito do Urso: concede escudo, **reduz todo dano recebido em 30%** e aumenta o dano de `STR` em **+20% por 6s**. |
| **3** *(Nv. 25)* | **Salto Sísmico Brutal** *(Brutal Critical + Tiger Leap)* | 45 Energia | `15s` | `3d12 + (2.0 × STR)` | Salta até 8m sobre a horda inimiga esmagando o solo (raio 4m), causando dano massivo e **Lançamento ao Ar (Knock-up) por 1.5s**. |
| **4** *(Nv. 50)* | **Fúria Imortal do Berserker** *(Relentless Rage + Destructive Wrath)* | 75 Energia | `50s` | `4d12 + (3.5 × STR)`<br>`+ 30% Roubo de Vida` | Explosão vulcânica de fúria ancestral. Por **6s**, o Bárbaro fica **Imortal (HP não cai abaixo de 1)**, ganha **+40% Vel. ATQ** e **30% Roubo de Vida**. |

---

### 🤛 1.6. Monge — Atributo Principal: Destreza (`DEX`) | Recurso: Chi (Energia)

| Slot | Nome da Skill (Ref. D&D 5e) | Custo | Cooldown | Fórmula de Dano / Cura | Efeito e Mecânica em Jogo |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** *(Nv. 1)* | **Rajada de Golpes** *(Flurry of Blows)* | 15 Chi | `3.5s` | `3 golpes × [1d6 + (0.6 × DEX)]`<br>*(Total: 3d6 + 1.8 × DEX)* | Canaliza o Chi nos punhos e pés para desferir uma sequência relâmpago de 3 golpes marciais em menos de 1 segundo. |
| **2** *(Nv. 10)* | **Passo do Vento e Defesa Paciente** *(Patient Defense + Deflect Missiles)* | 25 Chi | `11s` | `Pulso: 2d8 + (1.4 × DEX)` | Libera um pulso de Chi que repele inimigos próximos e concede **+35% de Esquiva** e **+25% de Velocidade de Movimento por 5s**. |
| **3** *(Nv. 25)* | **Ataque Atordoante do Dragão** *(Stunning Strike)* | 45 Chi | `14s` | `3d8 + (2.0 × DEX)` | Avança 5m envolto na aura de um dragão de Chi, golpeando os pontos vitais de todos na área (3.5m) e aplicando **Atordoamento (Stun) de 2s**. |
| **4** *(Nv. 50)* | **Palma Vibratória dos Mil Sóis** *(Quivering Palm)* | 80 Chi | `45s` | `Impacto: 4d10 + (1.5 × DEX)`<br>`Detonação: 6d10 + (2.5 × DEX)` | Aplica vibrações letais de Chi no alvo e nos inimigos ao redor; após 1s, os chakras detonam em uma explosão solar dourada devastadora. |

---

### 👁️ 1.7. Bruxo — Atributo Principal: Carisma (`CHA`) | Recurso: Mana

| Slot | Nome da Skill (Ref. D&D 5e) | Custo | Cooldown | Fórmula de Dano / Cura | Efeito e Mecânica em Jogo |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** *(Nv. 1)* | **Rajada Mística Agonizante** *(Eldritch Blast + Agonizing Blast)* | 12 Mana | `3s` | `1d10 + (1.6 × CHA)` | Dispara um feixe crepitante de energia oculta que causa alto dano concussivo somando o modificador de Carisma e empurra levemente o alvo. |
| **2** *(Nv. 10)* | **Bruxaria e Toque Vampírico** *(Hex + Vampiric Siphon 2º Círculo)* | 35 Mana | `12s` | `2d8 + (1.4 × CHA)`<br>`Cura: 50% do dano causado` | Amaldiçoa o alvo com uma runa sombria, drenando sua vida para curar o Bruxo e aumentando todo o dano que o alvo recebe em **+15% por 6s**. |
| **3** *(Nv. 25)* | **Fome de Hadar** *(Hunger of Hadar 3º Círculo)* | 60 Mana | `18s` | `(2d6 Frio + 2d6 Ácido + 1.8 × CHA) / seg` *(4s)* | Abre um vórtice de escuridão estelar com tentáculos abissais (raio 4.5m) que **puxa inimigos para o centro**, aplica **60% Lentidão** e dano contínuo. |
| **4** *(Nv. 50)* | **Chama Sinistra do Patrono Abissal** *(Synaptic Static / Hurl Through Hell 5º Círculo)* | 95 Mana | `45s` | `8d8 + (3.4 × CHA)` | A manifestação colossal do Patrono rasga o espaço desencadeando fogo infernal roxo e choque psíquico (raio 6m), causando **Medo (Fear) por 2s**. |

---

## 🎨 2. Prompts Prontos de IA para os 28 Ícones de Habilidades

Todos os prompts abaixo seguem a diretriz visual padronizada do **MagicForge: Universe**:
* **Formato:** Ícone quadrado (`--ar 1:1`) de UI Mobile RPG.
* **Composição:** Fundo escuro sólido (obsidiana/preto) para máximo contraste, efeito mágico vibrante em primeiro plano e **borda dourada ornamentada** (*ornate golden border frame*).

### 🛡️ Guerreiro (STR)
1. **Slot 1 — Ataque Poderoso:**
   > `Square mobile RPG skill icon, a heavy glowing steel broadsword cleaving downward with fiery orange-red shockwave sparks, shattered armor fragments, solid dark obsidian background, vibrant magical particle effects, ornate golden border frame, stylized 3D cel-shaded game UI art, high contrast, --ar 1:1`
2. **Slot 2 — Retomar o Fôlego:**
   > `Square mobile RPG skill icon, a heroic golden heart emblem surrounded by rising emerald and gold vitality aura waves and a glowing silver shield silhouette, solid dark background, vibrant magical healing energy, ornate golden border frame, stylized mobile game UI icon, --ar 1:1`
3. **Slot 3 — Golpe Amplo:**
   > `Square mobile RPG skill icon, a blazing 360-degree crescent blade slash vortex of crimson and golden light tearing through the air, seismic ground cracks, solid dark background, vibrant magical combat VFX, ornate golden border frame, stylized mobile RPG UI asset, --ar 1:1`
4. **Slot 4 (Ultimate) — Avatar da Fúria:**
   > `Square mobile RPG skill icon, a transcendent knight helmet and colossal greatsword erupting with blinding golden-crimson divine wrath lightning and a majestic shockwave halo, solid dark background, intense vibrant ultimate magic aura, ornate golden border frame, masterpiece game UI icon, --ar 1:1`

### ☀️ Clérigo (WIS)
5. **Slot 1 — Chama Sagrada:**
   > `Square mobile RPG skill icon, a descending pillar of radiant golden-white sacred fire igniting with gentle celestial feathers and sparkles, solid dark background, vibrant divine glow, ornate golden border frame, stylized mobile RPG UI icon, --ar 1:1`
6. **Slot 2 — Arma Espiritual:**
   > `Square mobile RPG skill icon, a levitating spectral warhammer forged of translucent golden and cyan celestial light surrounded by floating runic rings, solid dark background, vibrant magical illumination, ornate golden border frame, stylized mobile game UI art, --ar 1:1`
7. **Slot 3 — Guardiões Espirituais:**
   > `Square mobile RPG skill icon, ethereal glowing golden angelic spirits with luminous wings swirling in a protective magic circle vortex, solid dark background, vibrant holy particle effects, ornate golden border frame, stylized mobile RPG UI asset, --ar 1:1`
8. **Slot 4 (Ultimate) — Coluna de Chamas Divinas:**
   > `Square mobile RPG skill icon, a colossal roaring pillar of solar fire and blinding divine golden light crashing down from heaven with angelic sigils, solid dark background, intense vibrant ultimate spell effect, ornate golden border frame, masterpiece game UI icon, --ar 1:1`

### 🔥 Mago (INT)
9. **Slot 1 — Raio de Fogo:**
   > `Square mobile RPG skill icon, a streaking arcane bolt of blazing orange and magenta fire with swirling ember trails and runic sparks, solid dark background, vibrant magical glow, ornate golden border frame, stylized mobile RPG UI icon, --ar 1:1`
10. **Slot 2 — Lâmina Flamejante Arcana:**
    > `Square mobile RPG skill icon, three curved blades of incandescent fiery plasma and cyan arcane energy slicing forward in a triad pattern, solid dark background, vibrant spell particles, ornate golden border frame, stylized mobile game UI art, --ar 1:1`
11. **Slot 3 — Bola de Fogo:**
    > `Square mobile RPG skill icon, a massive detonating sphere of roaring orange-red wildfire and shockwave rings with glowing arcane geometry, solid dark background, vibrant explosive magic VFX, ornate golden border frame, stylized mobile RPG UI asset, --ar 1:1`
12. **Slot 4 (Ultimate) — Desintegração Arcana:**
    > `Square mobile RPG skill icon, a hyper-concentrated beam of neon emerald and arcane violet disintegration energy atomizing crystalline matter into glowing dust, solid dark background, intense vibrant ultimate magic aura, ornate golden border frame, masterpiece game UI icon, --ar 1:1`

### 🏹 Arqueiro (DEX)
13. **Slot 1 — Disparo Perfurante com Marca:**
    > `Square mobile RPG skill icon, a razor-sharp elven arrow glowing with emerald wind energy piercing through a glowing green hunter target mark, solid dark background, vibrant magical trail, ornate golden border frame, stylized mobile RPG UI icon, --ar 1:1`
14. **Slot 2 — Flecha Espinhosa Enredante:**
    > `Square mobile RPG skill icon, a magical wooden arrow erupting into glowing emerald thorny vines and glowing crimson briar spikes, solid dark background, vibrant nature magic VFX, ornate golden border frame, stylized mobile game UI art, --ar 1:1`
15. **Slot 3 — Saraivada Relâmpago:**
    > `Square mobile RPG skill icon, a torrential rain of glowing cyan and golden lightning arrows falling diagonally with electric arcs, solid dark background, vibrant storm particle effects, ornate golden border frame, stylized mobile RPG UI asset, --ar 1:1`
16. **Slot 4 (Ultimate) — Aljava Célere: Tempestade de Flechas:**
    > `Square mobile RPG skill icon, a radiant golden mystical quiver overflowing with spectral emerald and starlight arrows launching in a supersonic vortex, solid dark background, intense vibrant ultimate magic aura, ornate golden border frame, masterpiece game UI icon, --ar 1:1`

### 🪓 Bárbaro (STR)
17. **Slot 1 — Ataque Descuidado:**
    > `Square mobile RPG skill icon, a jagged double-bladed barbarian greataxe swinging with feral blood-red and molten orange rage trails, solid dark background, vibrant primal sparks, ornate golden border frame, stylized mobile RPG UI icon, --ar 1:1`
18. **Slot 2 — Fúria Totêmica do Urso:**
    > `Square mobile RPG skill icon, a roaring spectral glowing crimson and amber bear spirit head materializing above crossed tribal axes, solid dark background, vibrant primal totem energy, ornate golden border frame, stylized mobile game UI art, --ar 1:1`
19. **Slot 3 — Salto Sísmico Brutal:**
    > `Square mobile RPG skill icon, a colossal barbarian warhammer and axe slamming into the ground creating magma fissures and fiery shockwave rings, solid dark background, vibrant earth-shattering VFX, ornate golden border frame, stylized mobile RPG UI asset, --ar 1:1`
20. **Slot 4 (Ultimate) — Fúria Imortal do Berserker:**
    > `Square mobile RPG skill icon, a berserker warrior silhouette engulfed in a towering inferno of crimson lightning, glowing skull totem eyes, and volcanic aura, solid dark background, intense vibrant ultimate rage VFX, ornate golden border frame, masterpiece game UI icon, --ar 1:1`

### 🤛 Monge (DEX)
21. **Slot 1 — Rajada de Golpes:**
    > `Square mobile RPG skill icon, multiple glowing cyan and golden martial arts fists striking forward at supersonic speed with chi shockwave rings, solid dark background, vibrant spirit energy particles, ornate golden border frame, stylized mobile RPG UI icon, --ar 1:1`
22. **Slot 2 — Passo do Vento e Defesa Paciente:**
    > `Square mobile RPG skill icon, a glowing jade and turquoise lotus chi barrier deflecting incoming arrows with swirling wind ribbons, solid dark background, vibrant mystical monk aura, ornate golden border frame, stylized mobile game UI art, --ar 1:1`
23. **Slot 3 — Ataque Atordoante do Dragão:**
    > `Square mobile RPG skill icon, a glowing golden-cyan dragon spirit coiling around a striking open palm emitting thunderous pressure-point shockwaves, solid dark background, vibrant martial chi VFX, ornate golden border frame, stylized mobile RPG UI asset, --ar 1:1`
24. **Slot 4 (Ultimate) — Palma Vibratória dos Mil Sóis:**
    > `Square mobile RPG skill icon, a radiant golden Buddha-like open hand sigil glowing with blinding solar chi chakras and shattering dimensional rings, solid dark background, intense vibrant ultimate monk aura, ornate golden border frame, masterpiece game UI icon, --ar 1:1`

### 👁️ Bruxo (CHA)
25. **Slot 1 — Rajada Mística Agonizante:**
    > `Square mobile RPG skill icon, a crackling beam of dark eldritch violet and neon green energy erupting from a warlock sigil, solid dark background, vibrant occult particle effects, ornate golden border frame, stylized mobile RPG UI icon, --ar 1:1`
26. **Slot 2 — Bruxaria e Toque Vampírico:**
    > `Square mobile RPG skill icon, a glowing purple and crimson cursed hex skull rune siphoning swirling blood-red life essence threads, solid dark background, vibrant dark magic glow, ornate golden border frame, stylized mobile game UI art, --ar 1:1`
27. **Slot 3 — Fome de Hadar:**
    > `Square mobile RPG skill icon, a swirling cosmic void sphere of deep purple darkness with glowing neon-green abyssal tentacles and dying stars, solid dark background, vibrant eldritch vortex VFX, ornate golden border frame, stylized mobile RPG UI asset, --ar 1:1`
28. **Slot 4 (Ultimate) — Chama Sinistra do Patrono Abissal:**
    > `Square mobile RPG skill icon, a colossal horned eldritch patron silhouette emerging from a cataclysmic purple and hellfire-green dimensional rift explosion, solid dark background, intense vibrant ultimate warlock magic, ornate golden border frame, masterpiece game UI icon, --ar 1:1`
