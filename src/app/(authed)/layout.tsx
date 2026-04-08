import GlobalAlertListener from "../components/GlobalAlertListener";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />      
      <main className="flex-1 bg-gray-50 overflow-x-hidden md:w-0">
        {children}
      </main>
    </div>
  );
}