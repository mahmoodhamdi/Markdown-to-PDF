/**
 * Integration tests for Sessions API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Mock auth config
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock session service
const mockGetUserSessions = vi.fn();
const mockRevokeOtherSessions = vi.fn();
const mockIsCurrentSession = vi.fn();
vi.mock('@/lib/auth/session-service', () => ({
  getUserSessions: (...args: unknown[]) => mockGetUserSessions(...args),
  revokeOtherSessions: (...args: unknown[]) => mockRevokeOtherSessions(...args),
  isCurrentSession: (...args: unknown[]) => mockIsCurrentSession(...args),
}));

import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetToken = vi.mocked(getToken);

describe('/api/users/sessions', () => {
  let GET: typeof import('@/app/api/users/sessions/route').GET;
  let DELETE: typeof import('@/app/api/users/sessions/route').DELETE;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Re-mock after reset
    vi.doMock('next-auth', () => ({
      getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
    }));

    vi.doMock('next-auth/jwt', () => ({
      getToken: (...args: unknown[]) => mockGetToken(...args),
    }));

    vi.doMock('@/lib/auth/config', () => ({
      authOptions: {},
    }));

    vi.doMock('@/lib/auth/session-service', () => ({
      getUserSessions: (...args: unknown[]) => mockGetUserSessions(...args),
      revokeOtherSessions: (...args: unknown[]) => mockRevokeOtherSessions(...args),
      isCurrentSession: (...args: unknown[]) => mockIsCurrentSession(...args),
    }));

    const module = await import('@/app/api/users/sessions/route');
    GET = module.GET;
    DELETE = module.DELETE;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('GET /api/users/sessions', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/sessions', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return list of sessions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      });
      mockGetToken.mockResolvedValue({ jti: 'current-session-id' });
      mockGetUserSessions.mockResolvedValue([
        {
          _id: 'session-1',
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
          ip: '192.168.1.1',
          location: 'New York, US',
          lastActive: new Date(),
          createdAt: new Date(),
        },
        {
          _id: 'session-2',
          browser: 'Firefox',
          os: 'macOS',
          device: 'Desktop',
          ip: '192.168.1.2',
          location: 'London, UK',
          lastActive: new Date(),
          createdAt: new Date(),
        },
      ]);
      mockIsCurrentSession.mockImplementation((sessionId: string) =>
        Promise.resolve(sessionId === 'session-1')
      );

      const request = new NextRequest('http://localhost:3000/api/users/sessions', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toHaveLength(2);
      expect(data.sessions[0].browser).toBe('Chrome');
      expect(data.sessions[0].isCurrent).toBe(true);
      expect(data.sessions[1].isCurrent).toBe(false);
    });

    it('should return empty list when no sessions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      });
      mockGetToken.mockResolvedValue({ jti: 'current-session-id' });
      mockGetUserSessions.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/users/sessions', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toEqual([]);
    });
  });

  describe('DELETE /api/users/sessions', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/sessions', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should revoke other sessions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      });
      mockGetToken.mockResolvedValue({ jti: 'current-session-id' });
      mockRevokeOtherSessions.mockResolvedValue(3);

      const request = new NextRequest('http://localhost:3000/api/users/sessions', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.revokedCount).toBe(3);
      expect(mockRevokeOtherSessions).toHaveBeenCalledWith(
        'test@example.com',
        'current-session-id'
      );
    });

    it('should handle no other sessions to revoke', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      });
      mockGetToken.mockResolvedValue({ jti: 'current-session-id' });
      mockRevokeOtherSessions.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/users/sessions', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.revokedCount).toBe(0);
    });
  });
});
