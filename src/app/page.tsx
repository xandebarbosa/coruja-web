import Image from "next/image";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import OverviewCard from "./components/OverviewCard";
import ChartSection from "./components/ChartSection";
import DetailsTable from "./components/DetailsTable";
import Head from "next/head";

export default function Home() {
  return (
    <>    
     <Header title="Dashboard" />
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <OverviewCard title="Users" value="14k" change="+25%" />
          <OverviewCard title="Conversions" value="325" change="-25%" />
          <OverviewCard title="Event count" value="200k" change="+5%" />
        </section>
        <ChartSection />
  </>
  );
}
