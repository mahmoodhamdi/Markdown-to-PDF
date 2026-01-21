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
import {
  checkAndMarkProcessing,
  markProcessed,
  markFailed,
  webhookLog,
  generateEventId,
} from '@/lib/webhooks';

/**
 * Handle POST request (callback from PayTabs)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if PayTabs is configured
    if (!isPayTabsConfigured()) {
      return NextResponse.json({ error: 'PayTabs not configured' }, { status: 503 });
    }

    // Parse the callback data
    const callback: PayTabsCallbackData = await request.json();
    const eventType =
      callback.payment_result?.response_status === 'A' ? 'payment.success' : 'payment.failed';
    const eventId = generateEventId('paytabs', callback.tran_ref || 'unknown', eventType);

    // Log incoming webhook
    webhookLog('info', 'Webhook received', {
      gateway: 'paytabs',
      eventId,
      eventType,
      tranRef: callback.tran_ref,
      responseStatus: callback.payment_result?.response_status,
      cartId: callback.cart_id,
    });

    // Verify signature if present
    if (callback.signature) {
      const isValid = paytabsClient.verifyCallbackSignature(callback);
      if (!isValid) {
        webhookLog('error', 'Invalid callback signature', {
          gateway: 'paytabs',
          eventId,
          eventType,
        });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // Check idempotency - skip if already processed
    const idempotencyResult = await checkAndMarkProcessing('paytabs', eventId, eventType, {
      tranRef: callback.tran_ref,
      cartId: callback.cart_id,
      responseStatus: callback.payment_result?.response_status,
    });

    if (!idempotencyResult.isNew) {
      return NextResponse.json({ received: true, status: 'duplicate' });
    }

    try {
      // Use the gateway's handleWebhook method which includes subscription management
      const result = await paytabsGateway.handleWebhook(callback, callback.signature || '');

      webhookLog('info', 'Webhook processed', {
        gateway: 'paytabs',
        eventId,
        eventType,
        event: result.event,
        status: result.status,
        userEmail: result.userEmail,
        paymentId: result.paymentId,
      });

      // Send email notifications based on webhook result
      if (emailService.isConfigured() && result.userEmail) {
        await connectDB();
        const user = await User.findById(result.userEmail);

        if (result.status === 'succeeded') {
          // Get plan from cart description/metadata
          const cartId = callback.cart_id || '';
          const planMatch = cartId.match(/(pro|team|enterprise)/i);
          const plan = (planMatch ? planMatch[1].toLowerCase() : 'pro') as PlanType;
          const billingMatch = cartId.match(/(monthly|yearly)/i);
          const billing = (billingMatch ? billingMatch[1].toLowerCase() : 'monthly') as
            | 'monthly'
            | 'yearly';

          emailService
            .sendSubscriptionConfirmation(
              { email: result.userEmail, name: user?.name || '' },
              {
                plan,
                billing,
                amount: callback.cart_amount ? parseFloat(callback.cart_amount) : undefined,
                currency: callback.cart_currency,
                gateway: 'paytabs',
              }
            )
            .catch((err) => {
              webhookLog('error', 'Failed to send subscription confirmation email', {
                gateway: 'paytabs',
                eventId,
                eventType,
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            });
        } else if (result.status === 'canceled') {
          const plan = (user?.plan as PlanType) || 'pro';
          emailService
            .sendSubscriptionCanceled(
              { email: result.userEmail, name: user?.name || '' },
              { plan, immediate: true }
            )
            .catch((err) => {
              webhookLog('error', 'Failed to send subscription canceled email', {
                gateway: 'paytabs',
                eventId,
                eventType,
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            });
        }
      }

      await markProcessed('paytabs', eventId, { event: result.event, status: result.status });

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await markFailed('paytabs', eventId, errorMessage);
      throw error;
    }
  } catch (error) {
    webhookLog('error', 'Webhook handler failed', {
      gateway: 'paytabs',
      eventId: 'unknown',
      eventType: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
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

  const isSuccess = respStatus === 'A'; // 'A' = Authorized/Approved

  webhookLog('info', 'Redirect callback received', {
    gateway: 'paytabs',
    eventId: tranRef || 'unknown',
    eventType: 'redirect',
    respStatus,
    isSuccess,
  });

  // Redirect based on payment status
  if (isSuccess) {
    return NextResponse.redirect(
      new URL(`/pricing?success=true&gateway=paytabs&transaction=${tranRef}`, request.url)
    );
  } else {
    return NextResponse.redirect(
      new URL(`/pricing?error=payment_failed&gateway=paytabs&status=${respStatus}`, request.url)
    );
  }
}
