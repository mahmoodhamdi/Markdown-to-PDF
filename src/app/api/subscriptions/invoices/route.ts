import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { RegionalSubscription } from '@/lib/db/models/RegionalSubscription';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoiceUrl?: string;
  receiptUrl?: string;
}

/**
 * GET /api/subscriptions/invoices
 * Get billing history for the current user
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

    const invoices: Invoice[] = [];

    // Get regional subscriptions history
    const regionalSubs = await RegionalSubscription.find({
      userId: session.user.email,
    })
      .sort({ createdAt: -1 })
      .limit(12);

    for (const sub of regionalSubs) {
      // Generate invoice from subscription data
      // In production, you would fetch actual invoices from the payment gateway
      if (sub.status === 'active' || sub.status === 'canceled') {
        const amount =
          sub.billing === 'yearly'
            ? sub.plan === 'pro'
              ? 48
              : sub.plan === 'team'
                ? 144
                : 948
            : sub.plan === 'pro'
              ? 5
              : sub.plan === 'team'
                ? 15
                : 99;

        invoices.push({
          id: sub.gatewayTransactionId,
          date: sub.currentPeriodStart?.toISOString() || sub.createdAt.toISOString(),
          amount,
          currency: sub.currency || 'USD',
          status: 'paid',
          description: `${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} Plan - ${sub.billing === 'yearly' ? 'Annual' : 'Monthly'}`,
        });
      }
    }

    // Note: For Stripe customers, invoice data is currently derived from subscription records.
    // Direct Stripe Invoice API integration can be added in a future enhancement.
    // See: https://stripe.com/docs/api/invoices/list

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'Failed to get invoices' }, { status: 500 });
  }
}
