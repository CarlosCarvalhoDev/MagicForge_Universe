# Integração das contribuições — 04/11/2026

Integração autorizada pelo usuário: buscar contribuições do colaborador, reunir na master e publicar nosso trabalho em uma branch no GitHub.

## Histórico reunido

As contribuições já publicadas em `origin/master` foram incorporadas integralmente:

- `28990eb`: assets, animações e apresentação do Bárbaro.
- `589be8f`: HUD, apresentação compacta/expandida de combate e chat recolhível.
- `4096ad7`: apresentação interativa de classes e capa responsiva da entrada.
- `f0b8d06`: guia canônico do design rúnico.

Nosso trabalho anterior foi preservado no commit `a8b9b12`, branch `codex/idle-mechanics-2026-11-04`: automação no servidor, offline gratuito de 8h, segurança de resgate, relatório de caçada, controle de conjuração AUTO/MANUAL, evolução das habilidades e testes/documentação.

A integração foi preparada separadamente na worktree `scratch/integration-2026-11-04`, branch `codex/integration-idle-2026-11-04`. O histórico dos dois colaboradores é preservado por merge, sem rebase ou force push. A master local recebe esse resultado por fast-forward.

## Resolução de sobreposições

Conforme orientação explícita do usuário, **o layout do colaborador tem prioridade**. Isso foi registrado em `AGENTS.md` e na diretriz de gameplay.

- Mantidos HUD compacto/expandido, pilha de habilidades quadradas, ataque básico separado, chat, seleção de classes, molduras e assets recebidos.
- Removidos os nossos overrides que reposicionavam a barra de combate e o chat.
- Os controles visuais AUTO/MANUAL do colaborador agora sincronizam a preferência de **conjuração de magias** no servidor. Movimento, ataque básico e avanço continuam automáticos.
- O botão AUTO compacto desativa a conjuração automática e abre a apresentação expandida. O botão de reativar liga novamente as magias e retorna à apresentação compacta. A mudança visual aguarda confirmação do servidor.
- Ordem de habilidades é aplicada dentro do contêiner de habilidades do layout recebido. A aba Ciclo automático e os upgrades do Grimório foram preservados.
- Atalho do Grimório e tecla A funcionam com os novos controles. Não foram reintroduzidos joystick, movimento manual ou loop de autoplay no navegador.
- O teste novo do Bárbaro importava um script ausente de `.agents/scripts`. Foi incluído um leitor PNG de teste em `client/tests/helpers/png-rgba.mjs`, usando somente `node:zlib`, para manter a verificação real dos sprites sem depender de arquivo local não versionado.

## Arquivos ajustados para integrar

- `AGENTS.md`, `Docs/DIRETRIZ_IDLE_100_AUTOMATICO.md` e este relatório.
- `client/index.html`, `client/src/main.ts`, `client/src/ui/progression.css`: conflitos conciliados priorizando a apresentação recebida.
- `client/src/ui/SkillRotation.ts`, `client/src/ui/automatic-play.css`: adaptação das mecânicas aos controles recebidos.
- `client/tests/skill-rotation-ui.test.mjs`, `client/tests/runic-ui-layout.test.mjs`: cobertura da preferência e do layout prioritário.
- `client/tests/barbarian-presentation.test.mjs`, `client/tests/helpers/png-rgba.mjs`: dependência de teste tornada reproduzível.
- `package.json`: scripts de teste dos dois conjuntos preservados pelo merge.

Os demais arquivos e assets novos foram recebidos pelos commits do colaborador; os 51 arquivos do nosso bloco anterior estão identificados no commit `a8b9b12`.

## Validação

- `npm run build`: servidor e cliente aprovados; permanecem avisos existentes de `wing-left.svg` e `wing-right.svg`.
- `npm run test:server`: 69/69 aprovados.
- `npm test`: 36/36 aprovados, incluindo os 12 testes recebidos do Bárbaro.
- `npm run test:skills`: 12/12 aprovados (9 já incluídos na suíte do servidor e 3 específicos da interface).
- Testes de rotação, caçada e modal offline: 9/9 aprovados. O teste de rotação também valida que a apresentação só muda após confirmação e que o botão recebido de reativar envia a preferência correta.

## Dados locais e limites

O banco local de jogadores não faz parte do commit do nosso trabalho. Antes de atualizar a pasta principal, é feito backup consistente em `scratch/runtime/`. A versão de banco recebida pelo Git fica preservada na worktree e no histórico; o banco local continua sendo usado no ambiente de desenvolvimento.

A alteração preexistente de uma linha em branco em `Docs/HANDOFF_BAU_DO_TEMPO_UI_2026-11-03.md` permanece local, sem ser descartada ou incluída silenciosamente no nosso commit.

Resta validar visualmente no desktop e no celular a combinação das novas telas com o personagem real. Testes automatizados de assets não substituem revisão visual da alternância das pernas das animações. O balanceamento econômico e a comparação de investimentos contra chefes continuam sendo o próximo bloco de gameplay.
