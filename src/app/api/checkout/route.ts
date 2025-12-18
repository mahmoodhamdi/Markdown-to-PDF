import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { stripe, getPriceId, isStripeConfigured } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: 'Payment system is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'You must be logged in to subscribe.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { plan, billing } = body as {
      plan: 'pro' | 'team' | 'enterprise';
      billing: 'monthly' | 'yearly';
    };

    // Validate plan
    if (!['pro', 'team', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected.' },
        { status: 400 }
      );
    }

    // Validate billing period
    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json(
        { error: 'Invalid billing period.' },
        { status: 400 }
      );
    }

    // Get price ID
    const priceId = getPriceId(plan, billing);
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for this plan. Please contact support.' },
        { status: 503 }
      );
    }

    // Get or create Stripe customer
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = newCustomer.id;
    }

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/pricing?success=true&plan=${plan}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email,
        plan,
        billing,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          userEmail: session.user.email,
          plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session.' },
      { status: 500 }
    );
  }
}
