# Entrega: progresso offline e equipamento inicial

Data: 03/11/2026. Branch: `master`, diretório principal `E:\MagicForge_Universe`.

## Comportamento entregue

- Gratuito: até 8 horas de tempo recompensado por baú. O backend define o limite e o envia ao cliente.
- Premium futuro: política de 12 horas definida e testada no cálculo. Nenhum jogador recebe esse benefício agora; falta implementar a fonte confiável de assinatura/entitlement. O cliente não pode escolher o plano.
- Limiar inicial preservado: 5 minutos. Fórmulas de ouro/EXP preservadas nesta etapa; a relação com rendimento de combate ainda será medida.
- Materiais continuam a cada 15 minutos, limitados a dez intervalos (2h30), conforme regra existente. Esse teto é independente do teto de ouro/EXP e ainda depende de balanceamento.
- Minério offline corrigido para `ore_iron_arcane`, do catálogo real; o ID anterior `iron_ore` não existia.
- Baú não resgatado é persistido no SQLite, sobrevive ao reinício e pode acumular a nova ausência até o teto total do próprio baú. O tempo online não é adicionado nas trocas de canal.
- Ouro, EXP, materiais e limpeza da pendência são gravados em uma única transação. Falhas revertem banco e estado do personagem; nenhum aviso de level up é enviado antes do commit.
- Mochila cheia mantém o baú disponível; o resgate usa a capacidade expandida e divide poções em pilhas válidas. O modal permite abrir a mochila e o dock permite reabrir o baú.
- Parâmetro de multiplicador enviado pelo cliente é ignorado. Resgate duplicado, inclusive por cópia antiga em outra sessão, não concede outra recompensa.
- Kit inicial de guerreiro/bárbaro e arqueiro corrigido para armas existentes de nível 1. Os quatro kits jogáveis foram verificados quanto à possibilidade de equipar.
- Chave ausente em `.btn-claim-offline:active` corrigida no CSS; o erro já existia na branch e impedia o build.

## Persistência e integração

Migração aditiva: coluna nullable `characters.pending_offline_reward`, contendo o snapshot do baú. É criada na inicialização do `DatabaseManager` quando ausente; não remove dados nem altera colunas existentes. Os testes usam bancos em memória e arquivos temporários; o banco real do projeto não foi aberto para migração nesta entrega.

Reiniciar o servidor com o novo código aplicará a migração e o limite gratuito de 8h. A mudança exige atualizar o cliente para exibir o limite correto. O campo de protocolo `maxOfflineSeconds` é aditivo e opcional para compatibilidade; o cliente novo usa 8h quando conversa com um servidor que não o envia.

Como a versão anterior mantinha baús somente em memória, um baú já aberto no processo antigo não pode ser migrado a partir do banco. Evitar atualizar esse processo com jogadores segurando resgates pendentes; coletá-los antes da atualização. A persistência nova protege os baús gerados pela versão nova.

## Arquivos desta implementação

| Arquivo | Mudança |
| --- | --- |
| `server/src/game/OfflineRewards.ts` | Novo cálculo e política offline |
| `server/src/game/World.ts` | Geração, sincronização e resgate atômico |
| `server/src/game/WorldManager.ts` | Timestamp de desconexão real |
| `server/src/entities/Player.ts` | Estado persistível e controle da avaliação por sessão |
| `server/src/database/DatabaseManager.ts` | Migração, persistência, transação e correção dos kits |
| `shared/src/messages.ts` | Limite enviado ao cliente e tipo do snapshot |
| `client/src/ui/OfflineRewardModal.ts` | Limite dinâmico, falha recuperável, organização da mochila e reabertura |
| `client/src/main.ts` | Acesso ao baú pendente pelo dock e abertura da mochila |
| `client/src/ui/progression.css` | Fechamento da regra CSS que quebrava o build |
| `server/tests/offline-policy.test.ts` | Novo: limites, fronteiras e acúmulo |
| `server/tests/offline-rewards.test.ts` | Resgate, rollback, persistência, pilhas e duplicação |
| `server/tests/starter-equipment.test.ts` | Novo: arma inicial válida e equipável para quatro classes |
| `client/tests/offline-rewards-ui.test.mjs` | Formatação e comportamento após resposta de resgate |
| `package.json` e `server/package.json` | Comandos reproduzíveis para testes do servidor e offline |
| `Docs/BASE_ESTUDO_MECANICAS_IDLE_CODEX.md` | Atualização de estado e correção aritmética da tabela histórica de EXP |
| Este documento | Entrega e próximos passos |

O handoff do Baú do Tempo, que já estava modificado, e o benchmark do colaborador foram preservados. Não houve commit, merge ou push.

## Validação

Resultados finais:

- `npm run test:server`: 37/37 testes passaram, incluindo offline, kits, combate, canais e party.
- `npm run test:offline`: 14/14 testes do servidor e 3/3 da interface passaram. Os 14 do servidor também integram a suíte completa acima.
- `npm test`: 24/24 testes da suíte padrão do cliente passaram.
- `npm run build`: TypeScript do servidor e cliente e Vite de produção concluíram com sucesso. O primeiro build revelou a chave CSS ausente; os builds após a correção passaram.
- `git diff --check` restrito aos arquivos desta implementação: sem erros de whitespace. O handoff pré-existente foi excluído desta verificação de entrega.

O Vite ainda avisa sobre `wing-left.svg` e `wing-right.svg` ausentes; isso não impediu o build e depende da frente visual. O Node também emite aviso de tipo de módulo nos testes `.mjs` que importam TypeScript. Nenhuma dessas configurações foi alterada nesta implementação.

Validação manual pendente: aparência do limite, abrir mochila pelo modal e reabrir baú pelo dock em desktop e celular. Nenhum teste automatizado nesta entrega equivale a playtest de diversão, ritmo econômico ou validação de assinaturas.

## Próxima etapa

Implementar relatório autoritativo de caçada: duração, monstros abatidos, EXP recebida, ouro coletado, gasto de consumíveis e mortes. Separar receitas de combate de vendas/resgates para que os números não inflem a eficiência aparente da build. O primeiro objetivo é medir o jogo real antes de trocar suas curvas por parâmetros do benchmark.

Depois, calibrar custos e recompensas para o ciclo farm → melhoria → chefe e avaliar regras condicionais/pull. Mudanças grandes de arquitetura, monetização e balanceamento serão propostas com impacto explícito, conforme `AGENTS.md`.
