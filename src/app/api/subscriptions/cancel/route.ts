import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { RegionalSubscription } from '@/lib/db/models/RegionalSubscription';
import { stripeGateway } from '@/lib/payments/stripe/gateway';
import { paymobGateway } from '@/lib/payments/paymob/gateway';
import { paytabsGateway } from '@/lib/payments/paytabs/gateway';
import { emailService } from '@/lib/email/service';

/**
 * POST /api/subscriptions/cancel
 * Cancel the current subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { immediate = false, reason: _reason } = body;

    await connectDB();

    const user = await User.findById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for regional subscription first
    const regionalSub = await RegionalSubscription.findOne({
      userId: session.user.email,
      status: { $in: ['active', 'past_due', 'trialing'] },
    }).sort({ createdAt: -1 });

    if (regionalSub) {
      // Cancel based on gateway
      try {
        if (regionalSub.gateway === 'paymob') {
          await paymobGateway.cancelSubscription(regionalSub.gatewayTransactionId, immediate);
        } else if (regionalSub.gateway === 'paytabs') {
          await paytabsGateway.cancelSubscription(regionalSub.gatewayTransactionId, immediate);
        }

        // Update regional subscription using the cancel method
        await regionalSub.cancel(immediate);

        // If immediate, downgrade user to free
        if (immediate) {
          user.plan = 'free';
          await user.save();
        }

        // Send cancellation email
        await emailService.sendSubscriptionCanceled(
          { email: session.user.email, name: user.name },
          {
            plan: regionalSub.plan,
            endDate: immediate ? new Date() : regionalSub.currentPeriodEnd,
            immediate,
          }
        );

        return NextResponse.json({
          success: true,
          message: immediate
            ? 'Subscription canceled immediately'
            : 'Subscription will cancel at period end',
          cancelAtPeriodEnd: !immediate,
          currentPeriodEnd: regionalSub.currentPeriodEnd.toISOString(),
        });
      } catch (error) {
        console.error('Regional subscription cancellation error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel subscription with payment provider' },
          { status: 500 }
        );
      }
    }

    // Check Stripe subscription
    if (user.stripeSubscriptionId) {
      try {
        await stripeGateway.cancelSubscription(user.stripeSubscriptionId, immediate);

        if (immediate) {
          user.plan = 'free';
          user.stripeSubscriptionId = undefined;
          await user.save();
        }

        // Send cancellation email
        await emailService.sendSubscriptionCanceled(
          { email: session.user.email, name: user.name },
          {
            plan: user.plan,
            endDate: new Date(),
            immediate,
          }
        );

        return NextResponse.json({
          success: true,
          message: immediate
            ? 'Subscription canceled immediately'
            : 'Subscription will cancel at period end',
        });
      } catch (error) {
        console.error('Stripe subscription cancellation error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel subscription with Stripe' },
          { status: 500 }
        );
      }
    }

    // No active subscription found
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
