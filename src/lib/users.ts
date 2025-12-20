import { getAuthHeaders } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface UserStatistics {
  total_applications: number;
  total_ai_interactions: number;
  last_application_date: string | null;
  last_ai_interaction_date: string | null;
}

export interface User {
  id: number;
  fullname: string;
  email: string;
  phone: string | null;
  sector: string | null;
  auto_apply: boolean;
  total_applications: number;
  start_date: string | null;
  days_remaining: number | null;
  status: 'active' | 'inactive' | 'contracted' | 'cancelled';
}

// Interfaz para la respuesta del endpoint (mantener para compatibilidad si se necesita)
export interface UserStatistics {
  total_applications: number;
  total_ai_interactions: number;
  last_application_date: string | null;
  last_ai_interaction_date: string | null;
}

export interface GetUsersResponse {
  success: boolean;
  users?: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: string;
  message?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'contracted' | 'cancelled';
  sector?: 'IT' | 'Sales' | 'Customer Experience';
  search?: string;
}

/**
 * Obtiene la lista de usuarios (requiere permisos de administrador)
 */
export async function getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.sector) queryParams.append('sector', params.sector);
    if (params.search) queryParams.append('search', params.search);

    const url = `${API_URL}/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
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
    console.error('Error obteniendo usuarios:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

