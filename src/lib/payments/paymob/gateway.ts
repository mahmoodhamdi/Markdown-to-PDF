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

// In-memory storage for subscriptions (in production, use a proper database)
// Paymob doesn't have native subscription support, so we track it ourselves
interface _PaymobSubscription {
  id: string;
  customerId: string;
  userEmail: string;
  plan: 'pro' | 'team' | 'enterprise';
  billing: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  lastTransactionId?: string;
}

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
      // Payment successful - update user plan
      result.status = 'succeeded';

      // Try to extract plan info from special reference or extras
      // The special reference format is: userId_plan_billing_timestamp
      const extras = transactionPayload.obj?.data as Record<string, unknown> | undefined;
      const plan = (extras?.plan as string) || 'pro';
      const userEmail = result.userEmail;

      if (userEmail) {
        try {
          await connectDB();
          await User.findByIdAndUpdate(userEmail, {
            $set: {
              plan,
              paymobTransactionId: String(parsed.transactionId),
            },
          });
          result.plan = plan as WebhookResult['plan'];
        } catch (error) {
          console.error('Error updating user plan from Paymob webhook:', error);
        }
      }
    } else if (parsed.isRefunded) {
      result.event = 'payment.refunded';
      result.status = 'refunded';
    } else if (parsed.isVoided) {
      result.event = 'payment.voided';
      result.status = 'canceled';
    } else if (parsed.errorOccurred) {
      result.event = 'payment.failed';
      result.status = 'failed';
    }

    return result;
  },

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    // Paymob doesn't have native subscription support
    // We would need to store subscription data in our database
    // For now, return null - in production, query from MongoDB
    try {
      await connectDB();
      const user = await User.findOne({
        paymobSubscriptionId: subscriptionId,
      });

      if (!user) {
        return null;
      }

      return {
        id: subscriptionId,
        gateway: 'paymob',
        customerId: user._id,
        userEmail: user.email,
        plan: user.plan,
        status: 'active',
        billing: 'monthly', // Default, should be stored
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        createdAt: user.createdAt,
      };
    } catch {
      return null;
    }
  },

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    // Paymob doesn't have native subscription management
    // We handle this by updating our database
    try {
      await connectDB();
      await User.findOneAndUpdate(
        { paymobSubscriptionId: subscriptionId },
        {
          $set: immediate
            ? { plan: 'free', paymobSubscriptionId: null }
            : { cancelAtPeriodEnd: true },
        }
      );
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
