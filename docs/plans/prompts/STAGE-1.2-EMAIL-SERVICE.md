# Stage 1.2: Email Notification Service

**Phase:** 1 - Critical Fixes
**Priority:** 🔴 Critical
**Estimated Effort:** Medium

---

## Context

Email functionality is configured (SMTP env vars exist) but no email service is implemented. Users cannot:
- Receive welcome emails
- Reset their password
- Get subscription confirmations
- Receive team invitations

### Current State

Environment variables defined in `docs/environment-variables.md`:
```
EMAIL_SERVER_HOST
EMAIL_SERVER_PORT
EMAIL_SERVER_USER
EMAIL_SERVER_PASSWORD
EMAIL_FROM
```

**Installed:** `nodemailer` is in package.json

---

## Task Requirements

### 1. Create Email Service

**File to create:** `src/lib/email/service.ts`

```typescript
// Core email service with:
interface EmailService {
  sendEmail(options: EmailOptions): Promise<void>;
  sendWelcomeEmail(user: User): Promise<void>;
  sendPasswordResetEmail(user: User, token: string): Promise<void>;
  sendSubscriptionConfirmation(user: User, plan: PlanType): Promise<void>;
  sendTeamInvitation(email: string, team: Team, inviter: User): Promise<void>;
  sendSubscriptionCanceled(user: User): Promise<void>;
}
```

### 2. Create Email Templates

**Directory to create:** `src/lib/email/templates/`

Templates needed:
- `welcome.ts` - Welcome email for new users
- `password-reset.ts` - Password reset link
- `subscription-confirmation.ts` - Plan subscription confirmed
- `subscription-canceled.ts` - Plan canceled
- `team-invitation.ts` - Invited to team
- `base.ts` - Base template wrapper (header, footer, styling)

Template format:
```typescript
export function getWelcomeEmail(user: User): { subject: string; html: string; text: string } {
  return {
    subject: 'Welcome to Markdown to PDF!',
    html: `...`,
    text: `...`
  };
}
```

### 3. Create Email Queue (Optional but Recommended)

**File to create:** `src/lib/email/queue.ts`

Simple in-memory queue with retry logic:
- Queue emails for sending
- Retry failed emails (max 3 attempts)
- Log failures for debugging

### 4. Integrate with Auth Flow

**Files to modify:**
- `src/app/api/auth/register/route.ts` - Send welcome email
- Create `src/app/api/auth/forgot-password/route.ts` - Send reset email
- Create `src/app/api/auth/reset-password/route.ts` - Process reset

### 5. Integrate with Subscription Flow

**Files to modify:**
- `src/app/api/webhooks/stripe/route.ts` - Send confirmation on subscription
- `src/app/api/webhooks/paymob/route.ts` - Send confirmation
- `src/app/api/webhooks/paytabs/route.ts` - Send confirmation
- `src/app/api/webhooks/paddle/route.ts` - Send confirmation

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/email/service.ts` | Create |
| `src/lib/email/queue.ts` | Create |
| `src/lib/email/templates/base.ts` | Create |
| `src/lib/email/templates/welcome.ts` | Create |
| `src/lib/email/templates/password-reset.ts` | Create |
| `src/lib/email/templates/subscription-confirmation.ts` | Create |
| `src/lib/email/templates/subscription-canceled.ts` | Create |
| `src/lib/email/templates/team-invitation.ts` | Create |
| `src/lib/email/templates/index.ts` | Create |
| `src/app/api/auth/register/route.ts` | Modify |
| `src/app/api/auth/forgot-password/route.ts` | Create |
| `src/app/api/auth/reset-password/route.ts` | Create |
| `src/lib/db/models/PasswordResetToken.ts` | Create |

---

## Email Template Design

Use inline CSS for email compatibility:

```typescript
const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const buttonStyles = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #0070f3;
  color: white;
  text-decoration: none;
  border-radius: 6px;
`;
```

---

## Testing Requirements

### Unit Tests

**File to create:** `__tests__/unit/lib/email/service.test.ts`

Test cases (mock nodemailer):
- [ ] sendEmail sends with correct options
- [ ] sendWelcomeEmail formats correctly
- [ ] sendPasswordResetEmail includes token
- [ ] sendSubscriptionConfirmation includes plan details
- [ ] Queue retries failed emails

### Integration Tests

**File to create:** `__tests__/integration/email/email-flow.test.ts`

Test cases:
- [ ] Registration triggers welcome email
- [ ] Password reset flow works end-to-end
- [ ] Subscription webhook triggers email

---

## Password Reset Flow

### Database Model

**File to create:** `src/lib/db/models/PasswordResetToken.ts`

```typescript
interface IPasswordResetToken {
  userId: string;
  token: string; // Hashed
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
```

### API Endpoints

**POST /api/auth/forgot-password**
```typescript
// Request
{ email: string }

// Response
{ message: 'If an account exists, a reset email has been sent' }

// Logic:
// 1. Find user by email
// 2. Generate token (crypto.randomBytes)
// 3. Hash and store token
// 4. Send email with reset link
```

**POST /api/auth/reset-password**
```typescript
// Request
{ token: string, password: string }

// Response
{ message: 'Password reset successful' }

// Logic:
// 1. Find token, check not expired/used
// 2. Hash new password
// 3. Update user password
// 4. Mark token as used
// 5. Optionally invalidate other sessions
```

---

## Translations

Add to `src/messages/en.json`:
```json
{
  "email": {
    "welcome": {
      "subject": "Welcome to Markdown to PDF!",
      "greeting": "Hello {name}",
      "body": "Thank you for signing up..."
    },
    "passwordReset": {
      "subject": "Reset your password",
      "body": "Click the link below to reset your password..."
    }
  }
}
```

Add equivalent to `src/messages/ar.json`

---

## Definition of Done

- [ ] Email service created with nodemailer
- [ ] All email templates created (6 templates)
- [ ] Password reset flow implemented
- [ ] Welcome email sent on registration
- [ ] Subscription emails sent on webhook
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Tested with real SMTP (Mailtrap/Gmail)
- [ ] Translations added (EN & AR)
- [ ] No TypeScript errors
- [ ] ESLint passes

---

## Environment Setup for Testing

```bash
# For development, use Mailtrap or similar
EMAIL_SERVER_HOST=smtp.mailtrap.io
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_mailtrap_user
EMAIL_SERVER_PASSWORD=your_mailtrap_pass
EMAIL_FROM=noreply@markdown-to-pdf.com
```

---

## Security Considerations

1. **Token Expiry:** Password reset tokens expire in 1 hour
2. **Token Hashing:** Store hashed tokens, not plain text
3. **Rate Limiting:** Limit password reset requests (5/hour per email)
4. **No User Enumeration:** Same response whether email exists or not
5. **HTTPS Links:** Reset links must use HTTPS

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 1.2 status to ✅ Complete*
