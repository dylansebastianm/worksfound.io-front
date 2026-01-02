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
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'OpenAI API key no configurada',
      };
    }

    const { cvText, targetLanguage } = request;
    const targetLangName = targetLanguage === 'es' ? 'español' : 'inglés';
    const sourceLangName = targetLanguage === 'es' ? 'inglés' : 'español';

    const prompt = `Eres un traductor profesional especializado en currículums vitae.

Tu tarea es traducir el CV completo del ${sourceLangName} al ${targetLangName}, manteniendo EXACTAMENTE:
- Todos los marcadores de sección (===SECTION_START:NAME=== y ===SECTION_END:NAME===)
- El formato de cada sección
- La estructura y organización
- Los bullet points (•)
- Los separadores (|)
- El formato de fechas y números
- Los nombres de empresas, instituciones y tecnologías (NO traducir nombres propios)
- Las URLs (LinkedIn, emails, etc.)

INSTRUCCIONES:
1. Traduce SOLO el contenido textual, manteniendo toda la estructura intacta
2. NO cambies ningún marcador de sección
3. NO cambies el formato de las fechas (mantén el formato original)
4. NO traduzcas nombres propios de empresas, instituciones, tecnologías o personas
5. NO traduzcas URLs, emails o números de teléfono
6. Traduce el contenido profesional manteniendo el tono y estilo apropiado para un CV
7. Si el CV ya está en ${targetLangName}, devuélvelo sin cambios

CV A TRADUCIR:
${cvText}

Devuelve ÚNICAMENTE el CV traducido, sin explicaciones ni comentarios adicionales.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Eres un traductor profesional especializado en currículums vitae. Traduces contenido manteniendo toda la estructura y formato intactos.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Baja temperatura para traducción más precisa
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `Error traduciendo CV: ${errorData.error?.message || 'Error desconocido'}`,
      };
    }

    const data = await response.json();
    const translatedCV = data.choices[0]?.message?.content;

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
