import { describe, it, expect, vi } from 'vitest';
import { skipWaiting } from '@/hooks/useServiceWorker';

// The useServiceWorker hook is difficult to test in jsdom because it relies on
// browser-specific APIs (service workers, navigator.onLine). These tests focus
// on the exported helper function and basic behavior.

describe('skipWaiting', () => {
  it('should not throw when service worker is not available', () => {
    // In jsdom, navigator.serviceWorker may not be available
    // The function should handle this gracefully
    expect(() => skipWaiting()).not.toThrow();
  });

  it('should post message when controller exists', () => {
    const mockPostMessage = vi.fn();
    const mockReload = vi.fn();

    // Store originals
    const originalServiceWorker = navigator.serviceWorker;
    const originalLocation = window.location;

    // Mock serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        controller: {
          postMessage: mockPostMessage,
        },
      },
      configurable: true,
    });

    // Mock location
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      configurable: true,
    });

    skipWaiting();

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(mockReload).toHaveBeenCalled();

    // Restore
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
  });
});
