/**
 * Stripe Payment Gateway Implementation
 * Implements the unified PaymentGateway interface for Stripe
 */

import Stripe from 'stripe';
import {
  PaymentGateway,
  CheckoutOptions,
  CheckoutResult,
  WebhookResult,
  Subscription as AppSubscription,
  Customer,
  GatewayPrices,
  SubscriptionStatus,
  PaymentStatus,
} from '../types';

// Extended Stripe Subscription type with period properties
// These exist at runtime but may not be in the type definitions
interface StripeSubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

// Price IDs from environment variables
const STRIPE_PRICES: GatewayPrices = {
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

// Map Stripe subscription status to our status
function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    paused: 'paused',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    unpaid: 'past_due',
  };
  return statusMap[status] || 'incomplete';
}

// Map Stripe payment status to our status (exported for webhook handling)
export function mapPaymentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  const statusMap: Record<Stripe.PaymentIntent.Status, PaymentStatus> = {
    succeeded: 'succeeded',
    processing: 'processing',
    requires_payment_method: 'pending',
    requires_confirmation: 'pending',
    requires_action: 'pending',
    canceled: 'canceled',
    requires_capture: 'processing',
  };
  return statusMap[status] || 'pending';
}

/**
 * Stripe Payment Gateway
 */
export const stripeGateway: PaymentGateway = {
  name: 'stripe',

  isConfigured(): boolean {
    return stripe !== null && !!process.env.STRIPE_SECRET_KEY;
  },

  async createCheckoutSession(options: CheckoutOptions): Promise<CheckoutResult> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const priceId = STRIPE_PRICES[options.plan]?.[options.billing];
    if (!priceId) {
      throw new Error(`Price not configured for ${options.plan} ${options.billing}`);
    }

    // Get or create customer
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: options.userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: options.userEmail,
        name: options.userName,
        metadata: {
          userId: options.userId,
          ...options.metadata,
        },
      });
      customerId = newCustomer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: options.quantity || 1,
        },
      ],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      locale: (options.locale as Stripe.Checkout.SessionCreateParams.Locale) || 'auto',
      metadata: {
        userId: options.userId,
        userEmail: options.userEmail,
        plan: options.plan,
        billing: options.billing,
        ...options.metadata,
      },
      subscription_data: {
        metadata: {
          userId: options.userId,
          userEmail: options.userEmail,
          plan: options.plan,
        },
      },
    });

    return {
      url: session.url!,
      sessionId: session.id,
      gateway: 'stripe',
      clientSecret: session.client_secret || undefined,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  },

  async handleWebhook(payload: unknown, signature: string): Promise<WebhookResult> {
    if (!stripe) {
      return { event: 'error', success: false, error: 'Stripe is not configured' };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { event: 'error', success: false, error: 'Webhook secret not configured' };
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        payload as string | Buffer,
        signature,
        webhookSecret
      );
    } catch (err) {
      return {
        event: 'error',
        success: false,
        error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }

    const result: WebhookResult = {
      event: event.type,
      success: true,
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        result.userEmail = session.metadata?.userEmail || session.customer_email || undefined;
        result.userId = session.metadata?.userId;
        result.plan = session.metadata?.plan as WebhookResult['plan'];
        result.subscriptionId = session.subscription as string;
        result.customerId = session.customer as string;
        result.status = 'active';
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        result.subscriptionId = subscription.id;
        result.customerId = subscription.customer as string;
        result.userEmail = subscription.metadata?.userEmail;
        result.plan = subscription.metadata?.plan as WebhookResult['plan'];
        result.status = mapSubscriptionStatus(subscription.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        result.subscriptionId = subscription.id;
        result.customerId = subscription.customer as string;
        result.userEmail = subscription.metadata?.userEmail;
        result.status = 'canceled';
        result.plan = 'free';
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        result.customerId = invoice.customer as string;
        result.userEmail = invoice.customer_email || undefined;
        // payment_intent may be null or a string/PaymentIntent object
        const paymentIntent = (invoice as unknown as { payment_intent?: string | { id: string } }).payment_intent;
        result.paymentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
        result.amount = invoice.amount_paid;
        result.currency = invoice.currency.toUpperCase() as WebhookResult['currency'];
        result.status = 'succeeded';
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        result.customerId = invoice.customer as string;
        result.userEmail = invoice.customer_email || undefined;
        const paymentIntent = (invoice as unknown as { payment_intent?: string | { id: string } }).payment_intent;
        result.paymentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
        result.status = 'failed';
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return result;
  },

  async getSubscription(subscriptionId: string): Promise<AppSubscription | null> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSubscriptionWithPeriods;

      return {
        id: subscription.id,
        gateway: 'stripe',
        customerId: subscription.customer as string,
        userEmail: subscription.metadata?.userEmail || '',
        plan: (subscription.metadata?.plan as AppSubscription['plan']) || 'free',
        status: mapSubscriptionStatus(subscription.status),
        billing: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        createdAt: new Date(subscription.created * 1000),
        metadata: subscription.metadata as Record<string, string>,
      };
    } catch {
      return null;
    }
  },

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    if (immediate) {
      await stripe.subscriptions.cancel(subscriptionId);
    } else {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  },

  async getCustomer(customerId: string): Promise<Customer | null> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const customer = await stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return null;
      }

      return {
        id: customer.id,
        gateway: 'stripe',
        email: customer.email || '',
        name: customer.name || undefined,
        phone: customer.phone || undefined,
        metadata: customer.metadata as Record<string, string>,
        createdAt: new Date(customer.created * 1000),
      };
    } catch {
      return null;
    }
  },

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Customer> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return {
      id: customer.id,
      gateway: 'stripe',
      email: customer.email || email,
      name: customer.name || undefined,
      metadata: customer.metadata as Record<string, string>,
      createdAt: new Date(customer.created * 1000),
    };
  },

  async pauseSubscription(subscriptionId: string): Promise<void> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'mark_uncollectible',
      },
    });
  },

  async resumeSubscription(subscriptionId: string): Promise<void> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: '',
    });
  },

  async updateSubscription(subscriptionId: string, plan: 'pro' | 'team' | 'enterprise', billing: 'monthly' | 'yearly'): Promise<AppSubscription> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const priceId = STRIPE_PRICES[plan]?.[billing];
    if (!priceId) {
      throw new Error(`Price not configured for ${plan} ${billing}`);
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSubscriptionWithPeriods;
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      metadata: {
        ...subscription.metadata,
        plan,
      },
      proration_behavior: 'create_prorations',
    }) as unknown as StripeSubscriptionWithPeriods;

    return {
      id: updatedSubscription.id,
      gateway: 'stripe',
      customerId: updatedSubscription.customer as string,
      userEmail: updatedSubscription.metadata?.userEmail || '',
      plan,
      status: mapSubscriptionStatus(updatedSubscription.status),
      billing,
      currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      canceledAt: updatedSubscription.canceled_at ? new Date(updatedSubscription.canceled_at * 1000) : undefined,
      createdAt: new Date(updatedSubscription.created * 1000),
      metadata: updatedSubscription.metadata as Record<string, string>,
    };
  },

  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  },
};

// Export helper functions for backward compatibility
export const isStripeConfigured = () => stripeGateway.isConfigured();
export const getPriceId = (plan: 'pro' | 'team' | 'enterprise', billing: 'monthly' | 'yearly') =>
  STRIPE_PRICES[plan]?.[billing] || null;
export { stripe, STRIPE_PRICES };
