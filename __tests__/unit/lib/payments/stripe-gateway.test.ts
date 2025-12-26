/**
 * Unit tests for Stripe Payment Gateway
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Stripe module
const mockCustomersList = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCustomersRetrieve = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockSubscriptionsUpdate = vi.fn();
const mockSubscriptionsCancel = vi.fn();
const mockBillingPortalSessionsCreate = vi.fn();
const mockWebhooksConstructEvent = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        list: mockCustomersList,
        create: mockCustomersCreate,
        retrieve: mockCustomersRetrieve,
      },
      checkout: {
        sessions: {
          create: mockCheckoutSessionsCreate,
        },
      },
      subscriptions: {
        retrieve: mockSubscriptionsRetrieve,
        update: mockSubscriptionsUpdate,
        cancel: mockSubscriptionsCancel,
      },
      billingPortal: {
        sessions: {
          create: mockBillingPortalSessionsCreate,
        },
      },
      webhooks: {
        constructEvent: mockWebhooksConstructEvent,
      },
    })),
  };
});

describe('Stripe Gateway', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_monthly';
    process.env.STRIPE_PRICE_PRO_YEARLY = 'price_pro_yearly';
    process.env.STRIPE_PRICE_TEAM_MONTHLY = 'price_team_monthly';
    process.env.STRIPE_PRICE_TEAM_YEARLY = 'price_team_yearly';
    process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY = 'price_enterprise_monthly';
    process.env.STRIPE_PRICE_ENTERPRISE_YEARLY = 'price_enterprise_yearly';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isConfigured', () => {
    it('should return true when Stripe is configured', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');
      expect(stripeGateway.isConfigured()).toBe(true);
    });

    it('should return false when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');
      expect(stripeGateway.isConfigured()).toBe(false);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for existing customer', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockCustomersList.mockResolvedValue({
        data: [{ id: 'cus_existing123' }],
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session123',
        id: 'cs_test_123',
        client_secret: 'secret_123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      const result = await stripeGateway.createCheckoutSession({
        plan: 'pro',
        billing: 'monthly',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.url).toBe('https://checkout.stripe.com/session123');
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.gateway).toBe('stripe');
      expect(mockCustomersCreate).not.toHaveBeenCalled();
    });

    it('should create new customer when not found', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockCustomersList.mockResolvedValue({
        data: [],
      });

      mockCustomersCreate.mockResolvedValue({
        id: 'cus_new123',
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session456',
        id: 'cs_test_456',
        client_secret: null,
        expires_at: null,
      });

      const result = await stripeGateway.createCheckoutSession({
        plan: 'team',
        billing: 'yearly',
        userId: 'user-456',
        userEmail: 'new@example.com',
        userName: 'New User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.url).toBe('https://checkout.stripe.com/session456');
      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          name: 'New User',
        })
      );
    });

    it('should throw error when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      await expect(
        stripeGateway.createCheckoutSession({
          plan: 'pro',
          billing: 'monthly',
          userId: 'user-123',
          userEmail: 'test@example.com',
          userName: 'Test User',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Stripe is not configured');
    });

    it('should throw error for unconfigured price', async () => {
      delete process.env.STRIPE_PRICE_PRO_MONTHLY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      await expect(
        stripeGateway.createCheckoutSession({
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

    it('should include custom metadata in checkout session', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockCustomersList.mockResolvedValue({
        data: [{ id: 'cus_existing123' }],
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session789',
        id: 'cs_test_789',
        client_secret: null,
        expires_at: null,
      });

      await stripeGateway.createCheckoutSession({
        plan: 'pro',
        billing: 'monthly',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { customField: 'customValue' },
      });

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user-123',
            customField: 'customValue',
          }),
        })
      );
    });

    it('should set correct locale for checkout session', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockCustomersList.mockResolvedValue({
        data: [{ id: 'cus_existing123' }],
      });

      mockCheckoutSessionsCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session',
        id: 'cs_test',
        client_secret: null,
        expires_at: null,
      });

      await stripeGateway.createCheckoutSession({
        plan: 'pro',
        billing: 'monthly',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        locale: 'ar',
      });

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'ar',
        })
      );
    });
  });

  describe('handleWebhook', () => {
    it('should return error when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      const result = await stripeGateway.handleWebhook('payload', 'signature');

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Stripe is not configured');
    });

    it('should return error when webhook secret is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      const result = await stripeGateway.handleWebhook('payload', 'signature');

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Webhook secret not configured');
    });

    it('should return error on signature verification failure', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      const result = await stripeGateway.handleWebhook('payload', 'invalid_signature');

      expect(result.event).toBe('error');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Webhook signature verification failed');
    });

    it('should handle checkout.session.completed event', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockWebhooksConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              userEmail: 'test@example.com',
              userId: 'user-123',
              plan: 'pro',
            },
            customer_email: 'test@example.com',
            subscription: 'sub_123',
            customer: 'cus_123',
          },
        },
      });

      const result = await stripeGateway.handleWebhook('payload', 'valid_signature');

      expect(result.event).toBe('checkout.session.completed');
      expect(result.success).toBe(true);
      expect(result.userEmail).toBe('test@example.com');
      expect(result.userId).toBe('user-123');
      expect(result.plan).toBe('pro');
      expect(result.subscriptionId).toBe('sub_123');
      expect(result.status).toBe('active');
    });

    it('should handle customer.subscription.updated event', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockWebhooksConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_456',
            customer: 'cus_456',
            metadata: {
              userEmail: 'updated@example.com',
              plan: 'team',
            },
            status: 'active',
          },
        },
      });

      const result = await stripeGateway.handleWebhook('payload', 'valid_signature');

      expect(result.event).toBe('customer.subscription.updated');
      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe('sub_456');
      expect(result.status).toBe('active');
    });

    it('should handle customer.subscription.deleted event', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockWebhooksConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_789',
            customer: 'cus_789',
            metadata: {
              userEmail: 'deleted@example.com',
            },
          },
        },
      });

      const result = await stripeGateway.handleWebhook('payload', 'valid_signature');

      expect(result.event).toBe('customer.subscription.deleted');
      expect(result.success).toBe(true);
      expect(result.status).toBe('canceled');
      expect(result.plan).toBe('free');
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockWebhooksConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_payment',
            customer_email: 'payment@example.com',
            payment_intent: 'pi_123',
            amount_paid: 2999,
            currency: 'usd',
          },
        },
      });

      const result = await stripeGateway.handleWebhook('payload', 'valid_signature');

      expect(result.event).toBe('invoice.payment_succeeded');
      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pi_123');
      expect(result.amount).toBe(2999);
      expect(result.currency).toBe('USD');
      expect(result.status).toBe('succeeded');
    });

    it('should handle invoice.payment_failed event', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockWebhooksConstructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_failed',
            customer_email: 'failed@example.com',
            payment_intent: 'pi_failed',
          },
        },
      });

      const result = await stripeGateway.handleWebhook('payload', 'valid_signature');

      expect(result.event).toBe('invoice.payment_failed');
      expect(result.success).toBe(true);
      expect(result.status).toBe('failed');
    });

    it('should handle unhandled event types gracefully', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockWebhooksConstructEvent.mockReturnValue({
        type: 'some.unknown.event',
        data: {
          object: {},
        },
      });

      const result = await stripeGateway.handleWebhook('payload', 'valid_signature');

      expect(result.event).toBe('some.unknown.event');
      expect(result.success).toBe(true);
    });
  });

  describe('getSubscription', () => {
    it('should retrieve subscription by ID', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      const mockDate = Math.floor(Date.now() / 1000);
      mockSubscriptionsRetrieve.mockResolvedValue({
        id: 'sub_test123',
        customer: 'cus_test123',
        metadata: {
          userEmail: 'sub@example.com',
          plan: 'pro',
        },
        status: 'active',
        items: {
          data: [
            {
              price: {
                recurring: { interval: 'month' },
              },
            },
          ],
        },
        current_period_start: mockDate - 86400,
        current_period_end: mockDate + 86400 * 30,
        cancel_at_period_end: false,
        canceled_at: null,
        created: mockDate - 86400 * 30,
      });

      const result = await stripeGateway.getSubscription('sub_test123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('sub_test123');
      expect(result?.gateway).toBe('stripe');
      expect(result?.status).toBe('active');
      expect(result?.billing).toBe('monthly');
    });

    it('should return null for non-existent subscription', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockSubscriptionsRetrieve.mockRejectedValue(new Error('Subscription not found'));

      const result = await stripeGateway.getSubscription('sub_nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      await expect(stripeGateway.getSubscription('sub_123')).rejects.toThrow(
        'Stripe is not configured'
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockSubscriptionsCancel.mockResolvedValue({});

      await stripeGateway.cancelSubscription('sub_cancel123', true);

      expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_cancel123');
    });

    it('should cancel subscription at period end by default', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockSubscriptionsUpdate.mockResolvedValue({});

      await stripeGateway.cancelSubscription('sub_cancel456');

      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_cancel456', {
        cancel_at_period_end: true,
      });
    });

    it('should throw error when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      await expect(stripeGateway.cancelSubscription('sub_123')).rejects.toThrow(
        'Stripe is not configured'
      );
    });
  });

  describe('getCustomer', () => {
    it('should retrieve customer by ID', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      const mockDate = Math.floor(Date.now() / 1000);
      mockCustomersRetrieve.mockResolvedValue({
        id: 'cus_test123',
        email: 'customer@example.com',
        name: 'Test Customer',
        phone: '+1234567890',
        metadata: { key: 'value' },
        created: mockDate,
        deleted: false,
      });

      const result = await stripeGateway.getCustomer('cus_test123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cus_test123');
      expect(result?.gateway).toBe('stripe');
      expect(result?.email).toBe('customer@example.com');
      expect(result?.name).toBe('Test Customer');
    });

    it('should return null for deleted customer', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockCustomersRetrieve.mockResolvedValue({
        id: 'cus_deleted',
        deleted: true,
      });

      const result = await stripeGateway.getCustomer('cus_deleted');

      expect(result).toBeNull();
    });

    it('should return null for non-existent customer', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockCustomersRetrieve.mockRejectedValue(new Error('Customer not found'));

      const result = await stripeGateway.getCustomer('cus_nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      const mockDate = Math.floor(Date.now() / 1000);
      mockCustomersCreate.mockResolvedValue({
        id: 'cus_new123',
        email: 'new@example.com',
        name: 'New Customer',
        metadata: { userId: 'user-123' },
        created: mockDate,
      });

      const result = await stripeGateway.createCustomer(
        'new@example.com',
        'New Customer',
        { userId: 'user-123' }
      );

      expect(result.id).toBe('cus_new123');
      expect(result.gateway).toBe('stripe');
      expect(result.email).toBe('new@example.com');
      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'New Customer',
        metadata: { userId: 'user-123' },
      });
    });

    it('should throw error when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      await expect(stripeGateway.createCustomer('test@example.com')).rejects.toThrow(
        'Stripe is not configured'
      );
    });
  });

  describe('pauseSubscription', () => {
    it('should pause subscription', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockSubscriptionsUpdate.mockResolvedValue({});

      await stripeGateway.pauseSubscription!('sub_pause123');

      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_pause123', {
        pause_collection: {
          behavior: 'mark_uncollectible',
        },
      });
    });
  });

  describe('resumeSubscription', () => {
    it('should resume subscription', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockSubscriptionsUpdate.mockResolvedValue({});

      await stripeGateway.resumeSubscription!('sub_resume123');

      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_resume123', {
        pause_collection: '',
      });
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription plan', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      const mockDate = Math.floor(Date.now() / 1000);
      mockSubscriptionsRetrieve.mockResolvedValue({
        id: 'sub_update123',
        customer: 'cus_update123',
        metadata: { userEmail: 'update@example.com' },
        status: 'active',
        items: {
          data: [{ id: 'si_item123', price: { recurring: { interval: 'month' } } }],
        },
        current_period_start: mockDate,
        current_period_end: mockDate + 86400 * 30,
        cancel_at_period_end: false,
        canceled_at: null,
        created: mockDate - 86400 * 30,
      });

      mockSubscriptionsUpdate.mockResolvedValue({
        id: 'sub_update123',
        customer: 'cus_update123',
        metadata: { userEmail: 'update@example.com', plan: 'team' },
        status: 'active',
        items: {
          data: [{ price: { recurring: { interval: 'year' } } }],
        },
        current_period_start: mockDate,
        current_period_end: mockDate + 86400 * 365,
        cancel_at_period_end: false,
        canceled_at: null,
        created: mockDate - 86400 * 30,
      });

      const result = await stripeGateway.updateSubscription!('sub_update123', 'team', 'yearly');

      expect(result.id).toBe('sub_update123');
      expect(result.plan).toBe('team');
      expect(result.billing).toBe('yearly');
      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
        'sub_update123',
        expect.objectContaining({
          items: [{ id: 'si_item123', price: 'price_team_yearly' }],
          proration_behavior: 'create_prorations',
        })
      );
    });
  });

  describe('getCustomerPortalUrl', () => {
    it('should create billing portal session', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      mockBillingPortalSessionsCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/portal/session123',
      });

      const result = await stripeGateway.getCustomerPortalUrl!(
        'cus_portal123',
        'https://example.com/account'
      );

      expect(result).toBe('https://billing.stripe.com/portal/session123');
      expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
        customer: 'cus_portal123',
        return_url: 'https://example.com/account',
      });
    });

    it('should throw error when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      await expect(
        stripeGateway.getCustomerPortalUrl!('cus_123', 'https://example.com')
      ).rejects.toThrow('Stripe is not configured');
    });
  });

  describe('mapSubscriptionStatus', () => {
    it('should map all Stripe subscription statuses correctly', async () => {
      const { stripeGateway } = await import('@/lib/payments/stripe/gateway');

      // Test different statuses through getSubscription
      const statusTests = [
        { stripeStatus: 'active', expectedStatus: 'active' },
        { stripeStatus: 'past_due', expectedStatus: 'past_due' },
        { stripeStatus: 'canceled', expectedStatus: 'canceled' },
        { stripeStatus: 'paused', expectedStatus: 'paused' },
        { stripeStatus: 'trialing', expectedStatus: 'trialing' },
        { stripeStatus: 'incomplete', expectedStatus: 'incomplete' },
        { stripeStatus: 'incomplete_expired', expectedStatus: 'incomplete_expired' },
        { stripeStatus: 'unpaid', expectedStatus: 'past_due' },
      ];

      for (const test of statusTests) {
        const mockDate = Math.floor(Date.now() / 1000);
        mockSubscriptionsRetrieve.mockResolvedValueOnce({
          id: 'sub_status_test',
          customer: 'cus_test',
          metadata: {},
          status: test.stripeStatus,
          items: { data: [{ price: { recurring: { interval: 'month' } } }] },
          current_period_start: mockDate,
          current_period_end: mockDate + 86400,
          cancel_at_period_end: false,
          canceled_at: null,
          created: mockDate,
        });

        const result = await stripeGateway.getSubscription('sub_status_test');
        expect(result?.status).toBe(test.expectedStatus);
      }
    });
  });
});
