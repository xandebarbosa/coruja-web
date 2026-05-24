import { AuthOptions } from "next-auth";
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
      cache: "no-store",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });     
    
    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, 
    };
  } catch (error) {
    console.error("Erro ao renovar token de acesso: ", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }  
}

// EXPORTAÇÃO CENTRALIZADA
export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER,   
    }),
  ], 
  session: { strategy: "jwt" },  
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const exp = account.expires_at 
          ? account.expires_at * 1000 
          : Date.now() + ((account.expires_in as number) * 1000 || 300000);

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

      const tempoRestante = (token.accessTokenExpires as number) - Date.now();
      if (tempoRestante > 10000) return token;

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user = { ...session.user, roles: token.roles || [] };
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      session.idToken = token.idToken as string;
      return session;
    },
  },
};