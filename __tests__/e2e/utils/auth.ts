/**
 * E2E Authentication Utilities
 */

import { Page } from '@playwright/test';

/**
 * Login as a user with email and password
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/en/auth/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout"]');
  await page.waitForURL('**/');
}

/**
 * Check if user is on login page
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  const url = page.url();
  return url.includes('/auth/login');
}

/**
 * Check if user is authenticated (on dashboard)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return url.includes('/dashboard');
}

/**
 * Wait for authentication redirect
 */
export async function waitForAuthRedirect(page: Page, timeout = 5000) {
  try {
    await page.waitForURL('**/auth/login', { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Setup mock session storage for testing
 * Note: This only works if the app supports session storage auth
 */
export async function mockSession(page: Page, sessionData: Record<string, unknown>) {
  await page.evaluate((data) => {
    sessionStorage.setItem('next-auth.session-token', JSON.stringify(data));
  }, sessionData);
}
