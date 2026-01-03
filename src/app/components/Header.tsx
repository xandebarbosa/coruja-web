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
import { MoreVert, Notifications, Person, Search, Settings } from "@mui/icons-material";
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
    <header className="
      sticky top-0 z-30
      bg-gradient-to-r from-[#dad7cd] to-[#e8e4dc]
      border-b-2 border-[#003049]/10
      shadow-lg backdrop-blur-sm
    ">
      <Box className="flex items-center justify-between h-16 px-6">
        {/* Left Section - Title */}
        <Box className="flex items-center gap-4">
          <Box className="h-10 w-1 bg-gradient-to-b from-[#003049] to-transparent rounded-full" />
          <Box>
            <Typography 
              variant="h5" 
              className="font-bold text-[#003049] tracking-tight"
            >
              {title}
            </Typography>
            <Typography 
              variant="caption" 
              className="text-[#003049]/60 uppercase tracking-wider"
            >
              Sistema de Monitoramento
            </Typography>
          </Box>
        </Box>

        {/* Right Section - User Actions */}
        <Box className="flex items-center gap-3">
          {/* Search Button */}
          <IconButton 
            className="bg-white/50 hover:bg-white shadow-sm"
            size="small"
          >
            <Search className="text-[#003049]" />
          </IconButton>

          {/* Notifications */}
          <IconButton 
            className="bg-white/50 hover:bg-white shadow-sm relative"
            size="small"
          >
            <Notifications className="text-[#003049]" />
            <Box className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </IconButton>

          {/* User Profile */}
          {status === "loading" && (
            <Box className="flex items-center h-10 px-4">
              <CircularProgress size={20} sx={{ color: '#003049' }} />
            </Box>
          )}

          {status === "authenticated" && session?.user && (
            <Box className="flex items-center gap-3 bg-white/50 rounded-full px-4 py-2 shadow-sm">
              <Avatar 
                alt={session.user.name || 'Avatar'} 
                src={session.user.image || '/avatar.jpg'}
                className="w-8 h-8 border-2 border-[#003049]"
              />
              
              <Box className="hidden md:block">
                <Typography 
                  className="text-sm font-semibold text-[#003049] leading-tight"
                >
                  {session.user.name || 'Usuário'}
                </Typography>
                <Typography 
                  className="text-xs text-[#003049]/60"
                >
                  {session.user.email || 'email@exemplo.com'}
                </Typography>
              </Box>

              <IconButton 
                onClick={handleMenuOpen}
                size="small"
                className="text-[#003049]"
              >
                <MoreVert />
              </IconButton>

              <Menu 
                anchorEl={anchorEl} 
                open={openMenu} 
                onClose={handleMenuClose}
                PaperProps={{
                  className: "mt-2 rounded-xl shadow-xl",
                  sx: {
                    '& .MuiMenuItem-root': {
                      borderRadius: '8px',
                      margin: '4px 8px',
                    }
                  }
                }}
              >
                <Box className="px-4 py-3 border-b">
                  <Typography variant="subtitle2" className="font-semibold text-[#003049]">
                    Minha Conta
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {session.user.email}
                  </Typography>
                </Box>
                <MenuItem onClick={handleMenuClose} className="gap-3">
                  <Person fontSize="small" />
                  Meu Perfil
                </MenuItem>
                <MenuItem onClick={handleMenuClose} className="gap-3">
                  <Settings fontSize="small" />
                  Configurações
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Box>
    </header>
  );
}
  