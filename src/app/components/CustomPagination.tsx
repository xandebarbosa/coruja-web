'use client';

import {
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector,
  gridPageSizeSelector,    
  GridPagination, 
} from '@mui/x-data-grid';
import { Pagination, Select, MenuItem, SelectChangeEvent, Box } from '@mui/material';
import { ComponentProps } from 'react'; // Importa o tipo utilitário do React

// CORREÇÃO: Usamos o tipo do componente GridPagination para definir nossas props
// Isso garante que receberemos tudo o que o DataGrid nos envia.
type CustomPaginationProps = ComponentProps<typeof GridPagination>;

// O nome da função agora usa nosso tipo customizado
export default function CustomPagination(props: CustomPaginationProps) {
  const apiRef = useGridApiContext();

  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);
  
  // Acessamos as opções de tamanho da página diretamente das props
  const pageSizeOptions = props.pageSizeOptions || [10, 25, 50];

  const rowCount = apiRef.current.state.pagination.rowCount;

  const firstRowIndex = rowCount > 0 ? page * pageSize + 1 : 0;
  const lastRowIndex = Math.min((page + 1) * pageSize, rowCount);

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const newPageSize = Number(event.target.value);
    apiRef.current.setPageSize(newPageSize);
  };

  return (
    <Box className="flex items-center justify-between w-full p-2 text-sm text-gray-700">
      
      {/* Seção para o seletor de itens por página */}
      <div className="flex items-center space-x-2">
        <span>Itens por página:</span>
        <Select
          value={pageSize}
          onChange={handlePageSizeChange}
          variant="standard"
          sx={{
            fontSize: 'inherit',
            '.MuiSelect-select': { padding: '2px 24px 2px 8px' },
            '.MuiSvgIcon-root': { right: 0 },
            '&:before, &:after': { border: 'none' },
            '&:hover:not(.Mui-disabled):before': { border: 'none' },
          }}
        >
          {pageSizeOptions.map((option: any) => (
            <MenuItem key={typeof option === 'number' ? option : option.value} value={typeof option === 'number' ? option : option.value}>
              {typeof option === 'number' ? option : option.label}
            </MenuItem>
          ))}
        </Select>
      </div>

      {/* Informação de quantidade de itens */}
      <div className="hidden sm:block">
        Mostrando {firstRowIndex} - {lastRowIndex} de {rowCount}
      </div>

      {/* Componente de Paginação do Material-UI (o visual) */}
      <Pagination
        color="primary"
        shape="rounded"
        count={pageCount}
        page={page + 1}
        onChange={(event, value) => apiRef.current.setPage(value - 1)}
        sx={{
          // Seus estilos customizados continuam aqui
          '& .MuiPaginationItem-root': {
            borderRadius: '50%',
            margin: '0 2px',
          },
          '& .MuiPaginationItem-previousNext': {
            backgroundColor: '#f8f9fa',
            color: '#333',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            '&.Mui-disabled': { opacity: 0.5 },
            '&:last-of-type': {
              backgroundColor: '#D97706',
              color: 'white',
              border: 'none',
            },
            '&:first-of-type': {
              backgroundColor: 'white',
              color: 'black',
              border: '1px solid #dee2e6'
            }
          },
          '& .MuiPaginationItem-page.Mui-selected': {
            backgroundColor: '#D97706',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': { backgroundColor: '#B45309' },
          },
        }}
      />
    </Box>
  );
}