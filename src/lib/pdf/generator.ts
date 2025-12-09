import { ConversionOptions, ConversionResult, PageSettings } from '@/types';
import { parseMarkdownFull } from '../markdown/parser';
import { getThemeCss, getCodeThemeStylesheet } from '../themes/manager';
import {
  defaultPageSettings,
  generatePuppeteerPageSettings,
  generateWatermarkCss,
} from './page-settings';

export function generateHtmlDocument(
  markdown: string,
  theme: string = 'github',
  codeTheme: string = 'github-light',
  customCss: string = '',
  pageSettings: PageSettings = defaultPageSettings
): string {
  const { html } = parseMarkdownFull(markdown);
  const themeCss = getThemeCss(theme as import('@/types').DocumentTheme);
  const codeThemeUrl = getCodeThemeStylesheet(codeTheme as import('@/types').CodeTheme);
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

  try {
    // Dynamic import for puppeteer (server-side only)
    const puppeteer = await import('puppeteer');

    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

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

    await browser.close();

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
  }
}

export async function generateHtmlPreview(markdown: string, theme: string = 'github'): Promise<string> {
  return generateHtmlDocument(markdown, theme);
}
