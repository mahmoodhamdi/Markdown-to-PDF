/**
 * Unit tests for Paddle Payment Gateway
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MongoDB connection
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock User model
const mockFindByIdAndUpdate = vi.fn();

vi.mock('@/lib/db/models/User', () => ({
  User: {
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

// Mock Paddle client
const mockFindCustomerByEmail = vi.fn();
const mockCreateCustomer = vi.fn();
const mockGetCustomer = vi.fn();
const mockCreateTransaction = vi.fn();
const mockGetSubscription = vi.fn();
const mockCancelSubscription = vi.fn();
const mockPauseSubscription = vi.fn();
const mockResumeSubscription = vi.fn();
const mockUpdateSubscription = vi.fn();
const mockVerifyWebhookSignature = vi.fn();
const mockParseWebhookPayload = vi.fn();

vi.mock('@/lib/payments/paddle/client', () => ({
  paddleClient: {
    findCustomerByEmail: (...args: unknown[]) => mockFindCustomerByEmail(...args),
    createCustomer: (...args: unknown[]) => mockCreateCustomer(...args),
    getCustomer: (...args: unknown[]) => mockGetCustomer(...args),
    createTransaction: (...args: unknown[]) => mockCreateTransaction(...args),
    getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
    cancelSubscription: (...args: unknown[]) => mockCancelSubscription(...args),
    pauseSubscription: (...args: unknown[]) => mockPauseSubscription(...args),
    resumeSubscription: (...args: unknown[]) => mockResumeSubscription(...args),
    updateSubscription: (...args: unknown[]) => mockUpdateSubscription(...args),
    verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
    parseWebhookPayload: (...args: unknown[]) => mockParseWebhookPayload(...args),
  },
  PaddleSubscription: {},
}));

describe('Paddle Gateway', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.PADDLE_API_KEY = 'test_api_key';
    process.env.PADDLE_CLIENT_TOKEN = 'test_client_token';
    process.env.PADDLE_WEBHOOK_SECRET = 'test_webhook_secret';
    process.env.PADDLE_PRICE_PRO_MONTHLY = 'pri_pro_monthly';
    process.env.PADDLE_PRICE_PRO_YEARLY = 'pri_pro_yearly';
    process.env.PADDLE_PRICE_TEAM_MONTHLY = 'pri_team_monthly';
    process.env.PADDLE_PRICE_TEAM_YEARLY = 'pri_team_yearly';
    process.env.PADDLE_PRICE_ENTERPRISE_MONTHLY = 'pri_enterprise_monthly';
    process.env.PADDLE_PRICE_ENTERPRISE_YEARLY = 'pri_enterprise_yearly';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isConfigured', () => {
    it('should return true when Paddle is configured', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');
      expect(paddleGateway.isConfigured()).toBe(true);
    });

    it('should return false when PADDLE_API_KEY is not set', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');
      expect(paddleGateway.isConfigured()).toBe(false);
    });

    it('should return false when PADDLE_CLIENT_TOKEN is not set', async () => {
      delete process.env.PADDLE_CLIENT_TOKEN;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');
      expect(paddleGateway.isConfigured()).toBe(false);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session with existing customer', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockFindCustomerByEmail.mockResolvedValue({
        id: 'ctm_existing',
        email: 'test@example.com',
      });

      mockCreateTransaction.mockResolvedValue({
        id: 'txn_123',
        status: 'ready',
      });

      const result = await paddleGateway.createCheckoutSession({
        plan: 'pro',
        billing: 'monthly',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.sessionId).toBe('txn_123');
      expect(result.gateway).toBe('paddle');
      expect(result.clientSecret).toBe('txn_123');
      expect(mockCreateCustomer).not.toHaveBeenCalled();
    });

    it('should create checkout session with new customer', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockFindCustomerByEmail.mockResolvedValue(null);

      mockCreateCustomer.mockResolvedValue({
        id: 'ctm_new',
        email: 'new@example.com',
      });

      mockCreateTransaction.mockResolvedValue({
        id: 'txn_456',
        status: 'ready',
      });

      const result = await paddleGateway.createCheckoutSession({
        plan: 'team',
        billing: 'yearly',
        userId: 'user-456',
        userEmail: 'new@example.com',
        userName: 'New User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.sessionId).toBe('txn_456');
      expect(mockCreateCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          name: 'New User',
        })
      );
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(
        paddleGateway.createCheckoutSession({
          plan: 'pro',
          billing: 'monthly',
          userId: 'user-123',
          userEmail: 'test@example.com',
          userName: 'Test User',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Paddle is not configured');
    });

    it('should throw error for unconfigured price', async () => {
      delete process.env.PADDLE_PRICE_PRO_MONTHLY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(
        paddleGateway.createCheckoutSession({
          plan: 'pro',
          billing: 'monthly',
          userId: 'user-123',
          userEmail: 'test@example.com',
          userName: 'Test User',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Price not configured for pro monthly');
    });

    it('should include custom metadata in transaction', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockFindCustomerByEmail.mockResolvedValue({
        id: 'ctm_meta',
        email: 'meta@example.com',
      });

      mockCreateTransaction.mockResolvedValue({
        id: 'txn_meta',
        status: 'ready',
      });

      await paddleGateway.createCheckoutSession({
        plan: 'enterprise',
        billing: 'yearly',
        userId: 'user-meta',
        userEmail: 'meta@example.com',
        userName: 'Meta User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { customField: 'customValue' },
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customData: expect.objectContaining({
            customField: 'customValue',
            plan: 'enterprise',
          }),
        })
      );
    });
  });

  describe('handleWebhook', () => {
    it('should return error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      const result = await paddleGateway.handleWebhook({}, 'signature');

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Paddle is not configured');
    });

    it('should return error for invalid signature', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockVerifyWebhookSignature.mockReturnValue(false);

      const result = await paddleGateway.handleWebhook(
        { event_type: 'test' },
        'invalid_signature'
      );

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should handle subscription.created event', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseWebhookPayload.mockReturnValue({
        event_type: 'subscription.created',
        data: {
          id: 'sub_created',
          customer_id: 'ctm_created',
          status: 'active',
          custom_data: {
            userEmail: 'created@example.com',
            userId: 'user-created',
            plan: 'pro',
          },
        },
      });
      mockFindByIdAndUpdate.mockResolvedValue({});

      const result = await paddleGateway.handleWebhook(
        { event_type: 'subscription.created' },
        'valid_signature'
      );

      expect(result.event).toBe('subscription.created');
      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe('sub_created');
      expect(result.status).toBe('active');
      expect(result.plan).toBe('pro');
    });

    it('should handle subscription.canceled event', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseWebhookPayload.mockReturnValue({
        event_type: 'subscription.canceled',
        data: {
          id: 'sub_canceled',
          customer_id: 'ctm_canceled',
          custom_data: {
            userEmail: 'canceled@example.com',
          },
        },
      });
      mockFindByIdAndUpdate.mockResolvedValue({});

      const result = await paddleGateway.handleWebhook(
        { event_type: 'subscription.canceled' },
        'valid_signature'
      );

      expect(result.event).toBe('subscription.canceled');
      expect(result.status).toBe('canceled');
      expect(result.plan).toBe('free');
    });

    it('should handle subscription.past_due event', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseWebhookPayload.mockReturnValue({
        event_type: 'subscription.past_due',
        data: {
          id: 'sub_past_due',
          customer_id: 'ctm_past_due',
          custom_data: {
            userEmail: 'pastdue@example.com',
          },
        },
      });

      const result = await paddleGateway.handleWebhook(
        { event_type: 'subscription.past_due' },
        'valid_signature'
      );

      expect(result.event).toBe('subscription.past_due');
      expect(result.status).toBe('past_due');
    });

    it('should handle transaction.completed event', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseWebhookPayload.mockReturnValue({
        event_type: 'transaction.completed',
        data: {
          id: 'txn_completed',
          customer_id: 'ctm_completed',
          status: 'completed',
          details: {
            totals: {
              total: '2999',
              currency_code: 'USD',
            },
          },
          custom_data: {
            userEmail: 'completed@example.com',
          },
        },
      });

      const result = await paddleGateway.handleWebhook(
        { event_type: 'transaction.completed' },
        'valid_signature'
      );

      expect(result.event).toBe('transaction.completed');
      expect(result.status).toBe('succeeded');
      expect(result.paymentId).toBe('txn_completed');
      expect(result.amount).toBe(2999);
      expect(result.currency).toBe('USD');
    });

    it('should handle transaction.payment_failed event', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseWebhookPayload.mockReturnValue({
        event_type: 'transaction.payment_failed',
        data: {
          id: 'txn_failed',
          customer_id: 'ctm_failed',
          custom_data: {
            userEmail: 'failed@example.com',
          },
        },
      });

      const result = await paddleGateway.handleWebhook(
        { event_type: 'transaction.payment_failed' },
        'valid_signature'
      );

      expect(result.event).toBe('transaction.payment_failed');
      expect(result.status).toBe('failed');
    });

    it('should handle unknown event types', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockVerifyWebhookSignature.mockReturnValue(true);
      mockParseWebhookPayload.mockReturnValue({
        event_type: 'some.unknown.event',
        data: {},
      });

      const result = await paddleGateway.handleWebhook(
        { event_type: 'some.unknown.event' },
        'valid_signature'
      );

      expect(result.event).toBe('some.unknown.event');
      expect(result.success).toBe(true);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription for valid ID', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockGetSubscription.mockResolvedValue({
        id: 'sub_test',
        customerId: 'ctm_test',
        status: 'active',
        billingCycle: { interval: 'month' },
        currentBillingPeriod: {
          startsAt: '2024-01-01T00:00:00Z',
          endsAt: '2024-02-01T00:00:00Z',
        },
        customData: {
          userEmail: 'test@example.com',
          plan: 'pro',
        },
        createdAt: '2024-01-01T00:00:00Z',
      });

      const result = await paddleGateway.getSubscription('sub_test');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('sub_test');
      expect(result?.gateway).toBe('paddle');
      expect(result?.status).toBe('active');
      expect(result?.billing).toBe('monthly');
    });

    it('should return null for non-existent subscription', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockGetSubscription.mockResolvedValue(null);

      const result = await paddleGateway.getSubscription('sub_nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(paddleGateway.getSubscription('sub_123')).rejects.toThrow(
        'Paddle is not configured'
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockCancelSubscription.mockResolvedValue({});

      await paddleGateway.cancelSubscription('sub_cancel', true);

      expect(mockCancelSubscription).toHaveBeenCalledWith('sub_cancel', 'immediately');
    });

    it('should cancel subscription at period end', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockCancelSubscription.mockResolvedValue({});

      await paddleGateway.cancelSubscription('sub_cancel_end');

      expect(mockCancelSubscription).toHaveBeenCalledWith(
        'sub_cancel_end',
        'next_billing_period'
      );
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(paddleGateway.cancelSubscription('sub_123')).rejects.toThrow(
        'Paddle is not configured'
      );
    });
  });

  describe('getCustomer', () => {
    it('should return customer for valid ID', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockGetCustomer.mockResolvedValue({
        id: 'ctm_test',
        email: 'customer@example.com',
        name: 'Test Customer',
        customData: { userId: 'user-123' },
        createdAt: '2024-01-01T00:00:00Z',
      });

      const result = await paddleGateway.getCustomer('ctm_test');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('ctm_test');
      expect(result?.gateway).toBe('paddle');
      expect(result?.email).toBe('customer@example.com');
    });

    it('should return null for non-existent customer', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockGetCustomer.mockResolvedValue(null);

      const result = await paddleGateway.getCustomer('ctm_nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(paddleGateway.getCustomer('ctm_123')).rejects.toThrow(
        'Paddle is not configured'
      );
    });
  });

  describe('createCustomer', () => {
    it('should create customer with provided details', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockCreateCustomer.mockResolvedValue({
        id: 'ctm_new',
        email: 'new@example.com',
        name: 'New Customer',
        customData: { userId: 'user-new' },
        createdAt: '2024-01-01T00:00:00Z',
      });

      const result = await paddleGateway.createCustomer(
        'new@example.com',
        'New Customer',
        { userId: 'user-new' }
      );

      expect(result.id).toBe('ctm_new');
      expect(result.gateway).toBe('paddle');
      expect(result.email).toBe('new@example.com');
      expect(mockCreateCustomer).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'New Customer',
        customData: { userId: 'user-new' },
      });
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(paddleGateway.createCustomer('test@example.com')).rejects.toThrow(
        'Paddle is not configured'
      );
    });
  });

  describe('pauseSubscription', () => {
    it('should pause subscription', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockPauseSubscription.mockResolvedValue({});

      await paddleGateway.pauseSubscription!('sub_pause');

      expect(mockPauseSubscription).toHaveBeenCalledWith('sub_pause');
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(paddleGateway.pauseSubscription!('sub_123')).rejects.toThrow(
        'Paddle is not configured'
      );
    });
  });

  describe('resumeSubscription', () => {
    it('should resume subscription', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockResumeSubscription.mockResolvedValue({});

      await paddleGateway.resumeSubscription!('sub_resume');

      expect(mockResumeSubscription).toHaveBeenCalledWith('sub_resume');
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(paddleGateway.resumeSubscription!('sub_123')).rejects.toThrow(
        'Paddle is not configured'
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription plan', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      mockUpdateSubscription.mockResolvedValue({
        id: 'sub_update',
        customerId: 'ctm_update',
        status: 'active',
        billingCycle: { interval: 'year' },
        currentBillingPeriod: {
          startsAt: '2024-01-01T00:00:00Z',
          endsAt: '2025-01-01T00:00:00Z',
        },
        customData: {
          userEmail: 'update@example.com',
          plan: 'team',
        },
        createdAt: '2024-01-01T00:00:00Z',
      });

      const result = await paddleGateway.updateSubscription!('sub_update', 'team', 'yearly');

      expect(result.id).toBe('sub_update');
      expect(result.plan).toBe('team');
      expect(result.billing).toBe('yearly');
      expect(mockUpdateSubscription).toHaveBeenCalledWith('sub_update', {
        priceId: 'pri_team_yearly',
        customData: { plan: 'team' },
        prorationBillingMode: 'prorated_immediately',
      });
    });

    it('should throw error when Paddle is not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(
        paddleGateway.updateSubscription!('sub_123', 'pro', 'monthly')
      ).rejects.toThrow('Paddle is not configured');
    });

    it('should throw error for unconfigured price', async () => {
      delete process.env.PADDLE_PRICE_TEAM_YEARLY;
      vi.resetModules();
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      await expect(
        paddleGateway.updateSubscription!('sub_123', 'team', 'yearly')
      ).rejects.toThrow('Price not configured for team yearly');
    });
  });

  describe('mapSubscriptionStatus', () => {
    it('should map all Paddle subscription statuses correctly', async () => {
      const { paddleGateway } = await import('@/lib/payments/paddle/gateway');

      // Test different statuses through getSubscription
      const statusTests = [
        { paddleStatus: 'active', expectedStatus: 'active' },
        { paddleStatus: 'canceled', expectedStatus: 'canceled' },
        { paddleStatus: 'past_due', expectedStatus: 'past_due' },
        { paddleStatus: 'paused', expectedStatus: 'paused' },
        { paddleStatus: 'trialing', expectedStatus: 'trialing' },
        { paddleStatus: 'unknown', expectedStatus: 'incomplete' },
      ];

      for (const test of statusTests) {
        mockGetSubscription.mockResolvedValueOnce({
          id: 'sub_status_test',
          customerId: 'ctm_test',
          status: test.paddleStatus,
          billingCycle: { interval: 'month' },
          currentBillingPeriod: {
            startsAt: '2024-01-01T00:00:00Z',
            endsAt: '2024-02-01T00:00:00Z',
          },
          customData: {},
          createdAt: '2024-01-01T00:00:00Z',
        });

        const result = await paddleGateway.getSubscription('sub_status_test');
        expect(result?.status).toBe(test.expectedStatus);
      }
    });
  });
});

describe('Paddle Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isPaddleConfigured', () => {
    it('should return true when configured', async () => {
      process.env.PADDLE_API_KEY = 'test_api_key';
      process.env.PADDLE_CLIENT_TOKEN = 'test_client_token';
      const { isPaddleConfigured } = await import('@/lib/payments/paddle/config');
      expect(isPaddleConfigured()).toBe(true);
    });

    it('should return false when not configured', async () => {
      delete process.env.PADDLE_API_KEY;
      delete process.env.PADDLE_CLIENT_TOKEN;
      const { isPaddleConfigured } = await import('@/lib/payments/paddle/config');
      expect(isPaddleConfigured()).toBe(false);
    });
  });

  describe('getPaddlePriceId', () => {
    it('should return price ID for all plans', async () => {
      process.env.PADDLE_PRICE_PRO_MONTHLY = 'pri_pm';
      process.env.PADDLE_PRICE_PRO_YEARLY = 'pri_py';
      process.env.PADDLE_PRICE_TEAM_MONTHLY = 'pri_tm';
      process.env.PADDLE_PRICE_TEAM_YEARLY = 'pri_ty';
      process.env.PADDLE_PRICE_ENTERPRISE_MONTHLY = 'pri_em';
      process.env.PADDLE_PRICE_ENTERPRISE_YEARLY = 'pri_ey';

      const { getPaddlePriceId } = await import('@/lib/payments/paddle/config');

      expect(getPaddlePriceId('pro', 'monthly')).toBe('pri_pm');
      expect(getPaddlePriceId('pro', 'yearly')).toBe('pri_py');
      expect(getPaddlePriceId('team', 'monthly')).toBe('pri_tm');
      expect(getPaddlePriceId('team', 'yearly')).toBe('pri_ty');
      expect(getPaddlePriceId('enterprise', 'monthly')).toBe('pri_em');
      expect(getPaddlePriceId('enterprise', 'yearly')).toBe('pri_ey');
    });

    it('should return null for unconfigured prices', async () => {
      delete process.env.PADDLE_PRICE_PRO_MONTHLY;
      const { getPaddlePriceId } = await import('@/lib/payments/paddle/config');
      expect(getPaddlePriceId('pro', 'monthly')).toBeNull();
    });
  });
});
