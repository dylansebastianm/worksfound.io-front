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
  message?: string;
  error?: string;
}

export interface CheckLoginStatusResponse {
  success: boolean;
  status?: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'timeout' | 'error';
  session_id?: string;
  user_id?: number;
  message?: string;
  error?: string;
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
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error iniciando login de LinkedIn:', error);
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
    const response = await fetch(`${API_URL}/api/linkedin/check-login-status?session_id=${sessionId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verificando estado de login:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
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

