/**
 * Integration tests for PayTabs webhook handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock PayTabs config
const mockIsPayTabsConfigured = vi.fn();
vi.mock('@/lib/payments/paytabs/config', () => ({
  isPayTabsConfigured: () => mockIsPayTabsConfigured(),
}));

// Mock PayTabs client
const mockVerifyCallbackSignature = vi.fn();
vi.mock('@/lib/payments/paytabs/client', () => ({
  paytabsClient: {
    verifyCallbackSignature: (...args: unknown[]) => mockVerifyCallbackSignature(...args),
  },
}));

// Mock PayTabs gateway
const mockHandleWebhook = vi.fn();
vi.mock('@/lib/payments/paytabs/gateway', () => ({
  paytabsGateway: {
    handleWebhook: (...args: unknown[]) => mockHandleWebhook(...args),
  },
}));

describe('/api/webhooks/paytabs', () => {
  let POST: typeof import('@/app/api/webhooks/paytabs/route').POST;
  let GET: typeof import('@/app/api/webhooks/paytabs/route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    mockIsPayTabsConfigured.mockReturnValue(true);

    const module = await import('@/app/api/webhooks/paytabs/route');
    POST = module.POST;
    GET = module.GET;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('POST /api/webhooks/paytabs', () => {
    it('should return 503 when PayTabs is not configured', async () => {
      mockIsPayTabsConfigured.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/webhooks/paytabs', {
        method: 'POST',
        body: JSON.stringify({ tran_ref: 'TST123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('PayTabs not configured');
    });

    it('should return 400 for invalid signature', async () => {
      mockVerifyCallbackSignature.mockReturnValue(false);

      const payload = {
        tran_ref: 'TST123',
        cart_id: 'cart_123',
        signature: 'invalid_signature',
        payment_result: {
          response_status: 'A',
          response_code: '000',
          response_message: 'Approved',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paytabs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should handle successful payment', async () => {
      mockVerifyCallbackSignature.mockReturnValue(true);
      mockHandleWebhook.mockResolvedValue({
        event: 'payment.success',
        success: true,
        status: 'succeeded',
        paymentId: 'TST123',
        amount: 29900,
        currency: 'SAR',
        userEmail: 'test@example.com',
        plan: 'pro',
      });

      const payload = {
        tran_ref: 'TST123',
        cart_id: 'cart_123',
        signature: 'valid_signature',
        payment_result: {
          response_status: 'A',
          response_code: '000',
          response_message: 'Approved',
        },
        customer_details: {
          email: 'test@example.com',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paytabs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.status).toBe('success');
      expect(data.transactionRef).toBe('TST123');
      expect(mockHandleWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          tran_ref: 'TST123',
        }),
        'valid_signature'
      );
    });

    it('should handle failed payment', async () => {
      mockVerifyCallbackSignature.mockReturnValue(true);
      mockHandleWebhook.mockResolvedValue({
        event: 'payment.failed',
        success: true,
        status: 'failed',
        paymentId: 'TST_FAIL',
        error: 'Declined',
      });

      const payload = {
        tran_ref: 'TST_FAIL',
        cart_id: 'cart_fail',
        signature: 'valid_signature',
        payment_result: {
          response_status: 'D',
          response_code: '101',
          response_message: 'Declined',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paytabs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.status).toBe('failed');
      expect(data.message).toBe('Declined');
    });

    it('should process callback without signature verification', async () => {
      mockHandleWebhook.mockResolvedValue({
        event: 'payment.success',
        success: true,
        status: 'succeeded',
        paymentId: 'TST_NOSIG',
        userEmail: 'nosig@example.com',
        plan: 'team',
      });

      const payload = {
        tran_ref: 'TST_NOSIG',
        cart_id: 'cart_nosig',
        // No signature
        payment_result: {
          response_status: 'A',
          response_code: '000',
          response_message: 'Approved',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/paytabs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockVerifyCallbackSignature).not.toHaveBeenCalled();
    });

    it('should return 500 for malformed payload', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/paytabs', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
    });
  });

  describe('GET /api/webhooks/paytabs', () => {
    it('should redirect to success page on approved payment', async () => {
      const url = new URL('http://localhost:3000/api/webhooks/paytabs');
      url.searchParams.set('respStatus', 'A');
      url.searchParams.set('tranRef', 'TST123');
      url.searchParams.set('cartId', 'cart_123');

      const request = new NextRequest(url);

      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('Location');
      expect(location).toContain('/pricing?success=true');
      expect(location).toContain('gateway=paytabs');
      expect(location).toContain('transaction=TST123');
    });

    it('should redirect to error page on declined payment', async () => {
      const url = new URL('http://localhost:3000/api/webhooks/paytabs');
      url.searchParams.set('respStatus', 'D');
      url.searchParams.set('tranRef', 'TST_FAIL');

      const request = new NextRequest(url);

      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('Location');
      expect(location).toContain('/pricing?error=payment_failed');
      expect(location).toContain('gateway=paytabs');
      expect(location).toContain('status=D');
    });

    it('should redirect to error page for pending status', async () => {
      const url = new URL('http://localhost:3000/api/webhooks/paytabs');
      url.searchParams.set('respStatus', 'P');
      url.searchParams.set('tranRef', 'TST_PENDING');

      const request = new NextRequest(url);

      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('Location');
      expect(location).toContain('/pricing?error=payment_failed');
      expect(location).toContain('status=P');
    });
  });
});
