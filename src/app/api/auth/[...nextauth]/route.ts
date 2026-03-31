import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

async function refreshAccessToken(token: any) {
  try {
    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Credenciais do Keycloak ausentes no .env");
    }

    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      cache: "no-store", // 👈 Essencial no Next.js 15: Garante que o fetch vá direto ao Keycloak
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });     
    
    const refreshedTokens = await response.json();

    if (!response.ok) {
        console.error("Erro Keycloak Refresh:", refreshedTokens);
        throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, 
    };
  } catch (error) {
    console.error("Erro ao renovar token de acesso: ", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }  
}

const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER,   
    }),
  ], 
  session:  {
    strategy: "jwt",
    // Configuração ajustada para manter a sessão sempre ativa continuamente
  },  
callbacks: {
    async jwt({ token, account, user }) {
      // 1. LOGIN INICIAL
      if (account && user) {
        console.log("🟢 [NEXTAUTH] LOGIN INICIAL DETECTADO");
        console.log("👉 Dados recebidos do Keycloak:", { 
            expires_at: account.expires_at, 
            expires_in: account.expires_in 
        });

        // Cálculo super defensivo: Se falhar tudo, garante 5 minutos (300000ms)
        const exp = account.expires_at 
          ? account.expires_at * 1000 
          : Date.now() + ((account.expires_in as number) * 1000 || 300000);

        console.log("⏰ Token configurado para expirar em:", new Date(exp).toLocaleString());

        return {
          ...token,
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: exp,
          userRole: "user", 
          roles: token.roles 
        };
      }

      // 2. VALIDAÇÃO DE EXPIRAÇÃO
      const tempoRestante = (token.accessTokenExpires as number) - Date.now();
      
      if (tempoRestante > 10000) {
        // Token ainda é válido
        return token;
      }

      // 3. REFRESH TOKEN
      console.log(`🟡 [NEXTAUTH] Token expirou (Tempo restante: ${tempoRestante}ms). Tentando renovar...`);
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token.error) {
         console.error("🔴 [NEXTAUTH] Erro injetado na sessão:", token.error);
      }
      session.user = {
        ...session.user,
        roles: token.roles || [],
      };
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      session.idToken = token.idToken as string;
      return session;
    },
  },

  events: {
    async signOut({ token }) {
      console.log("Usuário deslogou do NextAuth:", token?.name);
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };