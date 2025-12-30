/**
 * Integration tests for Analytics API endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock auth config
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    limit: 60,
    remaining: 59,
    reset: Date.now() + 60000,
  })),
  getRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': '59',
    'X-RateLimit-Reset': String(Date.now() + 60000),
  })),
}));

// Mock analytics service
vi.mock('@/lib/analytics/service', () => ({
  trackEvent: vi.fn(),
  getUsageSummary: vi.fn(),
  getUsageHistory: vi.fn(),
  getDailyUsage: vi.fn(),
}));

import { getServerSession } from 'next-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { trackEvent, getUsageSummary, getUsageHistory } from '@/lib/analytics/service';

const mockGetServerSession = vi.mocked(getServerSession);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockTrackEvent = vi.mocked(trackEvent);
const mockGetUsageSummary = vi.mocked(getUsageSummary);
const mockGetUsageHistory = vi.mocked(getUsageHistory);

describe('Analytics API - Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import('@/app/api/analytics/summary/route');
    const request = new NextRequest('http://localhost/api/analytics/summary', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return usage summary', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    mockGetUsageSummary.mockResolvedValue({
      today: {
        date: '2025-01-01',
        conversions: 5,
        apiCalls: 20,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      },
      thisWeek: {
        date: '2025-01-01 to 2025-01-07',
        conversions: 35,
        apiCalls: 140,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      },
      thisMonth: {
        date: '2025-01-01 to 2025-01-31',
        conversions: 100,
        apiCalls: 400,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      },
      limits: {
        conversionsPerDay: 20,
        apiCallsPerDay: 100,
      },
      remaining: {
        conversionsToday: 15,
        apiCallsToday: 80,
      },
    });

    const { GET } = await import('@/app/api/analytics/summary/route');
    const request = new NextRequest('http://localhost/api/analytics/summary', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.summary.today.conversions).toBe(5);
    expect(data.summary.remaining.conversionsToday).toBe(15);
    expect(data.summary.plan).toBe('free');
  });

  it('should handle unlimited limits', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'enterprise' },
    });

    mockGetUsageSummary.mockResolvedValue({
      today: {
        date: '2025-01-01',
        conversions: 1000,
        apiCalls: 5000,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      },
      thisWeek: {
        date: '2025-01-01 to 2025-01-07',
        conversions: 7000,
        apiCalls: 35000,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      },
      thisMonth: {
        date: '2025-01-01 to 2025-01-31',
        conversions: 30000,
        apiCalls: 150000,
        fileUploads: 0,
        fileDownloads: 0,
        templatesUsed: 0,
        batchConversions: 0,
        storageUsed: 0,
      },
      limits: {
        conversionsPerDay: Infinity,
        apiCallsPerDay: 100000,
      },
      remaining: {
        conversionsToday: Infinity,
        apiCallsToday: 95000,
      },
    });

    const { GET } = await import('@/app/api/analytics/summary/route');
    const request = new NextRequest('http://localhost/api/analytics/summary', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.limits.conversionsPerDay).toBe('unlimited');
    expect(data.summary.remaining.conversionsToday).toBe('unlimited');
  });
});

describe('Analytics API - History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import('@/app/api/analytics/history/route');
    const request = new NextRequest('http://localhost/api/analytics/history', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return usage history with default 30 days', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    mockGetUsageHistory.mockResolvedValue({
      daily: [
        {
          date: '2025-01-01',
          conversions: 5,
          apiCalls: 20,
          fileUploads: 0,
          fileDownloads: 0,
          templatesUsed: 0,
          batchConversions: 0,
          storageUsed: 0,
        },
        {
          date: '2025-01-02',
          conversions: 8,
          apiCalls: 30,
          fileUploads: 0,
          fileDownloads: 0,
          templatesUsed: 0,
          batchConversions: 0,
          storageUsed: 0,
        },
      ],
      startDate: '2024-12-03',
      endDate: '2025-01-01',
    });

    const { GET } = await import('@/app/api/analytics/history/route');
    const request = new NextRequest('http://localhost/api/analytics/history', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.history.daily).toHaveLength(2);
    expect(mockGetUsageHistory).toHaveBeenCalledWith('user-123', 30);
  });

  it('should respect days parameter', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    mockGetUsageHistory.mockResolvedValue({
      daily: [],
      startDate: '2024-12-25',
      endDate: '2025-01-01',
    });

    const { GET } = await import('@/app/api/analytics/history/route');
    const request = new NextRequest('http://localhost/api/analytics/history?days=7', {
      method: 'GET',
    });

    const response = await GET(request);
    await response.json(); // Parse response body

    expect(response.status).toBe(200);
    expect(mockGetUsageHistory).toHaveBeenCalledWith('user-123', 7);
  });

  it('should cap days parameter at 90', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    mockGetUsageHistory.mockResolvedValue({
      daily: [],
      startDate: '2024-10-01',
      endDate: '2025-01-01',
    });

    const { GET } = await import('@/app/api/analytics/history/route');
    const request = new NextRequest('http://localhost/api/analytics/history?days=120', {
      method: 'GET',
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    // Should use default 30 since 120 > 90
    expect(mockGetUsageHistory).toHaveBeenCalledWith('user-123', 30);
  });
});

describe('Analytics API - Track Event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 200,
      remaining: 199,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { POST } = await import('@/app/api/analytics/track/route');
    const request = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventType: 'conversion' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should track conversion event', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    mockTrackEvent.mockResolvedValue();

    const { POST } = await import('@/app/api/analytics/track/route');
    const request = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventType: 'conversion' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockTrackEvent).toHaveBeenCalledWith('user-123', 'conversion', undefined);
  });

  it('should track event with metadata', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    mockTrackEvent.mockResolvedValue();

    const { POST } = await import('@/app/api/analytics/track/route');
    const request = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        eventType: 'conversion',
        metadata: { theme: 'github', fileSize: 1024 },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockTrackEvent).toHaveBeenCalledWith('user-123', 'conversion', {
      theme: 'github',
      fileSize: 1024,
    });
  });

  it('should validate event type', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    const { POST } = await import('@/app/api/analytics/track/route');
    const request = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventType: 'invalid_event' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should track all valid event types', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    mockTrackEvent.mockResolvedValue();

    const eventTypes = [
      'conversion',
      'api_call',
      'file_upload',
      'file_download',
      'template_used',
      'batch_conversion',
    ];

    const { POST } = await import('@/app/api/analytics/track/route');

    for (const eventType of eventTypes) {
      const request = new NextRequest('http://localhost/api/analytics/track', {
        method: 'POST',
        body: JSON.stringify({ eventType }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }

    expect(mockTrackEvent).toHaveBeenCalledTimes(eventTypes.length);
  });
});
