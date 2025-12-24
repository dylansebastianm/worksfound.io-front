import { getToken } from './auth';

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

