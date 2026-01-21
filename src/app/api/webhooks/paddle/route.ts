/**
 * Paddle Webhook Handler
 * POST /api/webhooks/paddle - Handle Paddle webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { isPaddleConfigured, PADDLE_CONFIG } from '@/lib/payments/paddle/config';
import { paddleClient } from '@/lib/payments/paddle/client';
import { emailService } from '@/lib/email/service';
import { PlanType } from '@/lib/plans/config';
import {
  checkAndMarkProcessing,
  markProcessed,
  markFailed,
  markSkipped,
  webhookLog,
} from '@/lib/webhooks';

/**
 * Handle POST request (webhook from Paddle)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Paddle is configured
    if (!isPaddleConfigured()) {
      return NextResponse.json({ error: 'Paddle not configured' }, { status: 503 });
    }

    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature') || '';

    // Verify signature if webhook secret is configured
    if (PADDLE_CONFIG.webhookSecret && signature) {
      const isValid = paddleClient.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        webhookLog('error', 'Invalid webhook signature', {
          gateway: 'paddle',
          eventId: 'unknown',
          eventType: 'unknown',
        });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // Parse the event
    const event = JSON.parse(rawBody);
    const eventId = event.event_id || `paddle-${Date.now()}`;
    const eventType = event.event_type;

    // Log incoming webhook
    webhookLog('info', 'Webhook received', {
      gateway: 'paddle',
      eventId,
      eventType,
    });

    // Check idempotency - skip if already processed
    const idempotencyResult = await checkAndMarkProcessing(
      'paddle',
      eventId,
      eventType,
      event.data
    );

    if (!idempotencyResult.isNew) {
      return NextResponse.json({ received: true, status: 'duplicate' });
    }

    // Handle different event types
    try {
      let handled = true;

      switch (eventType) {
        case 'subscription.created':
        case 'subscription.activated': {
          await handleSubscriptionActivated(event, eventId);
          break;
        }

        case 'subscription.updated': {
          await handleSubscriptionUpdated(event, eventId);
          break;
        }

        case 'subscription.canceled': {
          await handleSubscriptionCanceled(event, eventId);
          break;
        }

        case 'subscription.paused': {
          await handleSubscriptionPaused(event, eventId);
          break;
        }

        case 'subscription.resumed': {
          await handleSubscriptionResumed(event, eventId);
          break;
        }

        case 'subscription.past_due': {
          await handleSubscriptionPastDue(event, eventId);
          break;
        }

        case 'transaction.completed': {
          await handleTransactionCompleted(event, eventId);
          break;
        }

        case 'transaction.payment_failed': {
          await handleTransactionPaymentFailed(event, eventId);
          break;
        }

        case 'customer.created':
        case 'customer.updated': {
          webhookLog('info', `Customer ${eventType.split('.')[1]}`, {
            gateway: 'paddle',
            eventId,
            eventType,
            customerId: event.data?.id,
            email: event.data?.email,
          });
          break;
        }

        default:
          handled = false;
          webhookLog('info', 'Unhandled event type', {
            gateway: 'paddle',
            eventId,
            eventType,
          });
      }

      if (handled) {
        await markProcessed('paddle', eventId, { eventType });
      } else {
        await markSkipped('paddle', eventId, `Unhandled event type: ${eventType}`);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await markFailed('paddle', eventId, errorMessage);
      throw error;
    }
  } catch (error) {
    webhookLog('error', 'Webhook handler failed', {
      gateway: 'paddle',
      eventId: 'unknown',
      eventType: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionActivated(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;
  const userEmail = customData.userEmail;
  const plan = customData.plan;
  const billing = customData.billing as 'monthly' | 'yearly' | undefined;

  if (!userEmail || !plan) {
    webhookLog('warn', 'Missing user email or plan in custom_data', {
      gateway: 'paddle',
      eventId,
      eventType: event.event_type as string,
      subscriptionId: data.id,
    });
    return;
  }

  await connectDB();
  const user = await User.findById(userEmail.toLowerCase());

  await User.findByIdAndUpdate(userEmail.toLowerCase(), {
    $set: {
      plan,
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.id,
    },
  });

  webhookLog('info', 'User upgraded via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: event.event_type as string,
    userEmail,
    plan,
  });

  // Send subscription confirmation email
  if (emailService.isConfigured()) {
    const items = data.items as Array<{ price?: { unit_price?: { amount?: string } } }> | undefined;
    const amount = items?.[0]?.price?.unit_price?.amount
      ? parseFloat(items[0].price.unit_price.amount) / 100
      : undefined;
    const currency = data.currency_code as string | undefined;

    emailService
      .sendSubscriptionConfirmation(
        { email: userEmail.toLowerCase(), name: user?.name || '' },
        {
          plan: plan as PlanType,
          billing: billing || 'monthly',
          amount,
          currency,
          gateway: 'paddle',
        }
      )
      .catch((err) => {
        webhookLog('error', 'Failed to send subscription confirmation email', {
          gateway: 'paddle',
          eventId,
          eventType: event.event_type as string,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
  }
}

async function handleSubscriptionUpdated(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;
  const userEmail = customData.userEmail;
  const plan = customData.plan;

  if (!userEmail || !plan) {
    webhookLog('warn', 'Missing user email or plan in custom_data', {
      gateway: 'paddle',
      eventId,
      eventType: 'subscription.updated',
      subscriptionId: data.id,
    });
    return;
  }

  await connectDB();
  await User.findByIdAndUpdate(userEmail.toLowerCase(), {
    $set: { plan },
  });

  webhookLog('info', 'Subscription updated via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: 'subscription.updated',
    userEmail,
    plan,
  });
}

async function handleSubscriptionCanceled(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;
  const userEmail = customData.userEmail;
  const plan = customData.plan;

  if (!userEmail) {
    webhookLog('warn', 'Missing user email in custom_data', {
      gateway: 'paddle',
      eventId,
      eventType: 'subscription.canceled',
      subscriptionId: data.id,
    });
    return;
  }

  await connectDB();
  const user = await User.findById(userEmail.toLowerCase());
  const previousPlan = plan || user?.plan || 'pro';

  await User.findByIdAndUpdate(userEmail.toLowerCase(), {
    $set: {
      plan: 'free',
      paddleSubscriptionId: null,
    },
  });

  webhookLog('info', 'Subscription canceled via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: 'subscription.canceled',
    userEmail,
    previousPlan,
  });

  // Send subscription canceled email
  if (emailService.isConfigured()) {
    emailService
      .sendSubscriptionCanceled(
        { email: userEmail.toLowerCase(), name: user?.name || '' },
        {
          plan: previousPlan as PlanType,
          immediate: true,
        }
      )
      .catch((err) => {
        webhookLog('error', 'Failed to send subscription canceled email', {
          gateway: 'paddle',
          eventId,
          eventType: 'subscription.canceled',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
  }
}

async function handleSubscriptionPaused(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;
  const userEmail = customData.userEmail;

  webhookLog('info', 'Subscription paused via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: 'subscription.paused',
    userEmail: userEmail || 'unknown',
    subscriptionId: data.id,
  });

  // Optionally update user status or send email
}

async function handleSubscriptionResumed(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;
  const userEmail = customData.userEmail;
  const plan = customData.plan;

  if (!userEmail || !plan) {
    webhookLog('warn', 'Missing user email or plan in custom_data', {
      gateway: 'paddle',
      eventId,
      eventType: 'subscription.resumed',
      subscriptionId: data.id,
    });
    return;
  }

  await connectDB();
  await User.findByIdAndUpdate(userEmail.toLowerCase(), {
    $set: { plan },
  });

  webhookLog('info', 'Subscription resumed via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: 'subscription.resumed',
    userEmail,
    plan,
  });
}

async function handleSubscriptionPastDue(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;
  const userEmail = customData.userEmail;

  webhookLog('warn', 'Subscription past due via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: 'subscription.past_due',
    userEmail: userEmail || 'unknown',
    subscriptionId: data.id,
  });

  // Optionally send reminder email or limit features
}

async function handleTransactionCompleted(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;
  const details = data.details as { totals?: { total?: string } } | undefined;

  webhookLog('info', 'Transaction completed via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: 'transaction.completed',
    transactionId: data.id,
    userEmail: customData.userEmail || 'unknown',
    total: details?.totals?.total,
  });
}

async function handleTransactionPaymentFailed(event: Record<string, unknown>, eventId: string) {
  const data = event.data as Record<string, unknown>;
  const customData = (data.custom_data || {}) as Record<string, string>;

  webhookLog('warn', 'Payment failed via Paddle', {
    gateway: 'paddle',
    eventId,
    eventType: 'transaction.payment_failed',
    transactionId: data.id,
    userEmail: customData.userEmail || 'unknown',
  });
}
