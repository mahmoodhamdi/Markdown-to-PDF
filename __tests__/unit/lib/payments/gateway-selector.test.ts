/**
 * Unit tests for Payment Gateway Selector
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock functions
const stripeIsConfigured = vi.fn();
const paymobIsConfigured = vi.fn();
const paytabsIsConfigured = vi.fn();
const paddleIsConfigured = vi.fn();

// Mock all gateway modules with configurable isConfigured
vi.mock('@/lib/payments/stripe', () => ({
  stripeGateway: {
    name: 'stripe',
    isConfigured: () => stripeIsConfigured(),
    createCheckoutSession: vi.fn(),
    handleWebhook: vi.fn(),
    getSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    getCustomer: vi.fn(),
    createCustomer: vi.fn(),
  },
}));

vi.mock('@/lib/payments/paymob', () => ({
  paymobGateway: {
    name: 'paymob',
    isConfigured: () => paymobIsConfigured(),
    createCheckoutSession: vi.fn(),
    handleWebhook: vi.fn(),
    getSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    getCustomer: vi.fn(),
    createCustomer: vi.fn(),
  },
}));

vi.mock('@/lib/payments/paytabs', () => ({
  paytabsGateway: {
    name: 'paytabs',
    isConfigured: () => paytabsIsConfigured(),
    createCheckoutSession: vi.fn(),
    handleWebhook: vi.fn(),
    getSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    getCustomer: vi.fn(),
    createCustomer: vi.fn(),
  },
}));

vi.mock('@/lib/payments/paddle', () => ({
  paddleGateway: {
    name: 'paddle',
    isConfigured: () => paddleIsConfigured(),
    createCheckoutSession: vi.fn(),
    handleWebhook: vi.fn(),
    getSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    getCustomer: vi.fn(),
    createCustomer: vi.fn(),
  },
}));

describe('Gateway Selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set all gateways as configured by default
    stripeIsConfigured.mockReturnValue(true);
    paymobIsConfigured.mockReturnValue(true);
    paytabsIsConfigured.mockReturnValue(true);
    paddleIsConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getGateway', () => {
    it('should return stripe gateway', async () => {
      const { getGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = getGateway('stripe');
      expect(gateway.name).toBe('stripe');
    });

    it('should return paymob gateway', async () => {
      const { getGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = getGateway('paymob');
      expect(gateway.name).toBe('paymob');
    });

    it('should return paytabs gateway', async () => {
      const { getGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = getGateway('paytabs');
      expect(gateway.name).toBe('paytabs');
    });

    it('should return paddle gateway', async () => {
      const { getGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = getGateway('paddle');
      expect(gateway.name).toBe('paddle');
    });

    it('should throw error for unknown gateway', async () => {
      const { getGateway } = await import('@/lib/payments/gateway-selector');
      expect(() => getGateway('unknown' as never)).toThrow('Unknown payment gateway: unknown');
    });
  });

  describe('isGatewayConfigured', () => {
    it('should return true for configured gateways', async () => {
      const { isGatewayConfigured } = await import('@/lib/payments/gateway-selector');
      expect(isGatewayConfigured('stripe')).toBe(true);
      expect(isGatewayConfigured('paymob')).toBe(true);
      expect(isGatewayConfigured('paytabs')).toBe(true);
      expect(isGatewayConfigured('paddle')).toBe(true);
    });

    it('should return false for non-configured gateways', async () => {
      stripeIsConfigured.mockReturnValue(false);

      const { isGatewayConfigured } = await import('@/lib/payments/gateway-selector');
      expect(isGatewayConfigured('stripe')).toBe(false);
    });
  });

  describe('getConfiguredGateways', () => {
    it('should return all configured gateways', async () => {
      const { getConfiguredGateways } = await import('@/lib/payments/gateway-selector');
      const gateways = getConfiguredGateways();
      expect(gateways).toHaveLength(4);
      expect(gateways.map((g) => g.name)).toContain('stripe');
      expect(gateways.map((g) => g.name)).toContain('paymob');
      expect(gateways.map((g) => g.name)).toContain('paytabs');
      expect(gateways.map((g) => g.name)).toContain('paddle');
    });

    it('should filter out unconfigured gateways', async () => {
      stripeIsConfigured.mockReturnValue(false);
      paymobIsConfigured.mockReturnValue(false);

      const { getConfiguredGateways } = await import('@/lib/payments/gateway-selector');
      const gateways = getConfiguredGateways();
      expect(gateways).toHaveLength(2);
      expect(gateways.map((g) => g.name)).not.toContain('stripe');
      expect(gateways.map((g) => g.name)).not.toContain('paymob');
    });
  });

  describe('getAvailableGatewayTypes', () => {
    it('should return all configured gateway types', async () => {
      const { getAvailableGatewayTypes } = await import('@/lib/payments/gateway-selector');
      const types = getAvailableGatewayTypes();
      expect(types).toHaveLength(4);
      expect(types).toContain('stripe');
      expect(types).toContain('paymob');
      expect(types).toContain('paytabs');
      expect(types).toContain('paddle');
    });
  });

  describe('selectGateway', () => {
    it('should use preferred gateway if configured', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({ preferredGateway: 'paymob' });
      expect(gateway.name).toBe('paymob');
    });

    it('should ignore unconfigured preferred gateway', async () => {
      stripeIsConfigured.mockReturnValue(false);

      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({ preferredGateway: 'stripe' });
      // Should fall back to next available
      expect(gateway.name).not.toBe('stripe');
    });

    it('should select Paymob for Egypt', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({ countryCode: 'EG' });
      expect(gateway.name).toBe('paymob');
    });

    it('should select PayTabs for Saudi Arabia', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({ countryCode: 'SA' });
      expect(gateway.name).toBe('paytabs');
    });

    it('should select PayTabs for UAE', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({ countryCode: 'AE' });
      expect(gateway.name).toBe('paytabs');
    });

    it('should select Paddle for EU countries', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({ countryCode: 'DE' });
      expect(gateway.name).toBe('paddle');
    });

    it('should select based on currency', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({ currency: 'EGP' });
      expect(gateway.name).toBe('paymob');
    });

    it('should use fallback order when specified', async () => {
      stripeIsConfigured.mockReturnValue(false);
      paddleIsConfigured.mockReturnValue(false);

      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway({
        fallbackOrder: ['stripe', 'paddle', 'paytabs', 'paymob'],
      });
      expect(gateway.name).toBe('paytabs');
    });

    it('should use default fallback order when no options', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway = selectGateway();
      expect(gateway.name).toBe('stripe');
    });

    it('should throw error when no gateway is configured', async () => {
      stripeIsConfigured.mockReturnValue(false);
      paymobIsConfigured.mockReturnValue(false);
      paytabsIsConfigured.mockReturnValue(false);
      paddleIsConfigured.mockReturnValue(false);

      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      expect(() => selectGateway()).toThrow(
        'No payment gateway is configured. Please configure at least one payment provider.'
      );
    });

    it('should handle case-insensitive country codes', async () => {
      const { selectGateway } = await import('@/lib/payments/gateway-selector');
      const gateway1 = selectGateway({ countryCode: 'eg' });
      const gateway2 = selectGateway({ countryCode: 'EG' });
      expect(gateway1.name).toBe(gateway2.name);
    });
  });

  describe('getRecommendedGateway', () => {
    it('should recommend Paymob for Egypt', async () => {
      const { getRecommendedGateway } = await import('@/lib/payments/gateway-selector');
      expect(getRecommendedGateway('EG')).toBe('paymob');
    });

    it('should recommend PayTabs for MENA countries', async () => {
      const { getRecommendedGateway } = await import('@/lib/payments/gateway-selector');
      expect(getRecommendedGateway('SA')).toBe('paytabs');
      expect(getRecommendedGateway('AE')).toBe('paytabs');
      expect(getRecommendedGateway('KW')).toBe('paytabs');
      expect(getRecommendedGateway('BH')).toBe('paytabs');
      expect(getRecommendedGateway('OM')).toBe('paytabs');
      expect(getRecommendedGateway('QA')).toBe('paytabs');
      expect(getRecommendedGateway('JO')).toBe('paytabs');
    });

    it('should recommend Paddle for EU countries', async () => {
      const { getRecommendedGateway } = await import('@/lib/payments/gateway-selector');
      expect(getRecommendedGateway('DE')).toBe('paddle');
      expect(getRecommendedGateway('FR')).toBe('paddle');
      expect(getRecommendedGateway('IT')).toBe('paddle');
      expect(getRecommendedGateway('ES')).toBe('paddle');
      expect(getRecommendedGateway('NL')).toBe('paddle');
    });

    it('should recommend Stripe for rest of world', async () => {
      const { getRecommendedGateway } = await import('@/lib/payments/gateway-selector');
      expect(getRecommendedGateway('US')).toBe('stripe');
      expect(getRecommendedGateway('CA')).toBe('stripe');
      expect(getRecommendedGateway('AU')).toBe('stripe');
      expect(getRecommendedGateway('JP')).toBe('stripe');
    });

    it('should return null if recommended gateway is not configured', async () => {
      paymobIsConfigured.mockReturnValue(false);

      const { getRecommendedGateway } = await import('@/lib/payments/gateway-selector');
      expect(getRecommendedGateway('EG')).toBeNull();
    });
  });

  describe('getGatewayInfo', () => {
    it('should return Stripe info', async () => {
      const { getGatewayInfo } = await import('@/lib/payments/gateway-selector');
      const info = getGatewayInfo('stripe');
      expect(info.name).toBe('Stripe');
      expect(info.paymentMethods).toContain('Credit/Debit Cards');
    });

    it('should return Paymob info', async () => {
      const { getGatewayInfo } = await import('@/lib/payments/gateway-selector');
      const info = getGatewayInfo('paymob');
      expect(info.name).toBe('Paymob');
      expect(info.supportedCountries).toContain('EG');
      expect(info.supportedCurrencies).toContain('EGP');
    });

    it('should return PayTabs info', async () => {
      const { getGatewayInfo } = await import('@/lib/payments/gateway-selector');
      const info = getGatewayInfo('paytabs');
      expect(info.name).toBe('PayTabs');
      expect(info.supportedCountries).toContain('SA');
      expect(info.supportedCountries).toContain('AE');
    });

    it('should return Paddle info', async () => {
      const { getGatewayInfo } = await import('@/lib/payments/gateway-selector');
      const info = getGatewayInfo('paddle');
      expect(info.name).toBe('Paddle');
      expect(info.description).toContain('Merchant of Record');
    });
  });

  describe('getCurrencyForCountry', () => {
    it('should return EGP for Egypt', async () => {
      const { getCurrencyForCountry } = await import('@/lib/payments/gateway-selector');
      expect(getCurrencyForCountry('EG')).toBe('EGP');
    });

    it('should return SAR for Saudi Arabia', async () => {
      const { getCurrencyForCountry } = await import('@/lib/payments/gateway-selector');
      expect(getCurrencyForCountry('SA')).toBe('SAR');
    });

    it('should return AED for UAE', async () => {
      const { getCurrencyForCountry } = await import('@/lib/payments/gateway-selector');
      expect(getCurrencyForCountry('AE')).toBe('AED');
    });

    it('should return EUR for EU countries', async () => {
      const { getCurrencyForCountry } = await import('@/lib/payments/gateway-selector');
      expect(getCurrencyForCountry('DE')).toBe('EUR');
      expect(getCurrencyForCountry('FR')).toBe('EUR');
      expect(getCurrencyForCountry('IT')).toBe('EUR');
    });

    it('should return GBP for UK', async () => {
      const { getCurrencyForCountry } = await import('@/lib/payments/gateway-selector');
      expect(getCurrencyForCountry('GB')).toBe('GBP');
    });

    it('should return USD for unknown countries', async () => {
      const { getCurrencyForCountry } = await import('@/lib/payments/gateway-selector');
      expect(getCurrencyForCountry('XX')).toBe('USD');
    });

    it('should handle case-insensitive country codes', async () => {
      const { getCurrencyForCountry } = await import('@/lib/payments/gateway-selector');
      expect(getCurrencyForCountry('eg')).toBe('EGP');
      expect(getCurrencyForCountry('Eg')).toBe('EGP');
    });
  });

  describe('supportsPaymentMethod', () => {
    it('should return correct support for Stripe', async () => {
      const { supportsPaymentMethod } = await import('@/lib/payments/gateway-selector');
      expect(supportsPaymentMethod('stripe', 'card')).toBe(true);
      expect(supportsPaymentMethod('stripe', 'wallet')).toBe(true);
      expect(supportsPaymentMethod('stripe', 'bank')).toBe(true);
      expect(supportsPaymentMethod('stripe', 'apple_pay')).toBe(true);
      expect(supportsPaymentMethod('stripe', 'google_pay')).toBe(true);
    });

    it('should return correct support for Paymob', async () => {
      const { supportsPaymentMethod } = await import('@/lib/payments/gateway-selector');
      expect(supportsPaymentMethod('paymob', 'card')).toBe(true);
      expect(supportsPaymentMethod('paymob', 'wallet')).toBe(true);
      expect(supportsPaymentMethod('paymob', 'bank')).toBe(false);
      expect(supportsPaymentMethod('paymob', 'apple_pay')).toBe(false);
    });

    it('should return correct support for PayTabs', async () => {
      const { supportsPaymentMethod } = await import('@/lib/payments/gateway-selector');
      expect(supportsPaymentMethod('paytabs', 'card')).toBe(true);
      expect(supportsPaymentMethod('paytabs', 'apple_pay')).toBe(true);
      expect(supportsPaymentMethod('paytabs', 'google_pay')).toBe(false);
    });

    it('should return correct support for Paddle', async () => {
      const { supportsPaymentMethod } = await import('@/lib/payments/gateway-selector');
      expect(supportsPaymentMethod('paddle', 'card')).toBe(true);
      expect(supportsPaymentMethod('paddle', 'wallet')).toBe(true);
      expect(supportsPaymentMethod('paddle', 'bank')).toBe(true);
      expect(supportsPaymentMethod('paddle', 'apple_pay')).toBe(true);
      expect(supportsPaymentMethod('paddle', 'google_pay')).toBe(true);
    });
  });
});
