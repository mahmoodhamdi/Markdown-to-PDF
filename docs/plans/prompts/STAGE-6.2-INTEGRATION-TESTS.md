# Stage 6.2: Integration Tests

**Phase:** 6 - Testing & Polish
**Priority:** 🟢 Final
**Estimated Effort:** Large

---

## Context

Integration tests are missing for critical flows. Need end-to-end API testing.

---

## Task Requirements

### 1. Payment Webhook Tests

**File to create:** `__tests__/integration/webhooks/stripe.test.ts`

Test cases:
- [ ] Handles checkout.session.completed
- [ ] Handles customer.subscription.updated
- [ ] Handles customer.subscription.deleted
- [ ] Handles invoice.payment_failed
- [ ] Rejects invalid signatures
- [ ] Handles duplicate events (idempotent)

**File to create:** `__tests__/integration/webhooks/paymob.test.ts`

Similar tests for Paymob webhook.

**File to create:** `__tests__/integration/webhooks/paytabs.test.ts`

Similar tests for PayTabs webhook.

**File to create:** `__tests__/integration/webhooks/paddle.test.ts`

Similar tests for Paddle webhook.

### 2. SSO Login Flow Tests

**File to create:** `__tests__/integration/sso/login-flow.test.ts`

Test cases:
- [ ] Redirects to SSO provider
- [ ] Handles callback correctly
- [ ] Creates user on first login (JIT)
- [ ] Links existing user
- [ ] Handles SSO errors

### 3. Storage Flow Tests

**File to create:** `__tests__/integration/storage/upload-flow.test.ts`

Test cases:
- [ ] Upload file succeeds
- [ ] Rejects over quota
- [ ] Rejects invalid mime type
- [ ] Download returns file
- [ ] Delete removes file
- [ ] List returns user files only

### 4. Team Operations Tests

**File to create:** `__tests__/integration/teams/operations.test.ts`

Test cases:
- [ ] Create team succeeds
- [ ] Add member succeeds
- [ ] Remove member succeeds
- [ ] Role change works
- [ ] Permissions enforced
- [ ] Invitation flow works

### 5. User Profile Tests

**File to create:** `__tests__/integration/users/profile.test.ts`

Test cases:
- [ ] Get profile returns data
- [ ] Update profile works
- [ ] Password change works
- [ ] Email change sends verification
- [ ] Account deletion cleans up

---

## Test Setup

```typescript
// __tests__/integration/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

---

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npx vitest run --config vitest.integration.config.ts __tests__/integration/webhooks/stripe.test.ts
```

---

## Definition of Done

- [ ] Stripe webhook tests pass
- [ ] Paymob webhook tests pass
- [ ] PayTabs webhook tests pass
- [ ] Paddle webhook tests pass
- [ ] SSO flow tests pass
- [ ] Storage flow tests pass
- [ ] Team operation tests pass
- [ ] User profile tests pass
- [ ] All tests isolated (no side effects)
- [ ] CI/CD pipeline updated

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 6.2 status to ✅ Complete*
