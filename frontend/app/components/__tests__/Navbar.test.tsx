import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { Navbar } from '../Navbar';
import * as useAuth from '~/hooks/useAuth';
import * as authUtils from '~/utils/auth';

// Mock dependencies
vi.mock('~/hooks/useAuth');
vi.mock('~/utils/auth');

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  const mockLogout = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render app title', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: false,
        isLoading: false,
      });

      renderNavbar();

      expect(screen.getByRole('heading', { name: /chat app/i })).toBeInTheDocument();
    });

    it('should not show user info when no user is logged in', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: false,
        isLoading: false,
      });

      renderNavbar();

      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/U/)).not.toBeInTheDocument();
    });

    it('should show user info when user is logged in', () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'online',
      };

      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });

      renderNavbar();

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of username
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should show email when username is not available', () => {
      const mockUser = {
        _id: '123',
        username: '',
        email: 'test@example.com',
        status: 'online',
      };

      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });

      renderNavbar();

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show default avatar when username is empty', () => {
      const mockUser = {
        _id: '123',
        username: '',
        email: 'test@example.com',
        status: 'online',
      };

      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });

      renderNavbar();

      expect(screen.getByText('U')).toBeInTheDocument(); // Default avatar
    });
  });

  describe('User Avatar and Display', () => {
    it('should display correct first letter of username in avatar', () => {
      const testCases = [
        { username: 'alice', expected: 'A' },
        { username: 'bob', expected: 'B' },
        { username: 'charlie', expected: 'C' },
        { username: 'lowercase', expected: 'L' },
      ];

      testCases.forEach(({ username, expected }) => {
        const mockUser = {
          _id: '123',
          username,
          email: 'test@example.com',
          status: 'online',
        };

        vi.mocked(useAuth.useAuth).mockReturnValue({
          user: mockUser,
          login: vi.fn(),
          logout: mockLogout,
          isAuthenticated: true,
          isLoading: false,
        });

        const { unmount } = renderNavbar();
        
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should prefer username over email for display', () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'online',
      };

      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });

      renderNavbar();

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    const mockUser = {
      _id: '123',
      username: 'testuser',
      email: 'test@example.com',
      status: 'online',
    };

    beforeEach(() => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('should call logout functions and navigate on successful logout', async () => {
      const user = userEvent.setup();
      vi.mocked(authUtils.logout).mockResolvedValue();

      renderNavbar();

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(authUtils.logout).toHaveBeenCalled();
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle logout API failure gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(authUtils.logout).mockRejectedValue(new Error('Network error'));

      renderNavbar();

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(authUtils.logout).toHaveBeenCalled();
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should call local logout even when API fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(authUtils.logout).mockRejectedValue(new Error('Server error'));

      renderNavbar();

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should have proper CSS classes for layout', () => {
      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: false,
        isLoading: false,
      });

      const { container } = renderNavbar();
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('bg-white', 'shadow-lg');
    });

    it('should have proper button styling', () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'online',
      };

      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });

      renderNavbar();

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toHaveClass(
        'bg-red-600',
        'hover:bg-red-700',
        'text-white',
        'px-4',
        'py-2',
        'rounded-md',
        'text-sm',
        'font-medium',
        'transition-colors',
        'duration-200'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'online',
      };

      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });

      renderNavbar();

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'online',
      };

      vi.mocked(useAuth.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
      });

      renderNavbar();

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      
      // Test keyboard navigation
      await user.tab();
      expect(logoutButton).toHaveFocus();

      // Test activation with Enter key
      vi.mocked(authUtils.logout).mockResolvedValue();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(authUtils.logout).toHaveBeenCalled();
      });
    });
  });
}); 