import { 
  Card, 
  CardContent, 
  Typography, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Table, 
  TableContainer, 
  Box, 
  Pagination, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  type SelectChangeEvent 
} from "@mui/material";
import { useState } from "react";
// ✅ Importação do tipo correto compartilhado
import { RadarsDTO } from "../types/types";

interface DetailsTableProps {
  dados: RadarsDTO[]; // ✅ Usa a interface correta que possui 'data?' (opcional)
}

export default function DetailsTable({ dados }: DetailsTableProps) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Garante que dados não seja undefined antes de acessar length
  const listaDados = dados || [];
  const totalPaginas = Math.ceil(listaDados.length / itensPorPagina);

  const handleChangePagina = (_: React.ChangeEvent<unknown>, novaPagina: number) => {
    setPaginaAtual(novaPagina);
  };

  const handleChangeItensPorPagina = (event: SelectChangeEvent) => {
    setItensPorPagina(Number(event.target.value));
    setPaginaAtual(1);
  };

  // ✅ Função ajustada para aceitar undefined (já que no DTO é opcional)
  const formatarData = (data?: string | Date) => {
    if (!data) return "—";
    const d = typeof data === "string" ? new Date(data) : data;
    // Adiciona "UTC" ou ajusta fuso se necessário, mas o básico é:
    return d.toLocaleDateString("pt-BR");
  };

  const formatarHora = (hora?: string | Date) => {
    if (!hora) return "—";
    const h = typeof hora === "string" ? new Date(hora) : hora;
    return h.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const dadosPaginados = listaDados.slice(indiceInicial, indiceInicial + itensPorPagina);

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
              {dadosPaginados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatarData(item.data)}</TableCell>
                  <TableCell>{formatarHora(item.hora)}</TableCell>
                  <TableCell>{item.placa ?? "—"}</TableCell>
                  <TableCell>{item.rodovia}</TableCell>
                  <TableCell>{item.km}</TableCell>
                  <TableCell>{item.sentido}</TableCell>
                </TableRow>
              ))}
              {listaDados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {listaDados.length > 0 && (
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
        )}
      </CardContent>
    </Card>
  );
}