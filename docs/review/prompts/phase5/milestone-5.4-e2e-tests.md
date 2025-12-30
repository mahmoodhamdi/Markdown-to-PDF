# Milestone 5.4: E2E Test Coverage

## Status: ⬜ Not Started
## Priority: LOW
## Estimated Scope: Large

---

## Objective

Expand E2E test coverage for critical user flows.

---

## Current Test Structure

- **Location:** `__tests__/e2e/`
- **Framework:** Playwright
- **Config:** `playwright.config.ts`

---

## Critical Flows to Test

### 1. Authentication Flow

```typescript
// __tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpass123');
    await page.fill('[name="confirmPassword"]', 'testpass123');

    await page.click('button[type="submit"]');

    // Should redirect to verification page or dashboard
    await expect(page).toHaveURL(/\/(dashboard|auth\/verify)/);
  });

  test('user can login', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'password123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('user can logout', async ({ page }) => {
    // Login first
    await loginUser(page);

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/');
  });
});
```

### 2. Conversion Flow

```typescript
// __tests__/e2e/conversion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Conversion', () => {
  test('can convert markdown to PDF', async ({ page }) => {
    await page.goto('/');

    // Type markdown
    const editor = page.locator('[data-testid="editor"]');
    await editor.fill('# Hello World\n\nThis is a test.');

    // Wait for preview
    await expect(page.locator('[data-testid="preview"]')).toContainText('Hello World');

    // Click convert
    await page.click('[data-testid="convert-btn"]');

    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-pdf"]'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('can change theme', async ({ page }) => {
    await page.goto('/');

    // Open theme selector
    await page.click('[data-testid="theme-selector"]');

    // Select dark theme
    await page.click('[data-value="dark"]');

    // Verify preview updated
    await expect(page.locator('[data-testid="preview"]')).toHaveClass(/dark/);
  });

  test('can upload markdown file', async ({ page }) => {
    await page.goto('/');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Uploaded File'),
    });

    // Verify content loaded
    await expect(page.locator('[data-testid="editor"]')).toContainText('# Uploaded File');
  });
});
```

### 3. Dashboard Flow

```typescript
// __tests__/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('shows usage stats', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('[data-testid="conversions-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-calls-count"]')).toBeVisible();
  });

  test('can navigate to usage page', async ({ page }) => {
    await page.goto('/dashboard');

    await page.click('a[href*="/dashboard/usage"]');

    await expect(page).toHaveURL(/\/dashboard\/usage/);
    await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
  });

  test('can change password', async ({ page }) => {
    await page.goto('/dashboard/security');

    await page.fill('[name="currentPassword"]', 'oldpass123');
    await page.fill('[name="newPassword"]', 'newpass123');
    await page.fill('[name="confirmPassword"]', 'newpass123');

    await page.click('button[type="submit"]');

    await expect(page.locator('.toast')).toContainText(/password changed/i);
  });
});
```

### 4. Subscription Flow

```typescript
// __tests__/e2e/subscription.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Subscription', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('can view current plan', async ({ page }) => {
    await page.goto('/dashboard/subscription');

    await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
  });

  test('can view plan comparison', async ({ page }) => {
    await page.goto('/dashboard/subscription');

    await expect(page.locator('[data-testid="plan-comparison"]')).toBeVisible();
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
  });
});
```

### 5. Team Flow

```typescript
// __tests__/e2e/teams.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Teams', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeamUser(page);
  });

  test('can create team', async ({ page }) => {
    await page.goto('/dashboard/teams');

    await page.click('[data-testid="create-team-btn"]');
    await page.fill('[name="teamName"]', 'My Team');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="team-card"]')).toContainText('My Team');
  });

  test('can invite member', async ({ page }) => {
    await page.goto('/dashboard/teams/team-id');

    await page.click('[data-testid="add-member-btn"]');
    await page.fill('[name="email"]', 'newmember@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('.toast')).toContainText(/invitation sent/i);
  });
});
```

---

## Helper Functions

```typescript
// __tests__/e2e/utils/auth.ts
import { Page } from '@playwright/test';

export async function loginUser(page: Page, email = 'test@example.com', password = 'password123') {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginAsTeamUser(page: Page) {
  await loginUser(page, 'team-user@example.com', 'password123');
}

export async function loginAsProUser(page: Page) {
  await loginUser(page, 'pro-user@example.com', 'password123');
}
```

---

## Playwright Config Updates

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
```

---

## Files to Create/Modify

### Create:
1. `__tests__/e2e/auth.spec.ts`
2. `__tests__/e2e/conversion-full.spec.ts`
3. `__tests__/e2e/utils/helpers.ts`

### Modify:
1. `__tests__/e2e/dashboard.spec.ts` - Expand coverage
2. `__tests__/e2e/teams.spec.ts` - Expand coverage
3. `playwright.config.ts` - Add projects

---

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npx playwright test auth.spec.ts

# Run with UI
npm run test:e2e:ui

# Run headed (visible browser)
npx playwright test --headed

# Generate report
npx playwright show-report
```

---

## Acceptance Criteria

- [ ] Auth flow fully tested
- [ ] Conversion flow tested
- [ ] Dashboard navigation tested
- [ ] Subscription flow tested
- [ ] Team management tested
- [ ] Tests run on 3 browsers
- [ ] All tests pass in CI
- [ ] No flaky tests

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 5.4 status to ✅
2. Update progress bar
3. Add to completion log
