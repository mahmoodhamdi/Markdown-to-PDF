/**
 * Payment Gateway Selector
 * Smart selection of payment gateway based on user location, currency, or preference
 */

import {
  PaymentGateway,
  PaymentGatewayType,
  GatewaySelectionOptions,
  Currency,
  COUNTRY_GATEWAY_MAP,
  CURRENCY_GATEWAY_MAP,
} from './types';
import { stripeGateway } from './stripe';
import { paymobGateway } from './paymob';
import { paytabsGateway } from './paytabs';
import { paddleGateway } from './paddle';

// Gateway instances map
const gateways: Map<PaymentGatewayType, PaymentGateway> = new Map([
  ['stripe', stripeGateway],
  ['paymob', paymobGateway],
  ['paytabs', paytabsGateway],
  ['paddle', paddleGateway],
]);

/**
 * Get a specific payment gateway by type
 */
export function getGateway(type: PaymentGatewayType): PaymentGateway {
  const gateway = gateways.get(type);
  if (!gateway) {
    throw new Error(`Unknown payment gateway: ${type}`);
  }
  return gateway;
}

/**
 * Check if a gateway is configured and ready to use
 */
export function isGatewayConfigured(type: PaymentGatewayType): boolean {
  const gateway = gateways.get(type);
  return gateway?.isConfigured() ?? false;
}

/**
 * Get all configured gateways
 */
export function getConfiguredGateways(): PaymentGateway[] {
  return Array.from(gateways.values()).filter((g) => g.isConfigured());
}

/**
 * Get all available gateway types
 */
export function getAvailableGatewayTypes(): PaymentGatewayType[] {
  return Array.from(gateways.entries())
    .filter(([, gateway]) => gateway.isConfigured())
    .map(([type]) => type);
}

/**
 * Select the best gateway based on options
 */
export function selectGateway(options: GatewaySelectionOptions = {}): PaymentGateway {
  const { countryCode, currency, preferredGateway, fallbackOrder } = options;

  // 1. If user has explicit preference and it's configured, use it
  if (preferredGateway && isGatewayConfigured(preferredGateway)) {
    return getGateway(preferredGateway);
  }

  // 2. Select based on country code
  if (countryCode) {
    const upperCode = countryCode.toUpperCase();
    const gatewayForCountry = COUNTRY_GATEWAY_MAP[upperCode];

    if (gatewayForCountry && isGatewayConfigured(gatewayForCountry)) {
      return getGateway(gatewayForCountry);
    }

    // Check for EU countries - prefer Paddle for tax handling
    const euCountries = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ];

    if (euCountries.includes(upperCode) && isGatewayConfigured('paddle')) {
      return getGateway('paddle');
    }
  }

  // 3. Select based on currency
  if (currency && currency in CURRENCY_GATEWAY_MAP) {
    const gatewayForCurrency = CURRENCY_GATEWAY_MAP[currency as Currency];
    if (isGatewayConfigured(gatewayForCurrency)) {
      return getGateway(gatewayForCurrency);
    }
  }

  // 4. Try fallback order
  if (fallbackOrder) {
    for (const gatewayType of fallbackOrder) {
      if (isGatewayConfigured(gatewayType)) {
        return getGateway(gatewayType);
      }
    }
  }

  // 5. Default fallback order: Stripe > Paddle > PayTabs > Paymob
  const defaultOrder: PaymentGatewayType[] = ['stripe', 'paddle', 'paytabs', 'paymob'];

  for (const gatewayType of defaultOrder) {
    if (isGatewayConfigured(gatewayType)) {
      return getGateway(gatewayType);
    }
  }

  throw new Error(
    'No payment gateway is configured. Please configure at least one payment provider.'
  );
}

/**
 * Get recommended gateway for a specific country
 */
export function getRecommendedGateway(countryCode: string): PaymentGatewayType | null {
  const upperCode = countryCode.toUpperCase();

  // Egypt -> Paymob (best local support)
  if (upperCode === 'EG') {
    return isGatewayConfigured('paymob') ? 'paymob' : null;
  }

  // GCC/MENA -> PayTabs (best regional coverage)
  const menaCountries = ['SA', 'AE', 'KW', 'BH', 'OM', 'QA', 'JO', 'LB', 'IQ', 'PS'];
  if (menaCountries.includes(upperCode)) {
    return isGatewayConfigured('paytabs') ? 'paytabs' : null;
  }

  // EU -> Paddle (MoR handles VAT)
  const euCountries = [
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
  ];
  if (euCountries.includes(upperCode)) {
    return isGatewayConfigured('paddle') ? 'paddle' : null;
  }

  // Rest of world -> Stripe (best global coverage)
  return isGatewayConfigured('stripe') ? 'stripe' : null;
}

/**
 * Get gateway info for display
 */
export function getGatewayInfo(type: PaymentGatewayType): {
  name: string;
  description: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  paymentMethods: string[];
} {
  const info: Record<PaymentGatewayType, ReturnType<typeof getGatewayInfo>> = {
    stripe: {
      name: 'Stripe',
      description: 'Global payment processing for international customers',
      supportedCountries: ['US', 'CA', 'GB', 'AU', 'Most countries worldwide'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', '135+ currencies'],
      paymentMethods: ['Credit/Debit Cards', 'Apple Pay', 'Google Pay', 'Bank transfers'],
    },
    paymob: {
      name: 'Paymob',
      description: "Egypt's leading payment gateway for local payments",
      supportedCountries: ['EG'],
      supportedCurrencies: ['EGP'],
      paymentMethods: ['Credit/Debit Cards', 'Meeza', 'Vodafone Cash', 'Orange Money', 'Fawry'],
    },
    paytabs: {
      name: 'PayTabs',
      description: 'MENA region payment processing',
      supportedCountries: ['SA', 'AE', 'EG', 'JO', 'OM', 'BH', 'KW', 'QA'],
      supportedCurrencies: ['SAR', 'AED', 'EGP', 'JOD', 'OMR', 'BHD', 'KWD', 'QAR'],
      paymentMethods: ['Credit/Debit Cards', 'Mada', 'Apple Pay', 'STC Pay'],
    },
    paddle: {
      name: 'Paddle',
      description: 'Merchant of Record - handles taxes and compliance globally',
      supportedCountries: ['200+ countries', 'Especially EU countries'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', '20+ currencies'],
      paymentMethods: ['Credit/Debit Cards', 'PayPal', 'Apple Pay', 'Google Pay', 'Wire Transfer'],
    },
  };

  return info[type];
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(countryCode: string): Currency {
  const currencyMap: Record<string, Currency> = {
    // Egypt
    EG: 'EGP',
    // GCC
    SA: 'SAR',
    AE: 'AED',
    BH: 'BHD',
    OM: 'OMR',
    KW: 'USD', // Kuwait uses KWD but we default to USD
    QA: 'USD', // Qatar uses QAR but we default to USD
    // Jordan
    JO: 'JOD',
    // Europe
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    IE: 'EUR',
    PT: 'EUR',
    GR: 'EUR',
    FI: 'EUR',
    // UK
    GB: 'GBP',
    // Default
  };

  return currencyMap[countryCode.toUpperCase()] || 'USD';
}

/**
 * Check if gateway supports a specific payment method
 */
export function supportsPaymentMethod(
  gatewayType: PaymentGatewayType,
  method: 'card' | 'wallet' | 'bank' | 'apple_pay' | 'google_pay'
): boolean {
  const support: Record<PaymentGatewayType, Record<string, boolean>> = {
    stripe: {
      card: true,
      wallet: true,
      bank: true,
      apple_pay: true,
      google_pay: true,
    },
    paymob: {
      card: true,
      wallet: true, // Mobile wallets
      bank: false,
      apple_pay: false,
      google_pay: false,
    },
    paytabs: {
      card: true,
      wallet: false,
      bank: false,
      apple_pay: true,
      google_pay: false,
    },
    paddle: {
      card: true,
      wallet: true, // PayPal
      bank: true, // Wire transfer
      apple_pay: true,
      google_pay: true,
    },
  };

  return support[gatewayType]?.[method] ?? false;
}
