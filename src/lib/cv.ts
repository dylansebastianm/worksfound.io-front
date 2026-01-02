import { getToken } from './auth';
import { getCVPrompt } from './cv-prompt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface UploadCVResponse {
  success: boolean;
  message?: string;
  cvUrl?: string;
  error?: string;
}

export interface DeleteCVResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Tipos para múltiples CVs
export interface UserCV {
  id: number;
  cv_name: string;
  cv_url: string;
  file_name?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GetUserCVsResponse {
  success: boolean;
  cvs?: UserCV[];
  error?: string;
}

export interface CreateUserCVResponse {
  success: boolean;
  cv?: UserCV;
  error?: string;
}

export interface DeleteUserCVResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GenerateCVRequest {
  cvFile: File;
  jobTitle: string;
  userProfile: {
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
    skills?: Array<{
      skill_key: string;
      label: string;
      years: string;
    }>;
  };
}

export interface GenerateCVResponse {
  success: boolean;
  cvContent?: string;
  error?: string;
}

/**
 * Sube el CV del usuario a Google Cloud Storage
 * @param file Archivo del CV a subir
 * @returns Respuesta con la URL del CV subido
 */
export async function uploadCV(file: File): Promise<UploadCVResponse> {
  try {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/rtf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.rtf', '.txt'];
    
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt) && !allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Formato de archivo no permitido. Formatos permitidos: PDF, DOC, DOCX, RTF, TXT',
      };
    }

    // Validar tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 100MB',
      };
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);

    // Obtener solo el token de autorización (sin Content-Type para FormData)
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // NO establecer Content-Type - el navegador lo hará automáticamente con el boundary correcto

    const response = await fetch(`${API_URL}/api/user/profile/cv`, {
      method: 'POST',
      headers: headers,
      body: formData,
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
    console.error('Error subiendo CV:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Elimina el CV del usuario de Google Cloud Storage
 * @returns Respuesta con el resultado de la eliminación
 */
export async function deleteCV(): Promise<DeleteCVResponse> {
  try {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/user/profile/cv`, {
      method: 'DELETE',
      headers: headers,
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
    console.error('Error eliminando CV:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Obtiene todos los CVs de un usuario
 */
export async function getUserCVs(): Promise<GetUserCVsResponse> {
  try {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/user/cvs`, {
      method: 'GET',
      headers: headers,
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
    console.error('Error obteniendo CVs:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Sube un nuevo CV para el usuario (múltiples CVs)
 * 
 * @param file - Archivo del CV
 * @param cvName - Nombre descriptivo del CV (opcional)
 */
export async function createUserCV(
  file: File,
  cvName?: string
): Promise<CreateUserCVResponse> {
  try {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/rtf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.rtf', '.txt'];
    
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt) && !allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Formato de archivo no permitido. Formatos permitidos: PDF, DOC, DOCX, RTF, TXT',
      };
    }

    // Validar tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 100MB',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (cvName) {
      formData.append('cv_name', cvName);
    }

    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/user/cvs`, {
      method: 'POST',
      headers: headers,
      body: formData,
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
    console.error('Error subiendo CV:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Elimina un CV del usuario por ID
 * 
 * @param cvId - ID del CV a eliminar
 */
export async function deleteUserCV(cvId: number): Promise<DeleteUserCVResponse> {
  try {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/user/cvs/${cvId}`, {
      method: 'DELETE',
      headers: headers,
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
    console.error('Error eliminando CV:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Genera un CV optimizado usando OpenAI
 * 
 * @param request - Datos para generar el CV (archivo, puesto objetivo, perfil del usuario)
 * @returns Respuesta con el contenido del CV generado
 */
export async function generateCVWithOpenAI(request: GenerateCVRequest): Promise<GenerateCVResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'API key de OpenAI no configurada',
      };
    }

    // Función robusta para extraer texto literal del PDF
    async function extractLiteralTextFromPDF(file: File): Promise<string> {
      const pdfjsLib = await import('pdfjs-dist');
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const debugItems: any[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        // Usar includeMarkedContent y disableCombineTextItems para mejor control
        const textContent = await page.getTextContent({ 
          includeMarkedContent: true
        });

        const items = textContent.items;
        let pageText = '';
        let lastItem: any = null;

        for (let i = 0; i < items.length; i++) {
          const item: any = items[i];
          let text = item.str || '';

          // Limpiar caracteres inválidos/unicode inválido (U+FFFD, etc.)
          text = text.replace(/\uFFFD/g, ''); // Replacement character
          text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ''); // Control chars
          text = text.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces

          // Detectar y unir palabras cortadas por hyphenation
          // Si el item anterior terminaba con guion y este empieza con espacio o es parte de palabra
          if (lastItem) {
            const lastText = lastItem.str || '';
            const lastEndsWithHyphen = /-\s*$/.test(lastText);
            const currentStartsWithSpace = /^\s/.test(text);
            
            if (lastEndsWithHyphen && (currentStartsWithSpace || /^[a-z]/.test(text))) {
              // Unir: quitar guion y espacio del final del anterior, y espacio del inicio del actual
              pageText = pageText.replace(/-\s*$/, '');
              text = text.replace(/^\s+/, '');
              // Agregar guion sin espacio: "AI-" + "powered" = "AI-powered"
              if (text && !text.startsWith('-')) {
                pageText += '-';
              }
            }
          }

          // Agregar espacio si el item anterior no terminaba con espacio y este no empieza con espacio
          if (pageText && !/\s$/.test(pageText) && text && !/^\s/.test(text)) {
            // Verificar si necesitamos espacio basado en hasEOL o transform
            if (lastItem?.hasEOL || (item.transform && lastItem?.transform)) {
              // Si hay cambio de línea o transformación significativa, agregar espacio
              const lastTransform = lastItem?.transform || [1, 0, 0, 1, 0, 0];
              const currentTransform = item.transform || [1, 0, 0, 1, 0, 0];
              const lastX = lastTransform[4];
              const currentX = currentTransform[4];
              const lastWidth = lastItem?.width || 0;
              
              // Si hay salto significativo en X o si el último item tenía EOL, agregar espacio
              if (lastItem?.hasEOL || (currentX > lastX + lastWidth * 1.5)) {
                pageText += ' ';
              }
            } else {
              // Espacio normal entre palabras
              pageText += ' ';
            }
          }

          pageText += text;
          lastItem = item;

          // Modo debug: guardar items para inspección
          if (debugItems.length < 100) { // Limitar para no saturar
            debugItems.push({
              str: item.str,
              hasEOL: item.hasEOL,
              transform: item.transform,
              width: item.width,
              height: item.height,
            });
          }
        }

        fullText += pageText;
        if (pageNum < pdf.numPages) {
          fullText += '\n';
        }
      }

      // Normalización final: limpiar espacios múltiples pero mantener estructura
      fullText = fullText.replace(/[ \t]+/g, ' '); // Múltiples espacios/tabs → un espacio
      fullText = fullText.replace(/\n{3,}/g, '\n\n'); // Múltiples saltos de línea → máximo 2
      fullText = fullText.trim();

      return fullText;
    }

    // Extraer el texto del PDF
    let cvRawContent = '';
    if (request.cvFile.type === 'application/pdf') {
      try {
        cvRawContent = await extractLiteralTextFromPDF(request.cvFile);
        
        console.log('📄 CONTENIDO DEL CV QUE SE ENVÍA:');
        console.log('='.repeat(80));
        console.log(cvRawContent);
        console.log('='.repeat(80));
        console.log('📏 Longitud del CV original:', cvRawContent.length, 'caracteres');
      } catch (error) {
        console.log('⚠️ Error al leer el PDF:', error);
        return {
          success: false,
          error: 'Error al leer el archivo PDF',
        };
      }
    } else if (
      request.cvFile.type === 'application/msword' ||
      request.cvFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Para archivos DOC/DOCX, intentar leer como texto (limitado)
      try {
        cvRawContent = await request.cvFile.text();
      } catch (error) {
        console.log('⚠️ Error leyendo DOC:', error);
        return {
          success: false,
          error: 'Error al leer el archivo DOC/DOCX. Por favor, convierte el archivo a PDF.',
        };
      }
    } else {
      // Para archivos de texto plano
      cvRawContent = await request.cvFile.text();
    }

    if (!cvRawContent || cvRawContent.trim().length === 0) {
      return {
        success: false,
        error: 'No se pudo extraer contenido del archivo. Asegúrate de que el archivo no esté vacío.',
      };
    }

    // Construir el prompt mejorado
    const skillsText = request.userProfile.skills 
      ? request.userProfile.skills.map(s => `${s.label} (${s.years} años)`).join(', ')
      : 'No especificado';

    const userInfoText = `
INFORMACIÓN DEL USUARIO:
- Nombre completo: ${request.userProfile.name} ${request.userProfile.lastName}
- Email: ${request.userProfile.email}
- Teléfono: ${request.userProfile.phone || 'No especificado'}
- Ubicación: ${request.userProfile.city || 'No especificado'}, ${request.userProfile.country || 'No especificado'}
- Edad: ${request.userProfile.age || 'No especificado'}
- Género: ${request.userProfile.gender || 'No especificado'}
- Años de experiencia: ${request.userProfile.experienceYears || 'No especificado'}
- Nivel de inglés: ${request.userProfile.englishLevel || 'No especificado'}
- Salario actual: ${request.userProfile.currentSalary || 'No especificado'}
- Salario esperado: ${request.userProfile.expectedSalary || 'No especificado'}
- Institución educativa: ${request.userProfile.institution || 'No especificado'}
- Título: ${request.userProfile.degreeTitle || 'No especificado'}
- Modalidad de trabajo preferida: ${request.userProfile.preferredWorkModality?.join(', ') || 'No especificado'}
- Razón de cambio de trabajo: ${request.userProfile.jobChangeReason || 'No especificado'}
- Habilidades técnicas: ${skillsText}
`;

    // Obtener el prompt desde el archivo modularizado
    const prompt = getCVPrompt({
      jobTitle: request.jobTitle,
      userName: request.userProfile.name,
      userLastName: request.userProfile.lastName,
      userEmail: request.userProfile.email,
      userPhone: request.userProfile.phone || '',
      userInstitution: request.userProfile.institution,
      userDegreeTitle: request.userProfile.degreeTitle,
      userInfoText,
    });

    // Construir el mensaje completo: prompt + texto del CV + información del perfil + puesto
    const fullPrompt = `${prompt}

---CV_RAW---
${cvRawContent}
---END_CV_RAW---

---JOB_POSITION---
${request.jobTitle}
---END_JOB_POSITION---`;

    // Usar Chat Completions API (API común de OpenAI)
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json();
      return {
        success: false,
        error: `Error generando CV: ${errorData.error?.message || 'Error desconocido'}`,
      };
    }

    const chatData = await chatResponse.json();
    const cvContent = chatData.choices[0]?.message?.content;

    console.log('📄 OUTPUT COMPLETO DE CHATGPT:');
    console.log('='.repeat(80));
    console.log(cvContent);
    console.log('='.repeat(80));
    console.log('📏 Longitud del CV generado:', cvContent?.length || 0, 'caracteres');

    if (!cvContent) {
      return {
        success: false,
        error: 'No se recibió contenido del CV generado',
      };
    }

    return {
      success: true,
      cvContent,
    };
  } catch (error) {
    console.error('Error generando CV con OpenAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar CV',
    };
  }
}
