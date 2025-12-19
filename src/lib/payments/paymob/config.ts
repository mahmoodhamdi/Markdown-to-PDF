/**
 * Paymob Configuration
 * Configuration and constants for Paymob payment gateway
 */

import { GatewayPrices } from '../types';

// Paymob API Configuration
export const PAYMOB_CONFIG = {
  // API Base URLs
  baseUrl: 'https://accept.paymob.com',
  intentionUrl: 'https://accept.paymob.com/v1/intention/',
  authUrl: 'https://accept.paymob.com/api/auth/tokens',
  orderUrl: 'https://accept.paymob.com/api/ecommerce/orders',
  paymentKeyUrl: 'https://accept.paymob.com/api/acceptance/payment_keys',

  // Checkout URL
  checkoutUrl: 'https://accept.paymob.com/unifiedcheckout/',

  // API Keys from environment
  apiKey: process.env.PAYMOB_API_KEY || '',
  publicKey: process.env.PAYMOB_PUBLIC_KEY || '',
  secretKey: process.env.PAYMOB_SECRET_KEY || '',

  // Integration IDs
  integrationIdCard: process.env.PAYMOB_INTEGRATION_ID_CARD || '',
  integrationIdWallet: process.env.PAYMOB_INTEGRATION_ID_WALLET || '',

  // iFrame ID for card payments
  iframeId: process.env.PAYMOB_IFRAME_ID || '',

  // HMAC Secret for webhook verification
  hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',

  // Default currency
  currency: 'EGP',
} as const;

// Paymob Price IDs (Integration IDs with amounts)
// For Paymob, we store amounts in the smallest currency unit (piasters for EGP)
export const PAYMOB_PRICES: GatewayPrices & {
  amounts: {
    pro: { monthly: number; yearly: number };
    team: { monthly: number; yearly: number };
    enterprise: { monthly: number; yearly: number };
  };
} = {
  // Integration IDs (used for recurring if available)
  pro: {
    monthly: process.env.PAYMOB_INTEGRATION_PRO_MONTHLY || PAYMOB_CONFIG.integrationIdCard,
    yearly: process.env.PAYMOB_INTEGRATION_PRO_YEARLY || PAYMOB_CONFIG.integrationIdCard,
  },
  team: {
    monthly: process.env.PAYMOB_INTEGRATION_TEAM_MONTHLY || PAYMOB_CONFIG.integrationIdCard,
    yearly: process.env.PAYMOB_INTEGRATION_TEAM_YEARLY || PAYMOB_CONFIG.integrationIdCard,
  },
  enterprise: {
    monthly: process.env.PAYMOB_INTEGRATION_ENTERPRISE_MONTHLY || PAYMOB_CONFIG.integrationIdCard,
    yearly: process.env.PAYMOB_INTEGRATION_ENTERPRISE_YEARLY || PAYMOB_CONFIG.integrationIdCard,
  },
  // Amounts in piasters (multiply EGP by 100)
  amounts: {
    pro: {
      monthly: 29900, // 299 EGP
      yearly: 299900, // 2999 EGP
    },
    team: {
      monthly: 79900, // 799 EGP
      yearly: 799900, // 7999 EGP
    },
    enterprise: {
      monthly: 249900, // 2499 EGP
      yearly: 2499900, // 24999 EGP
    },
  },
};

// Payment method types supported by Paymob
export type PaymobPaymentMethod =
  | 'card' // Visa, Mastercard, Meeza
  | 'wallet' // Mobile wallets (Vodafone Cash, Orange, etc.)
  | 'fawry' // Fawry reference code
  | 'valu' // ValU BNPL
  | 'sympl' // Sympl installments
  | 'bank_installments'; // Bank installments

// Paymob transaction status
export type PaymobTransactionStatus =
  | 'pending'
  | 'success'
  | 'declined'
  | 'voided'
  | 'refunded'
  | 'error';

/**
 * Check if Paymob is properly configured
 */
export function isPaymobConfigured(): boolean {
  return !!(
    PAYMOB_CONFIG.secretKey &&
    (PAYMOB_CONFIG.integrationIdCard || PAYMOB_CONFIG.integrationIdWallet)
  );
}

/**
 * Get the payment amount for a plan
 */
export function getPaymobAmount(
  plan: 'pro' | 'team' | 'enterprise',
  billing: 'monthly' | 'yearly'
): number {
  return PAYMOB_PRICES.amounts[plan][billing];
}

/**
 * Get the integration ID for a plan
 */
export function getPaymobIntegrationId(
  plan: 'pro' | 'team' | 'enterprise',
  billing: 'monthly' | 'yearly'
): string {
  return PAYMOB_PRICES[plan][billing];
}
