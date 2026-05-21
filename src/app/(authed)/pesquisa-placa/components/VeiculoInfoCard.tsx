import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
import { InfoIcon, CalendarPlusIcon } from "lucide-react";
import {
  DirectionsCarOutlined,
  PaletteOutlined,
  LocationCityOutlined,
} from "@mui/icons-material";

export default function VeiculoInfoCard({ veiculoInfo }: { veiculoInfo: any }) {
  if (!veiculoInfo) return null;

  return (
    <Card className="mb-6 border-l-4 border-[#1976d2] shadow-md">
      <CardContent className="p-5">
        <Typography
          variant="h6"
          className="mb-4 flex items-center gap-2 font-bold text-gray-800"
        >
          <InfoIcon color="primary" /> Informações do Veículo
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <div className="rounded-lg bg-blue-50 p-2">
                <DirectionsCarOutlined sx={{ color: "#1976d2" }} />
              </div>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Marca / Modelo
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {veiculoInfo.marcaModelo || "Não informado"}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 8, md: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <div className="rounded-lg bg-purple-50 p-2">
                <PaletteOutlined sx={{ color: "#9c27b0" }} />
              </div>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Cor
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {veiculoInfo.cor || "Não informada"}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <div className="rounded-lg bg-green-50 p-2">
                <LocationCityOutlined sx={{ color: "#2e7d32" }} />
              </div>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Município/UF
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {veiculoInfo.municipio || "Não informado"} -{" "}
                  {veiculoInfo.uf || "Não informado"}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 8, md: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <div className="rounded-lg bg-red-50 p-2">
                <InfoIcon style={{ color: "#ef4444" }} />
              </div>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  CPF Proprietário
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {veiculoInfo.cpfProprietario || "Não informado"}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <div className="rounded-lg bg-red-50 p-2">
                <CalendarPlusIcon style={{ color: "#42213D" }} />
              </div>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Ano/Modelo
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {veiculoInfo.anoModelo || "Não informado"}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
