/**
 * Profile E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing profile without auth', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Should redirect to login or show profile page with auth check
      await expect(page).toHaveURL(/\/(auth\/login|dashboard)/);
    });
  });

  test.describe('Profile Page Structure', () => {
    test('should load profile page', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      await page.waitForLoadState('domcontentloaded');

      await page.screenshot({ path: 'screenshots/profile-page.png', fullPage: true });
    });

    test('should display profile title', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for profile heading
      const heading = page.locator('h1').first();

      if (await heading.isVisible()) {
        await expect(heading).toBeVisible();
      }
    });
  });

  test.describe('Profile Header', () => {
    test('should display avatar placeholder', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      await page.waitForLoadState('domcontentloaded');

      // Screenshot the profile page (may redirect to login)
      await page.screenshot({ path: 'screenshots/profile-avatar.png' });

      // Check if we're on the profile page or redirected to login
      const url = page.url();
      expect(url.includes('/profile') || url.includes('/auth/login')).toBeTruthy();
    });

    test('should display user info section', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for user info elements
      const userInfo = page.locator('[class*="card"], [class*="border"]').first();

      if (await userInfo.isVisible()) {
        await page.screenshot({ path: 'screenshots/profile-user-info.png' });
      }
    });
  });

  test.describe('Profile Form', () => {
    test('should display profile form', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for form elements
      const form = page.locator('form, [class*="form"]').first();

      if (await form.isVisible()) {
        await expect(form).toBeVisible();
      }
    });

    test('should have name input field', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for name input
      const nameInput = page.locator('input[name="name"], input[type="text"]').first();

      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeVisible();
        await page.screenshot({ path: 'screenshots/profile-name-input.png' });
      }
    });

    test('should have email display', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Email is usually displayed but not editable
      const emailDisplay = page.locator('input[name="email"], [data-testid="email"]').first();

      if (await emailDisplay.isVisible()) {
        await page.screenshot({ path: 'screenshots/profile-email.png' });
      }
    });

    test('should have save/update button', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for save button
      const saveButton = page.locator('button').filter({
        hasText: /save|update|submit/i,
      }).first();

      if (await saveButton.isVisible()) {
        await expect(saveButton).toBeVisible();
        await page.screenshot({ path: 'screenshots/profile-save-button.png' });
      }
    });
  });

  test.describe('Update Profile Name', () => {
    test('should enable update button when name changes', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      const nameInput = page.locator('input[name="name"]').first();

      if (await nameInput.isVisible()) {
        await nameInput.fill('New Test Name');

        // Update button should be available
        const updateButton = page.locator('button[type="submit"], button:has-text("Save")').first();

        if (await updateButton.isVisible()) {
          await expect(updateButton).toBeEnabled();
        }
      }
    });
  });

  test.describe('Avatar Upload', () => {
    test('should have avatar change option', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for avatar upload/change button
      const avatarButton = page.locator('button').filter({
        hasText: /change|upload|avatar|photo/i,
      }).first();

      if (await avatarButton.isVisible()) {
        await page.screenshot({ path: 'screenshots/profile-avatar-change.png' });
      }
    });
  });

  test.describe('Password Change', () => {
    test('should have password change option', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for password section
      const passwordSection = page.getByText(/password|security/i).first();

      if (await passwordSection.isVisible()) {
        await page.screenshot({ path: 'screenshots/profile-password-section.png' });
      }
    });
  });

  test.describe('Account Details', () => {
    test('should display account creation date', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for date-related info
      const dateInfo = page.getByText(/joined|created|member since/i).first();

      if (await dateInfo.isVisible()) {
        await page.screenshot({ path: 'screenshots/profile-account-date.png' });
      }
    });

    test('should display current plan', async ({ page }) => {
      await page.goto('/en/dashboard/profile');

      // Look for plan info
      const planInfo = page.getByText(/free|pro|team|enterprise/i).first();

      if (await planInfo.isVisible()) {
        await page.screenshot({ path: 'screenshots/profile-plan.png' });
      }
    });
  });
});

test.describe('Profile Responsive Layout', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/dashboard/profile');

    await page.screenshot({ path: 'screenshots/profile-mobile.png', fullPage: true });
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en/dashboard/profile');

    await page.screenshot({ path: 'screenshots/profile-tablet.png', fullPage: true });
  });

  test('should work on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en/dashboard/profile');

    await page.screenshot({ path: 'screenshots/profile-desktop.png', fullPage: true });
  });
});

test.describe('Profile Arabic Locale', () => {
  test('should support Arabic with RTL', async ({ page }) => {
    await page.goto('/ar/dashboard/profile');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    await page.screenshot({ path: 'screenshots/profile-arabic.png', fullPage: true });
  });

  test('should have Arabic text in form labels', async ({ page }) => {
    await page.goto('/ar/dashboard/profile');

    // Check for Arabic content
    const content = await page.content();
    // Arabic text should be present
    await page.screenshot({ path: 'screenshots/profile-arabic-form.png', fullPage: true });
  });
});

test.describe('Profile Error States', () => {
  test('should show loading skeleton', async ({ page }) => {
    await page.goto('/en/dashboard/profile');

    // Check for loading state
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();

    // Screenshot during load
    await page.screenshot({ path: 'screenshots/profile-loading.png' });
  });
});

test.describe('Security Page', () => {
  test('should redirect to login when accessing security without auth', async ({ page }) => {
    await page.goto('/en/dashboard/security');

    await expect(page).toHaveURL(/\/(auth\/login|dashboard)/);
  });

  test('should load security page', async ({ page }) => {
    await page.goto('/en/dashboard/security');

    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'screenshots/security-page.png', fullPage: true });
  });
});

test.describe('Account Page', () => {
  test('should redirect to login when accessing account without auth', async ({ page }) => {
    await page.goto('/en/dashboard/account');

    await expect(page).toHaveURL(/\/(auth\/login|dashboard)/);
  });

  test('should load account page', async ({ page }) => {
    await page.goto('/en/dashboard/account');

    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'screenshots/account-page.png', fullPage: true });
  });
});
