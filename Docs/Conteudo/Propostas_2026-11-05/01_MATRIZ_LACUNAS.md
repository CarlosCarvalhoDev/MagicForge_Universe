# Entregável A (Parte 1) — Matriz de Lacunas do Catálogo e Divergências Verificadas

**Projeto:** MagicForge: Universe  
**Data:** 05/11/2026  
**Escopo:** Diagnóstico de cobertura atual de equipamentos, gemas e materiais para as 7 classes e 6 slots, registro de divergências entre documentação histórica e código em execução, e definição das famílias propostas.  
**Restrição aplicada:** Nenhuma alteração realizada em `shared/`, `server/`, `client/`, banco de dados ou assets finais.

---

## 1. Fontes Auditadas (Ordem Canônica)

1. [`shared/src/entities.ts`](file:///e:/MagicForge_Universe/shared/src/entities.ts): 7 classes (`CLERIGO`, `GUERREIRO`, `BARBARO`, `MONGE`, `BRUXO`, `MAGO`, `ARQUEIRO`), atributos base, alcance/intervalo de ataque básico, `mainStat` (`PrimaryStatType`) e crescimento por nível (`CLASS_STAT_GROWTH`).
2. [`shared/src/skills.ts`](file:///e:/MagicForge_Universe/shared/src/skills.ts): 84 habilidades canônicas (12 por classe em 4 slots × 3 escolhas), 28 aliases legados (`<classe>_1` a `<classe>_4`), desbloqueios nos níveis **1 / 10 / 25 / 50** e função `calculateSkillPower`.
3. [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts): 6 slots (`ARMA`, `ARMADURA`, `ESCUDO`, `ACESSORIO`, `ELMO`, `BOTAS`), 5 raridades (`COMUM`, `INCOMUM`, `RARO`, `EPICO`, `LENDARIO`), 8 chaves reais de `ItemAttributesBonus` (`forca`, `destreza`, `constituicao`, `inteligencia`, `sabedoria`, `carisma`, `maxHp`, `maxResource`) e 42 itens totais cadastrados (2 moedas, 3 consumíveis, 9 materiais, 4 gemas, 19 equipamentos e 8 cartas).
4. [`shared/src/equipment-fusion.ts`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts): 7 itens-base elegíveis (`FUSION_BASE_ITEMS`) e 8 receitas iniciais `v1` de nível 5 (`forge_blade_v1`, `forge_bow_v1`, `forge_mace_v1`, `forge_staff_v1`, `forge_pact_v1`, `forge_wraps_v1`, `forge_mail_v1`, `forge_robe_v1`).
5. [`server/src/entities/Monster.ts`](file:///e:/MagicForge_Universe/server/src/entities/Monster.ts), [`server/src/game/DungeonManager.ts`](file:///e:/MagicForge_Universe/server/src/game/DungeonManager.ts) e [`server/src/database/DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts): tabelas reais de loot por monstro/chefe e equipamento inicial concedido na criação de personagem.
6. [`Docs/AUDITORIA_ICONES_CLASSES_2026-11-05.md`](file:///e:/MagicForge_Universe/Docs/AUDITORIA_ICONES_CLASSES_2026-11-05.md), [`Docs/GUIA_DESIGN_SYSTEM_E_UI_RUNICA.md`](file:///e:/MagicForge_Universe/Docs/GUIA_DESIGN_SYSTEM_E_UI_RUNICA.md), [`Docs/GUIA_PROMPTS_ASSETS_IA.md`](file:///e:/MagicForge_Universe/Docs/GUIA_PROMPTS_ASSETS_IA.md) e [`Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md`](file:///e:/MagicForge_Universe/Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md).
7. [`Docs/ENTREGA_ECONOMIA_2026-11-04.md`](file:///e:/MagicForge_Universe/Docs/ENTREGA_ECONOMIA_2026-11-04.md), [`Docs/EVIDENCIAS_ECONOMIA_2026-11-04.json`](file:///e:/MagicForge_Universe/Docs/EVIDENCIAS_ECONOMIA_2026-11-04.json), [`Docs/PROTECAO_E_SUGESTOES_2026-11-04.md`](file:///e:/MagicForge_Universe/Docs/PROTECAO_E_SUGESTOES_2026-11-04.md), [`Docs/FUSAO_EQUIPAMENTOS_2026-11-05.md`](file:///e:/MagicForge_Universe/Docs/FUSAO_EQUIPAMENTOS_2026-11-05.md) e [`Docs/EVIDENCIAS_FUSAO_2026-11-05.json`](file:///e:/MagicForge_Universe/Docs/EVIDENCIAS_FUSAO_2026-11-05.json).

---

## 2. Registro de Divergências entre Fontes Antigas e Código Atual

Conforme diretriz de governança, nenhuma mecânica foi alterada para caber em textos antigos. Abaixo estão todas as divergências verificadas no repositório:

| # | Tema | Fonte Antiga / Descrição | Comportamento Real no Código Atual | Decisão na Proposta de Conteúdo |
| :--- | :--- | :--- | :--- | :--- |
| **D1** | **Níveis de desbloqueio de habilidades** | [`Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md`](file:///e:/MagicForge_Universe/Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md) indica desbloqueios nos níveis **10 / 20 / 35 / 50**. | [`shared/src/skills.ts`](file:///e:/MagicForge_Universe/shared/src/skills.ts#L31-L36) (`SLOT_CONFIGS` e `unlockLevel`) desbloqueia os 4 slots nos níveis **1 / 10 / 25 / 50**. | Respeitar estritamente os marcos **1 / 10 / 25 / 50** para alinhar patamares de equipamentos e ícones. |
| **D2** | **Escalonamento do Guerreiro (Ataque Básico vs. Skills)** | [`Docs/GUIA_PROMPTS_ASSETS_IA.md`](file:///e:/MagicForge_Universe/Docs/GUIA_PROMPTS_ASSETS_IA.md) apresenta o Guerreiro/Paladino como `STR + CHA`. | Em [`shared/src/entities.ts`](file:///e:/MagicForge_Universe/shared/src/entities.ts#L93-L108), o ataque básico usa `FORCA_E_CARISMA` e o crescimento por nível é `+2 FOR, +2 CON, +1 DES` (`+0 CAR`). Já em [`shared/src/skills.ts`](file:///e:/MagicForge_Universe/shared/src/skills.ts#L1780-L1818), as 12 habilidades do Guerreiro escalam exclusivamente com `forca`, `constituicao` e `maxHp`. | Distinguir claramente equipamentos marciais puros (`FOR + CON`, compartilhados com Bárbaro) de peças de comando/vanguarda do Guerreiro (`FOR + CON + CAR`), sem remover `FOR` como eixo principal. |
| **D3** | **Incompatibilidade de atributos para o Bruxo (`CAR` vs. `INT`)** | [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts) inclui `BRUXO` em `staff_apprentice`, `robe_mystic_threads`, `robe_runic_weave` e `staff_void_astral`. | O Bruxo escala 100% com **Carisma (`carisma`)** no ataque básico e nas 12 magias, nascendo com `10 INT` e `+0 INT/nível`. Porém, `staff_apprentice`, `robe_mystic_threads` e `robe_runic_weave` dão apenas `INT`/`SAB` (zero `CAR`), e `staff_void_astral` exige `requiredAttributes: { inteligencia: 30 }` — tornando a única arma épica de Nv. 25 **inequipável** por um Bruxo padrão e inútil para suas magias. | Manter os itens atuais intocados e propor família própria de **Focos/Grimórios e Mantos de Pacto (`CAR + CON + maxResource`)** para o Bruxo nos níveis 1, 15, 25 e 40, além de gema de Carisma. |
| **D4** | **Monge sem arma inicial equipável na criação de herói** | Em [`DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts#L940-L948), `createCharacterInSlot` entrega `sword_iron_broadsword` para qualquer classe no ramo `else` (incluindo `MONGE`). | `sword_iron_broadsword` permite apenas `[GUERREIRO, BARBARO]` e concede `+5 FOR, +2 CON`. O Monge (`mainStat: DESTREZA`, secundário `SABEDORIA`) nasce sem nenhuma arma que possa equipar até alcançar Nv. 5 e fundir `wraps_serene_path`. | Propor arma inicial de Nv. 1 para Monge (`wraps_novice_linen`, `DES + SAB`) e linha completa de manoplas/bastões monásticos nos níveis 1, 15, 25 e 40. |
| **D5** | **Ausência total de Armaduras para Arqueiro e Monge** | O catálogo atual só possui armaduras pesadas (`GUERREIRO`, `BARBARO`, `CLERIGO`) e mantos arcanos (`MAGO`, `BRUXO`). | Em [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts), **nenhum item** do slot `ARMADURA` em todo o jogo permite `ARQUEIRO` ou `MONGE` (Nv. 1, Nv. 5 ou Nv. 25). | Propor família completa de armaduras leves/marciais (`DES + CON` para Arqueiro; `DES + SAB + CON` para Monge) nos níveis 1, 5, 15, 25 e 40. |
| **D6** | **Itens de `FUSION_BASE_ITEMS` e `ITEMS_DATABASE` sem drop real** | [`shared/src/equipment-fusion.ts`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts#L15-L23) lista 7 itens base: `sword_iron_broadsword`, `bow_hunting`, `mace_cleric_dawn`, `staff_apprentice`, `armor_chainmail`, `robe_mystic_threads` e `shield_iron_buckler`. | Em [`server/src/entities/Monster.ts`](file:///e:/MagicForge_Universe/server/src/entities/Monster.ts#L57-L148), apenas **3** desses 7 itens dropam de monstros: `sword_iron_broadsword` (Goblin, 10%), `bow_hunting` (Arqueiro/Esqueleto, 12%) e `armor_chainmail` (Lobo/Gelo, 15%). `mace_cleric_dawn` e `staff_apprentice` só vêm na criação (1 cópia); `robe_mystic_threads`, `shield_iron_buckler` e `armor_titan_plate` não dropam em lugar algum. | Registrar na coluna `origem` a diferença entre *origem atual verificada* e *origem proposta*, e desenhar receitas que nunca dependam exclusivamente de itens sem drop. |
| **D7** | **Promessas de mecânica em descrições de Gemas/Cartas vs. `statsBonus`** | Textos de `gem_emerald_dex`, `card_skeleton`, `card_boss_grimgor`, `card_boss_frostbite`, `card_boss_ignis` mencionam crítico, velocidade de ataque, redução de cooldown ou dano contra chefes. | `ItemAttributesBonus` suporta exclusivamente `forca`, `destreza`, `constituicao`, `inteligencia`, `sabedoria`, `carisma`, `maxHp` e `maxResource`. | No catálogo proposto, separar rigorosamente `statsBonus` (apenas os 8 atributos reais) da coluna `dependências` (qualquer efeito passivo futuro). |
| **D8** | **Fórmula de poder das habilidades (`calculateSkillPower`)** | As strings `description` em [`shared/src/skills.ts`](file:///e:/MagicForge_Universe/shared/src/skills.ts) citam multiplicadores variados e atributos secundários (ex.: `4.2x DEX + 1.5x WIS` ou `1.2x FOR + 0.4x CON`). | Em [`shared/src/skills.ts`](file:///e:/MagicForge_Universe/shared/src/skills.ts#L1774-L1851), o `GUERREIRO` tem cálculo específico por `skillId`, enquanto `BARBARO`, `MONGE`, `ARQUEIRO`, `MAGO`, `BRUXO` e `CLERIGO` usam o escalonamento unificado por slot (`1.4x`, `1.8x`, `2.4x`, `4.2x` do atributo primário, ou `150 + 6×mod + 20×level` em curas). | Documentar nas justificativas de build quais atributos já impactam o cálculo hoje (atributo primário + `CON`/`maxHp` + `maxResource`) e quais dependem de calibração/expansão futura da fórmula. |

---

## 3. Perfil Mecânico Real das 7 Classes (`shared/src/entities.ts` & `skills.ts`)

| Classe | Alcance / Cadência Base | `mainStat` (Ataque Básico) | Atributos nas Habilidades (`skills.ts`) | Crescimento por Nível (`CLASS_STAT_GROWTH`) | Recurso | Identidade de Equipamento e Proficiência |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GUERREIRO** | Corpo a corpo (`2.5m` / `1.2s`) | `FORCA_E_CARISMA` | `forca`, `constituicao`, `maxHp` | `+2 FOR, +2 CON, +1 DES` | Energia (`100`) | Espadas/Lâminas pesadas, Armaduras de Placas/Malha, **Escudos** (exclusivo com Clérigo). |
| **BARBARO** | Corpo a corpo (`2.5m` / `1.4s`) | `FORCA` | `forca` (descrições citam `CON`) | `+3 FOR, +2 CON` | Fúria (`100`) | Machados/Montantes brutos de duas mãos, Peitorais tribais/placas pesadas. **Sem escudo** (foco em duas mãos e HP bruto/sobrevivência). |
| **ARQUEIRO** | Distância (`12.0m` / `1.1s`) | `DESTREZA` | `destreza` (descrição Nv. 50 cita `SAB`) | `+3 DES, +1 CON, +1 SAB` | Energia (`100`) | Arcos recurvos/longos, Armaduras de couro/patrulheiro, Botas de mobilidade. **Sem escudo**. |
| **MONGE** | Corpo a corpo (`2.5m` / `0.9s`) | `DESTREZA` | `destreza` (descrições citam `SAB`) | `+2 DES, +2 SAB, +1 CON` | Chi (`100`) | Manoplas/Faixas de Chi e Bastões monásticos, Vestes marciais leves. **Sem escudo e sem arco**. |
| **MAGO** | Distância (`10.0m` / `1.5s`) | `INTELIGENCIA` | `inteligencia` | `+3 INT, +1 CON, +1 SAB` | Mana (`100`) | Cajados e Orbes arcanos (`INT`), Mantos de trama arcana (`INT + maxResource`). **Sem escudo físico**. |
| **BRUXO** | Distância (`10.0m` / `1.5s`) | `CARISMA` | `carisma` | `+3 CAR, +2 CON` | Mana (`100`) | Focos de Pacto, Grimórios e Cetros abissais (`CAR`), Vestes de pacto (`CAR + CON + maxResource`). **Não intercambiável com `INT` do Mago**. |
| **CLERIGO** | Distância (`10.0m` / `1.5s`) | `SABEDORIA` | `sabedoria` (descrição Nv. 50 cita `CON`) | `+2 SAB, +2 CON, +1 FOR` | Mana (`100`) | Maças/Cetros sagrados (`SAB`), Cotas/Vestimentas consagradas (`SAB + CON`), **Escudos** sagrados (compartilhados ou dedicados). |

---

## 4. Matriz de Cobertura Atual vs. Lacunas por Slot, Classe e Patamar

### 4.1 Visão Geral por Slot (19 Equipamentos Existentes em `shared/src/items.ts`)

| Slot (`EquipmentSlot`) | Itens Existentes Hoje | Cobertura por Nível Hoje | Diagnóstico de Lacunas Críticas |
| :--- | :---: | :--- | :--- |
| **`ARMA`** | **12** | Nv. 1 (4 itens), Nv. 5 (6 itens), Nv. 25 (2 itens) | • **Nv. 1:** Faltam arma inicial equipável para **MONGE** (`DES+SAB`) e foco inicial de **BRUXO** (`CAR`).<br>• **Nv. 5:** Coberto pelas 6 receitas `v1` da Reforja Rúnica (`GUERREIRO/BARBARO` compartilham `sword_runic_tempered`; falta opção brutal dedicada ao `BARBARO`).<br>• **Nv. 15 (Intermediário Mundo 2/3):** **0 armas** (salto abrupto do Nv. 5 direto ao Nv. 25).<br>• **Nv. 25 (Épico):** Só existem `sword_runic_bastard` (`GUERREIRO/BARBARO`) e `staff_void_astral` (`MAGO`). **Faltam armas épicas Nv. 25 para `ARQUEIRO`, `CLERIGO`, `MONGE` e `BRUXO` (`CAR`)!** |
| **`ARMADURA`** | **5** | Nv. 1 (2 itens), Nv. 5 (2 itens), Nv. 25 (1 item) | • **Nv. 1 e Nv. 5:** **0 armaduras para `ARQUEIRO` e `MONGE`**! `BRUXO` divide mantos de `INT` sem `CAR`.<br>• **Nv. 15:** **0 armaduras** para todas as 7 classes.<br>• **Nv. 25 (Épico):** Só existe `armor_titan_plate` (`GUERREIRO/BARBARO`), que nem possui drop. **Faltam armaduras Nv. 25 para `CLERIGO`, `ARQUEIRO`, `MONGE`, `MAGO` e `BRUXO`!** |
| **`ESCUDO`** | **1** | Nv. 1 (1 item) | • Só existe `shield_iron_buckler` (Nv. 1, `GUERREIRO/CLERIGO`), sem drop em monstros.<br>• **Faltam escudos de Nv. 5, Nv. 15 e Nv. 25** para `GUERREIRO` e `CLERIGO` (nota: conforme regra de design, **não** inventamos escudos para todas as classes; mantemos a proficiência real de `GUERREIRO` e `CLERIGO`). |
| **`ELMO`** | **0** | **Nenhuma (0 itens)** | • **Lacuna 100% vazia no código.** O slot existe na UI e no servidor, mas não há nenhum item `ELMO` cadastrado em `items.ts`. |
| **`BOTAS`** | **0** | **Nenhuma (0 itens)** | • **Lacuna 100% vazia no código.** O slot existe na UI e no servidor, mas não há nenhum item `BOTAS` cadastrado em `items.ts`. |
| **`ACESSORIO`** | **1** | Nv. 30 (1 item Lendário) | • Só existe `relic_ancient_forge` (Nv. 30 Lendário, drop de Boss).<br>• **0 acessórios nos níveis 5, 15 e 25**; jogador passa 29 níveis com o slot `ACESSORIO` vazio se não derrotar um chefe com drop de relíquia. |

---

### 4.2 Matriz Detalhada Classe × Slot × Patamar de Progressão

Legenda:
- ✅ **Coberto** (item existente e funcional para o atributo da classe)
- ⚠️ **Parcial / Atributo desalinhado / Sem drop** (item existe, mas não concede o atributo primário da classe ou não possui fonte de drop)
- ❌ **Lacuna total** (nenhum item existente para a classe naquele slot/patamar)

| Classe | Slot | Nv. 1 (Início / Mundo 1) | Nv. 5 (Reforja Rúnica v1) | Nv. 15 (Transição Mundo 2–3) | Nv. 25 (Marco Slot 3 / Épico) | Nv. 30–40 (Marco Pré-Ultimate) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GUERREIRO** | `ARMA` | ✅ `sword_iron_broadsword` (`+5 FOR, +2 CON`) | ✅ `sword_runic_tempered` (`+9 FOR, +4 CON, +35 HP`) | ❌ *Falta arma Nv. 15 (`FOR+CON+CAR`)* | ✅ `sword_runic_bastard` (`+18 FOR, +8 CON`) | ❌ *Falta arma Nv. 40* |
| **GUERREIRO** | `ARMADURA` | ✅ `armor_chainmail` (`+6 CON, +50 HP`) | ✅ `armor_runic_vigil` (`+9 CON, +80 HP`) | ❌ *Falta armadura Nv. 15* | ⚠️ `armor_titan_plate` (existe, mas sem drop) | ❌ *Falta armadura Nv. 40* |
| **GUERREIRO** | `ESCUDO` | ⚠️ `shield_iron_buckler` (existe, sem drop) | ❌ *Falta escudo Nv. 5* | ❌ *Falta escudo Nv. 15* | ❌ *Falta escudo Nv. 25* | ❌ *Falta escudo Nv. 40* |
| **GUERREIRO** | `ELMO` | ❌ *Vazio* | ❌ *Falta elmo Nv. 5* | ❌ *Falta elmo Nv. 15* | ❌ *Falta elmo Nv. 25* | ❌ *Falta elmo Nv. 40* |
| **GUERREIRO** | `BOTAS` | ❌ *Vazio* | ❌ *Falta bota Nv. 5* | ❌ *Falta bota Nv. 15* | ❌ *Falta bota Nv. 25* | ❌ *Falta bota Nv. 40* |
| **GUERREIRO** | `ACESSORIO` | ❌ *Vazio* | ❌ *Falta acessório Nv. 5* | ❌ *Falta acessório Nv. 15* | ❌ *Falta acessório Nv. 25* | ✅ `relic_ancient_forge` (Nv. 30) |
| **BARBARO** | `ARMA` | ✅ `sword_iron_broadsword` | ✅ `sword_runic_tempered` | ❌ *Falta machado Nv. 15 (`FOR+CON+HP`)* | ✅ `sword_runic_bastard` (compartilhada) / ❌ *Falta machado brutal* | ❌ *Falta arma Nv. 40* |
| **BARBARO** | `ARMADURA` | ✅ `armor_chainmail` | ✅ `armor_runic_vigil` | ❌ *Falta peitoral Nv. 15 (`CON+FOR+HP`)* | ⚠️ `armor_titan_plate` (sem drop) | ❌ *Falta armadura Nv. 40* |
| **BARBARO** | `ESCUDO` | *N/A (Bárbaro usa 2 mãos)* | *N/A* | *N/A* | *N/A* | *N/A* |
| **BARBARO** | `ELMO` | ❌ *Vazio* | ❌ *Falta elmo Nv. 5* | ❌ *Falta elmo Nv. 15* | ❌ *Falta elmo Nv. 25* | ❌ *Falta elmo Nv. 40* |
| **BARBARO** | `BOTAS` | ❌ *Vazio* | ❌ *Falta bota Nv. 5* | ❌ *Falta bota Nv. 15* | ❌ *Falta bota Nv. 25* | ❌ *Falta bota Nv. 40* |
| **BARBARO** | `ACESSORIO` | ❌ *Vazio* | ❌ *Falta acessório Nv. 5* | ❌ *Falta acessório Nv. 15* | ❌ *Falta acessório Nv. 25* | ✅ `relic_ancient_forge` (Nv. 30) |
| **ARQUEIRO** | `ARMA` | ✅ `bow_hunting` (`+7 DES`) | ✅ `bow_warden_runic` (`+10 DES, +2 SAB`) | ❌ *Falta arco Nv. 15* | ❌ *Falta arco épico Nv. 25* | ❌ *Falta arco Nv. 40* |
| **ARQUEIRO** | `ARMADURA` | ❌ **0 itens** | ❌ **0 itens** | ❌ **0 itens** | ❌ **0 itens** | ❌ **0 itens** |
| **ARQUEIRO** | `ESCUDO` | *N/A (Arqueiro usa arco 2 mãos)* | *N/A* | *N/A* | *N/A* | *N/A* |
| **ARQUEIRO** | `ELMO` | ❌ *Vazio* | ❌ *Falta capuz Nv. 5* | ❌ *Falta capuz Nv. 15* | ❌ *Falta capuz Nv. 25* | ❌ *Falta capuz Nv. 40* |
| **ARQUEIRO** | `BOTAS` | ❌ *Vazio* | ❌ *Falta bota Nv. 5* | ❌ *Falta bota Nv. 15* | ❌ *Falta bota Nv. 25* | ❌ *Falta bota Nv. 40* |
| **ARQUEIRO** | `ACESSORIO` | ❌ *Vazio* | ❌ *Falta acessório Nv. 5* | ❌ *Falta acessório Nv. 15* | ❌ *Falta acessório Nv. 25* | ✅ `relic_ancient_forge` (Nv. 30) |
| **MONGE** | `ARMA` | ❌ **0 itens** (recebe espada inequipável) | ✅ `wraps_serene_path` (`+9 DES, +2 SAB`) | ❌ *Falta manopla/bastão Nv. 15* | ❌ *Falta arma épica Nv. 25* | ❌ *Falta arma Nv. 40* |
| **MONGE** | `ARMADURA` | ❌ **0 itens** | ❌ **0 itens** | ❌ **0 itens** | ❌ **0 itens** | ❌ **0 itens** |
| **MONGE** | `ESCUDO` | *N/A (Monge usa artes marciais)* | *N/A* | *N/A* | *N/A* | *N/A* |
| **MONGE** | `ELMO` | ❌ *Vazio* | ❌ *Falta faixa/tiara Nv. 5* | ❌ *Falta elmo Nv. 15* | ❌ *Falta elmo Nv. 25* | ❌ *Falta elmo Nv. 40* |
| **MONGE** | `BOTAS` | ❌ *Vazio* | ❌ *Falta bota Nv. 5* | ❌ *Falta bota Nv. 15* | ❌ *Falta bota Nv. 25* | ❌ *Falta bota Nv. 40* |
| **MONGE** | `ACESSORIO` | ❌ *Vazio* | ❌ *Falta acessório Nv. 5* | ❌ *Falta acessório Nv. 15* | ❌ *Falta acessório Nv. 25* | ✅ `relic_ancient_forge` (Nv. 30) |
| **MAGO** | `ARMA` | ✅ `staff_apprentice` (`+5 INT, +40 MP`) | ✅ `staff_runic_focus` (`+9 INT, +3 SAB, +60 MP`) | ❌ *Falta cajado Nv. 15* | ✅ `staff_void_astral` (`+22 INT, +8 SAB, +120 MP`) | ❌ *Falta cajado Nv. 40* |
| **MAGO** | `ARMADURA` | ⚠️ `robe_mystic_threads` (sem drop) | ✅ `robe_runic_weave` (`+8 INT, +4 SAB, +70 MP`) | ❌ *Falta manto Nv. 15* | ❌ *Falta manto épico Nv. 25* | ❌ *Falta manto Nv. 40* |
| **MAGO** | `ESCUDO` | *N/A* | *N/A* | *N/A* | *N/A* | *N/A* |
| **MAGO** | `ELMO` | ❌ *Vazio* | ❌ *Falta diadema Nv. 5* | ❌ *Falta diadema Nv. 15* | ❌ *Falta diadema Nv. 25* | ❌ *Falta diadema Nv. 40* |
| **MAGO** | `BOTAS` | ❌ *Vazio* | ❌ *Falta bota Nv. 5* | ❌ *Falta bota Nv. 15* | ❌ *Falta bota Nv. 25* | ❌ *Falta bota Nv. 40* |
| **MAGO** | `ACESSORIO` | ❌ *Vazio* | ❌ *Falta acessório Nv. 5* | ❌ *Falta acessório Nv. 15* | ❌ *Falta acessório Nv. 25* | ✅ `relic_ancient_forge` (Nv. 30) |
| **BRUXO** | `ARMA` | ⚠️ `staff_apprentice` (dá `INT`, zero `CAR`) | ✅ `focus_veiled_pact` (`+9 CAR, +8 INT, +60 MP`) | ❌ *Falta foco/grimório Nv. 15 (`CAR`)* | ❌ **`staff_void_astral` exige 30 INT e dá 0 CAR!** | ❌ *Falta arma Nv. 40 (`CAR`)* |
| **BRUXO** | `ARMADURA` | ⚠️ `robe_mystic_threads` (zero `CAR`, sem drop) | ⚠️ `robe_runic_weave` (`+8 INT, +4 SAB`, **zero `CAR`**) | ❌ *Falta manto de pacto Nv. 15 (`CAR+CON`)* | ❌ *Falta manto épico Nv. 25 (`CAR+CON`)* | ❌ *Falta manto Nv. 40 (`CAR`)* |
| **BRUXO** | `ESCUDO` | *N/A* | *N/A* | *N/A* | *N/A* | *N/A* |
| **BRUXO** | `ELMO` | ❌ *Vazio* | ❌ *Falta coroa/capuz Nv. 5 (`CAR`)* | ❌ *Falta elmo Nv. 15 (`CAR`)* | ❌ *Falta elmo Nv. 25 (`CAR`)* | ❌ *Falta elmo Nv. 40 (`CAR`)* |
| **BRUXO** | `BOTAS` | ❌ *Vazio* | ❌ *Falta bota Nv. 5* | ❌ *Falta bota Nv. 15* | ❌ *Falta bota Nv. 25* | ❌ *Falta bota Nv. 40* |
| **BRUXO** | `ACESSORIO` | ❌ *Vazio* | ❌ *Falta acessório Nv. 5* | ❌ *Falta acessório Nv. 15* | ❌ *Falta acessório Nv. 25* | ✅ `relic_ancient_forge` (Nv. 30) |
| **CLERIGO** | `ARMA` | ✅ `mace_cleric_dawn` (`+6 SAB, +3 FOR`) | ✅ `mace_dawn_consecrated` (`+9 SAB, +3 FOR, +40 MP`) | ❌ *Falta maça/cetro Nv. 15 (`SAB`)* | ❌ *Falta maça/cetro épico Nv. 25 (`SAB`)* | ❌ *Falta arma Nv. 40 (`SAB`)* |
| **CLERIGO** | `ARMADURA` | ✅ `armor_chainmail` (`+6 CON, +50 HP`) | ✅ `armor_runic_vigil` (`+9 CON, +80 HP`) | ❌ *Falta vestimenta Nv. 15 (`SAB+CON`)* | ❌ *Falta armadura Nv. 25 (`armor_titan_plate` exclui Clérigo)* | ❌ *Falta armadura Nv. 40* |
| **CLERIGO** | `ESCUDO` | ⚠️ `shield_iron_buckler` (sem drop) | ❌ *Falta escudo Nv. 5 (`SAB+CON`)* | ❌ *Falta escudo Nv. 15* | ❌ *Falta escudo Nv. 25* | ❌ *Falta escudo Nv. 40* |
| **CLERIGO** | `ELMO` | ❌ *Vazio* | ❌ *Falta mitra/elmo Nv. 5 (`SAB`)* | ❌ *Falta elmo Nv. 15 (`SAB`)* | ❌ *Falta elmo Nv. 25 (`SAB`)* | ❌ *Falta elmo Nv. 40 (`SAB`)* |
| **CLERIGO** | `BOTAS` | ❌ *Vazio* | ❌ *Falta bota Nv. 5* | ❌ *Falta bota Nv. 15* | ❌ *Falta bota Nv. 25* | ❌ *Falta bota Nv. 40* |
| **CLERIGO** | `ACESSORIO` | ❌ *Vazio* | ❌ *Falta acessório Nv. 5* | ❌ *Falta acessório Nv. 15* | ❌ *Falta acessório Nv. 25* | ✅ `relic_ancient_forge` (Nv. 30) |

---

### 4.3 Lacunas de Gemas (`ItemType.GEMA`)

Hoje existem apenas **4 gemas** em [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts#L183-L250):
- `gem_ruby_str` (`+6 forca`) — atende `GUERREIRO` e `BARBARO`.
- `gem_sapphire_int` (`+6 inteligencia, +30 maxResource`) — atende `MAGO`.
- `gem_emerald_dex` (`+6 destreza`) — atende `ARQUEIRO` e `MONGE`.
- `gem_topaz_con` (`+6 constituicao, +80 maxHp`) — universal de sobrevivência.

**Lacunas verificadas em Gemas:**
1. **Falta Gema de Sabedoria (`sabedoria`):** O **Clérigo** (100% `SAB`) e o **Monge** (secundário `SAB`) não possuem gema de seu atributo espiritual!
2. **Falta Gema de Carisma (`carisma`):** O **Bruxo** (100% `CAR`) e o **Guerreiro** (ataque básico `FOR + CAR`) não possuem gema de Carisma!

---

## 5. Diretrizes de Preenchimento Adotadas no Catálogo Proposto (`02_CATALOGO_PROPOSTO.md`)

1. **Zero Invenção de Slots ou Proficiências Artificiais:**
   - Mantidos os 6 slots reais (`ARMA`, `ARMADURA`, `ESCUDO`, `ACESSORIO`, `ELMO`, `BOTAS`).
   - `ESCUDO` permanece exclusivo de `GUERREIRO` e `CLERIGO` (com variantes táticas: parede defensiva de `CON+maxHp` vs. égide consagrada de `SAB+CAR+CON`).
2. **Separação Estrita entre `INT`, `SAB` e `CAR`:**
   - **Mago:** Cajados/Orbes e Mantos de Trama Astral (`inteligencia`, `maxResource`, `constituicao`).
   - **Clérigo:** Maças/Turíbulos e Vestimentas da Aurora (`sabedoria`, `constituicao`, `maxHp`, `maxResource`) — ajudando diretamente o gargalo de DPS do Clérigo contra chefes (como *Frostbite* Nv. 10 apontado em [`Docs/ENTREGA_ECONOMIA_2026-11-04.md`](file:///e:/MagicForge_Universe/Docs/ENTREGA_ECONOMIA_2026-11-04.md#L49)).
   - **Bruxo:** Grimórios/Focos de Pacto e Vestes Abissais (`carisma`, `constituicao`, `maxHp`, `maxResource`).
3. **Identidades Distintas para Classes Físicas (`GUERREIRO` vs. `BARBARO` e `ARQUEIRO` vs. `MONGE`):**
   - **Guerreiro vs. Bárbaro:** Além das lâminas compartilhadas, o Bárbaro recebe opções de Machado/Brutalidade com foco em `forca + constituicao + maxHp` (respondendo ao gargalo de sobrevivência contra *Frostbite* medido em [`Docs/ENTREGA_ECONOMIA_2026-11-04.md`](file:///e:/MagicForge_Universe/Docs/ENTREGA_ECONOMIA_2026-11-04.md#L48)), enquanto o Guerreiro pode combinar Espada + Escudo e peças com `forca + carisma + constituicao`.
   - **Arqueiro vs. Monge:** O Arqueiro usa exclusivamente **Arcos** (`destreza`) e Gibões de Patrulheiro; o Monge usa **Faixas/Manoplas de Chi e Bastões Monásticos** (`destreza + sabedoria`) e Túnicas do Lótus/Vento (`destreza + sabedoria + constituicao`).
4. **Progressão sem Dependência Circular (Anti-Gatekeeping):**
   - Nenhum equipamento de Nv. 5 ou Nv. 15 exige gemas épicas, fragmentos rúnicos de chefes de Mundo 2/3 ou itens que só caem do chefe que o jogador precisa vencer para progredir.
   - Patamares estruturados em: **Nv. 1 (Início)** → **Nv. 5 (Reforja Rúnica v1/v2)** → **Nv. 15 (Transição Mundo 2 / Jotunheim)** → **Nv. 25 (Marco Épico / 2º Círculo)** → **Nv. 30–40 (Marco Pré-Ultimate / Boss Rush)**.

