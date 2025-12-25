/**
 * Verify Email Change API Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockFindById = vi.fn();
const mockFindByIdAndDelete = vi.fn();
const mockSave = vi.fn();
const mockVerifyEmailChangeToken = vi.fn();
const mockMarkEmailTokenAsUsed = vi.fn();

// Create a mock User constructor
const MockUserConstructor = vi.fn().mockImplementation((data) => ({
  ...data,
  save: mockSave,
}));

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/User', () => ({
  User: Object.assign(MockUserConstructor, {
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndDelete: (...args: unknown[]) => mockFindByIdAndDelete(...args),
  }),
}));

vi.mock('@/lib/db/models/EmailChangeToken', () => ({
  verifyEmailChangeToken: (...args: unknown[]) => mockVerifyEmailChangeToken(...args),
  markEmailTokenAsUsed: (...args: unknown[]) => mockMarkEmailTokenAsUsed(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10, reset: Date.now() + 3600000 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

describe('/api/users/verify-email-change', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  const mockOldUser = {
    _id: 'old@example.com',
    email: 'old@example.com',
    name: 'Test User',
    image: 'https://example.com/image.jpg',
    password: 'hashed-password',
    plan: 'pro',
    usage: { conversions: 5, apiCalls: 10, lastReset: '2024-01-01' },
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_456',
    createdAt: new Date('2024-01-01'),
  };

  const mockTokenDoc = {
    _id: 'token-id',
    userId: 'old@example.com',
    oldEmail: 'old@example.com',
    newEmail: 'new@example.com',
    token: 'hashed-token',
    expiresAt: new Date(Date.now() + 3600000),
    used: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyEmailChangeToken.mockResolvedValue(mockTokenDoc);
    mockFindById.mockResolvedValue(mockOldUser);
    mockFindByIdAndDelete.mockResolvedValue(undefined);
    mockMarkEmailTokenAsUsed.mockResolvedValue(undefined);
    mockSave.mockResolvedValue(undefined);

    const module = await import('@/app/api/users/verify-email-change/route');
    POST = module.POST;
  });

  it('should successfully change email with valid token', async () => {
    mockFindById
      .mockResolvedValueOnce(mockOldUser) // Old user exists
      .mockResolvedValueOnce(null); // New email not taken

    const request = new NextRequest('http://localhost:3000/api/users/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.newEmail).toBe('new@example.com');
    expect(mockMarkEmailTokenAsUsed).toHaveBeenCalledWith('valid-token');
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith('old@example.com');
  });

  it('should return 400 for invalid token', async () => {
    mockVerifyEmailChangeToken.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('invalid_token');
  });

  it('should return 400 when old user no longer exists', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('user_not_found');
    expect(mockMarkEmailTokenAsUsed).toHaveBeenCalled();
  });

  it('should return 400 when new email is already taken', async () => {
    mockFindById
      .mockResolvedValueOnce(mockOldUser) // Old user exists
      .mockResolvedValueOnce({ _id: 'new@example.com' }); // New email is taken

    const request = new NextRequest('http://localhost:3000/api/users/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('email_taken');
    expect(mockMarkEmailTokenAsUsed).toHaveBeenCalled();
  });

  it('should return 400 when token is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('validation_error');
  });

  it('should preserve user data when changing email', async () => {
    mockFindById
      .mockResolvedValueOnce(mockOldUser)
      .mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/users/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });
    await POST(request);

    // Verify that the new user was created with the old user's data
    expect(MockUserConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'new@example.com',
        email: 'new@example.com',
        name: mockOldUser.name,
        image: mockOldUser.image,
        password: mockOldUser.password,
        plan: mockOldUser.plan,
        stripeCustomerId: mockOldUser.stripeCustomerId,
        stripeSubscriptionId: mockOldUser.stripeSubscriptionId,
      })
    );
  });
});
