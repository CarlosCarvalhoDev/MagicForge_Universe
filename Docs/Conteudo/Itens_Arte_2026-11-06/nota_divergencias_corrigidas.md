# Nota de Divergências Corrigidas — Reconciliação de Catálogo e Fontes (2026-11-06)

Esta nota documenta a reconciliação oficial entre o pacote de propostas anterior (`Docs/Conteudo/Propostas_2026-11-05/`) e o estado real do código em [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts), [`shared/src/equipment-fusion.ts`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts), [`server/src/entities/Monster.ts`](file:///e:/MagicForge_Universe/server/src/entities/Monster.ts), [`server/src/game/DungeonManager.ts`](file:///e:/MagicForge_Universe/server/src/game/DungeonManager.ts), [`server/src/database/DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts) e [`server/src/game/OfflineRewards.ts`](file:///e:/MagicForge_Universe/server/src/game/OfflineRewards.ts), conforme apontado em [`Docs/REVISAO_PROPOSTA_CONTEUDO_2026-11-05.md`](file:///e:/MagicForge_Universe/Docs/REVISAO_PROPOSTA_CONTEUDO_2026-11-05.md) e solicitado em [`Docs/PROMPT_IA_ITENS_ARTE_E_PROGRESSAO_2026-11-06.md`](file:///e:/MagicForge_Universe/Docs/PROMPT_IA_ITENS_ARTE_E_PROGRESSAO_2026-11-06.md).

Os dados reconciliados e auditados programaticamente encontram-se em [`catalogo_reconciliado.json`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/catalogo_reconciliado.json).

---

## 1. Contagem Real de Itens Existentes (`46` itens em `shared/src/items.ts`)

Na proposta de `2026-11-05`, a seção de itens existentes havia contabilizado 44 itens porque foi redigida antes da inclusão das armas iniciais dedicadas de Monge e Bruxo em [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts).

A contagem real auditada diretamente em `ITEMS_DATABASE` ([`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts#L53-L793)) é de **46 itens existentes**, divididos em:

- **22 Equipamentos (`ItemType.EQUIPAMENTO`)**:
  - **12 equipamentos base/clássicos**: `sword_iron_broadsword`, `axe_berserker_cleaver`, `bow_oak_hunter`, `staff_apprentice`, `mace_cleric_dawn`, `staff_monk_ash`, `focus_pact_initiate`, `armor_chainmail`, `robe_mystic_threads`, `armor_titan_plate`, `shield_iron_buckler`, `relic_ancient_forge`.
  - **2 equipamentos de boss / raid**: `boss_abyssal_cleaver`, `boss_aegis_plate`.
  - **8 equipamentos reforjados da fusão `v1`**: `sword_runic_tempered`, `axe_frenzy_reaver`, `bow_windpiercer`, `staff_arcane_condenser`, `mace_radiant_verdict`, `armor_runic_vigil`, `shield_bastion_crest`, `relic_forgemaster_core`.
- **11 Consumíveis (`ItemType.CONSUMIVEL`)**:
  - Poções: `potion_hp_minor`, `potion_mp_minor`, `potion_hp_medium`, `potion_mp_medium`, `potion_hp_major`, `potion_mp_major`.
  - Pergaminhos: `scroll_exp_boost`, `scroll_gold_boost`, `scroll_drop_boost`, `scroll_boss_summon`, `scroll_awakening`.
- **13 Materiais (`ItemType.MATERIAL`)**:
  - Materiais de mundo/boss: `ore_iron_arcane`, `arcane_dust`, `leather_shadow_beast`, `essence_fire_elemental`, `core_golem_crackled`, `shard_void_crystal`, `dragon_scale_red`, `phoenix_feather`, `fragmento_runico_ancestral`.
  - Gemas elementais de soquete: `gem_ruby_1`, `gem_sapphire_1`, `gem_emerald_1`, `gem_topaz_1`.

---

## 2. Substituição dos IDs Propostos para Armas Iniciais de Monge e Bruxo

Com a existência oficial de [`staff_monk_ash`](file:///e:/MagicForge_Universe/shared/src/items.ts#L121-L133) (*Bastão de Freixo Monástico*, `minLevel: 1`, `MONGE`, `destreza: +5, sabedoria: +3`, `sellPrice: 25`) e [`focus_pact_initiate`](file:///e:/MagicForge_Universe/shared/src/items.ts#L134-L146) (*Orbe do Pacto Iniciado*, `minLevel: 1`, `BRUXO`, `carisma: +6, constituicao: +2`, `sellPrice: 25`) em `shared/src/items.ts` e na criação de personagem em [`DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts#L940-L952):

| ID Proposto em `2026-11-05` | Classe / Slot / Nível | Status Reconciliado em `catalogo_reconciliado.json` | Item Canônico que o Substitui em `shared/src/items.ts` | Ação Recomendada para Receitas `v2` |
| :--- | :--- | :--- | :--- | :--- |
| `staff_monk_ironwood` | `MONGE` / `ARMA` / Nv 1 | `proposto_substituido_por_existente` (`replacedByExistingId: "staff_monk_ash"`) | [`staff_monk_ash`](file:///e:/MagicForge_Universe/shared/src/items.ts#L121-L133) | A receita proposta `reforge_monk_staff_t1` deve usar `3x staff_monk_ash` como ingrediente base em vez de `staff_monk_ironwood` (após adicionar `staff_monk_ash` a `FUSION_BASE_ITEMS` e às tabelas de drop). |
| `focus_pact_grim_orb` | `BRUXO` / `ARMA` / Nv 1 | `proposto_substituido_por_existente` (`replacedByExistingId: "focus_pact_initiate"`) | [`focus_pact_initiate`](file:///e:/MagicForge_Universe/shared/src/items.ts#L134-L146) | A receita proposta `reforge_warlock_focus_t1` deve usar `3x focus_pact_initiate` como ingrediente base em vez de `focus_pact_grim_orb` (após adicionar `focus_pact_initiate` a `FUSION_BASE_ITEMS` e às tabelas de drop). |

---

## 3. Alinhamento Explícito do Contrato JSON (`existingItems` vs. `proposedItems`)

Na entrega de `2026-11-05`, o texto descritivo mencionava um único vetor `items`, enquanto o JSON estruturava `existingItems` e `proposedItems` separadamente.

Em [`catalogo_reconciliado.json`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/catalogo_reconciliado.json), o contrato de estrutura é declarado explicitamente no bloco `schemaContract` e validado em `counts`:

- **`existingItems`**: Array contendo exatamente os **46 itens existentes** em `shared/src/items.ts`, enriquecidos com o bloco `sourceAudit` (fontes reais de drop em `Monster.ts`, `DungeonManager.ts`, `DatabaseManager.ts`, `OfflineRewards.ts` e uso em `equipment-fusion.ts`).
- **`proposedItems`**: Array separado contendo os **47 itens propostos** originados da revisão de `2026-11-05`:
  - **45 propostas ativas** (`status: "proposto"`), cobrindo as lacunas de armas, armaduras, escudos, acessórios, elmos e botas para as 7 classes.
  - **2 propostas substituídas** (`status: "proposto_substituido_por_existente"`): `staff_monk_ironwood` e `focus_pact_grim_orb`, mantidas apenas para rastreabilidade histórica com ponteiro explícito `replacedByExistingId`.
- **Total de registros no arquivo**: `46 + 47 = 93` registros, com **`0` IDs duplicados** (`duplicateIdsCount: 0`).

---

## 4. Status Correto das Receitas `v1` (`shared/src/equipment-fusion.ts`)

As **8 receitas `v1`** definidas em [`shared/src/equipment-fusion.ts`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts#L28-L214) (`reforge_sword_runic_tempered`, `reforge_axe_frenzy_reaver`, `reforge_bow_windpiercer`, `reforge_staff_arcane_condenser`, `reforge_mace_radiant_verdict`, `reforge_armor_runic_vigil`, `reforge_shield_bastion_crest`, `reforge_relic_forgemaster_core`) **não** são "não medidas".

Elas estão registradas em [`catalogo_reconciliado.json`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/catalogo_reconciliado.json) (`fusionV1Status.calibrationStatus`) com o status canônico:

> **`implementadas e medidas inicialmente`**

**Evidências que sustentam esse status no repositório**:
1. Implementação funcional determinística em [`shared/src/equipment-fusion.ts`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts), no servidor ([`server/src/index.ts`](file:///e:/MagicForge_Universe/server/src/index.ts), [`server/src/database/DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts)) e na UI ([`client/src/ui/EquipmentFusion.ts`](file:///e:/MagicForge_Universe/client/src/ui/EquipmentFusion.ts)).
2. Relatório técnico e medições iniciais em [`Docs/FUSAO_EQUIPAMENTOS_2026-11-05.md`](file:///e:/MagicForge_Universe/Docs/FUSAO_EQUIPAMENTOS_2026-11-05.md), calibradas sobre a amostra de 30 minutos de [`Docs/ENTREGA_ECONOMIA_2026-11-04.md`](file:///e:/MagicForge_Universe/Docs/ENTREGA_ECONOMIA_2026-11-04.md) e [`Docs/EVIDENCIAS_ECONOMIA_2026-11-04.json`](file:///e:/MagicForge_Universe/Docs/EVIDENCIAS_ECONOMIA_2026-11-04.json) (`1.800` de ouro + `3` cópias base + `6x ore_iron_arcane` + `8x arcane_dust`, liberando `+2` slots líquidos na mochila quando o resultado ainda não existe e travando o item produzido com `isLocked = true`).

---

## 5. Auditoria de Fontes de Drop Reais (`Monster.ts`, `DungeonManager.ts`, `DatabaseManager.ts`)

Cada um dos 46 itens existentes em `shared/src/items.ts` foi cruzado contra:
- [`server/src/entities/Monster.ts`](file:///e:/MagicForge_Universe/server/src/entities/Monster.ts#L502-L545) (`rollLoot()`)
- [`server/src/game/DungeonManager.ts`](file:///e:/MagicForge_Universe/server/src/game/DungeonManager.ts#L16-L70) (`DUNGEON_TEMPLATES`)
- [`server/src/database/DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts#L931-L977) (inventário inicial na criação do personagem)
- [`server/src/game/OfflineRewards.ts`](file:///e:/MagicForge_Universe/server/src/game/OfflineRewards.ts#L139-L176) (recompensas de farm offline)

### 5.1. Itens existentes SEM fonte de drop ativa em monstros/dungeons (`item_existente_sem_fonte_de_drop_ativa` / `item_existente_apenas_inicial_sem_drop_ativo`)

A auditoria identificou **7 equipamentos existentes em `shared/src/items.ts`** que não possuem atualmente nenhuma entrada de drop em `Monster.ts` nem em `DungeonManager.ts`:

| `itemId` | Nome | Classificação Auditada (`dropStatus`) | Situação Atual no Código | Impacto em Fusão (`v1` e propostas `v2`) |
| :--- | :--- | :--- | :--- | :--- |
| [`armor_titan_plate`](file:///e:/MagicForge_Universe/shared/src/items.ts#L163-L175) | Armadura de Placas Titânica | `item_existente_sem_fonte_de_drop_ativa` | Existe em `items.ts` (Épico, Nv 15), mas não é concedida no início, não dropa em `Monster.ts`/`DungeonManager.ts` e não possui receita em `equipment-fusion.ts`. | Jogadores não conseguem obtê-la em jogo nem usá-la como ingrediente sem antes incluí-la em tabela de drop ou como saída de receita de forja. |
| [`robe_mystic_threads`](file:///e:/MagicForge_Universe/shared/src/items.ts#L150-L162) | Manto de Fios Místicos | `item_existente_sem_fonte_de_drop_ativa` | Existe em `items.ts` (Incomum, Nv 5, `MAGO/CLERIGO/BRUXO`), mas não dropa em `Monster.ts` nem em `DungeonManager.ts`. | Qualquer receita que exija duplicatas de `robe_mystic_threads` depende de incluí-lo nas tabelas de drop de monstros/dungeons. |
| [`shield_iron_buckler`](file:///e:/MagicForge_Universe/shared/src/items.ts#L176-L188) | Broquel de Ferro Forjado | `item_existente_sem_fonte_de_drop_ativa` | Está em `FUSION_BASE_ITEMS` e é ingrediente (`3x`) da receita `v1` [`reforge_shield_bastion_crest`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts#L166-L190), mas **não está** na tabela `rollLoot()` de [`Monster.ts`](file:///e:/MagicForge_Universe/server/src/entities/Monster.ts#L502-L545) nem na criação de personagem. | **Bloqueio de farm para `reforge_shield_bastion_crest`**: Guerreiro e Clérigo não conseguem farmar as 3 cópias de `shield_iron_buckler` em monstros comuns até que ele seja adicionado a `Monster.ts`. |
| [`staff_apprentice`](file:///e:/MagicForge_Universe/shared/src/items.ts#L95-L107) | Cajado do Aprendiz | `item_existente_apenas_inicial_sem_drop_ativo` | Concedido `1x` na criação do Mago ([`DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts#L937-L939)) e listado em `FUSION_BASE_ITEMS` para [`reforge_staff_arcane_condenser`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts#L101-L120), mas **não dropa** em `Monster.ts`. | O Mago recebe 1 cópia equipada, mas não consegue farmar as 3 cópias desequipadas para `reforge_staff_arcane_condenser` sem drop ativo em `Monster.ts`. |
| [`mace_cleric_dawn`](file:///e:/MagicForge_Universe/shared/src/items.ts#L108-L120) | Maça da Aurora | `item_existente_apenas_inicial_sem_drop_ativo` | Concedida `1x` na criação do Clérigo ([`DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts#L934-L936)) e listada em `FUSION_BASE_ITEMS` para [`reforge_mace_radiant_verdict`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts#L121-L140), mas **não dropa** em `Monster.ts`. | O Clérigo recebe 1 cópia equipada, mas não consegue farmar as 3 cópias desequipadas para `reforge_mace_radiant_verdict` sem drop ativo em `Monster.ts`. |
| [`staff_monk_ash`](file:///e:/MagicForge_Universe/shared/src/items.ts#L121-L133) | Bastão de Freixo Monástico | `item_existente_apenas_inicial_sem_drop_ativo` | Concedido `1x` na criação do Monge ([`DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts#L940-L942)), mas não dropa em `Monster.ts` e ainda não consta em `FUSION_BASE_ITEMS`. | Exige inclusão em `Monster.ts` e em `FUSION_BASE_ITEMS` antes de ativar fusão T1 de Monge. |
| [`focus_pact_initiate`](file:///e:/MagicForge_Universe/shared/src/items.ts#L134-L146) | Orbe do Pacto Iniciado | `item_existente_apenas_inicial_sem_drop_ativo` | Concedido `1x` na criação do Bruxo ([`DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts#L943-L945)), mas não dropa em `Monster.ts` e ainda não consta em `FUSION_BASE_ITEMS`. | Exige inclusão em `Monster.ts` e em `FUSION_BASE_ITEMS` antes de ativar fusão T1 de Bruxo. |

### 5.2. Equipamentos e materiais com fonte de drop ativa confirmada (`fonte_de_drop_ativa`)

- **Equipamentos base com drop ativo em `Monster.ts`** (`rollLoot()`, chance de equipamento `4%` em monstros comuns / `12%` em chefes, sub-roll sobre `weightTotal = 55`):
  - `sword_iron_broadsword` (peso `14/55` ≈ `25,45%` dos equipamentos; também concedido `1x` na criação do Guerreiro).
  - `armor_chainmail` (peso `12/55` ≈ `21,82%` dos equipamentos; também concedido `1x` na criação de todas as classes).
  - `bow_oak_hunter` (peso `11/55` ≈ `20,00%` dos equipamentos; também concedido `1x` na criação do Arqueiro).
  - `axe_berserker_cleaver` (peso `10/55` ≈ `18,18%` dos equipamentos; também concedido `1x` na criação do Bárbaro).
  - `relic_ancient_forge` (peso `8/55` ≈ `14,55%` dos equipamentos).
- **Equipamentos de boss com drop ativo em `DungeonManager.ts`**:
  - `boss_abyssal_cleaver` (`ruinas_arcanas`, `cripta_esquecida`).
  - `boss_aegis_plate` (`forja_ancestral`, `cidadela_abissal`, `abismo_eterno`).
- **Materiais com drop ativo em `Monster.ts`, `DungeonManager.ts` e/ou `OfflineRewards.ts`**:
  - `ore_iron_arcane`, `arcane_dust`, `leather_shadow_beast`, `essence_fire_elemental`, `core_golem_crackled`, `shard_void_crystal`, `dragon_scale_red`, `phoenix_feather`, `fragmento_runico_ancestral`, `gem_ruby_1`, `gem_sapphire_1`, `gem_emerald_1`, `gem_topaz_1`.

