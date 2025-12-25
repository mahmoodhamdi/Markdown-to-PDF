# Stage 3.3: Subscription Management

**Phase:** 3 - User Dashboard
**Priority:** 🟠 High
**Estimated Effort:** Large

---

## Context

Users need to manage their subscriptions: view status, upgrade, downgrade, cancel.

---

## Task Requirements

### 1. Create Subscription Page

**File to create:** `src/app/[locale]/dashboard/subscription/page.tsx`

### 2. Create Subscription Components

**Files to create:**
- `src/components/dashboard/CurrentPlan.tsx` - Shows current plan
- `src/components/dashboard/PlanComparison.tsx` - Compare plans
- `src/components/dashboard/BillingHistory.tsx` - Past invoices
- `src/components/dashboard/PaymentMethod.tsx` - Manage payment

### 3. Create API Endpoints

**Files to create:**
- `src/app/api/subscriptions/route.ts` - GET current subscription
- `src/app/api/subscriptions/cancel/route.ts` - POST cancel
- `src/app/api/subscriptions/change/route.ts` - POST upgrade/downgrade
- `src/app/api/subscriptions/invoices/route.ts` - GET invoices

### 4. Gateway Integration

Support all payment gateways:
- Stripe Customer Portal
- Paymob subscription management
- PayTabs subscription management
- Paddle subscription management

---

## Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ Subscription                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Current Plan ───────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Pro Plan                                    $5.00/month  │ │
│ │ ● 500 conversions/day                                    │ │
│ │ ● All themes                                             │ │
│ │ ● 1GB storage                                            │ │
│ │                                                           │ │
│ │ Next billing: January 25, 2025                           │ │
│ │                                                           │ │
│ │ [Change Plan]  [Cancel Subscription]                     │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Payment Method ─────────────────────────────────────────┐ │
│ │ Visa ending in 4242                          [Update]    │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Billing History ────────────────────────────────────────┐ │
│ │ Dec 25, 2024    Pro Plan    $5.00    [Download]          │ │
│ │ Nov 25, 2024    Pro Plan    $5.00    [Download]          │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Cancel Flow

1. User clicks "Cancel Subscription"
2. Show confirmation dialog with:
   - What they'll lose
   - When access ends
   - Option to pause instead (if available)
3. Send cancellation email
4. Update subscription status

---

## Testing Requirements

- [ ] Current plan displays correctly
- [ ] Upgrade flow works (all gateways)
- [ ] Downgrade flow works
- [ ] Cancel flow works
- [ ] Billing history loads
- [ ] Payment method updates

---

## Definition of Done

- [ ] Subscription page created
- [ ] Current plan displayed
- [ ] Plan change works
- [ ] Cancellation works
- [ ] Billing history shows
- [ ] All gateways supported
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 3.3 status to ✅ Complete*
