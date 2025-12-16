import { ConversionOptions, ConversionResult, PageSettings, DocumentTheme, CodeTheme } from '@/types';
import { parseMarkdownFull } from '../markdown/parser';
import { getThemeCss, getCodeThemeStylesheet } from '../themes/manager';
import {
  defaultPageSettings,
  generatePuppeteerPageSettings,
  generateWatermarkCss,
} from './page-settings';
import { browserPool } from './browser-pool';

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

  if (!markdown || markdown.trim() === '') {
    return {
      success: false,
      error: 'Content is empty',
    };
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
  try {
    // Get page from browser pool (reuses browser instance)
    page = await browserPool.getPage();

    // Generate HTML document
    const htmlContent = generateHtmlDocument(
      markdown,
      theme,
      codeTheme,
      customCss,
      pageSettings
    );

    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
    });

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
    await page.waitForFunction(
      () => !document.querySelector('.mermaid:not([data-processed])'),
      { timeout: 5000 }
    ).catch(() => {
      // Ignore timeout, mermaid may not be present
    });

    // Generate PDF
    const puppeteerSettings = generatePuppeteerPageSettings(pageSettings);

    const pdfBuffer = await page.pdf({
      ...puppeteerSettings,
      printBackground: true,
      preferCSSPageSize: false,
    });

    // Estimate pages (rough calculation)
    const estimatedPages = Math.ceil(pdfBuffer.length / 50000) || 1;

    return {
      success: true,
      data: Buffer.from(pdfBuffer),
      fileSize: pdfBuffer.length,
      pages: estimatedPages,
    };
  } catch (error) {
    console.error('PDF generation error:', error);
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
export async function generateHtmlPreview(markdown: string, theme: string = 'github'): Promise<string> {
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
 * Optimized for batch processing with shared browser resources.
 * @param files - Array of files to convert, each with id, filename, and markdown
 * @param options - Shared conversion options (theme, codeTheme, pageSettings)
 * @returns Array of conversion results with base64-encoded PDF data
 */
export async function generatePdfBatch(
  files: BatchConversionItem[],
  options: Omit<ConversionOptions, 'markdown'>
): Promise<BatchConversionResult[]> {
  const { theme = 'github', codeTheme = 'github-light', pageSettings: partialSettings, customCss } = options;

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

  // Process files in parallel using the browser pool
  // The pool handles page management efficiently
  const results = await Promise.all(
    files.map(async (file): Promise<BatchConversionResult> => {
      if (!file.markdown || file.markdown.trim() === '') {
        return {
          id: file.id,
          filename: file.filename,
          success: false,
          error: 'Content is empty',
        };
      }

      let page = null;
      try {
        page = await browserPool.getPage();

        const htmlContent = generateHtmlDocument(
          file.markdown,
          theme,
          codeTheme,
          customCss,
          pageSettings
        );

        await page.setContent(htmlContent, {
          waitUntil: ['networkidle0', 'domcontentloaded'],
        });

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
        await page.waitForFunction(
          () => !document.querySelector('.mermaid:not([data-processed])'),
          { timeout: 5000 }
        ).catch(() => {
          // Ignore timeout, mermaid may not be present
        });

        const pdfBuffer = await page.pdf({
          ...puppeteerSettings,
          printBackground: true,
          preferCSSPageSize: false,
        });

        return {
          id: file.id,
          filename: file.filename.replace(/\.(md|markdown|txt)$/i, '.pdf'),
          success: true,
          data: Buffer.from(pdfBuffer).toString('base64'),
          fileSize: pdfBuffer.length,
        };
      } catch (error) {
        console.error(`PDF generation error for ${file.filename}:`, error);
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
      }
    })
  );

  return results;
}
