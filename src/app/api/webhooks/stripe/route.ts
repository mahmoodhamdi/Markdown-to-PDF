import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { emailService } from '@/lib/email/service';
import { PlanType } from '@/lib/plans/config';
import {
  checkAndMarkProcessing,
  markProcessed,
  markFailed,
  markSkipped,
  webhookLog,
} from '@/lib/webhooks';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!isStripeConfigured() || !stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      webhookLog('warn', 'Missing stripe-signature header', {
        gateway: 'stripe',
        eventId: 'unknown',
        eventType: 'unknown',
      });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      webhookLog('error', 'Webhook signature verification failed', {
        gateway: 'stripe',
        eventId: 'unknown',
        eventType: 'unknown',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Log incoming webhook
    webhookLog('info', 'Webhook received', {
      gateway: 'stripe',
      eventId: event.id,
      eventType: event.type,
    });

    // Check idempotency - skip if already processed
    const idempotencyResult = await checkAndMarkProcessing(
      'stripe',
      event.id,
      event.type,
      event.data.object as unknown as Record<string, unknown>
    );

    if (!idempotencyResult.isNew) {
      return NextResponse.json({ received: true, status: 'duplicate' });
    }

    // Handle different event types
    try {
      let handled = true;

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutComplete(session, event.id);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdate(subscription, event.id);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCanceled(subscription, event.id);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentSucceeded(invoice, event.id);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailed(invoice, event.id);
          break;
        }

        case 'invoice.payment_action_required': {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentActionRequired(invoice, event.id);
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          await handleChargeRefunded(charge, event.id);
          break;
        }

        case 'charge.failed': {
          const charge = event.data.object as Stripe.Charge;
          await handleChargeFailed(charge, event.id);
          break;
        }

        case 'customer.deleted': {
          const customer = event.data.object as Stripe.Customer;
          await handleCustomerDeleted(customer, event.id);
          break;
        }

        case 'payment_method.attached':
        case 'payment_method.detached': {
          // Log but no action needed
          webhookLog('info', `Payment method ${event.type.split('.')[1]}`, {
            gateway: 'stripe',
            eventId: event.id,
            eventType: event.type,
          });
          break;
        }

        default:
          handled = false;
          webhookLog('info', 'Unhandled event type', {
            gateway: 'stripe',
            eventId: event.id,
            eventType: event.type,
          });
      }

      if (handled) {
        await markProcessed('stripe', event.id, { eventType: event.type });
      } else {
        await markSkipped('stripe', event.id, `Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await markFailed('stripe', event.id, errorMessage);
      throw error;
    }
  } catch (error) {
    webhookLog('error', 'Webhook handler failed', {
      gateway: 'stripe',
      eventId: 'unknown',
      eventType: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session, eventId: string) {
  const userEmail = session.metadata?.userEmail;
  const plan = session.metadata?.plan as 'pro' | 'team' | 'enterprise';
  const billing = session.metadata?.billing as 'monthly' | 'yearly' | undefined;

  if (!userEmail || !plan) {
    webhookLog('warn', 'Missing user email or plan in checkout session metadata', {
      gateway: 'stripe',
      eventId,
      eventType: 'checkout.session.completed',
      sessionId: session.id,
    });
    return;
  }

  await connectDB();

  // Get user for name
  const user = await User.findById(userEmail);

  // Update user's plan in MongoDB
  await User.findByIdAndUpdate(userEmail, {
    $set: {
      plan,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
    },
  });

  webhookLog('info', 'User upgraded', {
    gateway: 'stripe',
    eventId,
    eventType: 'checkout.session.completed',
    userEmail,
    plan,
  });

  // Send subscription confirmation email
  if (emailService.isConfigured()) {
    emailService
      .sendSubscriptionConfirmation(
        { email: userEmail, name: user?.name || '' },
        {
          plan: plan as PlanType,
          billing: billing || 'monthly',
          amount: session.amount_total ? session.amount_total / 100 : undefined,
          currency: session.currency?.toUpperCase(),
          gateway: 'stripe',
        }
      )
      .catch((err) => {
        webhookLog('error', 'Failed to send subscription confirmation email', {
          gateway: 'stripe',
          eventId,
          eventType: 'checkout.session.completed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, eventId: string) {
  const userEmail = subscription.metadata?.userEmail;

  if (!userEmail) {
    webhookLog('warn', 'Missing user email in subscription metadata', {
      gateway: 'stripe',
      eventId,
      eventType: 'customer.subscription.updated',
      subscriptionId: subscription.id,
    });
    return;
  }

  await connectDB();

  const status = subscription.status;
  const plan = subscription.metadata?.plan as 'pro' | 'team' | 'enterprise';

  // Update subscription status
  await User.findByIdAndUpdate(userEmail, {
    $set: {
      plan: status === 'active' ? plan : 'free',
    },
  });

  webhookLog('info', 'Subscription updated', {
    gateway: 'stripe',
    eventId,
    eventType: 'customer.subscription.updated',
    userEmail,
    status,
    plan,
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription, eventId: string) {
  const userEmail = subscription.metadata?.userEmail;
  const plan = subscription.metadata?.plan as 'pro' | 'team' | 'enterprise' | undefined;

  if (!userEmail) {
    webhookLog('warn', 'Missing user email in subscription metadata', {
      gateway: 'stripe',
      eventId,
      eventType: 'customer.subscription.deleted',
      subscriptionId: subscription.id,
    });
    return;
  }

  await connectDB();

  // Get user for name and current plan
  const user = await User.findById(userEmail);
  const previousPlan = plan || user?.plan || 'pro';

  // Downgrade user to free plan
  await User.findByIdAndUpdate(userEmail, {
    $set: {
      plan: 'free',
      stripeSubscriptionId: null,
    },
  });

  webhookLog('info', 'Subscription canceled', {
    gateway: 'stripe',
    eventId,
    eventType: 'customer.subscription.deleted',
    userEmail,
    previousPlan,
  });

  // Send subscription canceled email
  if (emailService.isConfigured()) {
    emailService
      .sendSubscriptionCanceled(
        { email: userEmail, name: user?.name || '' },
        {
          plan: previousPlan as PlanType,
          immediate: true,
        }
      )
      .catch((err) => {
        webhookLog('error', 'Failed to send subscription canceled email', {
          gateway: 'stripe',
          eventId,
          eventType: 'customer.subscription.deleted',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
  const customerEmail = invoice.customer_email;

  webhookLog('info', 'Payment succeeded', {
    gateway: 'stripe',
    eventId,
    eventType: 'invoice.payment_succeeded',
    customerEmail: customerEmail || 'unknown',
    invoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  const customerEmail = invoice.customer_email;

  webhookLog('warn', 'Payment failed', {
    gateway: 'stripe',
    eventId,
    eventType: 'invoice.payment_failed',
    customerEmail: customerEmail || 'unknown',
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
  });

  // Note: Stripe will send a subscription.updated event with past_due status
}

async function handlePaymentActionRequired(invoice: Stripe.Invoice, eventId: string) {
  const customerEmail = invoice.customer_email;

  webhookLog('warn', 'Payment action required (3D Secure)', {
    gateway: 'stripe',
    eventId,
    eventType: 'invoice.payment_action_required',
    customerEmail: customerEmail || 'unknown',
    invoiceId: invoice.id,
  });

  // TODO: Could send email to customer about required action
}

async function handleChargeRefunded(charge: Stripe.Charge, eventId: string) {
  webhookLog('info', 'Charge refunded', {
    gateway: 'stripe',
    eventId,
    eventType: 'charge.refunded',
    chargeId: charge.id,
    amountRefunded: charge.amount_refunded,
    customerEmail: charge.billing_details?.email || 'unknown',
  });

  // Note: Subscription status changes are handled via subscription.updated events
}

async function handleChargeFailed(charge: Stripe.Charge, eventId: string) {
  webhookLog('warn', 'Charge failed', {
    gateway: 'stripe',
    eventId,
    eventType: 'charge.failed',
    chargeId: charge.id,
    failureCode: charge.failure_code,
    failureMessage: charge.failure_message,
    customerEmail: charge.billing_details?.email || 'unknown',
  });
}

async function handleCustomerDeleted(customer: Stripe.Customer, eventId: string) {
  const email = customer.email;

  if (!email) {
    webhookLog('warn', 'Customer deleted without email', {
      gateway: 'stripe',
      eventId,
      eventType: 'customer.deleted',
      customerId: customer.id,
    });
    return;
  }

  await connectDB();

  // Clear Stripe IDs from user (don't downgrade plan - they may have paid through other means)
  await User.findByIdAndUpdate(email, {
    $set: {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    },
  });

  webhookLog('info', 'Customer deleted', {
    gateway: 'stripe',
    eventId,
    eventType: 'customer.deleted',
    email,
  });
}
