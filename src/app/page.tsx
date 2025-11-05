"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  CircularProgress, 
  Button, 
  Box, 
  Container, 
  Paper, 
  Typography,
  Divider
} from "@mui/material";
import Image from "next/image"; // Importe o Image do Next.js
import LoginIcon from '@mui/icons-material/Login'; // Ícone

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário já estiver logado (sessão autenticada)
    if (status === "authenticated") {
      // Redireciona para o dashboard
      // Lembre-se da refatoração que fizemos: o dashboard está em /dashboard
      router.push("/dashboard"); 
    }
  }, [status, router]);

  // Enquanto o next-auth verifica a sessão, mostramos um loading centralizado
  if (status === "loading") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ backgroundColor: '#f0f2f5' }} // Um fundo leve
      >
        <CircularProgress />
      </Box>
    );
  }

  // Se não estiver logado, mostramos a tela de login profissional
  if (status === "unauthenticated") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ 
          // Fundo gradiente ou uma imagem de fundo
          background: 'linear-gradient(45deg, #1d3557 30%, #457b9d 90%)' 
        }}
      >
        <Container maxWidth="xs">
          <Paper 
            elevation={6} 
            sx={{ 
              padding: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              borderRadius: 2 // Bordas mais suaves
            }}
          >
            {/* 1. Logo do Projeto */}
            <Image
              src="/image/logo-coruja.png" // Caminho para seu logo
              alt="Logo Coruja Radar"
              width={100} // Ajuste o tamanho conforme necessário
              height={100}
              style={{ marginBottom: '16px' }}
            />
            
            {/* 2. Título */}
            <Typography component="h1" variant="h5" fontWeight="bold">
              Coruja Radar
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
              Sistema de Monitoramento e Análise de Radares
            </Typography>

            <Divider sx={{ width: '100%', mb: 3 }} />

            {/* 3. Botão de Login */}
            <Button
              fullWidth
              variant="contained"
              color="primary" // Cor primária do seu tema MUI
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => signIn("keycloak")} // 1. Chama o login do Keycloak
              sx={{
                padding: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                // Usando a cor laranja do seu sidebar
                backgroundColor: '#D97706', 
                '&:hover': {
                  backgroundColor: '#B45309'
                }
              }}
            >
              Entrar 
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Fallback (geralmente não é visto)
  return null;
}
