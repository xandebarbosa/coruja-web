'use client';

import {
  Home, ListAlt, Close, Search,
  AddCircleOutline, ImportantDevices,
  AssistantOutlined, Logout, NoCrashOutlined,
} from '@mui/icons-material';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import PeopleIcon      from '@mui/icons-material/People';
import InsightsIcon    from '@mui/icons-material/Insights';
import { Avatar, Box, Divider, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { MenuIcon } from 'lucide-react';

const navItems = [
  { name: 'Dashboard',        icon: <Home />,              path: '/' },
  { name: 'Pesquisa Placa',   icon: <Search />,            path: '/pesquisa-placa' },
  { name: 'Pesquisa Local',   icon: <ImageSearchIcon />,   path: '/pesquisa-local' },
  { name: 'Cadastro',         icon: <AddCircleOutline />,  path: '/register-page' },
  { name: 'Monitoramento',    icon: <ImportantDevices />,  path: '/monitoring-page' },
  { name: 'Geolocalização',   icon: <AssistantOutlined />, path: '/pesquisa-geo' },
  { name: 'Telegram Users',   icon: <PeopleIcon />,        path: '/telegram-users' },
  { name: 'Análise Comboio',  icon: <NoCrashOutlined />,   path: '/analise-comboio' },
  { name: 'Análise Seletiva', icon: <InsightsIcon />,      path: '/analise-seletiva' },
];

const adminNavItems = [
  { name: 'Auditoria', icon: <ListAlt />, path: '/auditoria' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles?.includes('admin');

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = async () => {
    try {
      const issuer      = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ?? 'http://localhost:8180/realms/radares-realm';
      const redirectUrl = encodeURIComponent(window.location.origin);
      let   logoutUrl   = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${redirectUrl}`;
      if (session?.idToken) logoutUrl += `&id_token_hint=${session.idToken}`;
      await signOut({ redirect: false });
      window.location.href = logoutUrl;
    } catch {
      signOut({ callbackUrl: '/' });
    }
  };

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = pathname === item.path;
    return (
      <Link
        href={item.path}
        onClick={() => setOpen(false)}
        className={`
          group relative flex items-center gap-3 px-4 py-3 rounded-xl
          transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-r from-[#dad7cd] to-[#e8e4dc] text-[#003049] shadow-lg'
            : 'text-[#dad7cd] hover:bg-[#004a6e] hover:text-white'}
        `}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
        >
          {item.icon}
        </Box>
        <Typography variant="body2" className={`truncate font-medium ${isActive ? 'font-semibold' : ''}`}>
          {item.name}
        </Typography>
        {isActive && (
          <Box className="absolute right-0 w-1 h-8 bg-[#003049] rounded-l-full" />
        )}
      </Link>
    );
  };

  /**
   * Conteúdo interno — reutilizado em mobile (drawer) e desktop (sticky).
   * Usa flex-col + flex-1 para ocupar a altura disponível.
   */
  const InnerContent = () => (
    <>
      {/* Logo */}
      <Box className="flex items-center gap-3 px-4 py-5 flex-shrink-0">
        <Image src="/image/logo-rodoviario.png" alt="logo" width={48} height={48} className="drop-shadow-lg" />
        <Box>
          <Typography variant="h5" className="font-black text-[#dad7cd] tracking-tight leading-tight">
            CORUJA
          </Typography>
          <Typography variant="caption" className="text-[#a09d93] uppercase tracking-wider">
            Radar System
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, borderColor: '#004a6e', flexShrink: 0 }} />

      {/* Navegação */}
      <nav className="sidebar-nav flex-1 overflow-y-auto py-3 px-3">
        <Box className="space-y-1">
          {navItems.map(item => <NavLink key={item.name} item={item} />)}
          {isAdmin && (
            <>
              <Box className="pt-5 pb-1 px-1">
                <Typography variant="caption" className="text-[#a09d93] uppercase tracking-wider font-semibold text-xs">
                  Administração
                </Typography>
              </Box>
              {adminNavItems.map(item => <NavLink key={item.name} item={item} />)}
            </>
          )}
        </Box>
      </nav>

      <Divider sx={{ mx: 2, borderColor: '#004a6e', flexShrink: 0 }} />

      {/* Rodapé */}
      <Box className="p-3 space-y-2 flex-shrink-0">
        {session?.user && (
          <Box className="bg-[#002838] rounded-xl p-3">
            <Box className="flex items-center gap-3">
              <Avatar
                src={session.user.image || '/avatar.png'}
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3
            bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-semibold
            hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
        >
          <Logout fontSize="small" />
          <span>Sair do Sistema</span>
        </button>
      </Box>
    </>
  );

  return (
    <>
      {/* ── Botão hamburguer — só no mobile ───────────────────────── */}
      {!open && (
        <Box
          className="md:hidden fixed top-3 left-3 z-50"
          sx={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.3))' }}
        >
          <IconButton
            onClick={() => setOpen(true)}
            sx={{
              bgcolor: '#003049', color: 'white',
              width: 44, height: 44, borderRadius: '12px',
              '&:hover': { bgcolor: '#004a6e' },
            }}
          >
            <MenuIcon size={20} />
          </IconButton>
        </Box>
      )}

      {/* ── Overlay — só no mobile ────────────────────────────────── */}
      {open && (
        <Box
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          sx={{ bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ── DRAWER MOBILE ─────────────────────────────────────────── */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 z-50 w-72 h-full flex flex-col
          bg-gradient-to-b from-[#003049] via-[#002838] to-[#001e2b]
          shadow-2xl transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Box className="flex justify-end px-3 pt-3 flex-shrink-0">
          <IconButton onClick={() => setOpen(false)} sx={{ color: '#dad7cd' }}>
            <Close />
          </IconButton>
        </Box>
        <InnerContent />
      </aside>
      
      <aside
        className="
          hidden md:block
          w-72 flex-shrink-0
          bg-gradient-to-b from-[#003049] via-[#002838] to-[#001e2b]
          shadow-2xl
        "
      >
        {/* Este div fica colado no topo da viewport durante o scroll */}
        <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
          <InnerContent />
        </div>
      </aside>
    </>
  );
}