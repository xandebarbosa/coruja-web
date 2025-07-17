import { Card, CardContent, Typography, TableHead, TableRow, TableCell, TableBody, Table, TableContainer, Box, Pagination, FormControl, InputLabel, MenuItem, Select, CircularProgress, type SelectChangeEvent } from "@mui/material";

import { useState, type Key } from "react";

interface RadarDTO {
  id: number;
  data: Date | string;  // Aceita string ou Date
  hora: Date | string;
  placa?: string;
  rodovia: string;
  km: string;
  sentido: string;
}

interface Radar {
    id: number;
    data: Date | string;
    hora: Date | string;
    rodovia: string;
    km: string;
    sentido: string;
}

interface DetailsTableProps {
  dados: RadarDTO[];
}

  
  export default function DetailsTable({ dados }: DetailsTableProps) {

    const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const totalPaginas = Math.ceil(dados.length / itensPorPagina);

  const handleChangePagina = (_: React.ChangeEvent<unknown>, novaPagina: number) => {
    setPaginaAtual(novaPagina);
  };

  const handleChangeItensPorPagina = (event: SelectChangeEvent) => {
    setItensPorPagina(Number(event.target.value));
    setPaginaAtual(1); // Resetar para primeira página
  };   

    const formatarData = (data: string | Date) => {
      const d = typeof data === "string" ? new Date(data) : data;
      return d.toLocaleDateString("pt-BR");
    };
    
    const formatarHora = (hora: string | Date) => {
      const h = typeof hora === "string" ? new Date(hora) : hora;
      return h.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const dadosPaginados = dados.slice(indiceInicial, indiceInicial + itensPorPagina);

    return (
      <Card className="mt-4 p-4 rounded-lg shadow">  
        <CardContent>
        <Typography variant="h6" gutterBottom>
          Resultados
        </Typography>

        <TableContainer>
              <Table className="w-full text-sm">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Placa</TableCell>
                    <TableCell>Local</TableCell>
                    <TableCell>Km</TableCell>
                    <TableCell>Sentido</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
                  {dadosPaginados.map((item: any) => {
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{formatarData(item.data)}</TableCell>
                        <TableCell>{item.hora}</TableCell>
                        <TableCell>{item.placa ?? "—"}</TableCell>
                        <TableCell>{item.rodovia}</TableCell>
                        <TableCell>{item.km}</TableCell>
                        <TableCell>{item.sentido}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>   

            <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
          <FormControl size="small">
            <InputLabel id="itens-por-pagina-label">Itens por página</InputLabel>
            <Select
              labelId="itens-por-pagina-label"
              value={itensPorPagina.toString()}
              onChange={handleChangeItensPorPagina}
              label="Itens por página"
            >
              {[5, 10, 20, 50].map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {valor}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Pagination
            count={totalPaginas}
            page={paginaAtual}
            onChange={handleChangePagina}
            color="primary"
            shape="rounded"
          />
        </Box>     
        </CardContent>
      </Card>
    );
  }