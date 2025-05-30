import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import Home from '../home';
import * as useAuth from '~/hooks/useAuth';

// Mock dependencies
vi.mock('~/hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderHome = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
};

describe('Home Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: false,
        isLoading: true,
      });

      renderHome();

      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Authenticated User Redirect', () => {
    it('should redirect to chatroom when user is authenticated', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: {
          _id: '123',
          username: 'testuser',
          email: 'test@example.com',
          status: 'online',
        },
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
      });

      renderHome();

      expect(mockNavigate).toHaveBeenCalledWith('/chatroom', { replace: true });
    });
  });

  describe('Unauthenticated User Redirect', () => {
    it('should redirect to login when user is not authenticated', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: false,
        isLoading: false,
      });

      renderHome();

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes for loading container', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = renderHome();

      const loadingContainer = container.querySelector('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have proper spinner styling', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = renderHome();

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass(
        'rounded-full',
        'h-32',
        'w-32',
        'border-b-2',
        'border-indigo-600'
      );
    });
  });

  describe('Navigation Behavior', () => {
    it('should not navigate when still loading', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: false,
        isLoading: true,
      });

      renderHome();

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should use replace navigation to prevent back button issues', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: false,
        isLoading: false,
      });

      renderHome();

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
}); 