import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import Stripe from 'stripe';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

interface PaymentMethodResponse {
  id: string;
  type: 'card' | 'wallet' | 'bank';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  walletType?: 'apple_pay' | 'google_pay';
  isDefault: boolean;
  gateway: 'stripe';
}

/**
 * GET /api/subscriptions/payment-methods
 * Get payment methods for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    await connectDB();

    const user = await User.findById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    try {
      // Get customer to find default payment method
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      const defaultPaymentMethodId =
        typeof customer !== 'string' && !customer.deleted
          ? customer.invoice_settings?.default_payment_method
          : null;

      // Get all payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      const methods: PaymentMethodResponse[] = paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: 'card' as const,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        walletType:
          pm.card?.wallet?.type === 'apple_pay'
            ? 'apple_pay'
            : pm.card?.wallet?.type === 'google_pay'
              ? 'google_pay'
              : undefined,
        isDefault: pm.id === defaultPaymentMethodId,
        gateway: 'stripe' as const,
      }));

      return NextResponse.json({ paymentMethods: methods });
    } catch (error) {
      console.error('Get payment methods error:', error);
      return NextResponse.json({ error: 'Failed to get payment methods' }, { status: 500 });
    }
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json({ error: 'Failed to get payment methods' }, { status: 500 });
  }
}

/**
 * PUT /api/subscriptions/payment-methods
 * Set a payment method as default
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    await connectDB();

    const user = await User.findById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    try {
      // Set the payment method as default
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Also update subscription if exists
      if (user.stripeSubscriptionId) {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          default_payment_method: paymentMethodId,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Default payment method updated',
      });
    } catch (error) {
      console.error('Set default payment method error:', error);
      return NextResponse.json({ error: 'Failed to set default payment method' }, { status: 500 });
    }
  } catch (error) {
    console.error('Set default payment method error:', error);
    return NextResponse.json({ error: 'Failed to set default payment method' }, { status: 500 });
  }
}

/**
 * DELETE /api/subscriptions/payment-methods
 * Remove a payment method
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    await connectDB();

    const user = await User.findById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    try {
      // Verify the payment method belongs to this customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.customer !== user.stripeCustomerId) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
      }

      // Detach the payment method
      await stripe.paymentMethods.detach(paymentMethodId);

      return NextResponse.json({
        success: true,
        message: 'Payment method removed',
      });
    } catch (error) {
      console.error('Remove payment method error:', error);
      return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 });
    }
  } catch (error) {
    console.error('Remove payment method error:', error);
    return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 });
  }
}
