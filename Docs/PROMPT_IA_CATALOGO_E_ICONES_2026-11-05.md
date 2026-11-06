# Prompt para IA de conteúdo: catálogo RPG, fusões e ícones — 05/11/2026

Este documento é um pacote de delegação, não um catálogo aprovado nem código pronto. A implementação inicial da fusão está reservada ao agente principal, que prepara um lote pequeno com resultados próprios sem alterar IDs legados. O catálogo completo será revisado depois. Não substituir as receitas dessa implementação por uma proposta ainda não medida.

Copie o bloco abaixo para a outra IA. Se ela não tiver acesso ao repositório, forneça os arquivos públicos de referência mencionados, sem banco de jogadores, credenciais, arquivos de ambiente ou backups.

---

## Prompt copiável

Você é responsável pelo conteúdo e pela direção de ícones de **MagicForge: Universe**, um RPG idle de fantasia autoral. O combate é automático; o jogador escolhe habilidades, ordem de conjuração, equipamentos e melhorias. Há cliente Web, servidor autoritativo e um cliente Unity no repositório.

Sua missão é propor um catálogo coerente de equipamentos e receitas, além de organizar as imagens de habilidades que ainda faltam. Inspire-se nos arquétipos, proficiências, magia, atributos e decisões de build associados a D&D 5e, adaptados ao nosso universo. Não afirme que nossas fórmulas implementam literalmente o sistema de mesa. Preserve os IDs existentes; use nomes e lore autorais para conteúdo novo. A arte não deve prometer uma mecânica que o jogo não implementa.

### 1. Coordenação e escopo

1. Leia `AGENTS.md` antes de agir. O layout do colaborador do usuário tem prioridade; adapte o conteúdo ao padrão existente.
2. Confira branch, `git status` e os arquivos reservados por outros agentes. Não descarte nem sobrescreva alterações existentes.
3. O agente principal cuida de `shared/`, `server/`, `client/src/`, `client/index.html`, testes, banco e fusão funcional. **Não edite esses arquivos, o banco, os opcodes, os slots ou o balanceamento em execução.**
4. No mesmo diretório, trabalhe somente em arquivos novos sob `Docs/Conteudo/Propostas_2026-11-05/`. Antes de escrever, confirme que esse conjunto não foi reservado por outro agente. Para produção simultânea de assets, use worktree próprio e pastas novas de rascunho, sem integrar arquivos finais por conta própria.
5. Não faça commit, merge, rebase, push, instalação de dependências ou publicação. Entregue proposta revisável e relação dos arquivos criados. Se não houver acesso a ferramentas de imagem, entregue prompts e manifesto; não diga que gerou assets.
6. Não altere cenas, Animator, prefabs, `.meta` ou GUIDs do Unity. Não adicione TypeScript/C# apenas para importar imagens.

### 2. Leia estas fontes nesta ordem

- `shared/src/entities.ts`: classes, atributos e ataque básico.
- `shared/src/skills.ts`: IDs canônicos, efeitos descritos, slots, níveis e escalonamento das habilidades.
- `shared/src/items.ts`: tipos, raridades, seis slots, itens existentes e proficiências reais.
- Arquivo de receitas de fusão em `shared/src/` **se já existir na sua cópia**; use a versão em andamento somente como referência, não a edite.
- `Docs/AUDITORIA_ICONES_CLASSES_2026-11-05.md`: caminhos ausentes e artes já existentes.
- `Docs/GUIA_DESIGN_SYSTEM_E_UI_RUNICA.md` e `Docs/GUIA_PROMPTS_ASSETS_IA.md`.
- `Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md`: referência de prompts, verificando divergências contra o código atual.
- `Docs/ENTREGA_ECONOMIA_2026-11-04.md`, `Docs/EVIDENCIAS_ECONOMIA_2026-11-04.json`, `Docs/PROTECAO_E_SUGESTOES_2026-11-04.md` e o relatório de fusão mais recente, se houver.

Se uma fonte antiga divergir do código ou de uma decisão recente, registre a divergência. Não corrija o comportamento do jogo para fazê-lo caber no texto antigo. Exemplo verificado: os desbloqueios atuais de habilidades são **1/10/25/50**; a tabela antiga 10/20/35/50 não deve ser reaplicada por uma tarefa de conteúdo.

### 3. Entregável A: cobertura do catálogo

Comece por uma matriz de lacunas, e só depois proponha itens. Cubra as sete classes: GUERREIRO, BARBARO, ARQUEIRO, CLERIGO, MAGO, MONGE e BRUXO. Os slots atuais são ARMA, ARMADURA, ESCUDO, ACESSORIO, ELMO e BOTAS. Não invente slot novo ou dê escudos a todas as classes para preencher tabela.

Atribua função a cada família: dano sustentado, área, sobrevivência, recuperação ou recurso, sempre distinguindo atributos já existentes de efeitos que exigiriam implementação. Atenção especial a:

- **INT/SAB/CAR não são intercambiáveis.** O Mago usa Inteligência, o Clérigo Sabedoria e o Bruxo Carisma em suas habilidades. Não ofereça ao Bruxo apenas cajados de INT por ele também usar magia.
- Guerreiro e Bárbaro compartilham parte do equipamento, mas não precisam receber sempre a mesma build. O ataque básico do Guerreiro atualmente considera FOR+CAR; suas habilidades de Guerreiro escalam principalmente com FOR. Registre essa diferença, sem alterá-la.
- Arqueiro e Monge usam Destreza, mas arcos, combate desarmado, armas monásticas e armaduras devem manter identidades distintas. Não proponha uma arma de arco como solução universal para ambos.
- Evite exigir a gema, o equipamento ou o chefe de um patamar posterior para liberar o equipamento necessário a vencê-lo pela primeira vez.
- Raridade, nível e refino são dimensões diferentes. Uma peça épica não precisa substituir toda rara e uma fusão não deve ser apresentada como simples sinônimo de refino.
- Os atributos atuais são `forca`, `destreza`, `constituicao`, `inteligencia`, `sabedoria`, `carisma`, `maxHp` e `maxResource`. Efeitos como velocidade de ataque, resistência elemental, crítico por item ou bônus contra chefes só podem entrar em uma coluna **dependência de mecânica**, sem fingir suporte atual.

Entregue uma tabela com:

`status (existente/proposto) | itemId | nome autoral | tipo | slot | raridade | minLevel | allowedClasses | requiredAttributes | statsBonus | papel na build | origem | sellPrice | maxStack | iconAssetProposto | dependências | justificativa`

Preserve todos os IDs existentes e seus dados na seção de inventário atual. Para itens novos, proponha IDs estáveis em `snake_case`, identifique colisões e explique a progressão. Não crie centenas de itens quase idênticos só para preencher uma lista; apresente uma cobertura completa das famílias e patamares com diferenças úteis. Valores propostos devem ser identificados como **não calibrados**, nunca como números finais já aprovados.

### 4. Entregável B: receitas de fusão propostas

Proponha cadeias curtas e legíveis que deem uso às duplicatas e produzam decisões de build. Comece pelo início/meio da progressão; endgame fica separado. Se a mecânica inicial já tiver receitas, mantenha seus IDs e trate suas extensões como uma nova versão proposta, sem substituir contratos existentes.

Para cada receita, documente:

`recipeId | version | nome | resultado itemId/quantidade | ingredientes itemId/quantidade | goldCost | minLevel | classes/requisitos | origem dos ingredientes | estimativa de farm | alternativa vender/reciclar/refinar | justificativa | estado de calibração`

Regras obrigatórias da proposta:

- Não consumir equipamentos usados pelo personagem, itens protegidos, peças refinadas ou com gemas na primeira versão. Não propor transferência silenciosa de refino/gemas nem destruição de investimento.
- Usar referências de instâncias reais na confirmação da mecânica; não dar a entender que escolher apenas um `itemId` autoriza consumir qualquer cópia. A IA de conteúdo descreve a regra, o agente principal implementa.
- Propor resultado conhecido antes de confirmar, sucesso determinístico no lote inicial e custo explícito. Aleatoriedade ou chance de quebra fica como ideia separada, não requisito implícito.
- Uma receita deve aliviar a bag e ter utilidade econômica, sem permitir ciclos lucrativos infinitos de comprar/fundir/vender ou reciclar/recriar os mesmos recursos.
- Não crie receitas autorreferentes ou ciclos de progressão sem uma fonte externa de materiais. Toda família inicial deve ter uma fonte acessível.
- Distinguir custo em ouro, oportunidade das duplicatas e materiais; não converter automaticamente todos em uma moeda sem dados.
- O exemplo histórico de cinco duplicatas era provisório. Não trate cinco como constante universal.
- Recompensas devem ser recebidas sem perda quando o inventário está cheio, usando os espaços liberados pelos ingredientes quando a implementação permitir. O servidor deve rejeitar a operação inteira se não puder entregar; nunca sugerir apagar o resultado.

Use as medições locais como contexto, com seus limites: o relatório disponível mede trajetórias de 30 minutos e parte das classes. Não extrapole uma janela curta como renda fixa de endgame nem declare tempo de farm preciso sem simulação. Para cada estimativa, diga qual taxa foi usada e que itens/drops ainda não têm medição. Entregue uma lista de cenários que o agente principal deverá medir: elegibilidade, tempo até a primeira fusão, espaço liberado, comparação contra chefe e custo relativo a uma melhoria de habilidade/refino.

### 5. Entregável C: plano de ícones de habilidades

A auditoria local encontrou **84 habilidades canônicas, 68 PNGs de 512×512 e apenas 28 artes distintas por SHA-256**. Há **72 caminhos canônicos ausentes**, mas isso não equivale a 72 artes obrigatoriamente novas. Só o Bárbaro possui os 12 caminhos esperados; esses 12 repetem suas quatro artes legadas.

O cliente procura `/assets/skills/<skillId-canônico>.png`. Os arquivos legados `<classe>_1.png` a `<classe>_4.png` e os 28 numerados não garantem cobertura dessa convenção. Não copie cegamente por número: `clerigo_2.png`, por exemplo, mostra arma espiritual, enquanto `clerigo_nv1_1` é Palavra de Cura no catálogo atual.

Trabalhe em duas fases:

1. **Reaproveitamento verificado:** revise as 28 artes únicas, proponha associações semanticamente corretas e marque cada associação como aprovada para revisão ou duvidosa. Um mesmo arquivo pode servir como fallback temporário, mas não conte cópias como artes novas.
2. **Geração do que de fato falta:** produza prompts para os demais ícones e, somente se houver ferramenta e escopo de assets autorizado, gere rascunhos em sua própria pasta. Preserve arquivos finais atuais. Inclua também a revisão de distinção das 12 habilidades do Bárbaro.

Manifesto obrigatório:

`skillId | nome atual | classe | slot | arquivo canônico esperado | arte existente candidata | decisão (reusar/gerar/revisar) | justificativa semântica | prompt | caminho do rascunho | dimensões reais | SHA-256 | estado da validação`

Não rebatize habilidades nem mude seus efeitos para combinar com uma imagem. Não confunda ícone da interface com sprite de personagem, animação de conjuração ou VFX. Animações não fazem parte deste lote de ícones.

Padrão visual de referência: ícones quadrados 512×512, ilustração fantasy RPG de leitura clara, fundo escuro e moldura dourada consistente com as artes já existentes. Preserve o enquadramento para o corte do HUD; teste visualmente a 32/48/64 px. Sem palavras, números, letras de atributo, marcas-d'água ou emblemas de terceiros dentro da arte. Cor ajuda a distinguir classes, mas silhueta e forma do efeito precisam funcionar sem depender só da cor.

Template de prompt, ajustando o sujeito ao efeito real:

```text
Square fantasy RPG ability icon for MagicForge: Universe. [ONE CENTRAL SUBJECT AND ACTION MATCHING THE CANONICAL SKILL]. Original rune-forged fantasy setting, painted 2D game UI illustration, strong readable silhouette, restrained luminous particles, dark radial background, consistent beveled gold frame matching the supplied reference, clear contrast at 32 pixels, centered safe composition, no text, no letters, no numbers, no watermark, 512 by 512.
```

Para ícones enquadrados como os atuais, mantenha o fundo escuro da referência. Transparência é apropriada apenas quando o asset pedido for um recorte separado; não aplique a regra de sprites isométricos a todas as imagens de UI.

### 6. Formato final da entrega

Crie somente arquivos novos na pasta de proposta reservada:

- `01_MATRIZ_LACUNAS.md`: cobertura atual, lacunas e conflitos de documentação.
- `02_CATALOGO_PROPOSTO.md` e, se útil, um JSON de dados de proposta com o mesmo conteúdo.
- `03_RECEITAS_PROPOSTAS.md`: receitas versionadas, pressupostos e cenários de medição.
- `04_MANIFESTO_ICONES.md` ou `.json`: mapeamento revisável e rascunhos separados dos assets finais.
- `05_PROMPTS_ICONES.md`: prompts por habilidade, reaproveitamentos e referências utilizadas.
- `LEIA_ME.md`: arquivos criados, validações realmente feitas, limitações e decisões que dependem da equipe.

Não apresente proposta como conteúdo integrado. Não declare build, teste em celular, balanceamento ou imagem final aprovada sem ter feito a verificação correspondente. Entregue um resumo curto que permita ao agente principal integrar lotes pequenos sem parar a mecânica em desenvolvimento.

---

## Uso deste pacote

Se o colaborador usar outro worktree, a integração ocorrerá depois de revisar as propostas. Se usar a mesma pasta, a reserva é exclusivamente de arquivos novos de proposta; alterações em código ou assets finais exigem uma nova combinação de posse, para não cruzar com o agente que está implementando a fusão.

Documentos de apoio preparados neste bloco: este prompt e `Docs/AUDITORIA_ICONES_CLASSES_2026-11-05.md`. Nenhuma imagem foi gerada e nenhum catálogo completo foi declarado pronto.
