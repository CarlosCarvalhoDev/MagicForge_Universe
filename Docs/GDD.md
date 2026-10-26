# Game Design Document (GDD) - MagicForge: Universe

## 1. Visão Geral
*   **Nome:** MagicForge: Universe
*   **Gênero:** Auto-MMO / Idle RPG
*   **Motor Gráfico:** Unity 3D

## 2. Atributos Base (Estilo D&D)
*   Força (STR), Destreza (DEX), Constituição (CON), Inteligência (INT), Sabedoria (WIS), Carisma (CHA).

## 3. Combat Power (CP) e Monetização
*   O "CP" dita a progressão. Gacha focado em Equipamentos/Relíquias para subir o CP. Reset de classe Premium.

## 4. Sistema de Classes e Modificadores
Cada classe possui uma mecânica de combate e um atributo principal (Modificador de Dano) que rege a força do seu ataque:
1. **Clérigo (Sacerdote/Druida):** Ataca à distância. Modificador: **Sabedoria (WIS)**.
2. **Guerreiro (Paladino/Cavaleiro):** Ataca corpo-a-corpo (Melee). Modificador: **Força (STR)**. *(Nota: Paladino usará STR e CHA).*
3. **Bárbaro (Berserker/Feras):** Corpo-a-corpo. Modificador: **Força (STR)**.
4. **Monge (Punho/Chi):** Corpo-a-corpo. Modificador: **Destreza (DEX)** ou STR.
5. **Bruxo (Cultista/Invocador):** Ataca à distância. Modificador: **Carisma (CHA)**.
6. **Mago (Fogo/Gelo):** Ataca à distância. Modificador: **Inteligência (INT)**.
7. **Arqueiro (Atirador/Patrulheiro):** Ataca à distância. Modificador: **Destreza (DEX)**.

## 5. Sistema de Combate e Habilidades
*   **Ataque Básico Inteligente:** Classes mágicas e arqueiros param de correr antes e disparam ataques à distância. Classes físicas colam no alvo.
*   **Reatividade Inimiga:** Os monstros não são sacos de pancada passivos. Eles possuem velocidade de ataque e dano próprio, forçando o jogador a upar sua Constituição/Defesa.
*   **Skill Slots:** 4 Slots de Habilidades Ativas customizáveis (exigem cooldown).

## 6. Lore, Direção de Arte e Documentos Complementares
*   **Enredo Principal & Vilão:** A Ruptura da Bigorna Primordial (*MagicForge*) causada por **Malakor, o Arquifalsário Cinzento**.
*   **Bíblia de Lore, Classes, Bestiário e Eventos:** Consulte [`Docs/Lore_And_Art_Bible.md`](./Lore_And_Art_Bible.md).
*   **Padrão de Sprites Isométricos (Top-Down 3/4, 45°):** Consulte [`Docs/GUIA_PROMPTS_ASSETS_IA.md`](./GUIA_PROMPTS_ASSETS_IA.md).

