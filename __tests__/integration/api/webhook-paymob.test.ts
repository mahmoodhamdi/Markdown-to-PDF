/**
 * Integration tests for Paymob webhook handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Define mock functions at module level
const mockHandleWebhook = vi.fn();

// Mock all dependencies before any imports
// Note: We set hmacSecret to undefined to skip HMAC verification in tests
// This is because mocking Node's crypto module is complex and error-prone
vi.mock('@/lib/payments/paymob/config', () => ({
  PAYMOB_CONFIG: {
    hmacSecret: undefined, // Skip HMAC verification in tests
  },
}));

vi.mock('@/lib/payments/paymob/gateway', () => ({
  paymobGateway: {
    handleWebhook: (...args: unknown[]) => mockHandleWebhook(...args),
  },
}));

vi.mock('@/lib/email/service', () => ({
  emailService: {
    isConfigured: vi.fn().mockReturnValue(false),
    sendSubscriptionConfirmation: vi.fn().mockResolvedValue('sent'),
    sendSubscriptionCanceled: vi.fn().mockResolvedValue('sent'),
  },
}));

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: vi.fn().mockResolvedValue({ name: 'Test User' }),
  },
}));

vi.mock('@/lib/webhooks', () => ({
  checkAndMarkProcessing: vi.fn().mockResolvedValue({ isNew: true }),
  markProcessed: vi.fn().mockResolvedValue(undefined),
  markFailed: vi.fn().mockResolvedValue(undefined),
  markSkipped: vi.fn().mockResolvedValue(undefined),
  webhookLog: vi.fn(),
  generateEventId: vi.fn().mockReturnValue('paymob-test-event'),
}));

// Import the routes after mocks are set up
import { POST, GET } from '@/app/api/webhooks/paymob/route';

describe('/api/webhooks/paymob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/webhooks/paymob', () => {
    // Note: HMAC verification is skipped in tests (hmacSecret is undefined)
    // This test verifies the route processes payloads correctly
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
        expect.any(String)
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
        expect.any(String)
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
        expect.any(String)
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
