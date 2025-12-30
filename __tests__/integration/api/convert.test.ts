import { describe, it, expect, vi } from 'vitest';

// Mock puppeteer for integration tests
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      connected: true,
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn().mockResolvedValue(undefined),
        setViewport: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(Buffer.from('PDF content')),
        close: vi.fn().mockResolvedValue(undefined),
        isClosed: vi.fn().mockReturnValue(false),
      }),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    }),
  },
}));

import { generatePdf, generateHtmlDocument, generateHtmlPreview } from '@/lib/pdf/generator';

describe('PDF Generator', () => {
  describe('generateHtmlDocument', () => {
    it('should generate HTML with default theme', () => {
      const html = generateHtmlDocument('# Hello World');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello World');
      expect(html).toContain('theme-github');
    });

    it('should apply specified theme', () => {
      const html = generateHtmlDocument('# Test', 'dark');
      expect(html).toContain('theme-dark');
    });

    it('should include KaTeX CSS', () => {
      const html = generateHtmlDocument('# Test');
      expect(html).toContain('katex');
    });

    it('should include Mermaid script', () => {
      const html = generateHtmlDocument('# Test');
      expect(html).toContain('mermaid');
    });
  });

  describe('generatePdf', () => {
    it('should return error for empty content', async () => {
      const result = await generatePdf({ markdown: '' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Content is empty');
    });

    it('should return error for whitespace only content', async () => {
      const result = await generatePdf({ markdown: '   ' });
      expect(result.success).toBe(false);
    });

    it('should generate PDF for valid markdown', async () => {
      const result = await generatePdf({ markdown: '# Hello World' });
      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
    });

    it('should accept theme option', async () => {
      const result = await generatePdf({
        markdown: '# Test',
        theme: 'academic',
      });
      expect(result.success).toBe(true);
    });

    it('should accept page settings', async () => {
      const result = await generatePdf({
        markdown: '# Test',
        pageSettings: {
          pageSize: 'letter',
          orientation: 'landscape',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('generateHtmlPreview', () => {
    it('should generate preview HTML', async () => {
      const html = await generateHtmlPreview('# Hello');
      expect(html).toContain('<h1');
    });

    it('should apply theme to preview', async () => {
      const html = await generateHtmlPreview('# Test', 'minimal');
      expect(html).toContain('theme-minimal');
    });
  });
});
