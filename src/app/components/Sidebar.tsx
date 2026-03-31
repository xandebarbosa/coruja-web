'use client';
// Este componente usa hooks do Next.js, então precisa ser um Client Component

import { Home, BarChart, People, Assignment, ListAlt, Close, Settings, Info, HelpOutline, MoreVert, Menu as Menus, Search, ImageSearch, Delete, AddCircleOutline, ImportantDevices, AssistantOutlined, Logout, NoCrashOutlined } from '@mui/icons-material';
import InsightsIcon from '@mui/icons-material/Insights';
import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { MenuIcon } from 'lucide-react';
import LogoutButton from './LogoutButton';

// Definição dos itens do menu para fácil manutenção
const navItems = [
  { name: "Dashboard", icon: <Home />, path: '/' },
  { name: "Pesquisa Placa", icon: <Search />, path: "/pesquisa-placa" },
  { name: "Pesquisa Local", icon: <ImageSearch />, path: "/pesquisa-local"},
  { name: "Cadastro", icon: <AddCircleOutline />, path: '/register-page'},  
  { name: 'Monitoramento', icon: <ImportantDevices />, path: '/monitoring-page'},
  { name: 'Geolacalização', icon: <AssistantOutlined />, path: '/pesquisa-geo'},
  { name: 'Telegram Users', icon: <People />, path: '/telegram-users'},
  { name: "Análise Comboio", icon: <NoCrashOutlined /> ,path: "/analise-comboio"},
  { name: "Análise Seletiva", icon: <InsightsIcon /> ,path: "/analise-seletiva"},
  //{ name: 'Logs do Sistema', path: '/logs' }, 
];

const adminNavItems = [
  { name: 'Auditoria', icon: <ListAlt />, path: '/auditoria' },
  //{ name: 'Usuários', icon: <People />, path: '/users' },    
];

const bottomItems = [
  { name: 'Settings', icon: <Settings /> },
  { name: 'About', icon: <Info /> },
  { name: 'Feedback', icon: <HelpOutline /> }
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname(); // Hook para saber a rota atual
  const { data: session } = useSession();
  // Verfica se o usuário é admin
  const isAdmin = session?.user?.roles?.includes('admin');

  // Fecha o sidebar ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
 
  // Bloqueia scroll do body quando sidebar aberto no mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Logout Federado (Força login novamente)
  const handleLogout = async () => {
    try {
      const issuerUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || "http://localhost:8180/realms/radares-realm";
      const idToken = session?.idToken;
      const redirectUrl = encodeURIComponent(window.location.origin);
      let logoutUrl = `${issuerUrl}/protocol/openid-connect/logout?post_logout_redirect_uri=${redirectUrl}`;
      if (idToken) logoutUrl += `&id_token_hint=${idToken}`;
      await signOut({ redirect: false });
      window.location.href = logoutUrl;
    } catch (error) {
      signOut({ callbackUrl: '/' });
    }
  };

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = pathname === item.path;
    return (
      <Link
        href={item.path}
        className={`
          group relative flex items-center gap-3 px-4 py-3 rounded-xl
          transition-all duration-200 ease-in-out
          ${isActive
            ? 'bg-gradient-to-r from-[#dad7cd] to-[#e8e4dc] text-[#003049] shadow-lg'
            : 'text-[#dad7cd] hover:bg-[#004a6e] hover:text-white'
          }
        `}
        onClick={() => setOpen(false)}
      >
        <Box className={`transition-transform duration-200 flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          {item.icon}
        </Box>
        <Typography variant="body2" className={`font-medium truncate ${isActive ? 'font-semibold' : ''}`}>
          {item.name}
        </Typography>
        {isActive && (
          <Box className="absolute right-0 w-1 h-8 bg-[#003049] rounded-l-full" />
        )}
      </Link>
    );
  };
 
  return (
    <>
      {/* Botão hamburguer — visível apenas no mobile quando sidebar fechado */}
      {!open && (
        <Box
          className="md:hidden fixed top-3 left-3 z-50"
          sx={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
        >
          <IconButton
            onClick={() => setOpen(true)}
            size="medium"
            sx={{
              bgcolor: '#003049',
              color: 'white',
              width: 44,
              height: 44,
              borderRadius: '12px',
              '&:hover': { bgcolor: '#004a6e' },
            }}
          >
            <MenuIcon size={20} />
          </IconButton>
        </Box>
      )}
 
      {/* Overlay escuro quando sidebar aberto no mobile */}
      {open && (
        <Box
          className="sidebar-overlay md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}
 
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72 flex flex-col
          bg-gradient-to-b from-[#003049] via-[#002838] to-[#001e2b]
          shadow-2xl
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto
        `}
      >
        {/* Botão fechar — mobile */}
        <Box className="flex justify-between items-center p-4 md:hidden flex-shrink-0">
          <Box className="flex items-center gap-2">
            <Image src="/image/logo-rodoviario.png" alt="logo" width={32} height={32} className="drop-shadow-lg" />
            <Typography variant="body1" className="font-black text-[#dad7cd]">CORUJA</Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: '#dad7cd' }}>
            <Close />
          </IconButton>
        </Box>
 
        {/* Logo — desktop */}
        <Box className="hidden md:flex items-center gap-3 px-4 py-5 flex-shrink-0">
          <Image src="/image/logo-rodoviario.png" alt="logo-coruja" width={48} height={48} className="drop-shadow-lg" />
          <Box>
            <Typography variant="h5" className="font-black text-[#dad7cd] tracking-tight leading-tight">
              CORUJA
            </Typography>
            <Typography variant="caption" className="text-[#a09d93] uppercase tracking-wider">
              Radar System
            </Typography>
          </Box>
        </Box>
 
        <Divider className="bg-[#004a6e] flex-shrink-0" sx={{ mx: 2 }} />
 
        {/* Navegação — scrollável */}
        <nav className="sidebar-nav flex-1 overflow-y-auto py-3 px-3">
          <Box className="space-y-1">
            {navItems.map(item => (
              <NavLink key={item.name} item={item} />
            ))}
 
            {isAdmin && (
              <>
                <Box className="pt-5 pb-1 px-1">
                  <Typography variant="caption" className="text-[#a09d93] uppercase tracking-wider font-semibold text-xs">
                    Administração
                  </Typography>
                </Box>
                {adminNavItems.map(item => (
                  <NavLink key={item.name} item={item} />
                ))}
              </>
            )}
          </Box>
        </nav>
 
        <Divider className="bg-[#004a6e] flex-shrink-0" sx={{ mx: 2 }} />
 
        {/* Perfil + Logout — fixo no rodapé */}
        <Box className="p-3 flex-shrink-0 space-y-2">
          {session?.user && (
            <Box className="bg-[#002838] rounded-xl p-3">
              <Box className="flex items-center gap-3">
                <Avatar
                  src={session.user.image || '/avatar.jpg'}
                  alt={session.user.name || 'User'}
                  sx={{ width: 40, height: 40, border: '2px solid #dad7cd', flexShrink: 0 }}
                />
                <Box className="min-w-0 flex-1">
                  <Typography variant="body2" className="font-semibold text-[#dad7cd] truncate text-sm">
                    {session.user.name}
                  </Typography>
                  <Typography variant="caption" className="text-[#a09d93] truncate block text-xs">
                    {session.user.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
 
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center justify-center gap-2 px-4 py-3
              bg-gradient-to-r from-red-600 to-red-700
              text-white rounded-xl text-sm font-semibold
              hover:from-red-700 hover:to-red-800
              transition-all duration-200 shadow-lg
            "
          >
            <Logout fontSize="small" />
            <span>Sair do Sistema</span>
          </button>
        </Box>
      </aside>
    </>
  );
}
