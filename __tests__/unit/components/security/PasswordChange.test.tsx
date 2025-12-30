import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordChange } from '@/components/security/PasswordChange';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      'password.title': 'Password',
      'password.description': 'Change your password',
      'password.current': 'Current Password',
      'password.new': 'New Password',
      'password.confirm': 'Confirm Password',
      'password.currentPlaceholder': 'Enter current password',
      'password.newPlaceholder': 'Enter new password',
      'password.confirmPlaceholder': 'Confirm password',
      'password.change': 'Change Password',
      'password.changing': 'Changing...',
      'password.changed': 'Password changed',
      'password.changeFailed': 'Failed to change password',
      'password.currentRequired': 'Current password required',
      'password.newRequired': 'New password required',
      'password.confirmRequired': 'Confirm password required',
      'password.minLength': 'Minimum 8 characters',
      'password.mismatch': 'Passwords do not match',
      'password.match': 'Passwords match',
      'password.weak': 'Weak',
      'password.medium': 'Medium',
      'password.strong': 'Strong',
      'password.oauthOnly': 'OAuth only account',
      'password.requirements': 'Requirements',
      'password.reqMinLength': '8 characters minimum',
      'password.reqUppercase': 'One uppercase',
      'password.reqLowercase': 'One lowercase',
      'password.reqNumber': 'One number',
      'password.reqSpecial': 'One special character',
    };
    return (key: string) => translations[key] || key;
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('PasswordChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user has password', () => {
    it('should render password change form', () => {
      render(<PasswordChange hasPassword={true} />);

      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('should show requirements when typing new password', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'test' } });

      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(screen.getByText('8 characters minimum')).toBeInTheDocument();
      expect(screen.getByText('One uppercase')).toBeInTheDocument();
      expect(screen.getByText('One lowercase')).toBeInTheDocument();
      expect(screen.getByText('One number')).toBeInTheDocument();
      expect(screen.getByText('One special character')).toBeInTheDocument();
    });

    it('should show weak strength for short password', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'abc' } });

      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should show medium strength for decent password', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'Password1' } });

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should show strong strength for complex password', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'Password123!@#' } });

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('should mark minLength requirement as met when password is 8+ chars', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: '12345678' } });

      // The requirement item span should have green text when met
      const minLengthItem = screen.getByText('8 characters minimum');
      expect(minLengthItem).toHaveClass('text-green-600');
    });

    it('should mark uppercase requirement as met', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'Password' } });

      const uppercaseItem = screen.getByText('One uppercase');
      expect(uppercaseItem).toHaveClass('text-green-600');
    });

    it('should mark lowercase requirement as met', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'password' } });

      const lowercaseItem = screen.getByText('One lowercase');
      expect(lowercaseItem).toHaveClass('text-green-600');
    });

    it('should mark number requirement as met', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'pass123' } });

      const numberItem = screen.getByText('One number');
      expect(numberItem).toHaveClass('text-green-600');
    });

    it('should mark special character requirement as met', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      fireEvent.change(newPasswordInput, { target: { value: 'pass!' } });

      const specialItem = screen.getByText('One special character');
      expect(specialItem).toHaveClass('text-green-600');
    });

    it('should show password match indicator when passwords match', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });

      expect(screen.getByText('Passwords match')).toBeInTheDocument();
    });

    it('should not show requirements when password is empty', () => {
      render(<PasswordChange hasPassword={true} />);

      expect(screen.queryByText('Requirements')).not.toBeInTheDocument();
    });

    it('should toggle password visibility', () => {
      render(<PasswordChange hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText('New Password');
      expect(newPasswordInput).toHaveAttribute('type', 'password');

      // Find toggle buttons (there are 3 - one for each password field)
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(toggleButtons[1]); // Second toggle is for new password

      expect(newPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('when user does not have password (OAuth only)', () => {
    it('should show OAuth only message', () => {
      render(<PasswordChange hasPassword={false} />);

      expect(screen.getByText('OAuth only account')).toBeInTheDocument();
      expect(screen.queryByLabelText('Current Password')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should submit form with valid data', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<PasswordChange hasPassword={true} />);

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'oldPassword123' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm Password'), {
        target: { value: 'NewPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: 'oldPassword123',
            newPassword: 'NewPassword123!',
          }),
        });
      });
    });

    it('should show validation error for missing current password', async () => {
      render(<PasswordChange hasPassword={true} />);

      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm Password'), {
        target: { value: 'NewPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

      await waitFor(() => {
        expect(screen.getByText('Current password required')).toBeInTheDocument();
      });
    });
  });
});
