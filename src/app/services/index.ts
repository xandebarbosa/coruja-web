import { analysisService } from './analysis';
import { logsService } from './logs';
import { monitoringService } from './monitoring';
import { radarsService } from './radars';

export { radarsService } from '../services/radars'//'./radars.service';
export { monitoringService } from '../services/monitoring'//'./monitoring.service';
export { logsService } from '../services/logs'//'./logs.service';
export { analysisService } from '../services/analysis'//'./analysis.service';
export { default as api } from './client';

// Backward compatibility - exporta as funções antigas
export { 
  radarsService as RadarsService,
  monitoringService as MonitoringService,
  logsService as LogsService,
  analysisService as AnalysisService
};

// Re-exporta funções individuais para compatibilidade
export const searchByPlaca = radarsService.searchByPlaca.bind(radarsService);
export const searchByLocal = radarsService.searchByLocal.bind(radarsService);
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