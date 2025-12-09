import { describe, it, expect } from 'vitest';
import {
  cn,
  calculateEditorStats,
  formatFileSize,
  generateId,
  slugify,
  estimatePages,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle tailwind conflicts', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6');
    });
  });

  describe('calculateEditorStats', () => {
    it('should calculate stats for normal text', () => {
      const text = 'Hello world, this is a test.';
      const stats = calculateEditorStats(text);
      expect(stats.words).toBe(6);
      expect(stats.characters).toBe(28);
      expect(stats.lines).toBe(1);
      expect(stats.readingTime).toBe(1);
    });

    it('should handle empty text', () => {
      const stats = calculateEditorStats('');
      expect(stats.words).toBe(0);
      expect(stats.characters).toBe(0);
      expect(stats.lines).toBe(0);
      expect(stats.readingTime).toBe(0);
    });

    it('should handle multiline text', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const stats = calculateEditorStats(text);
      expect(stats.lines).toBe(3);
    });

    it('should calculate reading time for longer text', () => {
      const words = Array(400).fill('word').join(' ');
      const stats = calculateEditorStats(words);
      expect(stats.readingTime).toBe(2);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should format with decimals', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });

    it('should trim leading/trailing dashes', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world');
    });
  });

  describe('estimatePages', () => {
    it('should estimate 1 page for short content', () => {
      expect(estimatePages('Hello World')).toBe(1);
    });

    it('should estimate multiple pages for long content', () => {
      const longText = Array(1000).fill('word').join(' ');
      expect(estimatePages(longText)).toBeGreaterThan(1);
    });

    it('should return at least 1 page', () => {
      expect(estimatePages('')).toBe(1);
    });
  });
});
