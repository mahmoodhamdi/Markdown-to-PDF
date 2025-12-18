/**
 * Integration tests for checkout API route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Firebase admin
vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {},
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ plan: 'free' }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

// Mock auth config
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock next-auth
const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// Mock Stripe
const mockCustomersList = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock('@/lib/stripe/config', () => ({
  stripe: {
    customers: {
      list: (...args: unknown[]) => mockCustomersList(...args),
      create: (...args: unknown[]) => mockCustomersCreate(...args),
    },
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  },
  getPriceId: (plan: string, billing: string) => {
    if (plan === 'pro' && billing === 'monthly') return 'price_pro_monthly';
    if (plan === 'pro' && billing === 'yearly') return 'price_pro_yearly';
    if (plan === 'team' && billing === 'monthly') return 'price_team_monthly';
    return null;
  },
  isStripeConfigured: () => true,
}));

import { POST } from '@/app/api/checkout/route';

describe('/api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/checkout', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('You must be logged in to subscribe.');
    });

    it('should return 400 for invalid plan', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'invalid', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid plan selected.');
    });

    it('should return 400 for invalid billing period', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'invalid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid billing period.');
    });

    it('should return 503 when price not configured', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      // Use team yearly which returns null in our mock
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'team', billing: 'yearly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Price not configured for this plan. Please contact support.');
    });

    it('should use existing customer when available', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      mockCustomersList.mockResolvedValue({
        data: [{ id: 'cus_existing123' }],
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session123',
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/session123');
      expect(mockCustomersCreate).not.toHaveBeenCalled();
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing123',
        })
      );
    });

    it('should create new customer when not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      mockCustomersList.mockResolvedValue({
        data: [],
      });

      mockCustomersCreate.mockResolvedValue({
        id: 'cus_new123',
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session456',
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'yearly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/session456');
      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          userId: 'user-123',
        },
      });
    });

    it('should include correct metadata in checkout session', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      mockCustomersList.mockResolvedValue({
        data: [{ id: 'cus_existing123' }],
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session789',
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      await POST(request);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user-123',
            userEmail: 'test@example.com',
            plan: 'pro',
            billing: 'monthly',
          }),
          subscription_data: expect.objectContaining({
            metadata: expect.objectContaining({
              userId: 'user-123',
              userEmail: 'test@example.com',
              plan: 'pro',
            }),
          }),
        })
      );
    });

    it('should return 500 on Stripe API error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      mockCustomersList.mockRejectedValue(new Error('Stripe API error'));

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session.');
    });
  });
});
