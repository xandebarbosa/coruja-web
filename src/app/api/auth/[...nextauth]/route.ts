import { Client } from '@stomp/stompjs';
import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

//Função para renovar o token se necessário (opcional, mas recomendado para tokens longos)
async function refreshAccessToken(token: any) {
  try {
    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

    // Validação básica para evitar enviar "undefined"
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("KEYCLOAK_CLIENT_ID ou KEYCLOAK_CLIENT_SECRET não definidos no .env");
    }

    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
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
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Use o novo refresh token se fornecido
    };
  } catch (error) {
    console.error("Erro ao renovar token de acesso: ", error);
    return {
      ...token,
      error: "RefreshAccessTokenError", // Isso gatilha o logout no frontend se tratado lá    
    };
  }  
}

export const authOptions: AuthOptions = {
  // Esta é a linha que causa o 401 se 'process.env.NEXTAUTH_SECRET' for undefined
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
    // ✅ SOLICITAÇÃO 1: Duração de 24 horas (em segundos)
    maxAge: 24 * 60 * 60, // 24 horas
  },  
  callbacks: {
    async jwt({ token, account, user }) {
      // Login inicial
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          // ✅ Importante: Salvamos o id_token para usar no Logout depois
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          userRole: "user", // Ajuste conforme sua lógica de roles
          roles: token.roles // Se vier do profile callback
        };
      }

      // Se o token ainda não expirou, retorne-o
      if (Date.now() < (token.accessTokenExpires as number) - 10000) {
        return token;
      }

      // Se expirou, tenta renovar
      console.log("Token expirado, tentando renovar...");
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Passa os dados do token para a sessão do cliente
      session.user = {
        ...session.user,
        roles: token.roles || [],
      };
      // Copia o accessToken para a sessão
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      session.idToken = token.idToken as string;
      return session;
    },
  },
  events: {
    // Evento opcional para logar saídas
    async signOut({ token}) {
      console.log("Usuário deslogou do NextAuth:", token?.name);
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };