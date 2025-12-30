/**
 * ProfileForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from '@/components/profile/ProfileForm';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner toast - use vi.hoisted to avoid initialization order issues
const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ProfileForm', () => {
  const defaultProps = {
    name: 'John Doe',
    email: 'john@example.com',
    hasPassword: true,
    emailVerified: true,
    onProfileUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    defaultProps.onProfileUpdate = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the profile form', () => {
      render(<ProfileForm {...defaultProps} />);

      expect(screen.getByText('personalInfo')).toBeInTheDocument();
      expect(screen.getByText('personalInfoDesc')).toBeInTheDocument();
    });

    it('should render name input with initial value', () => {
      render(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('name');
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should render email input as read-only', () => {
      render(<ProfileForm {...defaultProps} />);

      const emailInput = screen.getByLabelText('email');
      expect(emailInput).toHaveValue('john@example.com');
      expect(emailInput).toHaveAttribute('readonly');
    });

    it('should show change email button when user has password', () => {
      render(<ProfileForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /changeEmail/i })).toBeInTheDocument();
    });

    it('should not show change email button when user does not have password (OAuth)', () => {
      render(<ProfileForm {...defaultProps} hasPassword={false} />);

      expect(screen.queryByRole('button', { name: /changeEmail/i })).not.toBeInTheDocument();
      expect(screen.getByText('oauthEmailChange')).toBeInTheDocument();
    });

    it('should show email not verified warning when emailVerified is false', () => {
      render(<ProfileForm {...defaultProps} emailVerified={false} />);

      expect(screen.getByText('emailNotVerified')).toBeInTheDocument();
    });

    it('should not show email not verified warning when emailVerified is true', () => {
      render(<ProfileForm {...defaultProps} emailVerified={true} />);

      expect(screen.queryByText('emailNotVerified')).not.toBeInTheDocument();
    });

    it('should show password section when user has password', () => {
      render(<ProfileForm {...defaultProps} />);

      expect(screen.getByText('password')).toBeInTheDocument();
      expect(screen.getByText('passwordHint')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /changePassword/i })).toBeInTheDocument();
    });

    it('should not show password section when user does not have password', () => {
      render(<ProfileForm {...defaultProps} hasPassword={false} />);

      expect(screen.queryByRole('link', { name: /changePassword/i })).not.toBeInTheDocument();
    });
  });

  describe('Name Update', () => {
    it('should enable save button when name is changed', async () => {
      const user = userEvent.setup();
      render(<ProfileForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /updateProfile/i });
      expect(saveButton).toBeDisabled();

      await user.clear(screen.getByLabelText('name'));
      await user.type(screen.getByLabelText('name'), 'Jane Doe');

      expect(saveButton).not.toBeDisabled();
    });

    it('should disable save button when name is reverted to original', async () => {
      const user = userEvent.setup();
      render(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: /updateProfile/i });
      expect(saveButton).not.toBeDisabled();

      await user.clear(nameInput);
      await user.type(nameInput, 'John Doe');

      expect(saveButton).toBeDisabled();
    });

    it('should call onProfileUpdate with new name when save is clicked', async () => {
      const user = userEvent.setup();
      defaultProps.onProfileUpdate.mockResolvedValue({ success: true });
      render(<ProfileForm {...defaultProps} />);

      await user.clear(screen.getByLabelText('name'));
      await user.type(screen.getByLabelText('name'), 'Jane Doe');
      await user.click(screen.getByRole('button', { name: /updateProfile/i }));

      await waitFor(() => {
        expect(defaultProps.onProfileUpdate).toHaveBeenCalledWith({ name: 'Jane Doe' });
      });
    });

    it('should show success toast on successful update', async () => {
      const user = userEvent.setup();
      defaultProps.onProfileUpdate.mockResolvedValue({ success: true });
      render(<ProfileForm {...defaultProps} />);

      await user.clear(screen.getByLabelText('name'));
      await user.type(screen.getByLabelText('name'), 'Jane Doe');
      await user.click(screen.getByRole('button', { name: /updateProfile/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('profileUpdated');
      });
    });

    it('should show error toast on failed update', async () => {
      const user = userEvent.setup();
      defaultProps.onProfileUpdate.mockResolvedValue({ success: false, error: 'Update failed' });
      render(<ProfileForm {...defaultProps} />);

      await user.clear(screen.getByLabelText('name'));
      await user.type(screen.getByLabelText('name'), 'Jane Doe');
      await user.click(screen.getByRole('button', { name: /updateProfile/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Update failed');
      });
    });

    it('should show saving state while updating', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: { success: boolean }) => void;
      defaultProps.onProfileUpdate.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          })
      );
      render(<ProfileForm {...defaultProps} />);

      await user.clear(screen.getByLabelText('name'));
      await user.type(screen.getByLabelText('name'), 'Jane Doe');
      await user.click(screen.getByRole('button', { name: /updateProfile/i }));

      expect(screen.getByText('saving')).toBeInTheDocument();

      resolveUpdate!({ success: true });
      await waitFor(() => {
        expect(screen.queryByText('saving')).not.toBeInTheDocument();
      });
    });

    it('should handle update throwing an error', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      defaultProps.onProfileUpdate.mockRejectedValue(new Error('Network error'));
      render(<ProfileForm {...defaultProps} />);

      await user.clear(screen.getByLabelText('name'));
      await user.type(screen.getByLabelText('name'), 'Jane Doe');
      await user.click(screen.getByRole('button', { name: /updateProfile/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('profileUpdateFailed');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Email Change Dialog', () => {
    it('should open email change dialog when change email button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));

      expect(screen.getByText('changeEmailDescription')).toBeInTheDocument();
      expect(screen.getByLabelText('newEmail')).toBeInTheDocument();
      expect(screen.getByLabelText('emailChangeRequiresPassword')).toBeInTheDocument();
    });

    it('should disable send verification button when fields are empty', async () => {
      const user = userEvent.setup();
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));

      const sendButton = screen.getByRole('button', { name: /sendVerification/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send verification button when all fields are filled', async () => {
      const user = userEvent.setup();
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));

      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');

      const sendButton = screen.getByRole('button', { name: /sendVerification/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('should send email change request on form submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/change-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEmail: 'newemail@example.com', password: 'password123' }),
        });
      });
    });

    it('should show success toast and close dialog on successful email change request', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('emailVerificationSent');
      });

      // Dialog should be closed
      expect(screen.queryByText('changeEmailDescription')).not.toBeInTheDocument();
    });

    it('should handle invalid password error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, code: 'invalid_password' }),
      });
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('invalidCurrentPassword');
      });
    });

    it('should handle email exists error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, code: 'email_exists' }),
      });
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'existing@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('emailAlreadyExists');
      });
    });

    it('should handle email pending error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, code: 'email_pending' }),
      });
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'pending@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('emailPending');
      });
    });

    it('should handle OAuth account error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, code: 'oauth_account' }),
      });
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('oauthEmailChange');
      });
    });

    it('should handle generic API error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Something went wrong' }),
      });
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });

    it('should handle network error', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('emailChangeFailed');
      });

      consoleSpy.mockRestore();
    });

    it('should close dialog when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      expect(screen.getByText('changeEmailDescription')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText('changeEmailDescription')).not.toBeInTheDocument();
    });

    it('should show sending state while processing email change', async () => {
      const user = userEvent.setup();
      let resolveRequest: (value: Response) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );
      render(<ProfileForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /changeEmail/i }));
      await user.type(screen.getByLabelText('newEmail'), 'newemail@example.com');
      await user.type(screen.getByLabelText('emailChangeRequiresPassword'), 'password123');
      await user.click(screen.getByRole('button', { name: /sendVerification/i }));

      expect(screen.getByText('sending')).toBeInTheDocument();

      resolveRequest!({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await waitFor(() => {
        expect(screen.queryByText('sending')).not.toBeInTheDocument();
      });
    });
  });
});
