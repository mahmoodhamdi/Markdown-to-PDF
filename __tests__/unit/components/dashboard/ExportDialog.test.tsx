import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from '@/components/dashboard/ExportDialog';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      export: 'Export',
      exportTitle: 'Export Analytics Data',
      exportDescription: 'Download your analytics data in your preferred format',
      exportFormat: 'Choose format',
      csvDescription: 'Spreadsheet compatible',
      jsonDescription: 'For developers',
      exportDataRange: `Data from ${params?.start || ''} to ${params?.end || ''} (${params?.days || ''} days)`,
      cancel: 'Cancel',
      exporting: 'Exporting...',
      exportNow: 'Export Now',
      exportSuccess: 'Export successful',
      exportSuccessDescription: `Data exported as ${params?.format || ''}`,
      exportError: 'Export failed',
      exportErrorDescription: 'Please try again',
    };
    return translations[key] || key;
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockData = {
  daily: [
    {
      date: '2024-01-01',
      conversions: 10,
      apiCalls: 50,
      fileUploads: 5,
      fileDownloads: 3,
      templatesUsed: 2,
      batchConversions: 1,
      storageUsed: 1000,
    },
    {
      date: '2024-01-02',
      conversions: 15,
      apiCalls: 60,
      fileUploads: 8,
      fileDownloads: 4,
      templatesUsed: 3,
      batchConversions: 2,
      storageUsed: 1500,
    },
  ],
  startDate: '2024-01-01',
  endDate: '2024-01-02',
  totalDays: 2,
};

describe('ExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export button', () => {
    render(<ExportDialog data={mockData} />);

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<ExportDialog data={mockData} disabled={true} />);

    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
  });

  it('disables button when data is null', () => {
    render(<ExportDialog data={null} />);

    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
  });

  it('opens dialog when export button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExportDialog data={mockData} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    expect(screen.getByText('Export Analytics Data')).toBeInTheDocument();
    expect(screen.getByText('Download your analytics data in your preferred format')).toBeInTheDocument();
  });

  it('shows format selection options', async () => {
    const user = userEvent.setup();
    render(<ExportDialog data={mockData} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('Spreadsheet compatible')).toBeInTheDocument();
    expect(screen.getByText('For developers')).toBeInTheDocument();
  });

  it('shows data range information', async () => {
    const user = userEvent.setup();
    render(<ExportDialog data={mockData} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    // Check that date range is displayed
    expect(screen.getByText(/Data from.*to.*\(2 days\)/)).toBeInTheDocument();
  });

  it('has cancel and export buttons in dialog', async () => {
    const user = userEvent.setup();
    render(<ExportDialog data={mockData} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Export Now')).toBeInTheDocument();
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ExportDialog data={mockData} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByText('Export Analytics Data')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Export Analytics Data')).not.toBeInTheDocument();
    });
  });

  it('has accessible aria-pressed attributes on format buttons', async () => {
    const user = userEvent.setup();
    render(<ExportDialog data={mockData} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    // Find the format selection buttons (not the main buttons)
    const formatButtons = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-pressed') !== null
    );

    expect(formatButtons.length).toBe(2); // CSV and JSON buttons
  });

  it('can toggle between CSV and JSON format', async () => {
    const user = userEvent.setup();
    render(<ExportDialog data={mockData} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    // Find format buttons by their aria-pressed attribute
    const formatButtons = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-pressed') !== null
    );

    // CSV should be selected by default (first button)
    expect(formatButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(formatButtons[1]).toHaveAttribute('aria-pressed', 'false');

    // Click JSON button
    await user.click(formatButtons[1]);

    expect(formatButtons[0]).toHaveAttribute('aria-pressed', 'false');
    expect(formatButtons[1]).toHaveAttribute('aria-pressed', 'true');
  });
});
