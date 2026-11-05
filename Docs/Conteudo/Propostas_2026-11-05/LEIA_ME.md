# LEIA-ME — Entrega de Conteúdo, Catálogo, Receitas de Fusão e Direção de Ícones (2026-11-05)

> **Escopo da Entrega:** Proposta técnica revisável e auditada de cobertura de equipamentos, receitas de fusão (`v2`) e manifesto/prompts dos 84 ícones de habilidades de **MagicForge: Universe**.
> **Isolamento de Escopo (`AGENTS.md`):** Nenhum arquivo de código (`shared/`, `server/`, `client/`), banco SQLite, cena/prefab/`.meta` do Unity ou asset em produção foi alterado. Todo o trabalho foi produzido exclusivamente sob `Docs/Conteudo/Propostas_2026-11-05/`.

---

## 1. Arquivos Criados Nesta Entrega

| Arquivo | Finalidade | Resumo do Conteúdo |
|---|---|---|
| [`01_MATRIZ_LACUNAS.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/01_MATRIZ_LACUNAS.md) | Diagnóstico e Matriz de Lacunas | Auditoria completa dos 42 itens atuais (`shared/src/items.ts`), matriz 7 classes × 6 slots × 5 patamares (Lv 1, 5, 15, 25, 45), fontes reais de drop (`Monster.ts` e `DungeonManager.ts`) e registro formal de **7 divergências entre documentos antigos e o código atual**. |
| [`02_CATALOGO_PROPOSTO.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/02_CATALOGO_PROPOSTO.md) | Catálogo Completo (Existentes + Propostos) | Tabela padronizada com 17 colunas preservando integralmente os **42 itens existentes** e propondo **47 novos itens** (`snake_case`, marcados como **não calibrados**), separando atributos suportados hoje (`statsBonus`) da coluna `dependências`. |
| [`02_CATALOGO_PROPOSTO.json`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/02_CATALOGO_PROPOSTO.json) | Espelho Estruturado em JSON | Versão legível por máquina de `02_CATALOGO_PROPOSTO.md` (89 registros: 42 `existente` + 47 `proposto`) pronta para importação seletiva por script pelo agente principal. |
| [`03_RECEITAS_PROPOSTAS.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/03_RECEITAS_PROPOSTAS.md) | Receitas de Fusão (`v1` preservadas + `v2` propostas) | Preserva as 8 receitas `v1` de `shared/src/equipment-fusion.ts`, propõe **12 receitas `v2` de início/meio de progressão** (Níveis 5 e 15) e **7 receitas `v2` de transição Épica** (Nível 25 em bloco separado), regras de segurança de instância (`itemInstanceId`) e **6 cenários de benchmark** para calibração. |
| [`04_MANIFESTO_ICONES.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/04_MANIFESTO_ICONES.md) | Manifesto Completo de 84 Ícones | Tabela dos 84 `skillId` canônicos com dimensão real verificada (`512x512`), hash SHA-256 de 64 caracteres dos 28 PNGs únicos existentes, decisão (`12 reusar` / `12 revisar` / `60 gerar`), diagnóstico de desalinhamentos semânticos e defeitos de moldura/watermark. |
| [`05_PROMPTS_ICONES.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/05_PROMPTS_ICONES.md) | Prompts de Geração em Inglês | Todos os 84 prompts em inglês no template oficial da Seção 5, organizados por classe (`GUERREIRO` a `CLERIGO`) e patamar (`1/10/25/50`), mais diretrizes de prompts para ícones de equipamentos. |
| [`LEIA_ME.md`](file:///e:/MagicForge_Universe/Docs/Conteudo/Propostas_2026-11-05/LEIA_ME.md) | Sumário Executivo e Guia de Integração | Este documento: validações executadas, limitações, decisões pendentes e roteiro de integração em pequenos lotes. |

---

## 2. Validações Realmente Executadas

1. **Inspeção Direta do Código-Fonte Autoritativo:**
   - Leitura integral de [`shared/src/entities.ts`](file:///e:/MagicForge_Universe/shared/src/entities.ts), [`shared/src/skills.ts`](file:///e:/MagicForge_Universe/shared/src/skills.ts) (84 skills, 12 por classe, slots 1/10/25/50), [`shared/src/items.ts`](file:///e:/MagicForge_Universe/shared/src/items.ts) (42 itens), [`shared/src/equipment-fusion.ts`](file:///e:/MagicForge_Universe/shared/src/equipment-fusion.ts) (8 receitas `v1`), [`server/src/entities/Monster.ts`](file:///e:/MagicForge_Universe/server/src/entities/Monster.ts), [`server/src/game/DungeonManager.ts`](file:///e:/MagicForge_Universe/server/src/game/DungeonManager.ts) e [`server/src/database/DatabaseManager.ts`](file:///e:/MagicForge_Universe/server/src/database/DatabaseManager.ts).
2. **Verificação Técnica de Dimensões e SHA-256 dos Ícones Existentes:**
   - Leitura binária do cabeçalho PNG (`IHDR`) e cálculo de hash SHA-256 em todos os **68 arquivos `.png`** presentes em `client/public/assets/skills/`.
   - Confirmado que todos os 68 arquivos possuem exatamente **`512x512` pixels** e se agrupam em **28 imagens únicas** (28 pares `<NN>_<slug>.png` ≡ `<classe>_<1..4>.png`, além de 12 cópias em IDs canônicos `*_base` e `*_nv1_1`).
3. **Inspeção Visual Direta das 28 Imagens Únicas:**
   - Todas as 28 imagens únicas (`01_...` a `28_...`) foram abertas e inspecionadas visualmente para confrontar o desenho real com o efeito da habilidade em `shared/src/skills.ts` e verificar a integridade da moldura dourada 1:1.
   - Isso permitiu detectar:
     - **6 ícones mapeados em slots errados** cujas artes servem perfeitamente para outras habilidades da mesma classe (`06` -> `clerigo_nv2_2`, `11` -> `mago_nv3_1`, `14` -> `arqueiro_nv1_3`, `21` -> `monge_nv1_1`, `22` -> `monge_nv1_3`, `28` -> `bruxo_nv3_2`).
     - **Defeitos técnicos de moldura/corte** em `03` (canto superior direito dobrado), `21–24` (borda de segunda moldura invadindo o rodapé do canvas) e `25–28` (borda dourada superior decepada).
     - **Marca d'água branca** (varinha/cursor) no canto inferior direito de `28_bruxo_invocacao_do_abismo.png` (`bruxo_4.png`).
4. **Verificação de Zero Colisão de IDs:**
   - Todos os 47 `itemId` propostos em `02_CATALOGO_PROPOSTO.*` e os 19 `recipeId` propostos em `03_RECEITAS_PROPOSTAS.md` foram verificados contra `shared/src/items.ts` e `shared/src/equipment-fusion.ts`, garantindo zero colisão e preservação de 100% dos contratos atuais.

---

## 3. Limitações Declaradas

- **Nenhuma imagem nova foi gerada nesta sessão:** Conforme a regra 1.5 do prompt de delegação, não houve geração ou gravação de novos PNGs finais em `client/public/assets/` ou `MagicForgeClient/Assets/`; foram entregues o manifesto auditado (`04_MANIFESTO_ICONES.md`) e os 84 prompts prontos (`05_PROMPTS_ICONES.md`).
- **Valores numéricos propostos não estão calibrados em execução:** Todos os bônus de atributos, preços de venda (`sellPrice`) e custos de fusão dos itens/receitas `v2` estão explicitamente rotulados como **`proposto — não calibrado`** e dependem da bateria de simulação descrita na Seção 6 de `03_RECEITAS_PROPOSTAS.md`.
- **Limites das evidências econômicas atuais:** O relatório [`Docs/ENTREGA_ECONOMIA_2026-11-04.md`](file:///e:/MagicForge_Universe/Docs/ENTREGA_ECONOMIA_2026-11-04.md) cobre janelas de 30 minutos nos níveis iniciais (~Lv 7–8) para 3 classes (`GUERREIRO`, `MAGO`, `ARQUEIRO`). Estimativas para Nível 15 e Nível 25 são apresentadas como intervalos condicionais e requerem validação em simulação estendida.
- **Nenhum teste automatizado ou build foi alterado/executado sobre código novo:** Como nenhum arquivo `.ts`, `.js` ou `.cs` foi modificado, o comportamento em execução do servidor e do cliente permanece idêntico ao estado deixado pelo agente principal.

---

## 4. Decisões que Dependem da Equipe e do Agente Principal (Codex)

### Decisão 1 — Realocação Semântica Imediata de 6 Ícones Existentes
Desejam aplicar já no próximo lote do cliente/shared a realocação das artes existentes que estavam no slot errado?
- `06_clerigo_arma_espiritual.png` -> usar em **`clerigo_nv2_2`** (*Arma Espiritual Flutuante*) em vez de `clerigo_nv1_1` (*Palavra de Cura*).
- `11_mago_bola_de_fogo.png` -> usar em **`mago_nv3_1`** (*Bola de Fogo Apocalíptica*) em vez de `mago_nv2_1` (*Nevasca Glacial*).
- `14_arqueiro_flecha_espinhosa_enredante.png` -> usar em **`arqueiro_nv1_3`** (*Armadilha de Espinhos*) em vez de `arqueiro_nv1_1` (*Marca do Caçador*).
- `21_monge_punho_de_ki.png` -> usar em **`monge_nv1_1`** (*Rajada de Golpes*) em vez de `monge_base` (*Punho de Ki*).
- `22_monge_rajada_de_golpes.png` -> usar em **`monge_nv1_3`** (*Cura do Lótus Celestial*) em vez de `monge_nv1_1`.
- `28_bruxo_invocacao_do_abismo.png` -> após remover a watermark no canto inferior direito, usar em **`bruxo_nv3_2`** (*Invocar Lorde Demônio Maior*) em vez de `bruxo_nv3_1` (*Singularidade do Vazio*).

### Decisão 2 — Prioridade de Lotes do Catálogo (`02_CATALOGO_PROPOSTO`)
Recomendamos integrar o catálogo e as receitas em **3 lotes pequenos e independentes**:
1. **Lote 1 (Destravamento de Classes Lv 1–15):**
   - Adicionar os itens iniciais/incomuns/raros de **Clérigo (SAB)**, **Bruxo (CAR)** e **Monge (DES+SAB)** (`simbolo_sagrado_1`, `foco_novico_4`, `martelo_solar_15`, `orbe_pacto_1`, `orbe_pacto_4`, `cetro_abissal_15`, `faixas_ki_1`, `manopla_ki_4`, `bastao_jade_15`, mais túnicas/mantos/botas/elmos Lv 5–15).
   - Adicionar as **4 receitas `v2` de Nível 5** (`fusao_foco_novico_4`, `fusao_orbe_pacto_4`, `fusao_manopla_ki_4`, `fusao_tunica_novico_5`) e distribuir seus ingredientes nas loot tables de `Monster.ts`.
2. **Lote 2 (Progressão Rara Lv 15 e `carta_fusao_2`):**
   - Adicionar `carta_fusao_2` no drop de chefes de masmorra intermediários (`DungeonManager.ts`) e ativar as **8 receitas `v2` de Nível 15**.
   - Rodar os **Cenários de Benchmark 1, 2, 3 e 6** de `03_RECEITAS_PROPOSTAS.md`.
3. **Lote 3 (Patamar Épico Lv 25 e Lendário Lv 45):**
   - Integrar os itens épicos Lv 25 e lendários Lv 45 após calibrar a curva de poder contra as masmorras de nível 25–50.
   - Avaliar no motor (`server/src/entities/Player.ts`) se alguma passiva descrita na coluna `dependências` (ex.: recarga de Ki/Mana ou potência de cura) será implementada em fase futura.

