import "next-auth";
import "next-auth/jwt";

/**
 * Estende o tipo JWT padrão do next-auth
 * para incluir o accessToken que adicionamos no callback 'jwt'.
 */
declare module "next-auth/jwt" {
  interface JWT {
    /** O Access Token do Keycloak */
    accessToken?: string;
  }
}

/**
 * Estende o tipo Session padrão do next-auth
 * para incluir o accessToken que adicionamos no callback 'session'.
 */
declare module "next-auth" {
  interface Session {
    /** O Access Token do Keycloak, disponível no lado do cliente */
    accessToken?: string;
  }
}