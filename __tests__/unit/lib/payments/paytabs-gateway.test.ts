/**
 * Unit tests for PayTabs Payment Gateway
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

// Mock RegionalSubscription model
const mockSubFindByTransactionId = vi.fn();
const mockSubFindActiveByUserId = vi.fn();
const mockSubSave = vi.fn();
const mockSubCancel = vi.fn();
const mockSubRenew = vi.fn();

vi.mock('@/lib/db/models/RegionalSubscription', () => ({
  RegionalSubscription: {
    findByTransactionId: (...args: unknown[]) => mockSubFindByTransactionId(...args),
    findActiveByUserId: (...args: unknown[]) => mockSubFindActiveByUserId(...args),
  },
  createRegionalSubscription: vi.fn().mockResolvedValue({
    userId: 'test@example.com',
    gateway: 'paytabs',
    gatewayTransactionId: 'txn_123',
    plan: 'pro',
    status: 'active',
  }),
  updateSubscriptionFromWebhook: vi.fn(),
}));

// Mock PayTabs client
const mockCreateCheckoutSession = vi.fn();
const mockVerifyCallbackSignature = vi.fn();
const mockParseCallbackData = vi.fn();

vi.mock('@/lib/payments/paytabs/client', () => ({
  paytabsClient: {
    createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
    verifyCallbackSignature: (...args: unknown[]) => mockVerifyCallbackSignature(...args),
    parseCallbackData: (...args: unknown[]) => mockParseCallbackData(...args),
  },
  PayTabsCallbackData: {},
}));

describe('PayTabs Gateway', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.PAYTABS_PROFILE_ID = 'profile_123';
    process.env.PAYTABS_SERVER_KEY = 'server_key_123';
    process.env.NEXTAUTH_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isConfigured', () => {
    it('should return true when PayTabs is configured', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');
      expect(paytabsGateway.isConfigured()).toBe(true);
    });

    it('should return false when PAYTABS_PROFILE_ID is not set', async () => {
      delete process.env.PAYTABS_PROFILE_ID;
      vi.resetModules();
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');
      expect(paytabsGateway.isConfigured()).toBe(false);
    });

    it('should return false when PAYTABS_SERVER_KEY is not set', async () => {
      delete process.env.PAYTABS_SERVER_KEY;
      vi.resetModules();
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');
      expect(paytabsGateway.isConfigured()).toBe(false);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockCreateCheckoutSession.mockResolvedValue({
        redirectUrl: 'https://secure.paytabs.com/payment/123',
        transactionRef: 'txn_ref_123',
      });

      const result = await paytabsGateway.createCheckoutSession({
        plan: 'pro',
        billing: 'monthly',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.url).toBe('https://secure.paytabs.com/payment/123');
      expect(result.sessionId).toBe('txn_ref_123');
      expect(result.gateway).toBe('paytabs');
    });

    it('should throw error when PayTabs is not configured', async () => {
      delete process.env.PAYTABS_PROFILE_ID;
      vi.resetModules();
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      await expect(
        paytabsGateway.createCheckoutSession({
          plan: 'pro',
          billing: 'monthly',
          userId: 'user-123',
          userEmail: 'test@example.com',
          userName: 'Test User',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('PayTabs is not configured');
    });

    it('should use email prefix as name when userName not provided', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockCreateCheckoutSession.mockResolvedValue({
        redirectUrl: 'https://secure.paytabs.com/payment/456',
        transactionRef: 'txn_ref_456',
      });

      await paytabsGateway.createCheckoutSession({
        plan: 'team',
        billing: 'yearly',
        userId: 'user-456',
        userEmail: 'jane.doe@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'jane.doe',
        })
      );
    });

    it('should include correct callback URL', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockCreateCheckoutSession.mockResolvedValue({
        redirectUrl: 'https://secure.paytabs.com/payment/789',
        transactionRef: 'txn_ref_789',
      });

      await paytabsGateway.createCheckoutSession({
        plan: 'enterprise',
        billing: 'monthly',
        userId: 'user-789',
        userEmail: 'test@example.com',
        userName: 'Test User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackUrl: 'https://example.com/api/webhooks/paytabs',
        })
      );
    });
  });

  describe('handleWebhook', () => {
    it('should return error when PayTabs is not configured', async () => {
      delete process.env.PAYTABS_PROFILE_ID;
      vi.resetModules();
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const result = await paytabsGateway.handleWebhook({}, 'signature');

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('PayTabs is not configured');
    });

    it('should return error for invalid signature', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockVerifyCallbackSignature.mockReturnValue(false);

      const result = await paytabsGateway.handleWebhook(
        { signature: 'invalid_sig' },
        'signature'
      );

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should handle successful payment', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockVerifyCallbackSignature.mockReturnValue(true);
      mockParseCallbackData.mockReturnValue({
        success: true,
        transactionRef: 'txn_success',
        amount: 299,
        currency: 'AED',
        customerEmail: 'success@example.com',
        userId: 'user-success',
        plan: 'pro',
        responseMessage: null,
      });
      mockFindByIdAndUpdate.mockResolvedValue({});

      const result = await paytabsGateway.handleWebhook(
        { tran_ref: 'txn_success' },
        'valid_signature'
      );

      expect(result.event).toBe('payment.success');
      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('txn_success');
      expect(result.status).toBe('succeeded');
      expect(result.userEmail).toBe('success@example.com');
      expect(result.plan).toBe('pro');
    });

    it('should handle failed payment', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockVerifyCallbackSignature.mockReturnValue(true);
      mockParseCallbackData.mockReturnValue({
        success: false,
        transactionRef: 'txn_failed',
        amount: 299,
        currency: 'AED',
        customerEmail: 'failed@example.com',
        responseMessage: 'Insufficient funds',
      });

      const result = await paytabsGateway.handleWebhook(
        { tran_ref: 'txn_failed' },
        'valid_signature'
      );

      expect(result.event).toBe('payment.failed');
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Insufficient funds');
    });

    it('should skip signature verification when no signature provided', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockVerifyCallbackSignature.mockReturnValue(true);
      mockParseCallbackData.mockReturnValue({
        success: true,
        transactionRef: 'txn_no_sig',
        amount: 299,
        currency: 'AED',
        customerEmail: 'test@example.com',
      });

      const result = await paytabsGateway.handleWebhook(
        {}, // No signature field
        'signature'
      );

      expect(result.success).toBe(true);
    });

    it('should convert amount to smallest unit', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockVerifyCallbackSignature.mockReturnValue(true);
      mockParseCallbackData.mockReturnValue({
        success: true,
        transactionRef: 'txn_amount',
        amount: 299.99,
        currency: 'AED',
        customerEmail: 'test@example.com',
      });

      const result = await paytabsGateway.handleWebhook(
        { tran_ref: 'txn_amount' },
        'signature'
      );

      expect(result.amount).toBe(29999); // 299.99 * 100
    });
  });

  describe('getSubscription', () => {
    it('should return subscription by transaction ID', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const mockSubscription = {
        userId: 'sub@example.com',
        gateway: 'paytabs',
        gatewayTransactionId: 'txn_ref_123',
        plan: 'pro',
        billing: 'monthly',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
        createdAt: new Date('2024-01-01'),
      };
      mockSubFindByTransactionId.mockResolvedValue(mockSubscription);

      const result = await paytabsGateway.getSubscription('txn_ref_123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('txn_ref_123');
      expect(result?.gateway).toBe('paytabs');
      expect(result?.plan).toBe('pro');
      expect(result?.status).toBe('active');
      expect(mockSubFindByTransactionId).toHaveBeenCalledWith('paytabs', 'txn_ref_123');
    });

    it('should return subscription by user ID if not found by transaction ID', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const mockSubscription = {
        userId: 'user@example.com',
        gateway: 'paytabs',
        gatewayTransactionId: 'txn_456',
        plan: 'team',
        billing: 'yearly',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2025-01-01'),
        cancelAtPeriodEnd: false,
        createdAt: new Date('2024-01-01'),
      };
      mockSubFindByTransactionId.mockResolvedValue(null);
      mockSubFindActiveByUserId.mockResolvedValue(mockSubscription);

      const result = await paytabsGateway.getSubscription('user@example.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('txn_456');
      expect(result?.plan).toBe('team');
      expect(mockSubFindActiveByUserId).toHaveBeenCalledWith('user@example.com', 'paytabs');
    });

    it('should return null for non-existent subscription', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockSubFindByTransactionId.mockResolvedValue(null);
      mockSubFindActiveByUserId.mockResolvedValue(null);

      const result = await paytabsGateway.getSubscription('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockSubFindByTransactionId.mockRejectedValue(new Error('Database error'));

      const result = await paytabsGateway.getSubscription('error');

      expect(result).toBeNull();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately by transaction ID', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const mockSubscription = {
        userId: 'user@example.com',
        cancel: mockSubCancel.mockResolvedValue(undefined),
      };
      mockSubFindByTransactionId.mockResolvedValue(mockSubscription);
      mockFindByIdAndUpdate.mockResolvedValue({});

      await paytabsGateway.cancelSubscription('txn_cancel', true);

      expect(mockSubFindByTransactionId).toHaveBeenCalledWith('paytabs', 'txn_cancel');
      expect(mockSubCancel).toHaveBeenCalledWith(true);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('user@example.com', {
        $set: { plan: 'free' },
      });
    });

    it('should cancel subscription at period end', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const mockSubscription = {
        userId: 'user@example.com',
        cancel: mockSubCancel.mockResolvedValue(undefined),
      };
      mockSubFindByTransactionId.mockResolvedValue(mockSubscription);

      await paytabsGateway.cancelSubscription('txn_cancel_end');

      expect(mockSubCancel).toHaveBeenCalledWith(false);
      expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should cancel subscription by user ID if not found by transaction ID', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const mockSubscription = {
        userId: 'user@example.com',
        cancel: mockSubCancel.mockResolvedValue(undefined),
      };
      mockSubFindByTransactionId.mockResolvedValue(null);
      mockSubFindActiveByUserId.mockResolvedValue(mockSubscription);

      await paytabsGateway.cancelSubscription('user@example.com');

      expect(mockSubFindActiveByUserId).toHaveBeenCalledWith('user@example.com', 'paytabs');
      expect(mockSubCancel).toHaveBeenCalledWith(false);
    });

    it('should throw error when subscription not found', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockSubFindByTransactionId.mockResolvedValue(null);
      mockSubFindActiveByUserId.mockResolvedValue(null);

      await expect(paytabsGateway.cancelSubscription('nonexistent')).rejects.toThrow(
        'Failed to cancel subscription'
      );
    });

    it('should throw error on database failure', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockSubFindByTransactionId.mockRejectedValue(new Error('Database error'));

      await expect(paytabsGateway.cancelSubscription('txn_error')).rejects.toThrow(
        'Failed to cancel subscription'
      );
    });
  });

  describe('getCustomer', () => {
    it('should return customer for existing user', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const mockUser = {
        _id: 'user-123',
        email: 'customer@example.com',
        name: 'PayTabs Customer',
        createdAt: new Date('2024-01-01'),
      };
      mockFindById.mockResolvedValue(mockUser);

      const result = await paytabsGateway.getCustomer('user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-123');
      expect(result?.gateway).toBe('paytabs');
      expect(result?.email).toBe('customer@example.com');
    });

    it('should return null for non-existent customer', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockFindById.mockResolvedValue(null);

      const result = await paytabsGateway.getCustomer('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      mockFindById.mockRejectedValue(new Error('Database error'));

      const result = await paytabsGateway.getCustomer('error');

      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('should create customer with provided details', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const result = await paytabsGateway.createCustomer(
        'new@example.com',
        'New PayTabs Customer',
        { userId: 'user-123' }
      );

      expect(result.id).toBe('new@example.com');
      expect(result.gateway).toBe('paytabs');
      expect(result.email).toBe('new@example.com');
      expect(result.name).toBe('New PayTabs Customer');
      expect(result.metadata).toEqual({ userId: 'user-123' });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create customer without name', async () => {
      const { paytabsGateway } = await import('@/lib/payments/paytabs/gateway');

      const result = await paytabsGateway.createCustomer('email@example.com');

      expect(result.email).toBe('email@example.com');
      expect(result.name).toBeUndefined();
    });
  });
});

describe('PayTabs Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isPayTabsConfigured', () => {
    it('should return true when configured', async () => {
      process.env.PAYTABS_PROFILE_ID = 'profile_123';
      process.env.PAYTABS_SERVER_KEY = 'server_key_123';
      const { isPayTabsConfigured } = await import('@/lib/payments/paytabs/config');
      expect(isPayTabsConfigured()).toBe(true);
    });

    it('should return false when not configured', async () => {
      delete process.env.PAYTABS_PROFILE_ID;
      delete process.env.PAYTABS_SERVER_KEY;
      const { isPayTabsConfigured } = await import('@/lib/payments/paytabs/config');
      expect(isPayTabsConfigured()).toBe(false);
    });
  });

  describe('getPayTabsAmount', () => {
    it('should return correct amounts for all plans', async () => {
      const { getPayTabsAmount } = await import('@/lib/payments/paytabs/config');

      // Pro plans
      expect(getPayTabsAmount('pro', 'monthly')).toBeDefined();
      expect(getPayTabsAmount('pro', 'yearly')).toBeDefined();

      // Team plans
      expect(getPayTabsAmount('team', 'monthly')).toBeDefined();
      expect(getPayTabsAmount('team', 'yearly')).toBeDefined();

      // Enterprise plans
      expect(getPayTabsAmount('enterprise', 'monthly')).toBeDefined();
      expect(getPayTabsAmount('enterprise', 'yearly')).toBeDefined();
    });
  });

  describe('getPayTabsCurrency', () => {
    it('should return correct currency for different regions', async () => {
      const { getPayTabsCurrency } = await import('@/lib/payments/paytabs/config');

      expect(getPayTabsCurrency('ARE')).toBe('AED'); // UAE
      expect(getPayTabsCurrency('SAU')).toBe('SAR'); // Saudi Arabia
      expect(getPayTabsCurrency('EGY')).toBe('EGP'); // Egypt
      expect(getPayTabsCurrency('GLOBAL')).toBe('USD'); // Global
    });

    it('should return USD for unknown regions', async () => {
      const { getPayTabsCurrency } = await import('@/lib/payments/paytabs/config');

      expect(getPayTabsCurrency('UNKNOWN')).toBe('USD');
    });
  });
});
