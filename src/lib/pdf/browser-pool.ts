import type { Browser, Page } from 'puppeteer';

const BROWSER_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

const _MAX_PAGES_PER_BROWSER = 10;
const BROWSER_IDLE_TIMEOUT = 30000; // 30 seconds

interface BrowserPoolState {
  browser: Browser | null;
  activePages: number;
  lastUsed: number;
  isLaunching: boolean;
  launchPromise: Promise<Browser> | null;
}

class BrowserPool {
  private state: BrowserPoolState = {
    browser: null,
    activePages: 0,
    lastUsed: Date.now(),
    isLaunching: false,
    launchPromise: null,
  };

  private idleTimer: NodeJS.Timeout | null = null;

  private async launchBrowser(): Promise<Browser> {
    const puppeteer = await import('puppeteer');
    return puppeteer.default.launch({
      headless: true,
      args: BROWSER_LAUNCH_ARGS,
    });
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
      this.state.activePages = 0;
      return this.state.browser;
    } finally {
      this.state.isLaunching = false;
      this.state.launchPromise = null;
    }
  }

  async getPage(): Promise<Page> {
    const browser = await this.getBrowser();
    this.state.activePages++;
    const page = await browser.newPage();
    return page;
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
    await this.closeBrowser();
  }

  getStats(): { activePages: number; lastUsed: number; isConnected: boolean } {
    return {
      activePages: this.state.activePages,
      lastUsed: this.state.lastUsed,
      isConnected: this.state.browser?.connected ?? false,
    };
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
