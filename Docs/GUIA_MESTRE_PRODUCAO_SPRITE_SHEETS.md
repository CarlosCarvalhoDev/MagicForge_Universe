# 🎬 Guia Mestre de Produção de Sprite Sheets — MagicForge: Universe

**Versão 1.0 — 26/10/2026.** Especificação técnica de produção e pipeline de corte (`Sprite Mode: Multiple`) para as 67 folhas de animação (282 frames).

---

## 1. Fonte de Verdade e Escopo

* **Base Visual:** `iso_hero_guerreiro.jpg` e as demais 14 bases estáticas já salvas em `MagicForgeClient/Assets/Textures/Sprites/`, seguindo as Seções 2 e 3 de [`Docs/GUIA_PROMPTS_ASSETS_IA.md`](./GUIA_PROMPTS_ASSETS_IA.md).
* **Regra de Não-Destruição (Critério de Aceite #1 e #2):**
  * **NÃO** sobrescrever as 15 imagens estáticas `.jpg` em `Assets/Textures/Sprites/`.
  * **NÃO** modificar arquivos `.asset`, scripts C#/TS, cenas, prefabs ou sistema de combate durante a importação de pacotes de arte sem aprovação explícita.
* **Direção Inicial:** Sudeste (`SE`), câmera top-down 3/4 elevada `~45°`. Para movimento multidirecional futuro, gerar folhas `NW`, `NE`, `SW` (ou 8 direções) e atualizar o controller em etapa própria.
* **Fundo e Alfa:** Preferir saída em PNG com fundo transparente RGBA; se a geração vier sobre fundo preto sólido `#000000`, preservar no primeiro pacote e aplicar recorte de alfa separado com inspeção manual para proteger o brilho das armas/magias.

---

## 2. Especificação de Grades, Exportação e Timing

| Parâmetro | Requisito Técnico |
| :--- | :--- |
| **Quadro Individual (Célula)** | `512 × 512 px` quadrado como alvo de exportação |
| **Grade de 2 Quadros (`HIT`)** | Grade `2 × 1` (2 colunas × 1 linha) ➔ **`1024 × 512 px`** |
| **Grade de 4 Quadros (`IDLE`, `DEATH`, `MOB WALK/ATTACK`)** | Grade `2 × 2` (2 colunas × 2 linhas) ➔ **`1024 × 1024 px`** |
| **Grade de 6 Quadros (`HERO WALK/ATTACK/CAST`, `BOSS ATTACK/CAST/DEATH`)** | Grade `3 × 2` (3 colunas × 2 linhas) ➔ **`1536 × 1024 px`** |
| **Ordem de Leitura** | Esquerda ➔ Direita, Linha Superior ➔ Linha Inferior |
| **Âncora / Pivô** | Mesmo pivô nos pés em todas as células (`x: 0.5, y: 0.15` sugerido); bounding boxes consistentes |
| **FPS Sugerido** | `idle`: **5 FPS** • `walk`: **9 FPS** • `attack`: **11 FPS** • `cast`: **9 FPS** • `hit`: **10 FPS** • `death`: **7 FPS** |
| **Loops** | `idle` e `walk`: **SIM** • `attack`, `cast`, `hit` e `death`: **NÃO** |

---

## 3. Diretórios de Destino (Já Criados no Repositório)

### Exceção aprovada — caminhada do Clérigo (27/10/2026)

A caminhada V4.1 do Clérigo, aprovada pelo usuário e integrada em Web/Unity/Docs, usa **8 quadros a 12 FPS**, em **4×2 células de 512×512**, folha **2048×1024**. O ciclo continua com aproximadamente 667 ms, como os 6 quadros a 9 FPS anteriores. Essa exceção não altera automaticamente os padrões das demais classes ou ações. V2 e V3 foram reprovadas e permanecem arquivadas; Unity Play Mode ainda precisa de validação manual.

As revisões e o histórico estão em `Docs/Art/Isometric/Animations/Heroes/Clerigo/Revisoes/`. `Build-SpriteSheet.ps1` monta frames já desenhados com redução proporcional uniforme, sem sintetizar poses. A validação estrutural usa `Test-ClericWalkStructure.ps1`. O inventário de 282 frames abaixo descreve o plano original; a exceção experimental acrescenta dois quadros ao pacote existente.

O importador legado `Import-SpriteSheets.ps1` ainda presume grade 3×2 para hero walk. **Não o executar sobre esta folha 4×2**, pois ele recortaria a grade errada e recriaria identificadores de fatias. Os metadados desta revisão foram atualizados preservando GUID e os seis spriteIDs/fileIDs existentes, acrescentando somente duas fatias. A avaliação visual permanece separada da checagem de importação.

Toda a árvore de pastas abaixo já está criada e pronta para receber os pacotes `.png`:

1. **Unity 3D (`Sprite Mode: Multiple`, `textureType: 8`):**
   * `MagicForgeClient/Assets/Textures/Sprites/Animations/Heroes/<Classe>/iso_hero_<classe>_<acao>_sheet.png`
     * Pastas `<Classe>`: `Guerreiro`, `Clerigo`, `Barbaro`, `Monge`, `Bruxo`, `Mago`, `Arqueiro`
   * `MagicForgeClient/Assets/Textures/Sprites/Animations/Monsters/<Monstro>/iso_mob_<monstro>_<acao>_sheet.png`
     * Pastas `<Monstro>`: `GoblinLanceiro`, `GoblinArqueiro`, `SlimeFloresta`, `LoboSelvagem`
   * `MagicForgeClient/Assets/Textures/Sprites/Animations/Bosses/<Boss>/iso_boss_<boss>_<acao>_sheet.png`
     * Pastas `<Boss>`: `ChefeGoblin`, `Malakor`
   * `MagicForgeClient/Assets/Textures/Sprites/Animations/VFX/`
2. **Cliente Web (`client/public/assets/isometric/animations/`):**
   * `client/public/assets/isometric/animations/heroes/<classe>/<arquivo>.png`
   * `client/public/assets/isometric/animations/monsters/<monstro>/<arquivo>.png`
   * `client/public/assets/isometric/animations/bosses/<boss>/<arquivo>.png`
   * `client/public/assets/isometric/animations/vfx/<classe>/<arquivo>.png`
3. **Documentação (`Docs/Art/Isometric/Animations/`):**
   * `Docs/Art/Isometric/Animations/Heroes/<Classe>/<arquivo>.png`
   * `Docs/Art/Isometric/Animations/Monsters/<Monstro>/<arquivo>.png`
   * `Docs/Art/Isometric/Animations/Bosses/<Boss>/<arquivo>.png`

---

## 4. Inventário Completo de Produção (67 Folhas / 282 Frames)

| Grupo | Personagens | Folhas por Entidade | Total de Folhas | Frames Planejados |
| :--- | :---: | :--- | :---: | :---: |
| **7 Heróis** | `Guerreiro`, `Clerigo`, `Barbaro`, `Monge`, `Bruxo`, `Mago`, `Arqueiro` | 5 (`idle` 4f, `walk` 6f, `attack/cast` 6f, `hit` 2f, `death` 4f) | **35** | **154** |
| **4 Monstros Comuns** | `GoblinLanceiro`, `GoblinArqueiro`, `SlimeFloresta`, `LoboSelvagem` | 5 (`idle` 4f, `walk` 4f, `attack` 4f, `hit` 2f, `death` 4f) | **20** | **72** |
| **2 Chefes** | `ChefeGoblin`, `Malakor` | 6 (`idle` 4f, `walk` 4f, `attack` 6f, `cast` 6f, `hit` 2f, `death` 6f) | **12** | **56** |
| **TOTAL** | **13 Entidades** | — | **67 Folhas** | **282 Frames** |

---

## 5. Automação de Integração e Corte (`Sprite Mode: Multiple`)

Quando uma pasta ou ZIP de Sprite Sheets for entregue (ex.: pacote do Guerreiro), execute o script utilitário que já deixamos preparado na raiz do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File .\Docs\Import-SpriteSheets.ps1 -SourceFolder "C:\caminho\da\pasta_entregue"
```

O script:
1. Lê as dimensões reais de cada `.png` (`1024x512`, `1024x1024`, `1536x1024` ou múltiplos proporcionais).
2. Identifica automaticamente se pertence a `Heroes/<Classe>`, `Monsters/<Monstro>`, `Bosses/<Boss>` ou `VFX`.
3. Copia para os 3 diretórios (`MagicForgeClient/Assets/Textures/Sprites/Animations/...`, `client/public/assets/isometric/animations/...` e `Docs/Art/Isometric/Animations/...`).
4. Gera um `.png.meta` com **GUID exclusivo novo**, `textureType: 8` (`Sprite 2D and UI`), `spriteMode: 2` (`Multiple`) e **todas as fatias (`sprites: [...]`) da grade (`2x1`, `2x2` ou `3x2`) já cortadas matematicamente** com pivô alinhado nos pés (`x: 0.5, y: 0.15`), sem tocar em nenhum `.asset` ou script C#/TS!
