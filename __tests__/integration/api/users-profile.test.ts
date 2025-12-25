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
    findByIdAndDelete: (...args: unknown[]) => mockFindByIdAndDelete(...args),
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
        body: JSON.stringify({ confirm: true }),
      });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 without confirmation', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('confirmation_required');
    });

    it('should return 400 when user has active subscription', async () => {
      mockFindById.mockResolvedValue({
        ...mockUser,
        stripeSubscriptionId: 'sub_123',
        plan: 'pro',
      });

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('active_subscription');
    });

    it('should delete account with confirmation and no subscription', async () => {
      mockFindById.mockResolvedValue({
        ...mockUser,
        stripeSubscriptionId: null,
        plan: 'free',
      });
      mockFindByIdAndDelete.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('test@example.com');
    });
  });
});
