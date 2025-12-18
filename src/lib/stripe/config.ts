/**
 * Stripe configuration and initialization
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  : null;

// Price IDs from environment variables
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_TEAM_YEARLY || '',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
  },
};

// Helper to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return stripe !== null && !!process.env.STRIPE_SECRET_KEY;
}

// Get price ID for a plan and billing period
export function getPriceId(
  plan: 'pro' | 'team' | 'enterprise',
  billing: 'monthly' | 'yearly'
): string | null {
  const priceId = STRIPE_PRICES[plan][billing];
  return priceId || null;
}
