import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '@/components/editor/FileUpload';
import { toast } from 'sonner';

// Mock the editor store
const mockSetContent = vi.fn();
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(() => ({
    setContent: mockSetContent,
  })),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const translations: Record<string, string> = {
      uploadFile: 'Upload File',
      dropFile: 'Drop your markdown file here',
      supportedFormats: 'Supported: .md, .markdown, .txt',
      invalidFormat: `Invalid file format. Please use ${params?.formats || '.md, .markdown, .txt'}.`,
      fileTooBig: `File is too large. Maximum size is ${params?.max || '5'}MB.`,
      generic: 'Something went wrong. Please try again.',
      success: 'Success!',
    };
    return translations[key] || key;
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create a mock file with text() method
function createMockFile(content: string, name: string, type: string, size?: number): File {
  const file = new File([content], name, { type });
  // Override size if provided
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }
  // Ensure text() method works
  file.text = () => Promise.resolve(content);
  return file;
}

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area', () => {
    render(<FileUpload />);

    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('Supported: .md, .markdown, .txt')).toBeInTheDocument();
  });

  it('shows success toast on valid file upload', async () => {
    render(<FileUpload />);

    const file = createMockFile('# Test Markdown', 'test.md', 'text/markdown');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Create a change event with files
    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', {
      value: { files: [file] },
    });
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalledWith('# Test Markdown');
      expect(toast.success).toHaveBeenCalledWith('Success!');
    });
  });

  it('shows error toast for invalid file format', async () => {
    render(<FileUpload />);

    const file = createMockFile('test content', 'test.pdf', 'application/pdf');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(mockSetContent).not.toHaveBeenCalled();
    });
  });

  it('shows error toast for file too large', async () => {
    render(<FileUpload />);

    // Create a file that appears larger than 5MB
    const file = createMockFile('x', 'large.md', 'text/markdown', 6 * 1024 * 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(mockSetContent).not.toHaveBeenCalled();
    });
  });

  it('accepts .txt files', async () => {
    render(<FileUpload />);

    const file = createMockFile('Plain text content', 'test.txt', 'text/plain');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalledWith('Plain text content');
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('accepts .markdown files', async () => {
    render(<FileUpload />);

    const file = createMockFile('# Markdown content', 'test.markdown', 'text/markdown');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalledWith('# Markdown content');
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('handles drag and drop visual feedback', () => {
    render(<FileUpload />);

    // Find the dropzone by looking for the element with the border class
    const dropzone = document.querySelector('.border-dashed') as HTMLElement;
    expect(dropzone).not.toBeNull();

    // Should have default border initially
    expect(dropzone).toHaveClass('border-muted-foreground/25');

    // Simulate drag over
    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass('border-primary');

    // Simulate drag leave
    fireEvent.dragLeave(dropzone);
    expect(dropzone).toHaveClass('border-muted-foreground/25');
  });
});
