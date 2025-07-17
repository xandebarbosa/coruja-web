import Image from "next/image";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import OverviewCard from "./components/OverviewCard";
import ChartSection from "./components/ChartSection";
import DetailsTable from "./components/DetailsTable";
import Head from "next/head";
import Dashboard from "./dashboard/page";

// Crie uma interface para o objeto de radar que virá do WebSocket

export default function Home() {
  return (
    <>    
     <Dashboard />
  </>
  );
}
