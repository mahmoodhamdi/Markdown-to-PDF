/**
 * Payment Gateway Module
 * Unified exports for all payment gateway functionality
 */

// Types
export * from './types';

// Gateway Selector
export {
  getGateway,
  isGatewayConfigured,
  getConfiguredGateways,
  getAvailableGatewayTypes,
  selectGateway,
  getRecommendedGateway,
  getGatewayInfo,
  getCurrencyForCountry,
  supportsPaymentMethod,
} from './gateway-selector';

// Individual Gateways
export { stripeGateway, isStripeConfigured } from './stripe';
export { paymobGateway, isPaymobConfigured, paymobClient } from './paymob';
export { paytabsGateway, isPayTabsConfigured, paytabsClient } from './paytabs';
export { paddleGateway, isPaddleConfigured, paddleClient } from './paddle';

// Re-export configs for direct access if needed
export { PAYMOB_CONFIG, PAYMOB_PRICES } from './paymob/config';
export { PAYTABS_CONFIG, PAYTABS_PRICES } from './paytabs/config';
export { PADDLE_CONFIG, PADDLE_PRICES } from './paddle/config';
