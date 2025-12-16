import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useEditorStore } from '@/stores/editor-store';

// Mock the editor store
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}));

describe('useKeyboardShortcuts', () => {
  const mockWrapSelection = vi.fn();
  const mockInsertAtCursor = vi.fn();
  const mockToggleFullscreen = vi.fn();
  const mockSetViewMode = vi.fn();
  const mockToggleToc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      wrapSelection: mockWrapSelection,
      insertAtCursor: mockInsertAtCursor,
      toggleFullscreen: mockToggleFullscreen,
      setViewMode: mockSetViewMode,
      viewMode: 'split',
      toggleToc: mockToggleToc,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const triggerKeydown = (key: string, options: Partial<KeyboardEventInit> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    document.dispatchEvent(event);
  };

  it('should call wrapSelection with ** for Ctrl+B (bold)', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('b', { ctrlKey: true });

    expect(mockWrapSelection).toHaveBeenCalledWith('**');
  });

  it('should call wrapSelection with _ for Ctrl+I (italic)', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('i', { ctrlKey: true });

    expect(mockWrapSelection).toHaveBeenCalledWith('_');
  });

  it('should call wrapSelection for Ctrl+K (link)', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('k', { ctrlKey: true });

    expect(mockWrapSelection).toHaveBeenCalledWith('[', '](url)');
  });

  it('should call wrapSelection with ` for Ctrl+` (inline code)', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('`', { ctrlKey: true });

    expect(mockWrapSelection).toHaveBeenCalledWith('`');
  });

  it('should toggle preview mode with Ctrl+Shift+P', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('p', { ctrlKey: true, shiftKey: true });

    expect(mockSetViewMode).toHaveBeenCalledWith('preview');
  });

  it('should toggle split mode with Ctrl+\\', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('\\', { ctrlKey: true });

    expect(mockSetViewMode).toHaveBeenCalledWith('editor');
  });

  it('should toggle fullscreen with Ctrl+Shift+Enter', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('Enter', { ctrlKey: true, shiftKey: true });

    expect(mockToggleFullscreen).toHaveBeenCalled();
  });

  it('should toggle TOC with Ctrl+Shift+T', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('t', { ctrlKey: true, shiftKey: true });

    expect(mockToggleToc).toHaveBeenCalled();
  });

  it('should insert heading 1 with Ctrl+Alt+1', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('1', { ctrlKey: true, altKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n# ');
  });

  it('should insert heading 2 with Ctrl+Alt+2', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('2', { ctrlKey: true, altKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n## ');
  });

  it('should insert heading 3 with Ctrl+Alt+3', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('3', { ctrlKey: true, altKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n### ');
  });

  it('should insert bullet list with Ctrl+Shift+L', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('l', { ctrlKey: true, shiftKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n- ');
  });

  it('should insert numbered list with Ctrl+Shift+O', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('o', { ctrlKey: true, shiftKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n1. ');
  });

  it('should insert quote with Ctrl+Shift+Q', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('q', { ctrlKey: true, shiftKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n> ');
  });

  it('should insert code block with Ctrl+Alt+C', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('c', { ctrlKey: true, altKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n```\n\n```');
  });

  it('should insert horizontal rule with Ctrl+Shift+H', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('h', { ctrlKey: true, shiftKey: true });

    expect(mockInsertAtCursor).toHaveBeenCalledWith('\n---\n');
  });

  it('should not trigger shortcuts without modifier keys', () => {
    renderHook(() => useKeyboardShortcuts());

    triggerKeydown('b');

    expect(mockWrapSelection).not.toHaveBeenCalled();
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
