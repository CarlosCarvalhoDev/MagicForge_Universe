# Handoff de autenticação social — 28/10/2026

Solicitação: reativar Google, Discord e Facebook após entrega de `SocialAuthService.ts`. Inspeção na branch `master`, worktree original, preservando as alterações locais. Nenhum código de autenticação, backend, contrato ou banco foi alterado nesta conferência.

## Confirmado no código

- `World.handleAuthRegister` agora rejeita email ausente, inválido ou maior que 254 caracteres com `INVALID_EMAIL`. Isso resolve a pendência anterior de exigência autoritativa de email; esta rodada conferiu o código, sem repetir o teste do backend informado pelo Antigravity.
- `World.handleAuthSocial` chama `SocialAuthService.verifyToken` e só depois associa a conta autenticada à conexão.
- `ClientNetwork.sendAuthSocial` já usa o enum compartilhado. **O opcode real é `0x72`**. `0x82` é `C2S_AUTO_SALVAGE`; não enviar autenticação nessa faixa.
- Google tem chamada a `tokeninfo`, Discord a `/users/@me` e Facebook a Graph `/me`. Apple ainda não tem implementação de validação.

## Bloqueios encontrados

1. **Aceite de token de teste no caminho normal:** `SocialAuthService.ts`, linhas 47–61, aceita qualquer string com prefixo `mock_test_token_` e constrói um perfil autenticado sem consultar o provedor. Não há condição de ambiente nem injeção isolada de mock. O caminho está acessível por `handleAuthSocial`. Antes de liberar os botões, remover esse bypass do serviço usado pelo servidor e substituir o mock em testes isolados.
2. **Vínculo do token à aplicação:** a resposta Google não tem `aud` conferido contra os client IDs aceitos do MagicForge. Definir os IDs públicos esperados e a validação correspondente no backend. Também conferir o vínculo à aplicação e os dados verificados dos demais provedores, conforme seu fluxo oficial.
3. **Aquisição de credenciais no cliente ausente:** não foi encontrado SDK, autorização OAuth, callback, client ID público ou redirect URI para Google/Discord/Facebook no código/configuração de exemplo/docs inspecionados. Validar um token no backend não fornece o token ao navegador. O callback atual em `main.ts` é exclusivo de Guest e usa sua credencial aleatória local; ela não deve ser enviada como token de outro provedor.

Não solicitar que jogadores colem tokens, não fabricar tokens e não enviar email/displayName como prova de identidade. Segredos OAuth devem permanecer no backend, fora do bundle Vite.

## Divisão para concluir

**Antigravity — arquivos de sua posse:** remover bypass de teste do caminho real, validar o destinatário/aplicação do token, fornecer configuração pública e contrato de início/retorno OAuth dos provedores. Se o fluxo usar troca de código no servidor, definir também correlação de sessão e verificação de state/nonce/PKCE conforme aplicável. Manter `sendAuthSocial`/tipos/opcodes oficiais sincronizados.

**Codex — próximo incremento visual:** obter a credencial real pelo fluxo entregue, conectar `authenticateSocial(provider, token)` ao método de rede existente, adicionar Facebook à UI (Apple permanece indisponível), tratar cancelamento/erro/popup bloqueado, evitar envios duplicados e aceitar somente `onAuthSuccess` do provedor solicitado antes de pedir a lista. Guest mantém credencial própria local; dados externos vêm da resposta autoritativa.

## Validação desta rodada

Leitura integral de `AGENTS.md`; branch/status conferidos; buscas com `rg` nos fontes de cliente, servidor, shared e documentação; conferência dos contratos e handler. Não houve login externo, chamada deliberada aos provedores, escrita no banco ou teste ponta a ponta. Uma tentativa de diagnóstico via `tsx -e` terminou com código 0 sem saída; não é evidência de teste funcional. Build não repetido porque somente documentação foi alterada.

Os botões Google/Discord/Apple continuam no estado anterior; Guest continua conectado. Esta entrega é um diagnóstico de bloqueios concretos, não uma ativação concluída. Sem commit, merge ou push.
