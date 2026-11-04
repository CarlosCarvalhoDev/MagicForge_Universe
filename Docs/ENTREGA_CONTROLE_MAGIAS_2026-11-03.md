# Controle AUTO / MANUAL de magias

Implementado na branch master, pasta E:/MagicForge_Universe, sem commit.

## Resultado

Botão acima da barra e opção no Grimório controlam somente conjuração automática. Ordem e preferência são confirmadas pelo servidor e persistidas por personagem. Movimento, ataque básico e avanço continuam automáticos. Ataque básico não consome seu temporizador tentando atingir um alvo que a magia acabou de matar.

## Arquivos deste bloco

- client/index.html
- client/src/main.ts
- client/src/network/ClientNetwork.ts
- client/src/ui/SkillRotation.ts
- client/src/ui/automatic-play.css
- client/tests/skill-rotation-ui.test.mjs
- server/src/entities/Player.ts
- server/src/database/DatabaseManager.ts
- server/src/game/World.ts
- server/tests/automatic-gameplay.test.ts
- shared/src/messages.ts
- Docs/DIRETRIZ_IDLE_100_AUTOMATICO.md
- Docs/ENTREGA_CONTROLE_MAGIAS_2026-11-03.md
- server/data/magicforge.db: adição não destrutiva da coluna auto_cast_enabled, após backup consistente em scratch/runtime.
- scratch/runtime/services.json e logs ignorados pelo Git: backend PID 39692, Vite PID 36508.

As alterações anteriores do projeto foram preservadas.

## Verificação real

- npm run test:automatic: 10 testes de servidor e 2 de cliente passaram.
- node --test client/tests/skill-rotation-ui.test.mjs: 3 passaram após adicionar teste de confirmação, falha e sincronização dos controles. Um erro inicial na limpeza do fixture foi corrigido antes desta execução.
- npm run build: servidor TypeScript e cliente TypeScript/Vite passaram; avisos existentes sobre wing-left.svg e wing-right.svg.
- Navegador em 390 × 844: barra centralizada, botão acima e quatro habilidades na mesma linha. Nenhuma sessão de jogador criada pelo teste visual.
- Rede local: página HTTPS 200 com os novos controles; health HTTP 200; WebSocket com PONG; coluna SQLite presente.
- git diff --check: aponta apenas linha em branco no final de Docs/HANDOFF_BAU_DO_TEMPO_UI_2026-11-03.md, alteração preexistente preservada.

## Validação manual restante

Reabrir https://192.168.1.12:5173/ no celular para atualizar o HTML da aba antiga. Validar aparência no aparelho real e alternar AUTO/MANUAL após entrar com o personagem. A causa da tela antiga no aparelho não foi confirmada; o servidor atual e a simulação responsiva entregaram a barra nova.

Servidor atualizado sem conexões ativas e deixado rodando. Nenhuma regra de firewall alterada.
