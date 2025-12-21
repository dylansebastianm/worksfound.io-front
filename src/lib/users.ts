import { getAuthHeaders } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

export interface UserProfile {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  age: string;
  gender: string;
  experienceYears: string;
  englishLevel: string;
  currentSalary: string;
  expectedSalary: string;
  institution: string;
  degreeTitle: string;
  preferredWorkModality: string[];
  jobChangeReason: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  city?: string;
  age?: string;
  gender?: string;
  experienceYears?: string;
  englishLevel?: string;
  currentSalary?: string;
  expectedSalary?: string;
  institution?: string;
  degreeTitle?: string;
  preferredWorkModality?: string[];
  jobChangeReason?: string;
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

/**
 * Obtiene la información del perfil del usuario autenticado
 */
export async function getUserProfile(): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/user/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Actualiza la información del perfil del usuario autenticado
 */
export async function updateUserProfile(profileData: UpdateUserProfileRequest): Promise<{ success: boolean; profile?: UserProfile; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

