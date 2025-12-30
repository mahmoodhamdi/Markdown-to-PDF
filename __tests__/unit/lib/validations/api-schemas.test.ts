/**
 * API Schema Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  mongoIdSchema,
  emailSchema,
  userNameSchema,
  paginationSchema,
  filenameSchema,
  safeUrlSchema,
  safeStringSchema,
  safeMetadataSchema,
  convertRequestSchema,
  previewRequestSchema,
  batchRequestSchema,
  validateRequest,
} from '@/lib/validations/api-schemas';

describe('API Schema Validation', () => {
  describe('mongoIdSchema', () => {
    it('should accept valid MongoDB ObjectIds', () => {
      expect(mongoIdSchema.safeParse('507f1f77bcf86cd799439011').success).toBe(true);
      expect(mongoIdSchema.safeParse('000000000000000000000000').success).toBe(true);
      expect(mongoIdSchema.safeParse('FFFFFFFFFFFFFFFFFFFFFFFF').success).toBe(true);
    });

    it('should reject invalid ObjectIds', () => {
      expect(mongoIdSchema.safeParse('invalid').success).toBe(false);
      expect(mongoIdSchema.safeParse('507f1f77bcf86cd79943901').success).toBe(false); // 23 chars
      expect(mongoIdSchema.safeParse('507f1f77bcf86cd7994390111').success).toBe(false); // 25 chars
      expect(mongoIdSchema.safeParse('507f1f77bcf86cd79943901g').success).toBe(false); // invalid char
      expect(mongoIdSchema.safeParse('').success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid emails and normalize them', () => {
      const result = emailSchema.safeParse('Test@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should trim whitespace', () => {
      const result = emailSchema.safeParse('  user@domain.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@domain.com');
      }
    });

    it('should reject invalid emails', () => {
      expect(emailSchema.safeParse('not-an-email').success).toBe(false);
      expect(emailSchema.safeParse('@domain.com').success).toBe(false);
      expect(emailSchema.safeParse('user@').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      expect(emailSchema.safeParse(longEmail).success).toBe(false);
    });
  });

  describe('userNameSchema', () => {
    it('should accept valid names', () => {
      const result = userNameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('John Doe');
      }
    });

    it('should trim whitespace', () => {
      const result = userNameSchema.safeParse('  Jane Smith  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Jane Smith');
      }
    });

    it('should reject empty names', () => {
      expect(userNameSchema.safeParse('').success).toBe(false);
      expect(userNameSchema.safeParse('   ').success).toBe(false);
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(101);
      expect(userNameSchema.safeParse(longName).success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should accept valid pagination params', () => {
      const result = paginationSchema.safeParse({ page: 1, limit: 20 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string values', () => {
      const result = paginationSchema.safeParse({ page: '5', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should apply defaults', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject invalid values', () => {
      expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
      expect(paginationSchema.safeParse({ page: -1 }).success).toBe(false);
      expect(paginationSchema.safeParse({ limit: 0 }).success).toBe(false);
      expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
    });
  });

  describe('filenameSchema', () => {
    it('should accept safe filenames', () => {
      const result = filenameSchema.safeParse('document.pdf');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('document.pdf');
      }
    });

    it('should sanitize path traversal', () => {
      const result = filenameSchema.safeParse('../../../etc/passwd');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toContain('..');
      }
    });

    it('should sanitize dangerous characters', () => {
      const result = filenameSchema.safeParse('file<script>.txt');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toContain('<');
        expect(result.data).not.toContain('>');
      }
    });

    it('should reject empty filenames', () => {
      expect(filenameSchema.safeParse('').success).toBe(false);
    });

    it('should reject filenames that are too long', () => {
      const longName = 'a'.repeat(300);
      expect(filenameSchema.safeParse(longName).success).toBe(false);
    });
  });

  describe('safeUrlSchema', () => {
    it('should accept http and https URLs', () => {
      expect(safeUrlSchema.safeParse('https://example.com').success).toBe(true);
      expect(safeUrlSchema.safeParse('http://example.com/path').success).toBe(true);
    });

    it('should reject javascript URLs', () => {
      expect(safeUrlSchema.safeParse('javascript:alert(1)').success).toBe(false);
    });

    it('should reject data URLs', () => {
      expect(safeUrlSchema.safeParse('data:text/html,<script>alert(1)</script>').success).toBe(false);
    });

    it('should reject file URLs', () => {
      expect(safeUrlSchema.safeParse('file:///etc/passwd').success).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(safeUrlSchema.safeParse('not a url').success).toBe(false);
      expect(safeUrlSchema.safeParse('').success).toBe(false);
    });
  });

  describe('safeStringSchema', () => {
    it('should pass through normal strings', () => {
      const result = safeStringSchema.safeParse('Hello World');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Hello World');
      }
    });

    it('should remove angle brackets', () => {
      const result = safeStringSchema.safeParse('<script>alert(1)</script>');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toContain('<');
        expect(result.data).not.toContain('>');
      }
    });

    it('should trim whitespace', () => {
      const result = safeStringSchema.safeParse('  trimmed  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('trimmed');
      }
    });
  });

  describe('safeMetadataSchema', () => {
    it('should accept valid metadata', () => {
      const result = safeMetadataSchema.safeParse({
        key: 'value',
        count: 42,
        active: true,
        empty: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined', () => {
      expect(safeMetadataSchema.safeParse(undefined).success).toBe(true);
    });

    it('should reject nested objects', () => {
      const result = safeMetadataSchema.safeParse({
        nested: { deep: 'value' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject arrays as values', () => {
      const result = safeMetadataSchema.safeParse({
        arr: [1, 2, 3],
      });
      expect(result.success).toBe(false);
    });

    it('should reject strings that are too long', () => {
      const result = safeMetadataSchema.safeParse({
        long: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should reject too many fields', () => {
      const manyFields: Record<string, string> = {};
      for (let i = 0; i < 25; i++) {
        manyFields[`field${i}`] = 'value';
      }
      expect(safeMetadataSchema.safeParse(manyFields).success).toBe(false);
    });

    it('should accept up to 20 fields', () => {
      const fields: Record<string, string> = {};
      for (let i = 0; i < 20; i++) {
        fields[`field${i}`] = 'value';
      }
      expect(safeMetadataSchema.safeParse(fields).success).toBe(true);
    });
  });

  describe('convertRequestSchema', () => {
    it('should accept valid convert request', () => {
      const result = convertRequestSchema.safeParse({
        markdown: '# Hello World',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.theme).toBe('github');
        expect(result.data.codeTheme).toBe('github-light');
      }
    });

    it('should accept all optional fields', () => {
      const result = convertRequestSchema.safeParse({
        markdown: '# Test',
        theme: 'dark',
        codeTheme: 'monokai',
        customCss: 'body { color: red; }',
        pageSettings: {
          pageSize: 'letter',
          orientation: 'landscape',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty markdown', () => {
      expect(convertRequestSchema.safeParse({ markdown: '' }).success).toBe(false);
    });

    it('should reject markdown exceeding size limit', () => {
      const largeMarkdown = 'a'.repeat(1000001);
      expect(convertRequestSchema.safeParse({ markdown: largeMarkdown }).success).toBe(false);
    });

    it('should reject invalid themes', () => {
      expect(convertRequestSchema.safeParse({
        markdown: '# Test',
        theme: 'invalid-theme',
      }).success).toBe(false);
    });

    it('should reject customCss exceeding size limit', () => {
      const largeCss = 'a'.repeat(50001);
      expect(convertRequestSchema.safeParse({
        markdown: '# Test',
        customCss: largeCss,
      }).success).toBe(false);
    });
  });

  describe('previewRequestSchema', () => {
    it('should accept valid preview request', () => {
      const result = previewRequestSchema.safeParse({
        markdown: '# Preview Test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty markdown', () => {
      expect(previewRequestSchema.safeParse({ markdown: '' }).success).toBe(false);
    });
  });

  describe('batchRequestSchema', () => {
    it('should accept valid batch request', () => {
      const result = batchRequestSchema.safeParse({
        files: [
          { id: '1', filename: 'doc1.md', markdown: '# Doc 1' },
          { id: '2', filename: 'doc2.md', markdown: '# Doc 2' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty files array', () => {
      expect(batchRequestSchema.safeParse({ files: [] }).success).toBe(false);
    });

    it('should reject more than 20 files', () => {
      const files = Array.from({ length: 21 }, (_, i) => ({
        id: String(i),
        filename: `doc${i}.md`,
        markdown: `# Doc ${i}`,
      }));
      expect(batchRequestSchema.safeParse({ files }).success).toBe(false);
    });

    it('should reject files with invalid filenames', () => {
      expect(batchRequestSchema.safeParse({
        files: [
          { id: '1', filename: 'doc<>.md', markdown: '# Doc' },
        ],
      }).success).toBe(false);
    });
  });

  describe('validateRequest helper', () => {
    it('should return success true for valid data', () => {
      const result = validateRequest(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should return success false with error message for invalid data', () => {
      const result = validateRequest(emailSchema, 'not-an-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should format multiple errors', () => {
      const result = validateRequest(convertRequestSchema, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('markdown');
      }
    });
  });
});
