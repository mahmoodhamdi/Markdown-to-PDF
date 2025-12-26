/**
 * User Profile API Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockGetServerSession = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockFindByIdAndDelete = vi.fn();
const mockBcryptCompare = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
    findByIdAndDelete: (...args: unknown[]) => mockFindByIdAndDelete(...args),
  },
  UserFile: { find: vi.fn().mockResolvedValue([]), deleteMany: vi.fn().mockResolvedValue(undefined) },
  UsageEvent: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  DailyUsage: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  Team: { find: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue(undefined) },
  TeamMemberLookup: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  TeamActivity: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  TeamInvitation: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  RegionalSubscription: { find: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue(undefined) },
  Session: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  Account: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  PasswordResetToken: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  EmailVerificationToken: { deleteMany: vi.fn().mockResolvedValue(undefined) },
  EmailChangeToken: { deleteMany: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: (...args: unknown[]) => mockBcryptCompare(...args),
  },
}));

vi.mock('@/lib/email/service', () => ({
  emailService: {
    isConfigured: vi.fn().mockReturnValue(false),
    sendAccountDeletion: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10, reset: Date.now() + 60000 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

describe('/api/users/profile', () => {
  let GET: (request: NextRequest) => Promise<Response>;
  let PATCH: (request: NextRequest) => Promise<Response>;
  let DELETE: (request: NextRequest) => Promise<Response>;

  const mockUser = {
    _id: 'test@example.com',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/image.jpg',
    plan: 'pro',
    usage: { conversions: 5, apiCalls: 10, lastReset: '2024-01-01' },
    password: 'hashed-password',
    emailVerified: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });
    mockFindById.mockResolvedValue(mockUser);
    mockFindByIdAndUpdate.mockResolvedValue(mockUser);

    const module = await import('@/app/api/users/profile/route');
    GET = module.GET;
    PATCH = module.PATCH;
    DELETE = module.DELETE;
  });

  describe('GET /api/users/profile', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('unauthorized');
    });

    it('should return user profile when authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.name).toBe('Test User');
      expect(data.user.plan).toBe('pro');
      expect(data.user.hasPassword).toBe(true);
    });

    it('should not expose password in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(data.user.password).toBeUndefined();
    });

    it('should return 404 when user not found', async () => {
      mockFindById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('not_found');
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      });
      const response = await PATCH(request);

      expect(response.status).toBe(401);
    });

    it('should update user name', async () => {
      mockFindByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test@example.com',
        { $set: { name: 'Updated Name' } },
        { new: true }
      );
    });

    it('should update user image', async () => {
      mockFindByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        image: 'https://example.com/new-image.jpg',
      });

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ image: 'https://example.com/new-image.jpg' }),
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when no updates provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('no_updates');
    });

    it('should return 400 for invalid image URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ image: 'not-a-url' }),
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('validation_error');
    });
  });

  describe('DELETE /api/users/profile', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true, password: 'password123' }),
      });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 without confirmation and password', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('validation_error');
    });

    it('should return 400 without password', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('validation_error');
    });

    it('should return 401 with wrong password', async () => {
      mockBcryptCompare.mockResolvedValue(false);

      mockFindById.mockResolvedValue({
        ...mockUser,
        stripeSubscriptionId: null,
        plan: 'free',
        password: 'hashed-password',
      });

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true, password: 'wrong-password' }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('invalid_password');
    });

    it('should delete account with confirmation and correct password', async () => {
      mockBcryptCompare.mockResolvedValue(true);

      mockFindById.mockResolvedValue({
        ...mockUser,
        stripeSubscriptionId: null,
        plan: 'free',
        password: 'hashed-password',
      });
      mockFindByIdAndDelete.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true, password: 'correct-password' }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('test@example.com');
    });
  });
});
