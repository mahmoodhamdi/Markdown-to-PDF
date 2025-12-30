/**
 * AddMemberDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddMemberDialog } from '@/components/teams/AddMemberDialog';

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

describe('AddMemberDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    teamId: 'team-123',
    onMemberAdded: vi.fn(),
    canAddAdmin: true,
  };

  const mockMember = {
    userId: 'user-456',
    email: 'newmember@example.com',
    name: 'New Member',
    role: 'member' as const,
    joinedAt: '2024-01-01T00:00:00Z',
    invitedBy: 'user-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    defaultProps.onOpenChange = vi.fn();
    defaultProps.onMemberAdded = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the dialog when open is true', () => {
      render(<AddMemberDialog {...defaultProps} />);

      expect(screen.getByText('addMemberTitle')).toBeInTheDocument();
      expect(screen.getByText('addMemberDescription')).toBeInTheDocument();
    });

    it('should not render the dialog when open is false', () => {
      render(<AddMemberDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('addMemberTitle')).not.toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<AddMemberDialog {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render name input field', () => {
      render(<AddMemberDialog {...defaultProps} />);

      expect(screen.getByLabelText('name')).toBeInTheDocument();
    });

    it('should render role selector when canAddAdmin is true', () => {
      render(<AddMemberDialog {...defaultProps} canAddAdmin={true} />);

      // The label text and select should be present
      expect(screen.getByText('roleLabel')).toBeInTheDocument();
      expect(screen.getByText('roleHint')).toBeInTheDocument();
    });

    it('should not render role selector when canAddAdmin is false', () => {
      render(<AddMemberDialog {...defaultProps} canAddAdmin={false} />);

      expect(screen.queryByText('roleLabel')).not.toBeInTheDocument();
    });

    it('should render cancel and add member buttons', () => {
      render(<AddMemberDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /addMember/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<AddMemberDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(screen.getByText('emailRequired')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(screen.getByText('invalidEmail')).toBeInTheDocument();
      });
    });

    it('should accept valid email format', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'valid@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call API with correct data on submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'newmember@example.com');
      await user.type(screen.getByLabelText('name'), 'New Member');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/teams/team-123/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'newmember@example.com',
            name: 'New Member',
            role: 'member',
          }),
        });
      });
    });

    it('should trim email and name before sending', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), '  newmember@example.com  ');
      await user.type(screen.getByLabelText('name'), '  Trimmed Name  ');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/teams/team-123/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'newmember@example.com',
            name: 'Trimmed Name',
            role: 'member',
          }),
        });
      });
    });

    it('should send undefined for empty name', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'member@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/teams/team-123/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'member@example.com',
            name: undefined,
            role: 'member',
          }),
        });
      });
    });

    it('should call onMemberAdded with added member on success', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'newmember@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(defaultProps.onMemberAdded).toHaveBeenCalledWith(mockMember);
      });
    });

    it('should show success toast on successful addition', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'newmember@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('memberAdded');
      });
    });

    it('should reset form after successful addition', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'newmember@example.com');
      await user.type(screen.getByLabelText('name'), 'New Member');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveValue('');
        expect(screen.getByLabelText('name')).toHaveValue('');
      });
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'User already in team' }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(screen.getByText('User already in team')).toBeInTheDocument();
      });
    });

    it('should show default error message when API returns no error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      });
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'member@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(screen.getByText('addError')).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'member@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(screen.getByText('addError')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Role Selection', () => {
    it('should default to member role', () => {
      render(<AddMemberDialog {...defaultProps} canAddAdmin={true} />);

      // Check default select value
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toHaveTextContent('role.member');
    });

    it('should send member role when canAddAdmin is false', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      });
      render(<AddMemberDialog {...defaultProps} canAddAdmin={false} />);

      await user.type(screen.getByLabelText(/email/i), 'member@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/teams/team-123/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'member@example.com',
            name: undefined,
            role: 'member',
          }),
        });
      });
    });

    it('should allow selecting admin role when canAddAdmin is true', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, member: { ...mockMember, role: 'admin' } }),
      });
      render(<AddMemberDialog {...defaultProps} canAddAdmin={true} />);

      // Open select dropdown
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'role.admin' }));

      await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/teams/team-123/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@example.com',
            name: undefined,
            role: 'admin',
          }),
        });
      });
    });
  });

  describe('Loading State', () => {
    it('should disable inputs while loading', async () => {
      const user = userEvent.setup();
      let resolveRequest: (value: Response) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'member@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      // Should be in loading state
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText('name')).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

      resolveRequest!({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      } as Response);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).not.toBeDisabled();
      });
    });

    it('should show loading text on button while loading', async () => {
      const user = userEvent.setup();
      let resolveRequest: (value: Response) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );
      render(<AddMemberDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/email/i), 'member@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();

      resolveRequest!({
        ok: true,
        json: () => Promise.resolve({ success: true, member: mockMember }),
      } as Response);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /adding/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog Close', () => {
    it('should call onOpenChange when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddMemberDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset form when dialog is closed', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<AddMemberDialog {...defaultProps} />);

      // Fill form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText('name'), 'Test User');

      // Close and reopen dialog
      rerender(<AddMemberDialog {...defaultProps} open={false} />);
      rerender(<AddMemberDialog {...defaultProps} open={true} />);

      // Form should be reset
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText('name')).toHaveValue('');
    });

    it('should reset error when dialog is closed', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Some error' }),
      });

      const { rerender } = render(<AddMemberDialog {...defaultProps} />);

      // Trigger error
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /addMember/i }));

      await waitFor(() => {
        expect(screen.getByText('Some error')).toBeInTheDocument();
      });

      // Close and reopen dialog
      rerender(<AddMemberDialog {...defaultProps} open={false} />);
      rerender(<AddMemberDialog {...defaultProps} open={true} />);

      // Error should be cleared
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });
  });
});
