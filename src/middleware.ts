import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Você pode colocar logs aqui se quiser
    // console.log("Usuário autenticado:", req.nextauth.token);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Se não existe token → usuário não autenticado → bloqueia
        if (!token) return false;

        const roles = (token as any).roles || [];
        const path = req.nextUrl.pathname;

        // Protege /admin somente para ROLE_ADMIN
        if (path.startsWith("/admin")) {
          return roles.includes("admin");
        }

        // Protege /dashboard para QUALQUER usuário logado
        if (path.startsWith("/dashboard")) {
          return true;
        }

        // Por padrão, permitir
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
