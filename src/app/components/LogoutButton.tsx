"use client";

import { signOut, useSession } from "next-auth/react";
import { Logout } from '@mui/icons-material';

export default function LogoutButton() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    // 1. Monta a URL base do Keycloak
    const keycloakIssuer = `${process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL}/realms/radares-realm`;
    
    // 2. Define a URL de retorno
    const postLogoutUrl = window.location.origin;

    // 3. Constrói a URL oficial de logout do Keycloak
    const logoutUrl = `${keycloakIssuer}/protocol/openid-connect/logout?id_token_hint=${
      session?.idToken
    }&post_logout_redirect_uri=${encodeURIComponent(postLogoutUrl)}`;

    // 4. Limpa a sessão local
    await signOut({ redirect: false });

    // 5. Redireciona para o Keycloak
    window.location.href = logoutUrl;
  };

  return (
    <button 
      onClick={handleLogout}
      className="
        w-full flex items-center gap-3 px-4 py-3 
        bg-gradient-to-r from-red-600 to-red-700
        text-white rounded-xl
        hover:from-red-700 hover:to-red-800
        transition-all duration-200
        shadow-lg hover:shadow-xl
        font-medium
      "
    >
      <Logout />
      <span>Sair do Sistema</span>
    </button>
  );
}