import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./components/ThemeRegistry";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

//"bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300"

export const metadata: Metadata = {
  title: "Coruja Web",
  description: "Aplicativo de Gestão de Radares",
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
      >
        <ThemeRegistry>
          <AppLayout>{children}</AppLayout>
        </ThemeRegistry>
      </body>
    </html>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-6 min-h-screen">        
        {children}
      </main>
    </div>
  );
}
