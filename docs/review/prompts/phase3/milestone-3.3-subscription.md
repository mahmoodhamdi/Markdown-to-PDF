# Milestone 3.3: Subscription & Billing Polish

## Status: ⬜ Not Started
## Priority: MEDIUM
## Estimated Scope: Medium

---

## Objective

Enhance subscription management and billing experience across all payment gateways.

---

## Current Components

- `src/app/[locale]/dashboard/subscription/page.tsx`
- `src/components/dashboard/CurrentPlan.tsx`
- `src/components/dashboard/PlanComparison.tsx`
- `src/components/dashboard/BillingHistory.tsx`

---

## Enhancement Areas

### 1. CurrentPlan Improvements

**Add:**
- Usage progress bars
- Days until renewal
- Payment method display
- Quick actions (update payment, pause)
- Trial days remaining (if applicable)

```typescript
// Enhanced CurrentPlan
<Card>
  <div className="flex justify-between">
    <div>
      <h2>Pro Plan</h2>
      <Badge variant="success">Active</Badge>
    </div>
    <span className="text-2xl font-bold">$5/mo</span>
  </div>

  <Separator />

  {/* Usage */}
  <div className="space-y-2">
    <UsageBar label="Conversions" used={45} limit={500} />
    <UsageBar label="Storage" used={512} limit={1024} unit="MB" />
  </div>

  <Separator />

  {/* Renewal Info */}
  <div className="flex justify-between text-sm">
    <span>Next billing date</span>
    <span>January 15, 2025 (in 17 days)</span>
  </div>

  {/* Payment Method */}
  <div className="flex justify-between text-sm">
    <span>Payment method</span>
    <span>Visa •••• 4242</span>
  </div>

  {/* Actions */}
  <div className="flex gap-2">
    <Button variant="outline">Update Payment</Button>
    <Button variant="outline">Pause Subscription</Button>
  </div>
</Card>
```

### 2. PlanComparison Enhancement

**Add:**
- Annual savings highlight
- Feature tooltips with explanations
- Current plan indicator
- Proration info for upgrades
- Popular plan badge

**Improve:**
- Mobile-friendly comparison
- Clear upgrade/downgrade paths
- Feature grouping

### 3. BillingHistory Enhancement

**Add:**
- Invoice PDF download
- Receipt generation
- Payment status icons
- Refund display
- Tax information

### 4. Payment Method Management

**New component needed:**

```typescript
// src/components/dashboard/PaymentMethods.tsx
- Show current payment method
- Add new payment method
- Set default
- Remove payment method
- Handle per-gateway display
```

### 5. Subscription Actions

**Add:**
- Pause subscription
- Resume subscription
- Change billing cycle
- Apply promo code
- Request refund

---

## Multi-Gateway Support

Handle different gateways appropriately:

```typescript
// Stripe
- Manage via Stripe Customer Portal
- Show card details

// Paddle
- Manage via Paddle update URL
- Show card details

// Paymob/PayTabs
- Limited management (cancel only)
- Show renewal info
```

---

## New Components

### 1. PaymentMethodCard

```typescript
// src/components/dashboard/PaymentMethodCard.tsx
interface PaymentMethodCardProps {
  gateway: 'stripe' | 'paddle' | 'paymob' | 'paytabs';
  cardBrand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}
```

### 2. PromoCodeInput

```typescript
// src/components/dashboard/PromoCodeInput.tsx
interface PromoCodeInputProps {
  onApply: (code: string) => Promise<PromoResult>;
}
```

### 3. SubscriptionActions

```typescript
// src/components/dashboard/SubscriptionActions.tsx
// Dropdown with: Pause, Resume, Cancel, Change plan
```

---

## API Endpoints Needed

```typescript
// Check if these exist, add if missing:
GET /api/subscriptions/payment-method
POST /api/subscriptions/pause
POST /api/subscriptions/resume
POST /api/subscriptions/promo-code
GET /api/subscriptions/portal-url (Stripe customer portal)
```

---

## Pricing Page Update

Update public pricing page to match dashboard:

```typescript
// src/app/[locale]/pricing/page.tsx
- Consistent feature list
- Same styling
- Login prompt for upgrading
```

---

## Files to Create/Modify

### Create:
1. `src/components/dashboard/PaymentMethodCard.tsx`
2. `src/components/dashboard/PromoCodeInput.tsx`
3. `src/components/dashboard/SubscriptionActions.tsx`

### Modify:
1. `src/components/dashboard/CurrentPlan.tsx`
2. `src/components/dashboard/PlanComparison.tsx`
3. `src/components/dashboard/BillingHistory.tsx`
4. `src/app/[locale]/dashboard/subscription/page.tsx`

---

## Testing

1. Plan display correct for each plan
2. Upgrade flow works
3. Downgrade flow works
4. Cancel flow works
5. Billing history displays correctly
6. Payment method updates work

---

## Acceptance Criteria

- [ ] Current plan shows all details
- [ ] Usage progress visible
- [ ] Payment method displayed
- [ ] Billing history complete
- [ ] Invoice download works
- [ ] Plan switching works
- [ ] Cancel flow clear
- [ ] Multi-gateway handled
- [ ] Mobile responsive
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 3.3 status to ✅
2. Update progress bar
3. Add to completion log
