# Revisão do benchmark TopIdle — Codex

Data: 03/11/2026. Revisão da árvore em `master`, HEAD `c28ffaa`, incluindo o benchmark introduzido por `309fa73`.
Escopo: documento, JSONs, seis capturas selecionadas, documentos relacionados e comparação estática com código. Não houve sessão autenticada nos jogos nem execução dos snippets como módulos integrados.

## Parecer

O material é útil como levantamento de referências de produto, interface e automação. Ainda não sustenta o rótulo de engenharia reversa comprovada de economia, fórmulas ou arquitetura dos jogos. Pode orientar perguntas e protótipos; não deve ser aplicado diretamente como especificação validada ou implementação pronta.

A entrega versionada contém Markdown, dois JSONs de conteúdo de páginas e capturas. Não encontrei nessa entrega relatórios técnicos do REA com versão da ferramenta, comandos, localização de funções extraídas, tabelas originais de balanceamento ou séries de medições. Isso limita o que podemos confirmar; não demonstra que o colaborador deixou de usar a ferramenta fora do material entregue.

O benchmark original foi preservado. Esta revisão é o único arquivo criado neste turno.

## 1. Achados que bloqueiam adoção direta

| Prioridade | Local no benchmark | Achado | Encaminhamento |
| --- | --- | --- | --- |
| Alta | Linhas 271, 321 e 365 | Afirma que protocolo foi expandido, migrações aplicadas e módulos são funcionais. Os símbolos e tabelas propostos não aparecem nas fontes atuais pesquisadas | Reclassificar esses trechos como proposta não integrada |
| Alta | Seção 6.1 | Substitui offline existente por outro cálculo, usa `updated_at/created_at` em vez de `last_logout`, muda mínimo de 300s para 60s e acrescenta cartas/desmonte | Preservar contrato atual; qualquer substituição exige especificação de migração, resgate e persistência |
| Alta | Seção 6.2, linha 491 | `(seed >> 3) % tamanho` pode produzir índice negativo. Para `2026-11-03`, reproduzi seed `4092109761` e índice `-1`; acessar `b.id` falharia nesse exemplo | Corrigir e validar antes de qualquer integração. O snippet está no documento, não no runtime |
| Alta | Seção 4.2 | Tabela de pull não corresponde à fórmula e ao intervalo declarado de beta | Descartar os números como balanceamento comprovado e reconstruir com medições |
| Média | Seção 4.5 | `1 + ln(k)` é crescente sem limite, não uma curva que converge para um teto. O bônus atual também não usa essa fórmula | Definir se o objetivo é retorno marginal decrescente ou limite absoluto; são decisões diferentes |
| Média | Seção 6.1, linhas 412–422 | Poisson é truncada em cinco cartas e toda carta usa um ID fixo, sem relação com a criatura caçada; `card_lobo_jotunheim` não foi localizado no catálogo atual | Usar tabelas reais de conteúdo e definir distribuição, limites e elegibilidade |
| Média | Seções 4.3 e 6.1 | Texto usa EXP do monstro/tempo de kill, mas snippet usa uma nova soma de fase e nível. O fator 80%, kill de 6s e chance 0,05% não têm derivação documentada | Tratar como parâmetros propostos e medir rendimento real |

Detalhe da inconsistência de pull: para beta entre 0,15 e 0,35, `k * (1 + beta * (k - 1))` produz entre 3,9 e 5,1 para três alvos, e entre 8 e 12 para cinco. A tabela mostra 2,6 e 4,2. Além disso, a expressão apresentada como EXP/h não explicita a conversão temporal; a probabilidade de pelo menos uma morte por hora não substitui a medição de tempo e recursos perdidos por mortes. Dano, armadura e cura precisam de unidades e regras de mitigação consistentes.

O sorteio offline proposto é estocástico. Chamar toda a recompensa de determinística exige explicitar semente ou persistência do resultado, além de regras de resgate idempotente. O snippet isolado calcula um resumo; não implementa a transação de resgate.

## 2. O que as evidências realmente demonstram

| Referência | Suporte encontrado | Limitação |
| --- | --- | --- |
| OT Idle | JSON registra abas de caçada, regras e pull; captura `ot_idle_como_funciona.png` mostra demonstração marcada como exemplo e anúncio de 12h offline | Não são medições de uma conta jogando. A página oficial consultada nesta revisão condiciona as 12h ao premium |
| Lootera | Landing page mostra party, resumo de ausência e descrição de stance; captura de entrada anuncia relatórios de XP, loot, supplies e mortes, além de criatura/boss boosted | Conteúdo público de apresentação não demonstra algoritmo, controle de quatro heróis por uma conta ou multiplicadores de drops |
| Ravox | JSON, captura e página oficial sustentam casts, ranking e sistemas de progressão | `ravox_ingame_live_spectator.png` mostra a lista de casts, não a sessão do espectador. Contadores não comprovam retenção, receita ou base de usuários independentes |
| RagnaIdle | Landing anuncia party, cartas MVP, Torre e progresso offline | `ragnaidle_gameplay_or_login.png` é página não encontrada. Não comprova funcionamento interno, periodicidade diária da Torre ou bônus das cartas |
| Gacha Heroes | JSON registra roleta, craft e sacrifício na página | Não estabelece regras de giros, probabilidades ou conversão dos itens |

Ravox e Gacha Heroes apresentam estrutura e vocabulário muito semelhantes nos JSONs. Isso merece investigação antes de contar as duas referências como validações independentes de uma mecânica; não prova que compartilhem código ou proprietário.

Os JSONs são inventários de títulos, cabeçalhos, botões e textos, não extrações de fórmulas. Não registram versão/build dos jogos nem metadados suficientes para reproduzir toda a coleta. Links `file:///c:/Users/...` do benchmark dependem da máquina do autor; os arquivos existem neste checkout, mas as referências devem futuramente usar caminhos relativos no repositório.

Fontes públicas consultadas em 03/11/2026:

- OT Idle: https://playotidle.com/ — regras condicionais, pull e offline premium de até 12h.
- Ravox: https://ravoxidle.com.br/ — casts, progressão de magias, craft/tier, coleção, mercado e party.
- Lootera não foi acessível pela ferramenta web; RagnaIdle não retornou texto legível. Para ambos, a revisão se limita às evidências locais.

## 3. Cruzamento com o resto do MagicForge

| Fonte real | O que acrescenta ao diagnóstico |
| --- | --- |
| `shared/src/entities.ts`, função de requisito de EXP | Curva muda de `250 * nível^1.75` para `250 * nível^2.3` no nível 10. Medir o salto de custo nessa fronteira junto dos desbloqueios de habilidades |
| `shared/src/skills.ts` e `Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md` | Já há dados de habilidades e intenção de alternativas por slot. Estudar builds existentes antes de acrescentar outra camada de stances |
| `shared/src/items.ts`, `CARDS_DATABASE` | Catálogo de itens e cartas está neste arquivo; usar seus IDs em qualquer proposta |
| `server/src/entities/Player.ts`, `recalculateStatsFromEquipment` | Cartas dão bônus por entrada e multiplicador 2 quando equipadas; o cálculo lido não aplica `ln(count)` |
| `server/src/database/DatabaseManager.ts`, `character_cards` | Coleção vinculada a `character_id`, não comprova bônus compartilhado por toda a conta como afirma o benchmark |
| `server/src/game/World.ts`, `handleAutoSalvage` e auto-venda ao coletar | A operação nomeada salvage atualmente vende por ouro. Não gera o pó arcano pressuposto no benchmark |
| `server/src/game/World.ts`, `refinePlayerEquipment` | Custos por faixas: 500, 2.500, 15.000, 75.000 e 300.000; chances 100%, 85%, 60%, 40% e 20%. Não usa a fórmula exponencial apresentada no benchmark |
| `server/src/game/PartyManager.ts`, `distributePartyExp` | O bônus aumenta o total de EXP antes da divisão entre membros próximos. Não significa +10% pessoal mantendo toda a EXP por abate |
| `server/src/game/DungeonManager.ts` e `Docs/SISTEMA_MASMORRAS_DIARIAS_E_BOSS_RUSH.md` | Já existe estrutura de sessões de masmorra e consumo de tickets; distinguir implementação solo existente de cooperação planejada antes de abrir outra frente |
| `Docs/ROADMAP_MECANICAS_IDLE_RPG.md` e `Docs/ARQUITETURA_MESTRE_IDLE_MMORPG_ECONOMIA_LORE.md` | Há planos e descrições com estados diferentes. O roadmap novo de quatro sprints do benchmark não deve substituir automaticamente o registro atual |

O problema principal de preparação é reconciliar regras e estados entre documentos e código. Quantidade de sistemas documentados não demonstra um ciclo econômico balanceado.

## 4. Direção recomendada

Prioridade sugerida para a próxima especificação, sem modificar o roadmap nesta revisão:

1. Inventariar custos e ganhos reais e medir farm por classe/build: XP, ouro, materiais, consumíveis, mortes e tempo de deslocamento. Produzir uma tabela para decidir onde farmar e quanto tempo leva cada melhoria.
2. Usar essa mesma base para explicar ao jogador rendimento e gargalo atual. Um relatório de caçada ajuda a avaliar decisões e fornece a base de comparação do offline.
3. Completar o ciclo farm → forja/skill → chefe → novo conteúdo com escolhas aproveitando loadouts e efeitos existentes. Fixar metas de tempo como hipóteses explícitas para playtest.
4. Avaliar pull e regras condicionais de farm como candidatos de maior afinidade com a proposta. Medir ganho e risco reais; não introduzir morte aleatória logística no combate só porque aparece no benchmark.
5. Avaliar boosted depois de existir utilidade dos materiais por mapa. Adiar casts até haver experiência de jogo e interesse em assistir; o material não demonstra aquisição viral sem custo.

Proposta de identidade para avaliar com o usuário: um herói por jogador, cooperação entre pessoas e preparação de builds/forja para desafios. Controlar uma equipe inteira por conta seria outra decisão de produto, não uma adaptação automática de uma landing page.

Não é necessário instalar REA para concluir este diagnóstico. Seu próximo uso deve responder uma lacuna concreta, como localizar uma tabela de custos autorizada ou confirmar uma regra de cliente, com evidências reproduzíveis. Para ritmo de progressão, sessões medidas ainda são necessárias.

## 5. Verificações e pendências

- Executados: `git status --short`, histórico e estatística do commit, buscas `rg`, leitura de fontes e JSONs, inspeção de seis PNGs e consulta de páginas oficiais.
- Executado `node -e` para reproduzir os intervalos da fórmula de pull, o índice negativo do boosted em 03/11/2026 e o crescimento de `1 + ln(k)`.
- Não executados: build, testes de gameplay ou integração dos snippets, pois somente este relatório foi criado. Não se afirma falha no jogo atual a partir de falhas nos exemplos do documento.
- Pendências: logs/artefatos do REA, sessões autenticadas autorizadas e medições de progressão para confirmar fórmulas e taxas. A ausência desses dados não impede aproveitar as referências visuais já coletadas.
- Branch/worktree: `master`, diretório principal. Preservados o benchmark, as evidências, o handoff já modificado e a base de estudo criada anteriormente. Nenhum commit, merge ou push realizado.
