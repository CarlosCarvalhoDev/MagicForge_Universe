# Reforja Rúnica — fusão inicial de equipamentos

Entrega de 05/11/2026, branch `master`, workspace `E:/MagicForge_Universe`.

## Mecânica

A aba **Fusão**, na ficha/mochila existente, reúne duplicatas em uma peça nova da afinidade de classe. Preserva as molduras, fontes e navegação do colaborador. Não modifica os IDs nem os atributos dos equipamentos antigos.

O pacote inicial contém oito resultados raros de nível 5: Espada da Têmpera Rúnica (Guerreiro/Bárbaro), Arco do Guardião Rúnico (Arqueiro), Maça da Aurora Consagrada (Clérigo), Cajado do Foco Rúnico (Mago), Foco do Pacto Velado (Bruxo), Manoplas do Caminho Sereno (Monge), Cota da Vigília Rúnica (Guerreiro/Bárbaro/Clérigo) e Manto da Trama Rúnica (Mago/Bruxo).

Força, Destreza, Sabedoria, Inteligência e Carisma seguem as afinidades do projeto; o foco de pacto acrescenta Carisma preservando a Inteligência do cajado inicial. São equipamentos de fantasia autoral inspirados nos arquétipos de RPG, não implementação literal de regras de criação/itens mágicos de D&D de mesa.

Cada receita exige nível 5, **três cópias idênticas**, **1.800 ouro**, **6 Minérios de Ferro Arcano** e **8 Pós Arcanos** desbloqueados. As bases permitidas são os sete equipamentos iniciais listados em `FUSION_BASE_ITEMS`; misturar tipos, usar itens refinados, engastados, equipados ou protegidos é rejeitado. A fonte preferida de cada receita é usada quando há três exemplares; caso contrário, escolhe um grupo válido com mais cópias. A lista mostra exatamente quais posições serão consumidas. É possível proteger uma cópia para tirá-la da seleção.

A reforja extrai a base rúnica dos equipamentos e reconstitui o resultado da classe. Não depende de obter duplicatas de maças/cajados/mantos que hoje não aparecem nas tabelas de drops. Novos resultados não viram ingredientes dessa primeira etapa, evitando uma cadeia de reforja sem receitas próprias. O resultado nasce +0, sem gemas e **protegido**, na mochila. Pode ser equipado manualmente sem desproteger; não é equipado automaticamente.

Fluxo: escolher receita → conferir resultado, custos, cópias e comparação → Preparar fusão → confirmar consumo → inspecionar o resultado. Ganhos de ouro ou novos drops não substituem as identidades já revisadas. Ingredientes/requisitos invalidados exigem uma nova prévia. O atalho Ajustar auto-venda abre o Farm, pois vender automaticamente a raridade pode impedir juntar cópias.

## Persistência e segurança funcional

O servidor resolve receita, versão, classe, nível, dono, materiais e preço; campos extras do cliente não escolhem custo ou resultado. A operação usa `BEGIN IMMEDIATE` e os savepoints já existentes: consumir cópias e materiais, cobrar ouro, criar/proteger resultado e registrar recibo são uma única transação. Falhar após a criação do resultado reverte também esse item e o recibo. Mochila cheia não impede usar os espaços liberados pelas cópias.

A tabela aditiva `equipment_fusions` guarda um recibo por personagem/pedido e a assinatura de receita, versão e identidades consumidas. Repetir o pedido, inclusive após reabrir o SQLite, retorna o mesmo resultado sem nova cobrança. Reutilizar o ID para outros ingredientes/receita é rejeitado. Em timeout, a interface oferece Verificar resultado e reenvia o mesmo pedido; não cria uma nova operação silenciosamente. Desconexão pede reconectar e conferir a mochila.

## Calibração inicial

A primeira proposta exigia nível 10 e fontes específicas. A auditoria encontrou duas barreiras: nas trajetórias de meia hora o nível final era 9, e algumas fontes específicas nem tinham drops. Antes de ativar, o pacote foi ajustado para nível 5 e grupos de bases iniciais iguais.

Rodada final: oito trajetórias de 1.800 segundos, quatro classes e sementes 101/202, heróis novos, SQLite em memória, arma inicial equipada, 20 espaços, auto-venda desligada, sem compras, reciclagem, execução de fusão ou recompensa offline. Mede disponibilidade no saldo/estoque, não os benefícios acumulados de comprar.

| Classe | Primeira disponibilidade nas duas sementes |
| --- | --- |
| Guerreiro | 226–232s |
| Bárbaro | 236–238s |
| Arqueiro | 158–171s |
| Clérigo | 222–238s |

Reproduzir: `npm run benchmark:fusion -- 1800 ../scratch/runtime/fusion-benchmark-final.json`. Resumo versionável em `Docs/EVIDENCIAS_FUSAO_2026-11-05.json`; dados completos em `scratch/runtime/fusion-benchmark-final.json`. A bancada não lê nem concede recursos a contas reais.

Esses números não garantem o mesmo tempo ao comprar habilidades, manter auto-venda ligada ou receber recompensas offline. A simulação não mede fusões repetidas, efeitos contra chefes nem o equilíbrio completo de Mago/Bruxo/Monge. O catálogo extenso e as receitas seguintes ainda precisam de validação.

## Arquivos

- `shared/src/equipment-fusion.ts`, `shared/src/items.ts`, `shared/src/index.ts`, `shared/src/opcodes.ts`: receitas versionadas, bases, prévia, resultados e contratos.
- `server/src/database/DatabaseManager.ts`, `server/src/game/World.ts`, `server/src/network/PacketHandler.ts`: transação, recibo e execução autoritativa.
- `client/src/network/ClientNetwork.ts`, `client/src/main.ts`, `client/index.html`, `client/src/ui/EquipmentFusion.ts`, `client/src/ui/equipment-fusion.css`: aba, prévia, comparação, confirmação e retomada.
- `server/tests/equipment-fusion.test.ts`, `client/tests/equipment-fusion-ui.test.ts`: casos funcionais e falhas/repetições.
- `server/tools/ProgressionSimulation.ts`, `server/tools/benchmark-fusion.ts`, `package.json`, `server/package.json`: medição e comandos.
- `client/tests/equipment-fusion-preview.html` e `.ts`: DOM/CSS reais com transporte simulado, sem login ou operações na conta real.
- Este relatório, evidências JSON e atualização do roadmap.
- `Docs/PROMPT_IA_CATALOGO_E_ICONES_2026-11-05.md` e `Docs/AUDITORIA_ICONES_CLASSES_2026-11-05.md`: entregues pelo auxiliar com posse exclusiva desses dois arquivos. Não alterou código nem assets.

## Verificação

- `npm run test:server`: **121/121**.
- `npm run test:fusion`: **30/30** (inclui subcasos); testes da interface repetidos após o ajuste final do resumo de custos: **2/2**.
- `npm test`: **36/36**.
- `npm run build`: servidor e cliente aprovados; builds finais também aprovados. Permanecem os avisos anteriores wing-left/wing-right.
- Todas as oito receitas executadas em fixtures por classe compatível; recusas de fonte mista, proteção, refino, gemas, equipamento, duplicação de ID, propriedade, classe/nível, saldo/material e versão verificadas. Recibo/proteção persistidos após fechar e reabrir arquivo SQLite; rollback e mochila cheia verificados.
- Navegador: prévia e confirmação com custos explícitos, comparação com peça equipada, atualização de saldo sem perder revisão e fabricação simulada concluída com resultado protegido. Desktop e 393×852, largura do documento 393px. Capturas: `scratch/evidence/equipment-fusion-desktop.jpg` e `equipment-fusion-mobile.jpg`.
- Nenhuma fusão, compra, venda ou coleta foi executada em conta real durante a inspeção.

## Aplicação e pendências

Backup consistente em `scratch/runtime/before-fusion-1793876150619.db`; reinício apenas sem jogadores conectados. Após a criação da tabela de recibos, o hash de todos os registros de inventário/personagens/gemas/cartas permaneceu igual: **123 itens preservados**, integridade SQLite `ok`, zero erros de chave estrangeira. Nenhum recibo real foi criado pela inspeção.

Servidor atualizado, PID **37412**, `/health` online a 20Hz; Vite mantido. Auditoria local em `scratch/runtime/fusion-deployment.json`. Recarregar o cliente e validar na conta/aparelho do usuário. Não há commit/push deste bloco; as entregas anteriores não commitadas foram preservadas.

A auditoria de arte encontrou 72 caminhos canônicos ausentes nas skills das outras classes, mas também artes legadas e duplicatas; isso não equivale a 72 imagens novas obrigatórias. O prompt orienta revisar semântica e reaproveitar antes de gerar assets. A outra IA deve trabalhar em proposta/pastas reservadas, sem tocar na mecânica ou substituir receitas medidas por listas ainda provisórias.
