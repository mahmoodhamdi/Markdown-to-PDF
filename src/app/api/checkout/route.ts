/**
 * Unified Checkout API
 * POST /api/checkout - Create checkout session with auto-selected or specified gateway
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  selectGateway,
  getGateway,
  isGatewayConfigured,
  PaymentGatewayType,
  CheckoutOptions,
} from '@/lib/payments';
import { z } from 'zod';

// Request validation schema
const checkoutSchema = z.object({
  plan: z.enum(['pro', 'team', 'enterprise']),
  billing: z.enum(['monthly', 'yearly']),
  gateway: z.enum(['stripe', 'paymob', 'paytabs', 'paddle']).optional(),
  countryCode: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
  quantity: z.number().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'You must be logged in to subscribe.' },
      { status: 401 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json(
        { error: `Invalid request: ${errors}` },
        { status: 400 }
      );
    }

    const { plan, billing, gateway, countryCode, currency, quantity } = validation.data;

    // Select payment gateway
    let selectedGateway;

    if (gateway) {
      // User specified a gateway
      if (!isGatewayConfigured(gateway)) {
        return NextResponse.json(
          { error: `Payment gateway '${gateway}' is not configured.` },
          { status: 503 }
        );
      }
      selectedGateway = getGateway(gateway);
    } else {
      // Auto-select based on location/currency
      try {
        selectedGateway = selectGateway({
          countryCode,
          currency: currency as CheckoutOptions['currency'],
          fallbackOrder: ['stripe', 'paddle', 'paytabs', 'paymob'],
        });
      } catch {
        return NextResponse.json(
          { error: 'No payment gateway is available. Please contact support.' },
          { status: 503 }
        );
      }
    }

    // Build checkout options
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutOptions: CheckoutOptions = {
      userEmail: session.user.email,
      userId: session.user.id,
      userName: session.user.name || undefined,
      plan,
      billing,
      successUrl: `${baseUrl}/pricing?success=true&plan=${plan}&gateway=${selectedGateway.name}`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
      locale: request.headers.get('accept-language')?.split(',')[0]?.split('-')[0],
      currency: currency as CheckoutOptions['currency'],
      quantity,
      metadata: {
        source: 'web',
        countryCode: countryCode || 'unknown',
      },
    };

    // Create checkout session
    const result = await selectedGateway.createCheckoutSession(checkoutOptions);

    return NextResponse.json({
      url: result.url,
      sessionId: result.sessionId,
      gateway: result.gateway,
      clientSecret: result.clientSecret,
    });
  } catch (error) {
    console.error('Checkout session error:', error);

    // Return more specific error messages based on error type
    if (error instanceof Error) {
      // Check for 'Price not configured' first (more specific)
      if (error.message.includes('Price not configured')) {
        return NextResponse.json(
          { error: 'This plan is not available yet. Please contact support.' },
          { status: 503 }
        );
      }
      // Then check for general 'not configured' gateway errors
      if (error.message.includes('not configured')) {
        return NextResponse.json(
          { error: error.message },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout - Get available gateways and their info
 */
export async function GET(request: NextRequest) {
  const countryCode = request.nextUrl.searchParams.get('country');

  // Get list of configured gateways
  const gateways: Array<{
    id: PaymentGatewayType;
    name: string;
    configured: boolean;
    recommended: boolean;
  }> = [
    {
      id: 'stripe',
      name: 'Stripe',
      configured: isGatewayConfigured('stripe'),
      recommended: !countryCode || !['EG', 'SA', 'AE', 'KW', 'BH', 'OM', 'QA', 'JO'].includes(countryCode.toUpperCase()),
    },
    {
      id: 'paymob',
      name: 'Paymob',
      configured: isGatewayConfigured('paymob'),
      recommended: countryCode?.toUpperCase() === 'EG',
    },
    {
      id: 'paytabs',
      name: 'PayTabs',
      configured: isGatewayConfigured('paytabs'),
      recommended: ['SA', 'AE', 'KW', 'BH', 'OM', 'QA', 'JO'].includes(countryCode?.toUpperCase() || ''),
    },
    {
      id: 'paddle',
      name: 'Paddle',
      configured: isGatewayConfigured('paddle'),
      recommended: false,
    },
  ];

  // Filter to only configured gateways
  const availableGateways = gateways.filter((g) => g.configured);

  if (availableGateways.length === 0) {
    return NextResponse.json(
      { error: 'No payment gateways are configured.' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    gateways: availableGateways,
    recommended: availableGateways.find((g) => g.recommended)?.id || availableGateways[0].id,
  });
}
