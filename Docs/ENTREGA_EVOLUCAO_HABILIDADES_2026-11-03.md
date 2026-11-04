# Evolução funcional das habilidades — 03/11/2026

Implementada em `E:/MagicForge_Universe`, branch `master`, sem commit, merge ou push. Alterações anteriores preservadas.

## Comportamento entregue

- Cada habilidade começa no nível 1 e pode chegar ao 20. O nível pertence à habilidade e ao personagem, independentemente da escolha atualmente selecionada.
- O Grimório mostra nível, bônus atual/próximo, preço e recursos disponíveis. Só habilidades selecionadas, liberadas e com efeito de potência implementado podem receber melhorias.
- A primeira melhoria de um Truque custa 100 ouro e 1 Pó Arcano. Não foi criada uma moeda de pergaminhos: Pó Arcano já cai no farm e é obtido na reciclagem.
- Preço inicial: ouro = arredondar para cima em dezenas `100 × categoria × 1,45^(nível atual − 1)`; Pó Arcano = `categoria × teto(nível atual / 3)`. Categorias vão de 1 a 4. Estes valores são provisórios, ainda sem calibração definitiva de tempo de farm.
- Cada nível acrescenta 5 pontos percentuais à potência base: nível 1 = 100%, nível 2 = 105%, nível 20 = 195%. O bônus afeta dano, sangramento, cura, escudo e a onda da Última Resistência que já existem no combate. Não modifica duração de controle, imunidade, reflexão, buffs percentuais, custo de recurso ou cooldown.
- Suportes sem potência implementada, como o Escudo Arcano Espelhado do Mago, mostram evolução indisponível. A entrega não implementa todos os efeitos descritos das 84 habilidades.
- O servidor deriva o preço e valida classe, escolha selecionada, desbloqueio, nível máximo e saldo. O cliente envia somente a habilidade e o nível esperado.
- Transação SQLite grava consumo de material, ouro e nível juntos. Repetir um pedido com o mesmo nível esperado não cobra novamente. Falhas de persistência revertem tudo antes de atualizar memória.
- A interface aguarda confirmação. Durante compra pendente bloqueia novas compras; em timeout exige resposta ou reconexão para evitar repetição ambígua.
- Ordem automática, categorias, desbloqueios e preferência AUTO/MANUAL são preservados. Reconectar e trocar habilidades preservam o investimento.

## Correção adicional necessária para validar no servidor

O backend anterior havia encerrado com uma exceção em `WorldManager.assignPlayerToChannel`: na reconexão em um mundo sem canais instanciados, `worldChannels[0]` era inexistente. Agora cria o primeiro canal daquele mundo. Um teste reproduz o caso no mundo 3, preservando progresso e melhoria. Não foi necessário rebaixar ou alterar o mundo salvo de nenhum personagem.

## Arquivos deste bloco

- `shared/src/skill-progression.ts` — política de níveis, bônus, elegibilidade e preços.
- `shared/src/index.ts`, `shared/src/messages.ts`, `shared/src/opcodes.ts` — exports e contratos de evolução.
- `server/src/entities/Player.ts` — níveis por habilidade.
- `server/src/database/DatabaseManager.ts` — tabela e compra atômica.
- `server/src/game/World.ts` — processamento da compra, sincronização e potência no combate.
- `server/src/game/WorldManager.ts` — correção do canal ausente na reconexão.
- `server/src/network/PacketHandler.ts` — encaminhamento autoritativo do pedido.
- `client/src/ui/SkillUpgrades.ts` — controles de melhoria e confirmação.
- `client/src/main.ts`, `client/src/network/ClientNetwork.ts` — integração do Grimório e rede.
- `client/index.html`, `client/src/ui/automatic-play.css` — status acessível e apresentação dos controles.
- `server/tests/skill-upgrades.test.ts`, `client/tests/skill-upgrades-ui.test.ts` — compras, rejeições, rollback, persistência, combate e interface.
- `package.json`, `server/package.json` — comando `test:skills`.
- `Docs/ROADMAP_MECANICAS_IDLE_RPG.md` e este relatório — estado e sequência da entrega.
- `server/data/magicforge.db` — tabela nova `character_skills`, com chave composta por personagem/habilidade, restrição de nível 1–20 e referência ao personagem. Sem apagar dados existentes.
- `scratch/runtime/` (ignorado pelo Git) — backup consistente anterior à migração, logs de testes/build e metadados dos serviços.

## Validação realizada

- `npm run test:skills`: **12/12** (9 de servidor e 3 da interface).
- `npm run test:server`: **69/69**; inclui os 9 testes de servidor acima e regressões de combate, automação, canais, offline e inventário.
- `npm test`: **24/24** nos quatro arquivos da suíte geral do cliente.
- `npm run build`: **aprovado**, servidor TypeScript e cliente TypeScript/Vite. Permanecem os avisos existentes de `wing-left.svg` e `wing-right.svg`.
- `git diff --check` nos arquivos de código alterados: sem erro de whitespace; avisos de conversão LF/CRLF do Git.
- Rede local: página HTTPS 200 com status de evolução, backend `/health` 200 `online`, WebSocket com PONG e tabela nova verificada em leitura.
- Teste com SQLite em disco fechado e reaberto confirma nível, ouro, material e habilidade selecionada. Testes de combate confirmam aumento real de dano, cura, absorção de escudo e sangramento.

## Serviços e validação manual

Backend iniciado após backup, porta 3000, PID 15136. Vite mantido na porta 5173, PID 36508. Ambos deixados rodando; PIDs atuais também estão em `scratch/runtime/services.json`.

Desktop: https://localhost:5173/ . Celular na mesma rede: https://192.168.1.12:5173/ . Recarregar a página, abrir o Grimório, selecionar habilidade, melhorar e reconectar para conferir o nível. A compra com uma conta real e o layout no aparelho físico ficam para validação do usuário; os testes desta entrega usaram personagens e bancos isolados.

## Próximo bloco

Medir obtenção de ouro e Pó Arcano, tempo até as próximas melhorias e disputa desses recursos com equipamentos. Depois comparar investimento em habilidade, equipamento e sustentação em cenários equivalentes contra chefes. A previsão de tempo e os números finais da economia não foram implementados nesta entrega.
