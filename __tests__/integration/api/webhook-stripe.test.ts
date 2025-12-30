/**
 * Integration tests for Stripe webhook handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock MongoDB
const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}));

// Mock email service
vi.mock('@/lib/email/service', () => ({
  emailService: {
    isConfigured: vi.fn().mockReturnValue(false),
    sendSubscriptionConfirmation: vi.fn().mockResolvedValue('sent'),
    sendSubscriptionCanceled: vi.fn().mockResolvedValue('sent'),
  },
}));

// Mock Stripe
const mockConstructEvent = vi.fn();
vi.mock('@/lib/stripe/config', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
  isStripeConfigured: () => true,
}));

describe('/api/webhooks/stripe', () => {
  let POST: typeof import('@/app/api/webhooks/stripe/route').POST;
  const originalEnv = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue({ _id: 'test@example.com', name: 'Test User', plan: 'pro' });
    mockFindByIdAndUpdate.mockResolvedValue(undefined);

    // Set webhook secret before importing
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';

    // Reset modules to get fresh import with env set
    vi.resetModules();

    // Re-mock after reset
    vi.doMock('@/lib/db/mongodb', () => ({
      connectDB: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('@/lib/db/models/User', () => ({
      User: {
        findById: mockFindById,
        findByIdAndUpdate: mockFindByIdAndUpdate,
      },
    }));

    vi.doMock('@/lib/email/service', () => ({
      emailService: {
        isConfigured: vi.fn().mockReturnValue(false),
        sendSubscriptionConfirmation: vi.fn().mockResolvedValue('sent'),
        sendSubscriptionCanceled: vi.fn().mockResolvedValue('sent'),
      },
    }));

    vi.doMock('@/lib/stripe/config', () => ({
      stripe: {
        webhooks: {
          constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
        },
      },
      isStripeConfigured: () => true,
    }));

    // Dynamic import
    const module = await import('@/app/api/webhooks/stripe/route');
    POST = module.POST;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.STRIPE_WEBHOOK_SECRET = originalEnv;
    } else {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    }
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should return 400 when signature is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing signature');
    });

    it('should return 400 when signature is invalid', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should handle checkout.session.completed event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              userEmail: 'test@example.com',
              plan: 'pro',
            },
            customer: 'cus_123',
            subscription: 'sub_456',
            amount_total: 500,
            currency: 'usd',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'pro',
            stripeCustomerId: 'cus_123',
            stripeSubscriptionId: 'sub_456',
          }),
        })
      );
    });

    it('should handle checkout.session.completed without metadata', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {},
            customer: 'cus_123',
            subscription: 'sub_456',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Should not update when metadata is missing
      expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle customer.subscription.updated event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            metadata: {
              userEmail: 'test@example.com',
              plan: 'team',
            },
            status: 'active',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'team',
          }),
        })
      );
    });

    it('should downgrade to free when subscription is not active', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            metadata: {
              userEmail: 'test@example.com',
              plan: 'pro',
            },
            status: 'past_due',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      await response.json(); // Parse response body

      expect(response.status).toBe(200);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'free',
          }),
        })
      );
    });

    it('should handle customer.subscription.deleted event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            metadata: {
              userEmail: 'test@example.com',
              plan: 'pro',
            },
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      await response.json(); // Parse response body

      expect(response.status).toBe(200);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'free',
            stripeSubscriptionId: null,
          }),
        })
      );
    });

    it('should handle invoice.payment_succeeded event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer_email: 'test@example.com',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle invoice.payment_failed event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer_email: 'test@example.com',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // invoice.payment_failed is just logged, doesn't update user
    });

    it('should handle unhandled event types gracefully', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'some.unknown.event',
        data: {
          object: {},
        },
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
