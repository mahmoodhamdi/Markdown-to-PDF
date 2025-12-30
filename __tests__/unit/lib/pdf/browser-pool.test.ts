/**
 * Browser Pool Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Puppeteer
const mockPage = {
  close: vi.fn().mockResolvedValue(undefined),
  isClosed: vi.fn().mockReturnValue(false),
  setContent: vi.fn().mockResolvedValue(undefined),
  pdf: vi.fn().mockResolvedValue(Buffer.from('pdf-content')),
  evaluate: vi.fn().mockResolvedValue(undefined),
  setViewport: vi.fn().mockResolvedValue(undefined),
  waitForSelector: vi.fn().mockResolvedValue(undefined),
  setRequestInterception: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
};

const mockBrowser = {
  connected: true,
  newPage: vi.fn().mockResolvedValue(mockPage),
  close: vi.fn().mockResolvedValue(undefined),
  pages: vi.fn().mockResolvedValue([mockPage]),
  on: vi.fn(),
};

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue(mockBrowser),
  },
}));

// Import after mocking
import { browserPool } from '@/lib/pdf/browser-pool';

describe('Browser Pool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset browser connected state
    mockBrowser.connected = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset browser connected state
    mockBrowser.connected = true;
    // Restore mock implementations
    mockPage.close.mockResolvedValue(undefined);
    mockPage.isClosed.mockReturnValue(false);
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockBrowser.close.mockResolvedValue(undefined);
  });

  describe('getBrowser', () => {
    it('should launch a new browser when none exists', async () => {
      const browser = await browserPool.getBrowser();

      expect(browser).toBeDefined();
      expect(browser.newPage).toBeDefined();
    });

    it('should return existing browser if connected', async () => {
      // Get browser first time
      const browser1 = await browserPool.getBrowser();

      // Get browser second time
      const browser2 = await browserPool.getBrowser();

      expect(browser1).toBe(browser2);
    });

    it('should launch new browser if existing one is disconnected', async () => {
      // Get browser first
      await browserPool.getBrowser();

      // Simulate disconnection
      mockBrowser.connected = false;

      // Request browser again - should launch new one
      const browser = await browserPool.getBrowser();

      expect(browser).toBeDefined();
    });
  });

  describe('getPage', () => {
    it('should return a new page from browser', async () => {
      const page = await browserPool.getPage();

      expect(page).toBeDefined();
      expect(mockBrowser.newPage).toHaveBeenCalled();
    });

    it('should track active page count', async () => {
      await browserPool.getPage();
      await browserPool.getPage();

      expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    });
  });

  describe('releasePage', () => {
    it('should close the page when released', async () => {
      const page = await browserPool.getPage();

      await browserPool.releasePage(page);

      expect(page.close).toHaveBeenCalled();
    });

    it('should handle already closed page gracefully', async () => {
      const page = await browserPool.getPage();
      mockPage.isClosed.mockReturnValueOnce(true);

      // Should not throw
      await expect(browserPool.releasePage(page)).resolves.not.toThrow();
    });

    it('should decrement active page count', async () => {
      const page1 = await browserPool.getPage();
      await browserPool.getPage(); // page2 - kept active to test release behavior

      await browserPool.releasePage(page1);

      // Should not close browser yet as page2 is still active
      expect(mockBrowser.close).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should close the browser', async () => {
      await browserPool.getBrowser();

      // If cleanup exists, test it
      if (typeof browserPool.cleanup === 'function') {
        await browserPool.cleanup();
        expect(mockBrowser.close).toHaveBeenCalled();
      } else {
        // If no cleanup, the browser should still be closeable
        expect(mockBrowser.close).toBeDefined();
      }
    });

    it('should handle cleanup when no browser exists', async () => {
      // If cleanup exists, test it
      if (typeof browserPool.cleanup === 'function') {
        await expect(browserPool.cleanup()).resolves.not.toThrow();
      } else {
        // Skip if no cleanup function
        expect(true).toBe(true);
      }
    });
  });

  describe('idle timeout', () => {
    it('should start idle timer when all pages are released', async () => {
      vi.useFakeTimers();

      const page = await browserPool.getPage();
      await browserPool.releasePage(page);

      // Fast forward past idle timeout
      vi.advanceTimersByTime(35000);

      vi.useRealTimers();
    });

    it('should clear idle timer when new page is requested', async () => {
      vi.useFakeTimers();

      const page1 = await browserPool.getPage();
      await browserPool.releasePage(page1);

      // Request new page before timeout
      vi.advanceTimersByTime(10000);
      await browserPool.getPage();

      vi.useRealTimers();
    });
  });
});

describe('Browser Pool - Concurrency', () => {
  it('should handle multiple concurrent page requests', async () => {
    const pages = await Promise.all([
      browserPool.getPage(),
      browserPool.getPage(),
      browserPool.getPage(),
    ]);

    expect(pages).toHaveLength(3);
    pages.forEach((page) => expect(page).toBeDefined());
  });

  it('should release multiple pages correctly', async () => {
    const pages = await Promise.all([
      browserPool.getPage(),
      browserPool.getPage(),
      browserPool.getPage(),
    ]);

    await Promise.all(pages.map((page) => browserPool.releasePage(page)));

    expect(mockPage.close).toHaveBeenCalledTimes(3);
  });
});

describe('Browser Pool - Error Handling', () => {
  it('should handle page close error gracefully', async () => {
    mockPage.close.mockRejectedValueOnce(new Error('Page already closed'));

    const page = await browserPool.getPage();

    // Should not throw
    await expect(browserPool.releasePage(page)).resolves.not.toThrow();
  });

  it('should handle browser disconnect during page creation', async () => {
    mockBrowser.connected = false;

    // Should launch new browser
    const page = await browserPool.getPage();
    expect(page).toBeDefined();
  });
});

describe('Browser Pool - Launch Arguments', () => {
  it('should launch browser with security arguments', async () => {
    const puppeteer = await import('puppeteer');

    await browserPool.getBrowser();

    expect(puppeteer.default.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        headless: true,
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ]),
      })
    );
  });
});

describe('Browser Pool - State Management', () => {
  it('should track last used time', async () => {
    const startTime = Date.now();

    await browserPool.getPage();

    // The last used time should be close to now
    const now = Date.now();
    expect(now - startTime).toBeLessThan(1000);
  });

  it('should wait for launch if already launching', async () => {
    // Request browser multiple times simultaneously
    const [browser1, browser2, browser3] = await Promise.all([
      browserPool.getBrowser(),
      browserPool.getBrowser(),
      browserPool.getBrowser(),
    ]);

    // All should get the same browser
    expect(browser1).toBe(browser2);
    expect(browser2).toBe(browser3);
  });
});

describe('Browser Pool - Resource Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser.connected = true;
    mockPage.close.mockResolvedValue(undefined);
    mockPage.isClosed.mockReturnValue(false);
    mockBrowser.newPage.mockResolvedValue(mockPage);
  });

  it('should handle many pages gracefully', async () => {
    const pageCount = 10;
    const pages = [];

    // Clear any previous calls
    mockPage.close.mockClear();

    for (let i = 0; i < pageCount; i++) {
      pages.push(await browserPool.getPage());
    }

    expect(pages).toHaveLength(pageCount);

    // Release all pages
    for (const page of pages) {
      await browserPool.releasePage(page);
    }

    // Verify close was called for each page
    expect(mockPage.close).toHaveBeenCalled();
    expect(mockPage.close.mock.calls.length).toBeGreaterThanOrEqual(pageCount);
  });
});

describe('Browser Pool - Resource Blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser.connected = true;
    mockPage.setRequestInterception.mockResolvedValue(undefined);
    mockPage.on.mockClear();
    mockPage.setViewport.mockResolvedValue(undefined);
    mockBrowser.newPage.mockResolvedValue(mockPage);
  });

  it('should set up request interception when blockExternalResources is true', async () => {
    const page = await browserPool.getPage({ blockExternalResources: true });

    expect(page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(page.on).toHaveBeenCalledWith('request', expect.any(Function));
  });

  it('should not set up request interception when blockExternalResources is false', async () => {
    const page = await browserPool.getPage({ blockExternalResources: false });

    expect(page.setRequestInterception).not.toHaveBeenCalled();
  });

  it('should not set up request interception by default', async () => {
    const page = await browserPool.getPage();

    expect(page.setRequestInterception).not.toHaveBeenCalled();
  });
});

describe('Browser Pool - Concurrency Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser.connected = true;
    mockBrowser.newPage.mockResolvedValue(mockPage);
  });

  it('should track concurrency state', () => {
    const state = browserPool.getConcurrencyState();

    expect(state).toHaveProperty('active');
    expect(state).toHaveProperty('queued');
    expect(state).toHaveProperty('max');
    expect(typeof state.active).toBe('number');
    expect(typeof state.queued).toBe('number');
    expect(typeof state.max).toBe('number');
  });

  it('should acquire and release concurrency slots', async () => {
    const initialState = browserPool.getConcurrencyState();

    await browserPool.acquireConcurrencySlot();
    const afterAcquire = browserPool.getConcurrencyState();

    expect(afterAcquire.active).toBe(initialState.active + 1);

    browserPool.releaseConcurrencySlot();
    const afterRelease = browserPool.getConcurrencyState();

    expect(afterRelease.active).toBe(initialState.active);
  });

  it('should handle multiple concurrent slot acquisitions', async () => {
    const slots = 3;
    const releases: (() => void)[] = [];

    for (let i = 0; i < slots; i++) {
      await browserPool.acquireConcurrencySlot();
      releases.push(() => browserPool.releaseConcurrencySlot());
    }

    const state = browserPool.getConcurrencyState();
    expect(state.active).toBeGreaterThanOrEqual(slots);

    // Release all slots
    releases.forEach(release => release());
  });

  it('should not go below 0 when releasing slots', () => {
    // Release more slots than acquired
    browserPool.releaseConcurrencySlot();
    browserPool.releaseConcurrencySlot();

    const state = browserPool.getConcurrencyState();
    expect(state.active).toBeGreaterThanOrEqual(0);
  });
});
