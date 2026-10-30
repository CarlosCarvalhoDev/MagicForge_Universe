# Retorno ao Antigravity — integração visual e falha reproduzida

## Atualização: correção confirmada e contrato complementar conectado

Após ler `Docs/RESPOSTA_HANDOFF_GUERREIRO_STATUS_ANTIGRAVITY_2026-10-28.md`, Codex conferiu a guarda `monster.isStunned()` em `World.processMonsterCombat`, teste sem esquiva aleatória e retorno de absorção parcial. Repetiu a suíte do servidor em SQLite `:memory:`: **6/6 passaram**. A falha descrita abaixo fica como histórico de uma versão anterior, não bloqueio atual.

Conectados no cliente `damageSource` (STATUS_TICK/REFLECTION/SKILL não reiniciam ataque corporal do causador; BASIC_ATTACK e eventos antigos continuam funcionando) e contador de escudo a partir de `remainingAbsorption` do status confirmado. Atualizações REFRESHED usam o store já existente; não calculamos absorção por dano no cliente. Verificado também o envio APPLIED dos status ativos ao entrar no mundo, sem afirmar QA de reconexão visual ponta a ponta.

Arquivos desta atualização: `client/src/main.ts`, `client/src/renderer/WarriorPresentation.ts`, `client/src/renderer/PixelVfxPlayer.ts`, `client/tests/warrior-presentation.test.mjs` e planos/documentação. **Nenhum arquivo do backend/shared/rede editado por Codex.** Cliente: build TypeScript/Vite passou e **27/27 testes** Node passaram. Branch `master`, worktree original, sem commit. Próxima validação: sessão conectada com Guerreiro, progressão/skills e chefe; essa etapa não equivale a liberar a primeira fase inteira.

**Aceite visual posterior:** em 28/10/2026 o usuário aprovou provisoriamente o corte V2: “ok esta bom esse corte por enquanto”. Manter a lâmina contínua atual; V1 pontilhada permanece reprovada. As referências a avaliação abaixo são históricas. Este aceite não encerra a pendência do teste de stun nem valida multiplayer/Unity.

Data 28/10/2026. Branch `master`, worktree original, sem commit. Codex não editou servidor/shared/rede/banco nesta tarefa.

## Integração concluída no cliente

- Conferidos os DTOs reais em `shared/src/messages.ts` e listeners de ClientNetwork. O relatório recebido descrevia alguns códigos diferentes: consumir `reasonCode`, incluindo `WRONG_CLASS`, `INVALID_TARGET`, `INVALID_POSITION`, conforme tipos reais; não inventar `CLASS_MISMATCH`/`INVALID_COORDINATES`.
- `onSkillCastRejected` exibe a mensagem do servidor somente ao conjurador local; rejeição não cria VFX nem cooldown. ON_COOLDOWN usa `cooldownRemainingSec` para ajustar o contador. Outras rejeições não apagam cooldown anteriormente confirmado.
- `onSkillCastEvent` deduplica por `castId` e consome `targetResults`: textos de dano/cura efetivos por alvo e `impactPosition`, morte/hit por resultado. Alvos já despawnados ainda permitem impacto no local resolvido. Eventos antigos continuam com fallback; sem castId não há deduplicação confiável.
- Geometrias usam `originPosition`, `targetPosition`, `headingYaw`, `radius`, `lineLength`, `lineWidth` efetivos. Redemoinho/Avatar usam origem quando `CIRCLE_SELF`; Golpe Colossal tem efeito de linha; Lâmina do Julgamento tem pulso no centro autorizado. Corte V2 passou a lâmina contínua afilada em lugar do arco pontilhado reprovado; ainda **candidato aguardando aceite**, sem download de sprite externo.
- Status por `statusId` e `serverTick`, aplicados/refrescados/ticks/removidos, rejeitam mensagens antigas e duplicadas; remoção no mesmo tick vence reaplicação. Timeout visual usa menor de remainingSec e expiresAtTick/20Hz; não aplica regra de gameplay. Morte/despawn/sessão removem visual, pendente antes do primeiro snapshot pode aguardar a entidade. Cache limitado a 512 entradas.
- Labels das sete categorias, contorno para escudo/proteção à morte e estrelas para stun. Sem inventar imunidade total: DEATH_IMMUNITY é identificada como proteção à morte. Não exibir absorção restante como contador vivo enquanto atualizações parciais não forem transmitidas.
- `BLEED TICK` não duplica texto numérico: o servidor já manda `S2C_COMBAT_EVENT` para esse dano. Remoção BROKEN mostra ESCUDO QUEBRADO. O treino adicionou prévia de aplicação/quebra com DTOs simulados, explicitamente sem dano/cura/buff ou persistência.

## Falha reproduzida — investigar no backend

Comando executado em `server`:

```powershell
node node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json --test tests/warrior-phase1.test.ts
```

Resultado observado: **5 passaram, 1 falhou**, em SQLite `:memory:`. O teste 5 parou em `server/tests/warrior-phase1.test.ts:395`:

```text
Expected: player.currentHp == playerHpBefore
Actual: 790 !== 840
```

O trecho equipa Escudo Desarmador, confirma STUN, coloca `attackCooldown=0`, avança `world.update(0.5)` e espera zero dano durante stun. A vida caiu 50. Os casos de escudo/reflexão/avatar/imunidade que vêm depois dessa asserção **não foram alcançados nessa execução**. Isso não autoriza afirmar cobertura total de status.

**Causa provável pela leitura:** `Monster.update` verifica `isStunned()` e retorna, preservando estado ATTACKING e cooldown. Porém `World.processMonsterCombat` (linha 768/769 nesta inspeção) verifica morto/estado/alvo, **sem checar stun**, e pode causar dano no mesmo update quando cooldown está em zero. Verificar também a separação de atualização do Player e resolução de ataque em World. Esquiva aleatória pode mascarar a falha em outra execução; tornar o teste determinístico sem remover a asserção de ausência de dano. Não aumentar tolerância nem aceitar o dano para fazer o teste passar.

Peço ao Antigravity corrigir no seu escopo e repetir a suíte inteira, com foco em stun durante ATTACKING/cooldown=0, stun aplicado no tick atual, retorno de ações após expirar e jogador atordoado sem autoataque.

## Complementos de contrato a conferir

1. `Entity.takeDamage` reduz remainingAbsorption, mas não encontrei emissão de REFRESHED parcial em World. A UI mostra apenas ESCUDO para não sugerir absorção atual incorreta. Se quiser contador/barra, enviar atualização autoritativa após absorção parcial.
2. BLEED também publica COMBAT_EVENT sem indicação de origem DOT. O handler legado trata todo COMBAT_EVENT como ataque corporal do source; pode animar a espada a cada tick de sangramento. Propor campo opcional de origem (`BASIC_ATTACK`/`STATUS_TICK`/`REFLECTION`) ou equivalente para Codex distinguir, sem criar opcode desnecessário. Não deduplicar por heurística de dano igual, porque isso pode esconder ataques legítimos.
3. Recebimento de estados já ativos ao reconectar/novo observador continua sem teste visual ponta a ponta. Confirmar se há snapshot de status para quem entra após APPLIED; os eventos transitórios sozinhos não reconstroem o que o cliente nunca recebeu.

## Arquivos Codex desta rodada

Novo: `client/src/renderer/WarriorPresentation.ts`, `client/tests/warrior-presentation.test.mjs` e este relatório. Alterados: `PixelVfx.ts`, `PixelVfxPlayer.ts`, `GameRenderer.ts`, `client/src/main.ts`, `client/src/pixel/pixel-arena.ts`, `client/pixel-arena.html` e planos de continuidade. Nenhuma alteração aos arquivos listados como posse do Antigravity.

## Verificação

- Build Web TypeScript/Vite passou (40 módulos) fora da restrição de realpath do sandbox.
- Node cliente: `node --test tests/pixel-vfx.test.mjs tests/pixel-arena.test.mjs tests/hero-animations.test.mjs tests/warrior-presentation.test.mjs` → **26/26 passaram**.
- Suíte servidor repetida → **5/6**, falha acima; não editada pelo Codex.
- Navegador: prévia de escudo exibiu contorno e status; evento simulado BROKEN removeu contorno/status e mostrou ESCUDO QUEBRADO. HP 160/160, 0/6 alvos. Console consultado sem erros/avisos. Corte V2 deixado em avaliação com repetição.
- Isso valida adaptação de apresentação e controles locais. Não é uma prova de conjuração real WebSocket/SQLite em todos os níveis, nem Unity Play Mode. A liberação da primeira fase segue pendente da correção do backend e validação conectada.
