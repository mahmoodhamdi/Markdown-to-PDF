import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploadZone } from '@/components/dashboard/FileUploadZone';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      dragDrop: 'Drag and drop files here or click to browse',
      browse: 'Browse Files',
      maxSize: 'Maximum file size: {size}',
      fileTooLarge: 'File is too large. Please upload a smaller file.',
      upgradeRequired: 'File storage requires a paid plan',
      upload: 'Upload',
      uploading: 'Uploading...',
      uploadSuccess: 'File uploaded successfully',
      uploadError: 'Failed to upload file',
      cancel: 'Cancel',
    };
    return (key: string, params?: Record<string, string>) => {
      let value = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v);
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
  },
}));

describe('FileUploadZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render drag and drop text', () => {
    render(<FileUploadZone />);
    expect(screen.getByText('Drag and drop files here or click to browse')).toBeInTheDocument();
  });

  it('should render browse button', () => {
    render(<FileUploadZone />);
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
  });

  it('should render max size info', () => {
    render(<FileUploadZone maxSizeBytes={5 * 1024 * 1024} />);
    expect(screen.getByText(/Maximum file size:/)).toBeInTheDocument();
  });

  it('should render disabled state', () => {
    render(<FileUploadZone disabled={true} />);
    expect(screen.getByText('File storage requires a paid plan')).toBeInTheDocument();
  });

  it('should not render browse button when disabled', () => {
    render(<FileUploadZone disabled={true} />);
    expect(screen.queryByText('Browse Files')).not.toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    render(<FileUploadZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const file = new File(['test content'], 'test.md', { type: 'text/markdown' });
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test.md')).toBeInTheDocument();
    });
  });

  it('should show upload button after file selection', async () => {
    render(<FileUploadZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test content'], 'test.md', { type: 'text/markdown' });
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });
  });

  it('should show cancel button after file selection', async () => {
    render(<FileUploadZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test content'], 'test.md', { type: 'text/markdown' });
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('should handle dragover event', () => {
    render(<FileUploadZone />);

    const dropZone = document.querySelector('.border-dashed') as HTMLElement;
    fireEvent.dragOver(dropZone, {
      preventDefault: vi.fn(),
      dataTransfer: { files: [] },
    });

    expect(dropZone.className).toContain('border-primary');
  });

  it('should handle dragleave event', () => {
    render(<FileUploadZone />);

    const dropZone = document.querySelector('.border-dashed') as HTMLElement;

    fireEvent.dragOver(dropZone, {
      preventDefault: vi.fn(),
      dataTransfer: { files: [] },
    });

    fireEvent.dragLeave(dropZone, {
      preventDefault: vi.fn(),
    });

    expect(dropZone.className).not.toContain('border-primary');
  });

  it('should accept correct file types', () => {
    render(<FileUploadZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toContain('.md');
    expect(input.accept).toContain('.markdown');
    expect(input.accept).toContain('.txt');
    expect(input.accept).toContain('.pdf');
  });

  it('should call onUploadSuccess callback on successful upload', async () => {
    const mockOnUploadSuccess = vi.fn();
    const mockResponse = {
      file: {
        id: '123',
        filename: 'test.md',
        size: 100,
        mimeType: 'text/markdown',
        createdAt: new Date().toISOString(),
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<FileUploadZone onUploadSuccess={mockOnUploadSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test content'], 'test.md', { type: 'text/markdown' });
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Upload'));

    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalledWith(mockResponse.file);
    });
  });
});
