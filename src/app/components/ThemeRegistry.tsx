// components/ThemeRegistry.tsx
'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setIsDark(saved === 'light');
  }, []);

  const theme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
    }
  });

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
