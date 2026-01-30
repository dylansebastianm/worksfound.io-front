/**
 * Tipos globales para el módulo de ingestion logs
 */

export interface IngestionLog {
  id: number;
  startDateTime: string;
  status: "Exitoso" | "Fallido" | "En Proceso" | "Error" | "Cancelado" | "Incompleto" | "Desconocido";
  executionTime: string;
  url: string;
  offersFound: number;
  duplicateOffers: number;
  offersInserted: number;
  targetJobs?: number | null;
  userId?: number | null;
  userName?: string | null;
}

export interface GetIngestionLogsParams {
  page?: number;
  limit?: number;
  status?: "Exitoso" | "Fallido" | "En Proceso" | "Error" | "Cancelado" | "Incompleto" | "all";
  sortField?: "date_time" | "found" | "inserted" | "duplicates";
  sortDirection?: "asc" | "desc";
}

export interface GetIngestionLogsResponse {
  success: boolean;
  logs?: IngestionLog[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

