import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Erro ao decodificar JWT: ", e);
    return null;
  }
}

export const authOptions: AuthOptions = {
  // Esta é a linha que causa o 401 se 'process.env.NEXTAUTH_SECRET' for undefined
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      // ADICIONE ESTE BLOCO PARA AUMENTAR O TIMEOUT
      httpOptions: {
        timeout: 30000, // 30 segundos (padrão é 3500ms)
      },

      // --- CORREÇÃO: FORÇA AS URLS DE AUTORIZAÇÃO E TOKEN EXTERNAS ---
      authorization: {
        url: `${process.env.KEYCLOAK_ISSUER!}/protocol/openid-connect/auth`,
        params: { scope: "openid email profile" },
      },
      token: {
        url: `${process.env.KEYCLOAK_ISSUER!}/protocol/openid-connect/token`,
      },
    }),
  ], 
  
  callbacks: {
    async jwt({ token, account }) {
      // Executa somente na primeira autenticação
      if (account?.access_token) {
        const decodedToken = parseJwt(account.access_token);

        // Evita erro quando o usuário não tem realm_access
       const roles = decodedToken?.realm_access?.roles ?? [];

        return {
          ...token,
          accessToken: account.access_token,
          roles,
        };
      }

      // Para requests subsequentes, mantenha o token existente
      return token;
    },
    async session({ session, token }) {
      // Garante que não quebra se session.user for readonly
      session.user = {
        ...session.user,
        roles: token.roles || [],
      };
      // Copia o accessToken para a sessão
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };