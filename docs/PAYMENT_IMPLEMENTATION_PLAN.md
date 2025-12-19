# Payment Gateway Implementation Plan

## Overview

This document outlines the implementation plan for integrating multiple payment gateways into the Markdown-to-PDF application.

### Payment Gateways to Implement

| Gateway | Market | Priority | Status |
|---------|--------|----------|--------|
| Stripe | Global | Phase 1 | ✅ Completed |
| Paymob | Egypt | Phase 2 | ✅ Completed |
| PayTabs | MENA | Phase 3 | ✅ Completed |
| Paddle | Global MoR | Phase 4 | ✅ Completed |

**All payment gateways have been fully implemented and tested. 168 payment-related tests passing.**

---

## Architecture

### Unified Payment Gateway Interface

All payment gateways will implement a common interface for consistency:

```typescript
interface PaymentGateway {
  name: string;
  isConfigured(): boolean;
  createCheckoutSession(options: CheckoutOptions): Promise<CheckoutResult>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  getSubscription(subscriptionId: string): Promise<Subscription>;
}

interface CheckoutOptions {
  userEmail: string;
  userId: string;
  plan: 'pro' | 'team' | 'enterprise';
  billing: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
  locale?: string;
  currency?: string;
}

interface CheckoutResult {
  url: string;
  sessionId: string;
  gateway: string;
}

interface WebhookResult {
  event: string;
  userEmail?: string;
  plan?: string;
  subscriptionId?: string;
  customerId?: string;
}
```

### File Structure

```
src/lib/payments/
├── index.ts                 # Unified payment gateway exports
├── types.ts                 # Shared type definitions
├── gateway-selector.ts      # Smart gateway selection logic
├── stripe/
│   ├── config.ts           # Stripe configuration
│   ├── client.ts           # Stripe client methods
│   └── index.ts            # Stripe gateway implementation
├── paymob/
│   ├── config.ts           # Paymob configuration
│   ├── client.ts           # Paymob API client
│   └── index.ts            # Paymob gateway implementation
├── paytabs/
│   ├── config.ts           # PayTabs configuration
│   ├── client.ts           # PayTabs API client
│   └── index.ts            # PayTabs gateway implementation
└── paddle/
    ├── config.ts           # Paddle configuration
    ├── client.ts           # Paddle SDK wrapper
    └── index.ts            # Paddle gateway implementation

src/app/api/
├── checkout/
│   └── route.ts            # Unified checkout endpoint
├── webhooks/
│   ├── stripe/route.ts     # Stripe webhook handler
│   ├── paymob/route.ts     # Paymob callback handler
│   ├── paytabs/route.ts    # PayTabs callback handler
│   └── paddle/route.ts     # Paddle webhook handler
```

---

## Phase 2: Paymob (Egypt)

### Overview
Paymob is the leading payment gateway in Egypt, supporting:
- Credit/Debit Cards (Visa, Mastercard, Meeza)
- Mobile Wallets (Vodafone Cash, Orange Money, Etisalat Cash, WE Pay)
- Fawry Reference Code
- ValU (Buy Now Pay Later)
- Sympl (Installments)

### Environment Variables

```env
# Paymob Configuration
PAYMOB_API_KEY=your-api-key
PAYMOB_PUBLIC_KEY=your-public-key
PAYMOB_SECRET_KEY=your-secret-key
PAYMOB_INTEGRATION_ID_CARD=your-card-integration-id
PAYMOB_INTEGRATION_ID_WALLET=your-wallet-integration-id
PAYMOB_HMAC_SECRET=your-hmac-secret
PAYMOB_IFRAME_ID=your-iframe-id
```

### API Flow (Intention API - Modern)

1. **Create Payment Intention**
   - Endpoint: `POST https://accept.paymob.com/v1/intention/`
   - Headers: `Authorization: Token {secret_key}`
   - Create intention with amount, currency, payment methods

2. **Redirect to Checkout**
   - Use client_secret from intention to open checkout
   - Customer completes payment

3. **Handle Callback/Webhook**
   - Endpoint: `/api/webhooks/paymob`
   - Verify HMAC signature
   - Update user subscription

### Implementation Tasks

- [x] Create `src/lib/payments/paymob/config.ts`
- [x] Create `src/lib/payments/paymob/client.ts`
- [x] Create `src/lib/payments/paymob/index.ts`
- [x] Create `src/lib/payments/paymob/gateway.ts`
- [x] Create `src/app/api/webhooks/paymob/route.ts`
- [x] Write unit tests (`__tests__/unit/lib/payments/paymob-gateway.test.ts`)
- [x] Write integration tests

---

## Phase 3: PayTabs (MENA)

### Overview
PayTabs operates across MENA region:
- Saudi Arabia, UAE, Egypt, Jordan, Oman, Bahrain

### Environment Variables

```env
# PayTabs Configuration
PAYTABS_PROFILE_ID=your-profile-id
PAYTABS_SERVER_KEY=your-server-key
PAYTABS_CLIENT_KEY=your-client-key
PAYTABS_REGION=ARE  # or SAU, EGY, JOR, OMN, BHR
```

### API Flow

1. **Create PayPage**
   - Endpoint: `POST https://secure.paytabs.{region}/payment/request`
   - Headers: `Authorization: {server_key}`
   - Returns redirect URL for payment

2. **Customer Payment**
   - Customer redirected to PayTabs hosted page
   - Completes payment

3. **Handle Callback**
   - Endpoint: `/api/webhooks/paytabs`
   - Verify payment reference
   - Update user subscription

### Regional Endpoints

| Region | Endpoint |
|--------|----------|
| UAE | secure.paytabs.com |
| Saudi | secure.paytabs.sa |
| Egypt | secure.paytabs.eg |
| Oman | secure.paytabs.om |
| Jordan | secure.paytabs.jo |
| Global | secure-global.paytabs.com |

### Implementation Tasks

- [x] Create `src/lib/payments/paytabs/config.ts`
- [x] Create `src/lib/payments/paytabs/client.ts`
- [x] Create `src/lib/payments/paytabs/index.ts`
- [x] Create `src/lib/payments/paytabs/gateway.ts`
- [x] Create `src/app/api/webhooks/paytabs/route.ts`
- [x] Write unit tests (`__tests__/unit/lib/payments/paytabs-gateway.test.ts`)
- [x] Write integration tests

---

## Phase 4: Paddle (Global MoR)

### Overview
Paddle is a Merchant of Record (MoR), handling:
- Tax compliance in 200+ countries
- Payment processing
- Fraud protection
- Invoicing

### Environment Variables

```env
# Paddle Configuration
PADDLE_API_KEY=your-api-key
PADDLE_CLIENT_TOKEN=your-client-token
PADDLE_WEBHOOK_SECRET=your-webhook-secret
PADDLE_ENVIRONMENT=sandbox  # or production
PADDLE_SELLER_ID=your-seller-id

# Paddle Price IDs
PADDLE_PRICE_PRO_MONTHLY=pri_xxx
PADDLE_PRICE_PRO_YEARLY=pri_xxx
PADDLE_PRICE_TEAM_MONTHLY=pri_xxx
PADDLE_PRICE_TEAM_YEARLY=pri_xxx
PADDLE_PRICE_ENTERPRISE_MONTHLY=pri_xxx
PADDLE_PRICE_ENTERPRISE_YEARLY=pri_xxx
```

### API Flow

1. **Initialize Paddle.js**
   - Load Paddle.js on frontend
   - Configure with client token

2. **Create Transaction**
   - Use Paddle.js to open checkout
   - Or create transaction via API

3. **Handle Webhook**
   - Endpoint: `/api/webhooks/paddle`
   - Verify webhook signature
   - Handle subscription events

### Implementation Tasks

- [x] Install `@paddle/paddle-node-sdk`
- [x] Create `src/lib/payments/paddle/config.ts`
- [x] Create `src/lib/payments/paddle/client.ts`
- [x] Create `src/lib/payments/paddle/index.ts`
- [x] Create `src/lib/payments/paddle/gateway.ts`
- [x] Create `src/app/api/webhooks/paddle/route.ts`
- [x] Write unit tests (`__tests__/unit/lib/payments/paddle-gateway.test.ts`)
- [x] Write integration tests

---

## Gateway Selection Logic

The system will automatically select the appropriate payment gateway based on:

1. **User Location** (determined by IP geolocation)
   - Egypt → Paymob
   - MENA (Saudi, UAE, etc.) → PayTabs
   - Global → Paddle or Stripe

2. **Currency Preference**
   - EGP → Paymob
   - SAR, AED, etc. → PayTabs
   - USD, EUR, etc. → Paddle/Stripe

3. **User Preference**
   - Allow manual override in settings

4. **Fallback Chain**
   - If primary gateway fails, try next available

---

## Testing Strategy

### Unit Tests

Each gateway will have unit tests covering:
- Configuration validation
- Request payload construction
- Response parsing
- HMAC/signature verification
- Error handling

### Integration Tests

- Mock API responses
- Test full checkout flow
- Test webhook handling
- Test subscription lifecycle

### E2E Tests

- Complete payment flow with test credentials
- Multi-gateway switching
- Error recovery scenarios

---

## Pricing Configuration

### Egyptian Market (Paymob) - EGP

| Plan | Monthly | Yearly |
|------|---------|--------|
| Pro | 299 EGP | 2,999 EGP |
| Team | 799 EGP | 7,999 EGP |
| Enterprise | 2,499 EGP | 24,999 EGP |

### MENA Market (PayTabs) - USD

| Plan | Monthly | Yearly |
|------|---------|--------|
| Pro | $9.99 | $99 |
| Team | $29.99 | $299 |
| Enterprise | $79.99 | $799 |

### Global Market (Paddle/Stripe) - USD

| Plan | Monthly | Yearly |
|------|---------|--------|
| Pro | $9.99 | $99 |
| Team | $29.99 | $299 |
| Enterprise | $79.99 | $799 |

---

## Security Considerations

1. **Webhook Signature Verification**
   - All webhooks must verify signatures
   - Reject unsigned/invalid requests

2. **HTTPS Only**
   - All API calls over HTTPS
   - Redirect HTTP to HTTPS

3. **API Key Security**
   - Never expose secret keys to frontend
   - Use environment variables
   - Rotate keys periodically

4. **Idempotency**
   - Handle duplicate webhooks gracefully
   - Use transaction IDs for deduplication

---

## Documentation Updates

After implementation, update:
- [x] README.md - Add payment gateway configuration
- [x] PAYMENT_GATEWAYS.md - Update with implementation details
- [x] GITHUB_SECRETS.md - Add all required secrets
- [x] .env.example - Add all environment variables

### Test Files

All payment gateways have comprehensive test coverage:

```
__tests__/unit/lib/payments/
├── stripe-gateway.test.ts      # Stripe gateway tests
├── paymob-gateway.test.ts      # Paymob gateway tests
├── paytabs-gateway.test.ts     # PayTabs gateway tests
├── paddle-gateway.test.ts      # Paddle gateway tests
└── gateway-selector.test.ts    # Gateway selector tests
```

---

## Contact

For payment integration support: mwm.softwars.solutions@gmail.com
