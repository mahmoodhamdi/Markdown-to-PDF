import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeCss,
  sanitizeTextForCss,
  sanitizeWatermarkText,
  sanitizeFilename,
  sanitizePathComponent,
  validateFilePath,
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
      const sanitized = sanitizeWatermarkText(input);
      // After escaping, it should be derived from max 100 chars
      expect(input.length).toBe(150);
      expect(sanitized.length).toBeLessThanOrEqual(100);
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

  describe('sanitizeFilename', () => {
    it('should handle normal filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('my-file_v2.txt')).toBe('my-file_v2.txt');
    });

    it('should remove path traversal sequences', () => {
      // Leading slashes are converted to underscores, path traversal is removed
      expect(sanitizeFilename('../../../etc/passwd')).toBe('_etc_passwd');
      expect(sanitizeFilename('file..name.txt')).toBe('filename.txt');
    });

    it('should remove directory separators', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeFilename('file<script>.txt')).toBe('file_script_.txt');
      expect(sanitizeFilename('file|name.txt')).toBe('file_name.txt');
      expect(sanitizeFilename('file"name.txt')).toBe('file_name.txt');
      expect(sanitizeFilename('file?name*.txt')).toBe('file_name_.txt');
    });

    it('should remove null bytes and control characters', () => {
      expect(sanitizeFilename('file\x00name.txt')).toBe('filename.txt');
      expect(sanitizeFilename('file\x1fname.txt')).toBe('filename.txt');
    });

    it('should remove leading dots', () => {
      expect(sanitizeFilename('...hidden.txt')).toBe('hidden.txt');
      expect(sanitizeFilename('.gitignore')).toBe('gitignore');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeFilename('')).toBe('unnamed');
      expect(sanitizeFilename('   ')).toBe('unnamed');
      expect(sanitizeFilename(null as unknown as string)).toBe('unnamed');
      expect(sanitizeFilename(undefined as unknown as string)).toBe('unnamed');
    });

    it('should collapse multiple underscores', () => {
      expect(sanitizeFilename('file___name.txt')).toBe('file_name.txt');
    });

    it('should handle Windows reserved names', () => {
      expect(sanitizeFilename('CON.txt')).toBe('_CON.txt');
      expect(sanitizeFilename('PRN')).toBe('_PRN');
      expect(sanitizeFilename('aux.pdf')).toBe('_aux.pdf');
      expect(sanitizeFilename('COM1.doc')).toBe('_COM1.doc');
    });

    it('should truncate long filenames while preserving extension', () => {
      const longName = 'a'.repeat(250) + '.pdf';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(200);
      expect(result).toMatch(/\.pdf$/);
    });

    it('should handle shell injection attempts', () => {
      expect(sanitizeFilename('file$(whoami).txt')).toBe('file_whoami_.txt');
      expect(sanitizeFilename('file`id`.txt')).toBe('file_id_.txt');
      expect(sanitizeFilename('file;rm -rf.txt')).toBe('file_rm -rf.txt');
    });
  });

  describe('sanitizePathComponent', () => {
    it('should only allow safe characters', () => {
      expect(sanitizePathComponent('safe-file_name.txt')).toBe('safe-file_name.txt');
      expect(sanitizePathComponent('file with spaces')).toBe('file_with_spaces');
    });

    it('should remove leading dots', () => {
      expect(sanitizePathComponent('.hidden')).toBe('hidden');
      expect(sanitizePathComponent('..parent')).toBe('parent');
    });

    it('should collapse consecutive special chars', () => {
      expect(sanitizePathComponent('file...name')).toBe('file.name');
      expect(sanitizePathComponent('file___name')).toBe('file_name');
    });

    it('should handle empty input', () => {
      expect(sanitizePathComponent('')).toBe('unnamed');
      expect(sanitizePathComponent(null as unknown as string)).toBe('unnamed');
    });
  });

  describe('validateFilePath', () => {
    it('should accept valid paths', () => {
      expect(validateFilePath('/home/user/file.txt')).toBe('/home/user/file.txt');
      expect(validateFilePath('folder/subfolder/file.pdf')).toBe('folder/subfolder/file.pdf');
    });

    it('should normalize Windows paths', () => {
      expect(validateFilePath('C:\\Users\\test\\file.txt')).toBe('C:/Users/test/file.txt');
    });

    it('should reject path traversal', () => {
      expect(validateFilePath('../../../etc/passwd')).toBeNull();
      expect(validateFilePath('/home/../../../etc/passwd')).toBeNull();
    });

    it('should reject null bytes', () => {
      expect(validateFilePath('/home/user/file\x00.txt')).toBeNull();
    });

    it('should reject double slashes', () => {
      expect(validateFilePath('/home//user/file.txt')).toBeNull();
    });

    it('should reject URL encoded characters', () => {
      expect(validateFilePath('/home/user/%2e%2e/file.txt')).toBeNull();
    });

    it('should enforce base path when provided', () => {
      expect(validateFilePath('/uploads/user/file.txt', '/uploads')).toBe('/uploads/user/file.txt');
      expect(validateFilePath('/etc/passwd', '/uploads')).toBeNull();
      expect(validateFilePath('/uploads', '/uploads')).toBe('/uploads');
    });

    it('should handle empty or invalid input', () => {
      expect(validateFilePath('')).toBeNull();
      expect(validateFilePath(null as unknown as string)).toBeNull();
    });
  });
});
