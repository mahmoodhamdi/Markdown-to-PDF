import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock dependencies - use vi.fn() directly to avoid hoisting issues
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockToastFn = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('sonner', () => {
  const toastFn = (...args: unknown[]) => mockToastFn(...args);
  toastFn.success = (...args: unknown[]) => mockToastSuccess(...args);
  return { toast: toastFn };
});

const mockSetIsDirty = vi.fn();
const mockSetContent = vi.fn();
const mockUseEditorStore = vi.fn();

vi.mock('@/stores/editor-store', () => ({
  useEditorStore: Object.assign(
    (...args: unknown[]) => mockUseEditorStore(...args),
    {
      getState: () => ({ setContent: mockSetContent }),
    }
  ),
}));

// Import after mocking
import { RecoveryPrompt } from '@/components/editor/RecoveryPrompt';

describe('RecoveryPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorStore.mockReturnValue({
      content: '',
      isDirty: false,
      lastSaved: null,
      setIsDirty: mockSetIsDirty,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not show toast when content is empty', () => {
    mockUseEditorStore.mockReturnValue({
      content: '',
      isDirty: true,
      lastSaved: null,
      setIsDirty: mockSetIsDirty,
    });

    render(<RecoveryPrompt />);

    expect(mockToastFn).not.toHaveBeenCalled();
  });

  it('should not show toast when not dirty', () => {
    mockUseEditorStore.mockReturnValue({
      content: 'some content',
      isDirty: false,
      lastSaved: null,
      setIsDirty: mockSetIsDirty,
    });

    render(<RecoveryPrompt />);

    expect(mockToastFn).not.toHaveBeenCalled();
  });

  it('should show toast when there is dirty content', () => {
    mockUseEditorStore.mockReturnValue({
      content: 'unsaved content',
      isDirty: true,
      lastSaved: Date.now(),
      setIsDirty: mockSetIsDirty,
    });

    render(<RecoveryPrompt />);

    expect(mockToastFn).toHaveBeenCalledWith(
      'title',
      expect.objectContaining({
        duration: Infinity,
        action: expect.objectContaining({
          label: 'recover',
        }),
        cancel: expect.objectContaining({
          label: 'discard',
        }),
      })
    );
  });

  it('should include lastEdited in description when lastSaved is available', () => {
    const lastSaved = Date.now() - 60000; // 1 minute ago

    mockUseEditorStore.mockReturnValue({
      content: 'unsaved content',
      isDirty: true,
      lastSaved,
      setIsDirty: mockSetIsDirty,
    });

    render(<RecoveryPrompt />);

    expect(mockToastFn).toHaveBeenCalledWith(
      'title',
      expect.objectContaining({
        description: expect.stringContaining('lastEdited'),
      })
    );
  });

  it('should only show toast once', () => {
    mockUseEditorStore.mockReturnValue({
      content: 'unsaved content',
      isDirty: true,
      lastSaved: null,
      setIsDirty: mockSetIsDirty,
    });

    const { rerender } = render(<RecoveryPrompt />);

    // Re-render to simulate component update
    rerender(<RecoveryPrompt />);
    rerender(<RecoveryPrompt />);

    expect(mockToastFn).toHaveBeenCalledTimes(1);
  });

  it('should call setIsDirty(false) when recover action is clicked', () => {
    mockUseEditorStore.mockReturnValue({
      content: 'unsaved content',
      isDirty: true,
      lastSaved: null,
      setIsDirty: mockSetIsDirty,
    });

    render(<RecoveryPrompt />);

    // Get the action callback that was passed to toast
    const toastCall = mockToastFn.mock.calls[0];
    const actionCallback = toastCall[1].action.onClick;

    // Simulate clicking recover
    actionCallback();

    expect(mockSetIsDirty).toHaveBeenCalledWith(false);
    expect(mockToastSuccess).toHaveBeenCalledWith('recover');
  });
});
