import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// ... (outros logs) ...
if (process.env.KEYCLOAK_CLIENT_ID) {
  console.log("✅ KEYCLOAK_CLIENT_ID:", process.env.KEYCLOAK_CLIENT_ID);
} else {
  console.log("❌ ERRO: KEYCLOAK_CLIENT_ID é UNDEFINED!");
}

// ADICIONE ESTE BLOCO ABAIXO:
if (process.env.KEYCLOAK_CLIENT_SECRET && process.env.KEYCLOAK_CLIENT_SECRET.length > 0) {
  console.log("✅ KEYCLOAK_CLIENT_SECRET: Carregado (comprimento: " + process.env.KEYCLOAK_CLIENT_SECRET.length + ")");
} else {
  console.log("❌ ERRO: KEYCLOAK_CLIENT_SECRET é UNDEFINED ou VAZIO!");
}
// FIM DO BLOCO ADICIONADO

console.log("=================================================\n");

/**
 * Decodifica o payload de um JWT (sem verificar a assinatura)
 */
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
    }),
  ], 
  
  callbacks: {
    async jwt({ token, account }) {
      if (account && account.access_token) {
        // Na primeira vez que o usuário faz login (objeto 'account' existe),
        // decodificamos o access_token do Keycloak.
        const decodedToken = parseJwt(account.access_token);
        
        // Extraímos os papéis do realm e os salvamos no token do NextAuth.
        token.roles = decodedToken?.realm_access?.roles || [];
        token.accessToken = account.access_token; // Salva o access token
      }
      return token;
    },
    async session({ session, token }) {
      // Em cada carregamento de página, copiamos os papéis do 
      // token do NextAuth para a sessão do NextAuth.
      if (token.roles) {
        (session.user as any).roles = token.roles;
      }
      // Copia o accessToken para a sessão
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };