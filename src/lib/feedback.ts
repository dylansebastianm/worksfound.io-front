import { getAuthHeaders } from './auth';
import type { FeedbackRequest, FeedbackResponse } from '@/types/feedback';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Envía feedback al servidor
 * 
 * @param feedbackData - Datos del feedback a enviar
 * @returns Respuesta del servidor con el resultado del envío
 */
export async function submitFeedback(feedbackData: FeedbackRequest): Promise<FeedbackResponse> {
  try {
    // Agregar token si está disponible (opcional para feedback)
    const authHeaders = getAuthHeaders();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authHeaders && typeof authHeaders === 'object' && !Array.isArray(authHeaders) ? authHeaders : {}),
    };

    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify(feedbackData),
    });

    if (response.status === 400) {
      const data = await response.json();
      return {
        success: false,
        error: data.error || 'Error al enviar el feedback',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error enviando feedback:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

