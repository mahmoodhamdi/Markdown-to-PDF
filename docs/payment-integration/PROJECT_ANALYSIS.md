# Project Analysis

## Tech Stack Detected
- **Framework**: Next.js 14.2.15 (App Router)
- **Language**: TypeScript 5.6.3
- **Database**: MongoDB with Mongoose 9.0.2
- **ORM**: Mongoose
- **Auth**: NextAuth.js 4.24.13 with credentials, GitHub, and Google providers
- **Styling**: Tailwind CSS 3.4.14 with Radix UI components
- **Testing**: Vitest 2.1.3 (unit/integration), Playwright 1.48.2 (E2E)
- **State Management**: Zustand 5.0.1

## Existing Payment Integration
- [x] Stripe - Complete implementation
- [x] Paymob - Complete implementation
- [x] PayTabs - Complete implementation
- [x] Paddle - Complete implementation
- [ ] Unified gateway selector - Needs creation
- [ ] Comprehensive tests - Needs creation

## Current Database Schema (MongoDB/Mongoose)

### User Model (`src/lib/db/models/User.ts`)
```typescript
interface IUser {
  _id: string;           // Email as ID
  email: string;
  name: string;
  image: string;
  password?: string;     // Hashed for credentials auth
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  usage: {
    conversions: number;
    apiCalls: number;
    lastReset: string;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymobTransactionId?: string;
  paytabsTransactionRef?: string;
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Project Purpose
Markdown to PDF is a SaaS application that converts Markdown documents to professionally formatted PDF files. Users can:
- Convert Markdown to PDF with various themes
- Use templates for different document types
- Access batch conversion for multiple files
- Store files in cloud storage
- Collaborate in teams

## Subscription Features by Tier

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| Daily Conversions | 5 | 100 | 500 | Unlimited |
| API Access | ❌ | ✅ | ✅ | ✅ |
| Templates | Basic | All | All + Custom | All + Custom |
| Cloud Storage | 100MB | 5GB | 25GB | Unlimited |
| Team Members | 1 | 1 | 10 | Unlimited |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ❌ | ✅ |

## Payment Gateway Coverage

| Gateway | Markets | Payment Methods |
|---------|---------|-----------------|
| Stripe | Global (US, EU, etc.) | Cards, Apple Pay, Google Pay |
| Paymob | Egypt | Cards, Vodafone Cash, Orange, Fawry |
| PayTabs | MENA (Saudi, UAE, etc.) | Cards, Mada, Apple Pay |
| Paddle | Global (MoR) | Cards, PayPal, Wire Transfer |

## Environment Variables Required

### Stripe
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY
STRIPE_PRICE_TEAM_MONTHLY
STRIPE_PRICE_TEAM_YEARLY
STRIPE_PRICE_ENTERPRISE_MONTHLY
STRIPE_PRICE_ENTERPRISE_YEARLY
```

### Paymob
```
PAYMOB_API_KEY
PAYMOB_PUBLIC_KEY
PAYMOB_SECRET_KEY
PAYMOB_INTEGRATION_ID_CARD
PAYMOB_INTEGRATION_ID_WALLET
PAYMOB_HMAC_SECRET
PAYMOB_IFRAME_ID
```

### PayTabs
```
PAYTABS_PROFILE_ID
PAYTABS_SERVER_KEY
PAYTABS_CLIENT_KEY
PAYTABS_REGION
```

### Paddle
```
PADDLE_API_KEY
PADDLE_CLIENT_TOKEN
PADDLE_WEBHOOK_SECRET
PADDLE_ENVIRONMENT
PADDLE_SELLER_ID
PADDLE_PRICE_PRO_MONTHLY
PADDLE_PRICE_PRO_YEARLY
PADDLE_PRICE_TEAM_MONTHLY
PADDLE_PRICE_TEAM_YEARLY
PADDLE_PRICE_ENTERPRISE_MONTHLY
PADDLE_PRICE_ENTERPRISE_YEARLY
```

## Webhook Endpoints

| Provider | Endpoint |
|----------|----------|
| Stripe | `/api/webhooks/stripe` |
| Paymob | `/api/webhooks/paymob` |
| PayTabs | `/api/webhooks/paytabs` |
| Paddle | `/api/webhooks/paddle` |

## Implementation Status

### Completed
- ✅ Payment gateway types and interfaces
- ✅ Stripe gateway implementation
- ✅ Paymob gateway implementation
- ✅ PayTabs gateway implementation
- ✅ Paddle gateway implementation
- ✅ Webhook handlers for all gateways

### In Progress
- 🔄 Unified gateway selector
- 🔄 Comprehensive test coverage

### Pending
- ⏳ Unit tests for all gateways
- ⏳ Integration tests
- ⏳ E2E payment flow tests
- ⏳ Documentation updates
