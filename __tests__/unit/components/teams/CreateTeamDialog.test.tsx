/**
 * CreateTeamDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CreateTeamDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onTeamCreated: vi.fn(),
  };

  const mockTeam = {
    id: 'team-123',
    name: 'My Team',
    plan: 'team',
    memberCount: 1,
    role: 'owner' as const,
    isOwner: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    defaultProps.onOpenChange = vi.fn();
    defaultProps.onTeamCreated = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the dialog when open is true', () => {
      render(<CreateTeamDialog {...defaultProps} />);

      expect(screen.getByText('createTeamTitle')).toBeInTheDocument();
      expect(screen.getByText('createTeamDescription')).toBeInTheDocument();
    });

    it('should not render the dialog when open is false', () => {
      render(<CreateTeamDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('createTeamTitle')).not.toBeInTheDocument();
    });

    it('should render team name input', () => {
      render(<CreateTeamDialog {...defaultProps} />);

      expect(screen.getByLabelText('teamName')).toBeInTheDocument();
    });

    it('should render cancel and create buttons', () => {
      render(<CreateTeamDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should disable create button when team name is empty', () => {
      render(<CreateTeamDialog {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Form Input', () => {
    it('should enable create button when team name is entered', async () => {
      const user = userEvent.setup();
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My New Team');

      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).not.toBeDisabled();
    });

    it('should keep create button disabled for whitespace-only name', async () => {
      const user = userEvent.setup();
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), '   ');

      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toBeDisabled();
    });

    it('should have maxLength of 100 characters', () => {
      render(<CreateTeamDialog {...defaultProps} />);

      const input = screen.getByLabelText('teamName');
      expect(input).toHaveAttribute('maxLength', '100');
    });
  });

  describe('Form Submission', () => {
    it('should call API to create team on form submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, team: mockTeam }),
      });
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My New Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'My New Team' }),
        });
      });
    });

    it('should trim team name before sending', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, team: mockTeam }),
      });
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), '  Trimmed Team  ');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Trimmed Team' }),
        });
      });
    });

    it('should call onTeamCreated with created team on success', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, team: mockTeam }),
      });
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My New Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(defaultProps.onTeamCreated).toHaveBeenCalledWith(mockTeam);
      });
    });

    it('should clear team name after successful creation', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, team: mockTeam }),
      });
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My New Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('teamName')).toHaveValue('');
      });
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Team name already exists' }),
      });
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'Existing Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Team name already exists')).toBeInTheDocument();
      });
    });

    it('should show default error message when API returns no error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      });
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('createError')).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('createError')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should show validation error for empty team name', async () => {
      render(<CreateTeamDialog {...defaultProps} />);

      // Try to submit form with empty name (need to use form submit event)
      const form = screen.getByRole('button', { name: /create/i }).closest('form')!;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(screen.getByText('nameRequired')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable inputs and buttons while loading', async () => {
      const user = userEvent.setup();
      let resolveRequest: (value: Response) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      // Should be in loading state
      expect(screen.getByLabelText('teamName')).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();

      resolveRequest!({
        ok: true,
        json: () => Promise.resolve({ success: true, team: mockTeam }),
      } as Response);

      await waitFor(() => {
        expect(screen.getByLabelText('teamName')).not.toBeDisabled();
      });
    });

    it('should not allow closing dialog while loading', async () => {
      const user = userEvent.setup();
      let resolveRequest: (value: Response) => void;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );
      render(<CreateTeamDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('teamName'), 'My Team');
      await user.click(screen.getByRole('button', { name: /create/i }));

      // Try to cancel while loading
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // onOpenChange should not be called
      expect(defaultProps.onOpenChange).not.toHaveBeenCalled();

      resolveRequest!({
        ok: true,
        json: () => Promise.resolve({ success: true, team: mockTeam }),
      } as Response);

      await waitFor(() => {
        expect(screen.getByLabelText('teamName')).not.toBeDisabled();
      });
    });
  });

  describe('Dialog Close', () => {
    it('should call onOpenChange when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateTeamDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset form state when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateTeamDialog {...defaultProps} />);

      // Fill form
      await user.type(screen.getByLabelText('teamName'), 'My Team');
      expect(screen.getByLabelText('teamName')).toHaveValue('My Team');

      // Click cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // onOpenChange should be called with false
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
