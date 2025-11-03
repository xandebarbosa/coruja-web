import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// =================================================================
// ##                  INÍCIO DO BLOCO DE DEBUG                   ##
// =----------------------------------------------------------------
//
// Rode 'npm run dev' e olhe o TERMINAL (não o navegador)
//
// =================================================================
console.log("\n[DEPURAÇÃO NEXT-AUTH] Arquivo route.ts foi lido.");
console.log("=================================================");

if (process.env.NEXTAUTH_SECRET) {
  console.log("✅ NEXTAUTH_SECRET: Carregado com sucesso.");
} else {
  console.log("❌ ERRO: NEXTAUTH_SECRET é UNDEFINED!");
  console.log("   (Causa provável: Reinicie o servidor 'npm run dev'.)");
}

if (process.env.KEYCLOAK_ISSUER) {
  console.log("✅ KEYCLOAK_ISSUER:", process.env.KEYCLOAK_ISSUER);
} else {
  console.log("❌ ERRO: KEYCLOAK_ISSUER é UNDEFINED!");
}

if (process.env.KEYCLOAK_CLIENT_ID) {
  console.log("✅ KEYCLOAK_CLIENT_ID:", process.env.KEYCLOAK_CLIENT_ID);
} else {
  console.log("❌ ERRO: KEYCLOAK_CLIENT_ID é UNDEFINED!");
}
console.log("=================================================\n");
// =================================================================
// ##                   FIM DO BLOCO DE DEBUG                     ##
// =================================================================

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
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };