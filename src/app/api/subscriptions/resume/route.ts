import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { stripeGateway } from '@/lib/payments/stripe/gateway';

/**
 * POST /api/subscriptions/resume
 * Resume a paused Stripe subscription or reactivate a canceled subscription
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

    // Only Stripe supports resume functionality
    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Resume is only available for Stripe subscriptions' },
        { status: 400 }
      );
    }

    // Check if resume is supported
    if (!stripeGateway.resumeSubscription) {
      return NextResponse.json(
        { error: 'Resume functionality is not configured' },
        { status: 500 }
      );
    }

    try {
      await stripeGateway.resumeSubscription(user.stripeSubscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Subscription resumed successfully',
      });
    } catch (error) {
      console.error('Stripe resume subscription error:', error);
      return NextResponse.json(
        { error: 'Failed to resume subscription with Stripe' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resume subscription error:', error);
    return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
  }
}
