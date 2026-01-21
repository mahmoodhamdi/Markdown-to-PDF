import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { stripeGateway } from '@/lib/payments/stripe/gateway';

/**
 * POST /api/subscriptions/pause
 * Pause the current Stripe subscription
 * Note: Only Stripe supports pause/resume functionality
 */
export async function POST(_request: NextRequest) {
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

    // Only Stripe supports pause functionality
    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Pause is only available for Stripe subscriptions' },
        { status: 400 }
      );
    }

    // Check if pause is supported
    if (!stripeGateway.pauseSubscription) {
      return NextResponse.json({ error: 'Pause functionality is not configured' }, { status: 500 });
    }

    try {
      await stripeGateway.pauseSubscription(user.stripeSubscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Subscription paused successfully',
      });
    } catch (error) {
      console.error('Stripe pause subscription error:', error);
      return NextResponse.json(
        { error: 'Failed to pause subscription with Stripe' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Pause subscription error:', error);
    return NextResponse.json({ error: 'Failed to pause subscription' }, { status: 500 });
  }
}
