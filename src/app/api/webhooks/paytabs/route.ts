/**
 * PayTabs Webhook Handler
 * POST /api/webhooks/paytabs - Handle PayTabs payment callbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { isPayTabsConfigured } from '@/lib/payments/paytabs/config';
import { paytabsClient, PayTabsCallbackData } from '@/lib/payments/paytabs/client';

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

    // Parse callback data
    const parsed = paytabsClient.parseCallbackData(callback);

    // Handle successful payment
    if (parsed.success) {
      const userEmail = parsed.customerEmail;
      const plan = parsed.plan;

      if (userEmail && plan) {
        try {
          await connectDB();

          await User.findByIdAndUpdate(userEmail.toLowerCase(), {
            $set: {
              plan,
              paytabsTransactionRef: parsed.transactionRef,
              paytabsCartId: parsed.cartId,
            },
          });

          console.log(`User ${userEmail} upgraded to ${plan} via PayTabs`);
        } catch (error) {
          console.error('Error updating user from PayTabs callback:', error);
        }
      }

      // Return success
      return NextResponse.json({
        received: true,
        status: 'success',
        transactionRef: parsed.transactionRef,
      });
    }

    // Handle failed payment
    console.log(`PayTabs payment failed: ${parsed.responseMessage}`, {
      responseCode: parsed.responseCode,
      responseStatus: parsed.responseStatus,
    });

    return NextResponse.json({
      received: true,
      status: 'failed',
      message: parsed.responseMessage,
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
