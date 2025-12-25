/**
 * Integration tests for Paddle webhook handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock MongoDB connection
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock User model
const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
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

// Mock Paddle config
const mockIsPaddleConfigured = vi.fn();
vi.mock('@/lib/payments/paddle/config', () => ({
  isPaddleConfigured: () => mockIsPaddleConfigured(),
  PADDLE_CONFIG: {
    webhookSecret: 'test_webhook_secret',
  },
}));

// Mock Paddle client
const mockVerifyWebhookSignature = vi.fn();
vi.mock('@/lib/payments/paddle/client', () => ({
  paddleClient: {
    verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
  },
}));

describe('/api/webhooks/paddle', () => {
  let POST: typeof import('@/app/api/webhooks/paddle/route').POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    mockIsPaddleConfigured.mockReturnValue(true);
    mockVerifyWebhookSignature.mockReturnValue(true);
    mockFindById.mockResolvedValue({ _id: 'test@example.com', name: 'Test User', plan: 'pro' });
    mockFindByIdAndUpdate.mockResolvedValue(undefined);

    // Re-mock after reset
    vi.doMock('@/lib/db/mongodb', () => ({
      connectDB: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('@/lib/db/models/User', () => ({
      User: {
        findById: (...args: unknown[]) => mockFindById(...args),
        findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
      },
    }));

    vi.doMock('@/lib/email/service', () => ({
      emailService: {
        isConfigured: vi.fn().mockReturnValue(false),
        sendSubscriptionConfirmation: vi.fn().mockResolvedValue('sent'),
        sendSubscriptionCanceled: vi.fn().mockResolvedValue('sent'),
      },
    }));

    const module = await import('@/app/api/webhooks/paddle/route');
    POST = module.POST;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('POST /api/webhooks/paddle', () => {
    it('should return 503 when Paddle is not configured', async () => {
      mockIsPaddleConfigured.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify({ event_type: 'subscription.created' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Paddle not configured');
    });

    it('should return 400 for invalid signature', async () => {
      mockVerifyWebhookSignature.mockReturnValue(false);

      const event = {
        event_type: 'subscription.created',
        event_id: 'evt_123',
        data: {},
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'invalid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should handle subscription.created event', async () => {
      const event = {
        event_type: 'subscription.created',
        event_id: 'evt_sub_created',
        data: {
          id: 'sub_123',
          customer_id: 'ctm_123',
          custom_data: {
            userEmail: 'test@example.com',
            plan: 'pro',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
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
            paddleCustomerId: 'ctm_123',
            paddleSubscriptionId: 'sub_123',
          }),
        })
      );
    });

    it('should handle subscription.activated event', async () => {
      const event = {
        event_type: 'subscription.activated',
        event_id: 'evt_sub_activated',
        data: {
          id: 'sub_456',
          customer_id: 'ctm_456',
          custom_data: {
            userEmail: 'activated@example.com',
            plan: 'team',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'activated@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'team',
          }),
        })
      );
    });

    it('should handle subscription.updated event', async () => {
      const event = {
        event_type: 'subscription.updated',
        event_id: 'evt_sub_updated',
        data: {
          id: 'sub_123',
          custom_data: {
            userEmail: 'updated@example.com',
            plan: 'enterprise',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'updated@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'enterprise',
          }),
        })
      );
    });

    it('should handle subscription.canceled event', async () => {
      const event = {
        event_type: 'subscription.canceled',
        event_id: 'evt_sub_canceled',
        data: {
          id: 'sub_canceled',
          custom_data: {
            userEmail: 'canceled@example.com',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'canceled@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'free',
            paddleSubscriptionId: null,
          }),
        })
      );
    });

    it('should handle subscription.resumed event', async () => {
      const event = {
        event_type: 'subscription.resumed',
        event_id: 'evt_sub_resumed',
        data: {
          id: 'sub_resumed',
          custom_data: {
            userEmail: 'resumed@example.com',
            plan: 'pro',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'resumed@example.com',
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: 'pro',
          }),
        })
      );
    });

    it('should handle subscription.paused event', async () => {
      const event = {
        event_type: 'subscription.paused',
        event_id: 'evt_sub_paused',
        data: {
          id: 'sub_paused',
          custom_data: {
            userEmail: 'paused@example.com',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Paused event doesn't update user in current implementation
      expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle subscription.past_due event', async () => {
      const event = {
        event_type: 'subscription.past_due',
        event_id: 'evt_sub_past_due',
        data: {
          id: 'sub_past_due',
          custom_data: {
            userEmail: 'past_due@example.com',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle transaction.completed event', async () => {
      const event = {
        event_type: 'transaction.completed',
        event_id: 'evt_txn_completed',
        data: {
          id: 'txn_123',
          details: {
            totals: {
              total: '2999',
            },
          },
          custom_data: {
            userEmail: 'transaction@example.com',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle transaction.payment_failed event', async () => {
      const event = {
        event_type: 'transaction.payment_failed',
        event_id: 'evt_txn_failed',
        data: {
          id: 'txn_failed',
          custom_data: {
            userEmail: 'failed@example.com',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle customer.created event', async () => {
      const event = {
        event_type: 'customer.created',
        event_id: 'evt_customer_created',
        data: {
          id: 'ctm_new',
          email: 'new_customer@example.com',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should handle unknown event types gracefully', async () => {
      const event = {
        event_type: 'unknown.event',
        event_id: 'evt_unknown',
        data: {},
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should return 500 for malformed payload', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
    });

    it('should handle missing custom_data gracefully', async () => {
      const event = {
        event_type: 'subscription.created',
        event_id: 'evt_no_custom_data',
        data: {
          id: 'sub_no_custom',
          customer_id: 'ctm_123',
          // No custom_data
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'paddle-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Should not update user without email
      expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should process without signature when webhook secret not configured', async () => {
      // Re-import with different config
      vi.resetModules();

      vi.doMock('@/lib/payments/paddle/config', () => ({
        isPaddleConfigured: () => true,
        PADDLE_CONFIG: {
          webhookSecret: undefined,
        },
      }));

      const module = await import('@/app/api/webhooks/paddle/route');
      const postWithoutSecret = module.POST;

      const event = {
        event_type: 'subscription.created',
        event_id: 'evt_no_secret',
        data: {
          id: 'sub_no_secret',
          customer_id: 'ctm_no_secret',
          custom_data: {
            userEmail: 'nosecret@example.com',
            plan: 'pro',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: JSON.stringify(event),
        // No signature header
      });

      const response = await postWithoutSecret(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
