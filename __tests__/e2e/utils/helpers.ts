/**
 * E2E Test Helpers
 */

import { Page, expect } from '@playwright/test';

/**
 * Login a user with email and password
 */
export async function loginUser(
  page: Page,
  email = 'test@example.com',
  password = 'password123'
) {
  await page.goto('/en/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill in credentials
  await page.fill('#email', email);
  await page.fill('#password', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForURL(/\/(en|ar)\/(dashboard|$)/, { timeout: 10000 });
}

/**
 * Login as a team/enterprise user
 */
export async function loginAsTeamUser(page: Page) {
  await loginUser(page, 'team-user@example.com', 'password123');
}

/**
 * Login as a pro user
 */
export async function loginAsProUser(page: Page) {
  await loginUser(page, 'pro-user@example.com', 'password123');
}

/**
 * Register a new user
 */
export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string
) {
  await page.goto('/en/auth/register');
  await page.waitForLoadState('domcontentloaded');

  // Fill in registration form
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);

  // Submit form
  await page.click('button[type="submit"]');
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page) {
  // Click user menu
  const userMenu = page.locator('[data-testid="user-menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();

    // Click logout button
    const logoutButton = page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

/**
 * Clear editor content
 */
export async function clearEditor(page: Page) {
  const editor = page.locator('[data-testid="editor"]');
  await editor.click();

  // Use platform-specific select all
  const isMac = process.platform === 'darwin';
  await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
  await page.keyboard.press('Backspace');
}

/**
 * Type markdown content in the editor
 */
export async function typeInEditor(page: Page, content: string) {
  const editor = page.locator('[data-testid="editor"]');
  await editor.click();
  await page.keyboard.type(content);
}

/**
 * Wait for preview to update with specific text
 */
export async function waitForPreviewContent(page: Page, text: string) {
  const preview = page.locator('[data-testid="preview"]');
  await expect(preview).toContainText(text, { timeout: 10000 });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * Check if element is visible and return boolean (no throw)
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    return await page.locator(selector).isVisible();
  } catch {
    return false;
  }
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, text: RegExp | string) {
  const toast = page.locator('.toast, [role="alert"], [data-sonner-toast]').first();
  await expect(toast).toContainText(text, { timeout: 10000 });
}

/**
 * Navigate to dashboard section
 */
export async function navigateToDashboard(page: Page, section?: string) {
  const path = section ? `/en/dashboard/${section}` : '/en/dashboard';
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test-${timestamp}@example.com`;
}

/**
 * Generate a unique team name for testing
 */
export function generateTeamName(): string {
  const timestamp = Date.now();
  return `Test Team ${timestamp}`;
}
