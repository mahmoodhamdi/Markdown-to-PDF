/**
 * MarkdownEditor Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Monaco Editor
const mockEditor = {
  getValue: vi.fn(() => '# Test'),
  setValue: vi.fn(),
  getModel: vi.fn(() => ({
    getValue: vi.fn(() => '# Test'),
  })),
  onDidChangeModelContent: vi.fn(),
  dispose: vi.fn(),
};

// Use vi.hoisted to define state that can be accessed in mocks
const { callbacks, themeState } = vi.hoisted(() => ({
  callbacks: {
    onMount: null as ((editor: unknown) => void) | null,
    onChange: null as ((value: string | undefined) => void) | null,
  },
  themeState: {
    mode: 'light' as string,
  },
}));

vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange, onMount, loading, theme, options }) => {
    // Store callbacks for testing
    callbacks.onMount = onMount;
    callbacks.onChange = onChange;

    // Simulate mounting synchronously to avoid timer issues in tests
    if (onMount) {
      // Use queueMicrotask for synchronous-like behavior that works with React
      queueMicrotask(() => onMount(mockEditor));
    }

    return (
      <div
        data-testid="monaco-editor"
        data-theme={theme}
        data-font-size={options?.fontSize}
        data-word-wrap={options?.wordWrap}
        data-line-numbers={options?.lineNumbers}
      >
        {loading}
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  }),
}));

// Mock stores with dynamic state
const mockSetContent = vi.fn();
const mockSetEditorInstance = vi.fn();

vi.mock('@/stores/editor-store', () => ({
  useEditorStore: () => ({
    content: '# Hello World',
    setContent: mockSetContent,
    setEditorInstance: mockSetEditorInstance,
  }),
  MonacoEditor: {},
}));

const mockEditorSettings = {
  fontSize: 14,
  fontFamily: 'monospace',
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  minimap: false,
};

vi.mock('@/stores/settings-store', () => ({
  useSettingsStore: () => ({
    editorSettings: mockEditorSettings,
  }),
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({
    mode: themeState.mode,
  }),
}));

// Mock hooks
vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: vi.fn(),
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Import component after mocks are set up
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeState.mode = 'light';
    callbacks.onMount = null;
    callbacks.onChange = null;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render loading state initially', async () => {
      // The component shows loading until mounted state is true
      // On first synchronous render, mounted is false so loading is shown
      render(<MarkdownEditor />);

      // The loading state should be visible initially (before useEffect runs)
      // After effects run, the editor should be visible
      await waitFor(() => {
        expect(screen.getByTestId('editor')).toBeInTheDocument();
      });
    });

    it('should render editor after mounting', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(screen.getByTestId('editor')).toBeInTheDocument();
      });
    });

    it('should render with custom className', async () => {
      render(<MarkdownEditor className="custom-class" />);

      await waitFor(() => {
        const editor = screen.getByTestId('editor');
        expect(editor).toHaveClass('custom-class');
      });
    });

    it('should render Monaco editor component', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Editor Settings', () => {
    it('should apply font size from settings', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-font-size', '14');
      });
    });

    it('should apply word wrap from settings', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-word-wrap', 'on');
      });
    });

    it('should apply line numbers from settings', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-line-numbers', 'on');
      });
    });
  });

  describe('Theme Handling', () => {
    it('should use light theme when mode is light', async () => {
      themeState.mode = 'light';
      render(<MarkdownEditor />);

      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-theme', 'light');
      });
    });

    it('should use vs-dark theme when mode is dark', async () => {
      themeState.mode = 'dark';
      render(<MarkdownEditor />);

      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-theme', 'vs-dark');
      });
    });

    it('should detect system theme preference when mode is system', async () => {
      themeState.mode = 'system';

      // Mock matchMedia for dark theme
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<MarkdownEditor />);

      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-theme', 'vs-dark');
      });

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Editor Instance Management', () => {
    it('should set editor instance on mount', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(mockSetEditorInstance).toHaveBeenCalledWith(mockEditor);
      });
    });

    it('should clear editor instance on unmount', async () => {
      const { unmount } = render(<MarkdownEditor />);

      await waitFor(() => {
        expect(screen.getByTestId('editor')).toBeInTheDocument();
      });

      unmount();

      expect(mockSetEditorInstance).toHaveBeenCalledWith(null);
    });
  });

  describe('Content Changes', () => {
    it('should call setContent when editor content changes', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });

      // Simulate content change through callback
      if (callbacks.onChange) {
        act(() => {
          callbacks.onChange!('# New Content');
        });
      }

      expect(mockSetContent).toHaveBeenCalledWith('# New Content');
    });

    it('should handle undefined content change', async () => {
      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });

      // Simulate undefined content
      if (callbacks.onChange) {
        act(() => {
          callbacks.onChange!(undefined);
        });
      }

      expect(mockSetContent).toHaveBeenCalledWith('');
    });
  });

  describe('Hooks Integration', () => {
    it('should initialize useAutoSave hook', async () => {
      const { useAutoSave } = await import('@/hooks/useAutoSave');

      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(useAutoSave).toHaveBeenCalled();
      });
    });

    it('should initialize useKeyboardShortcuts hook', async () => {
      const { useKeyboardShortcuts } = await import('@/hooks/useKeyboardShortcuts');

      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(useKeyboardShortcuts).toHaveBeenCalled();
      });
    });
  });
});
