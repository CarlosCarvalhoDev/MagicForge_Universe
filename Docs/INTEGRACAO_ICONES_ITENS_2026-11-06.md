# Ícones de itens integrados ao cliente Web

Entrega de 06/11/2026, branch `master`, pasta `E:/MagicForge_Universe`. Aplicação autorizada pelo usuário após a entrega do Antigravity. Sem commit/push deste bloco.

## Resultado

Os 12 PNGs da pasta `Docs/Conteudo/Itens_Arte_2026-11-06/rascunhos/` foram copiados, sem transformar as imagens, para `client/public/assets/ui/items/`. O mapeamento central em `client/src/ui/ItemIcon.ts` também reaproveita as oito imagens já existentes de pedras de forja, gemas e fragmento rúnico.

A mesma imagem de cada item aparece na mochila, no inspetor, no equipamento vestido, na comparação por mouse/foco/toque prolongado, nas sugestões de melhorias, no refino, nos soquetes e na prévia/ingredientes de fusão. As molduras e cores de raridade continuam sob responsabilidade do layout existente. Imagens são decorativas junto aos nomes, não capturam gestos e têm fallback para o símbolo do item se não houver arte ou se o carregamento falhar.

O escudo `shield_iron_buckler` usa o rascunho procedural entregue pelo Antigravity; sua substituição pictórica continua pendente. A aplicação dos ícones não ativa itens propostos, receitas novas, alterações de atributos ou drops. Nenhum asset ou GUID do Unity foi alterado.

## Arquivos

- Novo: `client/src/ui/ItemIcon.ts`.
- Alterados: `client/src/main.ts`, `client/src/ui/InventoryView.ts`, `InventoryTooltip.ts`, `EquipmentAdvice.ts`, `EquipmentFusion.ts` e `inventory-view.css`.
- Assets copiados: `sword_iron_broadsword.png`, `sword_runic_tempered.png`, `sword_runic_bastard.png`, `armor_chainmail.png`, `armor_runic_vigil.png`, `armor_titan_plate.png`, `shield_iron_buckler.png`, `relic_ancient_forge.png`, `potion_hp_minor.png`, `potion_mp_minor.png`, `ore_iron_arcane.png`, `arcane_dust.png`, em `client/public/assets/ui/items/`.
- Prévia isolada sem personagem real: `client/tests/item-icons-preview.html` e `client/tests/item-icons-preview.ts`.
- Stubs de DOM atualizados nos testes `client/tests/equipment-advice-ui.test.ts` e `client/tests/equipment-fusion-ui.test.ts`, acompanhando os elementos de imagem adicionados às telas.

## Verificação

- `npm run build --workspace=@magicforge/client`: passou. Permanecem avisos anteriores sobre `wing-left.svg` e `wing-right.svg`.
- `npm run test:inventory`: 22 testes passaram.
- `npm run test:fusion`: 30 testes passaram.
- `git -c core.whitespace=cr-at-eol diff --check -- client/src client/tests`: passou.
- Conferência visual em desktop e viewport de 393 × 852. Os 20 ícones da prévia carregaram; as duas imagens do tooltip de comparação carregaram com 40px e sem overflow horizontal da página.
- Evidências locais: `scratch/evidence/item-icons-desktop.png`, `item-icons-mobile.png` e `item-icons-mobile-tooltip.png`.

O frontend em execução serve os assets imediatamente. Para uma aba já aberta, atualizar a página recarrega a interface. Backend e banco dos personagens não precisaram ser reiniciados ou alterados. A prévia é apenas uma fixture de teste, sem conexão ao servidor de jogo.
