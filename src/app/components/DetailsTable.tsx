import { Card, CardContent, Typography, TableHead, TableRow, TableCell, TableBody, Table, TableContainer, Box, Pagination, FormControl, InputLabel, MenuItem, Select, CircularProgress, SelectChangeEvent } from "@mui/material";

import type { Key } from "react";

interface RadarDTO {
  id: number;
  data: Date | string;  // Aceita string ou Date
  hora: Date | string;
  placa?: string;
  rodovia: string;
  km: string;
  sentido: string;
}

interface DetailsTableProps {
  dados: RadarDTO[];
  paginaAtual: number;
  totalPaginas: number;
  totalElementos: number;
  itensPorPagina: number;
  onPaginaChange: (event: React.ChangeEvent<unknown>, page: number) => void;
  onItensPorPaginaChange: (event: SelectChangeEvent<number>) => void;
  loading?: boolean;
}
  
  export default function DetailsTable({ 
    dados,
    paginaAtual,
    totalPaginas,
    totalElementos,
    onPaginaChange,
    itensPorPagina,
    onItensPorPaginaChange,
    loading = false
   }: DetailsTableProps) {

    const inicio = (paginaAtual * itensPorPagina) + 1;
    const fim = Math.min(inicio + itensPorPagina - 1, totalElementos);
    const dadosPaginados = dados.slice(paginaAtual * itensPorPagina, (paginaAtual + 1) * itensPorPagina);

    const formatarData = (data: string | Date) => {
      const d = typeof data === "string" ? new Date(data) : data;
      return d.toLocaleDateString("pt-BR");
    };
    
    const formatarHora = (hora: string | Date) => {
      const h = typeof hora === "string" ? new Date(hora) : hora;
      return h.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    return (
      <Card className="mt-4 p-4 rounded-lg shadow">  
        <CardContent>
        <Typography variant="h6" gutterBottom>
          Resultados
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" my={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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
                  {dadosPaginados.map((item) => {
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{formatarData(item.data)}</TableCell>
                        <TableCell>{formatarHora(item.hora)}</TableCell>
                        <TableCell>{item.placa}</TableCell>
                        <TableCell>{item.rodovia}</TableCell>
                        <TableCell>{item.km}</TableCell>
                        <TableCell>{item.sentido}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={3}
              flexWrap="wrap"
              gap={2}
            >
              <Typography variant="body2">
                Exibindo {inicio} a {fim} de {totalElementos} resultados
              </Typography>

              <Pagination
                count={totalPaginas}
                page={paginaAtual + 1}
                onChange={onPaginaChange}
                color="primary"
              />

              <FormControl size="small" variant="outlined">
                <InputLabel id="itens-por-pagina-label">Itens por página</InputLabel>
                <Select
                  labelId="itens-por-pagina-label"
                  value={itensPorPagina}
                  onChange={onItensPorPaginaChange}
                  label="Itens por página"
                >
                  {[10, 20, 50, 100].map((qtd) => (
                    <MenuItem key={qtd} value={qtd}>
                      {qtd}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </>
        )}
        </CardContent>
      </Card>
    );
  }