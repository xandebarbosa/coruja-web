'use client';

import { Home, BarChart, People, Assignment, ListAlt, Close, Settings, Info, HelpOutline, MoreVert, Menu as Menus, Search, ImageSearch, Delete, AddCircleOutline } from '@mui/icons-material';
import { Avatar, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { lightBlue } from '@mui/material/colors';
import { useState } from 'react';
import Link from 'next/link';

const navItems = [
  { name: "Dashboard", icon: <Home />, href: "/" },
  { name: "Pesquisa Placa", icon: <Search />, href: "/pesquisa-placa" },
  { name: "Pesquisa Local", icon: <ImageSearch />, href: "/pesquisa-local"},
  { name: "Cadastro", icon: <AddCircleOutline />, href: "/"},
  { name: "Exclusão", icon: <Delete />, href: "/" }
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const useLightBlue = lightBlue[50];

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
          fixed top-0 left-0 z-40 bg-blue-50 dark:bg-gray-900 dark:text-white h-screen w-60 p-4 border-r border-gray-200 dark:border-gray-700
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
            <h2 className="text-xl font-bold ml-3.5 mb-2">Coruja Web</h2>

            {/* Navegação principal */}
            <ul className="space-y-2">
              {navItems.map(item => (
                <li key={item.name}>
                  <Link href={item.href} passHref>
                    <div className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded">
                      {item.icon}
                      {item.name}
                    </div>
                  </Link>                  
                </li>
              ))}
            </ul>

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

          {/* Rodapé com avatar */}
          <div className="border-t pt-4 flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Avatar alt="Riley Carter" src="/avatar.jpg" />
              <div className="flex flex-col text-sm">
                <Typography style={{ fontSize: 13 }}>Alexandre Barbosa</Typography>                
                <Typography className="text-gray-500" style={{ fontSize: 10 }}>xandesbarbosa@gmail.com</Typography>
              </div>
            </div>

            <div>
              <IconButton onClick={handleMenuOpen}>
                <MoreVert className="text-gray-700 dark:text-white" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
                <MenuItem onClick={handleMenuClose}>Meu Perfil</MenuItem>
                <MenuItem onClick={handleMenuClose}>Configurações</MenuItem>
                <MenuItem onClick={handleMenuClose}>Sair</MenuItem>
              </Menu>
            </div>
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
