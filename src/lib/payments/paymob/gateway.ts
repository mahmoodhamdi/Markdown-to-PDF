/**
 * Paymob Payment Gateway Implementation
 * Implements the unified PaymentGateway interface for Paymob
 */

import {
  PaymentGateway,
  CheckoutOptions,
  CheckoutResult,
  WebhookResult,
  Subscription,
  Customer,
} from '../types';
import { isPaymobConfigured, PAYMOB_CONFIG } from './config';
import { paymobClient, PaymobTransactionCallback } from './client';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import {
  RegionalSubscription,
  createRegionalSubscription,
  type IRegionalSubscription,
} from '@/lib/db/models/RegionalSubscription';

/**
 * Paymob Payment Gateway
 */
export const paymobGateway: PaymentGateway = {
  name: 'paymob',

  isConfigured(): boolean {
    return isPaymobConfigured();
  },

  async createCheckoutSession(options: CheckoutOptions): Promise<CheckoutResult> {
    if (!isPaymobConfigured()) {
      throw new Error('Paymob is not configured');
    }

    const result = await paymobClient.createCheckoutSession({
      plan: options.plan,
      billing: options.billing,
      userEmail: options.userEmail,
      userName: options.userName || options.userEmail.split('@')[0],
      userId: options.userId,
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
    });

    return {
      url: result.checkoutUrl,
      sessionId: result.intentionId,
      gateway: 'paymob',
      clientSecret: result.clientSecret,
    };
  },

  async handleWebhook(payload: unknown, signature: string): Promise<WebhookResult> {
    if (!isPaymobConfigured()) {
      return { event: 'error', success: false, error: 'Paymob is not configured' };
    }

    // Type check the payload
    const transactionPayload = payload as PaymobTransactionCallback;

    // Verify signature
    if (PAYMOB_CONFIG.hmacSecret && signature) {
      // For processed callback, verify using signature from query params
      // The signature verification is already done in the webhook route
    }

    // Verify webhook signature
    if (!paymobClient.verifyWebhookSignature(transactionPayload)) {
      return {
        event: 'error',
        success: false,
        error: 'Invalid webhook signature',
      };
    }

    const parsed = paymobClient.parseTransactionCallback(transactionPayload);

    const result: WebhookResult = {
      event: parsed.success ? 'payment.success' : 'payment.failed',
      success: true,
      paymentId: String(parsed.transactionId),
      amount: parsed.amount,
      currency: parsed.currency as WebhookResult['currency'],
    };

    // Extract metadata from billing data email or special reference
    const billingEmail = parsed.billingEmail;
    if (billingEmail) {
      result.userEmail = billingEmail;
    }

    if (parsed.success && !parsed.isVoided && !parsed.isRefunded) {
      // Payment successful - update user plan and create/update subscription
      result.status = 'succeeded';

      // Try to extract plan info from special reference or extras
      const extras = transactionPayload.obj?.data as Record<string, unknown> | undefined;
      const plan = (extras?.plan as string) || 'pro';
      const billing = (extras?.billing as string) || 'monthly';
      const userEmail = result.userEmail;

      if (userEmail) {
        try {
          await connectDB();

          // Update user plan
          await User.findByIdAndUpdate(userEmail, {
            $set: { plan },
          });

          // Create or update regional subscription
          const existingSub = await RegionalSubscription.findActiveByUserId(userEmail, 'paymob');

          if (existingSub) {
            // Renew existing subscription
            await existingSub.renew(
              String(parsed.transactionId),
              parsed.amount,
              parsed.currency
            );
          } else {
            // Create new subscription
            await createRegionalSubscription({
              userId: userEmail,
              gateway: 'paymob',
              gatewayTransactionId: String(parsed.transactionId),
              plan: plan as 'pro' | 'team' | 'enterprise',
              billing: billing as 'monthly' | 'yearly',
              amount: parsed.amount,
              currency: parsed.currency,
              metadata: extras,
            });
          }

          result.plan = plan as WebhookResult['plan'];
        } catch (error) {
          console.error('Error updating user plan from Paymob webhook:', error);
        }
      }
    } else if (parsed.isRefunded) {
      result.event = 'payment.refunded';
      result.status = 'refunded';

      // Update subscription status
      if (result.userEmail) {
        try {
          await connectDB();
          const subscription = await RegionalSubscription.findByTransactionId(
            'paymob',
            String(parsed.transactionId)
          );
          if (subscription) {
            subscription.status = 'canceled';
            subscription.canceledAt = new Date();
            await subscription.save();

            // Downgrade user to free
            await User.findByIdAndUpdate(result.userEmail, {
              $set: { plan: 'free' },
            });
          }
        } catch (error) {
          console.error('Error handling Paymob refund:', error);
        }
      }
    } else if (parsed.isVoided) {
      result.event = 'payment.voided';
      result.status = 'canceled';
    } else if (parsed.errorOccurred) {
      result.event = 'payment.failed';
      result.status = 'failed';

      // Update subscription status to past_due
      if (result.userEmail) {
        try {
          await connectDB();
          const subscription = await RegionalSubscription.findActiveByUserId(
            result.userEmail,
            'paymob'
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
        await RegionalSubscription.findByTransactionId('paymob', subscriptionId);

      // If not found, try to find by user ID
      if (!subscription) {
        subscription = await RegionalSubscription.findActiveByUserId(subscriptionId, 'paymob');
      }

      if (!subscription) {
        return null;
      }

      return {
        id: subscription.gatewayTransactionId,
        gateway: 'paymob',
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
      console.error('Error getting Paymob subscription:', error);
      return null;
    }
  },

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    try {
      await connectDB();

      // Find subscription
      let subscription = await RegionalSubscription.findByTransactionId('paymob', subscriptionId);

      if (!subscription) {
        // Try finding by user ID
        subscription = await RegionalSubscription.findActiveByUserId(subscriptionId, 'paymob');
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
      console.error('Error canceling Paymob subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  },

  async getCustomer(customerId: string): Promise<Customer | null> {
    // Paymob doesn't have a customer management API
    // We use our database
    try {
      await connectDB();
      const user = await User.findById(customerId);

      if (!user) {
        return null;
      }

      return {
        id: user._id,
        gateway: 'paymob',
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };
    } catch {
      return null;
    }
  },

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Customer> {
    // Paymob doesn't have customer creation API
    // We just return the user data
    return {
      id: email,
      gateway: 'paymob',
      email,
      name,
      metadata,
      createdAt: new Date(),
    };
  },
};

// Export for direct access
export { paymobClient, isPaymobConfigured };
