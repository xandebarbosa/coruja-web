'use client';
// Este componente usa hooks do Next.js, então precisa ser um Client Component

import { Home, BarChart, People, Assignment, ListAlt, Close, Settings, Info, HelpOutline, MoreVert, Menu as Menus, Search, ImageSearch, Delete, AddCircleOutline, ImportantDevices, AssistantOutlined, Logout } from '@mui/icons-material';
import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { lightBlue } from '@mui/material/colors';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import path from 'path';
import iaIcon from '../../../public/icon/inteligencia-artificial.png'
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { MenuIcon } from 'lucide-react';

// Definição dos itens do menu para fácil manutenção
const navItems = [
  { name: "Dashboard", icon: <Home />, path: '/' },
  { name: "Pesquisa Placa", icon: <Search />, path: "/pesquisa-placa" },
  { name: "Pesquisa Local", icon: <ImageSearch />, path: "/pesquisa-local"},
  { name: "Cadastro", icon: <AddCircleOutline />, path: '/register-page'},  
  { name: 'Monitoramento', icon: <ImportantDevices />, path: '/monitoring-page' },
  { name: 'Geolacalização', icon: <AssistantOutlined />, path: '/pesquisa-geo' },
  { name: "Análise com IA", icon: <Image src={iaIcon} alt='IA' width={24} height={24} style={{ backgroundColor: '#ffbd00'}}/> ,path: "/analise-ia"}
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const pathname = usePathname(); // Hook para saber a rota atual
  const { data: session } = useSession();

  // Verfica se o usuário é admin
  const isAdmin = session?.user?.roles?.includes('admin');

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  }

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
        <Box className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          {item.icon}
        </Box>
        <Typography 
          variant="body2" 
          className={`font-medium ${isActive ? 'font-semibold' : ''}`}
        >
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
      {/* Mobile Menu Button */}
      {!open && (
        <Box className="md:hidden fixed top-4 left-4 z-50">
          <IconButton 
            onClick={() => setOpen(true)}
            className="bg-[#003049] text-white shadow-lg hover:bg-[#004a6e]"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Overlay */}
      {open && (
        <Box
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72
          bg-gradient-to-b from-[#003049] via-[#002838] to-[#001e2b]
          shadow-2xl
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static
        `}
      >
        <Box className="flex flex-col h-full p-4">
          {/* Close Button (Mobile) */}
          <Box className="flex justify-end md:hidden mb-2">
            <IconButton 
              onClick={() => setOpen(false)}
              className="text-[#dad7cd] hover:bg-[#004a6e]"
            >
              <Close />
            </IconButton>
          </Box>

          {/* Logo Section */}
          <Box className="flex items-center gap-3 px-2 py-4 mb-6">
            <Image
              src="/image/logo-coruja.png"
              alt="logo-coruja"
              width={48}
              height={48}
              className="drop-shadow-lg"
            />
            <Box>
              <Typography 
                variant="h5" 
                className="font-black text-[#dad7cd] tracking-tight leading-tight"
              >
                CORUJA
              </Typography>
              <Typography 
                variant="caption" 
                className="text-[#a09d93] uppercase tracking-wider"
              >
                Radar System
              </Typography>
            </Box>
          </Box>

          <Divider className="bg-[#004a6e] mb-6" />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#004a6e]">
            <Box className="space-y-2">
              {navItems.map(item => (
                <NavLink key={item.name} item={item} />
              ))}

              {/* Admin Section */}
              {isAdmin && (
                <>
                  <Box className="pt-6 pb-2">
                    <Typography 
                      variant="caption" 
                      className="px-4 text-[#a09d93] uppercase tracking-wider font-semibold"
                    >
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

          <Divider className="bg-[#004a6e] my-4" />

          {/* User Profile Section */}
          {session?.user && (
            <Box className="bg-[#002838] rounded-2xl p-4 mb-4 shadow-inner">
              <Box className="flex items-center gap-3 mb-3">
                <Avatar 
                  src={session.user.image || '/avatar.jpg'}
                  alt={session.user.name || 'User'}
                  className="w-12 h-12 border-2 border-[#dad7cd]"
                />
                <Box className="flex-1 min-w-0">
                  <Typography 
                    variant="body2" 
                    className="font-semibold text-[#dad7cd] truncate"
                  >
                    {session.user.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    className="text-[#a09d93] truncate block"
                  >
                    {session.user.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Logout Button */}
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
        </Box>
      </aside>
    </>
  );
}
