import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { stripeGateway } from '@/lib/payments/stripe/gateway';

/**
 * GET /api/subscriptions/portal-url
 * Get the Stripe customer portal URL for managing subscription and payment methods
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`;

    const { searchParams } = new URL(request.url);
    const rawReturnUrl = searchParams.get('returnUrl');

    // Validate returnUrl against the app's own origin to prevent open redirect attacks.
    let returnUrl = defaultReturnUrl;
    if (rawReturnUrl) {
      try {
        const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || '').hostname;
        const candidateHostname = new URL(rawReturnUrl).hostname;
        if (candidateHostname === appOrigin) {
          returnUrl = rawReturnUrl;
        }
        // If hostnames don't match, silently fall back to the default URL.
      } catch {
        // Malformed URL — fall back to the default URL.
      }
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only Stripe has a customer portal
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Customer portal is only available for Stripe customers' },
        { status: 400 }
      );
    }

    // Check if portal URL is supported
    if (!stripeGateway.getCustomerPortalUrl) {
      return NextResponse.json({ error: 'Customer portal is not configured' }, { status: 500 });
    }

    try {
      const portalUrl = await stripeGateway.getCustomerPortalUrl(user.stripeCustomerId, returnUrl);

      return NextResponse.json({
        url: portalUrl,
      });
    } catch (error) {
      console.error('Stripe portal URL error:', error);
      return NextResponse.json({ error: 'Failed to generate portal URL' }, { status: 500 });
    }
  } catch (error) {
    console.error('Get portal URL error:', error);
    return NextResponse.json({ error: 'Failed to get portal URL' }, { status: 500 });
  }
}
