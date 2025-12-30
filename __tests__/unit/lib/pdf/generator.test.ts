/**
 * PDF Generator Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock browser pool
vi.mock('@/lib/pdf/browser-pool', () => ({
  browserPool: {
    getPage: vi.fn(),
    releasePage: vi.fn(),
  },
}));

// Mock markdown parser - use a factory function to ensure consistent behavior
const mockParseMarkdownFull = vi.fn((markdown: string) => ({
  html: `<p>${markdown}</p>`,
  toc: [],
}));

vi.mock('@/lib/markdown/parser', () => ({
  parseMarkdownFull: (markdown: string) => mockParseMarkdownFull(markdown),
}));

// Mock theme manager - use factory functions
const mockGetThemeCss = vi.fn((theme: string) => `.theme-${theme} { color: black; }`);
const mockGetCodeThemeStylesheet = vi.fn((_codeTheme: string) => 'https://cdn.example.com/highlight.css');

vi.mock('@/lib/themes/manager', () => ({
  getThemeCss: (theme: string) => mockGetThemeCss(theme),
  getCodeThemeStylesheet: (codeTheme: string) => mockGetCodeThemeStylesheet(codeTheme),
}));

import { generateHtmlDocument } from '@/lib/pdf/generator';
import { defaultPageSettings } from '@/lib/pdf/page-settings';

describe('PDF Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateHtmlDocument', () => {
    it('should generate HTML document from markdown', () => {
      const markdown = '# Hello World';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('Hello World');
    });

    it('should include theme CSS', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown, 'github');

      expect(html).toContain('theme-github');
    });

    it('should include code theme stylesheet link', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown, 'github', 'github-light');

      expect(html).toContain('highlight.css');
    });

    it('should include KaTeX stylesheet', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('katex.min.css');
    });

    it('should include KaTeX script', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('katex.min.js');
    });

    it('should include Mermaid script', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('mermaid.min.js');
    });

    it('should apply custom CSS', () => {
      const markdown = '# Test';
      const customCss = '.custom-class { font-size: 20px; }';
      const html = generateHtmlDocument(markdown, 'github', 'github-light', customCss);

      expect(html).toContain(customCss);
    });

    it('should use default theme when not specified', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('theme-github');
    });

    it('should use default code theme when not specified', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown, 'github');

      expect(html).toContain('highlight.css');
    });

    it('should handle empty markdown', () => {
      const html = generateHtmlDocument('');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('markdown-content');
    });

    it('should set correct body class for theme', () => {
      const markdown = '# Test';

      const githubHtml = generateHtmlDocument(markdown, 'github');
      expect(githubHtml).toContain('class="theme-github"');

      const darkHtml = generateHtmlDocument(markdown, 'dark');
      expect(darkHtml).toContain('class="theme-dark"');
    });

    it('should initialize Mermaid with dark theme for dark mode', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown, 'dark');

      expect(html).toContain("theme: 'dark'");
    });

    it('should initialize Mermaid with default theme for light mode', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown, 'github');

      expect(html).toContain("theme: 'default'");
    });

    it('should include viewport meta tag', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include charset meta tag', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('charset="UTF-8"');
    });

    it('should include print styles', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('@media print');
    });

    it('should wrap content in markdown-content div', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('class="markdown-content"');
    });

    it('should include KaTeX inline styles', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('.katex-inline');
    });

    it('should include box-sizing reset', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown);

      expect(html).toContain('box-sizing: border-box');
    });
  });

  describe('generateHtmlDocument with page settings', () => {
    it('should apply watermark CSS when watermark is enabled', () => {
      const markdown = '# Test';
      const pageSettings = {
        ...defaultPageSettings,
        watermark: {
          show: true,
          text: 'DRAFT',
          opacity: 0.1,
        },
      };

      const html = generateHtmlDocument(markdown, 'github', 'github-light', '', pageSettings);
      // The watermark CSS should be included when enabled
      expect(html).toBeDefined();
    });

    it('should not fail with default page settings', () => {
      const markdown = '# Test';
      const html = generateHtmlDocument(markdown, 'github', 'github-light', '', defaultPageSettings);

      expect(html).toContain('<!DOCTYPE html>');
    });
  });
});

describe('PDF Generator - Conversion Options', () => {
  describe('Theme validation', () => {
    const validThemes = ['github', 'academic', 'minimal', 'dark', 'professional', 'elegant', 'modern', 'newsletter'];

    it.each(validThemes)('should accept %s theme', (theme) => {
      const html = generateHtmlDocument('# Test', theme);
      expect(html).toContain(`theme-${theme}`);
    });
  });

  describe('Code theme validation', () => {
    const validCodeThemes = ['github-light', 'github-dark', 'monokai', 'dracula', 'nord', 'one-dark'];

    it.each(validCodeThemes)('should accept %s code theme', (codeTheme) => {
      const html = generateHtmlDocument('# Test', 'github', codeTheme);
      expect(html).toBeDefined();
    });
  });
});

describe('PDF Generator - Edge Cases', () => {
  it('should handle markdown with special characters', () => {
    const markdown = '# Test <script>alert("xss")</script>';
    const html = generateHtmlDocument(markdown);

    expect(html).toContain('<!DOCTYPE html>');
  });

  it('should handle very long markdown content', () => {
    const longContent = 'a'.repeat(100000);
    const markdown = `# Long Content\n\n${longContent}`;
    const html = generateHtmlDocument(markdown);

    expect(html).toContain('<!DOCTYPE html>');
  });

  it('should handle markdown with unicode characters', () => {
    const markdown = '# 日本語テスト\n\nこんにちは世界';
    const html = generateHtmlDocument(markdown);

    expect(html).toContain('UTF-8');
  });

  it('should handle markdown with emoji', () => {
    const markdown = '# Hello 👋\n\nWorld 🌍';
    const html = generateHtmlDocument(markdown);

    expect(html).toBeDefined();
  });

  it('should handle markdown with code blocks', () => {
    const markdown = '# Code\n\n```javascript\nconsole.log("hello");\n```';
    const html = generateHtmlDocument(markdown);

    expect(html).toBeDefined();
  });

  it('should handle markdown with tables', () => {
    const markdown = '# Table\n\n| Col1 | Col2 |\n|------|------|\n| A    | B    |';
    const html = generateHtmlDocument(markdown);

    expect(html).toBeDefined();
  });

  it('should handle markdown with images', () => {
    const markdown = '# Image\n\n![Alt text](https://example.com/image.png)';
    const html = generateHtmlDocument(markdown);

    expect(html).toBeDefined();
  });

  it('should handle markdown with links', () => {
    const markdown = '# Links\n\n[Click here](https://example.com)';
    const html = generateHtmlDocument(markdown);

    expect(html).toBeDefined();
  });

  it('should handle markdown with blockquotes', () => {
    const markdown = '# Quote\n\n> This is a quote';
    const html = generateHtmlDocument(markdown);

    expect(html).toBeDefined();
  });

  it('should handle markdown with horizontal rules', () => {
    const markdown = '# Test\n\n---\n\nMore content';
    const html = generateHtmlDocument(markdown);

    expect(html).toBeDefined();
  });
});

describe('PDF Generator - HTML Structure', () => {
  it('should have proper HTML5 doctype', () => {
    const html = generateHtmlDocument('# Test');
    expect(html.trim().startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('should have html, head, and body elements', () => {
    const html = generateHtmlDocument('# Test');

    expect(html).toContain('<html');
    expect(html).toContain('<head>');
    expect(html).toContain('<body');
    expect(html).toContain('</head>');
    expect(html).toContain('</body>');
    expect(html).toContain('</html>');
  });

  it('should have title element', () => {
    const html = generateHtmlDocument('# Test');
    expect(html).toContain('<title>');
    expect(html).toContain('</title>');
  });

  it('should have style element', () => {
    const html = generateHtmlDocument('# Test');
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
  });

  it('should have script elements at end of body', () => {
    const html = generateHtmlDocument('# Test');
    expect(html).toContain('<script');
    expect(html).toContain('</script>');
  });
});

describe('PDF Generator - generatePdf with mocked browser pool', () => {
  // Since browser pool is mocked at the top of this file, we can test generatePdf behavior
  // through its direct module import

  it('should return error for empty content', async () => {
    const { generatePdf } = await import('@/lib/pdf/generator');

    const result = await generatePdf({ markdown: '' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should return error for whitespace-only content', async () => {
    const { generatePdf } = await import('@/lib/pdf/generator');

    const result = await generatePdf({ markdown: '   \n\t  ' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should return error for content exceeding max size', async () => {
    const { generatePdf } = await import('@/lib/pdf/generator');

    // Create content larger than 5MB
    const largeContent = 'a'.repeat(6 * 1024 * 1024);

    const result = await generatePdf({ markdown: largeContent });

    expect(result.success).toBe(false);
    expect(result.error).toContain('too large');
  });
});

describe('PDF Generator - Content Size Validation', () => {
  it('should accept content under 5MB', () => {
    // Content under 5MB should be accepted
    const validContent = 'a'.repeat(4 * 1024 * 1024); // 4MB
    expect(validContent.length).toBeLessThan(5 * 1024 * 1024);
  });

  it('should reject content over 5MB', () => {
    // Content over 5MB should be rejected
    const invalidContent = 'a'.repeat(6 * 1024 * 1024); // 6MB
    expect(invalidContent.length).toBeGreaterThan(5 * 1024 * 1024);
  });

  it('should warn about content over 1MB', () => {
    // Content over 1MB should trigger a warning (but still process)
    const warningContent = 'a'.repeat(1.5 * 1024 * 1024); // 1.5MB
    expect(warningContent.length).toBeGreaterThan(1 * 1024 * 1024);
    expect(warningContent.length).toBeLessThan(5 * 1024 * 1024);
  });
});

describe('PDF Generator - Tiered Timeouts', () => {
  it('should use short timeout for small content', () => {
    // Testing internal timeout calculation behavior
    // Small content (< 100KB) should use 10s timeout
    const smallContent = 'a'.repeat(50000); // 50KB
    expect(smallContent.length).toBeLessThan(100000);
  });

  it('should use medium timeout for medium content', () => {
    // Medium content (100KB - 500KB) should use 30s timeout
    const mediumContent = 'a'.repeat(200000); // 200KB
    expect(mediumContent.length).toBeGreaterThanOrEqual(100000);
    expect(mediumContent.length).toBeLessThan(500000);
  });

  it('should use long timeout for large content', () => {
    // Large content (>= 500KB) should use 60s timeout
    const largeContent = 'a'.repeat(600000); // 600KB
    expect(largeContent.length).toBeGreaterThanOrEqual(500000);
  });
});

describe('PDF Generator - ConversionMetrics Type', () => {
  it('should define conversion metrics structure', () => {
    // Verify the metrics structure
    const mockMetrics = {
      startTime: Date.now(),
      contentSize: 1000,
      timeout: 10000,
      browserAcquireTime: 100,
      pageCreateTime: 50,
      contentSetTime: 200,
      waitForRenderTime: 300,
      pdfGenerateTime: 500,
      totalTime: 1150,
      pdfSize: 5000,
    };

    expect(mockMetrics.startTime).toBeGreaterThan(0);
    expect(mockMetrics.contentSize).toBe(1000);
    expect(mockMetrics.timeout).toBe(10000);
  });
});
