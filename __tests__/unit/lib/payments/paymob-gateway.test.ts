/**
 * Unit tests for Paymob Payment Gateway
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MongoDB connection
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock User model
const mockFindByIdAndUpdate = vi.fn();
const mockFindOne = vi.fn();
const mockFindById = vi.fn();
const mockFindOneAndUpdate = vi.fn();

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
    findOne: (...args: unknown[]) => mockFindOne(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    findOneAndUpdate: (...args: unknown[]) => mockFindOneAndUpdate(...args),
  },
}));

// Mock Paymob client
const mockCreateCheckoutSession = vi.fn();
const mockVerifyWebhookSignature = vi.fn();
const mockParseTransactionCallback = vi.fn();

vi.mock('@/lib/payments/paymob/client', () => ({
  paymobClient: {
    createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
    verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
    parseTransactionCallback: (...args: unknown[]) => mockParseTransactionCallback(...args),
  },
  PaymobTransactionCallback: {},
}));

describe('Paymob Gateway', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.PAYMOB_SECRET_KEY = 'test_secret_key';
    process.env.PAYMOB_INTEGRATION_ID_CARD = 'integration_123';
    process.env.PAYMOB_HMAC_SECRET = 'hmac_secret_123';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isConfigured', () => {
    it('should return true when Paymob is configured', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');
      expect(paymobGateway.isConfigured()).toBe(true);
    });

    it('should return false when PAYMOB_SECRET_KEY is not set', async () => {
      delete process.env.PAYMOB_SECRET_KEY;
      vi.resetModules();
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');
      expect(paymobGateway.isConfigured()).toBe(false);
    });

    it('should return false when integration IDs are not set', async () => {
      delete process.env.PAYMOB_INTEGRATION_ID_CARD;
      delete process.env.PAYMOB_INTEGRATION_ID_WALLET;
      vi.resetModules();
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');
      expect(paymobGateway.isConfigured()).toBe(false);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockCreateCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://accept.paymob.com/checkout/123',
        intentionId: 'intention_123',
        clientSecret: 'secret_123',
      });

      const result = await paymobGateway.createCheckoutSession({
        plan: 'pro',
        billing: 'monthly',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.url).toBe('https://accept.paymob.com/checkout/123');
      expect(result.sessionId).toBe('intention_123');
      expect(result.gateway).toBe('paymob');
      expect(result.clientSecret).toBe('secret_123');
    });

    it('should throw error when Paymob is not configured', async () => {
      delete process.env.PAYMOB_SECRET_KEY;
      vi.resetModules();
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      await expect(
        paymobGateway.createCheckoutSession({
          plan: 'pro',
          billing: 'monthly',
          userId: 'user-123',
          userEmail: 'test@example.com',
          userName: 'Test User',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Paymob is not configured');
    });

    it('should use email prefix as name when userName not provided', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockCreateCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://accept.paymob.com/checkout/456',
        intentionId: 'intention_456',
        clientSecret: 'secret_456',
      });

      await paymobGateway.createCheckoutSession({
        plan: 'team',
        billing: 'yearly',
        userId: 'user-456',
        userEmail: 'john.doe@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'john.doe',
        })
      );
    });
  });

  describe('handleWebhook', () => {
    it('should return error when Paymob is not configured', async () => {
      delete process.env.PAYMOB_SECRET_KEY;
      vi.resetModules();
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      const result = await paymobGateway.handleWebhook({}, 'signature');

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Paymob is not configured');
    });

    it('should return error for invalid signature', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockVerifyWebhookSignature.mockReturnValue(false);

      const result = await paymobGateway.handleWebhook(
        { obj: { id: '123' } },
        'invalid_signature'
      );

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should handle successful payment', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseTransactionCallback.mockReturnValue({
        success: true,
        transactionId: 'txn_123',
        amount: 29900,
        currency: 'EGP',
        billingEmail: 'test@example.com',
        isVoided: false,
        isRefunded: false,
        errorOccurred: false,
      });
      mockFindByIdAndUpdate.mockResolvedValue({});

      const result = await paymobGateway.handleWebhook(
        {
          obj: {
            id: 'txn_123',
            data: { plan: 'pro' },
          },
        },
        'valid_signature'
      );

      expect(result.event).toBe('payment.success');
      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('txn_123');
      expect(result.amount).toBe(29900);
      expect(result.status).toBe('succeeded');
    });

    it('should handle refunded payment', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseTransactionCallback.mockReturnValue({
        success: true,
        transactionId: 'txn_refund',
        amount: 29900,
        currency: 'EGP',
        isVoided: false,
        isRefunded: true,
        errorOccurred: false,
      });

      const result = await paymobGateway.handleWebhook(
        { obj: { id: 'txn_refund' } },
        'valid_signature'
      );

      expect(result.event).toBe('payment.refunded');
      expect(result.status).toBe('refunded');
    });

    it('should handle voided payment', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseTransactionCallback.mockReturnValue({
        success: true,
        transactionId: 'txn_void',
        amount: 29900,
        currency: 'EGP',
        isVoided: true,
        isRefunded: false,
        errorOccurred: false,
      });

      const result = await paymobGateway.handleWebhook(
        { obj: { id: 'txn_void' } },
        'valid_signature'
      );

      expect(result.event).toBe('payment.voided');
      expect(result.status).toBe('canceled');
    });

    it('should handle failed payment', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseTransactionCallback.mockReturnValue({
        success: false,
        transactionId: 'txn_failed',
        amount: 29900,
        currency: 'EGP',
        isVoided: false,
        isRefunded: false,
        errorOccurred: true,
      });

      const result = await paymobGateway.handleWebhook(
        { obj: { id: 'txn_failed' } },
        'valid_signature'
      );

      expect(result.event).toBe('payment.failed');
      expect(result.status).toBe('failed');
    });
  });

  describe('getSubscription', () => {
    it('should return subscription for existing user', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        plan: 'pro',
        createdAt: new Date('2024-01-01'),
      };
      mockFindOne.mockResolvedValue(mockUser);

      const result = await paymobGateway.getSubscription('sub_123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('sub_123');
      expect(result?.gateway).toBe('paymob');
      expect(result?.plan).toBe('pro');
      expect(result?.status).toBe('active');
    });

    it('should return null for non-existent subscription', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockFindOne.mockResolvedValue(null);

      const result = await paymobGateway.getSubscription('sub_nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockFindOne.mockRejectedValue(new Error('Database error'));

      const result = await paymobGateway.getSubscription('sub_error');

      expect(result).toBeNull();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockFindOneAndUpdate.mockResolvedValue({});

      await paymobGateway.cancelSubscription('sub_cancel', true);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { paymobSubscriptionId: 'sub_cancel' },
        {
          $set: { plan: 'free', paymobSubscriptionId: null },
        }
      );
    });

    it('should cancel subscription at period end', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockFindOneAndUpdate.mockResolvedValue({});

      await paymobGateway.cancelSubscription('sub_cancel_end');

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { paymobSubscriptionId: 'sub_cancel_end' },
        {
          $set: { cancelAtPeriodEnd: true },
        }
      );
    });

    it('should throw error on database failure', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockFindOneAndUpdate.mockRejectedValue(new Error('Database error'));

      await expect(paymobGateway.cancelSubscription('sub_error')).rejects.toThrow(
        'Failed to cancel subscription'
      );
    });
  });

  describe('getCustomer', () => {
    it('should return customer for existing user', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      const mockUser = {
        _id: 'user-123',
        email: 'customer@example.com',
        name: 'Test Customer',
        createdAt: new Date('2024-01-01'),
      };
      mockFindById.mockResolvedValue(mockUser);

      const result = await paymobGateway.getCustomer('user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-123');
      expect(result?.gateway).toBe('paymob');
      expect(result?.email).toBe('customer@example.com');
    });

    it('should return null for non-existent customer', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockFindById.mockResolvedValue(null);

      const result = await paymobGateway.getCustomer('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      mockFindById.mockRejectedValue(new Error('Database error'));

      const result = await paymobGateway.getCustomer('error');

      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('should create customer with provided details', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      const result = await paymobGateway.createCustomer(
        'new@example.com',
        'New Customer',
        { userId: 'user-123' }
      );

      expect(result.id).toBe('new@example.com');
      expect(result.gateway).toBe('paymob');
      expect(result.email).toBe('new@example.com');
      expect(result.name).toBe('New Customer');
      expect(result.metadata).toEqual({ userId: 'user-123' });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create customer without name', async () => {
      const { paymobGateway } = await import('@/lib/payments/paymob/gateway');

      const result = await paymobGateway.createCustomer('email@example.com');

      expect(result.email).toBe('email@example.com');
      expect(result.name).toBeUndefined();
    });
  });
});

describe('Paymob Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getPaymobAmount', () => {
    it('should return correct amounts for all plans', async () => {
      const { getPaymobAmount } = await import('@/lib/payments/paymob/config');

      expect(getPaymobAmount('pro', 'monthly')).toBe(29900);
      expect(getPaymobAmount('pro', 'yearly')).toBe(299900);
      expect(getPaymobAmount('team', 'monthly')).toBe(79900);
      expect(getPaymobAmount('team', 'yearly')).toBe(799900);
      expect(getPaymobAmount('enterprise', 'monthly')).toBe(249900);
      expect(getPaymobAmount('enterprise', 'yearly')).toBe(2499900);
    });
  });

  describe('getPaymobIntegrationId', () => {
    it('should return integration ID for plan', async () => {
      process.env.PAYMOB_INTEGRATION_ID_CARD = 'default_integration';
      const { getPaymobIntegrationId } = await import('@/lib/payments/paymob/config');

      const result = getPaymobIntegrationId('pro', 'monthly');
      expect(result).toBeDefined();
    });
  });
});
