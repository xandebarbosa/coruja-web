import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./components/ThemeRegistry";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import AuthProvider from "./components/AuthProvider";
import ToastProvider from "./components/ToastProvider";
import GlobalAlertListener from "./components/GlobalAlertListener";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: '--font-roboto',
});

//"bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300"

export const metadata: Metadata = {
  title: "Coruja Web",
  description: "Sistema de Consulta de Radares",
  icons: {
    icon: "/image/logo-asinha.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <ToastProvider />
        <GlobalAlertListener />
        
        <AuthProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}

