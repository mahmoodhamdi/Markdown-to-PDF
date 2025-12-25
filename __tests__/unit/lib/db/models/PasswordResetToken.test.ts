/**
 * PasswordResetToken Model Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock mongoose
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockUpdateMany = vi.fn();
const mockCreate = vi.fn();
const mockCountDocuments = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock('mongoose', () => {
  const MockSchema = class {
    constructor() {}
    index() {
      return this;
    }
    static Types = { Mixed: 'Mixed', ObjectId: 'ObjectId' };
  };

  return {
    default: {
      Schema: MockSchema,
      model: vi.fn().mockReturnValue({
        findOne: mockFindOne,
        updateOne: mockUpdateOne,
        updateMany: mockUpdateMany,
        create: mockCreate,
        countDocuments: mockCountDocuments,
        deleteMany: mockDeleteMany,
      }),
      models: {},
    },
    Schema: MockSchema,
    Model: class {},
  };
});

describe('PasswordResetToken Functions', () => {
  let generateResetToken: typeof import('@/lib/db/models/PasswordResetToken').generateResetToken;
  let hashToken: typeof import('@/lib/db/models/PasswordResetToken').hashToken;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('@/lib/db/models/PasswordResetToken');
    generateResetToken = module.generateResetToken;
    hashToken = module.hashToken;
  });

  describe('generateResetToken', () => {
    it('should generate a 64 character hex string', () => {
      const token = generateResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should hash token using SHA-256', () => {
      const token = 'test-token-123';
      const hashed = hashToken(token);

      // Verify it's a valid SHA-256 hash (64 hex characters)
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBe(64);
      expect(hashed).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce consistent hashes', () => {
      const token = 'consistent-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');

      expect(hash1).not.toBe(hash2);
    });

    it('should match manual SHA-256 calculation', () => {
      const token = 'verify-hash';
      const expectedHash = crypto.createHash('sha256').update(token).digest('hex');

      expect(hashToken(token)).toBe(expectedHash);
    });
  });
});

describe('PasswordResetToken Model Operations', () => {
  let createPasswordResetToken: typeof import('@/lib/db/models/PasswordResetToken').createPasswordResetToken;
  let verifyPasswordResetToken: typeof import('@/lib/db/models/PasswordResetToken').verifyPasswordResetToken;
  let markTokenAsUsed: typeof import('@/lib/db/models/PasswordResetToken').markTokenAsUsed;
  let cleanupExpiredTokens: typeof import('@/lib/db/models/PasswordResetToken').cleanupExpiredTokens;
  let countRecentResetRequests: typeof import('@/lib/db/models/PasswordResetToken').countRecentResetRequests;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default mock behaviors
    mockCreate.mockImplementation((data) =>
      Promise.resolve({
        ...data,
        _id: 'mock-id',
        toObject: () => ({ ...data, _id: 'mock-id' }),
      })
    );
    mockUpdateMany.mockResolvedValue({ modifiedCount: 1 });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockDeleteMany.mockResolvedValue({ deletedCount: 5 });
    mockCountDocuments.mockResolvedValue(0);
    mockFindOne.mockResolvedValue(null);

    const module = await import('@/lib/db/models/PasswordResetToken');
    createPasswordResetToken = module.createPasswordResetToken;
    verifyPasswordResetToken = module.verifyPasswordResetToken;
    markTokenAsUsed = module.markTokenAsUsed;
    cleanupExpiredTokens = module.cleanupExpiredTokens;
    countRecentResetRequests = module.countRecentResetRequests;
  });

  describe('createPasswordResetToken', () => {
    it('should invalidate existing tokens for user', async () => {
      await createPasswordResetToken('user@example.com', 60);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { userId: 'user@example.com', used: false },
        { $set: { used: true, usedAt: expect.any(Date) } }
      );
    });

    it('should create new token with correct expiry', async () => {
      const result = await createPasswordResetToken('user@example.com', 30);

      expect(mockCreate).toHaveBeenCalledWith({
        userId: 'user@example.com',
        token: expect.any(String),
        expiresAt: expect.any(Date),
        used: false,
      });

      expect(result.token).toBeDefined();
      expect(result.doc).toBeDefined();
    });

    it('should use default expiry of 60 minutes', async () => {
      const beforeCall = Date.now();
      await createPasswordResetToken('user@example.com');
      const afterCall = Date.now();

      const createCall = mockCreate.mock.calls[0][0];
      const expiresAt = createCall.expiresAt.getTime();

      // Should expire approximately 60 minutes from now
      expect(expiresAt).toBeGreaterThanOrEqual(beforeCall + 59 * 60 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(afterCall + 61 * 60 * 1000);
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should return null for invalid token', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await verifyPasswordResetToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return token document for valid token', async () => {
      const mockDoc = {
        _id: 'token-id',
        userId: 'user@example.com',
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        toObject: () => ({
          _id: 'token-id',
          userId: 'user@example.com',
          token: 'hashed-token',
          expiresAt: new Date(Date.now() + 3600000),
          used: false,
        }),
      };
      mockFindOne.mockResolvedValue(mockDoc);

      const result = await verifyPasswordResetToken('valid-token');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user@example.com');
    });

    it('should query with hashed token', async () => {
      await verifyPasswordResetToken('test-token');

      expect(mockFindOne).toHaveBeenCalledWith({
        token: expect.any(String),
        used: false,
        expiresAt: { $gt: expect.any(Date) },
      });
    });
  });

  describe('markTokenAsUsed', () => {
    it('should update token as used', async () => {
      await markTokenAsUsed('test-token');

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { token: expect.any(String) },
        { $set: { used: true, usedAt: expect.any(Date) } }
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      mockDeleteMany.mockResolvedValue({ deletedCount: 10 });

      const count = await cleanupExpiredTokens();

      expect(mockDeleteMany).toHaveBeenCalledWith({
        expiresAt: { $lt: expect.any(Date) },
      });
      expect(count).toBe(10);
    });
  });

  describe('countRecentResetRequests', () => {
    it('should count requests in time window', async () => {
      mockCountDocuments.mockResolvedValue(3);

      const count = await countRecentResetRequests('user@example.com', 60);

      expect(mockCountDocuments).toHaveBeenCalledWith({
        userId: 'user@example.com',
        createdAt: { $gte: expect.any(Date) },
      });
      expect(count).toBe(3);
    });

    it('should use default 60 minute window', async () => {
      const beforeCall = Date.now();
      await countRecentResetRequests('user@example.com');

      const call = mockCountDocuments.mock.calls[0][0];
      const windowStart = call.createdAt.$gte.getTime();

      // Window should start approximately 60 minutes ago
      expect(beforeCall - windowStart).toBeGreaterThanOrEqual(59 * 60 * 1000);
      expect(beforeCall - windowStart).toBeLessThanOrEqual(61 * 60 * 1000);
    });
  });
});
