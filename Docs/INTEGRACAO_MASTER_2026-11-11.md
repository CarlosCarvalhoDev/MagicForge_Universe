# Integração da master — 11/11/2026

Origem integrada: `origin/master` em `cc7db18`, sobre a base local `c2aadcd` e o trabalho de habilidades/ícones preservado no commit `5ea7c86`.

## Decisões aprovadas pelo usuário

1. AUTO controla somente a conjuração. Movimento, aquisição de alvo, ataque básico, chefes e portais permanecem automáticos, mesmo com magias manuais. Os controles e a apresentação da contribuição remota foram mantidos; textos e emissão/aceitação de movimento foram adaptados a essa regra.
2. O novo botão “Equipar melhores” usa a pontuação por classe da contribuição remota, podendo sacrificar atributos. A comparação conservadora já existente continua disponível como sugestão; o botão aplica o critério ponderado aprovado.

## Integração

- Preservados os 84 ícones ilustrados das habilidades, a capa, as telas de autenticação e seleção, o palco do herói, os slots de equipamento, HUD responsivo, painel administrativo, sprites e efeitos do Guerreiro da origem.
- Mantidos os efeitos completos de Arqueiro, Monge e Bruxo, além das classes já implementadas, os ícones de itens e as mecânicas de inventário locais.
- Os dois conflitos de texto de `client/src/main.ts` foram resolvidos com os slots e efeitos visuais remotos. A animação de impacto preserva a exclusão do próprio conjurador no caminho legado e respeita os impactos atrasados da nova apresentação.
- A contribuição remota adiciona `accounts.is_admin`, com valor padrão 0, por migração aditiva; nenhuma conta é promovida automaticamente. O painel valida a permissão no servidor.
- Banco ativo, documento local de handoff e arquivo `.rar` não entram nos commits. Backup consistente do SQLite e cópia dos arquivos locais ficam em `scratch/runtime/`.

## Arquivos principais combinados/adaptados

`client/src/main.ts`, `client/src/ui/SkillRotation.ts`, `client/src/renderer/{GameRenderer,PixelVfx,PixelVfxPlayer}.ts`, `server/src/game/World.ts`, `server/src/entities/{Monster,Player}.ts`, `server/src/network/PacketHandler.ts`, `shared/src/messages.ts` e os testes de automação. Os demais arquivos remotos de arte/layout foram incorporados sem substituição por versões locais.

## Validação

- `npm run test:server`: 295 testes aprovados.
- `npm run test:automatic`: 11 testes de servidor e 3 de interface aprovados, incluindo perseguição e rejeição de movimento por clique com magias manuais.
- `npm test`: aprovado.
- `node --test client/tests/*vfx.test.mjs client/tests/warrior-world-fx.test.mjs client/tests/warrior-presentation.test.mjs`: 52 testes aprovados.
- `npm run build`: servidor e cliente aprovados. Permanecem os avisos preexistentes dos arquivos `wing-left.svg` e `wing-right.svg`.

## Limites e validação manual

O boneco administrativo indestrutível é uma ferramenta de treino, não uma referência de balanceamento: habilidades que medem perda real de HP não devem ser calibradas a partir dele. Os benchmarks continuam usando monstros normais.

Validar no desktop e no celular as novas telas, imagens, a ordem das habilidades, AUTO desligado e o botão de equipamento com os personagens reais. Os testes automatizados não substituem essa revisão visual. Não houve push para o remoto nesta integração.

Branch de integração: `codex/integracao-master-2026-11-11`, no diretório raiz, de forma sequencial.
