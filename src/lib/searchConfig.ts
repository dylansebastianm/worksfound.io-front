import { getAuthHeaders } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ==================== TIPOS ====================

export interface GlobalSearchConfig {
  id: number;
  requiresEnglish: boolean;
  techStackFilter: 'none' | '100' | '70';
  countryFilter: 'all' | 'hispanic';
  workType: 'fulltime' | 'parttime' | 'both';
  acceptUnpaidInternships: boolean;
}

export interface JobSearchGroup {
  id: number;
  jobTitle: string;
  cvFile: string;
  positiveKeywords: string[];
  negativeKeywords: string[];
  priority: number;
  sector: 'IT' | 'Sales' | 'Customer Experience' | null;
}

export interface UpdateGlobalSearchRequest {
  requiresEnglish?: boolean;
  techStackFilter?: 'none' | '100' | '70';
  countryFilter?: 'all' | 'hispanic';
  workType?: 'fulltime' | 'parttime' | 'both';
  acceptUnpaidInternships?: boolean;
}

export interface CreateSearchGroupRequest {
  jobTitle: string;
  cvFile?: string;
  positiveKeywords?: string[];
  negativeKeywords?: string[];
  priority?: number;
  sector?: 'IT' | 'Sales' | 'Customer Experience' | null;
}

export interface UpdateSearchGroupRequest {
  jobTitle?: string;
  cvFile?: string;
  positiveKeywords?: string[];
  negativeKeywords?: string[];
  priority?: number;
  sector?: 'IT' | 'Sales' | 'Customer Experience' | null;
}

// ==================== FILTROS GLOBALES ====================

/**
 * Obtiene los filtros globales de búsqueda del usuario autenticado
 */
export async function getGlobalSearch(): Promise<{
  success: boolean;
  globalSearch?: GlobalSearchConfig;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/user/global-search`, {
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
    console.error('Error obteniendo filtros globales:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Actualiza los filtros globales de búsqueda del usuario autenticado
 */
export async function updateGlobalSearch(
  config: UpdateGlobalSearchRequest
): Promise<{
  success: boolean;
  globalSearch?: GlobalSearchConfig;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/user/global-search`, {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error actualizando filtros globales:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

// ==================== GRUPOS DE BÚSQUEDA ====================

/**
 * Obtiene todos los grupos de búsqueda del usuario autenticado
 */
export async function getSearchGroups(): Promise<{
  success: boolean;
  searchGroups?: JobSearchGroup[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/user/search-groups`, {
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
    console.error('Error obteniendo grupos de búsqueda:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Crea un nuevo grupo de búsqueda
 */
export async function createSearchGroup(
  group: CreateSearchGroupRequest
): Promise<{
  success: boolean;
  searchGroup?: JobSearchGroup;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/user/search-groups`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
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
    console.error('Error creando grupo de búsqueda:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Actualiza un grupo de búsqueda existente
 */
export async function updateSearchGroup(
  groupId: number,
  group: UpdateSearchGroupRequest
): Promise<{
  success: boolean;
  searchGroup?: JobSearchGroup;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/user/search-groups/${groupId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'Grupo de búsqueda no encontrado',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error actualizando grupo de búsqueda:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Elimina un grupo de búsqueda
 */
export async function deleteSearchGroup(
  groupId: number
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/user/search-groups/${groupId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'Grupo de búsqueda no encontrado',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error eliminando grupo de búsqueda:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

