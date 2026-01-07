const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface User {
  id: number;
  email: string;
  name?: string;
  is_admin?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string; // Token JWT
  user_id?: number;
  user?: {
    id: number;
    email: string;
    is_admin: boolean;
    created_at: string;
  };
  linkedin_session?: {
    is_valid: boolean;
    message: string;
    requires_reconnect: boolean;
  };
  error?: string;
  message?: string;
}

interface JWTPayload {
  user_id: number;
  email: string;
  is_admin: boolean;
  exp: number;
  iat: number;
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
    
    // Si el login es exitoso, guardar el token y datos del usuario
    if (data.success && data.token && data.user) {
      saveToken(data.token);
      saveUser(data.user);
    }
    
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
 * Guarda el token JWT en sessionStorage
 */
function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth_token', token);
  }
}

/**
 * Guarda los datos del usuario en sessionStorage
 */
function saveUser(user: { id: number; email: string; is_admin: boolean }): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('user_id', user.id.toString());
    sessionStorage.setItem('user_email', user.email);
    sessionStorage.setItem('user_is_admin', user.is_admin.toString());
  }
}

/**
 * Obtiene el token JWT desde sessionStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem('auth_token');
}

/**
 * Decodifica el token JWT (sin verificar firma, solo para obtener datos)
 * En producción, el servidor siempre verifica la firma
 */
function decodeToken(token: string): JWTPayload | null {
  try {
    // JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    // Reemplazar caracteres URL-safe y agregar padding si es necesario
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
}

/**
 * Verifica si el token está expirado
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // exp está en segundos, Date.now() está en milisegundos
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Obtiene el usuario actual desde sessionStorage o del token
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = getToken();
  if (!token) {
    return null;
  }

  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    logout();
    return null;
  }

  // Intentar obtener datos del token primero
  const payload = decodeToken(token);
  if (payload) {
    return {
      id: payload.user_id,
      email: payload.email,
      is_admin: payload.is_admin,
    };
  }

  // Fallback: obtener de sessionStorage
  const userId = sessionStorage.getItem('user_id');
  const userEmail = sessionStorage.getItem('user_email');
  const isAdmin = sessionStorage.getItem('user_is_admin');

  if (!userId || !userEmail) {
    return null;
  }

  return {
    id: parseInt(userId, 10),
    email: userEmail,
    is_admin: isAdmin === 'true',
  };
}

/**
 * Verifica si el usuario actual es administrador
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.is_admin === true;
}

/**
 * Obtiene el token de autenticación para usar en requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Función para cerrar sesión
 * Limpia todos los datos del sessionStorage
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_email');
    sessionStorage.removeItem('user_is_admin');
  }
}

