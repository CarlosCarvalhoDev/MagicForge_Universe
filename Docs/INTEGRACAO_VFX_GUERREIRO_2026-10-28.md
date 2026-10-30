# Primeira integração VFX do Guerreiro — 28/10/2026

**Histórico da primeira entrega:** para o estado atual das 12 escolhas, status, eventos reais e revisão visual, ler [REVISAO_VFX_GUERREIRO_2026-10-30.md](./REVISAO_VFX_GUERREIRO_2026-10-30.md). As limitações de quatro mapeamentos e ausência de contratos descritas abaixo pertencem à etapa inicial.

Branch `master`, worktree original; sem commit. Implementação visual autorizada enquanto Antigravity adapta servidor/shared/rede. Nenhuma alteração desta entrega nessas áreas, banco ou Unity.

## O que entrou

- Player de VFX com fila limitada a 64 instâncias, expiração, captura de posição, seguimento de entidade viva e limpeza. Efeitos de impacto continuam por seu curto tempo no local capturado mesmo após despawn; cura/escudo de prévia ligados à entidade cessam se ela morre/desaparece.
- Duas folhas CraftPix originais: `1 Magic/8.png` → `vfx/heal.png` (576×72, oito células de 72 px) e `1 Magic/4_2.png` → `vfx/impact.png` (288×72, quatro células). Nenhum pixel do fornecedor alterado. SHA256/origem em `vfx/provenance.json`. Timing inicial de **10 FPS escolhido para esta integração**, não declarado pelo fornecedor. Aceite artístico de timing permanece manual.
- Cortes, arcos do redemoinho, onda do Avatar, brilho de level up e contorno de escudo feitos com primitivas Canvas quantizadas. São efeitos desenhados por código no runtime, não folhas do fornecedor nem poses recicladas. Não foi usado gerador de imagem para editar CraftPix.
- As habilidades padrão `guerreiro_truque_1`, `guerreiro_nv1_1`, `guerreiro_nv2_1` e `guerreiro_nv3_1` ganham respectivamente corte, pulso de cura, redemoinho e onda do Avatar após `onSkillCastEvent`. Nenhum dano, cura, cooldown ou buff é aplicado pelo player visual. Nenhum status persistente é inferido do cast. O efeito requer alvos confirmados em `affectedEntityIds`; cura requer o conjurador nessa lista. O centro fornecido pelo servidor tem prioridade; posições ausentes usam entidade/centro disponível, preservando `(0,0,0)`.
- `addDamageText` também aciona impacto quando há dano positivo e não esquivado; `addLevelUpEffect` aciona partículas decorativas. `resetNarrative` limpa a fila ao reset da sessão conforme o fluxo existente.
- A arena de treino ganhou botões de prévia para corte, cura, redemoinho, Avatar, escudo e level up, com repetição opcional, explicitamente sem efeito de gameplay. Reiniciar limpa efeitos/repetição. Ataques de treino mostram cortes/impactos; combate de treino permanece isolado do multiplayer.

## Fronteiras e pendências

Só quatro das 12 escolhas possuem mapeamento de conjuração nesta entrega. Escudo é **apenas uma prévia curta**, não prova de Baluarte funcional no backend. Sem auras persistentes, sangramento, imunidade, buff real ou VFX das oito escolhas restantes até o contrato autoritativo do Antigravity.

O evento atual não fornece ID de cast, fases/tempo de impacto nem resultados completos por alvo. Não há deduplicação por castId ou reconstrução exata de todos os alvos removidos. A fila limitada evita crescimento indefinido, mas não substitui deduplicação de rede. O poder em `damageOrHeal` continua sendo texto legado; a correção de cura/dano efetivos depende do backend. A posição resolvida de AoE e o instante real do impacto devem ser reconferidos após o handoff. Não testar multiplayer contra o banco compartilhado para fabricar evidência.

Não foi acrescentada nova simulação de skills à arena: os botões são prévia visual, sem desbloquear skills reais no nível 1. A onda usa dimensões decorativas e não define área de acerto ou colisão. Unity Play Mode e conjurações reais com os quatro níveis ainda pendentes.

## Arquivos desta entrega

- Novos: `client/src/renderer/PixelVfx.ts`, `PixelVfxPlayer.ts`, `client/tests/pixel-vfx.test.mjs`, `client/public/assets/pixel/craftpix/vfx/{heal.png,impact.png,provenance.json}`, este relatório.
- Alterados: `client/src/renderer/GameRenderer.ts` (player/métodos de VFX, impactos, level up e reset); `client/src/main.ts` (ligação do callback, alvo confirmado para hit e remoção do sentinela zero de posição); `client/pixel-arena.html`, `client/src/pixel/pixel-arena.ts`, `pixel-arena.css` (prévia); aviso de licença e planos.
- As demais alterações preexistentes em `main.ts` e no repositório foram preservadas. `PracticeArena.ts`, servidor, shared e ClientNetwork não foram editados nesta tarefa.

## Verificação real

- `node --test tests/pixel-vfx.test.mjs tests/pixel-arena.test.mjs tests/hero-animations.test.mjs` em `client`: **21/21 passaram**, incluindo sete testes novos de planejamento, origem zero, cast vazio/desconhecido/status, cura confirmada, expiração/limite/reset, seguimento/morte/despawn e hashes/grades dos PNGs. Aviso preexistente MODULE_TYPELESS_PACKAGE_JSON sem falhas.
- `npm.cmd run build`: TypeScript passou; Vite esbarrou em EPERM ao ler CSS no sandbox. Repetido fora dessa restrição: passou, 39 módulos e três entradas compiladas. Nenhuma dependência adicionada.
- Navegador em `pixel-arena.html`: seis botões e repetição responderam; HP manteve **160/160** e contagem **0/6** após prévias; console consultado sem erros/avisos. Captura da prévia salva. Isso valida o player visual e não as mecânicas reais das skills.

Próximo passo após o handoff: comparar os DTOs efetivamente entregues, consumir os resultados/posições/tempos do servidor, acrescentar lifecycle de status e verificar as quatro skills no jogo conectado antes de ampliar as outras oito.
