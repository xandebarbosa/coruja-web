'use client';

// 1. Importe 'signOut' de 'next-auth/react' e 'CircularProgress' do MUI
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { 
  Avatar, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box,
  CircularProgress 
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
// import useDarkMode from "@/hooks/useDarkMode"; // Deixei comentado como no seu original

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  // const { isDark, toggleTheme } = useDarkMode(); // Deixei comentado
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  
  // O 'status' nos diz se está "loading", "authenticated" ou "unauthenticated"
  const { data: session, status } = useSession();

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // 2. Crie uma função de logout que chama o signOut do next-auth
  const handleLogout = () => {
    handleMenuClose(); // Fecha o menu
    signOut({ callbackUrl: '/' }); // Desloga o usuário e o envia para a página inicial
  };

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-4 sm:px-6 bg-white dark:bg-indigo-900 dark:text-white border-b dark:border-gray-700 gap-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white pl-12 md:pl-0">{title}</h1>
      
      <div className="flex items-center gap-2">
        {/* Bloco de Ícones (ex: DarkMode) - Deixei comentado */}
        {/* <IconButton onClick={toggleTheme}>
          {isDark ? <Brightness7 className="text-white" /> : <Brightness4 className="text-black" />}
        </IconButton> */}

        {/* 3. Renderização Condicional do Perfil do Usuário */}
        
        {/* Se a sessão estiver carregando, mostre um spinner */}
        {status === "loading" && (
          <Box sx={{ display: 'flex', alignItems: 'center', height: 40, minWidth: 150, justifyContent: 'flex-end' }}>
            <CircularProgress size={24} color="inherit" />
          </Box>
        )}

        {/* Se a sessão estiver autenticada, mostre os dados do usuário */}
        {status === "authenticated" && session?.user && (
          <div className="pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar 
                alt={session.user.name || 'Avatar'} // 4. Use o nome da sessão para o 'alt'
                src={session.user.image || '/avatar.jpg'} // Use a imagem da sessão (ou um fallback)
              />
              <div className="flex flex-col text-sm">
                {/* 5. Use o nome e email da sessão dinamicamente */}
                <Typography style={{ fontSize: 13, color: 'inherit' }}>
                  {session.user.name || 'Usuário'}
                </Typography>
                <Typography className="text-gray-500 dark:text-gray-300" style={{ fontSize: 10 }}>
                  {session.user.email || 'email@exemplo.com'}
                </Typography>
              </div>
            </div>

            <div>
              <IconButton onClick={handleMenuOpen}>
                <MoreVert className="text-gray-700 dark:text-white" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
                <MenuItem onClick={handleMenuClose}>Meu Perfil</MenuItem>
                <MenuItem onClick={handleMenuClose}>Configurações</MenuItem>
                {/* 6. Conecte o botão "Sair" à sua nova função de logout */}
                {/* <MenuItem onClick={handleLogout}>Sair</MenuItem> */}
              </Menu>
            </div>
          </div>
        )}
        
        {/* Se não estiver autenticado, este espaço ficará vazio */}
        {status === "unauthenticated" && (
           <Box sx={{ height: 40, minWidth: 150 }} /> // Apenas um espaço reservado
        )}
      </div>
    </header>
  );
}
  