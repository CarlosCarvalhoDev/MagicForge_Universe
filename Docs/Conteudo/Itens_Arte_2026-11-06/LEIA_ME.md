# LEIA-ME — Pacote de Arte de Itens, Reconciliação de Catálogo e Progressão Guerreiro/Bárbaro (2026-11-06)

Este diretório (`Docs/Conteudo/Itens_Arte_2026-11-06/`) reúne todos os entregáveis solicitados em [`Docs/PROMPT_IA_ITENS_ARTE_E_PROGRESSAO_2026-11-06.md`](file:///e:/MagicForge_Universe/Docs/PROMPT_IA_ITENS_ARTE_E_PROGRESSAO_2026-11-06.md).

Em estrita observância ao [`AGENTS.md`](file:///e:/MagicForge_Universe/AGENTS.md) e à divisão de responsabilidades com o agente principal (Codex), **nenhum arquivo existente fora de `Docs/Conteudo/Itens_Arte_2026-11-06/` foi editado** (`shared/`, `server/`, `client/`, banco de dados, assets finais do cliente, `.meta` do Unity e `Docs/Conteudo/Propostas_2026-11-05/` permaneceram intactos).

---

## 1. Relação de Arquivos Criados em `Docs/Conteudo/Itens_Arte_2026-11-06/`

### 1.1. Manifesto, Prancha de Contato e Prévia de Células (Entregável 1)
- [`manifesto_itens.json`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/manifesto_itens.json): Auditoria técnica do lote prioritário de 12 itens, diagnóstico de como o cliente Web renderiza ícones hoje (`main.ts`, `InventoryView.ts`, `InventoryTooltip.ts`, `EquipmentFusion.ts`), metadados verificados dos 12 PNGs em `rascunhos/` (`512×512`, `RGBA 8-bit colorType 6`, percentual de transparência, margens em pixels, `sha256`, método de geração e prompts em inglês) e inventário dos 8 PNGs já existentes em `client/public/assets/ui/items/`.
- [`prancha_contato.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/prancha_contato.png): Prancha de contato visual (marcada como **RASCUNHO**) exibindo os 12 ícones lado a lado sobre fundo escuro e grade quadriculada de transparência.
- [`previa_celulas.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/previa_celulas.png): Simulação estática (marcada como **RASCUNHO**) dos 12 ícones reduzidos em células de **`64×64`**, **`48×48`** e **`32×32`** pixels com borda de raridade aplicada dinamicamente fora do PNG.
- [`previa_celulas.html`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/previa_celulas.html): Página HTML estática autocontida (marcada como **RASCUNHO**) para inspeção interativa em navegador nas escalas `64×64`, `48×48` e `32×32`.

### 1.2. Rascunhos PNG `512×512` RGBA Transparentes (`rascunhos/<itemId>.png`)
1. [`rascunhos/sword_iron_broadsword.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/sword_iron_broadsword.png)
2. [`rascunhos/sword_runic_tempered.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/sword_runic_tempered.png)
3. [`rascunhos/sword_runic_bastard.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/sword_runic_bastard.png)
4. [`rascunhos/armor_chainmail.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/armor_chainmail.png)
5. [`rascunhos/armor_runic_vigil.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/armor_runic_vigil.png)
6. [`rascunhos/armor_titan_plate.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/armor_titan_plate.png)
7. [`rascunhos/shield_iron_buckler.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/shield_iron_buckler.png) *(fallback procedural C# `512×512` RGBA devido a HTTP 429 na 12ª chamada da API de imagem; ver seção 4)*
8. [`rascunhos/relic_ancient_forge.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/relic_ancient_forge.png)
9. [`rascunhos/potion_hp_minor.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/potion_hp_minor.png)
10. [`rascunhos/potion_mp_minor.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/potion_mp_minor.png)
11. [`rascunhos/ore_iron_arcane.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/ore_iron_arcane.png)
12. [`rascunhos/arcane_dust.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/arcane_dust.png)

### 1.3. Reconciliação de Catálogo e Progressão em Lote Pequeno (Entregáveis 2 e 3)
- [`catalogo_reconciliado.json`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/catalogo_reconciliado.json): Catálogo JSON reconciliado com os **46 itens existentes** em [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts) (`existingItems`), os **47 itens propostos** de `2026-11-05` (`proposedItems`, sendo `45` ativos e `2` marcados como substituídos por `staff_monk_ash` e `focus_pact_initiate`), `0` IDs duplicados, status das receitas `v1` como **implementadas e medidas inicialmente** e auditoria individual de drop em `Monster.ts`, `DungeonManager.ts`, `DatabaseManager.ts` e `OfflineRewards.ts`.
- [`nota_divergencias_corrigidas.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/nota_divergencias_corrigidas.md): Relatório objetivo das 5 correções de reconciliação aplicadas sobre a revisão de `2026-11-05`.
- [`progressao_equipamentos_proposta.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/progressao_equipamentos_proposta.md): Proposta enxuta de progressão para **Guerreiro e Bárbaro nos marcos Nv 1, 5, 15 e 25** cobrindo `ARMA`, `ARMADURA`, `ESCUDO` (exclusivo Guerreiro/Clérigo, vedado ao Bárbaro), `ACESSORIO`, `ELMO` e `BOTAS`.

---

## 2. Tabela Auditada do Lote 1 de 12 Ícones Prioritários

Todos os 12 arquivos em `rascunhos/` foram inspecionados visualmente e verificados por script quanto a:
- Dimensões exatas: **`512×512` px**
- Formato de cor: **PNG RGBA 8-bit (`colorType: 6`)** com canal alfa real transparente
- Margem segura: **`>= 48px` (~`9,4%`)** em todas as 4 bordas (nenhum objeto encosta no limite do canvas)
- Sem moldura de raridade queimada no PNG, sem texto/números e sem cantos opacos

| `itemId` | Nome Atual / Proposto | Tipo | Slot | Raridade | `minLevel` | Status no Código | Arte Atual em `client/public/assets/ui/` | Rascunho Gerado (`512×512` RGBA) | Transparência e Margens (`L/T/R/B` px) | `sha256` (primeiros 16 hex + completo no JSON) | Status da Arte | Legibilidade em `64 / 48 / 32` |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `sword_iron_broadsword` | Espada Larga de Ferro | `EQUIPAMENTO` | `ARMA` | `COMUM` | 1 | Existente (`items.ts`) | Nenhuma em `ui/items/` (`ui/slots/weapon.png` é silhueta dourada de slot vazio) | [`rascunhos/sword_iron_broadsword.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/sword_iron_broadsword.png) | `87,1%` transp. (`48/48/49/48`) | `97d837db4daf624d...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Silhueta diagonal 45° limpa; lâmina de ferro fosco e punho de couro legíveis em 32×32. |
| `sword_runic_tempered` | Espada Rúnica Temperada | `EQUIPAMENTO` | `ARMA` | `INCOMUM` | 5 | Existente (`items.ts` / fusão `v1`) | Nenhuma | [`rascunhos/sword_runic_tempered.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/sword_runic_tempered.png) | `83,1%` transp. (`50/48/50/48`) | `83ee48e880947a29...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Lâmina mais larga que a Nv 1, guarda angular de bronze e 3 runas âmbar visíveis em 48×48 e 32×32. |
| `sword_runic_bastard` | Espada Bastarda de Têmpera Rúnica | `EQUIPAMENTO` | `ARMA` | `RARO` / `EPICO` | 15 / 25 | Proposto (`Propostas_2026-11-05`) | Nenhuma | [`rascunhos/sword_runic_bastard.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/sword_runic_bastard.png) | `83,9%` transp. (`49/48/50/48`) | `c0e4f3f08a1d337b...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Montante pesado com ricasso dentado, guarda esculpida e sulco rúnico dourado; distingue-se imediatamente das duas anteriores. |
| `armor_chainmail` | Cota de Malha de Aço | `EQUIPAMENTO` | `ARMADURA` | `COMUM` | 1 | Existente (`items.ts`) | Nenhuma em `ui/items/` (`ui/slots/armor.png` é silhueta de slot vazio) | [`rascunhos/armor_chainmail.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/armor_chainmail.png) | `63,4%` transp. (`73/48/73/48`) | `c67034afb89b63cc...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Torso de malha de aço com ombreiras e cinto de couro marrom; leitura imediata em 64/48/32. |
| `armor_runic_vigil` | Cota Rúnica da Vigília | `EQUIPAMENTO` | `ARMADURA` | `INCOMUM` | 5 | Existente (`items.ts` / fusão `v1`) | Nenhuma | [`rascunhos/armor_runic_vigil.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/armor_runic_vigil.png) | `66,2%` transp. (`86/48/86/48`) | `927e3439dd863137...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Placas peitorais sobre malha escura e espaldeiras com runas âmbar; progressão clara sobre `armor_chainmail`. |
| `armor_titan_plate` | Armadura de Placas Titânica | `EQUIPAMENTO` | `ARMADURA` | `EPICO` | 15 | Existente sem drop ativo (`items.ts`) | Nenhuma | [`rascunhos/armor_titan_plate.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/armor_titan_plate.png) | `65,3%` transp. (`63/48/63/48`) | `24b19e55be918a86...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Couraça maciça de aço negro e ouro velho com alto-relevo titânico e grandes espaldeiras; silhueta imponente em 32×32. |
| `shield_iron_buckler` | Broquel de Ferro Forjado | `EQUIPAMENTO` | `ESCUDO` | `COMUM` | 1 | Existente sem drop ativo (`items.ts` / base `v1`) | Nenhuma em `ui/items/` (`ui/slots/shield.png` é escudo kite de slot vazio) | [`rascunhos/shield_iron_buckler.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/shield_iron_buckler.png) | `51,3%` transp. (`59/53/55/50`) | `4fcb66cfa93c2464...` | `rascunho_procedural_cota_429_revisar` (C# `512×512` RGBA) | Silhueta circular 3/4 com umbo central e rebites de bronze bem legível em 64/48/32; marcado para regeneração pictórica quando a cota HTTP 429 liberar. |
| `relic_ancient_forge` | Relíquia da Forja Ancestral | `EQUIPAMENTO` | `ACESSORIO` | `RARO` | 5 | Existente (`items.ts` / base `v1`) | Nenhuma em `ui/items/` (`ui/slots/accessory.png` tem 2 objetos de slot vazio) | [`rascunhos/relic_ancient_forge.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/relic_ancient_forge.png) | `62,8%` transp. (`94/48/95/48`) | `293a8e5c21fde15a...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Medalhão octogonal único com núcleo estelar dourado/ciano; excelente contraste no centro em 32×32. |
| `potion_hp_minor` | Poção de Vida Menor | `CONSUMIVEL` | — | `COMUM` | — | Existente (`items.ts`) | `ui/icons/potion_hp.svg` (glifo plano 24×24 de HUD) | [`rascunhos/potion_hp_minor.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/potion_hp_minor.png) | `68,2%` transp. (`108/48/109/48`) | `487bd63940e175bf...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Frasco esférico bojudo vermelho-rubi com rolha de cortiça; distingue-se por cor e forma da poção de mana. |
| `potion_mp_minor` | Poção de Mana Menor | `CONSUMIVEL` | — | `COMUM` | — | Existente (`items.ts`) | `ui/icons/potion_mp.svg` (glifo plano 24×24 de HUD) | [`rascunhos/potion_mp_minor.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/potion_mp_minor.png) | `71,6%` transp. (`119/48/120/49`) | `1f27eb3922e6b3e5...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Frasco facetado em gota/prisma azul-safira com colarinho de prata; silhueta distinta da poção de vida até para daltônicos. |
| `ore_iron_arcane` | Minério de Ferro Arcano | `MATERIAL` | — | `COMUM` | — | Existente (`items.ts` / insumo `v1`) | Nenhuma | [`rascunhos/ore_iron_arcane.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/ore_iron_arcane.png) | `52,6%` transp. (`51/48/52/48`) | `b306773f1143a498...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Bloco bruto de ferro escuro com veios ciano e âmbar; elimina a confusão com o emoji `💎` das pedras de refino. |
| `arcane_dust` | Pó Arcano | `MATERIAL` | — | `COMUM` | — | Existente (`items.ts` / insumo `v1`) | Nenhuma | [`rascunhos/arcane_dust.png`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/arcane_dust.png) | `72,8%` transp. (`48/69/48/69`) | `f43439dec97a720a...` | `rascunho_gerado_validado` (IA + pós-proc RGBA) | Pó cristalino ciano/dourado contido em concha de bronze e couro; mantém leitura sólida em 32×32 sem virar névoa difusa. |

---

## 3. Diagnóstico dos 8 PNGs Existentes em `client/public/assets/ui/items/`

Além dos 12 itens prioritários, a auditoria inspecionou todos os **8 PNGs (`64×64` RGBA)** já presentes em `client/public/assets/ui/items/` (com matrizes `256×256` RGBA em `Docs/Art/UI/Items/`), que estão prontos para **reuso imediato (`decision: "reusar"`)**, mas ainda não são exibidos pelo cliente Web porque `getItemEmoji` em [`client/src/main.ts`](file:///e:/MagicForge_Universe/client/src/main.ts#L569-L598) renderiza emojis:

1. `fragmento_runico_ancestral.png` -> item `fragmento_runico_ancestral`
2. `pedra_forja_comum.png` -> item de refino comum
3. `pedra_forja_rara.png` -> item de refino raro
4. `pedra_forja_mistica.png` -> item de refino místico
5. `gema_rubi_forca.png` -> item `gem_ruby_1`
6. `gema_safira_mana.png` -> item `gem_sapphire_1`
7. `gema_esmeralda_agilidade.png` -> item `gem_emerald_1`
8. `gema_topazio_vitalidade.png` -> item `gem_topaz_1`

---

## 4. Limitações Encontradas e Decisões Pendentes para o Agente Principal (Codex)

1. **Fallback de cota HTTP 429 no 12º ícone (`shield_iron_buckler.png`)**:
   - Os 11 primeiros ícones foram gerados pelo modelo de imagem de IA e pós-processados para PNG RGBA `512×512` transparente. Na 12ª geração (`shield_iron_buckler`), o serviço de imagem retornou erro `HTTP 429 (quota exhausted)`.
   - Para não entregar lote incompleto nem fingir geração por IA, `rascunhos/shield_iron_buckler.png` foi renderizado proceduralmente via script C# `System.Drawing` em `512×512` RGBA transparente com sombreado metálico 3/4, umbo central e rebites de bronze, e marcado explicitamente no manifesto com `"artStatus": "rascunho_procedural_cota_429_revisar"` junto ao prompt final em inglês para regeneração pictórica assim que a cota resetar.
2. **Aprovação para integração de assets e ligação no DOM do cliente**:
   - Quando o usuário e o Codex aprovarem os rascunhos de `Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/`, o agente principal poderá copiá-los para `client/public/assets/ui/items/` e trocar a renderização textual de emoji (`getItemEmoji`) por `<img src="..." />` com fallback gracioso nos 7 pontos de UI mapeados em `manifesto_itens.json` (`clientRenderingAudit`).
3. **Ativação de fontes de drop para itens existentes sem drop ativo**:
   - Conforme detalhado em [`nota_divergencias_corrigidas.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Itens_Arte_2026-11-06/nota_divergencias_corrigidas.md), `shield_iron_buckler`, `staff_apprentice`, `mace_cleric_dawn`, `staff_monk_ash`, `focus_pact_initiate`, `robe_mystic_threads` e `armor_titan_plate` existem em `shared/src/items.ts`, mas não possuem entrada em `rollLoot()` de `Monster.ts` nem em `DungeonManager.ts`. Recomenda-se incluir as armas/escudo Nv 1 na tabela de drop de monstros comuns para destravar o farm legítimo das receitas `v1`.

