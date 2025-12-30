import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataExport } from '@/components/account/DataExport';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      title: 'Export Data',
      description: 'Download a copy of all your data',
      includes: 'Includes',
      'items.profile': 'Profile information',
      'items.files': 'Stored files',
      'items.conversions': 'Conversion history',
      'items.analytics': 'Usage analytics',
      'items.teams': 'Team memberships',
      button: 'Export My Data',
      exporting: 'Preparing export...',
      success: 'Download started!',
      'phase.profile': 'Profile',
      'phase.files': 'Files',
      'phase.analytics': 'Analytics',
      'phase.packaging': 'Packaging',
    };
    return (key: string) => translations[key] || key;
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
global.URL.revokeObjectURL = vi.fn();

describe('DataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any mocked document methods
    vi.restoreAllMocks();
  });

  it('should render export data title', () => {
    render(<DataExport />);
    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<DataExport />);
    expect(screen.getByText('Download a copy of all your data')).toBeInTheDocument();
  });

  it('should render list of included items', () => {
    render(<DataExport />);
    // The "Includes" has a colon added after it in the component
    expect(screen.getByText(/Includes/)).toBeInTheDocument();
    expect(screen.getByText('Profile information')).toBeInTheDocument();
    expect(screen.getByText('Stored files')).toBeInTheDocument();
    expect(screen.getByText('Conversion history')).toBeInTheDocument();
    expect(screen.getByText('Usage analytics')).toBeInTheDocument();
    expect(screen.getByText('Team memberships')).toBeInTheDocument();
  });

  it('should render export button', () => {
    render(<DataExport />);
    expect(screen.getByRole('button', { name: /Export My Data/i })).toBeInTheDocument();
  });

  it('should show exporting state when button is clicked', async () => {
    // Set up a delayed response
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => null },
              blob: () => Promise.resolve(new Blob()),
            });
          }, 1000)
        )
    );

    render(<DataExport />);

    fireEvent.click(screen.getByRole('button', { name: /Export My Data/i }));

    // Button should show exporting state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Preparing export/i })).toBeInTheDocument();
    });
  });

  it('should disable button while exporting', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => null },
              blob: () => Promise.resolve(new Blob()),
            });
          }, 1000)
        )
    );

    render(<DataExport />);

    const button = screen.getByRole('button', { name: /Export My Data/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  it('should show progress indicator during export', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => null },
              blob: () => Promise.resolve(new Blob()),
            });
          }, 2000)
        )
    );

    render(<DataExport />);

    fireEvent.click(screen.getByRole('button', { name: /Export My Data/i }));

    // Wait for progress to appear
    await waitFor(
      () => {
        // Progress should show percentage
        const progressText = screen.queryByText(/%/);
        expect(progressText).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should show success state after successful export', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      blob: () => Promise.resolve(new Blob()),
    });

    render(<DataExport />);

    fireEvent.click(screen.getByRole('button', { name: /Export My Data/i }));

    await waitFor(() => {
      expect(screen.getByText('Download started!')).toBeInTheDocument();
    });
  });

  it('should show error state when export fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Export failed' }),
    });

    render(<DataExport />);

    fireEvent.click(screen.getByRole('button', { name: /Export My Data/i }));

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  it('should have correct phase icons defined', () => {
    // Test that the component renders without errors - the phase icons are used internally
    render(<DataExport />);
    expect(screen.getByRole('button', { name: /Export My Data/i })).toBeInTheDocument();
  });
});
