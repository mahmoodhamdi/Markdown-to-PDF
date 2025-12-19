import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/config';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!isStripeConfigured() || !stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userEmail = session.metadata?.userEmail;
  const plan = session.metadata?.plan as 'pro' | 'team' | 'enterprise';

  if (!userEmail || !plan) {
    console.error('Missing user email or plan in checkout session metadata');
    return;
  }

  try {
    await connectDB();

    // Update user's plan in MongoDB
    await User.findByIdAndUpdate(userEmail, {
      $set: {
        plan,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
    });

    console.log(`User ${userEmail} upgraded to ${plan} plan`);
  } catch (error) {
    console.error('Error updating user plan after checkout:', error);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userEmail = subscription.metadata?.userEmail;

  if (!userEmail) {
    console.error('Missing user email in subscription metadata');
    return;
  }

  try {
    await connectDB();

    const status = subscription.status;
    const plan = subscription.metadata?.plan as 'pro' | 'team' | 'enterprise';

    // Update subscription status
    await User.findByIdAndUpdate(userEmail, {
      $set: {
        plan: status === 'active' ? plan : 'free',
      },
    });

    console.log(`Subscription updated for ${userEmail}: ${status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userEmail = subscription.metadata?.userEmail;

  if (!userEmail) {
    console.error('Missing user email in subscription metadata');
    return;
  }

  try {
    await connectDB();

    // Downgrade user to free plan
    await User.findByIdAndUpdate(userEmail, {
      $set: {
        plan: 'free',
        stripeSubscriptionId: null,
      },
    });

    console.log(`Subscription canceled for ${userEmail}, downgraded to free`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerEmail = invoice.customer_email;

  if (!customerEmail) {
    return;
  }

  console.log(`Payment succeeded for ${customerEmail}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerEmail = invoice.customer_email;

  if (!customerEmail) {
    return;
  }

  console.log(`Payment failed for ${customerEmail}`);

  // Note: We could update subscription status here, but typically
  // Stripe will send a subscription.updated event with the past_due status
}
