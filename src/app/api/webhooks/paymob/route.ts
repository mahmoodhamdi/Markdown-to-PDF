/**
 * Paymob Webhook Handler
 * POST /api/webhooks/paymob - Handle Paymob transaction callbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PAYMOB_CONFIG } from '@/lib/payments/paymob/config';
import { PaymobTransactionCallback } from '@/lib/payments/paymob/client';
import { paymobGateway } from '@/lib/payments/paymob/gateway';
import { emailService } from '@/lib/email/service';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { PlanType } from '@/lib/plans/config';

/**
 * Verify HMAC signature for Paymob webhook
 */
function verifyHmacSignature(payload: PaymobTransactionCallback): boolean {
  if (!PAYMOB_CONFIG.hmacSecret) {
    console.warn('PAYMOB_HMAC_SECRET not configured');
    return false;
  }

  const { obj, hmac } = payload;

  // Concatenate values in the specific order Paymob expects
  const concatenatedString = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order.id,
    obj.owner,
    obj.pending,
    obj.source_data.pan,
    obj.source_data.sub_type,
    obj.source_data.type,
    obj.success,
  ].join('');

  // Calculate HMAC
  const calculatedHmac = crypto
    .createHmac('sha512', PAYMOB_CONFIG.hmacSecret)
    .update(concatenatedString)
    .digest('hex');

  return calculatedHmac === hmac;
}

/**
 * Handle GET request (redirect callback from payment page)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get transaction status from query params
  const success = searchParams.get('success') === 'true';
  const transactionId = searchParams.get('id');
  const orderId = searchParams.get('order');
  const hmac = searchParams.get('hmac');

  // Verify HMAC if provided
  if (hmac && PAYMOB_CONFIG.hmacSecret) {
    const dataToHash = [
      searchParams.get('amount_cents'),
      searchParams.get('created_at'),
      searchParams.get('currency'),
      searchParams.get('error_occured'),
      searchParams.get('has_parent_transaction'),
      transactionId,
      searchParams.get('integration_id'),
      searchParams.get('is_3d_secure'),
      searchParams.get('is_auth'),
      searchParams.get('is_capture'),
      searchParams.get('is_refunded'),
      searchParams.get('is_standalone_payment'),
      searchParams.get('is_voided'),
      orderId,
      searchParams.get('owner'),
      searchParams.get('pending'),
      searchParams.get('source_data.pan'),
      searchParams.get('source_data.sub_type'),
      searchParams.get('source_data.type'),
      searchParams.get('success'),
    ].join('');

    const calculatedHmac = crypto
      .createHmac('sha512', PAYMOB_CONFIG.hmacSecret)
      .update(dataToHash)
      .digest('hex');

    if (calculatedHmac !== hmac) {
      console.error('Invalid HMAC signature on Paymob redirect');
      return NextResponse.redirect(new URL('/pricing?error=invalid_signature', request.url));
    }
  }

  // Redirect based on payment status
  if (success) {
    return NextResponse.redirect(
      new URL(`/pricing?success=true&gateway=paymob&transaction=${transactionId}`, request.url)
    );
  } else {
    return NextResponse.redirect(
      new URL(`/pricing?error=payment_failed&gateway=paymob`, request.url)
    );
  }
}

/**
 * Handle POST request (webhook callback)
 */
export async function POST(request: NextRequest) {
  try {
    const payload: PaymobTransactionCallback = await request.json();

    // Verify webhook signature
    if (PAYMOB_CONFIG.hmacSecret && !verifyHmacSignature(payload)) {
      console.error('Invalid Paymob webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const { obj, type } = payload;

    console.log(`Paymob webhook received: ${type}`, {
      transactionId: obj.id,
      success: obj.success,
      amount: obj.amount_cents,
      currency: obj.currency,
    });

    // Use the gateway's handleWebhook method which includes subscription management
    const result = await paymobGateway.handleWebhook(payload, payload.hmac || '');

    console.log(`Paymob webhook processed:`, {
      event: result.event,
      status: result.status,
      userEmail: result.userEmail,
    });

    // Send email notifications based on webhook result
    if (emailService.isConfigured() && result.userEmail) {
      try {
        await connectDB();
        const user = await User.findById(result.userEmail);

        if (result.event === 'payment.success' && result.status === 'succeeded') {
          // Get plan from order metadata
          const orderData = payload.obj.order?.shipping_data || {};
          const plan = (orderData.plan as PlanType) || 'pro';
          const billing = (orderData.billing as 'monthly' | 'yearly') || 'monthly';

          emailService.sendSubscriptionConfirmation(
            { email: result.userEmail, name: user?.name || '' },
            {
              plan,
              billing,
              amount: payload.obj.amount_cents / 100,
              currency: payload.obj.currency,
              gateway: 'paymob',
            }
          ).catch((err) => {
            console.error('Failed to send subscription confirmation email:', err);
          });
        } else if (result.event === 'subscription.canceled' || result.status === 'canceled') {
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

    // Always return success to Paymob
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paymob webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
