# Stage 6.3: E2E Tests

**Phase:** 6 - Testing & Polish
**Priority:** 🟢 Final
**Estimated Effort:** Medium

---

## Context

E2E tests needed for new dashboard and account features.

---

## Task Requirements

### 1. Dashboard Flow Tests

**File to create:** `__tests__/e2e/dashboard.spec.ts`

Test cases:
- [ ] Navigate to dashboard
- [ ] View usage overview
- [ ] Navigate between sections
- [ ] Responsive layout works
- [ ] Requires authentication

### 2. Settings Flow Tests

**File to create:** `__tests__/e2e/settings.spec.ts`

Test cases:
- [ ] Change theme mode
- [ ] Update editor settings
- [ ] Reset to defaults
- [ ] Settings persist

### 3. Team Management Tests

**File to create:** `__tests__/e2e/teams.spec.ts`

Test cases:
- [ ] Create new team
- [ ] View team members
- [ ] Add team member
- [ ] Change member role
- [ ] Leave team

### 4. Profile Management Tests

**File to create:** `__tests__/e2e/profile.spec.ts`

Test cases:
- [ ] View profile
- [ ] Update name
- [ ] Upload avatar
- [ ] Change password

### 5. Subscription Tests

**File to create:** `__tests__/e2e/subscription.spec.ts`

Test cases:
- [ ] View current plan
- [ ] Navigate to upgrade
- [ ] View billing history

---

## Test Utilities

```typescript
// __tests__/e2e/utils/auth.ts
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/en/auth/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout"]');
}
```

---

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test __tests__/e2e/dashboard.spec.ts
```

---

## Definition of Done

- [ ] Dashboard tests pass
- [ ] Settings tests pass
- [ ] Team tests pass
- [ ] Profile tests pass
- [ ] Subscription tests pass
- [ ] Tests work on CI/CD
- [ ] Visual regression captured

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 6.3 status to ✅ Complete*
