/**
 * Tipos globales para el módulo de ingestion logs
 */

/** Estado de una URL dentro de la cola de una ejecución */
export interface SearchDetailItem {
  url: string;
  order: number;
  status: "pending" | "processing" | "completed" | "failed";
  jobs_found?: number;
  /** Jobs únicos aportados por esta URL (seg_saved) */
  jobs_inserted?: number;
  /** Duplicados en esta URL (jobs_found - jobs_inserted) */
  duplicates?: number;
  /** Total que muestra LinkedIn para esta URL (informativo) */
  results_count?: number | null;
  /** Máximo que se va a scrapear para esta URL (min(results_count, 999)) */
  scrapeable_count?: number | null;
  /** Filtros aplicados a la URL (si viene de generated_queue del explorador) */
  filters?: {
    work_type?: string;
    job_type?: string;
    experience_level?: string;
    time_posted?: string;
    /** Harvest: keyword usada para diversificar el set visible */
    keyword?: string;
    /** Harvest: sortBy aplicado (ej. Fecha) */
    sortBy?: string;
    /** Marca de harvest (keyword/sort) */
    harvest?: string;
  } | null;
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
  /** Total semilla al iniciar la ingesta (para calcular cobertura real) */
  seedTotalResults?: number | null;
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

