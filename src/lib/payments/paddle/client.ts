/**
 * Paddle API Client
 * Wrapper for the Paddle Node.js SDK
 */

import {
  Paddle,
  Environment,
  type Customer,
  type Subscription,
  type Transaction,
  type Price,
  type EventName,
  type SubscriptionCreatedEvent,
  type SubscriptionUpdatedEvent,
  type SubscriptionCanceledEvent,
  type TransactionCompletedEvent,
  type TransactionPaymentFailedEvent,
} from '@paddle/paddle-node-sdk';
import crypto from 'crypto';
import { PADDLE_CONFIG, isPaddleConfigured } from './config';

// Initialize Paddle SDK
let paddleInstance: Paddle | null = null;

function getPaddleInstance(): Paddle {
  if (!isPaddleConfigured()) {
    throw new Error('Paddle is not configured');
  }

  if (!paddleInstance) {
    paddleInstance = new Paddle(PADDLE_CONFIG.apiKey, {
      environment:
        PADDLE_CONFIG.environment === 'production' ? Environment.production : Environment.sandbox,
    });
  }

  return paddleInstance;
}

// Export types for webhook handling
export type PaddleWebhookEvent = {
  event_id: string;
  event_type: EventName;
  occurred_at: string;
  notification_id: string;
  data: unknown;
};

export type {
  Customer as PaddleCustomer,
  Subscription as PaddleSubscription,
  Transaction as PaddleTransaction,
  Price as PaddlePrice,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionCanceledEvent,
  TransactionCompletedEvent,
  TransactionPaymentFailedEvent,
};

/**
 * Paddle API Client class
 */
export class PaddleClient {
  private _paddle: Paddle | null = null;

  private get paddle(): Paddle {
    if (!this._paddle) {
      this._paddle = getPaddleInstance();
    }
    return this._paddle;
  }

  // ============ Customer Management ============

  /**
   * Create a new customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    customData?: Record<string, string>;
  }): Promise<Customer> {
    const customer = await this.paddle.customers.create({
      email: params.email,
      name: params.name,
      customData: params.customData,
    });

    return customer;
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      const customer = await this.paddle.customers.get(customerId);
      return customer;
    } catch {
      return null;
    }
  }

  /**
   * Find customer by email
   */
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const customers = await this.paddle.customers.list({
        email: [email],
      });

      // Get the first customer from the async iterator
      for await (const customer of customers) {
        return customer;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    params: {
      name?: string;
      email?: string;
      customData?: Record<string, string>;
    }
  ): Promise<Customer> {
    const customer = await this.paddle.customers.update(customerId, params);
    return customer;
  }

  // ============ Price Management ============

  /**
   * Get price by ID
   */
  async getPrice(priceId: string): Promise<Price | null> {
    try {
      const price = await this.paddle.prices.get(priceId);
      return price;
    } catch {
      return null;
    }
  }

  /**
   * List all prices
   */
  async listPrices(): Promise<Price[]> {
    const prices: Price[] = [];
    const priceIterator = await this.paddle.prices.list();

    for await (const price of priceIterator) {
      prices.push(price);
    }

    return prices;
  }

  // ============ Transaction Management ============

  /**
   * Create a transaction (for server-side checkout)
   */
  async createTransaction(params: {
    customerId?: string;
    items: Array<{
      priceId: string;
      quantity: number;
    }>;
    customData?: Record<string, string>;
    checkoutSettings?: {
      successUrl?: string;
    };
  }): Promise<Transaction> {
    const transaction = await this.paddle.transactions.create({
      customerId: params.customerId,
      items: params.items.map((item) => ({
        priceId: item.priceId,
        quantity: item.quantity,
      })),
      customData: params.customData,
      checkout: params.checkoutSettings
        ? {
            url: params.checkoutSettings.successUrl,
          }
        : undefined,
    });

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const transaction = await this.paddle.transactions.get(transactionId);
      return transaction;
    } catch {
      return null;
    }
  }

  // ============ Subscription Management ============

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const subscription = await this.paddle.subscriptions.get(subscriptionId);
      return subscription;
    } catch {
      return null;
    }
  }

  /**
   * List subscriptions for a customer
   */
  async listCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
    const subscriptions: Subscription[] = [];
    const subIterator = await this.paddle.subscriptions.list({
      customerId: [customerId],
    });

    for await (const subscription of subIterator) {
      subscriptions.push(subscription);
    }

    return subscriptions;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    effectiveFrom: 'immediately' | 'next_billing_period' = 'next_billing_period'
  ): Promise<Subscription> {
    const subscription = await this.paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom,
    });

    return subscription;
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.paddle.subscriptions.pause(subscriptionId, {
      effectiveFrom: 'next_billing_period',
    });
    return subscription;
  }

  /**
   * Resume a subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.paddle.subscriptions.resume(subscriptionId, {
      effectiveFrom: 'immediately',
    });
    return subscription;
  }

  /**
   * Update subscription (change plan/price)
   */
  async updateSubscription(
    subscriptionId: string,
    params: {
      priceId?: string;
      quantity?: number;
      customData?: Record<string, string>;
      prorationBillingMode?:
        | 'prorated_immediately'
        | 'prorated_next_billing_period'
        | 'full_immediately'
        | 'full_next_billing_period'
        | 'do_not_bill';
    }
  ): Promise<Subscription> {
    const subscription = await this.paddle.subscriptions.update(subscriptionId, {
      items: params.priceId
        ? [
            {
              priceId: params.priceId,
              quantity: params.quantity || 1,
            },
          ]
        : undefined,
      customData: params.customData,
      prorationBillingMode: params.prorationBillingMode || 'prorated_immediately',
    });

    return subscription;
  }

  // ============ Webhook Handling ============

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!PADDLE_CONFIG.webhookSecret) {
      console.warn('PADDLE_WEBHOOK_SECRET not configured');
      return false;
    }

    try {
      // Paddle SDK handles verification internally
      // We'll use crypto to verify manually for more control
      const ts = signature
        .split(';')
        .find((s: string) => s.startsWith('ts='))
        ?.split('=')[1];
      const h1 = signature
        .split(';')
        .find((s: string) => s.startsWith('h1='))
        ?.split('=')[1];

      if (!ts || !h1) {
        return false;
      }

      const signedPayload = `${ts}:${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', PADDLE_CONFIG.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(expectedSignature));
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload: unknown): PaddleWebhookEvent {
    return payload as PaddleWebhookEvent;
  }
}

// Export singleton instance
export const paddleClient = new PaddleClient();

// Export Paddle instance for direct SDK access if needed
export { getPaddleInstance };
