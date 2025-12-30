/**
 * EditorToolbar Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock store functions
const mockSetViewMode = vi.fn();
const mockToggleFullscreen = vi.fn();
const mockToggleToc = vi.fn();
const mockInsertAtCursor = vi.fn();
const mockWrapSelection = vi.fn();
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockSaveNow = vi.fn();

// Use vi.hoisted to define store state that can be accessed in mocks
const { storeState, autoSaveState } = vi.hoisted(() => ({
  storeState: {
    viewMode: 'editor',
    isFullscreen: false,
    showToc: false,
  },
  autoSaveState: {
    isDirty: false,
  },
}));

vi.mock('@/stores/editor-store', () => ({
  useEditorStore: () => ({
    viewMode: storeState.viewMode,
    setViewMode: mockSetViewMode,
    isFullscreen: storeState.isFullscreen,
    toggleFullscreen: mockToggleFullscreen,
    showToc: storeState.showToc,
    toggleToc: mockToggleToc,
    insertAtCursor: mockInsertAtCursor,
    wrapSelection: mockWrapSelection,
    undo: mockUndo,
    redo: mockRedo,
  }),
}));

vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    saveNow: mockSaveNow,
    isDirty: autoSaveState.isDirty,
  }),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) =>
    classes.filter((c) => typeof c === 'string' && c).join(' '),
}));

// Import component after mocks are set up
import { EditorToolbar } from '@/components/editor/EditorToolbar';

describe('EditorToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.viewMode = 'editor';
    storeState.isFullscreen = false;
    storeState.showToc = false;
    autoSaveState.isDirty = false;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the toolbar', () => {
      render(<EditorToolbar />);

      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
    });

    it('should render all formatting buttons', () => {
      render(<EditorToolbar />);

      // Formatting buttons
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /strikethrough/i })).toBeInTheDocument();
    });

    it('should render heading buttons', () => {
      render(<EditorToolbar />);

      expect(screen.getByRole('button', { name: /heading1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /heading2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /heading3/i })).toBeInTheDocument();
    });

    it('should render list buttons', () => {
      render(<EditorToolbar />);

      expect(screen.getByRole('button', { name: /bulletList/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /numberedList/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /taskList/i })).toBeInTheDocument();
    });

    it('should render insert buttons', () => {
      render(<EditorToolbar />);

      expect(screen.getByRole('button', { name: /quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^code$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /codeBlock/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /link/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /image/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /table/i })).toBeInTheDocument();
    });

    it('should render view action buttons', () => {
      render(<EditorToolbar />);

      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /split/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toc/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    });
  });

  describe('Undo/Redo Actions', () => {
    it('should call undo when undo button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /undo/i }));
      expect(mockUndo).toHaveBeenCalled();
    });

    it('should call redo when redo button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /redo/i }));
      expect(mockRedo).toHaveBeenCalled();
    });
  });

  describe('Save Action', () => {
    it('should call saveNow when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /save/i }));
      expect(mockSaveNow).toHaveBeenCalled();
    });

    it('should handle Ctrl+S keyboard shortcut', async () => {
      render(<EditorToolbar />);

      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(mockSaveNow).toHaveBeenCalled();
      });
    });

    it('should handle Cmd+S keyboard shortcut on Mac', async () => {
      render(<EditorToolbar />);

      fireEvent.keyDown(window, { key: 's', metaKey: true });

      await waitFor(() => {
        expect(mockSaveNow).toHaveBeenCalled();
      });
    });
  });

  describe('Formatting Actions', () => {
    it('should wrap selection with bold syntax when bold button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /bold/i }));
      expect(mockWrapSelection).toHaveBeenCalledWith('**', '**');
    });

    it('should wrap selection with italic syntax when italic button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /italic/i }));
      expect(mockWrapSelection).toHaveBeenCalledWith('_', '_');
    });

    it('should wrap selection with strikethrough syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /strikethrough/i }));
      expect(mockWrapSelection).toHaveBeenCalledWith('~~', '~~');
    });

    it('should wrap selection with inline code syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /^code$/i }));
      expect(mockWrapSelection).toHaveBeenCalledWith('`', '`');
    });
  });

  describe('Heading Actions', () => {
    it('should insert heading 1 syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /heading1/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n# ');
    });

    it('should insert heading 2 syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /heading2/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n## ');
    });

    it('should insert heading 3 syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /heading3/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n### ');
    });
  });

  describe('List Actions', () => {
    it('should insert bullet list syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /bulletList/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n- ');
    });

    it('should insert numbered list syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /numberedList/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n1. ');
    });

    it('should insert task list syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /taskList/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n- [ ] ');
    });
  });

  describe('Insert Actions', () => {
    it('should insert quote syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /quote/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n> ');
    });

    it('should insert code block syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /codeBlock/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n```\n\n```');
    });

    it('should insert link syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /link/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('[](url)');
    });

    it('should insert image syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /image/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('![alt]()');
    });

    it('should insert table syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /table/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith(
        '\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |'
      );
    });

    it('should insert horizontal rule syntax', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /horizontalRule/i }));
      expect(mockInsertAtCursor).toHaveBeenCalledWith('\n---');
    });
  });

  describe('View Mode Actions', () => {
    it('should toggle to preview mode when preview button is clicked', async () => {
      const user = userEvent.setup();
      storeState.viewMode = 'editor';
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /preview/i }));
      expect(mockSetViewMode).toHaveBeenCalledWith('preview');
    });

    it('should toggle back to editor mode when in preview mode', async () => {
      const user = userEvent.setup();
      storeState.viewMode = 'preview';
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /preview/i }));
      expect(mockSetViewMode).toHaveBeenCalledWith('editor');
    });

    it('should toggle to split mode when split button is clicked', async () => {
      const user = userEvent.setup();
      storeState.viewMode = 'editor';
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /split/i }));
      expect(mockSetViewMode).toHaveBeenCalledWith('split');
    });

    it('should toggle back to editor mode when in split mode', async () => {
      const user = userEvent.setup();
      storeState.viewMode = 'split';
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /split/i }));
      expect(mockSetViewMode).toHaveBeenCalledWith('editor');
    });
  });

  describe('TOC Action', () => {
    it('should toggle TOC when toc button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /toc/i }));
      expect(mockToggleToc).toHaveBeenCalled();
    });
  });

  describe('Fullscreen Action', () => {
    it('should toggle fullscreen when fullscreen button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditorToolbar />);

      await user.click(screen.getByRole('button', { name: /fullscreen/i }));
      expect(mockToggleFullscreen).toHaveBeenCalled();
    });

    it('should show exit fullscreen button when in fullscreen mode', () => {
      storeState.isFullscreen = true;
      render(<EditorToolbar />);

      expect(screen.getByRole('button', { name: /exitFullscreen/i })).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcut Cleanup', () => {
    it('should remove keyboard shortcut listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<EditorToolbar />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
});
