# Milestone 2.3: Webhook Security

## Status: ⬜ Not Started
## Priority: HIGH
## Estimated Scope: Medium

---

## Objective

Ensure all payment webhooks are secure and handle edge cases properly.

---

## Webhook Endpoints

1. `src/app/api/webhooks/stripe/route.ts`
2. `src/app/api/webhooks/paymob/route.ts`
3. `src/app/api/webhooks/paytabs/route.ts`
4. `src/app/api/webhooks/paddle/route.ts`

---

## Security Checklist

### 1. Signature Verification

#### Stripe
```typescript
// Verify exists and is correct
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
```

#### Paymob
```typescript
// Verify HMAC-SHA512
const hmac = crypto
  .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
  .update(concatenatedString)
  .digest('hex');
```

#### PayTabs
```typescript
// Verify signature header
const signature = request.headers.get('signature');
// Validate against payload
```

#### Paddle
```typescript
// Verify Paddle signature
const isValid = paddle.webhooks.verify(body, signature);
```

### 2. Idempotency

Prevent duplicate processing:

```typescript
// Check if event already processed
const existingEvent = await WebhookEvent.findOne({
  eventId: event.id,
  gateway: 'stripe',
});

if (existingEvent) {
  console.log('Event already processed:', event.id);
  return NextResponse.json({ received: true });
}

// Process event...

// Mark as processed
await WebhookEvent.create({
  eventId: event.id,
  gateway: 'stripe',
  eventType: event.type,
  processedAt: new Date(),
});
```

### 3. Concurrency Control

Prevent race conditions:

```typescript
// Use MongoDB transactions for atomic updates
const session = await mongoose.startSession();
session.startTransaction();

try {
  await User.findByIdAndUpdate(
    userId,
    { plan: newPlan },
    { session }
  );

  await Subscription.create([{ ... }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 4. Error Handling

```typescript
// Return appropriate status codes
try {
  await processWebhook(event);
  return NextResponse.json({ received: true }, { status: 200 });
} catch (error) {
  console.error('Webhook error:', error);

  // Don't reveal internal errors
  return NextResponse.json(
    { error: 'Webhook processing failed' },
    { status: 500 }
  );
}
```

---

## Missing Event Types

### Stripe Events to Add:
- `payment_method.attached`
- `payment_method.detached`
- `charge.refunded`
- `charge.failed`
- `customer.deleted`
- `invoice.payment_action_required`

### Paddle Events to Add:
- `subscription.past_due`
- `subscription.payment_failed`
- `transaction.payment_failed`

---

## Webhook Event Model

Create for idempotency:

```typescript
// src/lib/db/models/WebhookEvent.ts
import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  gateway: {
    type: String,
    enum: ['stripe', 'paymob', 'paytabs', 'paddle'],
    required: true
  },
  eventType: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  processedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['processed', 'failed', 'skipped'],
    default: 'processed'
  },
  error: { type: String },
});

webhookEventSchema.index({ eventId: 1, gateway: 1 }, { unique: true });
webhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL

export const WebhookEvent = mongoose.models.WebhookEvent ||
  mongoose.model('WebhookEvent', webhookEventSchema);
```

---

## Logging & Monitoring

Add comprehensive logging:

```typescript
// Log all webhook events
console.log('[Webhook] Received:', {
  gateway: 'stripe',
  eventType: event.type,
  eventId: event.id,
  timestamp: new Date().toISOString(),
});

// Log processing results
console.log('[Webhook] Processed:', {
  eventId: event.id,
  action: 'subscription_updated',
  userId: user._id,
  newPlan: 'pro',
});

// Log errors with context
console.error('[Webhook] Error:', {
  eventId: event.id,
  error: error.message,
  stack: error.stack,
});
```

---

## Files to Create/Modify

### Create:
1. `src/lib/db/models/WebhookEvent.ts`

### Modify:
1. `src/app/api/webhooks/stripe/route.ts`
2. `src/app/api/webhooks/paymob/route.ts`
3. `src/app/api/webhooks/paytabs/route.ts`
4. `src/app/api/webhooks/paddle/route.ts`

---

## Testing

### Unit Tests:
1. Signature verification works
2. Invalid signature rejected
3. Duplicate events handled
4. All event types processed

### Integration Tests:
1. Webhook updates user plan
2. Email sent on subscription change
3. Failed webhooks return 500

---

## Acceptance Criteria

- [ ] All webhooks verify signatures
- [ ] Idempotency prevents duplicates
- [ ] Transactions prevent race conditions
- [ ] All event types handled
- [ ] Comprehensive logging
- [ ] Error handling doesn't leak info
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 2.3 status to ✅
2. Update progress bar
3. Add to completion log
