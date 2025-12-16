import { describe, it, expect } from 'vitest';
import {
  convertRequestSchema,
  previewRequestSchema,
  batchRequestSchema,
  validateRequest,
} from '@/lib/validations/api-schemas';

describe('API Validation Schemas', () => {
  describe('convertRequestSchema', () => {
    it('should accept valid request with required fields only', () => {
      const data = { markdown: '# Hello World' };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.theme).toBe('github');
        expect(result.data.codeTheme).toBe('github-light');
      }
    });

    it('should accept valid request with all fields', () => {
      const data = {
        markdown: '# Hello World',
        theme: 'academic',
        codeTheme: 'monokai',
        customCss: '.custom { color: red; }',
        pageSettings: {
          pageSize: 'letter',
          orientation: 'landscape',
        },
      };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty markdown', () => {
      const data = { markdown: '' };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing markdown', () => {
      const data = { theme: 'github' };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid theme', () => {
      const data = { markdown: 'test', theme: 'invalid-theme' };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid code theme', () => {
      const data = { markdown: 'test', codeTheme: 'invalid-code-theme' };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject markdown exceeding max length', () => {
      const data = { markdown: 'a'.repeat(1000001) };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid page settings', () => {
      const data = {
        markdown: 'test',
        pageSettings: {
          pageSize: 'a4',
          orientation: 'portrait',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          watermark: { show: true, text: 'CONFIDENTIAL', opacity: 0.1 },
        },
      };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid margin values', () => {
      const data = {
        markdown: 'test',
        pageSettings: {
          margins: { top: -10, bottom: 20, left: 20, right: 20 },
        },
      };
      const result = convertRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('previewRequestSchema', () => {
    it('should accept valid request', () => {
      const data = { markdown: '# Preview' };
      const result = previewRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid request with theme', () => {
      const data = { markdown: '# Preview', theme: 'dark' };
      const result = previewRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty markdown', () => {
      const data = { markdown: '' };
      const result = previewRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid theme', () => {
      const data = { markdown: 'test', theme: 'invalid' };
      const result = previewRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('batchRequestSchema', () => {
    it('should accept valid batch request', () => {
      const data = {
        files: [
          { id: '1', filename: 'doc1.md', markdown: '# Doc 1' },
          { id: '2', filename: 'doc2.md', markdown: '# Doc 2' },
        ],
      };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty files array', () => {
      const data = { files: [] };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject more than 20 files', () => {
      const files = Array.from({ length: 21 }, (_, i) => ({
        id: `${i}`,
        filename: `doc${i}.md`,
        markdown: `# Doc ${i}`,
      }));
      const data = { files };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject file with empty id', () => {
      const data = {
        files: [{ id: '', filename: 'doc.md', markdown: '# Doc' }],
      };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject file with empty filename', () => {
      const data = {
        files: [{ id: '1', filename: '', markdown: '# Doc' }],
      };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject file with invalid filename characters', () => {
      const data = {
        files: [{ id: '1', filename: 'doc<>.md', markdown: '# Doc' }],
      };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject file with empty markdown', () => {
      const data = {
        files: [{ id: '1', filename: 'doc.md', markdown: '' }],
      };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid theme and code theme', () => {
      const data = {
        files: [{ id: '1', filename: 'doc.md', markdown: '# Doc' }],
        theme: 'professional',
        codeTheme: 'dracula',
      };
      const result = batchRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validateRequest helper', () => {
    it('should return success with valid data', () => {
      const data = { markdown: '# Test' };
      const result = validateRequest(convertRequestSchema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.markdown).toBe('# Test');
      }
    });

    it('should return error with invalid data', () => {
      const data = { markdown: '' };
      const result = validateRequest(convertRequestSchema, data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('should format error messages with paths', () => {
      const data = {
        files: [{ id: '', filename: 'doc.md', markdown: '# Doc' }],
      };
      const result = validateRequest(batchRequestSchema, data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('files');
      }
    });
  });
});
