/**
 * PayTabs Webhook Handler
 * POST /api/webhooks/paytabs - Handle PayTabs payment callbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { isPayTabsConfigured } from '@/lib/payments/paytabs/config';
import { paytabsClient, PayTabsCallbackData } from '@/lib/payments/paytabs/client';
import { paytabsGateway } from '@/lib/payments/paytabs/gateway';
import { emailService } from '@/lib/email/service';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { PlanType } from '@/lib/plans/config';

/**
 * Handle POST request (callback from PayTabs)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if PayTabs is configured
    if (!isPayTabsConfigured()) {
      return NextResponse.json(
        { error: 'PayTabs not configured' },
        { status: 503 }
      );
    }

    // Parse the callback data
    const callback: PayTabsCallbackData = await request.json();

    console.log('PayTabs callback received:', {
      tranRef: callback.tran_ref,
      responseStatus: callback.payment_result?.response_status,
      cartId: callback.cart_id,
    });

    // Verify signature if present
    if (callback.signature) {
      const isValid = paytabsClient.verifyCallbackSignature(callback);
      if (!isValid) {
        console.error('Invalid PayTabs callback signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    }

    // Use the gateway's handleWebhook method which includes subscription management
    const result = await paytabsGateway.handleWebhook(callback, callback.signature || '');

    console.log('PayTabs webhook processed:', {
      event: result.event,
      status: result.status,
      userEmail: result.userEmail,
      paymentId: result.paymentId,
    });

    // Send email notifications based on webhook result
    if (emailService.isConfigured() && result.userEmail) {
      try {
        await connectDB();
        const user = await User.findById(result.userEmail);

        if (result.status === 'succeeded') {
          // Get plan from cart description/metadata
          const cartId = callback.cart_id || '';
          const planMatch = cartId.match(/(pro|team|enterprise)/i);
          const plan = (planMatch ? planMatch[1].toLowerCase() : 'pro') as PlanType;
          const billingMatch = cartId.match(/(monthly|yearly)/i);
          const billing = (billingMatch ? billingMatch[1].toLowerCase() : 'monthly') as 'monthly' | 'yearly';

          emailService.sendSubscriptionConfirmation(
            { email: result.userEmail, name: user?.name || '' },
            {
              plan,
              billing,
              amount: callback.cart_amount ? parseFloat(callback.cart_amount) : undefined,
              currency: callback.cart_currency,
              gateway: 'paytabs',
            }
          ).catch((err) => {
            console.error('Failed to send subscription confirmation email:', err);
          });
        } else if (result.status === 'canceled') {
          const plan = (user?.plan as PlanType) || 'pro';
          emailService.sendSubscriptionCanceled(
            { email: result.userEmail, name: user?.name || '' },
            { plan, immediate: true }
          ).catch((err) => {
            console.error('Failed to send subscription canceled email:', err);
          });
        }
      } catch (err) {
        console.error('Error sending webhook email:', err);
      }
    }

    // Return appropriate response
    if (result.status === 'succeeded') {
      return NextResponse.json({
        received: true,
        status: 'success',
        transactionRef: result.paymentId,
      });
    }

    // Handle failed payment
    return NextResponse.json({
      received: true,
      status: 'failed',
      message: result.error,
    });
  } catch (error) {
    console.error('PayTabs webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request (redirect return from PayTabs)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get response status from query params
  const respStatus = searchParams.get('respStatus');
  const tranRef = searchParams.get('tranRef');
  const _cartId = searchParams.get('cartId');

  const isSuccess = respStatus === 'A'; // 'A' = Authorized/Approved

  // Redirect based on payment status
  if (isSuccess) {
    return NextResponse.redirect(
      new URL(
        `/pricing?success=true&gateway=paytabs&transaction=${tranRef}`,
        request.url
      )
    );
  } else {
    return NextResponse.redirect(
      new URL(
        `/pricing?error=payment_failed&gateway=paytabs&status=${respStatus}`,
        request.url
      )
    );
  }
}
