/**
 * Paddle Configuration
 * Configuration and constants for Paddle payment gateway (Global MoR)
 */

import { GatewayPrices } from '../types';

// Paddle environments
export type PaddleEnvironment = 'sandbox' | 'production';

// Paddle API Configuration
export const PADDLE_CONFIG = {
  // API Key for server-side operations
  apiKey: process.env.PADDLE_API_KEY || '',

  // Client-side token for Paddle.js
  clientToken: process.env.PADDLE_CLIENT_TOKEN || '',

  // Webhook secret for signature verification
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',

  // Environment (sandbox or production)
  environment: (process.env.PADDLE_ENVIRONMENT || 'sandbox') as PaddleEnvironment,

  // Seller ID
  sellerId: process.env.PADDLE_SELLER_ID || '',

  // API base URLs
  get apiBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com';
  },

  // Paddle.js URL
  get paddleJsUrl(): string {
    return this.environment === 'production'
      ? 'https://cdn.paddle.com/paddle/v2/paddle.js'
      : 'https://sandbox-cdn.paddle.com/paddle/v2/paddle.js';
  },

  // Default currency
  defaultCurrency: 'USD',
} as const;

// Paddle Price IDs from environment variables
export const PADDLE_PRICES: GatewayPrices = {
  pro: {
    monthly: process.env.PADDLE_PRICE_PRO_MONTHLY || '',
    yearly: process.env.PADDLE_PRICE_PRO_YEARLY || '',
  },
  team: {
    monthly: process.env.PADDLE_PRICE_TEAM_MONTHLY || '',
    yearly: process.env.PADDLE_PRICE_TEAM_YEARLY || '',
  },
  enterprise: {
    monthly: process.env.PADDLE_PRICE_ENTERPRISE_MONTHLY || '',
    yearly: process.env.PADDLE_PRICE_ENTERPRISE_YEARLY || '',
  },
};

// Paddle subscription statuses
export type PaddleSubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing';

// Paddle transaction statuses
export type PaddleTransactionStatus =
  | 'draft'
  | 'ready'
  | 'billed'
  | 'paid'
  | 'completed'
  | 'canceled'
  | 'past_due';

// Paddle webhook event types
export type PaddleWebhookEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.past_due'
  | 'subscription.activated'
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.completed'
  | 'transaction.billed'
  | 'transaction.canceled'
  | 'transaction.payment_failed'
  | 'transaction.ready'
  | 'customer.created'
  | 'customer.updated';

/**
 * Check if Paddle is properly configured
 */
export function isPaddleConfigured(): boolean {
  return !!(PADDLE_CONFIG.apiKey && PADDLE_CONFIG.clientToken);
}

/**
 * Get the price ID for a plan
 */
export function getPaddlePriceId(
  plan: 'pro' | 'team' | 'enterprise',
  billing: 'monthly' | 'yearly'
): string | null {
  const priceId = PADDLE_PRICES[plan][billing];
  return priceId || null;
}

/**
 * Get Paddle.js configuration for frontend
 */
export function getPaddleJsConfig() {
  return {
    token: PADDLE_CONFIG.clientToken,
    environment: PADDLE_CONFIG.environment,
    pwCustomer: {}, // Will be populated with customer data
  };
}
