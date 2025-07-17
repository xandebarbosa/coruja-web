'use client';

import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { getFilterOptions, LocalSearchParams, searchByLocal, getKmsByRodovia, searchAllByLocalForExport } from '../services/api';
import CustomPagination from '../components/CustomPagination';
import { Box, Button, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { exportToExcel } from '../components/ExportExcel';
import { toast } from 'react-toastify';
//import { ExportExcel } from '../components/ExportExcel';

const columns: GridColDef[] = [
  { field: 'data', headerName: 'Data', width: 150, 
    valueFormatter: (value: string) => {
      if (!value) {
        return '';
      }
      // Adiciona T00:00:00 para garantir que o navegador interprete como data local,
    // evitando um bug comum de fuso horário que poderia mostrar o dia anterior.
      const date = new Date(`${value}T00:00:00`);
      return date.toLocaleDateString('pt-BR');
    }
  },
  { field: 'hora', headerName: 'Hora', width: 150 },
  { field: 'placa', headerName: 'Placa', width: 150 },
  { field: 'praca', headerName: 'Praça', width: 200 },
  { field: 'rodovia', headerName: 'Rodovia', width: 200 },
  { field: 'km', headerName: 'KM', width: 100 },
  { field: 'sentido', headerName: 'Sentido', width: 150 },
];

export default function ConsultaLocal() {
  const [filters, setFilters] = useState({
    concessionaria: '',
    rodovia: '',
    praca: '',
    km: '',
    sentido: '',
    data: '',
    horaInicial: '',
    horaFinal: '',
  });

  //Armazena as opções dos selects
  const [options, setOptions] = useState({
    rodovias: [],    
    kms: [],
    sentidos: [],
    pracas: [],
  });

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [kmsLoading, setKmsLoading] = useState(false); // Novo estado de loading para os KMs

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [exporting, setExporting] = useState(false);

  //useEffect para buscar as opções quando a concessionária muda
  useEffect(() => {
    const fetchOptions = async () => {
      if (!filters.concessionaria) {
        setOptions({ rodovias: [], pracas: [], kms: [], sentidos: []});
        return;
      }
      setOptionsLoading(true);

      try {
        const data = await getFilterOptions(filters.concessionaria);
        // Inicializamos os KMs como uma lista vazia
        setOptions({ ...data, kms: [] });
      } catch (error) {
        console.log(error);
        alert('Não foi possível carregar as opções de filtro.');        
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, [filters.concessionaria]); // Roda sempre que o valor de 'concessionaria' muda

  // =================================================================
    // ##  NOVO useEffect PARA OS FILTROS DEPENDENTES
    // =================================================================
    useEffect(() => {
        const fetchKms = async () => {
            // Só busca se tivermos uma concessionária E uma rodovia selecionada
            if (!filters.concessionaria || !filters.rodovia) {
                setOptions(prev => ({ ...prev, kms: [] })); // Limpa os KMs se a rodovia for desmarcada
                return;
            }
            setKmsLoading(true);
            try {
                const kmsData = await getKmsByRodovia(filters.concessionaria, filters.rodovia);
                setOptions(prev => ({ ...prev, kms: kmsData }));
            } catch (error) {
                console.error("Erro ao buscar KMs:", error);
                setOptions(prev => ({ ...prev, kms: [] })); // Limpa em caso de erro
            } finally {
                setKmsLoading(false);
            }
        };

        fetchKms();
    }, [filters.rodovia]); // Este hook RODA SEMPRE QUE a rodovia for alterada

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;

    // Começamos com uma cópia dos filtros atuais e atualizamos o campo que mudou
    const newFilters = {
      ...filters,
      [name]: value,
    };

    // Agora, aplicamos as regras de reset em cascata
    
    // REGRA 1: Se a CONCESSIONÁRIA mudou, limpe todos os filtros de LOCALIZAÇÃO dependentes.
    // Mas mantenha os filtros de data e hora!
    if (name === 'concessionaria') {
      newFilters.rodovia = '';
      newFilters.praca = '';
      newFilters.km = '';
      newFilters.sentido = '';
      // Limpa os resultados da busca anterior
      setRows([]);
      setRowCount(0);
    }

    // REGRA 2: Se a RODOVIA mudou, limpe apenas o KM, que depende dela.
    if (name === 'rodovia') {
      newFilters.km = '';
    }
    
    // Atualiza o estado com todos os filtros (o que mudou e o que foi resetado)
    setFilters(newFilters);
  };

  // NOVO: Handler específico para os componentes TextField (data/hora)
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const handleSearch = async (page = 0, pageSize = paginationModel.pageSize) => {
     if (!filters.concessionaria) {
            alert('Por favor, selecione uma concessionária.');
            return;
        }
        setLoading(true);

        // Cria um objeto de parâmetros que corresponde EXATAMENTE à interface LocalSearchParams
        const paramsToSend: LocalSearchParams = {
            page,
            pageSize,
            concessionaria: filters.concessionaria, // TypeScript agora sabe que isso é uma string por causa do 'if' acima
            
            // Operadores ternários para adicionar os campos corretos baseados na regra de negócio
            rodovia: filters.concessionaria !== 'eixo' ? filters.rodovia : undefined,
            km: filters.concessionaria !== 'eixo' ? filters.km : undefined,
            praca: filters.concessionaria === 'eixo' ? filters.praca : undefined,
            
            // Campos comuns (envia o valor ou undefined se estiver vazio, para não poluir a URL)
            sentido: filters.sentido || undefined,
            data: filters.data || undefined,
            horaInicial: filters.horaInicial || undefined,
            horaFinal: filters.horaFinal || undefined,
        };

        try {
            // Chama a API com os parâmetros limpos e corretos
            const data = await searchByLocal(paramsToSend);            
            setRows(data.content);
            setRowCount(data.page.totalElements);
        } catch (error) {
            console.error(error);
            alert('Erro ao buscar dados.');
        } finally {
            setLoading(false);
        }
  };

  useEffect(() => {
    if (filters.concessionaria) {
      handleSearch(paginationModel.page, paginationModel.pageSize);
    }
  }, [paginationModel]);

  // #NOVA FUNÇÃO PARA LIDAR COM A EXPORTAÇÃO
  const handleExport = async () => {
        if (!filters.concessionaria) {
            alert('Por favor, selecione uma concessionária para exportar.');
            return;
        }
        setExporting(true); // Ativa o loading do botão de exportar
        try {
            // Monta os parâmetros de busca (sem paginação)
            const paramsToExport = {
                concessionaria: filters.concessionaria,
                rodovia: filters.concessionaria !== 'eixo' ? filters.rodovia : undefined,
                km: filters.concessionaria !== 'eixo' ? filters.km : undefined,
                praca: filters.concessionaria === 'eixo' ? filters.praca : undefined,
                sentido: filters.sentido || undefined,
                data: filters.data || undefined,
                horaInicial: filters.horaInicial || undefined,
                horaFinal: filters.horaFinal || undefined,
            };

            // Chama a nova função da API que busca TODOS os dados
            const allData = await searchAllByLocalForExport(paramsToExport);

            if (allData.length === 0) {
              alert("Nenhum dado encontrado para exportar com os filtros selecionados.");
              toast.warn("Nenhum dado encontrado para exportar com os filtros selecionados.");
              setExporting(false);
              return;
            }
            
            // 2. Cria um mapa para contar as ocorrências de cada placa
            const plateCounts = new Map<string, number>();
            allData.forEach((row: { placa: string; }) => {
                plateCounts.set(row.placa, (plateCounts.get(row.placa) || 0) + 1);
            });

            // 3. Adiciona a nova coluna de contagem a cada linha de dado
            const dataWithCounts = allData.map((row: { placa: string; }) => ({
              ...row,
              'Contagem': plateCounts.get(row.placa) // Adiciona a nova coluna 'Contagem'
            }));
        
            // 4. Passa os dados processados e um nome de arquivo para a função de exportação
            exportToExcel(dataWithCounts, "Relatorio_Radares");
                // Passa os dados recebidos para a sua função de exportação
                //exportToExcel(allData);

        } catch (error) {
            console.error(error);
            alert('Erro ao gerar o relatório.');
            toast.error("Erro ao gerar o relatório.");
        } finally {
            setExporting(false); // Desativa o loading do botão
        }
    };

  return (
    <div className='px-2 pt-2'>      
      <Card className='mb-2'>
        <CardContent>
          <Typography variant="h4" className="text-3xl font-bold text-gray-800">Consulta por Local e Concessionária</Typography>
        </CardContent>
      </Card>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
          <FormControl fullWidth size="small">
            <InputLabel id="concessionaria-select-label">Concessionária</InputLabel>
            <Select
              labelId="concessionaria-select-label"
              label="Concessionária"
              name="concessionaria"
              value={filters.concessionaria}
              onChange={handleSelectChange}
            >
              <MenuItem value=""><em>Selecione a Concessionária</em></MenuItem>
              <MenuItem value="cart">Cart</MenuItem>
              <MenuItem value="eixo">Eixo</MenuItem>
              <MenuItem value="rondon">Rondon</MenuItem>
              <MenuItem value="entrevias">Entrevias</MenuItem>
            </Select>
          </FormControl>

          {filters.concessionaria === 'eixo' ? (
              // ==========================================================
              //            FILTROS ESPECÍFICOS PARA "EIXO"
              // ==========================================================
              <>
                  <FormControl fullWidth size="small" disabled={optionsLoading || !filters.concessionaria}>
                      <InputLabel id="local-select-label">Local</InputLabel>
                      <Select
                          labelId="local-select-label"
                          label="Local"
                          name="praca" // Enviará como parâmetro "praca"
                          value={filters.praca}
                          onChange={handleSelectChange}
                      >
                          <MenuItem value="">
                            <em>{optionsLoading ? 'Buscando...' : 'Todos os Locais'}</em>
                          </MenuItem>
                          {/* Lembre-se: o backend do Eixo retorna a lista de locais/praças no campo 'rodovias' do DTO */}
                          {options?.pracas?.map(local => <MenuItem key={local} value={local}>{local}</MenuItem>)}
                      </Select>
                  </FormControl>
                  {/* O campo KM é omitido para a concessionária Eixo */}
                  <Box /> 
              </>
          ) : (
              // ==========================================================
              //         FILTROS PADRÃO PARA OUTRAS CONCESSIONÁRIAS
              // ==========================================================
              <>
                  <FormControl fullWidth size="small" disabled={optionsLoading || !filters.concessionaria}>
                      <InputLabel id="rodovia-select-label">Rodovia</InputLabel>
                      <Select 
                        name="rodovia" 
                        value={filters.rodovia} 
                        onChange={handleSelectChange} 
                        label="Rodovia"
                        IconComponent={optionsLoading ? () => <CircularProgress size={15} sx={{ marginRight: '12px'}}/> : undefined}
                      >
                          <MenuItem value="">
                            <em>{optionsLoading ? 'Buscando...' : 'Todas as Rodovias'}</em>
                          </MenuItem>
                          {options.rodovias.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                      </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" disabled={optionsLoading || !filters.rodovia || kmsLoading}>
                      <InputLabel id="km-select-label">KM</InputLabel>
                      <Select 
                        name="km" 
                        value={filters.km} 
                        onChange={handleSelectChange} 
                        label="KM"
                        IconComponent={kmsLoading ? () => <CircularProgress size={20} sx={{ marginRight: '12px' }} /> : undefined}
                      >
                          <MenuItem value="">
                            <em>{kmsLoading ? 'Buscando...' : 'Todos os KMs'}</em>
                          </MenuItem>
                          {options.kms.map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
                      </Select>
                  </FormControl>
              </>
          )}
          {/* ############################################################### */}
          {/* ##              FIM DO BLOCO CONDICIONAL                   ## */}
          {/* ############################################################### */}

            {/* O filtro de Sentido é comum a todos, então fica fora do bloco condicional */}
            <FormControl fullWidth size="small" disabled={optionsLoading || !filters.concessionaria}>
                <InputLabel id="sentido-select-label">Sentido</InputLabel>
                <Select name="sentido" value={filters.sentido} onChange={handleSelectChange} label="Sentido">
                    <MenuItem value=""><em>{optionsLoading ? 'Buscando...' : 'Todos os Sentidos'}</em></MenuItem>
                    {options.sentidos.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
            </FormControl>
                    
            {/* Campos de data/hora */}
            <TextField label="Data" type="date" name="data" value={filters.data} onChange={handleTextFieldChange} InputLabelProps={{ shrink: true }} size="small" fullWidth />
            <TextField label="Hora Inicial" type="time" name="horaInicial" value={filters.horaInicial} onChange={handleTextFieldChange} InputLabelProps={{ shrink: true }} size="small" fullWidth />
            <TextField label="Hora Final" type="time" name="horaFinal" value={filters.horaFinal} onChange={handleTextFieldChange} InputLabelProps={{ shrink: true }} size="small" fullWidth />
        </div>
        <div className="mt-2 flex justify-between space-x-3 gap-3">
          <Button variant='contained' onClick={() => handleSearch()} disabled={loading}> 
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button 
            variant="contained"  
            color="success" 
            onClick={handleExport}
            disabled={exporting || loading}>
            {exporting ? 'Exportando...' : 'Exportar para Excel'}
          </Button>
            
        </div>
      </div>
      
      <Box className="bg-white rounded-lg shadow-sm h-[36rem] w-full">
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          slots={{
            pagination: CustomPagination
          }}
        />
      </Box>
    </div>
  );
}