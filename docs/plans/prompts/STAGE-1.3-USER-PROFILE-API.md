# Stage 1.3: User Profile API Endpoints

**Phase:** 1 - Critical Fixes
**Priority:** 🔴 Critical
**Estimated Effort:** Medium

---

## Context

There are no user profile management endpoints. Users cannot:
- View their profile information
- Update their name or email
- Change their password (without reset flow)
- Delete their account

### Current State

- User model exists: `src/lib/db/models/User.ts`
- Auth config exists: `src/lib/auth/config.ts`
- No profile API routes exist

---

## Task Requirements

### 1. Create Profile API Endpoints

**Directory:** `src/app/api/users/`

#### GET /api/users/profile
Get current user's profile information.

```typescript
// Response
{
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  plan: PlanType;
  createdAt: string;
}
```

#### PATCH /api/users/profile
Update profile information.

```typescript
// Request
{
  name?: string;
  image?: string;
}

// Response
{ success: true, user: UserProfile }
```

#### POST /api/users/change-password
Change password (requires current password).

```typescript
// Request
{
  currentPassword: string;
  newPassword: string;
}

// Response
{ success: true, message: 'Password changed successfully' }
```

#### DELETE /api/users/profile
Delete user account.

```typescript
// Request
{
  password: string; // Confirm with password
  confirmation: 'DELETE'; // Type DELETE to confirm
}

// Response
{ success: true, message: 'Account deleted' }
```

### 2. Create Email Change Flow

#### POST /api/users/change-email
Request email change (sends verification to new email).

```typescript
// Request
{
  newEmail: string;
  password: string; // Verify current password
}

// Response
{ success: true, message: 'Verification email sent to new address' }
```

#### POST /api/users/verify-email-change
Verify new email with token.

```typescript
// Request
{
  token: string;
}

// Response
{ success: true, message: 'Email updated successfully' }
```

### 3. Create Email Change Token Model

**File to create:** `src/lib/db/models/EmailChangeToken.ts`

```typescript
interface IEmailChangeToken {
  userId: string;
  oldEmail: string;
  newEmail: string;
  token: string; // Hashed
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/api/users/profile/route.ts` | Create |
| `src/app/api/users/change-password/route.ts` | Create |
| `src/app/api/users/change-email/route.ts` | Create |
| `src/app/api/users/verify-email-change/route.ts` | Create |
| `src/lib/db/models/EmailChangeToken.ts` | Create |
| `src/lib/db/models/index.ts` | Update exports |
| `src/lib/email/templates/email-change.ts` | Create |

---

## Validation Rules

### Password Requirements
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');
```

### Name Requirements
```typescript
const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');
```

### Email Requirements
```typescript
const emailSchema = z.string()
  .email('Invalid email address');
```

---

## Testing Requirements

### Unit Tests

**File to create:** `__tests__/unit/api/users/profile.test.ts`

Test cases:
- [ ] GET profile returns user data
- [ ] GET profile requires authentication
- [ ] PATCH profile updates name
- [ ] PATCH profile validates input
- [ ] Change password validates current password
- [ ] Change password enforces requirements
- [ ] Delete account requires password confirmation

### Integration Tests

**File to create:** `__tests__/integration/users/profile.test.ts`

Test cases:
- [ ] Full profile update flow
- [ ] Password change flow
- [ ] Email change flow with verification
- [ ] Account deletion flow

---

## Account Deletion Flow

When a user deletes their account:

1. **Verify password and confirmation**
2. **Cancel active subscriptions**
   - Call appropriate payment gateway cancellation
3. **Delete user data**
   - Delete user's files from storage
   - Delete user's teams (if owner)
   - Remove from other teams
   - Delete usage data
   - Delete analytics data
4. **Delete user record**
5. **Invalidate sessions**
6. **Send confirmation email** (to deleted email)

### Data Retention

Some data may be retained for legal/financial reasons:
- Payment history (retain for 7 years)
- Anonymize rather than delete

---

## Authentication Middleware

All profile endpoints require authentication. Use NextAuth session:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ... handle request
}
```

---

## Rate Limiting

Apply rate limits to prevent abuse:

| Endpoint | Limit |
|----------|-------|
| GET /profile | 60/min |
| PATCH /profile | 10/min |
| POST /change-password | 5/hour |
| POST /change-email | 3/hour |
| DELETE /profile | 3/day |

---

## Translations

Add to `src/messages/en.json`:
```json
{
  "profile": {
    "updated": "Profile updated successfully",
    "passwordChanged": "Password changed successfully",
    "emailChangeSent": "Verification email sent to new address",
    "emailChanged": "Email updated successfully",
    "accountDeleted": "Your account has been deleted",
    "errors": {
      "incorrectPassword": "Current password is incorrect",
      "emailInUse": "Email is already in use",
      "invalidToken": "Invalid or expired token"
    }
  }
}
```

Add equivalent to `src/messages/ar.json`

---

## Definition of Done

- [ ] GET /api/users/profile implemented
- [ ] PATCH /api/users/profile implemented
- [ ] POST /api/users/change-password implemented
- [ ] POST /api/users/change-email implemented
- [ ] DELETE /api/users/profile implemented
- [ ] Email change verification flow works
- [ ] Account deletion cleans up all data
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Translations added (EN & AR)
- [ ] Rate limiting applied
- [ ] No TypeScript errors
- [ ] ESLint passes

---

## Security Considerations

1. **Authentication:** All endpoints require valid session
2. **Password Verification:** Sensitive actions require password re-entry
3. **Rate Limiting:** Prevent brute force attacks
4. **Token Security:** Hash email change tokens
5. **Session Invalidation:** Invalidate sessions on password change
6. **Audit Logging:** Log sensitive operations

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 1.3 status to ✅ Complete*
