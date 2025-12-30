/**
 * Integration tests for Email Verification API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock MongoDB connection
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock User model
const mockFindById = vi.fn();
vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
}));

// Mock EmailVerificationToken
const mockVerifyToken = vi.fn();
const mockMarkAsUsed = vi.fn();
vi.mock('@/lib/db/models/EmailVerificationToken', () => ({
  verifyEmailVerificationToken: (...args: unknown[]) => mockVerifyToken(...args),
  markVerificationTokenAsUsed: (...args: unknown[]) => mockMarkAsUsed(...args),
}));

describe('/api/auth/verify-email', () => {
  let POST: typeof import('@/app/api/auth/verify-email/route').POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Re-mock after reset
    vi.doMock('@/lib/db/mongodb', () => ({
      connectDB: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('@/lib/db/models/User', () => ({
      User: {
        findById: (...args: unknown[]) => mockFindById(...args),
      },
    }));

    vi.doMock('@/lib/db/models/EmailVerificationToken', () => ({
      verifyEmailVerificationToken: (...args: unknown[]) => mockVerifyToken(...args),
      markVerificationTokenAsUsed: (...args: unknown[]) => mockMarkAsUsed(...args),
    }));

    const module = await import('@/app/api/auth/verify-email/route');
    POST = module.POST;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      mockVerifyToken.mockResolvedValue({ userId: 'test@example.com', token: 'valid_token' });
      mockFindById.mockResolvedValue({
        _id: 'test@example.com',
        email: 'test@example.com',
        emailVerified: null,
        save: vi.fn().mockResolvedValue(undefined),
      });
      mockMarkAsUsed.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid_token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('verified successfully');
    });

    it('should return 400 for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('invalid_token');
    });

    it('should return 400 for invalid or expired token', async () => {
      mockVerifyToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: 'invalid_token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('token_invalid');
    });

    it('should return 404 if user not found', async () => {
      mockVerifyToken.mockResolvedValue({ userId: 'nonexistent@example.com', token: 'valid_token' });
      mockFindById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid_token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('user_not_found');
    });

    it('should handle already verified email', async () => {
      mockVerifyToken.mockResolvedValue({ userId: 'test@example.com', token: 'valid_token' });
      mockFindById.mockResolvedValue({
        _id: 'test@example.com',
        email: 'test@example.com',
        emailVerified: new Date(),
      });
      mockMarkAsUsed.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid_token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alreadyVerified).toBe(true);
    });
  });
});
