# Próxima prioridade — Guerreiro e Bárbaro — 05/11/2026

> Atualização: os itens desta revisão foram tratados na [entrega do Guerreiro/Bárbaro](ENTREGA_GUERREIRO_BARBARO_2026-11-05.md). Este arquivo preserva o diagnóstico inicial; não usar sua lista de lacunas como estado atual do código.

Sequência solicitada pelo usuário após concluir o Mago: **Guerreiro primeiro, Bárbaro depois**, por serem as classes já existentes em uso. Esta é uma revisão inicial de código e preparação do próximo lote; não declara novas correções implementadas nessas classes.

## Guerreiro

Há execução específica para suas habilidades em `server/src/game/World.ts`; preservar esse trabalho e revisar por comportamento, sem reescrever a classe inteira.

| Área | Evidência atual e próximo trabalho |
|---|---|
| Sangramento | O tick genérico de `BLEED` pode continuar sem fonte presente, atribuindo a morte com jogador ausente. Criar caso de saída/morte/troca de mundo antes de decidir a correção e comparar a política aos efeitos temporais novos. |
| Baluarte | Absorção/reflexão já implementadas e cobertas pela suíte existente. A política de reflexão é distinta do Escudo do Mago; não igualar silenciosamente as duas. Confirmar quebra, duração e recompensa de morte refletida, incluindo chefe. |
| Golpe Colossal | Dano em linha e empurrão de 1,5m já existem; não tratar empurrão como efeito ausente. Verificar alvo após deslocamento, limites do mundo e seleção automática. |
| Postura, Avatar e controle | Bônus de velocidade/dano e atordoamento possuem ramos específicos. Verificar renovação, expiração e interação com a rotação em vez de adicionar bônus duplicados. |
| Cura e imunidade | Conferir potência, crítico apresentado, limite de HP e último ponto de vida; preservar os contratos enquanto a revisão não demonstrar falha. |

Primeira entrega recomendada: testes de ciclo de vida do sangramento e reflexão que mata chefe, corrigindo apenas as falhas comprovadas. Em seguida, medir escolhas do Guerreiro no mesmo orçamento de equipamento/habilidades, registrando duração, sobrevivência e vitórias.

O ataque básico atual do Guerreiro usa FOR+CAR, enquanto suas habilidades usam principalmente FOR. Não alterar essa identidade incidentalmente durante a revisão de efeitos.

## Bárbaro

Fúria Primitiva já aplica dano +25% e redução de dano recebido de 15% por 6s. A leitura atual de `World.ts` mostra várias outras habilidades ainda passando pelo fallback genérico, apesar das descrições prometerem efeitos secundários.

| Habilidade | Lacuna identificada na leitura do código |
|---|---|
| Pisotão Sísmico | A descrição promete lentidão de 30%; o ramo genérico não aplica essa lentidão. A apresentação antiga usa uma variante visual de stun; alinhar visual à regra de lentidão. |
| Mordida Voraz | Promete recuperar 20% do dano causado; o fallback aplica dano sem esse dreno. Usar dano efetivamente retirado do HP para evitar cura por overkill. |
| Rugido Desmoralizador | Promete reduzir ataque inimigo em 20%; o fallback causa dano sem essa redução. Definir duração, área, renovação e interação com defesa antes de implementar. |
| Banho de Sangue | Promete sangramento em área, ainda sem o ramo específico correspondente. Reutilizar a política de ciclo de vida validada no Guerreiro. |
| Pele Rochosa e patamares seguintes | Auditar cura, proteção e ultimates contra o catálogo antes de considerar a classe completa. Não assumir que um VFX prova a existência do efeito. |

Começar pelas seis habilidades iniciais, mantendo custos, slots, categorias, layout e equipamentos. Os números ainda ausentes nas descrições precisam ser explicitados e medidos, sem copiar cegamente fórmulas de outro jogo ou apresentar a adaptação como D&D literal.

## Base de segurança

- A suíte completa de servidor passou com 184 testes após o Mago; contém cenários já existentes do Guerreiro.
- Os testes de apresentação do Guerreiro/Bárbaro passaram com 19 testes. Isso é regressão de apresentação, não comprovação de todos os efeitos secundários do Bárbaro.
- Usar fixtures em memória para reproduzir falhas; não alterar nível, ouro ou itens de personagens reais para teste.
- Preservar layout do colaborador, IDs e regras de inventário/reforja. Sem migração, commit ou push por consequência automática deste plano.

Arquivo criado pelo agente principal na branch `master`; a pasta reservada à IA de conteúdo não foi editada.
