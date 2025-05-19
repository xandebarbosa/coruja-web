'use client';

import useDarkMode from "@/hooks/useDarkMode";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { Button, IconButton } from "@mui/material";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { isDark, toggleTheme } = useDarkMode();
    return (
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-4 sm:px-6 bg-white dark:bg-gray-900 dark:text-white border-b dark:border-gray-700 gap-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white pl-12 md:pl-0">{title}</h1>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 rounded"
        />
        <IconButton onClick={toggleTheme}>
          {isDark ? <Brightness7 className="text-white" /> : <Brightness4 className="text-black" />}
        </IconButton>
      </div>
    </header>
    );
  }
  