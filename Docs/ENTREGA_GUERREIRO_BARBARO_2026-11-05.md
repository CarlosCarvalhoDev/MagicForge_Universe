# Guerreiro revisado e efeitos do Bárbaro — 05/11/2026

## Guerreiro: correções incrementais

Preservados os caminhos específicos das habilidades, fórmulas, equipamentos, FOR+CAR do ataque básico, slots e layout.

- Sangramento deixa de causar dano quando o conjurador morre ou sai do mundo. A saída remove o efeito imediatamente; não há morte/recompensa atribuída a jogador ausente.
- Atualizações longas resolvem os pulsos pendentes dentro da duração restante, sem perder pulsos nem continuar além dos três segundos. O dano por pulso existente foi preservado.
- Golpe Colossal mantém o empurrão de 1,5m, limitando a posição aos limites do mapa e atualizando o índice espacial.
- Última Resistência pode entrar preventivamente no automático com HP cheio. A onda respeita bônus de dano ativos e sua potência agora entra no total do evento, junto à cura.
- Validado que reflexão que mata um chefe reconhece vitória, abre o portal e recompensa uma única vez. A correção do fluxo de morte refletida já havia sido aplicada no lote inicial do Mago; este lote acrescenta o caso específico do Guerreiro com chefe.
- Absorção/reflexão do Baluarte e demais efeitos existentes foram preservados. Não foi igualada silenciosamente sua política de reflexão à do Escudo do Mago.

## Bárbaro: 12 efeitos implementados

Mantido o bônus de base `6 + 4 × nível` que o fallback já usava nos ataques, explicitando-o no catálogo ao introduzir os coeficientes próprios. Não foi removida a curva de nível para fazer as descrições parecerem mais simples. Custos, cooldowns base e desbloqueios foram preservados.

| Habilidade | Comportamento atual |
|---|---|
| Cutilada Selvagem | 1,4 × FOR + base de nível. |
| Pisotão Sísmico | 1,2 × FOR + 0,4 × CON + base; lentidão de 30% por 3s, sem somar com outras lentidões. |
| Mordida Voraz | 1,3 × FOR + base; cura 20% do HP efetivamente retirado, sem cura por overkill ou dano absorvido. |
| Fúria Primitiva | Preservados dano +25% e redução recebida de 15% por 6s, sem empilhamento. |
| Rugido Desmoralizador | Área pessoal de 5m: reduz ataque dos inimigos em 20% por 6s, sem dano direto. Evolução aumenta a redução (ex.: 21% no rank 2), preservando utilidade de ranks já comprados. |
| Carga do Juggernaut | Desloca o herói até ficar a 1,5m do alvo; 1,75 × FOR + base e atordoamento de 2s. |
| Banho de Sangue | Giro pessoal de 5m, 2,4 × FOR + base; três pulsos de sangramento de 0,35 × FOR + nível, com evolução e bônus capturados na conjuração. |
| Pele Rochosa Ancestral | Cura base de 15% do HP máximo e redução de dano de 20% por 6s. Evolução aumenta a cura. Usa a maior proteção ativa, sem somar com Fúria/Santuário. Pode ser usada preventivamente no automático. |
| Salto dos Titãs | Deslocamento para ponto no chão até 6m, dentro dos limites do mapa; impacto de 2,6 × FOR + base em raio de 5m. Destino inválido não cobra recursos nem cooldown. |
| Cólera do Vulcão | Área pessoal de 7m, 3,9 × FOR + 2 × CON + base. Após pagar a ativação, habilidades ficam sem custo de energia por 6s; alvo, nível e cooldown continuam sendo validados. O cliente mostra `0 EN` enquanto o status estiver ativo. |
| Guilhotina do Cataclismo | 5,2 × FOR + base contra um alvo; dobra dano somente quando o HP anterior ao impacto está estritamente abaixo de 30%. |
| Matilha Espectral Ancestral | Aura espiritual pessoal de 6m por 10s; potência total de 4,2 × FOR + base por alvo que permaneça nos dez pulsos de 1s. Sem crítico; acompanha movimento e termina na morte/saída do conjurador. |

Nos ataques, “base” significa `6 + 4 × nível`. Cura percentual, Rugido e Fúria não recebem esse dano base. Evolução aumenta dano/cura/potência de debuff implementados, sem ampliar automaticamente durações ou a janela de energia livre.

Os novos parâmetros antes ausentes no catálogo são uma primeira calibração autoral: lentidão 3s, Rugido 6s, proteção 20%/6s e energia livre 6s. “Fúria infinita” foi explicitada como uma janela finita de ausência de custo, sem energia negativa ou bypass de cooldown.

## Contratos de efeitos e apresentação

- `CRIPPLED`, `WEAKENED`, `STONE_SKIN`, `UNBRIDLED_RAGE` e `SPECTRAL_PACK` usam o protocolo de status existente. Instâncias do mesmo tipo substituem/renovam, sem multiplicar bônus. Lentidões/proteções de tipos diferentes usam o maior valor.
- Sangramento, lentidão e redução de ataque sustentados são limpos quando a fonte sai/morre. Atordoamento segue o ciclo de duração existente. Auras pessoais são removidas com os status do personagem.
- Matilha usa um efeito de área temporal, não entidades de lobos independentes com IA/aggro. Sua apresentação atual é aura/rótulo e números de dano; arte/animação final de lobos não foi criada neste lote.
- Pisotão não apresenta mais o marcador visual de atordoamento. Carga apresenta o controle aplicado; Mordida mostra cura somente se confirmada; Pele apresenta proteção mesmo quando a cura efetiva é zero.
- O custo visual gratuito consulta o estado de apresentação autoritativo, com expiração e limpeza na morte/reconexão. A autorização e cobrança continuam no servidor.
- O executor de área periódica já usado pelos Cometas foi reaproveitado para a Matilha; auxiliares privados de status/limpeza receberam nomes gerais. Sem nova arquitetura, dependência ou migração.
- Nenhuma imagem, `.meta`, GUID, janela ou estrutura de layout foi alterada.

## Testes executados

- `npm run test:server`: **202 testes aprovados**.
- `npm run test:martial`: **27 testes do servidor aprovados** (18 novos + 9 do Guerreiro existente), mais **23 testes de apresentação aprovados**.
- `npm test`: **36 testes do cliente aprovados**; os 12 de apresentação do Bárbaro também aparecem nos 23 acima.
- `npm run test:mage`: **34 testes TypeScript + 9 de VFX aprovados**, incluindo a regressão dos Cometas após o reuso do executor periódico.
- `npm run build`: servidor TypeScript e cliente TypeScript/Vite aprovados. Build final adicional do cliente aprovado após ajustar somente o texto do Salto. Permanecem os avisos existentes dos assets `wing-left.svg`/`wing-right.svg` e de detecção automática de módulo em testes Node com imports TypeScript.
- Verificação de whitespace dos arquivos rastreados aprovada, considerando CRLF como final de linha.

Testes novos cobrem sangramento com atualização longa, expiração/fonte ausente, chefe morto por reflexão, portal/recompensa única, limites do empurrão, imunidade/onda no automático, dreno sem overkill, lentidões sem soma, debuff e evolução do Rugido, Carga, sangramento em área, cura/proteção, salto fora do mapa/fora do chão, energia livre com zero recurso sem ignorar cooldown, limiar de execução, dez pulsos da Matilha e área acompanhando o herói. A suíte existente continua validando as demais habilidades do Guerreiro e Fúria.

## Medição e balanceamento

[Resumo e hashes do código medido](EVIDENCIAS_GUERREIRO_BARBARO_2026-11-05.json). A única alteração posterior à medição foi esclarecer o texto do Salto para o jogador, sem mudança funcional.

- Matriz geral de **420 cenários**: sem mudança de vitória/derrota/timeout em relação ao bloco anterior; zero rejeições de conjuração ou casts vazios detectados.
- Matriz de escolhas: **936 lutas**, 468 por classe. Níveis 10/25/50, nove/27/81 combinações por nível, dois mundos e duas sementes. Zero rejeições/casts vazios detectados.

| Classe | Nível | Casos | Vitórias | Mortes | Timeouts |
|---|---:|---:|---:|---:|---:|
| Guerreiro | 10 | 36 | 32 | 3 | 1 |
| Guerreiro | 25 | 108 | 100 | 0 | 8 |
| Guerreiro | 50 | 324 | 324 | 0 | 0 |
| Bárbaro | 10 | 36 | 19 | 6 | 11 |
| Bárbaro | 25 | 108 | 64 | 3 | 41 |
| Bárbaro | 50 | 324 | 288 | 0 | 36 |

Há diferença relevante entre as classes nessa amostra; não estão declaradas equilibradas. Fixtures usam equipamento inicial e recursos fornecidos, sem compras, não o rendimento real do farm. Não havia matriz anterior dessas mesmas 936 escolhas para atribuir ganho de vitória ao lote. Não comparar níveis/mundos diferentes como se fossem a mesma dificuldade, nem mudar chefes só para elevar a taxa de vitória.

Reprodução na raiz:

```powershell
npm run test:martial
npm run test:server
npm run test:mage
npm test
npm run build
npm run benchmark:martial -- E:/MagicForge_Universe/scratch/runtime/martial-replay.json
npm run benchmark:combat -- E:/MagicForge_Universe/scratch/runtime/martial-combat-replay.json
```

Dados brutos em `scratch/runtime/martial-loadouts.json` e `scratch/runtime/martial-combat.json`, fora do Git.

## Execução, pendências e arquivos

Backend atualizado sem jogadores conectados, com backup consistente em `scratch/runtime/before-martial-1793923721738.db`. Health online a 20 Hz e prévia HTTPS respondendo 200. Hash conjunto das tabelas de personagens, inventário, gemas, cartas e recibos idêntico antes/depois: 7 personagens, 123 registros de inventário, integridade `ok`, zero erros de chave estrangeira.

Validação manual pendente com personagens reais no desktop/celular, especialmente Carga/Salto, custo `0 EN`, Mordida, Rugido e Matilha. Não foi feita nova inspeção visual de gameplay neste bloco; apresentação foi verificada por testes e build. Unity não foi alterado/compilado e ainda precisa consumir os novos status. Balanceamento dos dois personagens com equipamento/refino/fusão e recursos obtidos no farm é a próxima etapa recomendada, antes de ampliar outras classes.

- Novos: `shared/src/martial-effects.ts`, `server/tests/martial-effects.test.ts`, `client/tests/martial-effects-vfx.test.mjs`, `server/tools/benchmark-martial.ts`, este relatório e `Docs/EVIDENCIAS_GUERREIRO_BARBARO_2026-11-05.json`.
- Alterados: `shared/src/index.ts`, `shared/src/messages.ts`, `shared/src/skills.ts`, `shared/src/skill-targeting.ts`, `server/src/entities/Entity.ts`, `server/src/game/World.ts`, `client/src/main.ts`, `client/src/renderer/GameRenderer.ts`, `client/src/renderer/PixelVfx.ts`, `client/src/renderer/PixelVfxPlayer.ts`, `server/package.json`, `package.json`, `Docs/ROADMAP_MECANICAS_IDLE_RPG.md`, `Docs/REVISAO_GUERREIRO_BARBARO_2026-11-05.md`.

Branch/worktree: `master`, `E:\MagicForge_Universe`. Sem commit/push deste lote. Alterações anteriores, layout e pasta de propostas da outra IA preservados. Banco ativo e backups não devem ser incluídos em commit.
