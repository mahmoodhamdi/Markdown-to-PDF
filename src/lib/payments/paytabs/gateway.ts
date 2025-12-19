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

      // Update user plan in database
      if (parsed.customerEmail && parsed.plan) {
        try {
          await connectDB();
          await User.findByIdAndUpdate(parsed.customerEmail.toLowerCase(), {
            $set: {
              plan: parsed.plan,
              paytabsTransactionRef: parsed.transactionRef,
            },
          });
          console.log(`User ${parsed.customerEmail} upgraded to ${parsed.plan} via PayTabs`);
        } catch (error) {
          console.error('Error updating user from PayTabs webhook:', error);
        }
      }
    } else {
      result.status = 'failed';
      result.error = parsed.responseMessage;
    }

    return result;
  },

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    // PayTabs doesn't have native subscription support
    // Query our database instead
    try {
      await connectDB();
      const user = await User.findOne({
        paytabsTransactionRef: subscriptionId,
      });

      if (!user) {
        return null;
      }

      return {
        id: subscriptionId,
        gateway: 'paytabs',
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
    // PayTabs doesn't have native subscription management
    // Update our database
    try {
      await connectDB();
      await User.findOneAndUpdate(
        { paytabsTransactionRef: subscriptionId },
        {
          $set: immediate
            ? { plan: 'free', paytabsTransactionRef: null }
            : { cancelAtPeriodEnd: true },
        }
      );
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
