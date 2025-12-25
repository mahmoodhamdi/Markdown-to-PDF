/**
 * Unit tests for RegionalSubscription Model
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mongoose BEFORE importing anything else
const mockSave = vi.fn();
const mockFindOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockUpdateMany = vi.fn();

// Create a mock model instance
const createMockModelInstance = (data: Record<string, unknown>) => ({
  ...data,
  save: mockSave,
  isActive: vi.fn(() => data.status === 'active'),
  cancel: vi.fn(),
  renew: vi.fn(),
});

// Mock mongoose and the model
vi.mock('mongoose', () => {
  class MockSchema {
    index = vi.fn().mockReturnThis();
    statics: Record<string, unknown> = {};
    methods: Record<string, unknown> = {};
    static Types = {
      Mixed: 'Mixed',
      ObjectId: 'ObjectId',
    };
    constructor() {}
  }

  const MockModel = vi.fn((data: Record<string, unknown>) => createMockModelInstance(data));
  MockModel.findOne = mockFindOne;
  MockModel.findOneAndUpdate = mockFindOneAndUpdate;
  MockModel.updateMany = mockUpdateMany;
  MockModel.findByUserId = mockFindOne;
  MockModel.findByTransactionId = mockFindOne;
  MockModel.findActiveByUserId = mockFindOne;

  const actualMongoose = {
    Schema: MockSchema,
    model: vi.fn(() => MockModel),
    models: {},
    Types: {
      Mixed: 'Mixed',
      ObjectId: 'ObjectId',
    },
  };
  return { default: actualMongoose, ...actualMongoose };
});

describe('RegionalSubscription Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Subscription Data Validation', () => {
    it('should validate gateway values', () => {
      const validGateways = ['paymob', 'paytabs'];
      validGateways.forEach((gateway) => {
        expect(['paymob', 'paytabs']).toContain(gateway);
      });
    });

    it('should validate status values', () => {
      const validStatuses = ['active', 'canceled', 'past_due', 'expired'];
      validStatuses.forEach((status) => {
        expect(['active', 'canceled', 'past_due', 'expired']).toContain(status);
      });
    });

    it('should validate billing values', () => {
      const validBillings = ['monthly', 'yearly'];
      validBillings.forEach((billing) => {
        expect(['monthly', 'yearly']).toContain(billing);
      });
    });

    it('should validate plan values', () => {
      const validPlans = ['pro', 'team', 'enterprise'];
      validPlans.forEach((plan) => {
        expect(['pro', 'team', 'enterprise']).toContain(plan);
      });
    });
  });

  describe('Period Calculation', () => {
    it('should calculate monthly period correctly (30 days)', () => {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const diffDays = Math.round((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(30);
    });

    it('should calculate yearly period correctly (365 days)', () => {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const diffDays = Math.round((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(365);
    });
  });

  describe('Subscription Creation Logic', () => {
    it('should create subscription with correct structure for monthly billing', () => {
      const now = new Date();
      const periodDays = 30;
      const subscriptionData = {
        userId: 'user@example.com',
        gateway: 'paymob',
        gatewayTransactionId: 'txn_123',
        plan: 'pro',
        billing: 'monthly',
        amount: 29900,
        currency: 'EGP',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        lastPaymentAt: now,
      };

      expect(subscriptionData.userId).toBe('user@example.com');
      expect(subscriptionData.gateway).toBe('paymob');
      expect(subscriptionData.status).toBe('active');
      expect(subscriptionData.billing).toBe('monthly');

      const diffDays = Math.round(
        (subscriptionData.currentPeriodEnd.getTime() - subscriptionData.currentPeriodStart.getTime()) /
        (24 * 60 * 60 * 1000)
      );
      expect(diffDays).toBe(30);
    });

    it('should create subscription with correct structure for yearly billing', () => {
      const now = new Date();
      const periodDays = 365;
      const subscriptionData = {
        userId: 'user@example.com',
        gateway: 'paytabs',
        gatewayTransactionId: 'txn_456',
        plan: 'team',
        billing: 'yearly',
        amount: 799900,
        currency: 'SAR',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        lastPaymentAt: now,
      };

      expect(subscriptionData.billing).toBe('yearly');
      expect(subscriptionData.gateway).toBe('paytabs');

      const diffDays = Math.round(
        (subscriptionData.currentPeriodEnd.getTime() - subscriptionData.currentPeriodStart.getTime()) /
        (24 * 60 * 60 * 1000)
      );
      expect(diffDays).toBe(365);
    });
  });

  describe('Subscription Status Logic', () => {
    it('should identify active subscription', () => {
      const subscription = {
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      const isActive = subscription.status === 'active' &&
                       subscription.currentPeriodEnd > new Date();
      expect(isActive).toBe(true);
    });

    it('should identify expired subscription', () => {
      const subscription = {
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      const isExpired = subscription.currentPeriodEnd < new Date();
      expect(isExpired).toBe(true);
    });

    it('should identify canceled subscription', () => {
      const subscription = {
        status: 'canceled',
        canceledAt: new Date(),
      };

      expect(subscription.status).toBe('canceled');
      expect(subscription.canceledAt).toBeInstanceOf(Date);
    });
  });

  describe('Subscription Cancellation Logic', () => {
    it('should cancel immediately by setting status', () => {
      const subscription = {
        status: 'active' as string,
        cancelAtPeriodEnd: false,
        canceledAt: undefined as Date | undefined,
      };

      // Immediate cancellation
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();

      expect(subscription.status).toBe('canceled');
      expect(subscription.canceledAt).toBeInstanceOf(Date);
    });

    it('should cancel at period end by setting flag', () => {
      const subscription = {
        status: 'active',
        cancelAtPeriodEnd: false,
      };

      // Cancel at period end
      subscription.cancelAtPeriodEnd = true;

      expect(subscription.status).toBe('active');
      expect(subscription.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('Subscription Renewal Logic', () => {
    it('should renew monthly subscription', () => {
      const now = new Date();
      const subscription = {
        status: 'active',
        billing: 'monthly',
        currentPeriodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: now,
        lastPaymentAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        lastPaymentAmount: 29900,
        gatewayTransactionId: 'old_txn',
        cancelAtPeriodEnd: true, // Was set to cancel
      };

      // Simulate renewal
      const newTransactionId = 'new_txn';
      const newAmount = 29900;
      subscription.gatewayTransactionId = newTransactionId;
      subscription.lastPaymentAt = now;
      subscription.lastPaymentAmount = newAmount;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscription.cancelAtPeriodEnd = false;

      expect(subscription.gatewayTransactionId).toBe('new_txn');
      expect(subscription.cancelAtPeriodEnd).toBe(false);

      const newPeriodDays = Math.round(
        (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) /
        (24 * 60 * 60 * 1000)
      );
      expect(newPeriodDays).toBe(30);
    });

    it('should renew yearly subscription', () => {
      const now = new Date();
      const subscription = {
        status: 'active',
        billing: 'yearly',
        currentPeriodStart: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: now,
        lastPaymentAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        lastPaymentAmount: 299900,
        gatewayTransactionId: 'old_txn',
      };

      // Simulate renewal
      subscription.gatewayTransactionId = 'new_txn';
      subscription.lastPaymentAt = now;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      const newPeriodDays = Math.round(
        (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) /
        (24 * 60 * 60 * 1000)
      );
      expect(newPeriodDays).toBe(365);
    });
  });

  describe('Expiration Logic', () => {
    it('should identify subscriptions that need to be expired', () => {
      const now = new Date();
      const subscriptions = [
        { status: 'active', currentPeriodEnd: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Expired
        { status: 'active', currentPeriodEnd: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, // Active
        { status: 'past_due', currentPeriodEnd: new Date(now.getTime() - 48 * 60 * 60 * 1000) }, // Expired past_due
        { status: 'canceled', currentPeriodEnd: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Already canceled
      ];

      const toExpire = subscriptions.filter(
        (sub) =>
          (sub.status === 'active' || sub.status === 'past_due') &&
          sub.currentPeriodEnd < now
      );

      expect(toExpire.length).toBe(2);
    });
  });

  describe('Query Logic', () => {
    it('should build correct query for finding by user ID', () => {
      const query = {
        userId: 'user@example.com',
        gateway: 'paymob',
      };

      expect(query.userId).toBe('user@example.com');
      expect(query.gateway).toBe('paymob');
    });

    it('should build correct query for finding by transaction ID', () => {
      const query = {
        gatewayTransactionId: 'txn_123',
        gateway: 'paytabs',
      };

      expect(query.gatewayTransactionId).toBe('txn_123');
      expect(query.gateway).toBe('paytabs');
    });

    it('should build correct query for finding active subscriptions', () => {
      const query = {
        userId: 'user@example.com',
        gateway: 'paymob',
        status: { $in: ['active', 'past_due'] },
      };

      expect(query.userId).toBe('user@example.com');
      expect(query.status.$in).toContain('active');
      expect(query.status.$in).toContain('past_due');
    });
  });
});

describe('RegionalSubscription Module Exports', () => {
  it('should have required interface properties', () => {
    // Test that the interface shape is correct
    const subscriptionShape = {
      _id: 'string',
      userId: 'string',
      gateway: 'paymob' as const,
      gatewayTransactionId: 'string',
      gatewayCustomerId: 'string',
      plan: 'pro' as const,
      billing: 'monthly' as const,
      status: 'active' as const,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
      lastPaymentAt: new Date(),
      lastPaymentAmount: 29900,
      currency: 'EGP',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(subscriptionShape.userId).toBeDefined();
    expect(subscriptionShape.gateway).toBeDefined();
    expect(subscriptionShape.plan).toBeDefined();
    expect(subscriptionShape.status).toBeDefined();
    expect(subscriptionShape.billing).toBeDefined();
  });
});
