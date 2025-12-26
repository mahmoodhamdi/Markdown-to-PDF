/**
 * Integration tests for subscription API endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock MongoDB
const mockFindById = vi.fn();
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockSort = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: mockFindById,
  },
}));

vi.mock('@/lib/db/models/RegionalSubscription', () => ({
  RegionalSubscription: {
    findOne: (...args: unknown[]) => {
      mockFindOne(...args);
      return {
        sort: (...sortArgs: unknown[]) => {
          mockSort(...sortArgs);
          return Promise.resolve(null);
        },
      };
    },
    find: (...args: unknown[]) => {
      mockFind(...args);
      return {
        sort: (...sortArgs: unknown[]) => {
          mockSort(...sortArgs);
          return {
            limit: (...limitArgs: unknown[]) => {
              mockLimit(...limitArgs);
              return Promise.resolve([]);
            },
          };
        },
      };
    },
  },
}));

// Mock next-auth
const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

describe('/api/subscriptions', () => {
  let GET: typeof import('@/app/api/subscriptions/route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });

    // Default: user exists with free plan
    mockFindById.mockResolvedValue({
      _id: 'test@example.com',
      name: 'Test User',
      plan: 'free',
    });

    // Import fresh module
    vi.resetModules();
    const module = await import('@/app/api/subscriptions/route');
    GET = module.GET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/subscriptions');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when user not found', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/subscriptions');
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  it('should return free plan subscription for user without paid plan', async () => {
    const request = new NextRequest('http://localhost:3000/api/subscriptions');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.plan).toBe('free');
    expect(data.status).toBe('active');
    expect(data.gateway).toBeNull();
  });

  it('should return Stripe subscription details for Stripe user', async () => {
    mockFindById.mockResolvedValue({
      _id: 'test@example.com',
      name: 'Test User',
      plan: 'pro',
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
    });

    const request = new NextRequest('http://localhost:3000/api/subscriptions');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.plan).toBe('pro');
    expect(data.gateway).toBe('stripe');
    expect(data.subscriptionId).toBe('sub_123');
    expect(data.customerId).toBe('cus_123');
  });
});

describe('/api/subscriptions/invoices', () => {
  let GET: typeof import('@/app/api/subscriptions/invoices/route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });

    mockFindById.mockResolvedValue({
      _id: 'test@example.com',
      name: 'Test User',
      plan: 'pro',
    });

    vi.resetModules();
    const module = await import('@/app/api/subscriptions/invoices/route');
    GET = module.GET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/subscriptions/invoices');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when user not found', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/subscriptions/invoices');
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  it('should return empty invoices array when no subscriptions', async () => {
    const request = new NextRequest('http://localhost:3000/api/subscriptions/invoices');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.invoices).toEqual([]);
  });
});

describe('/api/subscriptions/cancel', () => {
  let POST: typeof import('@/app/api/subscriptions/cancel/route').POST;
  const mockSave = vi.fn();
  const mockStripeCancel = vi.fn();
  const mockPaymobCancel = vi.fn();
  const mockPaytabsCancel = vi.fn();
  const mockPaddleCancel = vi.fn();
  const mockSendEmail = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });

    // Default: user with Stripe subscription
    mockFindById.mockResolvedValue({
      _id: 'test@example.com',
      name: 'Test User',
      plan: 'pro',
      stripeSubscriptionId: 'sub_123',
      save: mockSave,
    });

    // Mock payment gateways
    vi.doMock('@/lib/payments/stripe/gateway', () => ({
      stripeGateway: {
        cancelSubscription: mockStripeCancel,
      },
    }));

    vi.doMock('@/lib/payments/paymob/gateway', () => ({
      paymobGateway: {
        cancelSubscription: mockPaymobCancel,
      },
    }));

    vi.doMock('@/lib/payments/paytabs/gateway', () => ({
      paytabsGateway: {
        cancelSubscription: mockPaytabsCancel,
      },
    }));

    vi.doMock('@/lib/payments/paddle/gateway', () => ({
      paddleGateway: {
        cancelSubscription: mockPaddleCancel,
      },
    }));

    vi.doMock('@/lib/email/service', () => ({
      sendEmail: mockSendEmail.mockResolvedValue({ success: true }),
      emailTemplates: {
        subscriptionCanceled: () => ({
          subject: 'Subscription Canceled',
          html: '<p>Your subscription has been canceled</p>',
        }),
      },
    }));

    vi.resetModules();
    const module = await import('@/app/api/subscriptions/cancel/route');
    POST = module.POST;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediate: false }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when user not found', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediate: false }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  it('should return 400 when no active subscription found', async () => {
    mockFindById.mockResolvedValue({
      _id: 'test@example.com',
      name: 'Test User',
      plan: 'free',
    });

    const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediate: false }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('No active subscription found');
  });
});
