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

interface PromoCodeValidationResult {
  valid: boolean;
  discount?: string;
  discountType?: 'percent' | 'fixed';
  discountAmount?: number;
  description?: string;
  error?: string;
}

/**
 * POST /api/subscriptions/promo-code/validate
 * Validate a promo code without applying it
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    try {
      // Search for promotion codes matching the code
      const promotionCodes = await stripe.promotionCodes.list({
        code: code.toUpperCase(),
        active: true,
        limit: 1,
        expand: ['data.coupon'],
      });

      if (promotionCodes.data.length === 0) {
        const result: PromoCodeValidationResult = {
          valid: false,
          error: 'Invalid or expired promo code',
        };
        return NextResponse.json(result);
      }

      const promoCode = promotionCodes.data[0];
      // Coupon is expanded from the API call - use type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coupon = (promoCode as any).coupon as Stripe.Coupon;

      // Build discount description
      let discount: string;
      let discountType: 'percent' | 'fixed';
      let discountAmount: number;

      if (coupon?.percent_off) {
        discount = `${coupon.percent_off}% off`;
        discountType = 'percent';
        discountAmount = coupon.percent_off;
      } else if (coupon?.amount_off) {
        const currency = (coupon.currency || 'usd').toUpperCase();
        const amount = coupon.amount_off / 100;
        discount = `${currency} ${amount} off`;
        discountType = 'fixed';
        discountAmount = amount;
      } else {
        discount = 'Discount applied';
        discountType = 'percent';
        discountAmount = 0;
      }

      // Check duration
      let description = discount;
      if (coupon?.duration === 'once') {
        description += ' (first payment)';
      } else if (coupon?.duration === 'repeating' && coupon?.duration_in_months) {
        description += ` (for ${coupon.duration_in_months} months)`;
      }

      const result: PromoCodeValidationResult = {
        valid: true,
        discount,
        discountType,
        discountAmount,
        description,
      };

      return NextResponse.json(result);
    } catch (error) {
      console.error('Promo code validation error:', error);
      const result: PromoCodeValidationResult = {
        valid: false,
        error: 'Failed to validate promo code',
      };
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Promo code validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions/promo-code
 * Apply a promo code to an existing subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription to apply promo code' },
        { status: 400 }
      );
    }

    try {
      // Search for promotion codes matching the code
      const promotionCodes = await stripe.promotionCodes.list({
        code: code.toUpperCase(),
        active: true,
        limit: 1,
        expand: ['data.coupon'],
      });

      if (promotionCodes.data.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired promo code',
        });
      }

      const promoCode = promotionCodes.data[0];

      // Apply the promotion code to the subscription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (stripe.subscriptions as any).update(user.stripeSubscriptionId, {
        promotion_code: promoCode.id,
      });

      // Build discount description (coupon is expanded from the API call)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coupon = (promoCode as any).coupon as Stripe.Coupon;
      let discount: string;
      if (coupon?.percent_off) {
        discount = `${coupon.percent_off}% off`;
      } else if (coupon?.amount_off) {
        const currency = (coupon.currency || 'usd').toUpperCase();
        const amount = coupon.amount_off / 100;
        discount = `${currency} ${amount} off`;
      } else {
        discount = 'Discount applied';
      }

      return NextResponse.json({
        success: true,
        discount,
        message: 'Promo code applied successfully',
      });
    } catch (error) {
      console.error('Apply promo code error:', error);
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        return NextResponse.json({
          success: false,
          error: error.message,
        });
      }
      return NextResponse.json({
        success: false,
        error: 'Failed to apply promo code',
      });
    }
  } catch (error) {
    console.error('Apply promo code error:', error);
    return NextResponse.json(
      { error: 'Failed to apply promo code' },
      { status: 500 }
    );
  }
}
