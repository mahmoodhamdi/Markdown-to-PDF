import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { RegionalSubscription } from '@/lib/db/models/RegionalSubscription';
import { PlanType } from '@/lib/plans/config';

interface SubscriptionResponse {
  plan: PlanType;
  status: string;
  billing: 'monthly' | 'yearly' | null;
  gateway: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
  customerId: string | null;
}

/**
 * GET /api/subscriptions
 * Get current user's subscription details
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for active regional subscription first (Paymob/PayTabs)
    const regionalSub = await RegionalSubscription.findOne({
      userId: session.user.email,
      status: { $in: ['active', 'past_due', 'trialing'] },
    }).sort({ createdAt: -1 });

    if (regionalSub) {
      const response: SubscriptionResponse = {
        plan: regionalSub.plan as PlanType,
        status: regionalSub.status,
        billing: regionalSub.billing,
        gateway: regionalSub.gateway,
        currentPeriodEnd: regionalSub.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: regionalSub.cancelAtPeriodEnd || false,
        subscriptionId: regionalSub.gatewayTransactionId,
        customerId: regionalSub.gatewayCustomerId || null,
      };
      return NextResponse.json(response);
    }

    // Check Stripe subscription (stored in user model)
    if (user.stripeSubscriptionId && user.plan !== 'free') {
      const response: SubscriptionResponse = {
        plan: user.plan || 'free',
        status: 'active', // Would need to check Stripe for actual status
        billing: null, // Would need to check Stripe for billing period
        gateway: 'stripe',
        currentPeriodEnd: null, // Would need to check Stripe
        cancelAtPeriodEnd: false,
        subscriptionId: user.stripeSubscriptionId,
        customerId: user.stripeCustomerId || null,
      };
      return NextResponse.json(response);
    }

    // Free plan
    const response: SubscriptionResponse = {
      plan: user.plan || 'free',
      status: 'active',
      billing: null,
      gateway: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      subscriptionId: null,
      customerId: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
