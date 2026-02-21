# Phase 1: Security Fixes

## 1.1 Credential Cleanup
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Remove real email from `.env.example`
- [ ] Generate strong NEXTAUTH_SECRET placeholder

## 1.2 Webhook Signature Verification (PayTabs + Paddle)
- [ ] Make PayTabs webhook reject requests without signature
- [ ] Make Paddle webhook reject requests without signature when secret is configured
- [ ] Match Stripe's pattern (always verify)

## 1.3 Open Redirect Fix (Portal URL)
- [ ] Validate `returnUrl` against app origin in `/api/subscriptions/portal-url`

## 1.4 OAuth Account Deletion Fix
- [ ] Change OAuth deletion confirmation from email to "DELETE" text
- [ ] Update frontend DeleteAccount component to match

## 1.5 Server-Side HTML Sanitization
- [ ] Use DOMPurify with jsdom for server-side sanitization
- [ ] Ensure sanitization runs AFTER all post-processing (emoji, math, mermaid)

## 1.6 MIME Type Validation
- [ ] Add magic-byte validation for file uploads (storage/upload and storage/avatar)

## 1.7 Input Validation Fixes
- [ ] Add min/max constraints to margin inputs in PageSettings
- [ ] Add min/max constraints to custom page dimensions
- [ ] Validate custom width/height server-side in convert API

## Next: Execute `02-BUG-FIXES.md`
