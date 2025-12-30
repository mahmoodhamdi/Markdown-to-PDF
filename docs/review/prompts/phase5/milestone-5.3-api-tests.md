# Milestone 5.3: API Integration Tests

## Status: ⬜ Not Started
## Priority: MEDIUM
## Estimated Scope: Large

---

## Objective

Ensure all API routes have comprehensive integration tests covering success and error cases.

---

## Current Test Structure

- **Location:** `__tests__/integration/api/`
- **Framework:** Vitest
- **Config:** `vitest.integration.config.ts`
- **Timeout:** 30 seconds

---

## API Routes to Test

### Priority 1: Core Features

| Endpoint | Current Tests | Target Coverage |
|----------|--------------|-----------------|
| POST /api/convert | Partial | Full |
| POST /api/convert/batch | Partial | Full |
| POST /api/preview | Partial | Full |
| GET /api/themes | Yes | Maintain |
| GET /api/templates | Yes | Maintain |
| GET /api/health | Yes | Maintain |

### Priority 2: Authentication

| Endpoint | Current Tests | Target Coverage |
|----------|--------------|-----------------|
| POST /api/auth/register | Partial | Full |
| POST /api/auth/forgot-password | Partial | Full |
| POST /api/auth/reset-password | Partial | Full |
| POST /api/auth/verify-email | None | Full |

### Priority 3: User Management

| Endpoint | Current Tests | Target Coverage |
|----------|--------------|-----------------|
| GET/PATCH /api/users/profile | Partial | Full |
| POST /api/users/change-password | Partial | Full |
| POST /api/users/change-email | Partial | Full |
| GET /api/users/sessions | None | Full |

### Priority 4: Storage & Teams

| Endpoint | Current Tests | Target Coverage |
|----------|--------------|-----------------|
| POST /api/storage/upload | Partial | Full |
| GET /api/storage/files | Partial | Full |
| GET /api/teams | Partial | Full |
| POST /api/teams | Partial | Full |

---

## Test Patterns

### Basic API Test

```typescript
// __tests__/integration/api/convert.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('POST /api/convert', () => {
  it('converts markdown to PDF', async () => {
    const response = await fetch('http://localhost:3000/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown: '# Hello World',
        theme: 'github',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
  });

  it('returns 400 for empty markdown', async () => {
    const response = await fetch('http://localhost:3000/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: '' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 429 when rate limited', async () => {
    // Make many requests quickly
    const requests = Array(100).fill(null).map(() =>
      fetch('http://localhost:3000/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: '# Test' }),
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);

    expect(rateLimited).toBe(true);
  });
});
```

### Authenticated API Test

```typescript
// __tests__/integration/api/profile.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('PATCH /api/users/profile', () => {
  let authCookie: string;

  beforeAll(async () => {
    // Login to get session
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123',
      }),
    });

    authCookie = loginResponse.headers.get('set-cookie') || '';
  });

  it('updates profile when authenticated', async () => {
    const response = await fetch('http://localhost:3000/api/users/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ name: 'Updated Name' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe('Updated Name');
  });

  it('returns 401 when not authenticated', async () => {
    const response = await fetch('http://localhost:3000/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });

    expect(response.status).toBe(401);
  });
});
```

### Webhook Test

```typescript
// __tests__/integration/api/webhook-stripe.test.ts
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('POST /api/webhooks/stripe', () => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'test_secret';

  function signPayload(payload: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  it('rejects invalid signature', async () => {
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid',
      },
      body: JSON.stringify({ type: 'test' }),
    });

    expect(response.status).toBe(400);
  });

  it('processes valid webhook', async () => {
    const payload = JSON.stringify({
      id: 'evt_test',
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_test' } },
    });

    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signPayload(payload),
      },
      body: payload,
    });

    expect(response.status).toBe(200);
  });
});
```

---

## Test Database Setup

```typescript
// __tests__/integration/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

---

## Files to Create/Modify

### Create:
1. `__tests__/integration/api/auth-register.test.ts`
2. `__tests__/integration/api/auth-verify-email.test.ts`
3. `__tests__/integration/api/users-sessions.test.ts`
4. `__tests__/integration/api/storage-upload.test.ts`
5. `__tests__/integration/setup.ts`

### Modify:
1. `__tests__/integration/api/convert.test.ts` - Add more cases
2. `__tests__/integration/api/teams.test.ts` - Add more cases
3. `vitest.integration.config.ts` - Add setup file

---

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test
npx vitest run __tests__/integration/api/convert.test.ts --config vitest.integration.config.ts

# Run with coverage
npx vitest run --coverage --config vitest.integration.config.ts
```

---

## Acceptance Criteria

- [ ] All Priority 1 endpoints tested
- [ ] All Priority 2 endpoints tested
- [ ] Each endpoint tests success case
- [ ] Each endpoint tests auth failure
- [ ] Each endpoint tests validation failure
- [ ] Rate limiting tested
- [ ] All tests pass
- [ ] No flaky tests

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 5.3 status to ✅
2. Update progress bar
3. Add to completion log
