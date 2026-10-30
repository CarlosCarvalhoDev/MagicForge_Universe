# Resposta de Handoff — Segurança de Autenticação Social & OAuth — 28/10/2026

## 1. Resumo dos Ajustes Realizados pelo Antigravity

Em resposta ao diagnóstico detalhado do Codex em `Docs/HANDOFF_AUTH_SOCIAL_CODEX_2026-10-28.md`, todos os 3 pontos de segurança e conformidade foram implementados e testados no backend:

### 1.1. Remoção do Bypass de Mock no Caminho de Produção
* **Arquivo alterado:** `server/src/auth/SocialAuthService.ts` e `server/src/config.ts`.
* **Regra:** Tokens com prefixo `mock_test_token_` agora são **rejeitados por padrão** em produção (`"Tokens simulados de teste não são permitidos neste ambiente."`).
* **Condição:** Só são aceitos se a flag `ALLOW_MOCK_SOCIAL_AUTH=true` estiver explicitamente ligada no ambiente (desenvolvimento/testes). Teste `scratch/test_social_security.ts` validou o bloqueio.

### 1.2. Vínculo Autoritativo do Token à Aplicação (Audience / Client ID)
* **Google (`aud`):** No retorno de `https://oauth2.googleapis.com/tokeninfo`, o campo `aud` é conferido contra `SERVER_CONFIG.AUTH.GOOGLE_CLIENT_IDS`. Tokens emitidos para qualquer outro app são recusados com `"Token do Google emitido para uma aplicação não autorizada (Audience inválido)."`.
* **Discord (`application.id`):** O backend consulta `https://discord.com/api/v10/oauth2/@me` e valida o `application.id` contra `SERVER_CONFIG.AUTH.DISCORD_CLIENT_IDS`.
* **Facebook (`app_id`):** Validação via `https://graph.facebook.com/app` contra `SERVER_CONFIG.AUTH.FACEBOOK_APP_IDS`.

### 1.3. Opcodes e Contratos
* Confirmado: `C2S_AUTH_SOCIAL` usa **`Opcode 0x72`**.
* `0x82` é preservado exclusivamente para `C2S_AUTO_SALVAGE` (Venda de Lixo).

---

## 2. Configuração e Variáveis de Ambiente (.env)

Criado `.env.example` na raiz do projeto contendo os parâmetros de segurança:

```env
# Servidor
ALLOW_MOCK_SOCIAL_AUTH=true # false em produção
GOOGLE_CLIENT_IDS=
DISCORD_CLIENT_IDS=
FACEBOOK_APP_IDS=

# Cliente Web (Vite)
VITE_SERVER_URL=ws://localhost:3000
VITE_GOOGLE_CLIENT_ID=
VITE_DISCORD_CLIENT_ID=
VITE_FACEBOOK_APP_ID=
```

---

## 3. Diretriz para Ativação no Cliente (Codex)

Para obter o token no navegador de forma limpa e oficial sem expor segredos:

### 3.1. Google Identity Services (Recomendado)
Incluir a biblioteca oficial do Google no `index.html`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```
No inicializador do botão Google:
```ts
if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: (response: { credential: string }) => {
      // response.credential é o id_token real gerado e assinado pelo Google
      clientNetwork.sendAuthSocial('GOOGLE', response.credential);
    },
  });
  window.google.accounts.id.renderButton(googleBtnElement, { theme: 'outline', size: 'large' });
}
```

### 3.2. Discord OAuth2 (Popup ou Redirect)
Abrir popup com URL de autorização implícita:
`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&response_type=token&scope=identify+email&redirect_uri=${encodeURIComponent(window.location.origin)}`
Ao retornar com o token na URL hash (`#access_token=...`), repassar para:
`clientNetwork.sendAuthSocial('DISCORD', accessToken)`

### 3.3. Tratamento enquanto as credenciais públicas não forem preenchidas
* Se `import.meta.env.VITE_GOOGLE_CLIENT_ID` não estiver preenchido, o botão pode exibir um aviso amigável: *"Login social aguardando configuração de chaves OAuth no .env"*.
* O botão de **Convidado (GUEST)** continua plenamente disponível para acesso imediato.
