import { getAuthHeaders } from './auth';
import type { GetAdminStatisticsResponse, RunProxyDiagnosticResponse } from '@/types/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Obtiene las estadísticas generales del sistema (requiere permisos de administrador)
 * 
 * @returns Respuesta con las estadísticas del sistema
 */
export async function getAdminStatistics(): Promise<GetAdminStatisticsResponse> {
  try {
    const response = await fetch(`${API_URL}/api/admin/statistics`, {
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
    console.error('Error obteniendo estadísticas de admin:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Ejecuta el diagnóstico de proxy para un usuario (requiere permisos de administrador)
 * Body: { user_id: number }
 */
export async function runProxyDiagnostic(userId: number): Promise<RunProxyDiagnosticResponse> {
  try {
    const response = await fetch(`${API_URL}/api/admin/proxy-diagnostic`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
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
    }    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error ejecutando diagnóstico de proxy:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}
