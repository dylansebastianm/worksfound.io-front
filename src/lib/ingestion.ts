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
}

export interface GetIngestionConfigResponse {
  success: boolean;
  config?: IngestionConfig;
  error?: string;
}

export interface UpdateIngestionConfigResponse {
  success: boolean;
  message?: string;
  config?: IngestionConfig;
  error?: string;
}

export interface AnalyzeIngestionConfigResponse {
  success: boolean;
  seedTotalResults?: number;
  estimatedBaseCoveragePct?: number;
  strategyMap?: {
    base: any[];
    harvest: any[];
  };
  error?: string;
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

