import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvertButton } from '@/components/converter/ConvertButton';
import { toast } from 'sonner';

// Mock the stores
let mockContent = '# Test Content';
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: () => ({
    content: mockContent,
  }),
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({
    documentTheme: 'github',
    codeTheme: 'github-light',
    customCss: '',
  }),
}));

vi.mock('@/stores/settings-store', () => ({
  useSettingsStore: () => ({
    pageSettings: {
      pageSize: 'a4',
      orientation: 'portrait',
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
    },
  }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      converting: 'Converting...',
      downloadPdf: 'Download PDF',
      downloadHtml: 'Download HTML',
      conversionSuccess: 'Conversion successful!',
      conversionFailed: 'Conversion failed.',
      emptyContent: 'Content is empty.',
      tooManyRequests: 'Too many requests.',
      networkError: 'Network error.',
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

// Mock fetch
const mockFetch = vi.fn();

describe('ConvertButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContent = '# Test Content';
    global.fetch = mockFetch;

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders download button', () => {
    render(<ConvertButton />);
    expect(screen.getByTestId('convert-btn')).toBeInTheDocument();
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  it('calls API and shows success toast on successful conversion', async () => {
    const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(mockBlob),
    });

    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/convert', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Conversion successful!');
    });
  });

  it('shows error toast on failed conversion', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Conversion failed.');
    });
  });

  it('shows rate limit toast on 429 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Too many requests.');
    });
  });

  it('disables button when content is empty', () => {
    mockContent = '';
    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    expect(button).toBeDisabled();
  });

  it('shows converting state while processing', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetch.mockReturnValueOnce(pendingPromise);

    render(<ConvertButton />);

    const button = screen.getByTestId('convert-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Converting...')).toBeInTheDocument();
    });

    // Clean up
    resolvePromise!({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(new Blob(['test'])),
    });
  });

  it('passes correct options to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(new Blob(['test'])),
    });

    render(<ConvertButton />);
    fireEvent.click(screen.getByTestId('convert-btn'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"markdown":"# Test Content"'),
      });
    });
  });
});
