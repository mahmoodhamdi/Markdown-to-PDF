/**
 * PayTabs Payment Gateway Implementation
 * Implements the unified PaymentGateway interface for PayTabs (MENA region)
 */

import {
  PaymentGateway,
  CheckoutOptions,
  CheckoutResult,
  WebhookResult,
  Subscription,
  Customer,
} from '../types';
import { isPayTabsConfigured } from './config';
import { paytabsClient, PayTabsCallbackData } from './client';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import {
  RegionalSubscription,
  createRegionalSubscription,
  type IRegionalSubscription,
} from '@/lib/db/models/RegionalSubscription';

/**
 * PayTabs Payment Gateway
 */
export const paytabsGateway: PaymentGateway = {
  name: 'paytabs',

  isConfigured(): boolean {
    return isPayTabsConfigured();
  },

  async createCheckoutSession(options: CheckoutOptions): Promise<CheckoutResult> {
    if (!isPayTabsConfigured()) {
      throw new Error('PayTabs is not configured');
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const result = await paytabsClient.createCheckoutSession({
      plan: options.plan,
      billing: options.billing,
      userEmail: options.userEmail,
      userName: options.userName || options.userEmail.split('@')[0],
      userId: options.userId,
      successUrl: options.successUrl,
      callbackUrl: `${baseUrl}/api/webhooks/paytabs`,
    });

    return {
      url: result.redirectUrl,
      sessionId: result.transactionRef,
      gateway: 'paytabs',
    };
  },

  async handleWebhook(payload: unknown, _signature: string): Promise<WebhookResult> {
    if (!isPayTabsConfigured()) {
      return { event: 'error', success: false, error: 'PayTabs is not configured' };
    }

    const callback = payload as PayTabsCallbackData;

    // Verify signature
    if (callback.signature && !paytabsClient.verifyCallbackSignature(callback)) {
      return {
        event: 'error',
        success: false,
        error: 'Invalid webhook signature',
      };
    }

    const parsed = paytabsClient.parseCallbackData(callback);

    const result: WebhookResult = {
      event: parsed.success ? 'payment.success' : 'payment.failed',
      success: true,
      paymentId: parsed.transactionRef,
      amount: parsed.amount * 100, // Convert to smallest unit
      currency: parsed.currency as WebhookResult['currency'],
      userEmail: parsed.customerEmail,
      userId: parsed.userId,
      plan: parsed.plan as WebhookResult['plan'],
    };

    if (parsed.success) {
      result.status = 'succeeded';

      // Update user plan in database and create subscription
      if (parsed.customerEmail && parsed.plan) {
        try {
          await connectDB();

          const userEmail = parsed.customerEmail.toLowerCase();
          const billing = (parsed.billing as string) || 'monthly';

          // Update user plan
          await User.findByIdAndUpdate(userEmail, {
            $set: { plan: parsed.plan },
          });

          // Create or update regional subscription
          const existingSub = await RegionalSubscription.findActiveByUserId(userEmail, 'paytabs');

          if (existingSub) {
            // Renew existing subscription
            await existingSub.renew(
              parsed.transactionRef,
              parsed.amount * 100,
              parsed.currency
            );
          } else {
            // Create new subscription
            await createRegionalSubscription({
              userId: userEmail,
              gateway: 'paytabs',
              gatewayTransactionId: parsed.transactionRef,
              plan: parsed.plan as 'pro' | 'team' | 'enterprise',
              billing: billing as 'monthly' | 'yearly',
              amount: parsed.amount * 100,
              currency: parsed.currency,
              metadata: {
                userId: parsed.userId,
                responseCode: parsed.responseCode,
              },
            });
          }

          console.log(`User ${parsed.customerEmail} upgraded to ${parsed.plan} via PayTabs`);
        } catch (error) {
          console.error('Error updating user from PayTabs webhook:', error);
        }
      }
    } else {
      result.status = 'failed';
      result.error = parsed.responseMessage;

      // Update subscription status to past_due if exists
      if (parsed.customerEmail) {
        try {
          await connectDB();
          const subscription = await RegionalSubscription.findActiveByUserId(
            parsed.customerEmail.toLowerCase(),
            'paytabs'
          );
          if (subscription) {
            subscription.status = 'past_due';
            await subscription.save();
          }
        } catch (error) {
          console.error('Error updating subscription status:', error);
        }
      }
    }

    return result;
  },

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      await connectDB();

      // Try to find by transaction ID first
      let subscription: IRegionalSubscription | null =
        await RegionalSubscription.findByTransactionId('paytabs', subscriptionId);

      // If not found, try to find by user ID
      if (!subscription) {
        subscription = await RegionalSubscription.findActiveByUserId(subscriptionId, 'paytabs');
      }

      if (!subscription) {
        return null;
      }

      return {
        id: subscription.gatewayTransactionId,
        gateway: 'paytabs',
        customerId: subscription.userId,
        userEmail: subscription.userId,
        plan: subscription.plan,
        status: subscription.status,
        billing: subscription.billing,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
      };
    } catch (error) {
      console.error('Error getting PayTabs subscription:', error);
      return null;
    }
  },

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    try {
      await connectDB();

      // Find subscription
      let subscription = await RegionalSubscription.findByTransactionId('paytabs', subscriptionId);

      if (!subscription) {
        // Try finding by user ID
        subscription = await RegionalSubscription.findActiveByUserId(subscriptionId, 'paytabs');
      }

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Cancel the subscription
      await subscription.cancel(immediate);

      // If immediate, downgrade user to free plan
      if (immediate) {
        await User.findByIdAndUpdate(subscription.userId, {
          $set: { plan: 'free' },
        });
      }
    } catch (error) {
      console.error('Error canceling PayTabs subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  },

  async getCustomer(customerId: string): Promise<Customer | null> {
    // PayTabs doesn't have a customer management API
    // Use our database
    try {
      await connectDB();
      const user = await User.findById(customerId);

      if (!user) {
        return null;
      }

      return {
        id: user._id,
        gateway: 'paytabs',
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };
    } catch {
      return null;
    }
  },

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Customer> {
    // PayTabs doesn't have customer creation API
    return {
      id: email,
      gateway: 'paytabs',
      email,
      name,
      metadata,
      createdAt: new Date(),
    };
  },
};

// Export for direct access
export { paytabsClient, isPayTabsConfigured };
