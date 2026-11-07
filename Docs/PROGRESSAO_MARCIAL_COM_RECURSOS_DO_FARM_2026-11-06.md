# Guerreiro e Bárbaro: compras durante o farm

Entrega de 06/11/2026 em `master`, raiz `E:/MagicForge_Universe`, sem commit/push. Complementa a implementação das habilidades marciais; não substitui a calibração futura do endgame.

## O que passou a ser verificável

A simulação agora pode executar decisões a cada segundo durante a caçada, com as mesmas transações de habilidade, equipamento, refino e fusão do jogo. As decisões pertencem exclusivamente à bancada: nenhuma compra ou troca automática foi ativada para os jogadores.

Quatro políticas, sempre partindo de um personagem novo, nível 1, arma inicial equipada, 50 ouro e poções iniciais normais:

- Guardar: arma inicial, sem compras ou trocas.
- Habilidade: melhorar o Truque do primeiro slot quando houver ouro e Pó Arcano suficientes.
- Equipamento: aceitar sugestões conservadoras sem perda de atributos e refinar a arma equipada até +2, usando pedras obtidas na caçada.
- Fusão: reservar ingredientes, executar uma única fusão da arma compatível e tentar equipar o resultado.

Não há concessão de materiais, níveis ou ouro adicional, nem resgate offline. Portais, movimento, combate, recompensas e chefes usam a automação real. Depois de atravessar um portal, as ações usam a instância atual do mundo. Todos os bancos são SQLite em memória; o banco ativo não foi aberto ou modificado pela bancada.

## Medição

36 trajetórias de 30 minutos: duas classes, três sementes (101/202/303), quatro políticas com auto-venda desligada, mais guardar/habilidade com auto-venda de comuns e incomuns ligada. Total: 18 horas simuladas. Uma sondagem adicional de 10 minutos inspecionou a composição da mochila.

| Cenário | Guerreiro | Bárbaro |
| --- | --- | --- |
| Primeiro Truque comprado, sem auto-venda | 28,05–38,05 s | 35,05–45,05 s |
| Truque após 30 min, sem auto-venda | Nv. 8; 8.350 ouro gasto | Nv. 8; 8.350 ouro gasto |
| Truque após 30 min, com auto-venda | Nv. 9; 12.400 ouro gasto | Nv. 9; 12.400 ouro gasto |
| Primeira fusão executada, reservando ingredientes | 226,05–245,05 s | 236,05–298,05 s |
| Mundo ao terminar, em todas as políticas | 3 | 3 |
| Nível do herói ao terminar | 9 | 9–10 |

Todas as trajetórias venceram os dois primeiros chefes e nenhuma venceu o terceiro dentro da janela. O ouro final de cada uma das 36 trajetórias concilia exatamente: **50 iniciais + drops + auto-vendas − compras**. Fusão gastou 1.800 ouro uma vez; refino da arma até +2 gastou 1.000 ouro nas seis trajetórias dessa política.

As melhorias funcionam, mas essa amostra não demonstra que comprar apenas o Truque, refinar apenas a arma inicial ou fazer uma única fusão resolva a barreira do terceiro chefe. Também não compara builds completas: a seleção padrão de habilidades foi mantida. Não foram alterados dano, HP de chefes, preços ou curva de experiência.

## Gargalo de inventário

Sem auto-venda, a mochila permaneceu cheia por 1.509–1.655 dos 1.800 segundos, conforme classe/semente/política. Isso mede ocupação, não tempo sem receber ouro ou EXP: materiais e poções podem continuar entrando em pilhas existentes e o combate continua.

A auto-venda de comuns/incomuns não elimina a lotação: nos cenários medidos, ainda foram 1.051–1.577 segundos de mochila cheia. Na sondagem Guerreiro/101, após dez minutos havia **seis `bow_hunting`**, raros, ocupando seis dos vinte slots; os demais quatorze slots eram materiais, gemas e poções. Esses arcos não são equipáveis pelo Guerreiro e são preservados pela configuração que não vende raros.

A próxima intervenção recomendada é uma gestão seletiva de excedentes: facilitar identificar equipamentos incompatíveis e repetidos e decidir sua venda/reciclagem, preservando protegidos, peças equipadas e ingredientes escolhidos para fusão. Ligar auto-venda de todos os equipamentos pode impedir a formação dos conjuntos necessários à receita. Nenhuma venda/reciclagem nova foi ativada silenciosamente neste bloco.

Antes de reduzir a dificuldade do terceiro chefe, medir uma política combinada de equipamento, sustentação e habilidades disponíveis, e sua trajetória até níveis mais altos. Uma barreira em 30 minutos, isoladamente, não prova erro de balanceamento.

## Reprodução e limites

Da raiz:

```powershell
npm run test:earned
npm run benchmark:earned -- 1800 E:/MagicForge_Universe/scratch/runtime/earned-retain.json retain
npm run benchmark:earned -- 1800 E:/MagicForge_Universe/scratch/runtime/earned-sell.json sell
npm run build --workspace=@magicforge/server
```

`retain` executa 24 trajetórias; `sell`, 12. O modo de venda compara apenas guardar/habilidade, porque vender todos os ingredientes elegíveis tornaria a política de fusão sem sentido. Decisões podem ser tomadas durante combate, como ações do jogador; não há expansão, reciclagem, venda manual, alterações de build ou compras offline. Mesma semente significa mesmo estado aleatório inicial; ações diferentes podem alterar o consumo posterior do RNG. Não interpretar diferenças pequenas de mortes como causalidade comprovada.

Evidência resumida: `Docs/EVIDENCIAS_PROGRESSAO_MARCIAL_2026-11-06.json`; relatórios completos locais em `scratch/runtime/earned-progression-2026-11-06.json` e `scratch/runtime/earned-progression-sell-2026-11-06.json`. Os relatórios preservam hashes do código usado no início de cada experimento. Depois foi acrescentada apenas a composição diagnóstica da mochila ao retorno da simulação; o executor ganhou o modo de venda entre os dois experimentos.

## Validação e integração

- `npm run test:server`: 205 testes passaram.
- `npm run test:earned`: sete testes passaram, incluindo repetibilidade, restauração do relógio/RNG, conservação de ouro, compras reais e fusão única.
- Build do servidor e verificação de whitespace: resultados finais registrados na entrega do chat.
- Sem mudança visual, banco de produção, dependência nova, reinício de serviço ou arquivos de arte. Pasta reservada à outra IA, `Docs/Conteudo/Itens_Arte_2026-11-06/`, preservada.
- Pendente: validar ritmo em sessões humanas e medir gestão de excedentes/build combinada. Nenhuma aprovação necessária para ativação, pois este bloco não altera regras em execução.

Arquivos deste bloco: `server/tools/ProgressionSimulation.ts`, `server/tools/benchmark-earned-progression.ts`, `server/tests/earned-progression.test.ts`, scripts dos dois `package.json`, este documento, JSON de evidências e anotação no roadmap. Alterações anteriores permanecem intactas.
