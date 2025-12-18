/**
 * Unit tests for CSS sanitization
 */

import { describe, it, expect } from 'vitest';
import { sanitizeCss } from '@/lib/sanitize';

describe('sanitizeCss', () => {
  describe('removes dangerous CSS', () => {
    it('should remove @import rules', () => {
      const input = '@import url("http://evil.com/styles.css"); body { color: red; }';
      const result = sanitizeCss(input);

      expect(result).not.toContain('@import');
      expect(result).toContain('body { color: red; }');
    });

    it('should remove multiple @import rules', () => {
      const input = `
        @import "external.css";
        @import url('another.css');
        h1 { font-size: 24px; }
      `;
      const result = sanitizeCss(input);

      expect(result).not.toContain('@import');
      expect(result).toContain('h1 { font-size: 24px; }');
    });

    it('should remove javascript: URLs in url()', () => {
      const input = 'background: url(javascript:alert(1));';
      const result = sanitizeCss(input);

      expect(result).not.toContain('javascript');
      expect(result).toContain('url()');
    });

    it('should remove data: URLs in url() (except images)', () => {
      const input = 'content: url(data:text/html,<script>alert(1)</script>);';
      const result = sanitizeCss(input);

      expect(result).not.toContain('data:text/html');
    });

    it('should preserve data:image URLs', () => {
      const input = 'background: url(data:image/png;base64,ABC123);';
      const result = sanitizeCss(input);

      expect(result).toContain('data:image/png');
    });

    it('should remove expression() (IE XSS vector)', () => {
      const input = 'width: expression(document.cookie);';
      const result = sanitizeCss(input);

      expect(result).not.toContain('expression');
    });

    it('should remove -moz-binding (Firefox XSS vector)', () => {
      const input = '-moz-binding: url("http://evil.com/xss.xml#xss");';
      const result = sanitizeCss(input);

      expect(result).not.toContain('-moz-binding');
    });

    it('should remove behavior (IE XSS vector)', () => {
      const input = 'behavior: url("http://evil.com/xss.htc");';
      const result = sanitizeCss(input);

      expect(result).not.toContain('behavior');
    });

    it('should remove @charset', () => {
      const input = '@charset "UTF-8"; body { color: black; }';
      const result = sanitizeCss(input);

      expect(result).not.toContain('@charset');
      expect(result).toContain('body { color: black; }');
    });
  });

  describe('preserves valid CSS', () => {
    it('should preserve basic CSS rules', () => {
      const input = 'body { font-family: Arial; color: #333; }';
      const result = sanitizeCss(input);

      expect(result).toBe(input);
    });

    it('should preserve complex selectors', () => {
      const input = '.class > p:first-child { margin-top: 0; }';
      const result = sanitizeCss(input);

      expect(result).toBe(input);
    });

    it('should preserve @media queries', () => {
      const input = '@media print { body { background: white; } }';
      const result = sanitizeCss(input);

      expect(result).toBe(input);
    });

    it('should preserve @keyframes', () => {
      const input = '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }';
      const result = sanitizeCss(input);

      expect(result).toBe(input);
    });

    it('should preserve @font-face', () => {
      const input = '@font-face { font-family: "CustomFont"; src: local("Arial"); }';
      const result = sanitizeCss(input);

      expect(result).toBe(input);
    });

    it('should preserve CSS variables', () => {
      const input = ':root { --main-color: blue; } body { color: var(--main-color); }';
      const result = sanitizeCss(input);

      expect(result).toBe(input);
    });

    it('should preserve valid HTTP URLs', () => {
      const input = 'background: url("https://example.com/image.png");';
      const result = sanitizeCss(input);

      expect(result).toContain('https://example.com/image.png');
    });

    it('should preserve relative URLs', () => {
      const input = 'background: url("../images/bg.png");';
      const result = sanitizeCss(input);

      expect(result).toContain('../images/bg.png');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(sanitizeCss('')).toBe('');
    });

    it('should handle whitespace only', () => {
      expect(sanitizeCss('   ')).toBe('   ');
    });

    it('should handle multiple dangerous patterns', () => {
      const input = `
        @import "evil.css";
        @charset "UTF-8";
        body {
          -moz-binding: url("xss.xml");
          behavior: url("xss.htc");
          width: expression(alert(1));
          background: url(javascript:void(0));
        }
      `;
      const result = sanitizeCss(input);

      expect(result).not.toContain('@import');
      expect(result).not.toContain('@charset');
      expect(result).not.toContain('-moz-binding');
      expect(result).not.toContain('behavior');
      expect(result).not.toContain('expression');
      expect(result).not.toContain('javascript');
    });

    it('should be case insensitive for dangerous patterns', () => {
      const input = '@IMPORT "evil.css"; EXPRESSION(alert(1));';
      const result = sanitizeCss(input);

      expect(result).not.toContain('@IMPORT');
      expect(result).not.toContain('EXPRESSION');
    });
  });
});
