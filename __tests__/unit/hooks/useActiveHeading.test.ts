import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveHeading, scrollToHeading } from '@/hooks/useActiveHeading';

describe('useActiveHeading', () => {
  let mockObserver: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
  };
  let observerCallback: IntersectionObserverCallback;

  beforeEach(() => {
    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    };

    // Mock IntersectionObserver
    vi.stubGlobal('IntersectionObserver', vi.fn((callback: IntersectionObserverCallback) => {
      observerCallback = callback;
      return mockObserver;
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return null when no headings', () => {
    const { result } = renderHook(() => useActiveHeading([]));

    expect(result.current).toBeNull();
  });

  it('should observe heading elements', () => {
    const headings = [
      { id: 'heading-1', text: 'Heading 1', level: 1 },
      { id: 'heading-2', text: 'Heading 2', level: 2 },
    ];

    // Create mock elements
    const mockElement1 = document.createElement('h1');
    mockElement1.id = 'heading-1';
    document.body.appendChild(mockElement1);

    const mockElement2 = document.createElement('h2');
    mockElement2.id = 'heading-2';
    document.body.appendChild(mockElement2);

    renderHook(() => useActiveHeading(headings));

    expect(mockObserver.observe).toHaveBeenCalledWith(mockElement1);
    expect(mockObserver.observe).toHaveBeenCalledWith(mockElement2);

    // Cleanup
    document.body.removeChild(mockElement1);
    document.body.removeChild(mockElement2);
  });

  it('should set active ID when heading is intersecting', () => {
    const headings = [
      { id: 'heading-1', text: 'Heading 1', level: 1 },
    ];

    const mockElement = document.createElement('h1');
    mockElement.id = 'heading-1';
    document.body.appendChild(mockElement);

    const { result } = renderHook(() => useActiveHeading(headings));

    // Simulate intersection
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: mockElement,
            boundingClientRect: { top: 100 } as DOMRect,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(result.current).toBe('heading-1');

    // Cleanup
    document.body.removeChild(mockElement);
  });

  it('should select topmost visible heading', () => {
    const headings = [
      { id: 'heading-1', text: 'Heading 1', level: 1 },
      { id: 'heading-2', text: 'Heading 2', level: 1 },
    ];

    const mockElement1 = document.createElement('h1');
    mockElement1.id = 'heading-1';
    document.body.appendChild(mockElement1);

    const mockElement2 = document.createElement('h1');
    mockElement2.id = 'heading-2';
    document.body.appendChild(mockElement2);

    const { result } = renderHook(() => useActiveHeading(headings));

    // Simulate both headings visible, heading-1 is higher (smaller top value)
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: mockElement1,
            boundingClientRect: { top: 50 } as DOMRect,
          } as unknown as IntersectionObserverEntry,
          {
            isIntersecting: true,
            target: mockElement2,
            boundingClientRect: { top: 150 } as DOMRect,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(result.current).toBe('heading-1');

    // Cleanup
    document.body.removeChild(mockElement1);
    document.body.removeChild(mockElement2);
  });

  it('should disconnect observer on unmount', () => {
    const headings = [{ id: 'heading-1', text: 'Heading 1', level: 1 }];

    const { unmount } = renderHook(() => useActiveHeading(headings));

    unmount();

    expect(mockObserver.disconnect).toHaveBeenCalled();
  });

  it('should not set active ID when no headings are intersecting', () => {
    const headings = [
      { id: 'heading-1', text: 'Heading 1', level: 1 },
    ];

    const mockElement = document.createElement('h1');
    mockElement.id = 'heading-1';
    document.body.appendChild(mockElement);

    const { result } = renderHook(() => useActiveHeading(headings));

    // Simulate no intersection
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: false,
            target: mockElement,
            boundingClientRect: { top: 100 } as DOMRect,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(result.current).toBeNull();

    // Cleanup
    document.body.removeChild(mockElement);
  });
});

describe('scrollToHeading', () => {
  it('should call scrollIntoView on the element', () => {
    const mockElement = document.createElement('h1');
    mockElement.id = 'test-heading';
    mockElement.scrollIntoView = vi.fn();
    document.body.appendChild(mockElement);

    scrollToHeading('test-heading');

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    // Cleanup
    document.body.removeChild(mockElement);
  });

  it('should not throw when element does not exist', () => {
    expect(() => {
      scrollToHeading('non-existent-heading');
    }).not.toThrow();
  });
});
