import Sidebar from "../components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-gray-50 overflow-x-hidden w-full md:w-0">
        {children}
      </main>
    </div>
  );
}