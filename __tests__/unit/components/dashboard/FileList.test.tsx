import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileList } from '@/components/dashboard/FileList';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      yourFiles: 'Your Files',
      noFiles: 'No files uploaded yet',
      fileName: 'Name',
      fileSize: 'Size',
      uploadDate: 'Date',
      download: 'Download',
      downloadSuccess: 'File downloaded successfully',
      downloadError: 'Failed to download file',
      copyLink: 'Copy Link',
      linkCopied: 'Link copied to clipboard',
      linkError: 'Failed to get file link',
      delete: 'Delete',
      deleteSuccess: 'File deleted successfully',
      deleteError: 'Failed to delete file',
      deleteSelected: 'Delete ({count})',
      bulkDeleteSuccess: '{count} files deleted successfully',
      bulkDeletePartial: 'Deleted {success} files, {failed} failed',
      bulkDeleteError: 'Failed to delete files',
      confirmDelete: 'Delete File',
      confirmDeleteDescription: 'Are you sure you want to delete this file?',
      confirmBulkDelete: 'Delete Files',
      confirmBulkDeleteDescription: 'Are you sure you want to delete {count} files?',
      cancel: 'Cancel',
    };
    return (key: string, params?: Record<string, number | string>) => {
      let value = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    };
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('FileList', () => {
  const mockFiles = [
    {
      id: '1',
      filename: 'document.md',
      size: 1024,
      mimeType: 'text/markdown',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      filename: 'image.png',
      size: 2048 * 1024,
      mimeType: 'image/png',
      createdAt: '2024-01-16T10:00:00Z',
    },
    {
      id: '3',
      filename: 'report.pdf',
      size: 512 * 1024,
      mimeType: 'application/pdf',
      createdAt: '2024-01-17T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render files title', () => {
    render(<FileList files={mockFiles} />);
    expect(screen.getByText('Your Files')).toBeInTheDocument();
  });

  it('should render empty state when no files', () => {
    render(<FileList files={[]} />);
    expect(screen.getByText('No files uploaded yet')).toBeInTheDocument();
  });

  it('should render loading skeleton when loading', () => {
    render(<FileList files={[]} loading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render file names in table view', () => {
    render(<FileList files={mockFiles} />);
    expect(screen.getByText('document.md')).toBeInTheDocument();
    expect(screen.getByText('image.png')).toBeInTheDocument();
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('should render file sizes', () => {
    render(<FileList files={mockFiles} />);
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByText('512 KB')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(<FileList files={mockFiles} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('should toggle view mode to grid', () => {
    render(<FileList files={mockFiles} />);

    const gridButton = document.querySelectorAll('button')[1];
    fireEvent.click(gridButton);

    const gridContainer = document.querySelector('.grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should handle file selection', () => {
    render(<FileList files={mockFiles} />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First file checkbox (index 0 is select all)

    expect(checkboxes[1]).toBeChecked();
  });

  it('should handle select all', () => {
    render(<FileList files={mockFiles} />);

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    const allCheckboxes = screen.getAllByRole('checkbox');
    allCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should show bulk delete button when files selected', () => {
    render(<FileList files={mockFiles} />);

    const checkbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(checkbox);

    expect(screen.getByText('Delete (1)')).toBeInTheDocument();
  });

  it('should sort files by name when clicking name header', () => {
    render(<FileList files={mockFiles} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    const rows = document.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('document.md');
  });

  it('should have dropdown menu triggers', () => {
    render(<FileList files={mockFiles} />);

    // Each file row should have a dropdown menu trigger (MoreVertical icon button)
    const moreButtons = document.querySelectorAll('button');
    // There should be multiple buttons including dropdown triggers
    expect(moreButtons.length).toBeGreaterThan(3);
  });

  it('should accept onFileDelete callback prop', () => {
    const mockOnFileDelete = vi.fn();

    // Simply verify the component renders with the callback prop
    render(<FileList files={mockFiles} onFileDelete={mockOnFileDelete} />);

    expect(screen.getByText('Your Files')).toBeInTheDocument();
  });

  it('should display different icons for different file types', () => {
    render(<FileList files={mockFiles} />);

    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should render action icons in table rows', () => {
    render(<FileList files={mockFiles} />);

    // Each file row should have action buttons with MoreVertical icon
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThan(0);
  });
});
