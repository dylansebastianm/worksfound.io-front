/**
 * Tipos globales para el módulo de administración
 */

export interface PortalStatistics {
  name: string;
  count: number;
}

export interface AdminStatistics {
  users: {
    total: number;
    active: number;
    contracted: number;
    cancelled: number;
    contractedPercentage: number;
    avgContractDays: number;
  };
  offers: {
    total: number;
    byPortal: PortalStatistics[];
  };
  applications: {
    total: number;
    byPortal: PortalStatistics[];
  };
}

export interface GetAdminStatisticsResponse {
  success: boolean;
  statistics?: AdminStatistics;
  error?: string;
}

