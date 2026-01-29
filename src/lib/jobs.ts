import { getAuthHeaders } from './auth';
import type { GetAppliedJobsParams, GetAppliedJobsResponse, AppliedJobOffer } from '@/types/jobs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ScrapeJobsResponse {
  success: boolean;
  jobs_scraped?: number;
  jobs_saved?: number;
  target?: number;
  message?: string;
  error?: string;
}

export interface CancelScrapeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ScrapeStatusResponse {
  success: boolean;
  is_running?: boolean;
  error?: string;
}

/**
 * Función para realizar ingesta de ofertas de trabajo
 */
export async function scrapeJobs(
  user_id: number,
  url: string,
  max_jobs: number = 50,
  signal?: AbortSignal,
): Promise<ScrapeJobsResponse> {
  try {
    const response = await fetch(`${API_URL}/api/jobs/scrape`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id,
        url,
        max_jobs,
      }),
      signal, // Agregar signal para poder cancelar la petición
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    // Si es un AbortError, relanzarlo para que el componente lo maneje
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Error en scraping:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Consulta si hay un scraping en curso para el usuario (para polling).
 */
export async function getScrapeStatus(user_id: number): Promise<ScrapeStatusResponse> {
  try {
    const response = await fetch(
      `${API_URL}/api/jobs/scrape/status?user_id=${user_id}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error consultando estado de scraping:', error);
    return { success: false, error: 'Error conectando con el servidor' };
  }
}

/**
 * Función para cancelar un scraping en curso
 */
export async function cancelScrapeJobs(user_id: number): Promise<CancelScrapeResponse> {
  try {
    const response = await fetch(`${API_URL}/api/jobs/scrape/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error cancelando scraping:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

// Re-exportar tipos desde el archivo global de tipos
export type {
  JobOffer,
  AppliedJobOffer,
  GetAppliedJobsParams,
  GetAppliedJobsResponse,
} from '@/types/jobs';

/**
 * Obtiene las ofertas aplicadas por un usuario
 * 
 * @param params - Parámetros de filtrado y paginación
 * @returns Respuesta con las ofertas aplicadas y paginación
 */
export async function getAppliedJobs(params: GetAppliedJobsParams = {}): Promise<GetAppliedJobsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.portal) queryParams.append('portal', params.portal);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const url = `${API_URL}/api/jobs/applied${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo ofertas aplicadas:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Obtiene el detalle completo de una oferta aplicada por su ID
 * 
 * @param applicationId - ID de la aplicación
 * @returns Respuesta con el detalle completo de la oferta aplicada
 */
export async function getAppliedJobDetail(applicationId: number): Promise<{
  success: boolean;
  application?: AppliedJobOffer;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/jobs/applied/${applicationId}`, {
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
        error: 'No tienes permiso para ver esta oferta',
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'Oferta aplicada no encontrada',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo detalle de oferta aplicada:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

