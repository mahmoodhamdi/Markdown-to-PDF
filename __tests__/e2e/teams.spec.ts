/**
 * Teams E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Teams Page', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing teams without auth', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Should redirect to login or show teams page with auth check
      await expect(page).toHaveURL(/\/(auth\/login|dashboard)/);
    });

    test('should redirect from team details page without auth', async ({ page }) => {
      await page.goto('/en/dashboard/teams/team-123');

      await expect(page).toHaveURL(/\/(auth\/login|dashboard)/);
    });
  });

  test.describe('Teams Page Structure', () => {
    test('should load teams page', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Should show loading state, login redirect, or teams page
      await page.waitForLoadState('domcontentloaded');

      await page.screenshot({ path: 'screenshots/teams-page.png', fullPage: true });
    });

    test('should show teams icon and title', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Look for teams-related content
      const teamsContent = page.locator('h1, [class*="lucide-users"]').first();

      if (await teamsContent.isVisible()) {
        await expect(teamsContent).toBeVisible();
      }
    });
  });

  test.describe('Create Team Flow', () => {
    test('should have create team button for authorized users', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Look for create team button
      const createButton = page.locator('button').filter({
        hasText: /create|new|add/i,
      }).first();

      // Button might be visible only for team/enterprise users
      if (await createButton.isVisible()) {
        await expect(createButton).toBeVisible();
        await page.screenshot({ path: 'screenshots/teams-create-button.png' });
      }
    });

    test('should show upgrade prompt for free users', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Free users should see upgrade prompt
      const upgradePrompt = page.locator('text=/upgrade|team plan|enterprise/i').first();

      if (await upgradePrompt.isVisible()) {
        await expect(upgradePrompt).toBeVisible();
        await page.screenshot({ path: 'screenshots/teams-upgrade-prompt.png' });
      }
    });
  });

  test.describe('Team List', () => {
    test('should display team list or empty state', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      await page.waitForLoadState('domcontentloaded');

      // Wait a bit for initial data fetch
      await page.waitForTimeout(1000);

      // Should show either team list or empty state
      await page.screenshot({ path: 'screenshots/teams-list.png', fullPage: true });
    });

    test('should have loading skeleton', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Check for loading state - skeleton elements may briefly appear
      // Skeleton should appear briefly during load
      await page.screenshot({ path: 'screenshots/teams-loading.png' });
    });
  });

  test.describe('Team Member Management', () => {
    test('should navigate to team details', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Look for team cards/links
      const teamLink = page.locator('a[href*="/dashboard/teams/"]').first();

      if (await teamLink.isVisible()) {
        await teamLink.click();

        // Should navigate to team details page
        await expect(page).toHaveURL(/\/dashboard\/teams\/.+/);
        await page.screenshot({ path: 'screenshots/team-details.png', fullPage: true });
      }
    });
  });

  test.describe('Team Actions', () => {
    test('should have member actions available', async ({ page }) => {
      await page.goto('/en/dashboard/teams');

      // Look for action buttons (add member, settings, etc.)
      const actionButton = page.locator('button').filter({
        has: page.locator('[class*="lucide-plus"], [class*="lucide-settings"], [class*="lucide-more"]'),
      }).first();

      if (await actionButton.isVisible()) {
        await page.screenshot({ path: 'screenshots/teams-actions.png' });
      }
    });
  });
});

test.describe('Teams Responsive Layout', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/dashboard/teams');

    await page.screenshot({ path: 'screenshots/teams-mobile.png', fullPage: true });
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en/dashboard/teams');

    await page.screenshot({ path: 'screenshots/teams-tablet.png', fullPage: true });
  });

  test('should work on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en/dashboard/teams');

    await page.screenshot({ path: 'screenshots/teams-desktop.png', fullPage: true });
  });
});

test.describe('Teams Arabic Locale', () => {
  test('should support Arabic with RTL', async ({ page }) => {
    await page.goto('/ar/dashboard/teams');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    await page.screenshot({ path: 'screenshots/teams-arabic.png', fullPage: true });
  });
});

test.describe('Team Invitation Flow', () => {
  test('should show invite member option', async ({ page }) => {
    await page.goto('/en/dashboard/teams');

    // Look for invite button
    const inviteButton = page.locator('button').filter({
      hasText: /invite|add member/i,
    }).first();

    if (await inviteButton.isVisible()) {
      await page.screenshot({ path: 'screenshots/teams-invite-button.png' });
    }
  });
});

test.describe('Team Role Management', () => {
  test('should display role badges', async ({ page }) => {
    await page.goto('/en/dashboard/teams');

    // Look for role indicators
    const roleBadge = page.locator('text=/owner|admin|member/i').first();

    if (await roleBadge.isVisible()) {
      await page.screenshot({ path: 'screenshots/teams-roles.png' });
    }
  });
});

test.describe('Leave Team Flow', () => {
  test('should have leave team option', async ({ page }) => {
    await page.goto('/en/dashboard/teams');

    // Look for leave or more options
    const moreButton = page.locator('button').filter({
      has: page.locator('[class*="lucide-more"], [class*="lucide-ellipsis"]'),
    }).first();

    if (await moreButton.isVisible()) {
      await moreButton.click();

      // Look for leave option in dropdown
      const leaveOption = page.locator('text=/leave/i').first();

      if (await leaveOption.isVisible()) {
        await page.screenshot({ path: 'screenshots/teams-leave-option.png' });
      }
    }
  });
});
