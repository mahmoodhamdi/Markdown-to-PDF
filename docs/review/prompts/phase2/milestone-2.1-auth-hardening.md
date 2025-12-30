# Milestone 2.1: Authentication Hardening

## Status: ⬜ Not Started
## Priority: HIGH
## Estimated Scope: Medium

---

## Objective

Review and strengthen authentication security across the application.

---

## Security Audit Areas

### 1. Password Security

**File:** `src/lib/auth/config.ts`

Verify:
- [ ] bcrypt rounds >= 12 (currently may be 10)
- [ ] Password minimum length enforced (8+ chars)
- [ ] Password complexity requirements
- [ ] Rate limiting on login attempts

**Improvements:**
```typescript
// Increase bcrypt rounds
const BCRYPT_ROUNDS = 12;

// Add password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase')
  .regex(/[a-z]/, 'Password must contain lowercase')
  .regex(/[0-9]/, 'Password must contain a number');
```

### 2. Session Security

**File:** `src/lib/auth/session-service.ts`

Verify:
- [ ] Session token is hashed (SHA256)
- [ ] Session expiry is reasonable (30 days)
- [ ] Inactive session cleanup
- [ ] Session invalidation on password change

**Add:**
```typescript
// Invalidate all sessions on password change
async function invalidateAllUserSessions(userId: string) {
  await Session.deleteMany({ userId });
}

// Add to password change flow
await invalidateAllUserSessions(userId);
```

### 3. Token Security

**Files:**
- `src/lib/db/models/PasswordResetToken.ts`
- `src/lib/db/models/EmailVerificationToken.ts`

Verify:
- [ ] Tokens are cryptographically random
- [ ] Tokens expire appropriately (1 hour for reset)
- [ ] Tokens are single-use
- [ ] Failed attempts are rate limited

### 4. OAuth Security

**File:** `src/lib/auth/account-service.ts`

Verify:
- [ ] OAuth tokens stored securely
- [ ] Cannot unlink last auth method
- [ ] Proper scope handling

---

## Rate Limiting Requirements

### Login Attempts
```typescript
// Add to auth routes
const loginRateLimit = {
  window: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDuration: 30 * 60 * 1000, // 30 minutes
};

// Track failed attempts
await trackFailedLogin(email, ip);
const attempts = await getFailedLoginCount(email, ip);
if (attempts >= 5) {
  return NextResponse.json(
    { error: 'Too many login attempts. Try again later.' },
    { status: 429 }
  );
}
```

### Password Reset
```typescript
// Already exists in PasswordResetToken.ts
// Verify countRecentResetRequests() is used
const recentRequests = await countRecentResetRequests(email);
if (recentRequests >= 3) {
  return NextResponse.json(
    { error: 'Too many reset requests' },
    { status: 429 }
  );
}
```

---

## Security Headers

Add to `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];
```

---

## CSRF Protection

Verify NextAuth handles CSRF:
- [ ] CSRF token in forms
- [ ] SameSite cookie attribute
- [ ] Origin header validation

---

## Files to Review/Modify

1. `src/lib/auth/config.ts`
2. `src/lib/auth/session-service.ts`
3. `src/lib/auth/account-service.ts`
4. `src/app/api/auth/register/route.ts`
5. `src/app/api/auth/[...nextauth]/route.ts`
6. `src/app/api/auth/forgot-password/route.ts`
7. `src/app/api/auth/reset-password/route.ts`
8. `src/app/api/users/change-password/route.ts`
9. `next.config.js` (security headers)

---

## Testing

### Security Tests:
1. Password with < 8 chars should fail
2. 6+ login attempts should be blocked
3. Expired token should not work
4. Used token should not work again
5. Session should expire after 30 days

---

## Acceptance Criteria

- [ ] Bcrypt rounds increased to 12
- [ ] Password complexity enforced
- [ ] Login rate limiting active
- [ ] Password reset rate limiting active
- [ ] Sessions invalidated on password change
- [ ] Security headers added
- [ ] All auth-related tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 2.1 status to ✅
2. Update progress bar
3. Add to completion log
