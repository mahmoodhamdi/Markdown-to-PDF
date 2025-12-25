# Stage 1.1: Payment Subscription Persistence

**Phase:** 1 - Critical Fixes
**Priority:** 🔴 Critical
**Estimated Effort:** Medium

---

## Context

The Paymob and PayTabs payment gateways currently store subscription data in memory, which means:
- Subscriptions are lost on server restart
- No ability to query subscription history
- Cannot scale horizontally

### Current Implementation Issues

**File:** `src/lib/payments/paymob/gateway.ts` (lines 19-34)
```typescript
// Current: In-memory storage
private subscriptions = new Map<string, PaymobSubscription>();
// Comment says: "in production, use proper database"
```

**File:** `src/lib/payments/paytabs/gateway.ts` (line 18)
- Similar in-memory storage issue

---

## Task Requirements

### 1. Create MongoDB Subscription Model

Create a new model to store regional payment subscriptions:

**File to create:** `src/lib/db/models/RegionalSubscription.ts`

```typescript
// Model should include:
interface IRegionalSubscription {
  userId: string;
  gateway: 'paymob' | 'paytabs';
  gatewaySubscriptionId: string;
  gatewayCustomerId: string;
  planType: 'free' | 'pro' | 'team' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Update Paymob Gateway

**File:** `src/lib/payments/paymob/gateway.ts`

Replace in-memory storage with MongoDB operations:
- `createSubscription()` → save to MongoDB
- `getSubscription()` → query from MongoDB
- `cancelSubscription()` → update in MongoDB
- Add `syncSubscriptionFromWebhook()` method

### 3. Update PayTabs Gateway

**File:** `src/lib/payments/paytabs/gateway.ts`

Same changes as Paymob gateway.

### 4. Update Webhook Handlers

**Files:**
- `src/app/api/webhooks/paymob/route.ts`
- `src/app/api/webhooks/paytabs/route.ts`

Ensure webhook handlers update the database:
- On payment success → create/update subscription
- On subscription canceled → update status
- On payment failed → update status to past_due

### 5. Add Subscription Recovery

Create a utility to recover subscriptions if server restarts mid-webhook:
- Query gateway APIs for subscription status
- Sync with database

---

## Files to Modify

| File | Action |
|------|--------|
| `src/lib/db/models/RegionalSubscription.ts` | Create |
| `src/lib/db/models/index.ts` | Update exports |
| `src/lib/payments/paymob/gateway.ts` | Modify |
| `src/lib/payments/paytabs/gateway.ts` | Modify |
| `src/app/api/webhooks/paymob/route.ts` | Modify |
| `src/app/api/webhooks/paytabs/route.ts` | Modify |

---

## Testing Requirements

### Unit Tests

**File to create:** `__tests__/unit/lib/db/models/RegionalSubscription.test.ts`

Test cases:
- [ ] Create subscription
- [ ] Find subscription by userId
- [ ] Find subscription by gatewaySubscriptionId
- [ ] Update subscription status
- [ ] Cancel subscription (set cancelAtPeriodEnd)

### Integration Tests

**File to create:** `__tests__/integration/payments/regional-subscriptions.test.ts`

Test cases:
- [ ] Paymob subscription creation persists to DB
- [ ] PayTabs subscription creation persists to DB
- [ ] Webhook updates subscription correctly
- [ ] Subscription survives simulated restart

---

## Definition of Done

- [ ] RegionalSubscription model created
- [ ] Paymob gateway uses MongoDB
- [ ] PayTabs gateway uses MongoDB
- [ ] Webhook handlers update database
- [ ] All existing payment tests still pass
- [ ] New unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Tested with Paymob sandbox (if available)
- [ ] Tested with PayTabs sandbox (if available)

---

## Implementation Notes

1. **Transaction Safety:** Use MongoDB transactions when updating subscription status
2. **Idempotency:** Webhook handlers should be idempotent (same webhook can be received multiple times)
3. **Error Handling:** Log errors but don't crash - payment systems must be resilient
4. **Backward Compatibility:** Ensure Stripe subscriptions continue to work unchanged

---

## Start Command

```bash
# Before starting, ensure MongoDB is running
npm run db:start

# Run existing tests to ensure nothing breaks
npm run test:unit

# Start development
npm run dev
```

---

## Verification Steps

After implementation:

1. Create a test subscription via Paymob
2. Verify it appears in MongoDB
3. Restart the server
4. Verify subscription is still accessible
5. Repeat for PayTabs

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 1.1 status to ✅ Complete*
