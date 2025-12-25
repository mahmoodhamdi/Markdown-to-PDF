/**
 * Change Email API Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockGetServerSession = vi.fn();
const mockFindById = vi.fn();
const mockBcryptCompare = vi.fn();
const mockCreateEmailChangeToken = vi.fn();
const mockCountRecentEmailChangeRequests = vi.fn();
const mockIsEmailPendingChange = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
}));

vi.mock('@/lib/db/models/EmailChangeToken', () => ({
  createEmailChangeToken: (...args: unknown[]) => mockCreateEmailChangeToken(...args),
  countRecentEmailChangeRequests: (...args: unknown[]) => mockCountRecentEmailChangeRequests(...args),
  isEmailPendingChange: (...args: unknown[]) => mockIsEmailPendingChange(...args),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: (...args: unknown[]) => mockBcryptCompare(...args),
  },
}));

vi.mock('@/lib/email/service', () => ({
  emailService: {
    isConfigured: vi.fn().mockReturnValue(true),
    sendEmailChangeVerification: vi.fn().mockResolvedValue('sent'),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10, reset: Date.now() + 3600000 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

describe('/api/users/change-email', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  const mockUser = {
    _id: 'test@example.com',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });
    mockFindById.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockCountRecentEmailChangeRequests.mockResolvedValue(0);
    mockIsEmailPendingChange.mockResolvedValue(false);
    mockCreateEmailChangeToken.mockResolvedValue({
      token: 'change-token-123',
      doc: { _id: 'token-id' },
    });

    const module = await import('@/app/api/users/change-email/route');
    POST = module.POST;
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should send verification email for valid request', async () => {
    // First call returns current user, second call (checking new email) returns null
    mockFindById
      .mockResolvedValueOnce(mockUser) // Current user
      .mockResolvedValueOnce(null); // New email doesn't exist

    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Verification email sent');
    expect(mockCreateEmailChangeToken).toHaveBeenCalledWith(
      'test@example.com',
      'test@example.com',
      'new@example.com',
      60
    );
  });

  it('should return 400 for same email', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'test@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('same_email');
  });

  it('should return 400 for incorrect password', async () => {
    mockBcryptCompare.mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        password: 'wrong-password',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('invalid_password');
  });

  it('should return 400 when new email already exists', async () => {
    mockFindById
      .mockResolvedValueOnce(mockUser) // Current user
      .mockResolvedValueOnce({ _id: 'new@example.com' }); // Existing user with new email

    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('email_exists');
  });

  it('should return 400 when email has pending change', async () => {
    mockFindById
      .mockResolvedValueOnce(mockUser) // Current user
      .mockResolvedValueOnce(null); // No existing user with new email
    mockIsEmailPendingChange.mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('email_pending');
  });

  it('should return 429 when too many requests', async () => {
    mockFindById
      .mockResolvedValueOnce(mockUser) // Current user
      .mockResolvedValueOnce(null); // New email doesn't exist
    mockIsEmailPendingChange.mockResolvedValue(false);
    mockCountRecentEmailChangeRequests.mockResolvedValue(5);

    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.code).toBe('rate_limited');
  });

  it('should return 400 for OAuth-only account', async () => {
    mockFindById.mockResolvedValue({
      ...mockUser,
      password: undefined,
    });

    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'new@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('oauth_account');
  });

  it('should return 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: 'not-an-email',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('validation_error');
  });
});
