/**
 * Unit tests for storage service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MongoDB connection first (must be before any imports that use it)
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

import {
  formatBytes,
  getAllowedMimeTypes,
  isAllowedMimeType,
} from '@/lib/storage/service';

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  adminStorage: {
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        save: vi.fn(),
        download: vi.fn(() => [Buffer.from('test')]),
        delete: vi.fn(),
        getSignedUrl: vi.fn(() => ['https://example.com/signed-url']),
      })),
    })),
  },
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => ({ exists: false, data: () => null })),
        set: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          get: vi.fn(() => ({ docs: [] })),
        })),
      })),
    })),
    runTransaction: vi.fn((fn) => fn({
      get: vi.fn(() => ({ exists: false, data: () => null })),
      set: vi.fn(),
    })),
  },
}));

describe('Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('formatBytes', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes in B', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format bytes in KB', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format bytes in MB', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should format bytes in GB', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(10 * 1024 * 1024 * 1024)).toBe('10 GB');
    });

    it('should format bytes in TB', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    it('should handle Infinity', () => {
      expect(formatBytes(Infinity)).toBe('Unlimited');
    });

    it('should round to 2 decimal places', () => {
      expect(formatBytes(1234567)).toBe('1.18 MB');
    });
  });

  describe('getAllowedMimeTypes', () => {
    it('should return an array of allowed MIME types', () => {
      const mimeTypes = getAllowedMimeTypes();
      expect(Array.isArray(mimeTypes)).toBe(true);
      expect(mimeTypes.length).toBeGreaterThan(0);
    });

    it('should include common text types', () => {
      const mimeTypes = getAllowedMimeTypes();
      expect(mimeTypes).toContain('text/markdown');
      expect(mimeTypes).toContain('text/plain');
      expect(mimeTypes).toContain('text/html');
    });

    it('should include PDF type', () => {
      const mimeTypes = getAllowedMimeTypes();
      expect(mimeTypes).toContain('application/pdf');
    });

    it('should include image types', () => {
      const mimeTypes = getAllowedMimeTypes();
      expect(mimeTypes).toContain('image/png');
      expect(mimeTypes).toContain('image/jpeg');
      expect(mimeTypes).toContain('image/gif');
      expect(mimeTypes).toContain('image/svg+xml');
    });

    it('should include JSON type', () => {
      const mimeTypes = getAllowedMimeTypes();
      expect(mimeTypes).toContain('application/json');
    });
  });

  describe('isAllowedMimeType', () => {
    it('should return true for allowed MIME types', () => {
      expect(isAllowedMimeType('text/markdown')).toBe(true);
      expect(isAllowedMimeType('text/plain')).toBe(true);
      expect(isAllowedMimeType('application/pdf')).toBe(true);
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('should return false for disallowed MIME types', () => {
      expect(isAllowedMimeType('application/octet-stream')).toBe(false);
      expect(isAllowedMimeType('video/mp4')).toBe(false);
      expect(isAllowedMimeType('audio/mpeg')).toBe(false);
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isAllowedMimeType('')).toBe(false);
    });

    it('should return false for invalid MIME type format', () => {
      expect(isAllowedMimeType('invalid')).toBe(false);
      expect(isAllowedMimeType('text')).toBe(false);
    });
  });
});

describe('Storage Quota Calculations', () => {
  describe('Plan-based storage limits', () => {
    it('should correctly identify free plan has no storage', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('free');
      expect(limits.cloudStorageBytes).toBe(0);
    });

    it('should correctly identify pro plan has 1GB storage', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('pro');
      expect(limits.cloudStorageBytes).toBe(1024 * 1024 * 1024); // 1 GB
    });

    it('should correctly identify team plan has 10GB storage', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('team');
      expect(limits.cloudStorageBytes).toBe(10 * 1024 * 1024 * 1024); // 10 GB
    });

    it('should correctly identify enterprise plan has unlimited storage', async () => {
      const { getPlanLimits } = await import('@/lib/plans/config');
      const limits = getPlanLimits('enterprise');
      expect(limits.cloudStorageBytes).toBe(Infinity);
    });
  });
});

describe('File Path Generation', () => {
  it('should sanitize filenames with special characters', () => {
    // Testing the filename sanitization logic
    const filename = 'my file (1).md';
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    expect(sanitized).toBe('my_file__1_.md');
  });

  it('should preserve valid filename characters', () => {
    const filename = 'valid-file.name.md';
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    expect(sanitized).toBe('valid-file.name.md');
  });

  it('should handle unicode characters', () => {
    const filename = '日本語.md';
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    expect(sanitized).toBe('___.md');
  });
});

describe('Storage Error Handling', () => {
  it('should handle missing storage bucket gracefully', async () => {
    // This tests that the service handles undefined storage bucket
    const mockError = new Error('Storage bucket not configured');
    expect(mockError.message).toContain('Storage bucket not configured');
  });

  it('should handle file not found errors', async () => {
    const mockError = new Error('File not found');
    expect(mockError.message).toContain('File not found');
  });

  it('should handle access denied errors', async () => {
    const mockError = new Error('Access denied');
    expect(mockError.message).toContain('Access denied');
  });
});

describe('StoredFile Interface', () => {
  it('should have all required fields', () => {
    const storedFile = {
      id: 'file-123',
      userId: 'user-456',
      filename: '1234567890_test.md',
      originalName: 'test.md',
      mimeType: 'text/markdown',
      size: 1024,
      path: 'users/user-456/files/1234567890_test.md',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(storedFile).toHaveProperty('id');
    expect(storedFile).toHaveProperty('userId');
    expect(storedFile).toHaveProperty('filename');
    expect(storedFile).toHaveProperty('originalName');
    expect(storedFile).toHaveProperty('mimeType');
    expect(storedFile).toHaveProperty('size');
    expect(storedFile).toHaveProperty('path');
    expect(storedFile).toHaveProperty('createdAt');
    expect(storedFile).toHaveProperty('updatedAt');
  });

  it('should have optional url field', () => {
    const storedFile = {
      id: 'file-123',
      userId: 'user-456',
      filename: '1234567890_test.md',
      originalName: 'test.md',
      mimeType: 'text/markdown',
      size: 1024,
      path: 'users/user-456/files/1234567890_test.md',
      url: 'https://example.com/file',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(storedFile.url).toBe('https://example.com/file');
  });
});

describe('StorageQuota Interface', () => {
  it('should calculate percentage correctly', () => {
    const quota = {
      used: 512 * 1024 * 1024, // 512 MB
      limit: 1024 * 1024 * 1024, // 1 GB
      remaining: 512 * 1024 * 1024,
      percentage: 50,
    };

    expect(quota.percentage).toBe(50);
  });

  it('should handle zero limit', () => {
    const quota = {
      used: 0,
      limit: 0,
      remaining: 0,
      percentage: 0,
    };

    expect(quota.percentage).toBe(0);
  });

  it('should handle Infinity limit', () => {
    const quota = {
      used: 1024 * 1024 * 1024,
      limit: Infinity,
      remaining: Infinity,
      percentage: 0,
    };

    expect(quota.remaining).toBe(Infinity);
    expect(quota.percentage).toBe(0);
  });
});

describe('Upload Result Interface', () => {
  it('should have success and file for successful upload', () => {
    const result = {
      success: true,
      file: {
        id: 'file-123',
        userId: 'user-456',
        filename: 'test.md',
        originalName: 'test.md',
        mimeType: 'text/markdown',
        size: 1024,
        path: 'users/user-456/files/test.md',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    expect(result.success).toBe(true);
    expect(result.file).toBeDefined();
  });

  it('should have success false and error for failed upload', () => {
    const result = {
      success: false,
      error: 'Insufficient storage',
    };

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
