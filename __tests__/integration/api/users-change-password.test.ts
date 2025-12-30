/**
 * Change Password API Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockGetServerSession = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockBcryptCompare = vi.fn();
const mockBcryptHash = vi.fn();

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
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: (...args: unknown[]) => mockBcryptCompare(...args),
    hash: (...args: unknown[]) => mockBcryptHash(...args),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 5, reset: Date.now() + 3600000 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/auth/session-service', () => ({
  invalidateAllUserSessions: vi.fn().mockResolvedValue(undefined),
}));

describe('/api/users/change-password', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  const mockUser = {
    _id: 'test@example.com',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-current-password',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });
    mockFindById.mockResolvedValue(mockUser);
    mockFindByIdAndUpdate.mockResolvedValue(undefined);
    mockBcryptCompare.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue('hashed-new-password');

    const module = await import('@/app/api/users/change-password/route');
    POST = module.POST;
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'current123',
        newPassword: 'NewPassword123',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should change password with valid credentials', async () => {
    mockBcryptCompare
      .mockResolvedValueOnce(true)  // current password check
      .mockResolvedValueOnce(false); // new password != current check

    const request = new NextRequest('http://localhost:3000/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'current123',
        newPassword: 'NewPassword123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('changed successfully');
    expect(mockBcryptHash).toHaveBeenCalledWith('NewPassword123', 12);
    expect(mockFindByIdAndUpdate).toHaveBeenCalled();
  });

  it('should return 400 for incorrect current password', async () => {
    mockBcryptCompare.mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'wrong-password',
        newPassword: 'NewPassword123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('invalid_password');
  });

  it('should return 400 when new password is same as current', async () => {
    mockBcryptCompare
      .mockResolvedValueOnce(true)  // current password check
      .mockResolvedValueOnce(true); // new password == current check

    const request = new NextRequest('http://localhost:3000/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'SamePassword1',
        newPassword: 'SamePassword1',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('same_password');
  });

  it('should return 400 for short password', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'current123',
        newPassword: 'short',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('validation_error');
  });

  it('should return 400 for OAuth-only account', async () => {
    mockFindById.mockResolvedValue({
      ...mockUser,
      password: undefined,
    });

    const request = new NextRequest('http://localhost:3000/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'current123',
        newPassword: 'NewPassword123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('oauth_account');
  });

  it('should return 404 when user not found', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'current123',
        newPassword: 'NewPassword123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe('not_found');
  });
});
