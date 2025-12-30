/**
 * Integration tests for User Registration API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Create hoisted mocks to avoid initialization issues
const mockFindById = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());

// Mock MongoDB connection
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock User model
vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

// Mock email service
vi.mock('@/lib/email/service', () => ({
  emailService: {
    isConfigured: vi.fn().mockReturnValue(false),
    sendEmailVerification: vi.fn().mockResolvedValue('sent'),
  },
}));

// Mock email verification token
vi.mock('@/lib/db/models/EmailVerificationToken', () => ({
  createEmailVerificationToken: vi.fn().mockResolvedValue({ token: 'test_token' }),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

import { POST } from '@/app/api/auth/register/route';

describe('/api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue(null); // User doesn't exist by default
    mockCreate.mockResolvedValue({ _id: 'test@example.com' });
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 3600000,
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Registration successful');
    });

    it('should return 400 for missing name', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('validation_error');
    });

    it('should return 400 for invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          password: 'SecurePassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('validation_error');
    });

    it('should return 400 if email already in use', async () => {
      mockFindById.mockResolvedValue({ _id: 'test@example.com', email: 'test@example.com' });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('email_in_use');
    });

    it('should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockReturnValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 3600000,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many');
    });
  });
});
