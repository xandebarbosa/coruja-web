'use client';

import { useState } from "react";
import { buscarPorPlaca } from "../services/RadarService";
import DetailsTable from "../components/DetailsTable";
import { Card, CardContent, Typography, TextField, Button } from "@mui/material";
import QueriesCard from "../components/QueriesCard";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const PesquisaPlacaPage = () => {
    return (
        <>        
          <Header title="Pequisa por placa" />
          <QueriesCard />
        </>
      );
}
 
export default PesquisaPlacaPage;