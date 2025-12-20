import { getAuthHeaders } from './auth';

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

