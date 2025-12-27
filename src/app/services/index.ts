import { analysisService } from './analysis';
import { logsService } from './logs';
import { monitoringService } from './monitoring';
import { radarsService } from './radars';
import api from './client';

// Re-exporta as instâncias (Permite: import { radarsService } from '@/services')
export { 
  radarsService,
  monitoringService,
  logsService,
  analysisService,
  api
};

// Exporta Aliases com PascalCase (Opcional, para quem prefere tratar como "Classe Estática")
export { 
  radarsService as RadarsService,
  monitoringService as MonitoramentoService,
  logsService as LogsService,
  analysisService as IAService
};

// Re-exporta funções individuais para compatibilidade
export const searchByPlaca = radarsService.searchByPlaca.bind(radarsService);
export const searchByLocal = radarsService.searchByLocal.bind(radarsService);
export const searchByGeoLocation = radarsService.searchByGeoLocation.bind(radarsService);
export const getFilterOptions = radarsService.getFilterOptions.bind(radarsService);
export const getKmsByRodovia = radarsService.getKmsByRodovia.bind(radarsService);
export const getLatestRadars = radarsService.getLatestRadars.bind(radarsService);
export const getRadarsWithFilters = radarsService.getRadarsWithFilters.bind(radarsService);
export const searchAllByLocalForExport = radarsService.searchAllByLocalForExport.bind(radarsService);

export const getMonitoredPlates = monitoringService.getMonitoredPlates.bind(monitoringService);
export const createMonitoredPlate = monitoringService.createMonitoredPlate.bind(monitoringService);
export const updateMonitoredPlate = monitoringService.updateMonitoredPlate.bind(monitoringService);
export const deleteMonitoredPlate = monitoringService.deleteMonitoredPlate.bind(monitoringService);
export const getAlerts = monitoringService.getAlerts.bind(monitoringService);
export const getAlertHistory = monitoringService.getAlertHistory.bind(monitoringService);

export const searchLogs = logsService.searchLogs.bind(logsService);
export const analisarPlacaComIA = analysisService.analyzeConvoy.bind(analysisService);