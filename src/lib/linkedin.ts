const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface LinkedInConnectionStatus {
  success: boolean;
  is_connected: boolean;
  connected_at?: string;
  last_verified_at?: string;
  has_active_session?: boolean;
  session_id?: string;
  session_validity?: {
    is_valid: boolean;
    message: string;
    requires_reconnect: boolean;
  };
  error?: string;
}

export interface StartLoginResponse {
  success: boolean;
  session_id?: string;
  interactive_url?: string; // URL de Browserless para sesión interactiva (puede dar 429 en plan gratuito)
  dashboard_url?: string; // URL del dashboard de Browserless (alternativa)
  message?: string;
  error?: string;
}

export interface CheckLoginStatusResponse {
  success: boolean;
  status?: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'timeout' | 'error' | 'requires_verification';
  session_id?: string;
  user_id?: number;
  message?: string;
  error?: string;
  email?: string; // Email del usuario cuando requiere verificación
}

export interface DisconnectResponse {
  success: boolean;
  message?: string;
  sessions_deactivated?: number;
  error?: string;
}

/**
 * Verifica el estado de conexión de LinkedIn para un usuario
 */
export async function checkLinkedInConnection(userId: string | number): Promise<LinkedInConnectionStatus> {
  try {
    const response = await fetch(`${API_URL}/api/linkedin/connection-status?user_id=${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verificando conexión de LinkedIn:', error);
    return {
      success: false,
      is_connected: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Inicia el proceso de login de LinkedIn
 */
export async function startLinkedInLogin(
  email: string,
  password: string,
  userId: string | number
): Promise<StartLoginResponse> {
  try {
    console.log('🌐 startLinkedInLogin - URL:', `${API_URL}/api/linkedin/start-login`)
    console.log('🌐 startLinkedInLogin - body:', { email, password: '***', user_id: userId })
    
    // Crear un AbortController con timeout de 60 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout en startLinkedInLogin después de 60 segundos')
      controller.abort()
    }, 60000)
    
    try {
      const response = await fetch(`${API_URL}/api/linkedin/start-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          user_id: userId,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId)

      console.log('🌐 startLinkedInLogin - response recibida, status:', response.status, 'ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json();
      console.log('🌐 startLinkedInLogin - response data:', data);
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error('❌ Timeout: El servidor tardó demasiado en responder');
        return {
          success: false,
          error: 'El servidor tardó demasiado en responder. Por favor, intenta de nuevo.',
        };
      }
      console.error('❌ Error iniciando login de LinkedIn:', error);
      return {
        success: false,
        error: 'Error conectando con el servidor',
      };
    }
  } catch (error) {
    console.error('❌ Error general en startLinkedInLogin:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Verifica el estado del login de LinkedIn
 */
export async function checkLinkedInLoginStatus(sessionId: string): Promise<CheckLoginStatusResponse> {
  try {
    console.log(`📡 Haciendo request a: ${API_URL}/api/linkedin/check-login-status?session_id=${sessionId}`);
    const response = await fetch(`${API_URL}/api/linkedin/check-login-status?session_id=${sessionId}`);
    
    // Si la respuesta no es OK (error de red, 500, etc.), lanzar excepción para que el catch del polling lo capture
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Error desconocido')
      console.error(`❌ Error HTTP en check-login-status: ${response.status} - ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json();
    console.log(`📡 Respuesta recibida:`, data);
    return data;
  } catch (error) {
    // CRÍTICO: Lanzar la excepción para que el catch del polling la capture
    // No devolver un objeto con success:false porque el polling no lo detectaría como error
    console.error('❌ Error verificando estado de login (lanzando excepción):', error);
    throw error; // Re-lanzar para que el polling lo capture
  }
}

/**
 * Desconecta LinkedIn de un usuario
 */
export async function disconnectLinkedIn(userId: string | number): Promise<DisconnectResponse> {
  try {
    const response = await fetch(`${API_URL}/api/linkedin/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error desconectando LinkedIn:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Activa o desactiva el auto-apply
 */
export async function toggleAutoApply(userId: string | number, enabled: boolean): Promise<{ success: boolean; message?: string; error?: string; status?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auto-apply/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        enabled,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en toggle auto-apply:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Obtiene el estado del auto-apply
 */
export async function getAutoApplyStatus(userId: string | number): Promise<{ success: boolean; is_running?: boolean; status?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auto-apply/status?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo estado de auto-apply:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Envía el código PIN de verificación de LinkedIn
 */
export async function submitLinkedInPin(sessionId: string, pin: string): Promise<{ success: boolean; message?: string; error?: string; status?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/linkedin/submit-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        pin: pin,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error enviando PIN de LinkedIn:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}
