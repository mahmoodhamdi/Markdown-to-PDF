/**
 * Paddle Webhook Handler
 * POST /api/webhooks/paddle - Handle Paddle webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { isPaddleConfigured, PADDLE_CONFIG } from '@/lib/payments/paddle/config';
import { paddleClient } from '@/lib/payments/paddle/client';

/**
 * Handle POST request (webhook from Paddle)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Paddle is configured
    if (!isPaddleConfigured()) {
      return NextResponse.json(
        { error: 'Paddle not configured' },
        { status: 503 }
      );
    }

    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature') || '';

    // Verify signature if webhook secret is configured
    if (PADDLE_CONFIG.webhookSecret && signature) {
      const isValid = paddleClient.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('Invalid Paddle webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    }

    // Parse the event
    const event = JSON.parse(rawBody);

    console.log('Paddle webhook received:', {
      eventType: event.event_type,
      eventId: event.event_id,
    });

    // Handle different event types
    switch (event.event_type) {
      case 'subscription.created':
      case 'subscription.activated': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;
        const plan = customData.plan;

        if (userEmail && plan) {
          try {
            await connectDB();
            await User.findByIdAndUpdate(userEmail.toLowerCase(), {
              $set: {
                plan,
                paddleCustomerId: data.customer_id,
                paddleSubscriptionId: data.id,
              },
            });
            console.log(`User ${userEmail} upgraded to ${plan} via Paddle`);
          } catch (error) {
            console.error('Error updating user from Paddle webhook:', error);
          }
        }
        break;
      }

      case 'subscription.updated': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;
        const plan = customData.plan;

        if (userEmail && plan) {
          try {
            await connectDB();
            await User.findByIdAndUpdate(userEmail.toLowerCase(), {
              $set: { plan },
            });
            console.log(`User ${userEmail} plan updated to ${plan} via Paddle`);
          } catch (error) {
            console.error('Error updating user plan from Paddle webhook:', error);
          }
        }
        break;
      }

      case 'subscription.canceled': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;

        if (userEmail) {
          try {
            await connectDB();
            await User.findByIdAndUpdate(userEmail.toLowerCase(), {
              $set: {
                plan: 'free',
                paddleSubscriptionId: null,
              },
            });
            console.log(`User ${userEmail} subscription canceled via Paddle`);
          } catch (error) {
            console.error('Error canceling subscription from Paddle webhook:', error);
          }
        }
        break;
      }

      case 'subscription.paused': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;

        if (userEmail) {
          console.log(`User ${userEmail} subscription paused via Paddle`);
          // Optionally update user status
        }
        break;
      }

      case 'subscription.resumed': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;
        const plan = customData.plan;

        if (userEmail && plan) {
          try {
            await connectDB();
            await User.findByIdAndUpdate(userEmail.toLowerCase(), {
              $set: { plan },
            });
            console.log(`User ${userEmail} subscription resumed via Paddle`);
          } catch (error) {
            console.error('Error resuming subscription from Paddle webhook:', error);
          }
        }
        break;
      }

      case 'subscription.past_due': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;

        if (userEmail) {
          console.log(`User ${userEmail} subscription past due via Paddle`);
          // Optionally send reminder email or limit features
        }
        break;
      }

      case 'transaction.completed': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;

        console.log('Paddle transaction completed:', {
          transactionId: data.id,
          userEmail,
          total: data.details?.totals?.total,
        });
        break;
      }

      case 'transaction.payment_failed': {
        const data = event.data;
        const customData = data.custom_data || {};
        const userEmail = customData.userEmail;

        console.log('Paddle payment failed:', {
          transactionId: data.id,
          userEmail,
        });
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        const data = event.data;
        console.log('Paddle customer event:', {
          customerId: data.id,
          email: data.email,
        });
        break;
      }

      default:
        console.log(`Unhandled Paddle event type: ${event.event_type}`);
    }

    // Always return success to Paddle
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paddle webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
