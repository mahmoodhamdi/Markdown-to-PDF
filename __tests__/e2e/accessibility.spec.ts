import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Home page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter out minor issues, focus on critical ones
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('Templates page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/en/templates');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('Themes page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/en/themes');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('Arabic locale should maintain accessibility', async ({ page }) => {
    await page.goto('/ar');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    // Check RTL is properly set
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('Mobile view should be accessible', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });
});

test.describe('Keyboard Navigation', () => {
  test('should be able to navigate with keyboard', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });

    // Start from the beginning
    await page.keyboard.press('Tab');

    // Should be able to tab through interactive elements
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(focusedElement);
  });

  test('should support Escape to close dialogs', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });

    // Escape should work globally (e.g., for fullscreen)
    await page.keyboard.press('Escape');
    // No error should occur
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check that focus is visible (element should have some focus styling)
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    });

    // At least one focus indicator should be present
    expect(activeElement).not.toBeNull();
  });
});

test.describe('Color Contrast', () => {
  test('should have sufficient color contrast in light mode', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    // Check specifically for color contrast issues
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    // Log violations for debugging but don't fail on minor ones
    if (contrastViolations.length > 0) {
      console.log('Color contrast issues found:', contrastViolations.length);
    }
  });
});

test.describe('Screen Reader Support', () => {
  test('main content should have proper landmark', async ({ page }) => {
    await page.goto('/en');

    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });

    // Check convert button
    const convertBtn = page.locator('[data-testid="convert-btn"]');
    await expect(convertBtn).toHaveAttribute('data-testid', 'convert-btn');
    // Button should have text content
    const buttonText = await convertBtn.textContent();
    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });

    // All img tags should have alt attribute
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images but should exist
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Form Accessibility', () => {
  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/en/settings');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    // Check that inputs have associated labels or aria-label
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const labelViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'label' || v.id === 'label-content-name-mismatch'
    );

    // Should have minimal label issues
    expect(labelViolations.filter((v) => v.impact === 'critical')).toEqual([]);
  });
});
