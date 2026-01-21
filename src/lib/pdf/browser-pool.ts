import type { Browser, Page, HTTPRequest } from 'puppeteer';

// Configuration constants
const MAX_CONCURRENT_CONVERSIONS = parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || '5', 10);

const BROWSER_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
  '--font-render-hinting=none',
];

const MAX_PAGES_PER_BROWSER = 10;
const BROWSER_IDLE_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute
const MAX_BROWSER_AGE = 300000; // 5 minutes - restart browser to prevent memory leaks

interface BrowserPoolState {
  browser: Browser | null;
  activePages: number;
  lastUsed: number;
  isLaunching: boolean;
  launchPromise: Promise<Browser> | null;
  createdAt: number;
  totalPagesCreated: number;
}

interface BrowserPoolMetrics {
  totalBrowsersLaunched: number;
  totalPagesCreated: number;
  totalCrashRecoveries: number;
  currentActivePages: number;
  isConnected: boolean;
  browserAge: number;
}

interface PageOptions {
  blockExternalResources?: boolean;
}

// Blocked resource types for external URLs
const BLOCKED_RESOURCE_TYPES = ['image', 'media', 'font'] as const;
// Allowed CDN domains for essential resources
const ALLOWED_DOMAINS = [
  'cdn.jsdelivr.net', // KaTeX, Mermaid, highlight.js
  'cdnjs.cloudflare.com',
  'unpkg.com',
];

class BrowserPool {
  private state: BrowserPoolState = {
    browser: null,
    activePages: 0,
    lastUsed: Date.now(),
    isLaunching: false,
    launchPromise: null,
    createdAt: 0,
    totalPagesCreated: 0,
  };

  private idleTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private metrics = {
    totalBrowsersLaunched: 0,
    totalCrashRecoveries: 0,
  };

  // Semaphore for concurrency control
  private concurrencyQueue: Array<() => void> = [];
  private activeConcurrent = 0;

  constructor() {
    this.startHealthCheck();
  }

  private async launchBrowser(): Promise<Browser> {
    const puppeteer = await import('puppeteer');
    this.metrics.totalBrowsersLaunched++;

    const browser = await puppeteer.default.launch({
      headless: true,
      args: BROWSER_LAUNCH_ARGS,
    });

    // Set up crash recovery
    browser.on('disconnected', () => {
      this.handleBrowserCrash();
    });

    return browser;
  }

  private handleBrowserCrash(): void {
    if (this.state.browser) {
      this.metrics.totalCrashRecoveries++;
      console.warn('[BrowserPool] Browser disconnected unexpectedly, will restart on next request');
      this.state.browser = null;
      this.state.activePages = 0;
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL);
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.state.browser) return;

    const browserAge = Date.now() - this.state.createdAt;

    // Restart browser if it's too old and no active pages
    if (browserAge > MAX_BROWSER_AGE && this.state.activePages === 0) {
      console.log('[BrowserPool] Restarting browser due to age');
      await this.closeBrowser();
      return;
    }

    // Check if browser is still connected
    if (!this.state.browser.connected) {
      console.warn('[BrowserPool] Health check failed: browser disconnected');
      this.handleBrowserCrash();
      return;
    }

    // Check if too many pages (memory leak prevention)
    if (this.state.totalPagesCreated > MAX_PAGES_PER_BROWSER * 10) {
      if (this.state.activePages === 0) {
        console.log('[BrowserPool] Restarting browser due to high page count');
        await this.closeBrowser();
        this.state.totalPagesCreated = 0;
      }
    }
  }

  async getBrowser(): Promise<Browser> {
    // Clear idle timer when browser is requested
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // If browser exists and is connected, return it
    if (this.state.browser?.connected) {
      this.state.lastUsed = Date.now();
      return this.state.browser;
    }

    // If browser is launching, wait for it
    if (this.state.isLaunching && this.state.launchPromise) {
      return this.state.launchPromise;
    }

    // Launch new browser
    this.state.isLaunching = true;
    this.state.launchPromise = this.launchBrowser();

    try {
      this.state.browser = await this.state.launchPromise;
      this.state.lastUsed = Date.now();
      this.state.createdAt = Date.now();
      this.state.activePages = 0;
      this.state.totalPagesCreated = 0;
      return this.state.browser;
    } catch (error) {
      console.error('[BrowserPool] Failed to launch browser:', error);
      throw error;
    } finally {
      this.state.isLaunching = false;
      this.state.launchPromise = null;
    }
  }

  async getPage(options: PageOptions = {}): Promise<Page> {
    const browser = await this.getBrowser();
    this.state.activePages++;
    this.state.totalPagesCreated++;

    try {
      const page = await browser.newPage();

      // Set reasonable defaults
      await page.setViewport({ width: 1200, height: 800 });

      // Set up resource blocking if enabled
      if (options.blockExternalResources) {
        await this.setupResourceBlocking(page);
      }

      return page;
    } catch (error) {
      this.state.activePages = Math.max(0, this.state.activePages - 1);
      console.error('[BrowserPool] Failed to create page:', error);
      throw error;
    }
  }

  /**
   * Set up request interception to block non-essential external resources.
   * This speeds up PDF generation by avoiding unnecessary network requests.
   */
  private async setupResourceBlocking(page: Page): Promise<void> {
    await page.setRequestInterception(true);

    page.on('request', (request: HTTPRequest) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Allow local and data URLs
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        request.continue();
        return;
      }

      // Check if it's a blocked resource type from external URL
      if (
        BLOCKED_RESOURCE_TYPES.includes(resourceType as (typeof BLOCKED_RESOURCE_TYPES)[number])
      ) {
        // Allow resources from known CDNs
        const isAllowedDomain = ALLOWED_DOMAINS.some((domain) => url.includes(domain));
        if (!isAllowedDomain && url.startsWith('http')) {
          request.abort();
          return;
        }
      }

      request.continue();
    });
  }

  /**
   * Acquire a slot for concurrent PDF generation.
   * Used to limit the number of simultaneous conversions.
   */
  async acquireConcurrencySlot(): Promise<void> {
    if (this.activeConcurrent < MAX_CONCURRENT_CONVERSIONS) {
      this.activeConcurrent++;
      return;
    }

    // Wait for a slot to become available
    return new Promise<void>((resolve) => {
      this.concurrencyQueue.push(() => {
        this.activeConcurrent++;
        resolve();
      });
    });
  }

  /**
   * Release a concurrency slot after PDF generation completes.
   */
  releaseConcurrencySlot(): void {
    this.activeConcurrent = Math.max(0, this.activeConcurrent - 1);

    // Process next in queue if any
    const next = this.concurrencyQueue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Get the current concurrency state.
   */
  getConcurrencyState(): { active: number; queued: number; max: number } {
    return {
      active: this.activeConcurrent,
      queued: this.concurrencyQueue.length,
      max: MAX_CONCURRENT_CONVERSIONS,
    };
  }

  async releasePage(page: Page): Promise<void> {
    try {
      if (!page.isClosed()) {
        await page.close();
      }
    } catch {
      // Page may already be closed
    }

    this.state.activePages = Math.max(0, this.state.activePages - 1);
    this.state.lastUsed = Date.now();

    // Start idle timer if no active pages
    if (this.state.activePages === 0) {
      this.startIdleTimer();
    }
  }

  private startIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(async () => {
      if (this.state.activePages === 0 && this.state.browser) {
        await this.closeBrowser();
      }
    }, BROWSER_IDLE_TIMEOUT);
  }

  private async closeBrowser(): Promise<void> {
    if (this.state.browser) {
      try {
        await this.state.browser.close();
      } catch {
        // Browser may already be closed
      }
      this.state.browser = null;
      this.state.activePages = 0;
    }
  }

  async shutdown(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    await this.closeBrowser();
  }

  async cleanup(): Promise<void> {
    await this.shutdown();
  }

  getStats(): { activePages: number; lastUsed: number; isConnected: boolean } {
    return {
      activePages: this.state.activePages,
      lastUsed: this.state.lastUsed,
      isConnected: this.state.browser?.connected ?? false,
    };
  }

  getMetrics(): BrowserPoolMetrics {
    return {
      totalBrowsersLaunched: this.metrics.totalBrowsersLaunched,
      totalPagesCreated: this.state.totalPagesCreated,
      totalCrashRecoveries: this.metrics.totalCrashRecoveries,
      currentActivePages: this.state.activePages,
      isConnected: this.state.browser?.connected ?? false,
      browserAge: this.state.browser ? Date.now() - this.state.createdAt : 0,
    };
  }

  async isHealthy(): Promise<boolean> {
    if (!this.state.browser) return true; // No browser is fine
    return this.state.browser.connected;
  }
}

// Singleton instance
export const browserPool = new BrowserPool();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  const cleanup = () => {
    browserPool.shutdown().catch(console.error);
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
