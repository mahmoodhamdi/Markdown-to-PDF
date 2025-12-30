import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEditorStore } from '@/stores/editor-store';
import { useSettingsStore } from '@/stores/settings-store';

// Mock the stores
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}));

vi.mock('@/stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

describe('useAutoSave', () => {
  const mockSetIsDirty = vi.fn();
  const mockSetSaveStatus = vi.fn();
  const mockSetLastSaved = vi.fn();

  const defaultEditorState = {
    content: 'test content',
    isDirty: false,
    setIsDirty: mockSetIsDirty,
    saveStatus: 'idle' as const,
    setSaveStatus: mockSetSaveStatus,
    setLastSaved: mockSetLastSaved,
  };

  const defaultSettingsState = {
    editorSettings: {
      autoSave: true,
      autoSaveInterval: 5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(JSON.stringify({
        state: { content: 'test content' },
      })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultEditorState);
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultSettingsState);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should return saveStatus, saveNow, and isDirty', () => {
    const { result } = renderHook(() => useAutoSave());

    expect(result.current).toHaveProperty('saveStatus');
    expect(result.current).toHaveProperty('saveNow');
    expect(result.current).toHaveProperty('isDirty');
  });

  it('should not trigger save when not dirty', () => {
    renderHook(() => useAutoSave());

    vi.advanceTimersByTime(10000);

    expect(mockSetSaveStatus).not.toHaveBeenCalled();
  });

  it('should trigger save when dirty and content changes', () => {
    // Start with initial content
    const { rerender } = renderHook(() => useAutoSave());

    // Now change content and set dirty
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultEditorState,
      isDirty: true,
      content: 'new content',
    });

    // Re-render to pick up the change
    rerender();

    // Advance past the auto-save interval
    vi.advanceTimersByTime(6000);

    expect(mockSetSaveStatus).toHaveBeenCalledWith('saving');
  });

  it('should not save when autoSave is disabled', () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      editorSettings: {
        autoSave: false,
        autoSaveInterval: 5,
      },
    });

    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultEditorState,
      isDirty: true,
      content: 'new content',
    });

    renderHook(() => useAutoSave());

    vi.advanceTimersByTime(10000);

    expect(mockSetSaveStatus).not.toHaveBeenCalledWith('saving');
  });

  it('should call saveNow immediately when invoked', async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultEditorState,
      isDirty: true,
    });

    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.saveNow();
    });

    expect(mockSetSaveStatus).toHaveBeenCalledWith('saving');
  });

  it('should set status to saved after successful save', async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultEditorState,
      isDirty: true,
    });

    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.saveNow();
    });

    // Advance past the save delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockSetSaveStatus).toHaveBeenCalledWith('saved');
    expect(mockSetLastSaved).toHaveBeenCalled();
    expect(mockSetIsDirty).toHaveBeenCalledWith(false);
  });

  it('should set status to error on save failure', async () => {
    // Mock localStorage to throw an error
    const localStorageMock = {
      getItem: vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      }),
      setItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultEditorState,
      isDirty: true,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.saveNow();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockSetSaveStatus).toHaveBeenCalledWith('error');
    consoleSpy.mockRestore();
  });

  it('should reset to idle after showing saved status', async () => {
    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultEditorState,
      isDirty: true,
    });

    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.saveNow();
    });

    // Advance past save delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Advance past the "saved" display duration
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(mockSetSaveStatus).toHaveBeenLastCalledWith('idle');
  });

  it('should clear pending save timeout when autoSave is disabled', () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      editorSettings: {
        autoSave: true,
        autoSaveInterval: 5,
      },
    });

    (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultEditorState,
      isDirty: true,
      content: 'new content',
    });

    const { rerender } = renderHook(() => useAutoSave());

    // Disable auto-save
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      editorSettings: {
        autoSave: false,
        autoSaveInterval: 5,
      },
    });

    rerender();

    // Wait past the interval
    vi.advanceTimersByTime(10000);

    // Save should not have been triggered
    expect(mockSetSaveStatus).not.toHaveBeenCalledWith('saving');
  });
});
