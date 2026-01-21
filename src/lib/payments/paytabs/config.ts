/**
 * PayTabs Configuration
 * Configuration and constants for PayTabs payment gateway (MENA region)
 */

import { GatewayPrices } from '../types';

// PayTabs regional endpoints
export const PAYTABS_ENDPOINTS: Record<string, string> = {
  ARE: 'https://secure.paytabs.com', // UAE (default)
  SAU: 'https://secure.paytabs.sa', // Saudi Arabia
  EGY: 'https://secure.paytabs.eg', // Egypt
  OMN: 'https://secure.paytabs.om', // Oman
  JOR: 'https://secure.paytabs.jo', // Jordan
  BHR: 'https://secure.paytabs.com', // Bahrain (uses UAE endpoint)
  GLOBAL: 'https://secure-global.paytabs.com', // Global
};

// PayTabs API Configuration
export const PAYTABS_CONFIG = {
  // Profile and authentication
  profileId: process.env.PAYTABS_PROFILE_ID || '',
  serverKey: process.env.PAYTABS_SERVER_KEY || '',
  clientKey: process.env.PAYTABS_CLIENT_KEY || '',

  // Region configuration
  region: (process.env.PAYTABS_REGION || 'ARE') as keyof typeof PAYTABS_ENDPOINTS,

  // Get base URL based on region
  get baseUrl(): string {
    return PAYTABS_ENDPOINTS[this.region] || PAYTABS_ENDPOINTS.ARE;
  },

  // API endpoints
  get paymentRequestUrl(): string {
    return `${this.baseUrl}/payment/request`;
  },

  get paymentQueryUrl(): string {
    return `${this.baseUrl}/payment/query`;
  },

  get refundUrl(): string {
    return `${this.baseUrl}/payment/refund`;
  },

  // Default currency based on region
  get defaultCurrency(): string {
    const currencyMap: Record<string, string> = {
      ARE: 'AED',
      SAU: 'SAR',
      EGY: 'EGP',
      OMN: 'OMR',
      JOR: 'JOD',
      BHR: 'BHD',
      GLOBAL: 'USD',
    };
    return currencyMap[this.region] || 'USD';
  },
} as const;

// PayTabs Price Configuration
// Prices in USD (will be converted based on region)
export const PAYTABS_PRICES: GatewayPrices & {
  amounts: {
    pro: { monthly: number; yearly: number };
    team: { monthly: number; yearly: number };
    enterprise: { monthly: number; yearly: number };
  };
} = {
  // Transaction references (can be customized per plan)
  pro: {
    monthly: 'PRO_MONTHLY',
    yearly: 'PRO_YEARLY',
  },
  team: {
    monthly: 'TEAM_MONTHLY',
    yearly: 'TEAM_YEARLY',
  },
  enterprise: {
    monthly: 'ENTERPRISE_MONTHLY',
    yearly: 'ENTERPRISE_YEARLY',
  },
  // Amounts in smallest currency unit (fils/cents)
  // Using USD amounts, will be displayed in local currency
  amounts: {
    pro: {
      monthly: 999, // $9.99
      yearly: 9900, // $99.00
    },
    team: {
      monthly: 2999, // $29.99
      yearly: 29900, // $299.00
    },
    enterprise: {
      monthly: 7999, // $79.99
      yearly: 79900, // $799.00
    },
  },
};

// Regional pricing multipliers (for local currency conversion)
export const REGIONAL_PRICE_MULTIPLIERS: Record<string, number> = {
  ARE: 3.67, // AED
  SAU: 3.75, // SAR
  EGY: 50.0, // EGP (approximate)
  OMN: 0.385, // OMR
  JOR: 0.71, // JOD
  BHR: 0.376, // BHD
  GLOBAL: 1.0, // USD
};

// PayTabs transaction classes
export type PayTabsTransactionType = 'sale' | 'auth' | 'capture' | 'void' | 'refund' | 'register';

// PayTabs payment response status
export type PayTabsResponseStatus =
  | 'A' // Authorized/Approved
  | 'H' // Hold
  | 'P' // Pending
  | 'V' // Voided
  | 'E' // Error
  | 'D'; // Declined

/**
 * Check if PayTabs is properly configured
 */
export function isPayTabsConfigured(): boolean {
  return !!(PAYTABS_CONFIG.profileId && PAYTABS_CONFIG.serverKey);
}

/**
 * Get the payment amount for a plan in the regional currency
 */
export function getPayTabsAmount(
  plan: 'pro' | 'team' | 'enterprise',
  billing: 'monthly' | 'yearly',
  region?: string
): number {
  const baseAmount = PAYTABS_PRICES.amounts[plan][billing];
  const multiplier = REGIONAL_PRICE_MULTIPLIERS[region || PAYTABS_CONFIG.region] || 1;
  // Convert from cents to whole currency amount with regional multiplier
  return Math.round((baseAmount / 100) * multiplier * 100) / 100;
}

/**
 * Get currency for a region
 */
export function getPayTabsCurrency(region?: string): string {
  const currencyMap: Record<string, string> = {
    ARE: 'AED',
    SAU: 'SAR',
    EGY: 'EGP',
    OMN: 'OMR',
    JOR: 'JOD',
    BHR: 'BHD',
    GLOBAL: 'USD',
  };
  return currencyMap[region || PAYTABS_CONFIG.region] || 'USD';
}
