/**
 * Paddle Payment Gateway Implementation
 * Implements the unified PaymentGateway interface for Paddle (Global MoR)
 */

import {
  PaymentGateway,
  CheckoutOptions,
  CheckoutResult,
  WebhookResult,
  Subscription,
  Customer,
  SubscriptionStatus,
} from '../types';
import { isPaddleConfigured, getPaddlePriceId, PADDLE_CONFIG } from './config';
import { paddleClient, PaddleSubscription } from './client';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

// Map Paddle subscription status to our status
function mapSubscriptionStatus(status: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
  };
  return statusMap[status] || 'incomplete';
}

// Convert Paddle subscription to our Subscription type
function convertSubscription(paddleSub: PaddleSubscription, userEmail?: string): Subscription {
  return {
    id: paddleSub.id,
    gateway: 'paddle',
    customerId: paddleSub.customerId || '',
    userEmail: userEmail || '',
    plan: (paddleSub.customData?.plan as Subscription['plan']) || 'pro',
    status: mapSubscriptionStatus(paddleSub.status || 'active'),
    billing: paddleSub.billingCycle?.interval === 'year' ? 'yearly' : 'monthly',
    currentPeriodStart: paddleSub.currentBillingPeriod?.startsAt
      ? new Date(paddleSub.currentBillingPeriod.startsAt)
      : new Date(),
    currentPeriodEnd: paddleSub.currentBillingPeriod?.endsAt
      ? new Date(paddleSub.currentBillingPeriod.endsAt)
      : new Date(),
    cancelAtPeriodEnd: paddleSub.scheduledChange?.action === 'cancel',
    canceledAt: paddleSub.canceledAt ? new Date(paddleSub.canceledAt) : undefined,
    createdAt: paddleSub.createdAt ? new Date(paddleSub.createdAt) : new Date(),
    metadata: paddleSub.customData as Record<string, string>,
  };
}

/**
 * Paddle Payment Gateway
 */
export const paddleGateway: PaymentGateway = {
  name: 'paddle',

  isConfigured(): boolean {
    return isPaddleConfigured();
  },

  async createCheckoutSession(options: CheckoutOptions): Promise<CheckoutResult> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    const priceId = getPaddlePriceId(options.plan, options.billing);
    if (!priceId) {
      throw new Error(`Price not configured for ${options.plan} ${options.billing}`);
    }

    // Find or create customer
    let customer = await paddleClient.findCustomerByEmail(options.userEmail);

    if (!customer) {
      customer = await paddleClient.createCustomer({
        email: options.userEmail,
        name: options.userName,
        customData: {
          userId: options.userId,
        },
      });
    }

    // Create transaction for checkout
    const transaction = await paddleClient.createTransaction({
      customerId: customer.id,
      items: [
        {
          priceId,
          quantity: options.quantity || 1,
        },
      ],
      customData: {
        userId: options.userId,
        userEmail: options.userEmail,
        plan: options.plan,
        billing: options.billing,
        ...options.metadata,
      },
      checkoutSettings: {
        successUrl: options.successUrl,
      },
    });

    // For Paddle, checkout is typically done via Paddle.js on the frontend
    // The transaction ID is used to open the checkout overlay
    // We return a checkout URL that includes the transaction ID
    const checkoutUrl = `${options.successUrl.split('?')[0]}?paddle_checkout=true&transaction_id=${transaction.id}&plan=${options.plan}`;

    return {
      url: checkoutUrl,
      sessionId: transaction.id,
      gateway: 'paddle',
      clientSecret: transaction.id, // Transaction ID serves as client secret for Paddle.js
    };
  },

  async handleWebhook(payload: unknown, signature: string): Promise<WebhookResult> {
    if (!isPaddleConfigured()) {
      return { event: 'error', success: false, error: 'Paddle is not configured' };
    }

    // Verify signature
    if (signature && PADDLE_CONFIG.webhookSecret) {
      const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const isValid = paddleClient.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        return {
          event: 'error',
          success: false,
          error: 'Invalid webhook signature',
        };
      }
    }

    const event = paddleClient.parseWebhookPayload(payload);

    const result: WebhookResult = {
      event: event.event_type,
      success: true,
    };

    // Handle different event types
    switch (event.event_type) {
      case 'subscription.created':
      case 'subscription.activated': {
        const data = event.data as {
          id: string;
          customer_id: string;
          status: string;
          custom_data?: Record<string, string>;
        };

        result.subscriptionId = data.id;
        result.customerId = data.customer_id;
        result.status = mapSubscriptionStatus(data.status);

        const customData = data.custom_data;
        if (customData) {
          result.userEmail = customData.userEmail;
          result.userId = customData.userId;
          result.plan = customData.plan as WebhookResult['plan'];

          // Update user plan in database
          if (customData.userEmail && customData.plan) {
            try {
              await connectDB();
              await User.findByIdAndUpdate(customData.userEmail.toLowerCase(), {
                $set: {
                  plan: customData.plan,
                  paddleCustomerId: data.customer_id,
                  paddleSubscriptionId: data.id,
                },
              });
              console.log(`User ${customData.userEmail} upgraded to ${customData.plan} via Paddle`);
            } catch (error) {
              console.error('Error updating user from Paddle webhook:', error);
            }
          }
        }
        break;
      }

      case 'subscription.updated': {
        const data = event.data as {
          id: string;
          customer_id: string;
          status: string;
          custom_data?: Record<string, string>;
        };

        result.subscriptionId = data.id;
        result.customerId = data.customer_id;
        result.status = mapSubscriptionStatus(data.status);

        const customData = data.custom_data;
        if (customData?.userEmail) {
          result.userEmail = customData.userEmail;
          result.plan = customData.plan as WebhookResult['plan'];
        }
        break;
      }

      case 'subscription.canceled': {
        const data = event.data as {
          id: string;
          customer_id: string;
          custom_data?: Record<string, string>;
        };

        result.subscriptionId = data.id;
        result.customerId = data.customer_id;
        result.status = 'canceled';
        result.plan = 'free';

        const customData = data.custom_data;
        if (customData?.userEmail) {
          result.userEmail = customData.userEmail;

          // Downgrade user to free plan
          try {
            await connectDB();
            await User.findByIdAndUpdate(customData.userEmail.toLowerCase(), {
              $set: {
                plan: 'free',
                paddleSubscriptionId: null,
              },
            });
            console.log(`User ${customData.userEmail} downgraded to free via Paddle cancellation`);
          } catch (error) {
            console.error('Error downgrading user from Paddle webhook:', error);
          }
        }
        break;
      }

      case 'subscription.past_due': {
        const data = event.data as {
          id: string;
          customer_id: string;
          custom_data?: Record<string, string>;
        };

        result.subscriptionId = data.id;
        result.customerId = data.customer_id;
        result.status = 'past_due';

        const customData = data.custom_data;
        if (customData?.userEmail) {
          result.userEmail = customData.userEmail;
        }
        break;
      }

      case 'transaction.completed': {
        const data = event.data as {
          id: string;
          customer_id: string;
          status: string;
          details?: {
            totals?: {
              total: string;
              currency_code: string;
            };
          };
          custom_data?: Record<string, string>;
        };

        result.paymentId = data.id;
        result.customerId = data.customer_id;
        result.status = 'succeeded';

        if (data.details?.totals) {
          result.amount = parseInt(data.details.totals.total, 10);
          result.currency = data.details.totals.currency_code as WebhookResult['currency'];
        }

        const customData = data.custom_data;
        if (customData?.userEmail) {
          result.userEmail = customData.userEmail;
        }
        break;
      }

      case 'transaction.payment_failed': {
        const data = event.data as {
          id: string;
          customer_id: string;
          custom_data?: Record<string, string>;
        };

        result.paymentId = data.id;
        result.customerId = data.customer_id;
        result.status = 'failed';

        const customData = data.custom_data;
        if (customData?.userEmail) {
          result.userEmail = customData.userEmail;
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return result;
  },

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    const subscription = await paddleClient.getSubscription(subscriptionId);
    if (!subscription) {
      return null;
    }

    const userEmail = (subscription.customData as Record<string, string>)?.userEmail;
    return convertSubscription(subscription, userEmail);
  },

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    await paddleClient.cancelSubscription(
      subscriptionId,
      immediate ? 'immediately' : 'next_billing_period'
    );
  },

  async getCustomer(customerId: string): Promise<Customer | null> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    const customer = await paddleClient.getCustomer(customerId);
    if (!customer) {
      return null;
    }

    return {
      id: customer.id,
      gateway: 'paddle',
      email: customer.email || '',
      name: customer.name || undefined,
      metadata: customer.customData as Record<string, string>,
      createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
    };
  },

  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<Customer> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    const customer = await paddleClient.createCustomer({
      email,
      name,
      customData: metadata,
    });

    return {
      id: customer.id,
      gateway: 'paddle',
      email: customer.email || email,
      name: customer.name || undefined,
      metadata: customer.customData as Record<string, string>,
      createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
    };
  },

  async pauseSubscription(subscriptionId: string): Promise<void> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    await paddleClient.pauseSubscription(subscriptionId);
  },

  async resumeSubscription(subscriptionId: string): Promise<void> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    await paddleClient.resumeSubscription(subscriptionId);
  },

  async updateSubscription(
    subscriptionId: string,
    plan: 'pro' | 'team' | 'enterprise',
    billing: 'monthly' | 'yearly'
  ): Promise<Subscription> {
    if (!isPaddleConfigured()) {
      throw new Error('Paddle is not configured');
    }

    const priceId = getPaddlePriceId(plan, billing);
    if (!priceId) {
      throw new Error(`Price not configured for ${plan} ${billing}`);
    }

    const subscription = await paddleClient.updateSubscription(subscriptionId, {
      priceId,
      customData: { plan },
      prorationBillingMode: 'prorated_immediately',
    });

    const userEmail = (subscription.customData as Record<string, string>)?.userEmail;
    return convertSubscription(subscription, userEmail);
  },
};

// Export for direct access
export { paddleClient, isPaddleConfigured, getPaddlePriceId };
