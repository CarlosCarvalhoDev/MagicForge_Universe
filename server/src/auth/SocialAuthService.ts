import { SocialAuthProvider } from '@magicforge/shared';
import { SERVER_CONFIG } from '../config';

export interface VerifiedSocialProfile {
  provider: SocialAuthProvider;
  providerUserId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

export class SocialAuthService {
  /**
   * Valida autoritativamente o token com a API oficial do provedor (Google, Discord, Facebook)
   * Impede injeção de identidade ou bypass de autenticação sem token legítimo.
   */
  public static async verifyToken(
    provider: SocialAuthProvider,
    token?: string
  ): Promise<{ success: boolean; profile?: VerifiedSocialProfile; error?: string }> {
    const cleanProvider = (provider || '').toUpperCase() as SocialAuthProvider;

    // 1. Provedor GUEST (Convidado Canônico)
    if (cleanProvider === 'GUEST') {
      const guestId = (token && token.trim().length >= 8) 
        ? token.trim() 
        : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      return {
        success: true,
        profile: {
          provider: 'GUEST',
          providerUserId: guestId,
          displayName: `Aventureiro_${guestId.substring(guestId.length - 4)}`,
        },
      };
    }

    if (!token || token.trim().length === 0) {
      return {
        success: false,
        error: `Token de acesso do ${cleanProvider} é obrigatório.`,
      };
    }

    const cleanToken = token.trim();

    // 2. Mock Seguro para Testes Automatizados Locais (apenas com flag explícita de ambiente)
    if (cleanToken.startsWith('mock_test_token_')) {
      if (!SERVER_CONFIG.AUTH.ALLOW_MOCK_SOCIAL_AUTH) {
        return {
          success: false,
          error: 'Tokens simulados de teste não são permitidos neste ambiente.',
        };
      }
      const id = cleanToken.replace('mock_test_token_', '');
      return {
        success: true,
        profile: {
          provider: cleanProvider,
          providerUserId: `${cleanProvider.toLowerCase()}_${id}`,
          email: `${id}@${cleanProvider.toLowerCase()}.test`,
          displayName: `Hero_${id}`,
        },
      };
    }

    try {
      // 3. Validação Real Google (OAuth2 id_token cryptographically checked via Google's endpoint)
      if (cleanProvider === 'GOOGLE') {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(cleanToken)}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: (errData as any).error_description || 'Token do Google inválido ou expirado.',
          };
        }

        const data = (await response.json()) as {
          sub: string;
          aud?: string;
          email?: string;
          name?: string;
          picture?: string;
          email_verified?: string | boolean;
        };

        if (!data.sub) {
          return { success: false, error: 'Identificador de usuário ausente no token do Google.' };
        }

        // Validação autoritativa do Audience (aud / Client ID) contra as credenciais oficiais
        if (SERVER_CONFIG.AUTH.GOOGLE_CLIENT_IDS.length > 0) {
          if (!data.aud || !SERVER_CONFIG.AUTH.GOOGLE_CLIENT_IDS.includes(data.aud)) {
            return {
              success: false,
              error: 'Token do Google emitido para uma aplicação não autorizada (Audience inválido).',
            };
          }
        }

        return {
          success: true,
          profile: {
            provider: 'GOOGLE',
            providerUserId: data.sub,
            email: data.email,
            displayName: data.name || (data.email ? data.email.split('@')[0] : 'Gamer_Google'),
            avatarUrl: data.picture,
          },
        };
      }

      // 4. Validação Real Discord (Bearer Access Token via Discord API v10)
      if (cleanProvider === 'DISCORD') {
        // Validação de autorização e aplicação via /oauth2/@me
        const oauthResp = await fetch('https://discord.com/api/v10/oauth2/@me', {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        });

        if (!oauthResp.ok) {
          return {
            success: false,
            error: 'Token do Discord inválido ou não autorizado.',
          };
        }

        const oauthData = (await oauthResp.json()) as {
          application?: { id: string; name: string };
          user?: {
            id: string;
            username: string;
            global_name?: string;
            email?: string;
            avatar?: string;
          };
        };

        // Validação de Client ID / Application ID do Discord
        if (SERVER_CONFIG.AUTH.DISCORD_CLIENT_IDS.length > 0) {
          const appId = oauthData.application?.id;
          if (!appId || !SERVER_CONFIG.AUTH.DISCORD_CLIENT_IDS.includes(appId)) {
            return {
              success: false,
              error: 'Token do Discord emitido para aplicação não autorizada.',
            };
          }
        }

        const user = oauthData.user;
        if (!user || !user.id) {
          return { success: false, error: 'Identificador de usuário ausente no Discord.' };
        }

        return {
          success: true,
          profile: {
            provider: 'DISCORD',
            providerUserId: user.id,
            email: user.email,
            displayName: user.global_name || user.username,
            avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined,
          },
        };
      }

      // 5. Validação Real Facebook (Graph API v19.0)
      if (cleanProvider === 'FACEBOOK') {
        const response = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(cleanToken)}`
        );

        if (!response.ok) {
          return {
            success: false,
            error: 'Token do Facebook inválido ou expirado.',
          };
        }

        const data = (await response.json()) as {
          id: string;
          name?: string;
          email?: string;
          picture?: { data?: { url?: string } };
        };

        if (!data.id) {
          return { success: false, error: 'Identificador ausente na resposta do Facebook.' };
        }

        // Validação do App ID se configurado
        if (SERVER_CONFIG.AUTH.FACEBOOK_APP_IDS.length > 0) {
          const appResp = await fetch(
            `https://graph.facebook.com/app?access_token=${encodeURIComponent(cleanToken)}`
          );
          if (appResp.ok) {
            const appData = (await appResp.json()) as { id?: string };
            if (!appData.id || !SERVER_CONFIG.AUTH.FACEBOOK_APP_IDS.includes(appData.id)) {
              return {
                success: false,
                error: 'Token do Facebook não pertence ao aplicativo MagicForge.',
              };
            }
          }
        }

        return {
          success: true,
          profile: {
            provider: 'FACEBOOK',
            providerUserId: data.id,
            email: data.email,
            displayName: data.name,
            avatarUrl: data.picture?.data?.url,
          },
        };
      }

      return {
        success: false,
        error: `Provedor "${cleanProvider}" ainda não possui validação de token configurada.`,
      };
    } catch (err: any) {
      console.error(`[SocialAuthService] Erro ao contatar API do provedor ${cleanProvider}:`, err?.message || err);
      return {
        success: false,
        error: `Falha de conexão com os servidores de autenticação do ${cleanProvider}. Tente novamente.`,
      };
    }
  }
}
