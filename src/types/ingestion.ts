/**
 * Tipos globales para el módulo de ingestion logs
 */

/** Estado de una URL dentro de la cola de una ejecución */
export interface SearchDetailItem {
  url: string;
  order: number;
  status: "pending" | "processing" | "completed" | "failed";
  jobs_found?: number;
  error?: string;
}

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
  screenshotBlobPath?: string | null;
  /** Desglose por URL de la cola (idempotencia/reanudación) */
  searchDetail?: SearchDetailItem[] | null;
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

