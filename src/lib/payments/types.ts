/**
 * Shared Payment Gateway Types
 * Common interfaces and types used across all payment gateways
 */

import { PlanType } from '@/lib/plans/config';

// Supported payment gateways
export type PaymentGatewayType = 'stripe' | 'paymob' | 'paytabs' | 'paddle';

// Billing period options
export type BillingPeriod = 'monthly' | 'yearly';

// Supported currencies
export type Currency = 'USD' | 'EUR' | 'GBP' | 'EGP' | 'SAR' | 'AED' | 'JOD' | 'OMR' | 'BHD';

// Payment status
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded';

// Subscription status
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired';

/**
 * Options for creating a checkout session
 */
export interface CheckoutOptions {
  // User information
  userEmail: string;
  userId: string;
  userName?: string;

  // Plan details
  plan: Exclude<PlanType, 'free'>;
  billing: BillingPeriod;

  // URLs
  successUrl: string;
  cancelUrl: string;

  // Optional configurations
  locale?: string;
  currency?: Currency;
  metadata?: Record<string, string>;

  // For team plans
  quantity?: number;
}

/**
 * Result from creating a checkout session
 */
export interface CheckoutResult {
  // Redirect URL for payment
  url: string;

  // Session/Transaction ID
  sessionId: string;

  // Which gateway was used
  gateway: PaymentGatewayType;

  // Client secret for embedded checkout (if supported)
  clientSecret?: string;

  // Expiration time (if applicable)
  expiresAt?: Date;
}

/**
 * Result from processing a webhook
 */
export interface WebhookResult {
  // Event type
  event: string;

  // Whether event was handled successfully
  success: boolean;

  // User information (if applicable)
  userEmail?: string;
  userId?: string;

  // Subscription information
  plan?: PlanType;
  subscriptionId?: string;
  customerId?: string;

  // Payment information
  paymentId?: string;
  amount?: number;
  currency?: Currency;

  // Status
  status?: PaymentStatus | SubscriptionStatus;

  // Error information (if failed)
  error?: string;
}

/**
 * Subscription information
 */
export interface Subscription {
  id: string;
  gateway: PaymentGatewayType;
  customerId: string;
  userEmail: string;
  plan: PlanType;
  status: SubscriptionStatus;
  billing: BillingPeriod;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  metadata?: Record<string, string>;
}

/**
 * Customer information
 */
export interface Customer {
  id: string;
  gateway: PaymentGatewayType;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

/**
 * Payment transaction information
 */
export interface Transaction {
  id: string;
  gateway: PaymentGatewayType;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod?: string;
  failureReason?: string;
  createdAt: Date;
  metadata?: Record<string, string>;
}

/**
 * Gateway price configuration
 */
export interface GatewayPrices {
  pro: {
    monthly: string;
    yearly: string;
  };
  team: {
    monthly: string;
    yearly: string;
  };
  enterprise: {
    monthly: string;
    yearly: string;
  };
}

/**
 * Payment Gateway Interface
 * All payment gateways must implement this interface
 */
export interface PaymentGateway {
  // Gateway identifier
  readonly name: PaymentGatewayType;

  // Check if gateway is properly configured
  isConfigured(): boolean;

  // Create a checkout session
  createCheckoutSession(options: CheckoutOptions): Promise<CheckoutResult>;

  // Process webhook/callback
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;

  // Subscription management
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  cancelSubscription(subscriptionId: string, immediate?: boolean): Promise<void>;

  // Customer management
  getCustomer(customerId: string): Promise<Customer | null>;
  createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Customer>;

  // Optional: Resume/pause subscription (not all gateways support this)
  pauseSubscription?(subscriptionId: string): Promise<void>;
  resumeSubscription?(subscriptionId: string): Promise<void>;

  // Optional: Update subscription plan
  updateSubscription?(subscriptionId: string, plan: Exclude<PlanType, 'free'>, billing: BillingPeriod): Promise<Subscription>;

  // Optional: Get portal/management URL
  getCustomerPortalUrl?(customerId: string, returnUrl: string): Promise<string>;
}

/**
 * Gateway selection preferences
 */
export interface GatewaySelectionOptions {
  // User's country code (ISO 3166-1 alpha-2)
  countryCode?: string;

  // Preferred currency
  currency?: Currency;

  // User's explicit preference
  preferredGateway?: PaymentGatewayType;

  // Fallback order if preferred is unavailable
  fallbackOrder?: PaymentGatewayType[];
}

/**
 * Regional pricing configuration
 */
export interface RegionalPricing {
  region: string;
  currency: Currency;
  gateway: PaymentGatewayType;
  prices: {
    pro: { monthly: number; yearly: number };
    team: { monthly: number; yearly: number };
    enterprise: { monthly: number; yearly: number };
  };
}

// Country to gateway mapping
export const COUNTRY_GATEWAY_MAP: Record<string, PaymentGatewayType> = {
  // Egypt
  EG: 'paymob',

  // GCC Countries -> PayTabs
  SA: 'paytabs', // Saudi Arabia
  AE: 'paytabs', // UAE
  BH: 'paytabs', // Bahrain
  OM: 'paytabs', // Oman
  QA: 'paytabs', // Qatar
  KW: 'paytabs', // Kuwait

  // Other MENA -> PayTabs
  JO: 'paytabs', // Jordan
  LB: 'paytabs', // Lebanon
  PS: 'paytabs', // Palestine
  IQ: 'paytabs', // Iraq

  // Default for unlisted countries handled by selector
};

// Currency to gateway mapping
export const CURRENCY_GATEWAY_MAP: Record<Currency, PaymentGatewayType> = {
  EGP: 'paymob',
  SAR: 'paytabs',
  AED: 'paytabs',
  JOD: 'paytabs',
  OMR: 'paytabs',
  BHD: 'paytabs',
  USD: 'stripe',
  EUR: 'stripe',
  GBP: 'stripe',
};
