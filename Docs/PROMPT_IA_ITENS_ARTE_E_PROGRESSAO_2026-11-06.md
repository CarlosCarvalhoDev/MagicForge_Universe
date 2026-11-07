# Delegação — ícones de itens e revisão do catálogo — 06/11/2026

Copiar o bloco abaixo para a IA de conteúdo/arte. Esta entrega é separada da calibração funcional conduzida pelo agente principal. Nenhuma imagem nova ou mudança de balanceamento foi produzida ao escrever este prompt.

## Prompt para a outra IA

Você trabalha no MagicForge: Universe, RPG idle automático de fantasia autoral, com referências de arquétipos de D&D. Sua responsabilidade neste lote é **preparar arte de inventário e reconciliar a proposta de conteúdo com o código atual**. Prioridade: Guerreiro e Bárbaro. Não alterar a mecânica, o banco ou o layout em execução.

### 1. Coordenação e fontes

- Leia `AGENTS.md`, confira branch, status e reservas de arquivos antes de editar. O layout do colaborador do usuário é prioritário.
- No mesmo diretório, seu conjunto reservado para este lote é somente **arquivos novos em `Docs/Conteudo/Itens_Arte_2026-11-06/`**, incluindo rascunhos de imagens. Confira que não há outro trabalho nessa pasta antes de começar; não sobrescreva conteúdo existente de autoria alheia.
- O agente principal permanece responsável por `shared/`, `server/`, `client/`, banco, fórmulas, custos e integração. Não edite esses arquivos nem assets em produção, cenas, prefabs, `.meta` ou GUIDs. Não faça commit/push/merge nem instale dependências por conta própria.
- Leia `Docs/GUIA_PROMPTS_ASSETS_IA.md`, `Docs/GUIA_DESIGN_SYSTEM_E_UI_RUNICA.md`, `shared/src/items.ts`, `shared/src/equipment-fusion.ts` e os locais onde os ícones são apresentados no cliente.
- Leia sua entrega anterior em `Docs/Conteudo/Propostas_2026-11-05/`, a devolutiva em `Docs/REVISAO_PROPOSTA_CONTEUDO_2026-11-05.md` e `Docs/ENTREGA_GUERREIRO_BARBARO_2026-11-05.md`.
- Não copie banco, backups, tokens, certificados, chaves ou arquivos de ambiente para prompts ou documentação.

### 2. Primeiro: auditar antes de gerar

O código atual ainda usa emojis em partes da mochila/inspeção. Já existem PNGs em `client/public/assets/ui/items/`; não presumir que todo ícone esteja ausente ou integrado.

Produza um manifesto dos 12 itens abaixo: `itemId`, nome atual, tipo/slot, classes permitidas, arte candidata existente, dimensões reais, transparência, caminho de rascunho, decisão (`reusar`, `revisar`, `gerar`) e justificativa. Abra as imagens para verificar o conteúdo; nome de arquivo e hash não substituem inspeção visual.

| itemId | Papel no primeiro lote |
|---|---|
| `sword_iron_broadsword` | Espada inicial de Guerreiro/Bárbaro |
| `sword_runic_tempered` | Resultado de reforja inicial |
| `sword_runic_bastard` | Arma de nível 25 |
| `armor_chainmail` | Armadura inicial |
| `armor_runic_vigil` | Armadura de reforja |
| `armor_titan_plate` | Armadura de nível 25 |
| `shield_iron_buckler` | Escudo; respeitar as classes reais, sem oferecer ao Bárbaro |
| `relic_ancient_forge` | Acessório atual |
| `potion_hp_minor` | Poção de vida |
| `potion_mp_minor` | Poção de recurso |
| `ore_iron_arcane` | Material de reforja |
| `arcane_dust` | Material de melhoria |

Confirme todos os IDs e dados contra `items.ts` antes de usar esta tabela. Ela seleciona itens existentes; não autoriza renomeá-los ou trocar seus atributos.

### 3. Produção visual em lote pequeno

Após o manifesto, produza o primeiro lote em `rascunhos/` dentro da sua pasta reservada. Se a geração de imagens não estiver disponível, entregue prompts específicos por item e registre claramente que **não foram gerados PNGs**.

Direção proposta para ícones de inventário:

- Fantasia forjada, metal, couro, tecido e runas coerentes com a UI existente; objeto isolado em perspectiva 3/4, silhueta clara e iluminação consistente. Não aplicar automaticamente o enquadramento de corpo inteiro dos prompts de personagem a um ícone de inventário.
- PNG RGBA, master 512×512, fundo realmente transparente, sem chão/cenário, texto, números, nomes de item ou badges de refino.
- Não incorporar moldura de raridade na imagem: essa moldura permanece com a UI, permitindo manter raridade/refino/proteção como dados dinâmicos. Preservar margem para o objeto não tocar/cortar as bordas.
- Diferenciar espada inicial, reforjada e de nível 25 pela construção/material/silhueta, não só pela cor do brilho. Não desenhar bônus elementais, soquetes ou efeitos que o item não possui.
- Validar legibilidade em 32, 48 e 64 pixels sobre fundo escuro e dentro de uma célula de exemplo. Checar recorte, proporção, contraste e transparência; corrigir antes de ampliar o lote.
- Salvar cada imagem como `<itemId>.png` no rascunho. Registrar a origem e, quando aplicável, licença de material de terceiro.
- Criar uma prancha de contato e uma prévia estática das artes em células, identificadas como **rascunho**, sem alterar o layout real do jogo.

Não promover arquivos para `client/public/assets/` ou Unity por conta própria. O agente principal revisará o lote e implementará um mapeamento estável por `itemId`, com fallback para itens sem imagem, na mochila, equipados, comparação, reforja e refino.

### 4. Reconciliação do catálogo anterior

Criar uma **versão corrigida nova**, dentro da pasta deste lote, sem sobrescrever a entrega anterior:

- Recontar o catálogo real. A última conferência encontrou 46 IDs de item; verificar novamente, pois o código pode ter evoluído.
- Incluir `staff_monk_ash` e `focus_pact_initiate` no inventário de itens existentes, preservando seus dados. Não confundir a prioridade visual Guerreiro/Bárbaro com permissão para apagar outras classes.
- Corrigir o contrato do JSON anterior: ele tem `proposedItems` com 47 propostas, não os 89 registros prometidos no LEIA_ME. Declarar exatamente o que o novo JSON contém; separar existentes e propostos e conferir contagens/IDs duplicados.
- Descrever as receitas v1 como **implementadas e medidas inicialmente**, não como balanceamento final comprovado.
- Reconciliar cada origem de ingrediente com drops/receitas existentes. “Cai de chefe” exige indicar qual fonte real; se não existir, marcar como dependência de implementação.

### 5. Equipamentos e fórmulas: proposta revisável, sem ativação

Após a arte/reconciliação, preparar um lote pequeno de progressão de equipamento para Guerreiro/Bárbaro nos marcos 1, 5, 15 e 25. Reaproveitar as propostas anteriores quando úteis, sem simplesmente adicionar dezenas de itens.

Entregar uma tabela por família com: `itemId existente/proposto`, papel na build, nível, classes, requisitos, bônus, fonte real/proposta, custo/ingredientes, ganhos esperados e hipótese a testar. Distinguir dano sustentado, sobrevivência, recurso e área; CP isolado não define melhor equipamento.

Regras:

- Usar apenas atributos suportados: FOR, DES, CON, INT, SAB, CAR, `maxHp` e `maxResource`. Velocidade, resistência elemental, crítico por item e efeitos de conjunto vão numa coluna de **dependências**, sem fingir suporte atual.
- Guerreiro usa FOR+CAR no básico e principalmente FOR nas habilidades; Bárbaro usa FOR/CON e seus efeitos próprios. Não alterar essa regra para facilitar uma planilha.
- Todos os números novos ficam como **não calibrados**. Para cada hipótese, declarar o objetivo mensurável: tempo até primeira compra/reforja, tempo de chefe, mortes, consumo de poções ou espaço ocupado na mochila.
- Não inventar taxas de ouro/material. Usar somente relatórios existentes e explicitar a amostra; não extrapolar automaticamente dados de 30 minutos para todo o jogo.
- Não criar ciclo em que o equipamento necessário para vencer um chefe só possa ser obtido após vencer esse mesmo chefe, sem uma rota alternativa real.
- Preservar proteção, refino, gemas e identidade de instância. Peças investidas não entram silenciosamente como ingredientes. Um resultado de reforja protegido exige desbloqueio explícito se for proposto como ingrediente posterior.
- Conferir custo de oportunidade, venda, reciclagem e possibilidade de ciclos lucrativos de criação/venda. Não afirmar “economia segura” só porque uma fórmula parece razoável.

O agente principal fará a implementação e os benchmarks de progressão. Você entrega hipóteses e dados revisáveis, não números finais nem mudanças no banco/servidor.

### 6. Critérios de entrega

Entregar na sua pasta:

1. `LEIA_ME.md`: escopo, arquivos, o que realmente gerou/verificou e pendências.
2. `manifesto_itens.json`: IDs/caminhos/dimensões reais/decisão/status da arte.
3. `rascunhos/`: somente os PNGs efetivamente gerados ou preparados.
4. `prancha_contato.png` e prévia de células, quando houver imagens.
5. `catalogo_reconciliado.json` e nota das divergências corrigidas.
6. `progressao_equipamentos_proposta.md`: lote pequeno com hipóteses, fontes e dependências; números não calibrados.

Não apresentar prompts como imagens geradas, nem uma prancha de artes como prova de integração funcional no jogo. Sem acesso ao repositório ou a um gerador, declarar a limitação e entregar a parte verificável.

## Responsabilidades após o repasse

- IA de conteúdo/arte: pasta nova acima; primeiro auditoria + 12 ícones, depois catálogo/proposta de equipamentos.
- Agente principal: calibração de Guerreiro/Bárbaro com recursos de farm, integração dos ícones aprovados e ativação seletiva de receitas após medição.
- Nenhuma mensagem foi enviada à outra IA ao criar este arquivo. O usuário pode repassar este prompt diretamente.

Arquivo criado em `master`, `E:\MagicForge_Universe`, sem commit/push. Apenas documentação; nenhum build/teste de jogo é necessário por esta criação, e nenhuma arte ou fórmula foi ativada.
