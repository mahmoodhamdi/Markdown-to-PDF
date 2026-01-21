import {
  ConversionOptions,
  ConversionResult,
  PageSettings,
  DocumentTheme,
  CodeTheme,
} from '@/types';
import { parseMarkdownFull } from '../markdown/parser';
import { getThemeCss, getCodeThemeStylesheet } from '../themes/manager';
import {
  defaultPageSettings,
  generatePuppeteerPageSettings,
  generateWatermarkCss,
} from './page-settings';
import { browserPool } from './browser-pool';

// Content size limits
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB max content size
const WARN_CONTENT_SIZE = 1 * 1024 * 1024; // 1MB warning threshold

// Tiered timeout configuration based on content size
const TIMEOUT_TIERS = {
  small: { maxSize: 100000, timeout: 10000 }, // < 100KB: 10s
  medium: { maxSize: 500000, timeout: 30000 }, // < 500KB: 30s
  large: { maxSize: Infinity, timeout: 60000 }, // >= 500KB: 60s
} as const;

/**
 * Conversion metrics for performance monitoring
 */
export interface ConversionMetrics {
  startTime: number;
  browserAcquireTime?: number;
  pageCreateTime?: number;
  contentSetTime?: number;
  waitForRenderTime?: number;
  pdfGenerateTime?: number;
  totalTime?: number;
  contentSize: number;
  pdfSize?: number;
  timeout: number;
}

/**
 * Calculate appropriate timeout based on content size
 */
function getTimeoutForContent(contentSize: number): number {
  if (contentSize < TIMEOUT_TIERS.small.maxSize) {
    return TIMEOUT_TIERS.small.timeout;
  }
  if (contentSize < TIMEOUT_TIERS.medium.maxSize) {
    return TIMEOUT_TIERS.medium.timeout;
  }
  return TIMEOUT_TIERS.large.timeout;
}

/**
 * Log conversion metrics in a structured format
 */
function logConversionMetrics(metrics: ConversionMetrics, filename?: string): void {
  if (process.env.NODE_ENV === 'development' || process.env.PDF_METRICS_ENABLED === 'true') {
    const file = filename ? ` [${filename}]` : '';
    console.info(`[PDF]${file} Conversion metrics:`, {
      contentSize: `${(metrics.contentSize / 1024).toFixed(1)}KB`,
      pdfSize: metrics.pdfSize ? `${(metrics.pdfSize / 1024).toFixed(1)}KB` : 'N/A',
      totalTime: metrics.totalTime ? `${metrics.totalTime}ms` : 'N/A',
      browserAcquire: metrics.browserAcquireTime ? `${metrics.browserAcquireTime}ms` : 'N/A',
      pageCreate: metrics.pageCreateTime ? `${metrics.pageCreateTime}ms` : 'N/A',
      contentSet: metrics.contentSetTime ? `${metrics.contentSetTime}ms` : 'N/A',
      waitForRender: metrics.waitForRenderTime ? `${metrics.waitForRenderTime}ms` : 'N/A',
      pdfGenerate: metrics.pdfGenerateTime ? `${metrics.pdfGenerateTime}ms` : 'N/A',
      timeout: `${metrics.timeout}ms`,
    });
  }
}

/**
 * Generates a complete HTML document from markdown content with styling.
 * @param markdown - The markdown content to convert
 * @param theme - Document theme name (default: 'github')
 * @param codeTheme - Code syntax highlighting theme (default: 'github-light')
 * @param customCss - Additional CSS to apply
 * @param pageSettings - Page layout settings
 * @returns Complete HTML document string
 */
export function generateHtmlDocument(
  markdown: string,
  theme: string = 'github',
  codeTheme: string = 'github-light',
  customCss: string = '',
  pageSettings: PageSettings = defaultPageSettings
): string {
  const { html } = parseMarkdownFull(markdown);
  const themeCss = getThemeCss(theme as DocumentTheme);
  const codeThemeUrl = getCodeThemeStylesheet(codeTheme as CodeTheme);
  const watermarkCss = generateWatermarkCss(pageSettings.watermark);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Document</title>
  <link rel="stylesheet" href="${codeThemeUrl}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 20px;
    }

    ${themeCss}

    ${watermarkCss}

    ${customCss}

    /* KaTeX inline */
    .katex-inline .katex {
      display: inline;
    }

    /* Print styles */
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body class="theme-${theme}">
  <div class="markdown-content">
    ${html}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    // Initialize KaTeX
    document.querySelectorAll('[data-math]').forEach(function(el) {
      const math = decodeURIComponent(el.getAttribute('data-math'));
      const displayMode = el.classList.contains('katex-display');
      katex.render(math, el, { displayMode: displayMode, throwOnError: false });
    });

    // Initialize Mermaid
    mermaid.initialize({ startOnLoad: true, theme: '${theme === 'dark' ? 'dark' : 'default'}' });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generates a PDF from markdown content using Puppeteer.
 * Uses browser pooling for efficient resource management.
 * @param options - Conversion options including markdown, theme, and page settings
 * @returns Conversion result with PDF buffer or error message
 */
export async function generatePdf(options: ConversionOptions): Promise<ConversionResult> {
  const {
    markdown,
    theme = 'github',
    codeTheme = 'github-light',
    pageSettings: partialSettings,
    customCss,
  } = options;

  // Initialize metrics
  const contentSize = new TextEncoder().encode(markdown || '').length;
  const timeout = getTimeoutForContent(contentSize);
  const metrics: ConversionMetrics = {
    startTime: Date.now(),
    contentSize,
    timeout,
  };

  if (!markdown || markdown.trim() === '') {
    return {
      success: false,
      error: 'Content is empty',
    };
  }

  // Content size validation
  if (contentSize > MAX_CONTENT_SIZE) {
    return {
      success: false,
      error: `Content too large for PDF generation. Maximum size is ${MAX_CONTENT_SIZE / 1024 / 1024}MB, got ${(contentSize / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Warn about large content
  if (contentSize > WARN_CONTENT_SIZE) {
    console.warn(
      `[PDF] Large content detected: ${(contentSize / 1024 / 1024).toFixed(2)}MB. Conversion may be slow.`
    );
  }

  const pageSettings: PageSettings = {
    ...defaultPageSettings,
    ...partialSettings,
    margins: {
      ...defaultPageSettings.margins,
      ...partialSettings?.margins,
    },
    headerFooter: {
      ...defaultPageSettings.headerFooter,
      ...partialSettings?.headerFooter,
    },
    pageNumbers: {
      ...defaultPageSettings.pageNumbers,
      ...partialSettings?.pageNumbers,
    },
    watermark: {
      ...defaultPageSettings.watermark,
      ...partialSettings?.watermark,
    },
  };

  let page = null;
  const browserAcquireStart = Date.now();

  try {
    // Get page from browser pool (reuses browser instance)
    page = await browserPool.getPage({ blockExternalResources: true });
    metrics.browserAcquireTime = Date.now() - browserAcquireStart;
    metrics.pageCreateTime = Date.now() - browserAcquireStart;

    // Generate HTML document
    const htmlContent = generateHtmlDocument(markdown, theme, codeTheme, customCss, pageSettings);

    const contentSetStart = Date.now();
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout,
    });
    metrics.contentSetTime = Date.now() - contentSetStart;

    const renderStart = Date.now();
    // Wait for fonts and scripts to load
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => resolve());
        } else {
          setTimeout(resolve, 1000);
        }
      });
    });

    // Wait for mermaid to render
    await page
      .waitForFunction(() => !document.querySelector('.mermaid:not([data-processed])'), {
        timeout: Math.min(5000, timeout / 2),
      })
      .catch(() => {
        // Ignore timeout, mermaid may not be present
      });
    metrics.waitForRenderTime = Date.now() - renderStart;

    // Generate PDF
    const pdfStart = Date.now();
    const puppeteerSettings = generatePuppeteerPageSettings(pageSettings);

    const pdfBuffer = await page.pdf({
      ...puppeteerSettings,
      printBackground: true,
      preferCSSPageSize: false,
      timeout,
    });
    metrics.pdfGenerateTime = Date.now() - pdfStart;
    metrics.pdfSize = pdfBuffer.length;
    metrics.totalTime = Date.now() - metrics.startTime;

    // Log metrics
    logConversionMetrics(metrics);

    // Estimate pages (rough calculation)
    const estimatedPages = Math.ceil(pdfBuffer.length / 50000) || 1;

    return {
      success: true,
      data: Buffer.from(pdfBuffer),
      fileSize: pdfBuffer.length,
      pages: estimatedPages,
    };
  } catch (error) {
    metrics.totalTime = Date.now() - metrics.startTime;
    console.error('PDF generation error:', error);
    logConversionMetrics(metrics);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  } finally {
    // Release page back to pool
    if (page) {
      await browserPool.releasePage(page);
    }
  }
}

/**
 * Generates an HTML preview from markdown content.
 * @param markdown - The markdown content to preview
 * @param theme - Document theme name (default: 'github')
 * @returns HTML document string for preview
 */
export async function generateHtmlPreview(
  markdown: string,
  theme: string = 'github'
): Promise<string> {
  return generateHtmlDocument(markdown, theme);
}

interface BatchConversionItem {
  id: string;
  filename: string;
  markdown: string;
}

interface BatchConversionResult {
  id: string;
  filename: string;
  success: boolean;
  data?: string;
  fileSize?: number;
  error?: string;
}

/**
 * Generates PDFs for multiple files in parallel using browser pooling.
 * Optimized for batch processing with shared browser resources and concurrency control.
 * @param files - Array of files to convert, each with id, filename, and markdown
 * @param options - Shared conversion options (theme, codeTheme, pageSettings)
 * @returns Array of conversion results with base64-encoded PDF data
 */
export async function generatePdfBatch(
  files: BatchConversionItem[],
  options: Omit<ConversionOptions, 'markdown'>
): Promise<BatchConversionResult[]> {
  const {
    theme = 'github',
    codeTheme = 'github-light',
    pageSettings: partialSettings,
    customCss,
  } = options;

  const batchStartTime = Date.now();

  const pageSettings: PageSettings = {
    ...defaultPageSettings,
    ...partialSettings,
    margins: {
      ...defaultPageSettings.margins,
      ...partialSettings?.margins,
    },
    headerFooter: {
      ...defaultPageSettings.headerFooter,
      ...partialSettings?.headerFooter,
    },
    pageNumbers: {
      ...defaultPageSettings.pageNumbers,
      ...partialSettings?.pageNumbers,
    },
    watermark: {
      ...defaultPageSettings.watermark,
      ...partialSettings?.watermark,
    },
  };

  const puppeteerSettings = generatePuppeteerPageSettings(pageSettings);

  // Process files with concurrency control using the browser pool
  const results = await Promise.all(
    files.map(async (file): Promise<BatchConversionResult> => {
      // Calculate content size and timeout
      const contentSize = new TextEncoder().encode(file.markdown || '').length;
      const timeout = getTimeoutForContent(contentSize);

      if (!file.markdown || file.markdown.trim() === '') {
        return {
          id: file.id,
          filename: file.filename,
          success: false,
          error: 'Content is empty',
        };
      }

      // Content size validation
      if (contentSize > MAX_CONTENT_SIZE) {
        return {
          id: file.id,
          filename: file.filename,
          success: false,
          error: `Content too large. Maximum size is ${MAX_CONTENT_SIZE / 1024 / 1024}MB`,
        };
      }

      // Acquire concurrency slot
      await browserPool.acquireConcurrencySlot();

      const metrics: ConversionMetrics = {
        startTime: Date.now(),
        contentSize,
        timeout,
      };

      let page = null;
      try {
        page = await browserPool.getPage({ blockExternalResources: true });
        metrics.browserAcquireTime = Date.now() - metrics.startTime;

        const htmlContent = generateHtmlDocument(
          file.markdown,
          theme,
          codeTheme,
          customCss,
          pageSettings
        );

        const contentSetStart = Date.now();
        await page.setContent(htmlContent, {
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout,
        });
        metrics.contentSetTime = Date.now() - contentSetStart;

        const renderStart = Date.now();
        // Wait for fonts and scripts to load
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(() => resolve());
            } else {
              setTimeout(resolve, 1000);
            }
          });
        });

        // Wait for mermaid to render
        await page
          .waitForFunction(() => !document.querySelector('.mermaid:not([data-processed])'), {
            timeout: Math.min(5000, timeout / 2),
          })
          .catch(() => {
            // Ignore timeout, mermaid may not be present
          });
        metrics.waitForRenderTime = Date.now() - renderStart;

        const pdfStart = Date.now();
        const pdfBuffer = await page.pdf({
          ...puppeteerSettings,
          printBackground: true,
          preferCSSPageSize: false,
          timeout,
        });
        metrics.pdfGenerateTime = Date.now() - pdfStart;
        metrics.pdfSize = pdfBuffer.length;
        metrics.totalTime = Date.now() - metrics.startTime;

        // Log metrics for each file
        logConversionMetrics(metrics, file.filename);

        return {
          id: file.id,
          filename: file.filename.replace(/\.(md|markdown|txt)$/i, '.pdf'),
          success: true,
          data: Buffer.from(pdfBuffer).toString('base64'),
          fileSize: pdfBuffer.length,
        };
      } catch (error) {
        metrics.totalTime = Date.now() - metrics.startTime;
        console.error(`PDF generation error for ${file.filename}:`, error);
        logConversionMetrics(metrics, file.filename);
        return {
          id: file.id,
          filename: file.filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      } finally {
        if (page) {
          await browserPool.releasePage(page);
        }
        // Release concurrency slot
        browserPool.releaseConcurrencySlot();
      }
    })
  );

  // Log batch summary
  if (process.env.NODE_ENV === 'development' || process.env.PDF_METRICS_ENABLED === 'true') {
    const successCount = results.filter((r) => r.success).length;
    const totalTime = Date.now() - batchStartTime;
    console.info(
      `[PDF] Batch conversion complete: ${successCount}/${files.length} successful in ${totalTime}ms`
    );
  }

  return results;
}
