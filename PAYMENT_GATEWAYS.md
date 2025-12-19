# Payment Gateway Alternatives

This document lists payment gateway options for the Markdown to PDF application, covering Egyptian, Arabic/MENA, and global markets.

---

## Egyptian Payment Gateways 🇪🇬

| Provider | Fees | Features | Best For |
|----------|------|----------|----------|
| **[Paymob](https://paymob.com)** | 2.75% + 3 EGP | Visa/Mastercard/Meeza, Mobile wallets (Vodafone Cash, Orange, Etisalat), 390K+ merchants | Most popular, recommended |
| **[Fawry](https://fawry.com)** | Variable | 105,000 POS locations, Cash + Electronic payments, Trusted brand | Cash-preferred customers |
| **[Kashier](https://kashier.io)** | 2.5% + 2 EGP | Simple API, Easy onboarding, Good dashboard | Small businesses |
| **[Accept](https://accept.paymobsolutions.com)** | 2.75% | By Paymob, Simplified version | Startups, SMBs |

### Paymob Integration (Recommended for Egypt)

```bash
# Environment Variables
PAYMOB_API_KEY=your-api-key
PAYMOB_INTEGRATION_ID=your-integration-id
PAYMOB_IFRAME_ID=your-iframe-id
PAYMOB_HMAC_SECRET=your-hmac-secret
```

**Supported Payment Methods:**
- Credit/Debit Cards (Visa, Mastercard, Meeza)
- Mobile Wallets (Vodafone Cash, Orange Money, Etisalat Cash, WE Pay)
- Fawry Reference Code
- ValU (Buy Now Pay Later)
- Sympl (Installments)

---

## Arabic/MENA Payment Gateways 🌍

| Provider | Countries | Features | Best For |
|----------|-----------|----------|----------|
| **[PayTabs](https://paytabs.com)** | Saudi, UAE, Egypt, Jordan, Oman, Bahrain | Multi-currency, Easy integration | Regional expansion |
| **[Tap Payments](https://tap.company)** | All GCC | Unified API for all payment methods | GCC-focused |
| **[Moyasar](https://moyasar.com)** | Saudi Arabia | Apple Pay, Mada, Most popular in KSA | Saudi market |
| **[HyperPay](https://hyperpay.com)** | Saudi, UAE | High security, WooCommerce/Shopify plugins | eCommerce |
| **[MyFatoorah](https://myfatoorah.com)** | GCC | Invoicing + Payments | B2B, Invoicing |
| **[Telr](https://telr.com)** | UAE, Saudi | Fraud prevention, All business sizes | UAE market |

### PayTabs Integration (Recommended for MENA)

```bash
# Environment Variables
PAYTABS_PROFILE_ID=your-profile-id
PAYTABS_SERVER_KEY=your-server-key
PAYTABS_CLIENT_KEY=your-client-key
PAYTABS_REGION=ARE  # or SAU, EGY, JOR, OMN, BHR
```

---

## Global Payment Gateways 🌐

### Merchant of Record (MoR) Platforms
*Handle taxes, compliance, and chargebacks for you*

| Provider | Fees | Features | Best For |
|----------|------|----------|----------|
| **[Paddle](https://paddle.com)** | 5% + $0.50 | Full tax compliance, B2B invoicing | SaaS businesses |
| **[LemonSqueezy](https://lemonsqueezy.com)** | 5% + $0.50 | Simple setup, Now owned by Stripe | Digital products |
| **[Gumroad](https://gumroad.com)** | 10% | Creator-focused, Simple | Indie creators |
| **[Payhip](https://payhip.com)** | 5% free / 2% paid | Affordable, Affiliates built-in | Digital products |
| **[FastSpring](https://fastspring.com)** | 8.9% or $199/mo | Enterprise features | Large SaaS |

### Payment Processors
*You handle taxes and compliance*

| Provider | Fees | Features | Best For |
|----------|------|----------|----------|
| **[Stripe](https://stripe.com)** | 2.9% + $0.30 | Best API, Global reach | Default choice |
| **[Braintree](https://braintreepayments.com)** | 2.9% + $0.30 | PayPal integration | PayPal users |
| **[Adyen](https://adyen.com)** | Variable | Enterprise-grade | Large enterprises |
| **[2Checkout](https://2checkout.com)** | 3.5% + $0.35 | Global, Multi-currency | International sales |

---

## Recommended Setup for This Project

### Option 1: Egypt Only
```
Primary: Paymob
- Covers all Egyptian payment methods
- Local support
- Competitive rates
```

### Option 2: Egypt + MENA
```
Egypt: Paymob
MENA: PayTabs or Tap Payments
```

### Option 3: Global + Egypt
```
Global: Stripe (or Paddle for MoR)
Egypt: Paymob
- Route Egyptian customers to Paymob
- Route international customers to Stripe
```

### Option 4: Full Global (MoR)
```
Primary: Paddle
- Handles all taxes automatically
- Works globally including Egypt (via cards)
- Best for SaaS subscriptions
```

---

## Feature Comparison

| Feature | Stripe | Paymob | PayTabs | Paddle |
|---------|--------|--------|---------|--------|
| Subscriptions | ✅ | ✅ | ✅ | ✅ |
| One-time payments | ✅ | ✅ | ✅ | ✅ |
| Mobile wallets (Egypt) | ❌ | ✅ | ❌ | ❌ |
| Tax handling | ❌ | ❌ | ❌ | ✅ |
| Arabic dashboard | ❌ | ✅ | ✅ | ❌ |
| Local support | ❌ | ✅ | ✅ | ❌ |
| Fawry integration | ❌ | ✅ | ❌ | ❌ |
| Apple Pay | ✅ | ✅ | ✅ | ✅ |
| Webhook support | ✅ | ✅ | ✅ | ✅ |

---

## Implementation Status

All payment gateways have been fully implemented and tested with a unified gateway selector.

**Test Coverage:** 168 payment-related tests passing (709 total tests)

| Gateway | Status | Tests | Use Case |
|---------|--------|-------|----------|
| **Stripe** | ✅ Complete | ✅ Passing | Global default, international payments |
| **Paymob** | ✅ Complete | ✅ Passing | Egyptian market (EGP, mobile wallets) |
| **PayTabs** | ✅ Complete | ✅ Passing | MENA expansion (Saudi Arabia, UAE, etc.) |
| **Paddle** | ✅ Complete | ✅ Passing | Merchant of Record for EU markets |

### Implementation Files

```
src/lib/payments/
├── index.ts                 # Unified payment gateway exports
├── types.ts                 # Shared type definitions
├── gateway-selector.ts      # Smart gateway selection logic
├── stripe/
│   ├── index.ts            # Stripe exports
│   └── gateway.ts          # Stripe gateway implementation
├── paymob/
│   ├── config.ts           # Paymob configuration
│   ├── client.ts           # Paymob API client
│   ├── index.ts            # Paymob exports
│   └── gateway.ts          # Paymob gateway implementation
├── paytabs/
│   ├── config.ts           # PayTabs configuration
│   ├── client.ts           # PayTabs API client
│   ├── index.ts            # PayTabs exports
│   └── gateway.ts          # PayTabs gateway implementation
└── paddle/
    ├── config.ts           # Paddle configuration
    ├── client.ts           # Paddle SDK wrapper
    ├── index.ts            # Paddle exports
    └── gateway.ts          # Paddle gateway implementation
```

### Gateway Selection Logic

The system automatically selects the best gateway based on:
1. **User preference** - If a specific gateway is requested
2. **Country code** - Egypt uses Paymob, MENA uses PayTabs, EU uses Paddle
3. **Currency** - EGP routes to Paymob, SAR/AED to PayTabs, EUR to Paddle
4. **Fallback order** - Stripe → Paddle → PayTabs → Paymob

### API Endpoints

```
POST /api/checkout - Create checkout session (auto-selects or uses specified gateway)
GET  /api/checkout - Get available gateways for user's region

POST /api/webhooks/stripe  - Stripe webhook handler
POST /api/webhooks/paymob  - Paymob webhook handler
POST /api/webhooks/paytabs - PayTabs webhook handler
POST /api/webhooks/paddle  - Paddle webhook handler
```

### Usage Example

```typescript
// Auto-select gateway based on user's location
const response = await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({
    plan: 'pro',
    billing: 'monthly',
    countryCode: 'EG',  // Optional: auto-selects Paymob
    currency: 'EGP',    // Optional: for pricing
  }),
});

// Or specify a gateway explicitly
const response = await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({
    plan: 'pro',
    billing: 'monthly',
    gateway: 'stripe',  // Force use of Stripe
  }),
});
```

---

## Resources

- [Paymob Documentation](https://docs.paymob.com/)
- [PayTabs Documentation](https://site.paytabs.com/en/developer/)
- [Paddle Documentation](https://developer.paddle.com/)
- [Stripe Documentation](https://stripe.com/docs)

---

## Contact

For payment integration support: mwm.softwars.solutions@gmail.com
