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

