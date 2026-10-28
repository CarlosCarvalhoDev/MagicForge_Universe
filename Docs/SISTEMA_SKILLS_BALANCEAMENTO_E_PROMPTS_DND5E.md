# ⚔️ Sistema de Skills, Balanceamento D&D 5E e Prompts de Imagem (IA)

Este documento estabelece as regras oficiais de progressão de habilidades, slots de magia (Spell Slots D&D 5E) e a lista completa de **84 habilidades** divididas entre as **7 classes** do **MagicForge: Universe**, acompanhadas dos **prompts de inteligência artificial** prontos para gerar seus ícones.

---

## 1. Filosofia de Design & Balanceamento (D&D 5E & Idle MMORPG)

### 1.1 Curva de Progressão & Reborns
- Os níveis são progressivos e recompensadores, preparando o personagem para futuros **Reborns / Transcendências**.
- O ganho de XP desacelera conforme o personagem avança para que cada novo nível e cada novo slot represente um verdadeiro marco de poder.

| Slot de Habilidade | Círculo de Magia D&D 5E | Nível de Desbloqueio | Papel Estratégico | Cooldown Médio |
|---|---|---|---|---|
| **Slot 1** | **Truque (Cantrip)** | **Nível 10** | Dano base, gerador de recurso e rotação contínua | 2.0s – 3.5s |
| **Slot 2** | **Magia de 1º Círculo** | **Nível 20** | Sustento, cura, esteroide de dano ou defesa tática | 6.0s – 9.0s |
| **Slot 3** | **Magia de 2º Círculo** | **Nível 35** | Dano em área (AoE), controle de grupo ou impacto tático | 11.0s – 15.0s |
| **Slot 4** | **Magia de 3º Círculo (Ultimate)** | **Nível 50** | O divisor de águas da build: dano massivo, cataclismo | 38.0s – 45.0s |

### 1.2 Modularidade das Builds (3 Opções por Slot = 81 Builds por Classe)
Em cada um dos 4 slots, o jogador escolhe **1 entre 3 habilidades exclusivas** da sua classe. Isso cria:
$$3 \times 3 \times 3 \times 3 = 81 \text{ combinações de build únicas por classe!}$$

---

## 2. A Fórmula Mestre para Geração dos Ícones de Skills (IA)

Use este template no **Midjourney v6**, **DALL-E 3**, **Stable Diffusion** ou **Leonardo.ai**:

```text
Square fantasy RPG skill icon, [DESCRIÇÃO DO EFEITO / ELEMENTO], stylized 2D game UI ability icon, vibrant saturated colors, glowing magical particles, ornate gold beveled border frame, dark radial background, clean sharp silhouette, mobile MMORPG spell icon asset, high resolution, --ar 1:1
```

---

## 3. Matriz Completa de Habilidades por Classe

---

### 3.1 GUERREIRO (`GUERREIRO` — STR | Recurso: Energia)

#### Slot 1: Truques (Desbloqueio: Nv. 10)
1. **Golpe Firme (`guerreiro_truque_1`)**
   - *Papel:* Dano físico rápido e regeneração de 5 de Energia.
   - *Dano:* `1.35x FOR` | *CD:* `2.5s` | *Custo:* `10 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, glowing steel broadsword slashing downwards with white energy trails and sparks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

2. **Golpe Dilacerante (`guerreiro_truque_2`)**
   - *Papel:* Dano com sangramento contínuo por 3 segundos.
   - *Dano:* `1.1x FOR + 0.4x FOR/s` | *CD:* `3.2s` | *Custo:* `12 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, jagged battle blade dripping with crimson red blood energy and visceral laceration slash marks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

3. **Corte de Ruptura (`guerreiro_truque_3`)**
   - *Papel:* Dano físico que estilhaça a armadura do alvo em 15% por 5s.
   - *Dano:* `1.25x FOR` | *CD:* `3.8s` | *Custo:* `15 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, heavy iron war cleaver fracturing a glowing metal shield into sharp shards, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 2: Magia de Nível 1 (Desbloqueio: Nv. 20)
1. **Retomar o Fôlego (`guerreiro_nv1_1` - Second Wind D&D 5E)**
   - *Papel:* Recuperação vigorosa de HP instantânea.
   - *Cura:* `1.6x FOR + 2x Nível` | *CD:* `8.0s` | *Custo:* `20 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, glowing emerald heart wrapped in golden chivalric armor plates with restorative green light rays, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

2. **Postura de Investida Furiosa (`guerreiro_nv1_2`)**
   - *Papel:* Investida veloz com bônus de +25% velocidade de ataque por 6s.
   - *Dano:* `1.6x FOR` | *CD:* `7.5s` | *Custo:* `22 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, armored knight helmet silhouette surrounded by burning orange speed flames and aggressive momentum arrows, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

3. **Escudo Desarmador (`guerreiro_nv1_3`)**
   - *Papel:* Golpe contundente que atordoa o monstro por 1.5s.
   - *Dano:* `1.4x FOR + 0.5x CON` | *CD:* `7.0s` | *Custo:* `25 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, heavy lion-crested kite shield slamming forward with yellow electric shockwave rings, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 3: Magia de Nível 2 (Desbloqueio: Nv. 35)
1. **Redemoinho de Aço (`guerreiro_nv2_1`)**
   - *Papel:* Dano em área circular de 360° (5m).
   - *Dano:* `2.3x FOR (Área)` | *CD:* `12.0s` | *Custo:* `35 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, double-edged greatsword spinning in a devastating 360 degree silver blade cyclone with wind vortex trails, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

2. **Baluarte de Aço Inquebrável (`guerreiro_nv2_2`)**
   - *Papel:* Barreira de absorção igual a 30% do HP Máximo por 6s.
   - *Defesa:* Escudo 30% HP | *CD:* `14.0s` | *Custo:* `40 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, majestic fortress bastion tower bathed in golden light with magical rune shields deflecting incoming arrows, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

3. **Golpe Colossal (`guerreiro_nv2_3`)**
   - *Papel:* Impacto sísmico frontal em linha perfurante (4.5m).
   - *Dano:* `2.6x FOR` | *CD:* `13.0s` | *Custo:* `38 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, colossal runic claymore smashing downward cracking the stone ground with molten golden magma fissure, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 4: Ultimate / Nível 3 (Desbloqueio: Nv. 50)
1. **Avatar da Guerra Cósmica (`guerreiro_nv3_1`)**
   - *Papel:* Explosão sísmica em 7m de raio e +30% Dano Físico por 10s.
   - *Dano:* `3.6x FOR + 1.5x CON` | *CD:* `40.0s` | *Custo:* `65 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, celestial winged golden paladin avatar wielding two flaming broadswords amid a supernova explosion, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

2. **Espada do Juízo Titânico (`guerreiro_nv3_2`)**
   - *Papel:* Lâmina celestial gigante caindo dos céus no alvo e arredores.
   - *Dano:* `4.4x FOR` | *CD:* `44.0s` | *Custo:* `70 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, massive glowing holy ethereal blade descending from thunderous golden storm clouds into the earth, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

3. **Última Resistência Imortal (`guerreiro_nv3_3`)**
   - *Papel:* Imunidade a dano letal por 5s, cura de 40% HP e ondas radiantes.
   - *Efeito:* Imunidade + 40% HP | *CD:* `45.0s` | *Custo:* `60 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, glowing divine ankh symbol fused with twin crossed swords radiating blinding white and gold aura of immortality, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

---

### 3.2 BÁRBARO (`BARBARO` — STR / CON | Recurso: Fúria)

#### Slot 1: Truques (Desbloqueio: Nv. 10)
1. **Cutilada Selvagem (`barbaro_truque_1`)**
   - *Dano:* `1.4x FOR` | *CD:* `2.4s` | *Custo:* `10 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, double-headed bearded battle axe cleaving fiercely with glowing orange ember streaks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Pisotão Sísmico (`barbaro_truque_2`)**
   - *Dano:* `1.2x FOR + 0.4x CON` (Lentidão 30%) | *CD:* `3.4s` | *Custo:* `12 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, heavy spiked berserker boot stomping down creating radial shockwaves and flying boulders, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Mordida Voraz (`barbaro_truque_3`)**
   - *Dano:* `1.3x FOR` (Converte 20% em HP) | *CD:* `3.0s` | *Custo:* `14 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, glowing spectral wolf jaws snapping shut with primal crimson life-drain vortex, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 2: Magia de Nível 1 (Desbloqueio: Nv. 20)
1. **Fúria Primitiva (`barbaro_nv1_1` - Rage D&D 5E)**
   - *Efeito:* +25% Dano, -15% Dano Sofrido por 6s | *CD:* `8.5s` | *Custo:* `20 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, roaring berserker face silhouette with glowing red eyes surrounded by furious fiery crimson aura, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Rugido Desmoralizador (`barbaro_nv1_2`)**
   - *Efeito:* -20% Ataque dos inimigos em área | *CD:* `8.0s` | *Custo:* `22 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, sonic primal warhorn blowing outwards with purple soundwaves disrupting monster silhouettes, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Carga do Juggernaut (`barbaro_nv1_3`)**
   - *Dano:* `1.75x FOR` (Atordoa por 2s) | *CD:* `7.2s` | *Custo:* `24 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, charging flaming horned minotaur head ramming forward shattering iron chains, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 3: Magia de Nível 2 (Desbloqueio: Nv. 35)
1. **Banho de Sangue (`barbaro_nv2_1`)**
   - *Dano:* `2.4x FOR (Área 5m)` | *CD:* `12.0s` | *Custo:* `35 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, twin bloodstained war axes spinning in an expansive red vortex of carnage, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Pele Rochosa Ancestral (`barbaro_nv2_2`)**
   - *Efeito:* +50% Armadura baseada em CON e +15% HP | *CD:* `14.5s` | *Custo:* `38 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, ancient granite totem carving with glowing blue tribal runes encasing a muscular torso, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Salto Devastador dos Titãs (`barbaro_nv2_3`)**
   - *Dano:* `2.6x FOR (Impacto 5m)` | *CD:* `13.0s` | *Custo:* `36 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, silhouetted warrior leaping high above with blazing greataxe plunging into shattered crater, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 4: Ultimate / Nível 3 (Desbloqueio: Nv. 50)
1. **Cólera do Vulcão dos Deuses (`barbaro_nv3_1`)**
   - *Dano:* `3.9x FOR + 2.0x CON (Área 7m)` | *CD:* `42.0s` | *Custo:* `65 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, volcanic magma eruption bursting with flaming meteors and fiery ground fissures, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Guilhotina do Cataclismo (`barbaro_nv3_2`)**
   - *Dano:* `5.2x FOR` (Dano dobrado se alvo < 30% HP) | *CD:* `45.0s` | *Custo:* `70 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, massive executioner axe cleaving through a colossal dragon skull with blazing sparks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Frenesi da Matilha Espectral (`barbaro_nv3_3`)**
   - *Dano:* `4.2x FOR (Matilha por 10s)` | *CD:* `40.0s` | *Custo:* `60 Fúria`
   - **Prompt:** `Square fantasy RPG skill icon, pack of glowing ghostly blue dire wolves charging forward through spectral mist, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

---

### 3.3 MONGE (`MONGE` — DEX / WIS | Recurso: Chi)

#### Slot 1: Truques (Desbloqueio: Nv. 10)
1. **Palma de Chi Rápida (`monge_truque_1`)**
   - *Dano:* `1.35x DES` | *CD:* `2.2s` | *Custo:* `10 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, open martial artist hand glowing with vibrant cyan and gold Chi energy ripples, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Chute Giratório do Vendaval (`monge_truque_2`)**
   - *Dano:* `1.2x DES + 0.3x SAB` | *CD:* `2.8s` | *Custo:* `12 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, high spinning roundhouse kick surrounded by a glowing cyan cyclone of air currents, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Golpe de Meridiano Vital (`monge_truque_3`)**
   - *Dano:* `1.3x DES` (Reduz velocidade de ataque em 20%) | *CD:* `3.0s` | *Custo:* `14 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, glowing finger tapping an anatomical acupressure point releasing electric blue spark pulses, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 2: Magia de Nível 1 (Desbloqueio: Nv. 20)
1. **Rajada de Golpes (`monge_nv1_1` - Flurry of Blows D&D 5E)**
   - *Dano:* `1.85x DES (4 socos rápidos)` | *CD:* `6.5s` | *Custo:* `20 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, multiple overlapping translucent glowing fists striking in rapid blinding succession, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Passo do Vento Evasivo (`monge_nv1_2` - Step of the Wind)**
   - *Efeito:* +35% Esquiva, +15% Crítico por 5s | *CD:* `7.0s` | *Custo:* `22 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, monk silhouette dissolving into serene wind gusts and glowing golden leaf petals, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Respiração Curativa do Lótus (`monge_nv1_3`)**
   - *Cura:* `1.6x SAB + 1.2x DES` | *CD:* `8.0s` | *Custo:* `25 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, blooming radiant golden lotus flower floating above palms radiating warm healing light, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 3: Magia de Nível 2 (Desbloqueio: Nv. 35)
1. **Golpe Atordoante Celestial (`monge_nv2_1` - Stunning Strike D&D 5E)**
   - *Dano:* `2.3x DES` (Atordoa por 2.5s) | *CD:* `11.0s` | *Custo:* `35 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, direct palm strike releasing a golden bell chime resonance that stuns the surrounding air, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Sopro Espiritual do Dragão (`monge_nv2_2`)**
   - *Dano:* `2.4x SAB + 1.0x DES (Cone 5m)` | *CD:* `12.0s` | *Custo:* `38 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, ethereal oriental dragon head projecting a wave of blazing cyan chi flames forward, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Dança das Sombras Ilusórias (`monge_nv2_3`)**
   - *Dano:* `2.2x DES (Área 4.5m)` | *CD:* `13.0s` | *Custo:* `36 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, three shadowy monk martial silhouettes executing coordinated simultaneous kicks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 4: Ultimate / Nível 3 (Desbloqueio: Nv. 50)
1. **Palma dos Cinco Pontos da Morte (`monge_nv3_1` - Quivering Palm D&D 5E)**
   - *Dano:* `4.6x DES + 2.0x SAB` | *CD:* `42.0s` | *Custo:* `65 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, glowing golden hand radiating five distinct deadly energy lines striking a shattered heart core, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Forma Suprema do Dragão Dourado (`monge_nv3_2`)**
   - *Dano:* `3.8x DES + 2.0x SAB (Tela inteira)` | *CD:* `45.0s` | *Custo:* `70 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, colossal majestic golden imperial dragon spiraling upwards into the heavens with blinding aura, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Domo do Vazio Sereno (`monge_nv3_3`)**
   - *Efeito:* Silencia monstros, cura o monge e causa `3.9x SAB` em 6m | *CD:* `40.0s` | *Custo:* `60 Chi`
   - **Prompt:** `Square fantasy RPG skill icon, glowing zen yin-yang sphere of tranquil turquoise light creating an impenetrable sanctuary dome, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

---

### 3.4 ARQUEIRO / RANGER (`ARQUEIRO` — DEX | Recurso: Energia)

#### Slot 1: Truques (Desbloqueio: Nv. 10)
1. **Tiro Certeiro Longínquo (`arqueiro_truque_1`)**
   - *Dano:* `1.35x DES (10m)` | *CD:* `2.4s` | *Custo:* `10 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, sharp glowing emerald arrow tip glowing with wind optics aligned directly at bullseye target, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Flecha de Peçonha Silvestre (`arqueiro_truque_2`)**
   - *Dano:* `1.1x DES + Veneno por 3s` | *CD:* `3.0s` | *Custo:* `12 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, barbed wooden arrowhead dripping with glowing neon green serpent venom droplets, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Tiro de Ruptura de Tendões (`arqueiro_truque_3`)**
   - *Dano:* `1.2x DES` (Lentidão 40% por 4s) | *CD:* `3.5s` | *Custo:* `14 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, heavy iron-tipped arrow piercing through a binding iron shackle breaking movement chains, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 2: Magia de Nível 1 (Desbloqueio: Nv. 20)
1. **Marca do Caçador Astral (`arqueiro_nv1_1` - Hunter's Mark D&D 5E)**
   - *Efeito:* Marca o alvo causando +25% de dano por 8s | *CD:* `7.5s` | *Custo:* `20 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, glowing mystical red eye reticle hovering over a monstrous horned silhouette with arcane runes, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Rajada Tripla em Leque (`arqueiro_nv1_2`)**
   - *Dano:* `1.85x DES (3 flechas)` | *CD:* `6.8s` | *Custo:* `22 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, three glowing green magical arrows fanning outwards from ornate elven recurve bow, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Armadilha de Espinhos Mágicos (`arqueiro_nv1_3` - Entangle)**
   - *Dano:* `1.4x DES` (Enraíza por 2s) | *CD:* `8.0s` | *Custo:* `24 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, thorny enchanted forest briars snapping shut around iron boots with green leaf sparks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 3: Magia de Nível 2 (Desbloqueio: Nv. 35)
1. **Chuva de Flechas Perfurantes (`arqueiro_nv2_1` - Volley)**
   - *Dano:* `2.4x DES (Área 5.5m)` | *CD:* `12.0s` | *Custo:* `35 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, dozens of shimmering golden arrows raining down vertically from storm clouds onto target zone, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Flecha Espectral Perfuradora (`arqueiro_nv2_2`)**
   - *Dano:* `2.55x DES (Linha reta de 12m)` | *CD:* `13.0s` | *Custo:* `38 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, luminous cyan phantom arrow piercing through three armored targets in a straight beam, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Manto da Furtividade da Selva (`arqueiro_nv2_3`)**
   - *Efeito:* Furtividade por 3s + Próximo ataque causa 100% Crítico | *CD:* `14.0s` | *Custo:* `36 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, hooded elven ranger silhouette blending into emerald woodland foliage with glowing cat eyes, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 4: Ultimate / Nível 3 (Desbloqueio: Nv. 50)
1. **Flecha da Fênix Solar (`arqueiro_nv3_1`)**
   - *Dano:* `4.2x DES + 1.5x SAB (Área 8m)` | *CD:* `40.0s` | *Custo:* `65 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, magnificent blazing fiery phoenix taking the shape of a colossal arrow hurtling forward, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Bombardeio das Tempestades Uivantes (`arqueiro_nv3_2`)**
   - *Dano:* `4.7x DES (10 tiros ultrassônicos)` | *CD:* `44.0s` | *Custo:* `70 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, high speed barrage of ten emerald sonic arrows breaking sound barriers with shockwave rings, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Invocação da Fera Guardiã Astral (`arqueiro_nv3_3`)**
   - *Dano:* `4.2x DES (Espírito lupino por 12s)` | *CD:* `42.0s` | *Custo:* `60 Energia`
   - **Prompt:** `Square fantasy RPG skill icon, glowing spectral saber-toothed beast leaping forward with celestial starlight claws, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

---

### 3.5 MAGO (`MAGO` — INT | Recurso: Mana)

#### Slot 1: Truques (Desbloqueio: Nv. 10)
1. **Dardo de Fogo (`mago_truque_1` - Fire Bolt D&D 5E)**
   - *Dano:* `1.4x INT` | *CD:* `2.4s` | *Custo:* `10 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, blazing fireball orb swirling with bright orange and yellow flame tongues launching forward, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Raio de Gelo Antártico (`mago_truque_2` - Ray of Frost D&D 5E)**
   - *Dano:* `1.25x INT` (Lentidão 35%) | *CD:* `3.0s` | *Custo:* `12 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, crystalline beam of intense frosty blue glacial energy freezing frost crystals, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Toque Chocante em Cadeia (`mago_truque_3` - Shocking Grasp)**
   - *Dano:* `1.3x INT (Encadeia em 2 alvos)` | *CD:* `2.8s` | *Custo:* `14 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, crackling blue and purple lightning arcs jumping between fingers with electric plasma sparks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 2: Magia de Nível 1 (Desbloqueio: Nv. 20)
1. **Mísseis Arcanos Infalíveis (`mago_nv1_1` - Magic Missile D&D 5E)**
   - *Dano:* `1.85x INT (3 dardos teleguiados)` | *CD:* `6.5s` | *Custo:* `20 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, three glowing violet-blue arcane force missiles corkscrewing through the air with stardust trails, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Escudo Arcano Espelhado (`mago_nv1_2` - Shield)**
   - *Defesa:* Absorve 25% HP e reflete choque elétrico | *CD:* `8.0s` | *Custo:* `22 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, hexagonal translucent blue magical barrier shield pulsing with arcane geometric sigils, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Orbe de Chamas Devoradoras (`mago_nv1_3` - Burning Hands)**
   - *Dano:* `1.65x INT + Queima por 4s` | *CD:* `7.5s` | *Custo:* `25 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, two wizard hands outstretched projecting a conical torrent of roaring crimson and gold flames, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 3: Magia de Nível 2 (Desbloqueio: Nv. 35)
1. **Nevasca Glacial Congelante (`mago_nv2_1` - Blizzard / Cone of Cold)**
   - *Dano:* `2.4x INT (Área 5.5m)` | *CD:* `12.0s` | *Custo:* `35 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, swirling howling blizzard vortex with sharp ice stalactites falling into frozen tundra ground, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Relâmpago em Cadeia Tempestuoso (`mago_nv2_2` - Chain Lightning)**
   - *Dano:* `2.35x INT (Até 4 monstros)` | *CD:* `11.5s` | *Custo:* `38 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, branching massive fork of high voltage blue lightning splitting and striking multiple points, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Mente Cósmica Acelerada (`mago_nv2_3` - Haste)**
   - *Efeito:* +35% Velocidade e -50% CD de truques por 7s | *CD:* `14.0s` | *Custo:* `36 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, ancient hourglass glowing with cosmic purple stardust and glowing celestial runes accelerating time, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 4: Ultimate / Nível 3 (Desbloqueio: Nv. 50)
1. **Bola de Fogo Apocalíptica (`mago_nv3_1` - Fireball D&D 5E)**
   - *Dano:* `4.3x INT (Área 8m)` | *CD:* `40.0s` | *Custo:* `65 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, colossal apocalyptic fireball explosion billowing with superheated magma mushroom cloud and shockwave, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Chuva de Cometas Arcanos (`mago_nv3_2` - Meteor Swarm)**
   - *Dano:* `4.7x INT (3 meteoros sucessivos)` | *CD:* `45.0s` | *Custo:* `70 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, trio of massive burning purple and cyan arcane meteors plunging through dark clouds to earth, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Estase do Zero Absoluto (`mago_nv3_3` - Time Stop / Absolute Zero)**
   - *Dano:* `3.9x INT` (Congela monstros em 6m por 3s) | *CD:* `42.0s` | *Custo:* `60 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, shattered clock face trapped inside a solid pure diamond iceberg with frozen frost vortex, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

---

### 3.6 BRUXO (`BRUXO` — CHA | Recurso: Mana / Almas)

#### Slot 1: Truques (Desbloqueio: Nv. 10)
1. **Rajada Mística (`bruxo_truque_1` - Eldritch Blast D&D 5E)**
   - *Dano:* `1.45x CAR` | *CD:* `2.2s` | *Custo:* `10 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, twin spiraling beams of crackling violet eldritch force energy with eerie dark runes, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Toque Necrótico Drenante (`bruxo_truque_2` - Chill Touch)**
   - *Dano:* `1.25x CAR` (Corta cura em 50%) | *CD:* `3.0s` | *Custo:* `12 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, ghostly skeletal hand glowing with cold necrotic cyan flame grasping forward, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Orbe de Praga Sombria (`bruxo_truque_3`)**
   - *Dano:* `1.3x CAR` (Aplica maldição leve) | *CD:* `2.8s` | *Custo:* `14 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, floating sphere of black void matter dripping with purple miasma fumes and floating cursed eyes, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 2: Magia de Nível 1 (Desbloqueio: Nv. 20)
1. **Maldição de Bruxaria (`bruxo_nv1_1` - Hex D&D 5E)**
   - *Efeito:* +25% Dano no alvo e cura 10% do dano causado por 8s | *CD:* `7.5s` | *Custo:* `20 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, ominous glowing purple demonic skull branding mark burning with eldritch curse runes, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Armadura Gélida de Agathys (`bruxo_nv1_2` - Armor of Agathys)**
   - *Defesa:* Absorve dano e reflete gelo espectral (`1.5x CAR`) | *CD:* `8.5s` | *Custo:* `22 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, obsidian warlock plate armor encrusted with sharp jagged dark-blue spectral frost rime, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Tentáculos de Hadar (`bruxo_nv1_3` - Arms of Hadar)**
   - *Dano:* `1.7x CAR` (Imobiliza por 1.5s) | *CD:* `7.0s` | *Custo:* `24 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, writhing dark alien tentacles with purple suckers bursting from an obsidian portal abyss, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 3: Magia de Nível 2 (Desbloqueio: Nv. 35)
1. **Fome Voraz de Hadar (`bruxo_nv2_1` - Hunger of Hadar D&D 5E)**
   - *Dano:* `2.4x CAR (Vórtice contínuo 5.5m)` | *CD:* `12.0s` | *Custo:* `35 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, swirling black hole vortex in deep space with otherworldly cosmic teeth and milky way stars, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Toque Vampírico da Alma (`bruxo_nv2_2` - Vampiric Touch)**
   - *Dano:* `2.5x CAR` (Drena 50% em Vida) | *CD:* `13.0s` | *Custo:* `38 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, ethereal soul being ripped from a chest in glowing teal wisps into dark clawed hands, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Salto das Brumas Etéreas (`bruxo_nv2_3` - Misty Step)**
   - *Dano:* `2.2x CAR` (Teleporte de 6m com explosão de névoa) | *CD:* `11.0s` | *Custo:* `36 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, hooded warlock figure phasing through violet ethereal mist leaving behind a phantom decoy, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 4: Ultimate / Nível 3 (Desbloqueio: Nv. 50)
1. **Singularidade do Vazio Cósmico (`bruxo_nv3_1`)**
   - *Dano:* `4.3x CAR (Puxa monstros para o centro e explode)` | *CD:* `42.0s` | *Custo:* `65 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, catastrophic miniature supermassive black hole swallowing reality with intense purple gravitational lensing, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Invocação do Lorde Demônio Maior (`bruxo_nv3_2` - Summon Greater Demon)**
   - *Dano:* `4.5x CAR (Demônio alado por 10s)` | *CD:* `45.0s` | *Custo:* `70 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, towering horned demon lord with flaming bat wings and obsidian broadsword stepping through hellfire gate, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Palavra de Poder: Agonia Eterna (`bruxo_nv3_3`)**
   - *Dano:* `4.9x CAR` no alvo principal e `2.5x CAR` em área | *CD:* `44.0s` | *Custo:* `60 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, screaming dark skull fracturing into thousand glowing violet soul fragments with cosmic rift, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

---

### 3.7 CLÉRIGO (`CLERIGO` — WIS | Recurso: Mana / Luz Divina)

#### Slot 1: Truques (Desbloqueio: Nv. 10)
1. **Chama Sagrada (`clerigo_truque_1` - Sacred Flame D&D 5E)**
   - *Dano:* `1.35x SAB` | *CD:* `2.4s` | *Custo:* `10 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, pillar of blinding holy white and golden flame descending straight from heaven onto a target, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Pedra Fúnebre do Julgamento (`clerigo_truque_2` - Toll the Dead D&D 5E)**
   - *Dano:* `1.45x SAB` (Dano ampliado se alvo ferido) | *CD:* `2.8s` | *Custo:* `12 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, ornate bronze cathedral bell echoing with sacred translucent soundwaves and divine retribution sparks, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Golpe de Orientação Curativa (`clerigo_truque_3` - Guidance)**
   - *Dano:* `1.1x SAB` + Cura `0.5x SAB` | *CD:* `3.2s` | *Custo:* `14 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, winged holy mace striking downward enveloped in gentle healing golden halo rays, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 2: Magia de Nível 1 (Desbloqueio: Nv. 20)
1. **Palavra de Cura Milagrosa (`clerigo_nv1_1` - Healing Word D&D 5E)**
   - *Cura:* `2.0x SAB + Nível` | *CD:* `7.0s` | *Custo:* `20 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, radiant golden angel wings wrapping around a glowing heart with cascading sparkles of restoration, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Bênção Divina da Batalha (`clerigo_nv1_2` - Bless D&D 5E)**
   - *Efeito:* +20% Ataque, Defesa e Crítico por 8s | *CD:* `8.5s` | *Custo:* `22 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, three golden holy chalices shining with divine grace and floating runic blessing symbols, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Raio Guia Fulgurante (`clerigo_nv1_3` - Guiding Bolt D&D 5E)**
   - *Dano:* `2.15x SAB` (Garante acerto crítico subsequente) | *CD:* `7.5s` | *Custo:* `25 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, piercing bolt of pure blinding solar luminescence rocketing through darkness with gold particle trail, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 3: Magia de Nível 2 (Desbloqueio: Nv. 35)
1. **Espíritos Guardiões Protetores (`clerigo_nv2_1` - Spirit Guardians D&D 5E)**
   - *Dano:* `2.5x SAB (Área 5m com lentidão 40%)` | *CD:* `13.0s` | *Custo:* `35 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, ring of ethereal translucent golden cherubs and warrior spirits spiraling with drawn holy swords, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Martelo Espiritual Flutuante (`clerigo_nv2_2` - Spiritual Weapon D&D 5E)**
   - *Dano:* `2.4x SAB (Golpeia automaticamente por 8s)` | *CD:* `14.0s` | *Custo:* `38 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, floating glowing golden divine warhammer striking an anvil with holy lightning shockwaves, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Santuário Consagrado da Luz (`clerigo_nv2_3` - Sanctuary / Beacon of Hope)**
   - *Efeito:* Solo de 6m curando 5% HP/s e -25% Dano sofrido | *CD:* `15.0s` | *Custo:* `36 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, sacred golden circular floor seal carved with glowing celestial sun runes providing barrier, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

#### Slot 4: Ultimate / Nível 3 (Desbloqueio: Nv. 50)
1. **Coluna do Fogo Sagrado (`clerigo_nv3_1` - Flame Strike D&D 5E)**
   - *Dano:* `4.1x SAB + 1.5x CON (Área 7.5m)` | *CD:* `40.0s` | *Custo:* `65 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, colossal vertical pillar of swirling radiant white holy fire and molten gold crashing onto earth, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
2. **Intervenção Divina: Graça Suprema (`clerigo_nv3_2` - Divine Intervention D&D 5E)**
   - *Efeito:* 100% Cura total, remove debuffs e supernova de `4.3x SAB` | *CD:* `45.0s` | *Custo:* `70 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, colossal golden angelic hands descending from the clouds bathed in celestial dawn light with divine halo, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`
3. **Julgamento do Sol da Aurora (`clerigo_nv3_3` - Dawn / Sunbeam)**
   - *Dano:* `4.8x SAB (Raio contínuo destruidor de chefões)` | *CD:* `42.0s` | *Custo:* `60 Mana`
   - **Prompt:** `Square fantasy RPG skill icon, blinding focused beam of intense golden sunlight disintegrating dark shadows into sparkling dust, stylized 2D game UI ability icon, vibrant saturated colors, ornate gold beveled border frame, dark radial background, --ar 1:1`

---
