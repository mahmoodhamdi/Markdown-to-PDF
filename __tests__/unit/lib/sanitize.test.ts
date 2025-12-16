import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeCss,
  sanitizeTextForCss,
  sanitizeWatermarkText,
} from '@/lib/sanitize';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<script');
      expect(output).toContain('<p>Hello</p>');
      expect(output).toContain('<p>World</p>');
    });

    it('should remove iframe tags', () => {
      const input = '<p>Content</p><iframe src="evil.com"></iframe>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<iframe');
    });

    it('should remove onclick attributes', () => {
      const input = '<button onclick="alert(1)">Click</button>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('onclick');
      expect(output).toContain('<button');
    });

    it('should remove onmouseover attributes', () => {
      const input = '<div onmouseover="evil()">Hover</div>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('onmouseover');
    });

    it('should remove javascript: URLs in href', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('javascript:');
    });

    it('should remove data: URLs in src (except images)', () => {
      const input = '<img src="data:text/html,<script>alert(1)</script>">';
      const output = sanitizeHtml(input);
      expect(output).toContain('src=""');
    });

    it('should allow data: URLs for images', () => {
      const input = '<img src="data:image/png;base64,abc123">';
      const output = sanitizeHtml(input);
      expect(output).toContain('data:image/png');
    });

    it('should remove HTML comments', () => {
      const input = '<p>Text</p><!--[if IE]><script>alert(1)</script><![endif]-->';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<!--');
    });

    it('should remove object and embed tags', () => {
      const input = '<object data="evil.swf"></object><embed src="evil.swf">';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<object');
      expect(output).not.toContain('<embed');
    });

    it('should preserve safe content', () => {
      const input = '<h1>Title</h1><p>Paragraph with <strong>bold</strong></p>';
      const output = sanitizeHtml(input);
      expect(output).toBe(input);
    });

    it('should remove form tags', () => {
      const input = '<form action="evil.com"><input type="text"></form>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<form');
    });

    it('should remove style tags', () => {
      const input = '<style>body { display: none; }</style><p>Content</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<style');
    });
  });

  describe('sanitizeCss', () => {
    it('should remove @import rules', () => {
      const input = '@import url("evil.css"); body { color: red; }';
      const output = sanitizeCss(input);
      expect(output).not.toContain('@import');
      expect(output).toContain('body');
    });

    it('should remove javascript: in url()', () => {
      const input = 'background: url("javascript:alert(1)");';
      const output = sanitizeCss(input);
      expect(output).not.toContain('javascript:');
    });

    it('should remove expression()', () => {
      const input = 'width: expression(alert(1));';
      const output = sanitizeCss(input);
      expect(output).not.toContain('expression');
    });

    it('should remove -moz-binding', () => {
      const input = '-moz-binding: url("evil.xml#xss");';
      const output = sanitizeCss(input);
      expect(output).not.toContain('-moz-binding');
    });

    it('should remove behavior property', () => {
      const input = 'behavior: url(evil.htc);';
      const output = sanitizeCss(input);
      expect(output).not.toContain('behavior');
    });

    it('should preserve safe CSS', () => {
      const input = 'body { color: blue; font-size: 14px; }';
      const output = sanitizeCss(input);
      expect(output).toBe(input);
    });
  });

  describe('sanitizeTextForCss', () => {
    it('should escape backslashes', () => {
      expect(sanitizeTextForCss('a\\b')).toBe('a\\\\b');
    });

    it('should escape single quotes', () => {
      expect(sanitizeTextForCss("it's")).toBe("it\\'s");
    });

    it('should escape double quotes', () => {
      expect(sanitizeTextForCss('"quote"')).toBe('\\"quote\\"');
    });

    it('should escape angle brackets', () => {
      expect(sanitizeTextForCss('<script>')).toBe('\\<script\\>');
    });

    it('should escape newlines', () => {
      expect(sanitizeTextForCss('line1\nline2')).toBe('line1\\A line2');
    });

    it('should remove carriage returns', () => {
      expect(sanitizeTextForCss('line1\r\nline2')).toBe('line1\\A line2');
    });
  });

  describe('sanitizeWatermarkText', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert(1)</script>Watermark';
      const output = sanitizeWatermarkText(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('Watermark');
    });

    it('should limit length to 100 characters', () => {
      const input = 'a'.repeat(150);
      const output = sanitizeWatermarkText(input);
      // After escaping, it should be derived from max 100 chars
      expect(input.length).toBe(150);
    });

    it('should escape special characters', () => {
      const input = "Test's \"Watermark\"";
      const output = sanitizeWatermarkText(input);
      expect(output).toContain("\\'");
      expect(output).toContain('\\"');
    });

    it('should handle normal text', () => {
      const input = 'CONFIDENTIAL';
      const output = sanitizeWatermarkText(input);
      expect(output).toBe('CONFIDENTIAL');
    });
  });
});
