"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircularProgress, Button, Box } from "@mui/material";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário já estiver logado (sessão autenticada)
    if (status === "authenticated") {
      // Redireciona para o dashboard
      router.push("/dashboard");
    }
  }, [status, router]);

  // Enquanto o next-auth verifica a sessão, mostramos um loading
  if (status === "loading") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Se não estiver logado, mostramos o botão de login
  if (status === "unauthenticated") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => signIn("keycloak")} // 1. Chama o login do Keycloak
        >
          Entrar
        </Button>
      </Box>
    );
  }

  // Fallback (geralmente não é visto)
  return null;
}
