'use client';
// Este componente usa hooks do Next.js, então precisa ser um Client Component

import { Home, BarChart, People, Assignment, ListAlt, Close, Settings, Info, HelpOutline, MoreVert, Menu as Menus, Search, ImageSearch, Delete, AddCircleOutline, ImportantDevices, AssistantOutlined } from '@mui/icons-material';
import { Avatar, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { lightBlue } from '@mui/material/colors';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import path from 'path';
import iaIcon from '../../../public/icon/inteligencia-artificial.png'
import Image from 'next/image';

// Definição dos itens do menu para fácil manutenção
const navItems = [
  { name: "Dashboard", icon: <Home />, path: '/' },
  { name: "Pesquisa Placa", icon: <Search />, path: "/pesquisa-placa" },
  { name: "Pesquisa Local", icon: <ImageSearch />, path: "/pesquisa-local"},
  { name: "Cadastro", icon: <AddCircleOutline />, path: '/register-page'},  
  { name: 'Monitoramento', icon: <ImportantDevices />, path: '/monitoring-page' },
  { name: "Análise com IA", icon: <Image src={iaIcon} alt='IA' width={24} height={24} style={{ backgroundColor: '#ffbd00'}}/> ,path: "/analise-ia"}
  //{ name: 'Logs do Sistema', path: '/logs' }, 
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

  return (
    <>
      {/* Botão de menu visível somente em telas menores que 'md' */}
      {!open && (
        <div className="md:hidden p-2 fixed top-4 left-4 z-50 mt-3.5 ml-2.5">
        <IconButton onClick={() => setOpen(true)}>
          <Menus />
        </IconButton>
      </div>
      )}

      {/* Sidebar responsivo */}
      <aside
        className={`
          fixed top-0 left-0 z-40 bg-blue-50 dark:bg-[#1d3557] dark:text-white h-screen w-60 p-4 border-r border-gray-200 dark:border-gray-700
          transition-transform transform
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:block
        `}
      >
        {/* WRAPPER para alinhar os itens e fixar o avatar no rodapé */}
        <div className="flex flex-col justify-between h-full">
          <div>
            {/* Botão fechar (mobile) */}
            <div className="flex justify-end md:hidden mb-4">
              <IconButton onClick={() => setOpen(false)}>
                <Close />
              </IconButton>
            </div>

            {/* Título */}
            <div className="flex items-center gap-1 mb-4 mt-3.5 ml-3">
              {/* <img src="/image/logo-coruja.png" alt="logo-coruja" className="w-15 h-15" />               */}
              <Typography variant='h5' className="text-lime-400 font-bold ml-2 mb-2">CORUJA RADAR</Typography>
            </div>
           <Divider sx={{ backgroundColor: '#8ecae6' }}/> 

            {/* Navegação principal */}
            <nav className="flex-grow">
            <ul className="space-y-2">
              {navItems.map(item => (
                <li key={item.name}>
                  <Link
                href={item.path}
                className={`
                  flex items-center p-3 my-1 rounded-lg text-[#ffbd00] transition-colors gap-1.5 text-lg  font-medium
                  ${pathname === item.path
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'hover:bg-orange-100' 
                  }
                `}
              >
                    {item.icon}
                      {item.name}
                  </Link>                  
                </li>
              ))}
            </ul>
            </nav>

            {/* Navegação secundária
            <ul className="space-y-2 mt-6">
              {bottomItems.map(item => (
                <li
                  key={item.name}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded"
                >
                  {item.icon}
                  {item.name}
                </li>
              ))}
            </ul> */}
          </div>

          
        </div>
      </aside>

      {/* Overlay para fechar o menu no mobile ao clicar fora */}
      {open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
