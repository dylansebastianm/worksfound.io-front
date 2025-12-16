const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface LoginResponse {
  success: boolean;
  user_id?: number;
  user?: {
    id: number;
    email: string;
    created_at: string;
  };
  linkedin_session?: {
    is_valid: boolean;
    message: string;
    requires_reconnect: boolean;
  };
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    email: string;
    created_at: string;
  };
  error?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

export async function register(
  name: string,
  last_name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        last_name,
        email,
        password,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en registro:', error);
    return {
      success: false,
      error: 'Error conectando con el servidor',
    };
  }
}

/**
 * Función para obtener el usuario actual desde sessionStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userId = sessionStorage.getItem('user_id');
  const userEmail = sessionStorage.getItem('user_email');

  if (!userId || !userEmail) {
    return null;
  }

  return {
    id: parseInt(userId, 10),
    email: userEmail,
  };
}

/**
 * Función para cerrar sesión
 * Limpia los datos del sessionStorage
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_email');
  }
}

