/**
 * Traduce un CV completo de un idioma a otro usando OpenAI
 * Mantiene toda la estructura y formato, solo traduce el contenido textual
 */

interface TranslateCurriculumRequest {
  cvText: string;
  targetLanguage: 'es' | 'en';
}

interface TranslateCurriculumResponse {
  success: boolean;
  translatedCV?: string;
  error?: string;
}

/**
 * Traduce el contenido del CV manteniendo toda la estructura y marcadores
 * 
 * @param request - Objeto con el texto del CV y el idioma objetivo
 * @returns Respuesta con el CV traducido o error
 */
export async function translateCurriculum(
  request: TranslateCurriculumRequest
): Promise<TranslateCurriculumResponse> {
  try {
    const { cvText, targetLanguage } = request;

    // Llamar al endpoint del servidor que usa la API key de forma segura
    const response = await fetch('/api/cv/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cvText,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Error traduciendo CV',
      };
    }

    const data = await response.json();
    const translatedCV = data.translatedCV;

    if (!translatedCV) {
      return {
        success: false,
        error: 'No se recibió el CV traducido',
      };
    }

    return {
      success: true,
      translatedCV,
    };
  } catch (error) {
    console.error('Error traduciendo CV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al traducir CV',
    };
  }
}
