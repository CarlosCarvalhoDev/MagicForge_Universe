# Revisão inicial da proposta de conteúdo — 05/11/2026

Recebida a entrega em `Docs/Conteudo/Propostas_2026-11-05/`. Os documentos continuam sendo propostas, sem ativação automática de itens, receitas ou imagens. Esta revisão não substitui a inspeção visual das artes nem a auditoria de cada linha de atributos.

## Devolutiva para a IA de conteúdo

1. Atualizar a base com `staff_monk_ash` e `focus_pact_initiate`, adicionados pelo agente principal durante a elaboração da proposta. O código atual contém **46 IDs de item**. A busca textual no catálogo Markdown encontra 44 desses IDs e não encontra essas duas armas; a contagem declarada de 42 precisa ser reconciliada com as linhas do próprio documento. Não modificar o código para restaurar uma contagem antiga.
2. Corrigir a descrição do JSON: ele contém a lista `proposedItems` com **47 propostas**, além de metadados; não contém os 89 registros existentes+propostos prometidos no LEIA_ME. Pode continuar sendo um JSON apenas de propostas, desde que o contrato esteja explícito. Foi verificado que nenhum dos 47 IDs colide com os 46 IDs atuais. Isso não valida os números ou a disponibilidade de ingredientes.
3. Trocar “receitas v1 já calibradas” por “receitas v1 implementadas e medidas inicialmente”. A primeira disponibilidade foi medida em trajetórias limitadas; equilíbrio de longo prazo, auto-venda, novas classes e todos os patamares ainda não estão validados.
4. Preservar as receitas v1 e seus contratos. As receitas v2, v2_mid e v2_epic continuam propostas; os cenários sugeridos devem ser executados antes de ativar novos custos, drops ou rotas de progressão. Um resultado que nasce protegido exige desbloqueio explícito antes de servir de ingrediente numa receita posterior; isso precisa ficar claro na proposta dessa rota.
5. As seis realocações de ícones são candidatas à próxima revisão de arte. Não mover/renomear arquivos referenciados, nem sobrescrever PNGs ou `.meta` por conta própria. O agente principal ainda precisa conferir visualmente cada arte e o manifesto contra as habilidades atuais. Esta revisão não aprova correções de moldura ou geração de arquivos finais.
6. As 60 artes indicadas como faltantes continuam um plano de produção, não imagens entregues. Gerar primeiro em rascunho, conferir tema/efeito/corte/moldura e só então integrar pequenos lotes. Não é necessário bloquear as mecânicas para aguardar todas as imagens.

As fórmulas e descrições das seis habilidades iniciais do Clérigo foram explicitadas neste bloco; consultar `Docs/ENTREGA_CLERIGO_INICIAL_2026-11-05.md` antes de revisar os prompts relacionados. A pasta de propostas permanece reservada à IA de conteúdo e não foi alterada pelo agente principal.

## Ordem de integração

1. Corrigir contratos e contagens da documentação.
2. Revisar visualmente as seis artes candidatas e definir o mapeamento por ID canônico.
3. Medir um lote pequeno de itens/receitas de início de jogo, verificando proficiência, obtenção de ingredientes, mochila cheia e proteção/refino/gemas.
4. Integrar os aprovados e avançar para os demais patamares após evidência de progressão.

Não foi enviada mensagem à outra IA nem aplicado o catálogo. Este arquivo é a devolutiva que a equipe pode repassar a ela.
