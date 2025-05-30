import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getToken,
  setToken,
  removeToken,
  login,
  register,
  logout,
  validateToken,
} from '../auth';

// Mock fetch globally for this test file
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Token Management', () => {
    it('should get token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const token = getToken();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const token = getToken();
      
      expect(token).toBeNull();
    });

    it('should set token in localStorage', () => {
      setToken('new-token');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });

    it('should remove token from localStorage', () => {
      removeToken();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = { email: 'test@example.com', password: 'password' };
      const responseData = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        token: 'jwt-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(responseData),
      });

      const result = await login(loginData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9999/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      expect(result).toEqual(responseData);
    });

    it('should throw error on failed login', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong-password' };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Invalid credentials' }),
      });

      await expect(login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw generic error when no error message provided', async () => {
      const loginData = { email: 'test@example.com', password: 'password' };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      });

      await expect(login(loginData)).rejects.toThrow('Login failed');
    });
  });

  describe('Register', () => {
    it('should successfully register with valid data', async () => {
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const responseData = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        token: 'jwt-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(responseData),
      });

      const result = await register(registerData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9999/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      expect(result).toEqual(responseData);
    });

    it('should throw error on failed registration', async () => {
      const registerData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Invalid email format' }),
      });

      await expect(register(registerData)).rejects.toThrow('Invalid email format');
    });
  });

  describe('Logout', () => {
    it('should call logout API and remove token', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await logout();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9999/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should remove token even if API call fails', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle logout when no token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await logout();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Token Validation', () => {
    it('should validate a properly structured token', () => {
      // Mock a valid JWT token (header.payload.signature)
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // Expires in 1 hour
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      const isValid = validateToken(token);

      expect(isValid).toBe(true);
    });

    it('should invalidate an expired token', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // Expired 1 hour ago
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      const isValid = validateToken(token);

      expect(isValid).toBe(false);
    });

    it('should invalidate malformed tokens', () => {
      expect(validateToken('invalid-token')).toBe(false);
      expect(validateToken('header.payload')).toBe(false);
      expect(validateToken('')).toBe(false);
      expect(validateToken('header.invalid-base64.signature')).toBe(false);
    });

    it('should invalidate null or undefined tokens', () => {
      expect(validateToken(null as any)).toBe(false);
      expect(validateToken(undefined as any)).toBe(false);
    });
  });
}); 