# Milestone 4.3: PDF Generation Optimization

## Status: ⬜ Not Started
## Priority: LOW
## Estimated Scope: Medium

---

## Objective

Optimize PDF generation for faster conversion and reduced resource usage.

---

## Current Implementation

- **File:** `src/lib/pdf/generator.ts`
- **Technology:** Puppeteer with headless Chrome
- **Process:** Launch browser → Create page → Set HTML → Generate PDF

---

## Optimization Areas

### 1. Browser Pool

**Current issue:** New browser instance per request
**Solution:** Browser pool for reuse

```typescript
// src/lib/pdf/browser-pool.ts
import puppeteer, { Browser } from 'puppeteer';

class BrowserPool {
  private browsers: Browser[] = [];
  private maxBrowsers = 5;
  private inUse = new Set<Browser>();

  async acquire(): Promise<Browser> {
    // Return available browser
    for (const browser of this.browsers) {
      if (!this.inUse.has(browser) && browser.isConnected()) {
        this.inUse.add(browser);
        return browser;
      }
    }

    // Create new if under limit
    if (this.browsers.length < this.maxBrowsers) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      this.browsers.push(browser);
      this.inUse.add(browser);
      return browser;
    }

    // Wait for available browser
    return new Promise((resolve) => {
      const check = setInterval(() => {
        for (const browser of this.browsers) {
          if (!this.inUse.has(browser) && browser.isConnected()) {
            clearInterval(check);
            this.inUse.add(browser);
            resolve(browser);
          }
        }
      }, 100);
    });
  }

  release(browser: Browser) {
    this.inUse.delete(browser);
  }

  async cleanup() {
    for (const browser of this.browsers) {
      await browser.close();
    }
    this.browsers = [];
    this.inUse.clear();
  }
}

export const browserPool = new BrowserPool();
```

### 2. Page Reuse

```typescript
// Reuse pages within a browser
async function getPage(browser: Browser): Promise<Page> {
  const pages = await browser.pages();

  // Reuse existing blank page
  for (const page of pages) {
    if (page.url() === 'about:blank') {
      return page;
    }
  }

  // Create new page
  return browser.newPage();
}
```

### 3. Resource Blocking

Block unnecessary resources:

```typescript
await page.setRequestInterception(true);
page.on('request', (request) => {
  const resourceType = request.resourceType();

  // Block unnecessary resources
  if (['image', 'media', 'font'].includes(resourceType)) {
    // Only block external resources, keep inline/local
    if (request.url().startsWith('http')) {
      request.abort();
      return;
    }
  }

  request.continue();
});
```

### 4. Caching

Cache static resources:

```typescript
// Cache KaTeX CSS, fonts
const resourceCache = new Map<string, string>();

async function getCachedResource(url: string): Promise<string> {
  if (resourceCache.has(url)) {
    return resourceCache.get(url)!;
  }

  const response = await fetch(url);
  const content = await response.text();
  resourceCache.set(url, content);
  return content;
}
```

### 5. Parallel Processing

For batch conversions:

```typescript
async function batchConvert(files: File[], options: ConversionOptions) {
  const concurrency = 3; // Limit parallel conversions

  const results = [];
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(file => convertToPdf(file, options))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### 6. Memory Management

```typescript
// Force garbage collection between conversions
if (global.gc) {
  global.gc();
}

// Limit page content size
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
if (htmlContent.length > MAX_CONTENT_SIZE) {
  throw new Error('Content too large for PDF generation');
}

// Close pages promptly
try {
  const pdf = await page.pdf(options);
  return pdf;
} finally {
  await page.close();
}
```

### 7. Timeout Optimization

```typescript
// Tiered timeouts based on content size
function getTimeout(contentSize: number): number {
  if (contentSize < 100000) return 10000; // 10s for small
  if (contentSize < 500000) return 30000; // 30s for medium
  return 60000; // 60s for large
}

await page.setContent(html, {
  waitUntil: 'networkidle0',
  timeout: getTimeout(html.length),
});
```

---

## Monitoring

Add performance metrics:

```typescript
interface ConversionMetrics {
  startTime: number;
  browserAcquireTime: number;
  pageCreateTime: number;
  contentSetTime: number;
  pdfGenerateTime: number;
  totalTime: number;
  contentSize: number;
  pdfSize: number;
}

async function generatePdfWithMetrics(html: string, options: PdfOptions) {
  const metrics: Partial<ConversionMetrics> = {
    startTime: Date.now(),
    contentSize: html.length,
  };

  const browser = await browserPool.acquire();
  metrics.browserAcquireTime = Date.now() - metrics.startTime;

  // ... rest of conversion with timing

  console.log('[PDF] Conversion metrics:', metrics);
  return { pdf, metrics };
}
```

---

## Files to Create/Modify

### Create:
1. `src/lib/pdf/browser-pool.ts`

### Modify:
1. `src/lib/pdf/generator.ts`
2. `src/app/api/convert/route.ts`
3. `src/app/api/convert/batch/route.ts`

---

## Testing

1. Benchmark single conversion time
2. Benchmark batch conversion throughput
3. Memory usage under load
4. Browser pool stability
5. Error handling and recovery

---

## Acceptance Criteria

- [ ] Browser pool implemented
- [ ] Page reuse working
- [ ] Resource blocking for external resources
- [ ] Batch processing optimized
- [ ] Memory leaks fixed
- [ ] Conversion time reduced by 30%+
- [ ] No degradation in PDF quality

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 4.3 status to ✅
2. Update progress bar
3. Add to completion log
