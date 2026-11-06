# Proteção de itens e sugestões de equipamento — 04/11/2026

## Comportamento entregue

A mochila oferece **Proteger/Desproteger** no item selecionado e indica a trava na grade e no tooltip. A proteção é uma propriedade da instância persistida em `inventory.is_locked`; acompanha equipar, desequipar, trocar e reconectar. Em pilhas, protege todas as unidades da pilha, inclusive novas unidades adicionadas a ela.

A proteção impede venda individual, venda em lote, reciclagem, consumo de poções, consumo de materiais e uso da gema como ingrediente de engaste. Poções automáticas e atalhos consideram somente pilhas desbloqueadas; a UI de evolução e forja contabiliza materiais utilizáveis. Equipar manualmente e refinar o equipamento protegido continuam permitidos: a trava protege contra descarte/consumo, não impede melhorias na peça. Os ingredientes de uma futura fusão ainda deverão passar pela validação de propriedade, equipamento e proteção.

**Ver melhorias** consulta o servidor e mostra sugestões revisáveis. Considera classe, nível e atributos requeridos, bônus reais de refino/gemas, equipamento atual e escolhas protegidas. Uma peça só é sugerida se melhora algum bônus sem reduzir os demais. Se houver mais de uma opção incomparável, mantém uma opção válida e determinística por slot; não promete otimização global da build. Não usa raridade ou CP como critério suficiente. Candidato protegido e slot atualmente protegido ficam fora das sugestões.

A consulta não compra, troca ou consome itens. **Inspecionar** seleciona a peça para revisão; a troca depende do botão Equipar existente e da validação autoritativa. O tooltip lado a lado continua disponível. Mudanças de equipamento invalidam sugestões; alterações de nível, cartas e Reborn limpam a prévia. Atualizações de ouro ou materiais não apagam uma consulta válida. Autoequipar em lote e fusão não foram implementados nesta entrega.

## Persistência e contratos

- Migração aditiva: coluna `is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1))`, criada apenas quando ausente. Não recria nem exclui inventário.
- `C2S_SET_ITEM_LOCK` usa posição, identidade esperada e estado booleano desejado. Pedidos repetidos são idempotentes; o servidor rejeita alvo movido, identidade inválida ou estado não booleano. A atualização SQL exige o personagem proprietário da instância.
- `C2S_REQUEST_EQUIPMENT_ADVICE` e `S2C_EQUIPMENT_ADVICE` consultam itens e atributos reais no servidor. O cálculo dos bônus é compartilhado com a comparação da interface.
- Verificações de consumo também ocorrem no banco; desabilitar apenas o botão não é a proteção. A venda em lote usa uma transação, consulta a mochila persistida e só credita remoções efetivas.

## Arquivos deste bloco

- `shared/src/equipment-advice.ts`, `shared/src/index.ts`, `shared/src/messages.ts`, `shared/src/opcodes.ts`.
- `server/src/database/DatabaseManager.ts`, `server/src/game/World.ts`, `server/src/network/PacketHandler.ts`.
- `client/index.html`, `client/src/main.ts`, `client/src/network/ClientNetwork.ts`, `client/src/ui/EquipmentAdvice.ts`, `client/src/ui/InventoryView.ts`, `client/src/ui/InventoryTooltip.ts`, `client/src/ui/inventory-view.css`.
- `server/tests/equipment-protection.test.ts`, `client/tests/equipment-advice-ui.test.ts`, `client/tests/inventory-identity.test.ts`, `server/package.json`.
- `client/tests/equipment-advice-preview.html` e `.ts`: prévia isolada com DOM/CSS de produção e dados/transporte simulados, sem ações na conta real.
- `Docs/ROADMAP_MECANICAS_IDLE_RPG.md` e este relatório. O roadmap passa a distinguir proteção/sugestões entregues de fusão/autoequipar pendentes e corrige a referência antiga ao teto offline gratuito.

As alterações anteriores de expansão e resgate parcial continuam preservadas, ainda sem commit. O handoff antigo e o banco local não foram descartados.

## Testes e aplicação

- `npm run test:server`: **93/93**.
- `npm run test:inventory`: **22/22**, incluindo proteção, protocolos, consumo, troca, requisitos e descarte de sugestões antigas.
- `npm test`: **36/36**.
- `npm run build`: servidor e cliente aprovados; build final do cliente também aprovado. Permanecem os avisos anteriores wing-left/wing-right.
- Navegador com transporte simulado: Ver melhorias mostrou Montante Rúnico dos Titãs sobre Espada Larga Forjada, com +12 FOR, +10 CON e +65 de vida do item. Peça e gema protegidas ficaram fora das sugestões.
- Na mesma prévia, desproteger habilitou a reciclagem e invalidou a sugestão anterior; proteger novamente desabilitou a reciclagem. Nenhuma venda, reciclagem, troca ou alteração de trava foi executada na conta real.
- Desktop e 393×852 verificados; documento com 393 px de largura, sem transbordamento horizontal. Capturas em `scratch/evidence/equipment-protection-desktop.jpg` e `equipment-protection-mobile.jpg`. O HTML de teste está identificado como dados simulados.
- `git diff --check` nos diretórios de código sem erros de whitespace; não foi removida a alteração antiga do handoff.

Antes de religar o backend, foi confirmada ausência de jogadores conectados e salvo backup consistente em `scratch/runtime/before-equipment-protection-1793819934434.db`. Após inicializar a coluna, o hash dos registros de itens e do progresso (nível, EXP, ouro) permaneceu igual. **123 itens preservados**, gemas e cartas iguais ao backup, integridade SQLite `ok` e zero erros de chave estrangeira. Sem recuperação adicional ou reset de dados.

Servidor PID **35640**, `/health` online a 20Hz; Vite mantido. Estado em `scratch/runtime/services.json` e auditoria em `scratch/runtime/protection-deployment.json`, ambos locais/ignorados. Recarregar o cliente é necessário para os novos comandos e controles.

Branch `master`, workspace `E:/MagicForge_Universe`. Sem commit/push deste bloco. Falta validação dos controles na conta e no aparelho físico do usuário. Próxima etapa sugerida: fusão de duplicatas com receita e custos explícitos, usando esta proteção e sem consumir equipados/protegidos.
