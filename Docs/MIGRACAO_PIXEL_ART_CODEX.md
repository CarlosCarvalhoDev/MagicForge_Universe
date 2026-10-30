# Migração para pixel art — 28/10/2026

O usuário decidiu substituir a direção visual anterior, incluindo personagens, monstros, mapas, pedras e demais elementos. Isso substitui a prioridade de produzir novas direções da arte isométrica HD. As aprovações antigas ficam como histórico. A migração visual está autorizada; não implica apagar arquivos antigos, banco ou mudanças dos colaboradores, nem comprar produtos.

## Etapa atual

**Primeira versão visual do Mundo 2 entregue (30/10/2026):** neve/gelo, quatro assets nativos nevados, portal pixel condicionado ao evento autoritativo, ícones da HUD e seletor de biomas na prévia. Build e 34/34 testes cliente passaram. Troca visual 2→1→2 no treino preservou HP/contagem; QA WebSocket com esta nova arte ainda pendente. Monstros/Frostbite próprios continuam pendentes. Retomar por [BIOMA_JOTUNHEIM_VISUAL_2026-10-30.md](./BIOMA_JOTUNHEIM_VISUAL_2026-10-30.md).

**Conferência do novo handoff de preservação (30/10/2026):** servidor 8/8 e cliente 30/30 repetidos pelo Codex. Teste 8 preserva dados no portal e recria World usando o mesmo SQLite em memória; reabertura de arquivo após encerramento ainda não comprovada. Solicitadas comparações explícitas de farm/mochila expandida, preparação válida do loadout e testes de dois jogadores em mundos diferentes. Ver o retorno oficial no [HANDOFF_MUNDO2_PRESERVACAO_ANTIGRAVITY_2026-10-30.md](./HANDOFF_MUNDO2_PRESERVACAO_ANTIGRAVITY_2026-10-30.md). Codex segue com o bioma de gelo; sem alteração de produto nesta conferência.

**Retomada de 30/10/2026:** revisão das 12 opções do Guerreiro e conjurações no cliente conectado concluídas nesta rodada; 12 IDs únicos confirmados, prévias sem alterar HP/progresso, build e 30 testes cliente passaram. Corte V2 básico preservado; técnicas de contato diferenciadas. Ver [REVISAO_VFX_GUERREIRO_2026-10-30.md](./REVISAO_VFX_GUERREIRO_2026-10-30.md). O bug de respawn do Grimgor já foi corrigido/retestado; registros de bloqueios e contagens anteriores abaixo são históricos. Próxima implementação Codex: bioma de gelo do Mundo 2, depois portal e identidades visuais próprias. Antigravity recebe [handoff de preservação](./HANDOFF_MUNDO2_PRESERVACAO_ANTIGRAVITY_2026-10-30.md). Não declarar persistência integral após reinício validada até essa entrega.

**Correção do handoff confirmada:** lida a resposta do Antigravity e repetida a suíte: **servidor 6/6**, removendo o bloqueio anterior de stun. Cliente agora distingue damageSource para não animar cortes em sangramento/reflexão e exibe absorção de escudo enviada pelo servidor. Build e **27 testes cliente** passaram. Corte V2 permanece aprovado provisoriamente. Próximo passo é QA conectado da primeira fase, ainda não validado ponta a ponta. Relatório atualizado: [RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md](./RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md). Registros 5/6 abaixo são históricos.

**Aceite mais recente:** usuário aprovou o corte V2 provisoriamente (“esta bom esse corte por enquanto”). Preservar a versão atual e os demais VFX aceitos. Próxima pendência: correção/retorno do Antigravity sobre stun e posterior validação conectada. Nesta atualização foram alterados apenas registros documentais; sem testes de produto necessários, sem commit, branch `master`.

**Handoff autoritativo integrado no cliente:** castId, targetResults, rejeições, geometrias e lifecycle dos sete status conectados. Corte V2 candidato, sem alterar demais efeitos aprovados. Cliente: build e 26 testes passaram. **Servidor repetido: 5/6, falha de stun em warrior-phase1.test.ts:395 (790 !== 840).** Não liberar a fase como validada. Repassar [RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md](./RETORNO_HANDOFF_GUERREIRO_STATUS_2026-10-28.md) ao Antigravity; nenhuma edição Codex em servidor/shared/rede/banco. Multiplayer ponta a ponta ainda pendente.

**VFX inicial integrado:** [INTEGRACAO_VFX_GUERREIRO_2026-10-28.md](./INTEGRACAO_VFX_GUERREIRO_2026-10-28.md). Quatro skills padrão ligadas ao evento existente; impacto/level up e prévias de seis efeitos na arena. Dois PNGs nativos de VFX + primitivas Canvas. Build e 21 testes passaram; seis prévias sem alterar HP/atributos. Status persistentes, demais escolhas e verificação multiplayer aguardam contrato do Antigravity. Não interpretar prévia de escudo como Baluarte autoritativo já concluído.

**Handoff de Guerreiro/skills preparado:** repassar [PROMPT_ANTIGRAVITY_FASE1_GUERREIRO_PIXEL.md](./PROMPT_ANTIGRAVITY_FASE1_GUERREIRO_PIXEL.md). Fonte atual tem 12 skills únicas + quatro aliases, snapshot deduplicado exportado/validado. Há ícones legados, mas zero arquivos com os 12 IDs exatos pedidos pela UI. `pixel-magic-effects.zip` acrescentado aos imports (15 folhas de efeitos; dez ícones individuais + atlas; inventário detalhado). Cooked FX encontrado online para cortes/cura/escudo, porém download não obtido (HTTP 429); não inventar assets locais. Backend/shared/rede continuam com Antigravity; Codex conecta player de VFX após contrato real. Nesta rodada: apenas docs, snapshot e imports; nenhum código de produto/banco modificado. Catálogo de dez ZIPs validado. Branch `master`, sem commit.

**Primeira arena entregue:** [PRIMEIRA_ARENA_PIXEL_2026-10-28.md](./PRIMEIRA_ARENA_PIXEL_2026-10-28.md). `pixel-arena.html` oferece treino local jogável; `GameRenderer` principal já consome a apresentação pixel por padrão sem alterar autoridade da rede. 22 PNGs nativos em uso, 15 folhas direcionais de 64 px. Outras classes, chefes, biomas, login/HUD completos e Unity ainda pendentes. Autenticação/main e trabalho paralelo preservados. Retomar por este relatório, em vez da antiga instrução de iniciar a primeira arena.

**Aquisição concluída neste lote:** nove ZIPs, total de 39.422.594 bytes, em `Imports/CraftPix/`: espadachim níveis 1–3, rocks/stones, slime mobs, trees, paths/roads, orc, dungeon, crystals e basic UI. `Inventory-CraftPixImports.ps1` passou nos nove arquivos, registrando SHA256, entradas e dimensões legíveis de PNGs e rejeitando caminhos absolutos/traversal. Nenhum conteúdo executado. ZIPs ignorados pelo Git local desta pasta; catálogo e README disponíveis para continuidade. A auditoria não certifica cobertura do jogo, estética ou animação.

O espadachim inclui variantes com/sem sombra e fontes Aseprite. Medidas observadas do nível 1 sem sombra: Walk 384×256, Idle 768×256, Attack 512×256, Hurt 320×256, Death 448×256. A contagem e ordem de quadros/direções ainda precisam ser confirmadas no conteúdo antes de importar; dimensões sozinhas não bastam. Arqueiro e Mago dessa linha aparecem como produtos premium no catálogo consultado; não adquiridos e não substituir por espadachim silenciosamente.

**Entrega desta rodada:** apenas downloads/imports isolados, script de inventário, este plano e atualização do ponto de retomada em `PADRAO_FRENTE_VISUAL_CODEX.md`. Nenhum asset ativo, código de gameplay ou banco alterado. `git diff --check` do plano passou; `git check-ignore` confirmou exclusão dos ZIPs. Build e Unity não se aplicam a esta etapa. Próximo trabalho concreto: extrair os PNGs necessários, mapear as grades reais e montar a primeira arena top-down, verificando posse do renderer antes de editar.

Aquisição de pacotes gratuitos da coleção RPG top-down CraftPix pela sessão autenticada no navegador integrado. ZIPs guardados em `Imports/CraftPix/`, separados de assets ativos. A requisição direta do terminal ao arquivo devolveu HTTP 403; o download normal no navegador funcionou. Não copiar cookies, senha ou tokens para scripts/documentação.

Antes de integrar, inventariar dimensões reais, direções, ações, pivôs e diferenças entre variantes; não impor células de 512 px. Usar resolução nativa, escala inteira quando possível e filtragem adequada a pixel art. Não espelhar um único desenho para fingir direções que o pacote não fornece.

## Sequência

1. Baixar e validar ZIPs, registrar origem, SHA256, licença e catálogo de arquivos.
2. Conferir coerência visual e cobertura das sete classes, monstros, chefes, biomas, ícones e UI. Não confundir três evoluções do espadachim com três classes diferentes. Não substituir uma classe por outra sem indicar a lacuna.
3. Integrar uma arena Web completa com o pacote escolhido: chão, objetos, personagem e monstros, respeitando estados autoritativos existentes. Preservar arte antiga e referências para reversão.
4. Ampliar cobertura e adaptar UI/ícones; integrar Unity separadamente, mantendo GUIDs existentes. Validar browser e Play Mode conforme ferramentas disponíveis.

Os arquivos `main.ts`, `AuthSelection.ts`, CSS de autenticação, rede, shared e servidor apresentaram mudanças locais recentes durante esta aquisição; não editar durante trabalho de outro agente. Nesta etapa, trabalhar somente na nova pasta de imports e documentação da migração. Reconfirmar posse/status antes de integração.

## Licença e limites

Fonte oficial: https://craftpix.net/file-licenses/ (seção Freebie Products). Permite uso e modificação em jogos pessoais/comerciais e distribuição do jogo; crédito não é obrigatório. Não permite revender ou redistribuir os arquivos como biblioteca de arte. Não publicar os ZIPs/fontes em repositório público. A cláusula de IA proíbe usar os recursos para treinamento, ajuste, desenvolvimento, teste, validação ou melhoria de sistemas de IA; não enviar os assets a geração/edição por IA. Nesta frente, usar importação técnica convencional, sem imagegen.

Compras, assinatura e pacotes premium não autorizados. Disponibilidade de classes e biomas completos gratuitos ainda será confirmada. Não prometer migração completa antes de verificar cobertura e integração.

Branch: `master`, worktree original, sem commit. Build/Unity não executados nesta aquisição porque assets ativos e código não foram alterados.

## Validação conectada do Guerreiro — 2026-10-28

Codex verificou o cliente real via WebSocket e servidor real com SQLite em memória: autenticação Guest, seleção, skills nos níveis preparados 1/10/25/50, rejeição sem custo, derrota/revanche, portal e reconexão. Testes: cliente 28/28, servidor 6/6, build do cliente passou. Corrigido eco duplicado de rejeição no chat.

**Bloqueador aberto para Antigravity:** Grimgor respawna após vitória e concede recompensas repetidas; permanece após portal ao Mundo 2. Não considerar a Fase 1 concluída. Corrigir ciclo de vida/recompensa única/limpeza de entidades no servidor e repetir esse fluxo. Nenhum arquivo do servidor foi editado pelo Codex nesta validação.

Relatório, reprodução, arquivos e limites: `Docs/VALIDACAO_TECNICA_GUERREIRO_2026-10-28.md`. Evidências: `Docs/QA_GUERREIRO_LIVE_2026-10-28.jsonl`. Níveis e cenários preparados não certificam balanceamento nem progressão natural.

### Reteste conectado do boss — correção confirmada

Após o handoff do Antigravity, Codex repetiu desafio real de Grimgor no cliente principal com servidor/SQLite em memória: um evento de vitória, zero monstros, ouro e inventário estáveis por 32 segundos. Portal levou ao Mundo 2, contendo somente IDs mob_w2_* e nenhum Grimgor. Teste servidor 7/7 passou aqui. Bloqueador anterior de respawn/recompensa repetida encerrado no cenário reproduzido. Relatório atualizado em Docs/VALIDACAO_TECNICA_GUERREIRO_2026-10-28.md; evidência nova em Docs/QA_GUERREIRO_BOSS_RETEST_2026-10-28.jsonl. Sem mudança de código de produto nesta rodada. Arte de bioma do Mundo 2 ainda pendente (cenário reutiliza floresta); demais limites de validação permanecem no relatório.
