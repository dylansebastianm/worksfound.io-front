import { getAuthHeaders } from './auth';
import type { GetIngestionLogsParams, GetIngestionLogsResponse } from '@/types/ingestion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface IngestionConfig {
  id: number | null;
  url: string;
  max_jobs: number;
  scheduled_time: string | null;
  auto_schedule_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
  /** Total de resultados en la URL semilla (lo que muestra LinkedIn) */
  seed_total_results?: number | null;
  /** Lista de segmentos: { url, results_count, scrapeable_count?, filters? } */
  generated_queue?: {
    url: string;
    results_count: number | null;
    /** Máximo a scrapear por URL (min(results_count, 999)); viene del back */
    scrapeable_count?: number;
    /** Smart Harvest: tipo de URL */
    type?: "BASE" | "HARVEST";
    harvest_type?: string;
    filters?: {
      work_type?: string;
      job_type?: string;
      experience_level?: string;
      time_posted?: string;
      keyword?: string;
      sortBy?: string;
      harvest?: string;
    };
  }[] | null;
  /** Suma de results_count de todos los segmentos (para comparar con seed_total_results) */
  segments_total?: number | null;
  /** Porcentaje de cobertura: (segments_total / seed_total_results) * 100 */
  coverage_percent?: number | null;
  /** Explorador (productor) */
  explorer_execution_id?: string | null;
  explorer_status?: string | null;
  explorer_started_at?: string | null;
  explorer_finished_at?: string | null;
  explorer_error?: string | null;
}

export interface GetIngestionConfigResponse {
  success: boolean;
  config?: IngestionConfig;
  error?: string;
}

export interface UpdateIngestionConfigResponse {
  success: boolean;
  message?: string;
  explorer_ran?: boolean;
  explorer_started?: boolean;
  config?: IngestionConfig;
  error?: string;
}

export interface AnalyzeIngestionConfigResponse {
  success: boolean;
  cancelled?: boolean;
  seedTotalResults?: number;
  estimatedBaseCoveragePct?: number;
  strategyMap?: {
    base: any[];
    harvest: any[];
  };
  error?: string;
}

export interface CancelExplorerResponse {
  success: boolean;
  message?: string;
  cancel_requested?: boolean;
  was_running?: boolean;
  error?: string;
}

export interface ExplorerCountryProgressRow {
  country: string
  first_seen_at: string | null
  /** Cuando terminó de recopilar toda la info del país (último batch creado) */
  last_seen_at?: string | null
  /** Tiempo de ejecución hasta terminar de recopilar la info del país (segundos) */
  execution_time_seconds?: number | null
  audit_total: number
  audit_url?: string | null
  segments_count: number
  segments_expected_sum: number
  segments_budget_sum: number
  segments_pending: number
  segments_processing: number
  segments_completed: number
  segments_failed: number
  segmentation_coverage_pct?: number | null
}

export interface GetIngestionExplorerStatusResponse {
  success: boolean
  running?: boolean
  execution_id?: string | null
  status?: string | null
  started_at?: string | null
  finished_at?: string | null
  error?: string | null
  seed_url?: string | null
  rows_count?: number
  stalled?: boolean
  stalled_reason?: string | null
  totals?: {
    countries_seen: number
    countries_limit?: number | null
    seed_url_total_results?: number
    audit_total_sum: number
    segments_count_sum: number
    segments_budget_sum: number
    coverage_vs_audit_sum_pct?: number | null
    global_coverage_vs_seed_pct?: number | null
    scrapeable_cap_per_url: number
  }
  countries?: ExplorerCountryProgressRow[]
}

/**
 * Obtiene la configuración de ingesta (requiere permisos de administrador)
 * 
 * @returns Respuesta con la configuración de ingesta
 */
export async function getIngestionConfig(): Promise<GetIngestionConfigResponse> {
  try {
    const response = await fetch(`${API_URL}/api/admin/ingestion-config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: 'Acceso denegado: Se requieren permisos de administrador.',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo configuración de ingesta:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Actualiza la configuración de ingesta (requiere permisos de administrador)
 * 
 * @param config - Configuración a actualizar (campos opcionales)
 * @returns Respuesta con la configuración actualizada
 */
export async function updateIngestionConfig(config: Partial<IngestionConfig>): Promise<UpdateIngestionConfigResponse> {
  try {
    const response = await fetch(`${API_URL}/api/admin/ingestion-config`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: 'Acceso denegado: Se requieren permisos de administrador.',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error actualizando configuración de ingesta:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Analiza una URL semilla sin persistir (Smart Harvest).
 */
export async function analyzeIngestionConfig(url: string): Promise<AnalyzeIngestionConfigResponse> {
  try {
    const response = await fetch(`${API_URL}/api/admin/ingestion-config/analyze`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (response.status === 401) {
      return { success: false, error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.' };
    }
    if (response.status === 403) {
      return { success: false, error: 'Acceso denegado: Se requieren permisos de administrador.' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analizando URL de ingesta:', error);
    return { success: false, error: 'Error conectando con el servidor' };
  }
}

/**
 * Cancela inmediatamente el explorador activo (análisis/segmentación) del admin actual.
 */
export async function cancelIngestionExplorer(): Promise<CancelExplorerResponse> {
  try {
    const response = await fetch(`${API_URL}/api/admin/ingestion-config/explorer/cancel`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      return { success: false, error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.' };
    }
    if (response.status === 403) {
      return { success: false, error: 'Acceso denegado: Se requieren permisos de administrador.' };
    }
    return await response.json();
  } catch (error) {
    console.error('Error cancelando explorador:', error);
    return { success: false, error: 'Error conectando con el servidor' };
  }
}

export async function getIngestionExplorerStatus(
  limit = 100,
  opts?: { signal?: AbortSignal }
): Promise<GetIngestionExplorerStatusResponse> {
  try {
    const url = `${API_URL}/api/admin/ingestion-config/explorer/status?limit=${encodeURIComponent(String(limit))}`
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      signal: opts?.signal,
    })

    if (response.status === 401) return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    if (response.status === 403) return { success: false, error: "Acceso denegado: Se requieren permisos de administrador." }
    return await response.json()
  } catch (error) {
    console.error("Error obteniendo estado del explorador:", error)
    return { success: false, error: "Error conectando con el servidor" }
  }
}

/**
 * Obtiene los logs de ingesta (requiere permisos de administrador)
 * 
 * @param params - Parámetros de filtrado y paginación
 * @returns Respuesta con los logs de ingesta y paginación
 */
export async function getIngestionLogs(params: GetIngestionLogsParams = {}): Promise<GetIngestionLogsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.sortField) queryParams.append('sort_field', params.sortField);
    if (params.sortDirection) queryParams.append('sort_direction', params.sortDirection);

    const url = `${API_URL}/api/admin/ingestion-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: 'Acceso denegado: Se requieren permisos de administrador.',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo logs de ingesta:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}


// ----------------------------
// Nuevo reporting (batches)
// ----------------------------

export interface IngestionSummaryRow {
  /** Identificador del run de ingesta (cada ejecución del scraper = un registro único). */
  ingestion_log_id?: number | null
  execution_id: string
  country: string
  start_date: string | null
  duration: string
  status: "En Progreso" | "Finalizado" | "Fallido" | "Cancelado" | string
  audit_total: number
  segmentation_total: number
  inserted_total: number
  exploration_coverage_pct: number
  final_coverage_pct: number
}

export interface IngestionDetailBatchRow {
  batch_id: number
  status: string
  filters_readable: string[]
  original_url: string
  expected_count: number
  inserted_count: number
  efficiency_pct: number
  /** Tiempo de ejecución del batch en segundos */
  execution_time_seconds?: number | null
  updated_at: string
}

export interface IngestionCountryDetailResponse {
  header: {
    country: string
    audit_total: number
    audit_url?: string | null
    inserted_total: number
    /** Suma de tiempos de ejecución de todos los batches del país (segundos) */
    total_execution_seconds?: number | null
  }
  batches: IngestionDetailBatchRow[]
}

export async function getIngestionsSummary(): Promise<{ success: boolean; rows?: IngestionSummaryRow[]; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/ingestions/summary`, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (response.status === 401) return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    if (response.status === 403) return { success: false, error: "Acceso denegado: Se requieren permisos de administrador." }

    const data = await response.json()
    if (!Array.isArray(data)) return { success: false, error: "Respuesta inválida del servidor." }
    return { success: true, rows: data as IngestionSummaryRow[] }
  } catch (error) {
    console.error("Error obteniendo resumen de ingestas:", error)
    return { success: false, error: "Error conectando con el servidor" }
  }
}

export async function getIngestionCountryDetail(
  executionId: string,
  country: string
): Promise<{ success: boolean; detail?: IngestionCountryDetailResponse; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/ingestions/${encodeURIComponent(executionId)}/${encodeURIComponent(country)}/detail`, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (response.status === 401) return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    if (response.status === 403) return { success: false, error: "Acceso denegado: Se requieren permisos de administrador." }
    if (!response.ok) return { success: false, error: "Error obteniendo detalle." }

    const data = await response.json()
    if (!data || typeof data !== "object") return { success: false, error: "Respuesta inválida del servidor." }
    return { success: true, detail: data as IngestionCountryDetailResponse }
  } catch (error) {
    console.error("Error obteniendo detalle de ingesta:", error)
    return { success: false, error: "Error conectando con el servidor" }
  }
}

/** Detalle por run (ingestion_log_id) y país. Muestra solo los batches de ese run. */
export async function getIngestionDetailByLog(
  ingestionLogId: number,
  country: string
): Promise<{ success: boolean; detail?: IngestionCountryDetailResponse; error?: string }> {
  try {
    const response = await fetch(
      `${API_URL}/api/ingestions/log/${ingestionLogId}/${encodeURIComponent(country)}/detail`,
      { method: "GET", headers: getAuthHeaders() }
    )

    if (response.status === 401) return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    if (response.status === 403) return { success: false, error: "Acceso denegado: Se requieren permisos de administrador." }
    if (!response.ok) return { success: false, error: "Error obteniendo detalle." }

    const data = await response.json()
    if (!data || typeof data !== "object") return { success: false, error: "Respuesta inválida del servidor." }
    return { success: true, detail: data as IngestionCountryDetailResponse }
  } catch (error) {
    console.error("Error obteniendo detalle de ingesta por log:", error)
    return { success: false, error: "Error conectando con el servidor" }
  }
}

