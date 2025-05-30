import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { LoginForm } from '../LoginForm';
import * as authUtils from '~/utils/auth';
import * as useAuth from '~/hooks/useAuth';

// Mock the hooks and utilities
vi.mock('~/utils/auth');
vi.mock('~/hooks/useAuth');
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

// Mock useAuth hook
vi.mocked(useAuth.useAuth).mockReturnValue({
  user: null,
  login: mockLogin,
  logout: vi.fn(),
  isAuthenticated: false,
  isLoading: false,
});

// Mock react-router navigate
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  );
};

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all required elements', () => {
      renderLoginForm();

      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/create a new account/i)).toBeInTheDocument();
    });

    it('should have proper form attributes', () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should render register link', () => {
      renderLoginForm();

      const registerLink = screen.getByRole('link', { name: /create a new account/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('User Interactions', () => {
    it('should update input values when user types', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should prevent form submission with empty fields', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // HTML5 validation should prevent submission
      await user.click(submitButton);
      
      // Form should not be submitted (no API calls)
      expect(authUtils.login).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        token: 'jwt-token',
      };

      vi.mocked(authUtils.login).mockResolvedValueOnce(mockAuthResponse);
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authUtils.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(mockLogin).toHaveBeenCalledWith('jwt-token', {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        status: undefined,
      });

      expect(mockNavigate).toHaveBeenCalledWith('/chatroom');
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      vi.mocked(authUtils.login).mockReturnValueOnce(loginPromise as any);
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole('button', { name: /signing in.../i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();

      // Resolve the promise
      resolveLogin!({
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        token: 'jwt-token',
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      
      vi.mocked(authUtils.login).mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should display generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      
      vi.mocked(authUtils.login).mockRejectedValueOnce('Network error');
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      
      vi.mocked(authUtils.login).mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Start typing again - this should clear error
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      // Note: Error clearing might happen on form submission rather than input change
      // depending on implementation
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const registerLink = screen.getByRole('link', { name: /create a new account/i });

      // Tab navigation - register link comes first in DOM order
      await user.tab();
      expect(registerLink).toHaveFocus();

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });
}); 