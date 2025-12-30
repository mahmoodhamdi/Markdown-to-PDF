/**
 * Storage Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MongoDB connection
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock UserFile and StorageQuota models
const mockUserFileFindByIdResult = vi.fn();
const mockUserFileFindResult = vi.fn();
const mockUserFileCreate = vi.fn();
const mockUserFileFindByIdAndDelete = vi.fn();

const mockStorageQuotaFindOneResult = vi.fn();
const mockStorageQuotaFindOneAndUpdate = vi.fn();
const mockStorageQuotaUpdateOne = vi.fn();

// Helper to create chainable mock with .lean()
const createLeanableQuery = (resultFn: ReturnType<typeof vi.fn>) => ({
  lean: () => resultFn(),
});

// Helper to create chainable mock with .sort().lean()
const createSortableLeanableQuery = (resultFn: ReturnType<typeof vi.fn>) => ({
  sort: () => ({
    lean: () => resultFn(),
  }),
});

vi.mock('@/lib/db/models/UserFile', () => ({
  UserFile: {
    findById: () => createLeanableQuery(mockUserFileFindByIdResult),
    find: () => createSortableLeanableQuery(mockUserFileFindResult),
    create: (...args: unknown[]) => mockUserFileCreate(...args),
    findByIdAndDelete: (...args: unknown[]) => mockUserFileFindByIdAndDelete(...args),
  },
  StorageQuota: {
    findOne: () => createLeanableQuery(mockStorageQuotaFindOneResult),
    findOneAndUpdate: (...args: unknown[]) => mockStorageQuotaFindOneAndUpdate(...args),
    updateOne: (...args: unknown[]) => mockStorageQuotaUpdateOne(...args),
  },
}));

// Mock Cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
    url: vi.fn().mockReturnValue('https://cloudinary.com/signed-url'),
  },
}));

// Mock plan limits
vi.mock('@/lib/plans/config', () => ({
  getPlanLimits: vi.fn((plan: string) => {
    const limits: Record<string, { cloudStorageBytes: number; maxFileSize: number }> = {
      free: { cloudStorageBytes: 0, maxFileSize: 5 * 1024 * 1024 },
      pro: { cloudStorageBytes: 1024 * 1024 * 1024, maxFileSize: 25 * 1024 * 1024 },
      team: { cloudStorageBytes: 5 * 1024 * 1024 * 1024, maxFileSize: 50 * 1024 * 1024 },
      enterprise: { cloudStorageBytes: Infinity, maxFileSize: 100 * 1024 * 1024 },
    };
    return limits[plan] || limits.free;
  }),
}));

import {
  getStorageQuota,
  listFiles,
  getFile,
  getDownloadUrl,
  deleteFile,
  formatBytes,
  getAllowedMimeTypes,
  isAllowedMimeType,
} from '@/lib/storage/service';

describe('Storage Service - Utility Functions', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle Infinity', () => {
      expect(formatBytes(Infinity)).toBe('Unlimited');
    });
  });

  describe('getAllowedMimeTypes', () => {
    it('should return array of allowed MIME types', () => {
      const types = getAllowedMimeTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should include markdown type', () => {
      const types = getAllowedMimeTypes();
      expect(types).toContain('text/markdown');
    });

    it('should include plain text type', () => {
      const types = getAllowedMimeTypes();
      expect(types).toContain('text/plain');
    });

    it('should include image types', () => {
      const types = getAllowedMimeTypes();
      expect(types).toContain('image/png');
      expect(types).toContain('image/jpeg');
    });

    it('should include PDF type', () => {
      const types = getAllowedMimeTypes();
      expect(types).toContain('application/pdf');
    });
  });

  describe('isAllowedMimeType', () => {
    it('should return true for allowed types', () => {
      expect(isAllowedMimeType('text/markdown')).toBe(true);
      expect(isAllowedMimeType('text/plain')).toBe(true);
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('should return false for disallowed types', () => {
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
      expect(isAllowedMimeType('video/mp4')).toBe(false);
      expect(isAllowedMimeType('audio/mpeg')).toBe(false);
    });
  });
});

describe('Storage Service - Quota Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getStorageQuota', () => {
    it('should return quota for user with existing usage', async () => {
      mockStorageQuotaFindOneResult.mockResolvedValue({ userId: 'user-123', used: 500 * 1024 * 1024 });

      const quota = await getStorageQuota('user-123', 'pro');

      expect(quota).toBeDefined();
      expect(quota.used).toBe(500 * 1024 * 1024);
      expect(quota.limit).toBe(1024 * 1024 * 1024);
      expect(quota.remaining).toBe(524 * 1024 * 1024);
      expect(quota.percentage).toBeLessThan(100);
    });

    it('should return zero usage for new user', async () => {
      mockStorageQuotaFindOneResult.mockResolvedValue(null);

      const quota = await getStorageQuota('new-user', 'pro');

      expect(quota.used).toBe(0);
      expect(quota.remaining).toBe(1024 * 1024 * 1024);
      expect(quota.percentage).toBe(0);
    });

    it('should return zero limit for free plan', async () => {
      mockStorageQuotaFindOneResult.mockResolvedValue(null);

      const quota = await getStorageQuota('free-user', 'free');

      expect(quota.limit).toBe(0);
    });

    it('should return Infinity for enterprise plan', async () => {
      mockStorageQuotaFindOneResult.mockResolvedValue({ used: 10 * 1024 * 1024 * 1024 });

      const quota = await getStorageQuota('enterprise-user', 'enterprise');

      expect(quota.limit).toBe(Infinity);
      expect(quota.remaining).toBe(Infinity);
      expect(quota.percentage).toBe(0);
    });
  });
});

describe('Storage Service - File Operations', () => {
  const createMockFileDoc = (overrides = {}) => ({
    _id: { toString: () => 'file-123' },
    userId: 'user-123',
    filename: 'document.md',
    originalName: 'My Document.md',
    mimeType: 'text/markdown',
    size: 1024,
    path: 'md2pdf/users/user-123/document.md',
    url: 'https://cloudinary.com/file-url',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listFiles', () => {
    it('should return list of files for user', async () => {
      const mockFiles = [
        createMockFileDoc({ _id: { toString: () => 'file-1' }, filename: 'file1.md' }),
        createMockFileDoc({ _id: { toString: () => 'file-2' }, filename: 'file2.md' }),
      ];
      mockUserFileFindResult.mockResolvedValue(mockFiles);
      mockStorageQuotaFindOneResult.mockResolvedValue({ used: 2048 });

      const result = await listFiles('user-123', 'pro');

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.quota).toBeDefined();
    });

    it('should return empty array for user with no files', async () => {
      mockUserFileFindResult.mockResolvedValue([]);
      mockStorageQuotaFindOneResult.mockResolvedValue(null);

      const result = await listFiles('empty-user', 'pro');

      expect(result.success).toBe(true);
      expect(result.files).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockUserFileFindResult.mockRejectedValue(new Error('Database error'));

      const result = await listFiles('user-123', 'pro');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getFile', () => {
    it('should return file for valid ID and owner', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(createMockFileDoc());

      const result = await getFile('user-123', 'file-123');

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.filename).toBe('document.md');
    });

    it('should return error for non-existent file', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(null);

      const result = await getFile('user-123', 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should deny access to files owned by other users', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(createMockFileDoc({ userId: 'other-user' }));

      const result = await getFile('user-123', 'file-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('should handle database errors', async () => {
      mockUserFileFindByIdResult.mockRejectedValue(new Error('Database connection failed'));

      const result = await getFile('user-123', 'file-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('getDownloadUrl', () => {
    it('should return URL for existing file', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(createMockFileDoc());

      const result = await getDownloadUrl('user-123', 'file-123');

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('should return error for non-existent file', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(null);

      const result = await getDownloadUrl('user-123', 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should generate signed URL if no stored URL', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(createMockFileDoc({ url: undefined }));

      const result = await getDownloadUrl('user-123', 'file-123');

      expect(result.success).toBe(true);
      expect(result.url).toContain('cloudinary.com');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(createMockFileDoc());
      mockUserFileFindByIdAndDelete.mockResolvedValue({});
      mockStorageQuotaFindOneAndUpdate.mockResolvedValue({});
      mockStorageQuotaUpdateOne.mockResolvedValue({});

      const result = await deleteFile('user-123', 'file-123');

      expect(result.success).toBe(true);
      expect(mockUserFileFindByIdAndDelete).toHaveBeenCalledWith('file-123');
    });

    it('should return error for non-existent file', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(null);

      const result = await deleteFile('user-123', 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should deny deletion of files owned by others', async () => {
      mockUserFileFindByIdResult.mockResolvedValue(createMockFileDoc({ userId: 'other-user' }));

      const result = await deleteFile('user-123', 'file-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('should handle Cloudinary deletion failure gracefully', async () => {
      const cloudinary = await import('cloudinary');
      vi.mocked(cloudinary.v2.uploader.destroy).mockRejectedValueOnce(new Error('Cloudinary error'));
      mockUserFileFindByIdResult.mockResolvedValue(createMockFileDoc());
      mockUserFileFindByIdAndDelete.mockResolvedValue({});
      mockStorageQuotaFindOneAndUpdate.mockResolvedValue({});
      mockStorageQuotaUpdateOne.mockResolvedValue({});

      // Should still succeed even if Cloudinary fails
      const result = await deleteFile('user-123', 'file-123');

      expect(result.success).toBe(true);
    });
  });
});

describe('Storage Service - Plan Restrictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Quota enforcement', () => {
    it('should calculate remaining quota correctly', async () => {
      mockStorageQuotaFindOneResult.mockResolvedValue({ used: 500 * 1024 * 1024 });

      const quota = await getStorageQuota('user-123', 'pro');

      // Pro plan has 1GB, used 500MB, so 524MB remaining (not exact due to binary)
      expect(quota.remaining).toBeLessThan(quota.limit);
      expect(quota.remaining).toBeGreaterThan(0);
    });

    it('should show 100% when quota is exceeded', async () => {
      // Used more than limit
      mockStorageQuotaFindOneResult.mockResolvedValue({ used: 2 * 1024 * 1024 * 1024 });

      const quota = await getStorageQuota('user-123', 'pro');

      expect(quota.percentage).toBe(100);
      expect(quota.remaining).toBe(0);
    });
  });
});

describe('Storage Service - MIME Type Validation', () => {
  describe('Document types', () => {
    it('should allow markdown files', () => {
      expect(isAllowedMimeType('text/markdown')).toBe(true);
    });

    it('should allow plain text files', () => {
      expect(isAllowedMimeType('text/plain')).toBe(true);
    });

    it('should allow HTML files', () => {
      expect(isAllowedMimeType('text/html')).toBe(true);
    });

    it('should allow PDF files', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('should allow JSON files', () => {
      expect(isAllowedMimeType('application/json')).toBe(true);
    });
  });

  describe('Image types', () => {
    it('should allow PNG images', () => {
      expect(isAllowedMimeType('image/png')).toBe(true);
    });

    it('should allow JPEG images', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
    });

    it('should allow GIF images', () => {
      expect(isAllowedMimeType('image/gif')).toBe(true);
    });

    it('should allow SVG images', () => {
      expect(isAllowedMimeType('image/svg+xml')).toBe(true);
    });
  });

  describe('Disallowed types', () => {
    it('should reject executable files', () => {
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
      expect(isAllowedMimeType('application/x-msdownload')).toBe(false);
    });

    it('should reject video files', () => {
      expect(isAllowedMimeType('video/mp4')).toBe(false);
      expect(isAllowedMimeType('video/webm')).toBe(false);
    });

    it('should reject audio files', () => {
      expect(isAllowedMimeType('audio/mpeg')).toBe(false);
      expect(isAllowedMimeType('audio/wav')).toBe(false);
    });

    it('should reject archive files', () => {
      expect(isAllowedMimeType('application/zip')).toBe(false);
      expect(isAllowedMimeType('application/x-tar')).toBe(false);
    });
  });
});
