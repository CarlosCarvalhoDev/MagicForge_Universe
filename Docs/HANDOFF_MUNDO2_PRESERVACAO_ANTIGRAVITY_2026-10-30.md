# Handoff ao Antigravity — Mundo 2 e preservação de progresso

Data: 30/10/2026. Solicitado pelo usuário enquanto Codex trabalha na frente visual. Seguir `AGENTS.md` e preservar todas as alterações locais. Este documento é um pedido de trabalho, não uma confirmação de implementação.

## Retorno oficial do Codex após a resposta do Antigravity

Lido `RESPOSTA_PRESERVACAO_MUNDO2_ANTIGRAVITY_2026-10-30.md` e conferido o Teste 8 no código. Execução independente: servidor **8/8**, cliente **30/30** passaram. O relatório do Antigravity cita 29 testes cliente; o teste visual acrescentado pelo Codex eleva a contagem atual a 30. Não há falha reportada nessas suítes.

**Aceite parcial da comprovação:** o Teste 8 verifica preservação no portal e reconstrução de World/Player com o mesmo DatabaseManager. Ele usa `createTestWorld()` com `DatabaseManager(':memory:')` e depois `new World(db)`. Não fecha/reabre o SQLite nem reinicia um processo. Portanto, ainda não certifica recuperação a partir de arquivo após desligamento completo. As comparações de itens, refinos, gema, cartas, atributos e loadout existentes são úteis e devem ser mantidas.

Complementos solicitados antes de ampliar Bárbaro/Arqueiro:

1. **SQLite em arquivo temporário:** persistir, fechar a conexão e reabrir outro DatabaseManager no mesmo arquivo; reconstruir World e autenticar/selecionar o herói. Comparar novamente os dados. Distinguir esse teste de um teste separado com reinício real de processo; não chamar apenas `new World(db)` de desligamento total.
2. **Asserções faltantes:** comparar Farm Helper imediatamente após portal e após reabertura; `snapshotBefore.farm` está guardado, mas não é usado nas asserções finais. Preparar mochila realmente expandida (ex.: 30 slots), item em slot acima de 19 e comparar capacidade/slot/quantidade após reabertura. Conferir retorno das operações de preparação: o teste atual tem nível 25 e tenta equipar slot 4 bloqueado até 50, sem verificar o retorno; isso não comprova uma troca bem-sucedida desse slot. Usar nível compatível ou separar explicitamente teste de habilidade bloqueada.
3. **Dois jogadores em mundos diferentes:** testar um jogador ativo no Mundo 1 e outro salvo no Mundo 2 entrando/reconectando; depois testar portal enquanto outro permanece no mundo anterior. `World.currentWorld` e a população de monstros são globais, e a restauração do bioma em enterWorld só ocorre com zero jogadores. A travessia remove monstros e emite atualização global. Esses trechos indicam risco de mistura entre mundos, não um bug multiplayer já reproduzido pelo Codex. Acrescentar testes; se exigirem alteração grande de arquitetura, apresentar diagnóstico e proposta antes de implementar, conforme AGENTS.md.
4. **Identidade para a arte:** os nomes e atributos de Jotunheim/Frostbite já foram entregues. Confirmar qual campo estável do snapshot identifica o tipo do inimigo. `mob_w2_*` identifica mundo/instância, mas sozinho não identifica arquétipo. Não criar novo protocolo sem verificar se os campos existentes bastam; repassar contrato para integração pelo Codex.

Depois desses complementos, propor a próxima classe autoritativa, uma por entrega. Codex continua em paralelo com o bioma de gelo, portal e sprites, sem editar servidor/shared/rede. Não há necessidade de refazer o ciclo do Guerreiro já validado.

Nesta conferência Codex alterou somente este handoff e o ponto de retomada do plano visual; nenhum código/banco foi modificado. Branch `master`, worktree original, sem commit. Comandos repetidos: em `server`, `node node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json --test tests/warrior-phase1.test.ts` (8/8); em `client`, `node --test tests/pixel-vfx.test.mjs tests/pixel-arena.test.mjs tests/hero-animations.test.mjs tests/warrior-presentation.test.mjs` (30/30). Build não repetido nesta conferência documental.

## Divisão atual

- Codex: `client/src/renderer/**`, prévias em `client/src/pixel/**`, assets pixel e documentos visuais; bioma de gelo, VFX, portal e identificação dos inimigos.
- Antigravity: servidor, SQLite, shared, testes autoritativos e ClientNetwork mediante sua posse atual. Não editar main.ts, index.html, renderizadores ou prévias do Codex em paralelo na mesma pasta.
- Não fazer commit, merge, reset, limpeza, exclusão do banco ou push sem autorização específica. Se houver necessidade de alterar fronteira visual, avisar e combinar handoff antes.

## Prioridade 1 — preservar progresso integral ao atravessar o portal

O usuário reforçou: mudar de mundo não pode apagar/resetar progresso nem itens. O código atual de enterPortal chama savePlayer, mas isso não comprova que todos os relacionamentos e estados persistidos sobrevivem ao reinício. O teste 7 atual cobre boss/respawn e entidades do mundo anterior; não cobre a comparação completa abaixo após fechar e reabrir o SQLite.

Criar teste de integração com SQLite temporário em arquivo isolado, sem abrir o banco compartilhado:

1. Preparar personagem identificável, com nível/XP não triviais, ouro, Reborn, bônus permanentes e loadout alternativo.
2. Adicionar inventário variado com IDs e quantidades, equipamentos equipados, níveis de refino, gemas/soquetes, cartas adquiridas/alocadas, capacidade expandida de mochila e preferências do Farm Helper existentes.
3. Guardar o estado anterior, vencer o boss e separar a recompensa legítima da vitória do estado anterior ao portal.
4. Atravessar o portal; comparar os dados imediatamente antes e depois dele. Mundo/fase/posição podem mudar segundo a regra de transição. Nível, XP, saldo, itens e aprimoramentos não devem ser resetados pela travessia. Não confundir cura/efeitos temporários previstos pelo design com perda de progressão permanente.
5. Desconectar, salvar/encerrar e reabrir o banco; recriar World/Player e selecionar o mesmo herói. Repetir a comparação completa e confirmar mundo/fase e posição de entrada válidos no novo mundo.
6. Conferir ausência de itens duplicados, recompensas repetidas ou perda de vínculos de equipamentos/gemas/cartas.

O teste precisa verificar os dados efetivos, não apenas o tamanho do inventário ou a presença de uma carta. Se detectar defeito, corrigir incrementalmente no escopo do backend e acrescentar regressão. Não alterar fórmulas nem inventar novas regras de progressão para fazer o teste passar.

## Prioridade 2 — dados do Mundo 2 para o renderer

Confirmar a configuração autoritativa já existente dos **Picos de Jotunheim** (bioma de gelo): inimigos comuns, miniboss, chefe, nomes/IDs, HP, ataques, fases e drops. Informar ao Codex qual identidade estável já disponível pode ser usada para associar sprites, sem depender de interpretar nomes traduzidos. Evitar criar novo protocolo se um campo atual já atender; qualquer contrato adicional deve ser descrito e testado antes da integração.

Registrar também como a transição se comporta com dois jogadores: um atravessar não deve resetar inventário/progresso do outro nem atribuir indevidamente seu mundo. Se a simulação global atual limitar esse comportamento, relatar explicitamente antes de propor mudança grande de arquitetura.

## Entrega esperada

- Arquivos alterados, branch/worktree, comandos e resultados reais.
- Evidência das comparações de preservação antes/depois/reabertura, sem segredos ou dados do banco compartilhado.
- Confirmação da configuração real do Mundo 2 e pendências de contrato, se houver.
- Codex repete a integração no cliente após o handoff; o usuário aprova a arte separadamente.
