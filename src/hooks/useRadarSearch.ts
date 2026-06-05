import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { radarsService } from "@/app/services";
import { RadarsDTO } from "@/app/types/types";

export function useRadarSearch() {
  const [placaInput, setPlacaInput] = useState("");
  const [rows, setRows] = useState<RadarsDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [latestRowId, setLatestRowId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [veiculoInfo, setVeiculoInfo] = useState<any | null>(null);

  const fetchRadars = useCallback(
    async (placa: string, page: number, pageSize: number) => {
      setLoading(true);
      try {
        const data = await radarsService.searchByPlaca(placa, page, pageSize);

        if (data.content && data.content.length > 0) {
          const maisRecente = data.content.reduce(
            (latest: RadarsDTO, current: RadarsDTO) => {
              const latestTime = new Date(
                `${latest.data}T${latest.hora}`,
              ).getTime();
              const currentTime = new Date(
                `${current.data}T${current.hora}`,
              ).getTime();
              return currentTime > latestTime ? current : latest;
            },
          );
          setLatestRowId(Number(maisRecente.id));

          const detranInfo = data.content.find(
            (item: RadarsDTO) => item.marcaModelo || item.cor || item.municipio,
          );
          setVeiculoInfo(detranInfo || null);
        } else {
          setLatestRowId(null);
          setVeiculoInfo(null);
        }

        setRows(data.content);
        setRowCount(data.page.totalElements);
      } catch (error) {
        toast.error("Erro ao buscar dados da placa.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSearch = () => {
    if (!placaInput.trim()) {
      toast.info("Por favor, insira uma placa.");
      return;
    }
    setHasSearched(true);
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
    //fetchRadars(placaInput, 0, paginationModel.pageSize);
  };

  useEffect(() => {
    if (placaInput && hasSearched) {
      fetchRadars(placaInput, paginationModel.page, paginationModel.pageSize);
    }
  }, [paginationModel.page, paginationModel.pageSize, hasSearched]);

  return {
    placaInput,
    setPlacaInput,
    rows,
    loading,
    rowCount,
    paginationModel,
    setPaginationModel,
    latestRowId,
    hasSearched,
    veiculoInfo,
    handleSearch,
  };
}
