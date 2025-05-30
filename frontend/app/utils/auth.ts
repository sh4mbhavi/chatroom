interface User {
  _id: string;
  username: string;
  email: string;
  status?: string;
}

interface AuthResponse {
  _id: string;
  username: string;
  email: string;
  status?: string;
  token: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

const SERVER_URL = import.meta.env.VITE_NODE_ENV === 'production' 
  ? (import.meta.env.VITE_API_URL || 'http://3.104.38.43:223')
  : 'http://3.104.38.43:223';

const API_BASE = `${SERVER_URL}/api/auth`;

// Token management
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

// API calls
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
};

export const logout = async (): Promise<void> => {
  const token = getToken();
  if (!token) return;

  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    removeToken();
  }
};

export const validateToken = (token: string): boolean => {
  if (!token) return false;
  
  try {
    // Simple JWT structure validation (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    return payload.exp > now;
  } catch {
    return false;
  }
};

export type { User, AuthResponse, LoginData, RegisterData }; 