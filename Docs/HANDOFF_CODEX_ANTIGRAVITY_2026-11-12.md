# Handoff Codex → Antigravity — 12/11/2026

## Onde está cada trabalho

Entrega integrada diretamente na **`master`**, conforme combinado com o usuário e o colega. Ela reúne as contribuições mais recentes do Antigravity com os ajustes de mecânicas, economia e bolsa descritos abaixo.

- `5ea7c86`: preservou habilidades completas de Arqueiro/Monge/Bruxo e integração dos ícones de itens.
- `2e215f0`: integrou a contribuição remota até **`cc7db18`**, preservando arte e layout e resolvendo as duas decisões de mecânica com o usuário.
- `b0743d9`: benchmarks, bolsa sem requisito de nível, meios de pagamento, carteira de Cash e testes.
- O merge desta entrega incorpora **`origin/master` em `eb41ecc`**: armazém, livro do inventário, HUD/perfil, artes de habilidades e controles de teste mais recentes.

Os oito commits remotos novos foram integrados por merge, sem substituir a master por uma árvore antiga. **As artes e layouts mais recentes do Antigravity tiveram prioridade.** Nenhuma branch adicional foi criada nesta rodada.

## O que mantivemos do Antigravity

O merge anterior preservou os 99 arquivos de arte recebidos em `cc7db18`. Nesta rodada, foram conferidos por hash os **103 arquivos de arte novos ou atualizados entre `cc7db18` e `eb41ecc`**: todos estão idênticos à master do Antigravity. Isso inclui a nova revisão dos 84 ícones ilustrados, arte do armazém e ícones do inventário/HUD.

Também foram mantidos:

- Capa, login, seleção/exclusão de herói e apresentação das classes.
- Palco/preview do herói, slots de equipamento, HUD responsivo e apresentação de grupo/narrativa.
- `SkillArt.ts` e o uso dos ícones ilustrados no HUD e Grimório.
- Efeitos do Guerreiro com impactos temporizados; o cliente respeita o atraso e os alvos confirmados pelo servidor.
- Painel administrativo com validação de permissão no servidor e ferramentas de treino.
- Botão “Equipar melhores” e sua pontuação por classe.
- Novo inventário compacto em formato de livro, `InventoryArt`, HUD/perfil ampliado e todos os VFX mais recentes.
- Armazém privado com exterior/interior/andar superior, colisões, navegação e retorno à batalha. A entrada retira o personagem da simulação de combate; a posição de batalha é preservada. Essa entrega é uma área de exploração, não um sistema já implementado de depósito de itens.
- Controles administrativos novos de pausa de spawn e congelamento de monstros, com suas validações no servidor.

Os ajustes de bolsa acrescentam escolhas de pagamento e seus textos ao painel do livro, preservando arte, molduras, identidade visual e sprites. A prévia da mochila completa também foi preservada e passou a carregar o CSS novo; existe uma prévia separada de pagamentos.

Os conflitos de texto ocorreram em `main.ts`, `PacketHandler.ts` e `shared/src/index.ts`. A apresentação e os helpers de arte de `main.ts` ficaram com a versão remota; foram removidas inserções locais duplicadas de ícones. Os exports de Arqueiro/Monge/Bruxo e armazém foram combinados. O movimento por clique ficou disponível **somente no armazém**; em batalha continua a regra automática aprovada. Não foi adotado movimento manual em batalha ao desligar as magias.

### Duas decisões de integração aprovadas pelo usuário

1. **AUTO controla somente as habilidades.** Desligá-lo permite conjuração manual, mantendo movimento, aquisição de alvo, ataque básico, chefes e portais automáticos. O modo de movimento manual trazido naquela contribuição não foi adotado.
2. **Equipar melhores usa a pontuação por classe do Antigravity**, mesmo que uma troca sacrifique algum atributo. A sugestão conservadora anterior continua disponível; não confundir os dois critérios.

Referência detalhada: [integração de 11/11](INTEGRACAO_MASTER_2026-11-11.md).

## Estado das mecânicas

### Automação, habilidades e progressão

- Combate automático com quatro slots, categorias/desbloqueios e ordem configurável persistida no Grimório. O ciclo respeita cooldown/recurso e pula habilidades indisponíveis.
- Movimento, ataque básico, avanço de mundo e tentativa automática de chefe continuam ativos quando as magias ficam manuais.
- Evolução de habilidades persistente, ranks 1–20 e compras com ouro/pó. A potência cresce 5% por rank; não aumenta automaticamente duração, controle ou outros parâmetros sem implementação específica.
- Alvos, nível, cooldown, recurso, geometria e efeitos são validados no servidor. O cliente apresenta os resultados confirmados, sem decidir dano ou novos alvos.

### Classes — 84 habilidades canônicas

Conferência atual, deduplicando aliases legados: **sete classes × 12 habilidades**, todas com efeito permitido pelo executor. Isso não significa balanceamento final ou animação exclusiva pronta para cada efeito.

| Classe | Mecânicas implementadas |
|---|---|
| Guerreiro | Dano único/área/linha, sangramento, atordoamento, quebra de armadura, empurrão, cura, escudo/reflexão, Avatar e Última Resistência. |
| Bárbaro | Fúria, lentidão, dreno de vida real, redução de ataque, carga, salto, sangramento, cura/proteção, janela de habilidades sem custo, execução sob limiar e Matilha periódica. |
| Arqueiro | Veneno, lentidão, marca exclusiva do autor, disparos múltiplos reais, raiz, áreas/linha, furtividade, crítico de emboscada, evasão, Fênix, barragem e guardião periódico fixo. |
| Clérigo | Cura, bênçãos, marca, escudo/proteção, arma espiritual, guardiões e áreas periódicas, santuário e efeitos de terceiro círculo. |
| Mago | Queimadura, gelo/controles, projéteis, escudo/reflexão, cone, corrente, aceleração arcana, cometas periódicos e estase. |
| Monge | Golpes sequenciais, ataques de área/cone, redução de frequência de ataque, esquiva/crítico temporários, cura, stun, deslocamento acelerado e domo periódico com silêncio. |
| Bruxo | Rajada, redução de cura, praga periódica, maldição e regeneração vinculadas ao alvo, Agathys com retaliação, raiz, área de cegueira, dreno, teleporte com explosão na origem, singularidade e áreas de presença/agonia. |

Limites que devem continuar explícitos:

- Matilha, guardião astral, presença demoníaca e efeitos semelhantes usam áreas/pulsos; não são pets autônomos com IA de navegação/aggro.
- NPCs atuais não têm um repertório de magias. Silêncio bloqueia a capacidade de conjurar, sem virar stun ou impedir ataque básico.
- Cura por dreno usa HP realmente removido: não cura por overkill ou dano absorvido.
- Status sustentados respeitam duração, autor e limpeza por morte/saída. Evitar reintroduzir acúmulo de buffs ou pulsos de fonte ausente ao integrar renderizadores/World.
- Implementação e testes de mecânica deste lote são Web/servidor/shared; Unity não foi atualizado ou validado para todos os novos contratos.

### Inventário, equipamentos e fusão

- Equipados ficam nos endereços negativos de equipamento e fora da ocupação da bolsa. Trocas são transacionais e preservam identidade das instâncias.
- Há proteção de itens, refino, gemas, inspeção/comparação por hover/toque prolongado, sugestões conservadoras e equipamento por pontuação de classe.
- Fusão v1 tem oito receitas; consome três cópias idênticas elegíveis, ouro e materiais. Equipados, protegidos, refinados e com gemas não entram como ingredientes.
- Pedidos de fusão têm recibos para evitar cobrança duplicada. Saídas ficam protegidas; desbloquear é necessário antes de usá-las como ingrediente de receitas futuras.
- Ícones de itens são reutilizados em bolsa, equipamentos, comparações, refino/gemas, fusão e sugestões, com fallback quando falta arte específica.
- O novo `InventoryBook` e o armazém de `eb41ecc` estão incluídos nesta base. Foi acrescentado teste de expansão por ouro, Cash e ouro+selo dentro do armazém, preservando posição de combate e persistência da capacidade.

### Bolsa — regra nova aprovada

**Não há requisito de nível de personagem ou Reborn para expandir.** Teto atual: 50 espaços.

| Compra | Ouro | Alternativa Cash |
|---|---|---:|
| 20→25 | 10.000 | — |
| 25→30 | 50.000 | — |
| 30→35 | 250.000 | — |
| 35→40 | 1.000.000 + 1 Selo de Expansão Astral | 100 |
| 40→45 | 3.500.000 + 1 Selo de Expansão Astral | 200 |
| 45→50 | 10.000.000 + 1 Selo de Expansão Astral | 400 |

Os valores de Cash são provisórios aprovados. Capacidades legadas não são reduzidas; 31→35 concede quatro espaços e 48→50 concede dois. Ouro sozinho não pode ultrapassar o limite de 35 pela API antiga ou pela nova.

Cash debita apenas Cash. Ouro+selo consome ambos na mesma transação da capacidade. Selo protegido não é consumido; o material `seal_astral_expansion` não é vendável a NPC nem reciclável. Compra repetida/stale, preço inválido e falta de saldo/item falham sem débito parcial.

### Carteira e migração

- Cash fica por conta em `accounts.cash_balance`; ouro/capacidade continuam por personagem.
- Migração aditiva cria saldo zero e `account_cash_transactions`; não há migração destrutiva ou reset de personagens.
- `creditAccountCash(accountId, amount, reference)` é integração interna do servidor com referência idempotente; **não existe opcode de cliente para criar Cash**.
- Não foi concedido Cash ou selo automaticamente às contas reais.
- **Loja/provedor de pagamento, conversão em dinheiro real, oferta do selo e drop extremamente raro ainda não estão implementados/calibrados.** A raridade Lendário do catálogo não é uma taxa de drop.
- Antes de executar em outro ambiente, fazer backup local do SQLite e deixar o código aplicar a migração; não copiar o banco ativo do outro colaborador.

### Offline e relatórios

- Offline gratuito: limite de oito horas. Política futura premium de 12 horas existe como previsão; VIP/premium não foram ativados como benefício comprado.
- Baú do Tempo permite recuperação parcial conforme o espaço disponível, mantendo o restante sem duplicar recompensa.
- Relatório de caçada mede abates, experiência, ouro, materiais, poções e mortes. Bancos de benchmarks são temporários em memória e não mexem nos personagens reais.

## O que foi medido e o que ainda não está equilibrado

- Ciclo de três classes: 1.422 lutas de escolhas, 168 comparações de investimento e 72 sessões de farm/perfis.
- Diagnóstico do Bárbaro: 520 cenários contra Ignis. Regeneração 8→10 eliminou espera por recurso, mas ganhou só uma vitória em 216 pares; **regeneração de produção continua 8/s**.
- Na build Cutilada/Fúria/Pele, evoluir o truque levou de 0/8 para 4/8 vitórias; fusão para 2/8. Essas lutas têm nível/estoques fornecidos e não medem o tempo para obtê-los.
- Farm com gestão da bolsa: 27 sessões de 30 minutos com recursos ganhos. Preservar ingredientes manteve a primeira fusão em aproximadamente 160–238s nesta amostra. As primeiras expansões observadas ficaram perto de 25–28 minutos; nem toda semente comprou dentro da janela.
- As sessões naturais terminam perto do nível 9, com duas vitórias de chefe. Isso **não** demonstra progressão natural até nível 25/50 ou equilíbrio de longo prazo.
- Gestão de inventário nos benchmarks simula decisões do jogador; não foi criada uma função de compra/venda automática de bolsa no jogo.

Relatórios reproduzíveis:

- [Ciclo das três classes](CICLO_TRES_CLASSES_2026-11-11.md).
- [Bárbaro contra Ignis](DIAGNOSTICO_BARBARO_IGNIS_2026-11-11.md).
- [Bolsa, Cash e farm](EXPANSAO_BOLSA_E_FARM_2026-11-11.md).
- Os arquivos `EVIDENCIAS_*.json` correspondentes guardam resumos, hipóteses e hashes. Dados brutos grandes ficam no `scratch/` local, ignorado; as ferramentas permitem reproduzi-los.

## Validação e arquivos para revisão

Reexecutados para esta publicação em 12/11:

- `npm run test:server`: **312 aprovados**, incluindo a regressão adicional de pagamentos no armazém.
- `npm run build`: servidor e cliente aprovados.
- `npm run test:inventory`: **30 aprovados**, reexecutados após a integração.
- `npm run test:automatic`: 11 testes do servidor e três de UI aprovados, com movimento do cliente restrito ao armazém.
- VFX/apresentação: 53 testes aprovados após o merge.
- `npm test`: aprovado; catálogo visual validou os 84 PNGs canônicos distintos de 512×512 e a resolução dos aliases legados.
- Auditoria do catálogo: 12 IDs canônicos por classe, 84 efeitos disponíveis no total, sem contar aliases duplicados.

Continuam os avisos preexistentes de assets `wing-left.svg`/`wing-right.svg`. A prévia móvel usa o módulo real com transporte simulado, claramente identificada como teste; compras e persistência foram validadas em SQLite temporário. A loja real ainda exige integração independente.

Principais pontos de revisão:

| Área | Arquivos |
|---|---|
| Regra e protocolo da bolsa | `shared/src/inventory-expansion.ts`, `shared/src/messages.ts`, `shared/src/items.ts` |
| Transações e autorização | `server/src/database/DatabaseManager.ts`, `server/src/game/World.ts`, `server/src/network/PacketHandler.ts` |
| UI e rede | `client/src/ui/InventoryExpansion.ts`, `client/src/network/ClientNetwork.ts`, `client/src/main.ts`, `client/index.html`, `client/src/ui/inventory-view.css` |
| Medição | `server/tools/ProgressionSimulation.ts`, `BossInvestmentSimulation.ts`, `InventorySimulationPolicy.ts` e `benchmark-{core-classes,barbarian-diagnostics,inventory-progression}.ts` |
| Regressões | Testes de expansão/transações, política de inventário, investimentos e progressão; fixtures de browser da bolsa |

## Cuidados nas próximas contribuições

1. Conferir status, branch, banco local e posse dos arquivos antes de editar; usar worktree separado se houver outro agente trabalhando.
2. Partir da master atualizada, que já contém esta integração; não fazer cópia de árvores antigas nem push forçado.
3. **Preservar as artes novas, armazém, livro do inventário, HUD e perfil do Antigravity.** Novas mecânicas devem se adaptar à apresentação existente.
4. Revisar sobreposições em `main.ts`, `index.html`, `World.ts`, `PacketHandler.ts` e `shared/src/messages.ts`. Registrar decisões reais de mecânica e reexecutar as regressões afetadas.
5. Em conflito de mecânica, apresentar cada caso ao usuário antes de decidir. Preservar as regras aprovadas de AUTO apenas para magias, pontuação de equipamento e bolsa sem nível com pagamentos acima de 35.
6. Rodar build e testes de inventário/automação/combate/armazém. Os resultados deste handoff valem para esta integração, não antecipam validação de alterações futuras.

Fora do commit: `server/data/magicforge.db` ativo, journals, backups/scratch, arquivo `.rar` pessoal e a alteração local preexistente de `Docs/HANDOFF_BAU_DO_TEMPO_UI_2026-11-03.md`. Sem publicação de segredos, credenciais ou banco de jogadores.
