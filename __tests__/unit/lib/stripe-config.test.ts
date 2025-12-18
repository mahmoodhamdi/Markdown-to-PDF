/**
 * Unit tests for Stripe configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Stripe Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('stripe initialization', () => {
    it('should return null when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { stripe } = await import('@/lib/stripe/config');
      expect(stripe).toBeNull();
    });

    it('should initialize stripe when STRIPE_SECRET_KEY is set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';

      const { stripe } = await import('@/lib/stripe/config');
      expect(stripe).not.toBeNull();
    });
  });

  describe('isStripeConfigured', () => {
    it('should return false when stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { isStripeConfigured } = await import('@/lib/stripe/config');
      expect(isStripeConfigured()).toBe(false);
    });

    it('should return true when stripe is configured', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';

      const { isStripeConfigured } = await import('@/lib/stripe/config');
      expect(isStripeConfigured()).toBe(true);
    });
  });

  describe('STRIPE_PRICES', () => {
    it('should have empty strings when price IDs are not set', async () => {
      delete process.env.STRIPE_PRICE_PRO_MONTHLY;
      delete process.env.STRIPE_PRICE_PRO_YEARLY;

      const { STRIPE_PRICES } = await import('@/lib/stripe/config');

      expect(STRIPE_PRICES.pro.monthly).toBe('');
      expect(STRIPE_PRICES.pro.yearly).toBe('');
    });

    it('should use environment variables for price IDs', async () => {
      process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_monthly_123';
      process.env.STRIPE_PRICE_PRO_YEARLY = 'price_pro_yearly_456';
      process.env.STRIPE_PRICE_TEAM_MONTHLY = 'price_team_monthly_789';
      process.env.STRIPE_PRICE_TEAM_YEARLY = 'price_team_yearly_012';

      const { STRIPE_PRICES } = await import('@/lib/stripe/config');

      expect(STRIPE_PRICES.pro.monthly).toBe('price_pro_monthly_123');
      expect(STRIPE_PRICES.pro.yearly).toBe('price_pro_yearly_456');
      expect(STRIPE_PRICES.team.monthly).toBe('price_team_monthly_789');
      expect(STRIPE_PRICES.team.yearly).toBe('price_team_yearly_012');
    });

    it('should have all plan types defined', async () => {
      const { STRIPE_PRICES } = await import('@/lib/stripe/config');

      expect(STRIPE_PRICES).toHaveProperty('pro');
      expect(STRIPE_PRICES).toHaveProperty('team');
      expect(STRIPE_PRICES).toHaveProperty('enterprise');

      expect(STRIPE_PRICES.pro).toHaveProperty('monthly');
      expect(STRIPE_PRICES.pro).toHaveProperty('yearly');
      expect(STRIPE_PRICES.team).toHaveProperty('monthly');
      expect(STRIPE_PRICES.team).toHaveProperty('yearly');
      expect(STRIPE_PRICES.enterprise).toHaveProperty('monthly');
      expect(STRIPE_PRICES.enterprise).toHaveProperty('yearly');
    });
  });

  describe('getPriceId', () => {
    it('should return null when price ID is not set', async () => {
      delete process.env.STRIPE_PRICE_PRO_MONTHLY;

      const { getPriceId } = await import('@/lib/stripe/config');

      expect(getPriceId('pro', 'monthly')).toBeNull();
    });

    it('should return price ID when set', async () => {
      process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_monthly_123';
      process.env.STRIPE_PRICE_TEAM_YEARLY = 'price_team_yearly_456';

      const { getPriceId } = await import('@/lib/stripe/config');

      expect(getPriceId('pro', 'monthly')).toBe('price_pro_monthly_123');
      expect(getPriceId('team', 'yearly')).toBe('price_team_yearly_456');
    });

    it('should handle all plan and billing combinations', async () => {
      process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pm';
      process.env.STRIPE_PRICE_PRO_YEARLY = 'price_py';
      process.env.STRIPE_PRICE_TEAM_MONTHLY = 'price_tm';
      process.env.STRIPE_PRICE_TEAM_YEARLY = 'price_ty';
      process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY = 'price_em';
      process.env.STRIPE_PRICE_ENTERPRISE_YEARLY = 'price_ey';

      const { getPriceId } = await import('@/lib/stripe/config');

      expect(getPriceId('pro', 'monthly')).toBe('price_pm');
      expect(getPriceId('pro', 'yearly')).toBe('price_py');
      expect(getPriceId('team', 'monthly')).toBe('price_tm');
      expect(getPriceId('team', 'yearly')).toBe('price_ty');
      expect(getPriceId('enterprise', 'monthly')).toBe('price_em');
      expect(getPriceId('enterprise', 'yearly')).toBe('price_ey');
    });
  });
});
