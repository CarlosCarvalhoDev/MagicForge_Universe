# 📖 Bíblia de Lore, Direção de Arte & Eventos — MagicForge: Universe

![A Ruptura da MagicForge](./Art/world_magicforge_anvil.jpg)

## 1. O Mito Fundador: A Ruptura da Bigorna Primordial (*The MagicForge*)

No centro do cosmos existia a **MagicForge**, a Bigorna Celestial onde os deuses moldaram a realidade utilizando os **6 Elementos Primordiais** (`Fogo`, `Água`, `Natureza`, `Terra`, `Luz` e `Sombra` — definidos em [`BaseStats.cs`](../MagicForgeClient/Assets/Scripts/Core/BaseStats.cs)).

### O Vilão Principal: Malakor, o Arquifalsário Cinzento
![Malakor, o Arquifalsário Corrompido](./Art/villain_malakor_portrait.jpg)

* **Quem é:** Antigo mestre-ferreiro mortal encarregado de guardar a Bigorna Celestial. Obcecado pelo poder absoluto (o "Combat Power Infinito"), Malakor tentou fundir todos os 6 Elementos em sua própria armadura de obsidiana.
* **O Cataclismo:** O golpe profano de seu martelo rachou a **MagicForge**. A explosão espalhou **Estilhaços de Forja (Relíquias e Equipamentos)** por todo o mundo e contaminou as criaturas da natureza com escória mágica.
* **Conexão com o Loop Idle / Auto-MMO:** Cada monstro abatido no mapa carrega "Fagulhas da Forja" em seu sangue. Quando o jogador deixa o herói no Auto-Combat, ele está extraindo essas fagulhas para forjar equipamentos no sistema de Gacha, elevar seu **Combat Power (CP)** e marchar rumo à Cratera de Malakor.

---

## 2. As 7 Classes ("Os Forjados") & Sincronização 100% (Unity ↔ Servidor 20Hz)

Cada herói é um **Forjado** cuja alma absorveu uma fagulha específica da Bigorna. Os valores base abaixo estão **100% sincronizados** entre o servidor autoritativo ([`shared/src/entities.ts`](../shared/src/entities.ts) e [`server/src/entities/Player.ts`](../server/src/entities/Player.ts)) e os ScriptableObjects do Unity (`MagicForgeClient/Assets/*.asset`):

| Classe | Asset Unity | Atributo Principal (`mainStat`) | Alcance (`attackRange`) | Intervalo (`attackIntervalSec`) | Velocidade (`baseSpeed`) | `STR` | `DEX` | `CON` | `INT` | `WIS` | `CHA` | HP Nv.1 (`CON*10+50`) | Dano Base Nv.1 (`Mod*3+5`) | CP Nv.1 |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Clérigo** | `Clerigo.asset` | Sabedoria (`WIS`) | `10.0m` (Ranged) | `1.5s` | `5.0` | 8 | 10 | 12 | 12 | **16** | 12 | **170** | **53** | **1150** |
| **Guerreiro** | `Guerreiro.asset` | Força + Carisma (`STR+CHA`) | `2.5m` (Melee) | `1.2s` | `5.0` | **15** | 10 | 14 | 8 | 10 | **13** | **190** | **89** | **1150** |
| **Bárbaro** | `Barbaro.asset` | Força (`STR`) | `2.5m` (Melee) | `1.4s` | `5.2` | **18** | 12 | 16 | 6 | 8 | 8 | **210** | **59** | **1120** |
| **Monge** | `Monge.asset` | Destreza (`DEX`) | `2.5m` (Melee) | `0.9s` | `5.5` | 12 | **16** | 12 | 8 | 14 | 8 | **170** | **53** | **1150** |
| **Bruxo** | `Bruxo.asset` | Carisma (`CHA`) | `10.0m` (Ranged) | `1.5s` | `5.0` | 8 | 10 | 10 | 12 | 10 | **18** | **150** | **59** | **1120** |
| **Mago** | `Mago.asset` | Inteligência (`INT`) | `10.0m` (Ranged) | `1.5s` | `5.0` | 6 | 10 | 10 | **18** | 12 | 10 | **150** | **59** | **1090** |
| **Arqueiro** | `Arqueiro.asset` | Destreza (`DEX`) | `12.0m` (Ranged) | `1.1s` | `5.2` | 10 | **18** | 12 | 10 | 10 | 8 | **170** | **59** | **1120** |

---

### Detalhamento Visual & Evoluções de Classe (Tier 1 ➔ Tier 2)

#### 1. Clérigo (`Clerigo.asset`)
![Clérigo](./Art/hero_clerigo_portrait.jpg)
* **Lore:** Canaliza a **Luz** e a **Natureza** que vazam das rachaduras da Forja.
* **Evolução A (Sacerdote Solar):** Foco em Luz pura, escudos de CP e dano radiante contínuo.
* **Evolução B (Druida Espinheiro):** Foco em Natureza, venenos passivos e invocação de raízes em área para farm AFK.

#### 2. Guerreiro (`Guerreiro.asset`)
![Guerreiro](./Art/hero_guerreiro_portrait.jpg)
* **Lore:** A vanguarda blindada com aço rúnico da Ordem da Bigorna. Combina força física (`STR`) à liderança inspiradora (`CHA`).
* **Evolução A (Paladino da Chama Branca):** Dano híbrido `STR + CHA` explosivo e cura ao golpear.
* **Evolução B (Cavaleiro Baluarte):** Conversão de `CON` (Constituição) em armadura refletora contra Bosses.

#### 3. Bárbaro (`Barbaro.asset`)
![Bárbaro](./Art/hero_barbaro_portrait.jpg)
* **Lore:** Guerreiros tribais que beberam o magma líquido da MagicForge. Têm a maior Constituição inicial (`16 CON` = `210 HP`).
* **Evolução A (Berserker Cinzento):** Quanto menor a vida atual, maior a velocidade de ataque e crítico.
* **Evolução B (Senhor das Feras):** Absorve o espírito das bestas abatidas para ganhar roubo de vida brutal.

#### 4. Monge (`Monge.asset`)
![Monge](./Art/hero_monge_portrait.jpg)
* **Lore:** Ascetas que transformaram o próprio corpo em uma bigorna viva. Possuem o ataque mais rápido (`0.9s`) e a maior velocidade de movimento (`5.5`).
* **Evolução A (Mestre do Punho Celeste):** Combos ultra-rápidos que ignoram defesa.
* **Evolução B (Avatar do Chi):** Dispara ondas de choque de vento/água a cada 3 socos.

#### 5. Bruxo (`Bruxo.asset`)
![Bruxo](./Art/hero_bruxo_portrait.jpg)
* **Lore:** Estudiosos que firmaram pactos com entidades da **Sombra** aprisionadas sob a Forja para voltar o poder de Malakor contra ele mesmo.
* **Evolução A (Cultista do Abismo):** Maldições de dano contínuo (DoT) que derretem Bosses.
* **Evolução B (Invocador de Sombras):** Usa almas de monstros abatidos para invocar lacaios temporários no Auto-Combat.

#### 6. Mago (`Mago.asset`)
![Mago](./Art/hero_mago_portrait.jpg)
* **Lore:** Arquimagos que dominam a termodinâmica da Forja: o **Fogo** que derrete o metal e o **Gelo (Água)** que o tempera.
* **Evolução A (Piromante da Fornalha):** Explosões de dano crítico massivo em área.
* **Evolução B (Criomante Glacial):** Controle de grupo e lentidão nos monstros antes que encostem no herói.

#### 7. Arqueiro (`Arqueiro.asset`)
![Arqueiro](./Art/hero_arqueiro_portrait.jpg)
* **Lore:** Vigias das florestas cristalizadas com arcos encantados. Possuem o maior alcance do jogo (`12m`) e alta taxa de acerto crítico (`18 DEX`).
* **Evolução A (Franco-Atirador Rúnico):** Disparo letal à distância máxima.
* **Evolução B (Patrulheiro Elemental):** Chuva de flechas encantadas para limpeza rápida de hordas.

---

## 3. Bestiário do Ato I (Monstros de `World.ts`)

Todos os 5 monstros abaixo já estão ativos no servidor autoritativo ([`server/src/game/World.ts`](../server/src/game/World.ts)):

| Monstro | ID no Servidor | HP Máximo | Dano de Ataque | Posição de Spawn `(X, Y, Z)` | Papel no Game Design |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Slime da Floresta** | `mob_3` | `120` | `8` | `(10, 0, 12)` | Saco de pancadas inicial; engoliu cristais caídos da Forja. |
| **Goblin Lanceiro** | `mob_1` | `90` | `12` | `(-8, 0, 10)` | Inimigo equilibrado de patrulha com lança de ferro roubado. |
| **Lobo Selvagem** | `mob_4` | `100` | `14` | `(-14, 0, -10)` | Predador corrompido pela fumaça sombria; testa a `CON` do jogador. |
| **Goblin Arqueiro** | `mob_2` | `70` | `16` | `(12, 0, -8)` | "Glass cannon" inimigo: pouca vida, mas alto dano por disparo. |
| **Chefe Goblin** | `mob_5` | `350` | `28` | `(0, 0, 22)` | **Boss do Ato I (Gear Check):** Usa uma coroa de escória derretida de Malakor. |

### Galeria do Bestiário
* **Slime da Floresta:** ![Slime da Floresta](./Art/monster_slime_floresta.jpg)
* **Lobo Selvagem:** ![Lobo Selvagem](./Art/monster_lobo_selvagem.jpg)
* **Goblin Lanceiro & Goblin Arqueiro:** ![Horda Goblin](./Art/monster_goblin_horde.jpg)
* **Chefe Goblin (Boss):** ![Chefe Goblin](./Art/monster_chefe_goblin.jpg)

---

## 4. Estrutura da Campanha: Início, Meio e Fim

1. **INÍCIO (Ato I — O Bosque dos Estilhaços | Níveis 1 a 30):**
   - O jogador desperta próximo às ruínas externas, aprende o funcionamento do Auto-Combat e descobre como seu atributo principal multiplica o `DanoBase` por 3.
   - **Clímax do Ato I:** Derrotar o **Chefe Goblin** (`HP 350`), desbloquear a **Bigorna Portátil (Gacha de Relíquias)** e escolher a **Evolução Tier 2** (`evolutionOptionA` ou `evolutionOptionB`).
2. **MEIO (Ato II — As Fornalhas Partidas | Níveis 30 a 70):**
   - Desbloqueio completo das fraquezas e resistências dos **6 Elementos** (`Fogo`, `Água`, `Natureza`, `Terra`, `Luz`, `Sombra`).
   - O jogador precisa ajustar os **4 Skill Slots** e farmar relíquias elementais específicas para vencer os Generais Elementais de Malakor.
3. **FIM & ENDGAME (Ato III — O Trono da Bigorna & Ascensão | Nível 70+):**
   - Invasão à Cratera da MagicForge e batalha contra **Malakor, o Arquifalsário Cinzento**.
   - **Loop Infinito (Prestige / "Reforjar a Alma"):** Após derrotar a forma física de Malakor, o jogador pode reforjar sua alma no fogo primordial para ganhar **Níveis de Ascensão** ou utilizar o **Reset de Classe Premium** mantendo suas Relíquias Míticas.

---

## 5. Eventos In-Game para Engajamento Idle/MMO

1. **Sobrecarga da Forja (Hora Feliz Elemental):** A cada 3 horas, a MagicForge emite um pulso de 1 dos 6 elementos por 30 minutos (+25% de Dano daquele elemento e +50% de Drop de Minério de Gacha).
2. **Invasão do Martelo Cinzento (World Boss):** Um Avatar de Malakor surge no centro do mapa `(0, 0, 0)` para todos os jogadores online atacarem juntos no Auto-Combat, com recompensa por ranking de DPS.
3. **Fenda da Bigorna (Torre de Provação AFK):** Ondas infinitas que recompensam builds equilibradas entre `CON` (Vida), `DEX` (Esquiva/Crítico) e Dano.
4. **Febre do Ouro Goblin:** Goblins Saqueadores Dourados correm pelo mapa por 5 minutos sem atacar, premiando builds de alta velocidade (`Monge`, `Arqueiro`, `Bárbaro`) ou controle de grupo (`Mago`).

---

## 6. Galeria Completa de Sprites Isométricas 2D de Gameplay (Top-Down 3/4, 45°)

> [!IMPORTANT]
> **100% Concluído e Integrado:** Todas as 15 sprites isométricas (7 classes, 5 monstros do `World.ts`, 1 vilão principal e 2 tilesets seamless de cenário) estão salvas e configuradas como `Sprite (2D and UI)` em `MagicForgeClient/Assets/Textures/Sprites/`, vinculadas no campo `isometricWorldSprite` dos 7 arquivos `.asset` e disponíveis em `client/public/assets/isometric/`.

### 6.1 Sprites Isométricas das 7 Classes (`isometricWorldSprite`)
| Classe | Arquivo em `Assets/Textures/Sprites/` | Preview Isométrico 3/4 (45°) |
| :--- | :--- | :---: |
| **Guerreiro** | `iso_hero_guerreiro.jpg` | <img src="./Art/Isometric/iso_hero_guerreiro.jpg" width="120" /> |
| **Clérigo** | `iso_hero_clerigo.jpg` | <img src="./Art/Isometric/iso_hero_clerigo.jpg" width="120" /> |
| **Bárbaro** | `iso_hero_barbaro.jpg` | <img src="./Art/Isometric/iso_hero_barbaro.jpg" width="120" /> |
| **Monge** | `iso_hero_monge.jpg` | <img src="./Art/Isometric/iso_hero_monge.jpg" width="120" /> |
| **Bruxo** | `iso_hero_bruxo.jpg` | <img src="./Art/Isometric/iso_hero_bruxo.jpg" width="120" /> |
| **Mago** | `iso_hero_mago.jpg` | <img src="./Art/Isometric/iso_hero_mago.jpg" width="120" /> |
| **Arqueiro** | `iso_hero_arqueiro.jpg` | <img src="./Art/Isometric/iso_hero_arqueiro.jpg" width="120" /> |

### 6.2 Sprites Isométricas dos Monstros (`World.ts`) & Bosses
| Inimigo / Boss | Arquivo em `Assets/Textures/Sprites/` | Preview Isométrico 3/4 (45°) |
| :--- | :--- | :---: |
| **Goblin Lanceiro (`mob_1`)** | `iso_mob_goblin_lanceiro.jpg` | <img src="./Art/Isometric/iso_mob_goblin_lanceiro.jpg" width="120" /> |
| **Goblin Arqueiro (`mob_2`)** | `iso_mob_goblin_arqueiro.jpg` | <img src="./Art/Isometric/iso_mob_goblin_arqueiro.jpg" width="120" /> |
| **Slime da Floresta (`mob_3`)** | `iso_mob_slime_floresta.jpg` | <img src="./Art/Isometric/iso_mob_slime_floresta.jpg" width="120" /> |
| **Lobo Selvagem (`mob_4`)** | `iso_mob_lobo_selvagem.jpg` | <img src="./Art/Isometric/iso_mob_lobo_selvagem.jpg" width="120" /> |
| **Chefe Goblin (`mob_5`)** | `iso_boss_chefe_goblin.jpg` | <img src="./Art/Isometric/iso_boss_chefe_goblin.jpg" width="120" /> |
| **Malakor (Vilão Principal)** | `iso_boss_malakor.jpg` | <img src="./Art/Isometric/iso_boss_malakor.jpg" width="120" /> |

### 6.3 Tilesets Seamless de Chão (Arena & Floresta)
| Tileset | Arquivo em `Assets/Textures/Sprites/` | Preview Top-Down Ortográfico |
| :--- | :--- | :---: |
| **Piso de Pedra da Arena** | `tile_arena_stone.jpg` | <img src="./Art/Isometric/tile_arena_stone.jpg" width="140" /> |
| **Grama de Fantasia** | `tile_fantasy_grass.jpg` | <img src="./Art/Isometric/tile_fantasy_grass.jpg" width="140" /> |

