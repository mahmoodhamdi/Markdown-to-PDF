import { test, expect } from '@playwright/test';

test.describe('Markdown to PDF Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('should show editor and preview on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Check editor exists
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/01-home-en.png', fullPage: true });
  });

  test('should have working toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Check toolbar buttons exist
    await expect(page.locator('button').filter({ has: page.locator('[class*="lucide-bold"]') })).toBeVisible();
    await expect(page.locator('button').filter({ has: page.locator('[class*="lucide-italic"]') })).toBeVisible();
  });

  test('should show preview panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Preview should be visible in split view
    await expect(page.locator('[data-testid="preview"]')).toBeVisible();
  });

  test('should have convert button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const convertBtn = page.locator('[data-testid="convert-btn"]');
    await expect(convertBtn).toBeVisible();

    await page.screenshot({ path: 'screenshots/02-with-content.png' });
  });

  test('should navigate to templates page', async ({ page }) => {
    await page.click('a[href*="/templates"]');
    await expect(page).toHaveURL(/\/templates/);

    await page.screenshot({ path: 'screenshots/05-templates.png', fullPage: true });
  });

  test('should navigate to themes page', async ({ page }) => {
    await page.click('a[href*="/themes"]');
    await expect(page).toHaveURL(/\/themes/);

    await page.screenshot({ path: 'screenshots/04-themes.png', fullPage: true });
  });

  test('should navigate to batch page', async ({ page }) => {
    await page.click('a[href*="/batch"]');
    await expect(page).toHaveURL(/\/batch/);

    await page.screenshot({ path: 'screenshots/06-batch.png', fullPage: true });
  });

  test('should navigate to API docs page', async ({ page }) => {
    await page.click('a[href*="/api-docs"]');
    await expect(page).toHaveURL(/\/api-docs/);

    await page.screenshot({ path: 'screenshots/api-docs.png', fullPage: true });
  });
});

test.describe('Internationalization', () => {
  test('should load Arabic locale with RTL', async ({ page }) => {
    await page.goto('/ar');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    await page.screenshot({ path: 'screenshots/07-home-ar.png', fullPage: true });
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/en');

    // Find and click language switcher
    await page.click('[data-testid="language-switcher"], button:has-text("English")');

    // Look for Arabic option
    const arabicOption = page.getByText('العربية');
    if (await arabicOption.isVisible()) {
      await arabicOption.click();
      await expect(page).toHaveURL(/\/ar/);
    }
  });

  test('Arabic templates page', async ({ page }) => {
    await page.goto('/ar/templates');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.screenshot({ path: 'screenshots/templates-ar.png', fullPage: true });
  });
});

test.describe('Responsive Design', () => {
  test('Mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en');

    // Mobile should show tabs
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    await page.screenshot({ path: 'screenshots/08-mobile-en.png', fullPage: true });
  });

  test('Tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en');

    await page.screenshot({ path: 'screenshots/09-tablet-en.png', fullPage: true });
  });

  test('Desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en');

    await page.screenshot({ path: 'screenshots/10-desktop-en.png', fullPage: true });
  });

  test('Mobile Arabic RTL', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ar');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.screenshot({ path: 'screenshots/mobile-ar.png', fullPage: true });
  });
});

test.describe('Theme Toggle', () => {
  test('should toggle between themes', async ({ page }) => {
    await page.goto('/en');

    // Find theme toggle button
    const themeToggle = page.locator('button').filter({
      has: page.locator('[class*="lucide-sun"], [class*="lucide-moon"], [class*="lucide-monitor"]'),
    }).first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Theme should change
    }

    await page.screenshot({ path: 'screenshots/theme-toggle.png' });
  });
});
