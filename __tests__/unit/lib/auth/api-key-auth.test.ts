import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the database connection and models before any imports
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

const mockVerifyKey = vi.fn();
const mockFindById = vi.fn();

vi.mock('@/lib/db/models/ApiKey', () => ({
  ApiKey: {
    verifyKey: mockVerifyKey,
  },
}));

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: mockFindById,
  },
}));

const mockCheckRateLimit = vi.fn(() => ({
  success: true,
  remaining: 99,
  limit: 100,
  reset: Date.now() + 60000,
}));

const mockGetRateLimitHeaders = vi.fn(() => ({
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': String(Date.now() + 60000),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  getRateLimitHeaders: mockGetRateLimitHeaders,
}));

describe('API Key Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock implementations
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      limit: 100,
      reset: Date.now() + 60000,
    });
  });

  describe('authenticateApiKey', () => {
    it('should return null when no Authorization header', async () => {
      const { authenticateApiKey } = await import('@/lib/auth/api-key-auth');

      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
      });

      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return null when Authorization header is not Bearer', async () => {
      const { authenticateApiKey } = await import('@/lib/auth/api-key-auth');

      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
        headers: {
          Authorization: 'Basic sometoken',
        },
      });

      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return null when key does not start with mk_', async () => {
      const { authenticateApiKey } = await import('@/lib/auth/api-key-auth');

      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid_key',
        },
      });

      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return error when key has invalid format', async () => {
      const { authenticateApiKey } = await import('@/lib/auth/api-key-auth');

      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mk_short', // Too short
        },
      });

      const result = await authenticateApiKey(request);
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });

    it('should return error when key is not found', async () => {
      mockVerifyKey.mockResolvedValue(null);

      const { authenticateApiKey } = await import('@/lib/auth/api-key-auth');

      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mk_' + 'a'.repeat(64),
        },
      });

      const result = await authenticateApiKey(request);
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });

    it('should return success with user info for valid key', async () => {
      mockVerifyKey.mockResolvedValue({
        _id: { toString: () => 'key123' },
        userId: 'user123',
        name: 'Test Key',
        permissions: ['convert', 'preview'],
        expiresAt: null,
        revokedAt: null,
        rateLimit: { limit: 100, window: 60 },
      });

      mockFindById.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
        plan: 'pro',
      });

      const { authenticateApiKey } = await import('@/lib/auth/api-key-auth');

      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mk_' + 'a'.repeat(64),
        },
      });

      const result = await authenticateApiKey(request);

      expect(result).toMatchObject({
        success: true,
        user: {
          id: 'user123',
          email: 'test@example.com',
          plan: 'pro',
          permissions: ['convert', 'preview'],
          rateLimit: { limit: 100, window: 60 },
          apiKeyId: 'key123',
          apiKeyName: 'Test Key',
        },
      });
    });

    it('should return error when user not found', async () => {
      mockVerifyKey.mockResolvedValue({
        _id: { toString: () => 'key123' },
        userId: 'user123',
        name: 'Test Key',
        permissions: ['convert'],
        expiresAt: null,
        revokedAt: null,
        rateLimit: { limit: 100, window: 60 },
      });

      mockFindById.mockResolvedValue(null);

      const { authenticateApiKey } = await import('@/lib/auth/api-key-auth');

      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mk_' + 'a'.repeat(64),
        },
      });

      const result = await authenticateApiKey(request);
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
      });
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the required permission', async () => {
      const { hasPermission } = await import('@/lib/auth/api-key-auth');

      const user = {
        id: 'user123',
        email: 'test@example.com',
        plan: 'pro' as const,
        permissions: ['convert', 'preview'] as ('convert' | 'preview' | 'batch' | 'templates' | 'themes')[],
        rateLimit: { limit: 100, window: 60 },
        apiKeyId: 'key123',
        apiKeyName: 'Test Key',
      };

      expect(hasPermission(user, 'convert')).toBe(true);
      expect(hasPermission(user, 'preview')).toBe(true);
    });

    it('should return false when user lacks the required permission', async () => {
      const { hasPermission } = await import('@/lib/auth/api-key-auth');

      const user = {
        id: 'user123',
        email: 'test@example.com',
        plan: 'pro' as const,
        permissions: ['convert'] as ('convert' | 'preview' | 'batch' | 'templates' | 'themes')[],
        rateLimit: { limit: 100, window: 60 },
        apiKeyId: 'key123',
        apiKeyName: 'Test Key',
      };

      expect(hasPermission(user, 'batch')).toBe(false);
      expect(hasPermission(user, 'templates')).toBe(false);
    });
  });

  describe('checkApiKeyRateLimit', () => {
    it('should check rate limit based on API key settings', async () => {
      const { checkApiKeyRateLimit } = await import('@/lib/auth/api-key-auth');

      const user = {
        id: 'user123',
        email: 'test@example.com',
        plan: 'pro' as const,
        permissions: ['convert'] as ('convert' | 'preview' | 'batch' | 'templates' | 'themes')[],
        rateLimit: { limit: 500, window: 60 },
        apiKeyId: 'key123',
        apiKeyName: 'Test Key',
      };

      const result = await checkApiKeyRateLimit(user);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        'api-key:key123',
        500,
        60000
      );

      expect(result.success).toBe(true);
    });

    it('should return error when rate limit exceeded', async () => {
      mockCheckRateLimit.mockReturnValue({
        success: false,
        remaining: 0,
        limit: 100,
        reset: Date.now() + 60000,
      });

      const { checkApiKeyRateLimit } = await import('@/lib/auth/api-key-auth');

      const user = {
        id: 'user123',
        email: 'test@example.com',
        plan: 'free' as const,
        permissions: ['convert'] as ('convert' | 'preview' | 'batch' | 'templates' | 'themes')[],
        rateLimit: { limit: 100, window: 60 },
        apiKeyId: 'key123',
        apiKeyName: 'Test Key',
      };

      const result = await checkApiKeyRateLimit(user);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });
});
