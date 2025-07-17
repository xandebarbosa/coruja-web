'use client';

import useDarkMode from "@/hooks/useDarkMode";
import { Brightness4, Brightness7, MoreVert } from "@mui/icons-material";
import { Avatar, Button, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { useState } from "react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { isDark, toggleTheme } = useDarkMode();
   const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
   const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);
    return (
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-4 sm:px-6 bg-white dark:bg-indigo-900 dark:text-white border-b dark:border-gray-700 gap-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white pl-12 md:pl-0">{title}</h1>
      <div className="flex items-center gap-2">
        {/* <input
          type="text"
          placeholder="Search..."
          className="border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 rounded"
        /> */}
        {/* <IconButton onClick={toggleTheme}>
          {isDark ? <Brightness7 className="text-white" /> : <Brightness4 className="text-black" />}
        </IconButton> */}
        {/* Rodapé com avatar */}
          <div className="pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar alt="Alexandre Barbosa" src="/avatar.jpg" />
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
    </header>
    );
  }

function setAnchorEl(currentTarget: EventTarget & HTMLButtonElement) {
  throw new Error("Function not implemented.");
}
  