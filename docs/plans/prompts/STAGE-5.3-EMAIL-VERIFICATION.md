# Stage 5.3: Email Verification

**Phase:** 5 - Account Management
**Priority:** 🟡 Medium
**Estimated Effort:** Medium

---

## Context

Email verification is partially implemented (field exists) but flow is not complete.

**Prerequisite:** Stage 1.2 (Email Service) must be completed first.

---

## Task Requirements

### 1. Create Verification Model

**File to create:** `src/lib/db/models/EmailVerificationToken.ts`

```typescript
interface IEmailVerificationToken {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

### 2. Create Verification APIs

**Files to create:**
- `src/app/api/auth/verify-email/route.ts` - Verify with token
- `src/app/api/auth/resend-verification/route.ts` - Resend email

### 3. Create Verification Page

**File to create:** `src/app/[locale]/verify-email/[token]/page.tsx`

### 4. Update Registration

Modify `src/app/api/auth/register/route.ts`:
- Create verification token
- Send verification email
- Set emailVerified: false

### 5. Add Verification Banner

Show banner for unverified emails on dashboard.

---

## Verification Flow

1. User registers → emailVerified: false
2. Verification email sent with token
3. User clicks link → verify-email/[token]
4. Token validated → emailVerified: true
5. Success message shown

---

## Visual Design

### Unverified Banner
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Please verify your email address. [Resend Email]         │
└──────────────────────────────────────────────────────────────┘
```

### Verification Page
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    ✅ Email Verified!                        │
│                                                              │
│        Your email has been successfully verified.            │
│                                                              │
│                    [Go to Dashboard]                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Definition of Done

- [ ] Verification token model created
- [ ] Verification email sent on register
- [ ] Verification page works
- [ ] Resend verification works
- [ ] Unverified banner shows
- [ ] Token expiration handled
- [ ] Translations added (EN & AR)
- [ ] Tests pass

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 5.3 status to ✅ Complete*
