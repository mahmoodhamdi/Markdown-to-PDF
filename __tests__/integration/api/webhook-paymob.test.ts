/**
 * Integration tests for Paymob webhook handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Paymob config
vi.mock('@/lib/payments/paymob/config', () => ({
  PAYMOB_CONFIG: {
    hmacSecret: 'test_hmac_secret',
  },
}));

// Mock Paymob gateway
const mockHandleWebhook = vi.fn();
vi.mock('@/lib/payments/paymob/gateway', () => ({
  paymobGateway: {
    handleWebhook: (...args: unknown[]) => mockHandleWebhook(...args),
  },
}));

// Mock crypto for HMAC verification
vi.mock('crypto', () => ({
  default: {
    createHmac: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        digest: vi.fn().mockReturnValue('valid_hmac_hash'),
      }),
    }),
  },
}));

describe('/api/webhooks/paymob', () => {
  let POST: typeof import('@/app/api/webhooks/paymob/route').POST;
  let GET: typeof import('@/app/api/webhooks/paymob/route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const module = await import('@/app/api/webhooks/paymob/route');
    POST = module.POST;
    GET = module.GET;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('POST /api/webhooks/paymob', () => {
    it('should return 400 for invalid signature', async () => {
      const payload = {
        obj: {
          id: 'txn_123',
          amount_cents: 29900,
          created_at: '2024-01-01T00:00:00Z',
          currency: 'EGP',
          error_occured: false,
          has_parent_transaction: false,
          integration_id: 123,
          is_3d_secure: true,
          is_auth: false,
          is_capture: true,
          is_refunded: false,
          is_standalone_payment: true,
          is_voided: false,
          order: { id: 'order_123' },
          owner: 12345,
          pending: false,
          source_data: { pan: '2346', sub_type: 'MASTERCARD', type: 'card' },
          success: true,
          billing_data: { email: 'test@example.com' },
        },
        hmac: 'invalid_hmac',
        type: 'TRANSACTION',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paymob', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should handle successful payment', async () => {
      // Mock gateway returning successful result
      mockHandleWebhook.mockResolvedValue({
        event: 'payment.success',
        success: true,
        status: 'succeeded',
        paymentId: 'txn_123',
        amount: 29900,
        currency: 'EGP',
        userEmail: 'test@example.com',
        plan: 'pro',
      });

      const payload = {
        obj: {
          id: 'txn_123',
          amount_cents: 29900,
          created_at: '2024-01-01T00:00:00Z',
          currency: 'EGP',
          error_occured: false,
          has_parent_transaction: false,
          integration_id: 123,
          is_3d_secure: true,
          is_auth: false,
          is_capture: true,
          is_refunded: false,
          is_standalone_payment: true,
          is_voided: false,
          order: { id: 'order_123' },
          owner: 12345,
          pending: false,
          source_data: { pan: '2346', sub_type: 'MASTERCARD', type: 'card' },
          success: true,
          billing_data: { email: 'test@example.com' },
        },
        hmac: 'valid_hmac_hash',
        type: 'TRANSACTION',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paymob', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockHandleWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            id: 'txn_123',
            success: true,
          }),
        }),
        'valid_hmac_hash'
      );
    });

    it('should handle refunded payment', async () => {
      // Mock gateway returning refund result
      mockHandleWebhook.mockResolvedValue({
        event: 'payment.refunded',
        success: true,
        status: 'refunded',
        paymentId: 'txn_refund',
        userEmail: 'refund@example.com',
      });

      const payload = {
        obj: {
          id: 'txn_refund',
          amount_cents: 29900,
          created_at: '2024-01-01T00:00:00Z',
          currency: 'EGP',
          error_occured: false,
          has_parent_transaction: false,
          integration_id: 123,
          is_3d_secure: true,
          is_auth: false,
          is_capture: true,
          is_refunded: true,
          is_standalone_payment: true,
          is_voided: false,
          order: { id: 'order_123' },
          owner: 12345,
          pending: false,
          source_data: { pan: '2346', sub_type: 'MASTERCARD', type: 'card' },
          success: true,
          billing_data: { email: 'refund@example.com' },
        },
        hmac: 'valid_hmac_hash',
        type: 'TRANSACTION',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paymob', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockHandleWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            is_refunded: true,
          }),
        }),
        'valid_hmac_hash'
      );
    });

    it('should handle voided payment', async () => {
      // Mock gateway returning void result
      mockHandleWebhook.mockResolvedValue({
        event: 'payment.voided',
        success: true,
        status: 'canceled',
        paymentId: 'txn_void',
        userEmail: 'void@example.com',
      });

      const payload = {
        obj: {
          id: 'txn_void',
          amount_cents: 29900,
          created_at: '2024-01-01T00:00:00Z',
          currency: 'EGP',
          error_occured: false,
          has_parent_transaction: false,
          integration_id: 123,
          is_3d_secure: true,
          is_auth: false,
          is_capture: true,
          is_refunded: false,
          is_standalone_payment: true,
          is_voided: true,
          order: { id: 'order_123' },
          owner: 12345,
          pending: false,
          source_data: { pan: '2346', sub_type: 'MASTERCARD', type: 'card' },
          success: true,
          billing_data: { email: 'void@example.com' },
        },
        hmac: 'valid_hmac_hash',
        type: 'TRANSACTION',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paymob', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockHandleWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            is_voided: true,
          }),
        }),
        'valid_hmac_hash'
      );
    });

    it('should return 500 for malformed payload', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/paymob', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
    });
  });

  describe('GET /api/webhooks/paymob', () => {
    it('should redirect to success page on successful payment', async () => {
      const url = new URL('http://localhost:3000/api/webhooks/paymob');
      url.searchParams.set('success', 'true');
      url.searchParams.set('id', 'txn_123');
      url.searchParams.set('order', 'order_456');

      const request = new NextRequest(url);

      const response = await GET(request);

      expect(response.status).toBe(307); // Temporary redirect
      const location = response.headers.get('Location');
      expect(location).toContain('/pricing?success=true');
      expect(location).toContain('gateway=paymob');
      expect(location).toContain('transaction=txn_123');
    });

    it('should redirect to error page on failed payment', async () => {
      const url = new URL('http://localhost:3000/api/webhooks/paymob');
      url.searchParams.set('success', 'false');
      url.searchParams.set('id', 'txn_123');

      const request = new NextRequest(url);

      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('Location');
      expect(location).toContain('/pricing?error=payment_failed');
      expect(location).toContain('gateway=paymob');
    });
  });
});
