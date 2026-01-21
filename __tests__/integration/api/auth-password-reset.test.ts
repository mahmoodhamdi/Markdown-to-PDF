/**
 * Password Reset API Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockFindById = vi.fn();
const mockUpdateOne = vi.fn();

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: mockFindById,
    updateOne: mockUpdateOne,
  },
}));

const mockCreatePasswordResetToken = vi.fn();
const mockVerifyPasswordResetToken = vi.fn();
const mockMarkTokenAsUsed = vi.fn();
const mockCountRecentResetRequests = vi.fn();

vi.mock('@/lib/db/models/PasswordResetToken', () => ({
  createPasswordResetToken: mockCreatePasswordResetToken,
  verifyPasswordResetToken: mockVerifyPasswordResetToken,
  markTokenAsUsed: mockMarkTokenAsUsed,
  countRecentResetRequests: mockCountRecentResetRequests,
}));

vi.mock('@/lib/email/service', () => ({
  emailService: {
    isConfigured: vi.fn().mockReturnValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue('sent'),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10, reset: Date.now() + 3600000 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/auth/session-service', () => ({
  invalidateAllUserSessions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('POST /api/auth/forgot-password', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCountRecentResetRequests.mockResolvedValue(0);
    mockCreatePasswordResetToken.mockResolvedValue({
      token: 'test-reset-token',
      doc: { _id: 'token-id', userId: 'test@example.com' },
    });

    const module = await import('@/app/api/auth/forgot-password/route');
    POST = module.POST;
  });

  it('should return success for valid email', async () => {
    mockFindById.mockResolvedValue({
      _id: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('password reset link');
  });

  it('should return success for non-existent email (no enumeration)', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should not indicate whether user exists
    expect(data.message).toContain('If an account');
  });

  it('should return success for OAuth-only user (no password)', async () => {
    mockFindById.mockResolvedValue({
      _id: 'oauth@example.com',
      name: 'OAuth User',
      // No password field
    });

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'oauth@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should rate limit by email (per-user rate limit)', async () => {
    mockCountRecentResetRequests.mockResolvedValue(5); // Max reached

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'limited@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Still returns success to prevent enumeration
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // But shouldn't have created a new token
    expect(mockCreatePasswordResetToken).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyPasswordResetToken.mockResolvedValue({
      _id: 'token-id',
      userId: 'test@example.com',
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 3600000),
      used: false,
    });
    mockFindById.mockResolvedValue({
      _id: 'test@example.com',
      name: 'Test User',
    });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockMarkTokenAsUsed.mockResolvedValue(undefined);

    const module = await import('@/app/api/auth/reset-password/route');
    POST = module.POST;
  });

  it('should reset password with valid token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-reset-token',
        password: 'NewPassword123!', // Must meet password requirements: uppercase, lowercase, number
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('reset successfully');
    expect(mockMarkTokenAsUsed).toHaveBeenCalledWith('valid-reset-token');
  });

  it('should return 400 for invalid token', async () => {
    mockVerifyPasswordResetToken.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'NewPassword123!', // Must meet password requirements
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('invalid_token');
  });

  it('should return 400 for short password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        password: '123', // Too short
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('validation_error');
  });

  it('should return 400 for missing token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        password: 'NewPassword123!',
      }),
    });

    const response = await POST(request);
    await response.json(); // Parse response body

    expect(response.status).toBe(400);
  });

  it('should return 400 if user no longer exists', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewPassword123!',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('invalid_token');
    // Token should still be marked as used
    expect(mockMarkTokenAsUsed).toHaveBeenCalled();
  });
});
