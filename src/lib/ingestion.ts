import { getAuthHeaders } from './auth';
import type { GetIngestionLogsParams, GetIngestionLogsResponse } from '@/types/ingestion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

