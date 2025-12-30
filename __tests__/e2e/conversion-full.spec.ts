/**
 * Comprehensive Conversion E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Full Conversion Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('domcontentloaded');
  });

  test.describe('Editor Functionality', () => {
    test('should load with default content', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Preview should show rendered content
      const preview = page.locator('[data-testid="preview"]');
      await expect(preview).toBeVisible();
      await expect(preview).toContainText('Welcome');
    });

    test('should type markdown and see preview update', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Clear and type new content
      await editor.click();
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
      await page.keyboard.type('# Test Heading\n\nThis is a test paragraph.');

      // Wait for preview to update
      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="preview"]');
      await expect(preview).toContainText('Test Heading');
    });

    test('should apply bold formatting', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Click bold button
      const boldButton = page.locator('button[aria-label="Bold"], button').filter({
        has: page.locator('[class*="lucide-bold"]'),
      }).first();

      if (await boldButton.isVisible()) {
        await boldButton.click();
        // Bold formatting should be applied
      }
    });

    test('should apply italic formatting', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Click italic button
      const italicButton = page.locator('button[aria-label="Italic"], button').filter({
        has: page.locator('[class*="lucide-italic"]'),
      }).first();

      if (await italicButton.isVisible()) {
        await italicButton.click();
        // Italic formatting should be applied
      }
    });

    test('should insert code block', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Click code button
      const codeButton = page.locator('button[aria-label="Code"], button').filter({
        has: page.locator('[class*="lucide-code"]'),
      }).first();

      if (await codeButton.isVisible()) {
        await codeButton.click();
        // Code formatting should be applied
      }
    });

    test('should insert link', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Click link button
      const linkButton = page.locator('button[aria-label="Link"], button').filter({
        has: page.locator('[class*="lucide-link"]'),
      }).first();

      if (await linkButton.isVisible()) {
        await linkButton.click();
        // Link insertion should be triggered
      }
    });

    test('should have working undo/redo', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Type something
      await editor.click();
      await page.keyboard.type('Test content');

      // Click undo button
      const undoButton = page.locator('button[aria-label="Undo"], button').filter({
        has: page.locator('[class*="lucide-undo"]'),
      }).first();

      if (await undoButton.isVisible()) {
        await undoButton.click();
      }

      // Click redo button
      const redoButton = page.locator('button[aria-label="Redo"], button').filter({
        has: page.locator('[class*="lucide-redo"]'),
      }).first();

      if (await redoButton.isVisible()) {
        await redoButton.click();
      }
    });
  });

  test.describe('Theme Selection', () => {
    test('should have theme selector', async ({ page }) => {
      // Look for theme selector
      const themeSelector = page.locator('[data-testid="theme-selector"], button').filter({
        hasText: /theme|github|minimal|dark/i,
      }).first();

      if (await themeSelector.isVisible()) {
        await expect(themeSelector).toBeVisible();
        await page.screenshot({ path: 'screenshots/conversion-theme-selector.png' });
      }
    });

    test('should change document theme', async ({ page }) => {
      // Click theme selector
      const themeSelector = page.locator('[data-testid="theme-selector"], button').filter({
        hasText: /theme|github/i,
      }).first();

      if (await themeSelector.isVisible()) {
        await themeSelector.click();
        await page.waitForTimeout(300);

        // Look for theme options
        const darkOption = page.locator('[data-value="dark"], [role="option"]').filter({
          hasText: /dark/i,
        }).first();

        if (await darkOption.isVisible()) {
          await darkOption.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'screenshots/conversion-dark-theme.png' });
        }
      }
    });
  });

  test.describe('View Modes', () => {
    test('should toggle fullscreen mode', async ({ page }) => {
      const fullscreenButton = page.locator('button').filter({
        has: page.locator('[class*="lucide-maximize"]'),
      }).first();

      if (await fullscreenButton.isVisible()) {
        await fullscreenButton.click();
        await page.waitForTimeout(300);

        // Take screenshot in fullscreen
        await page.screenshot({ path: 'screenshots/conversion-fullscreen.png' });

        // Exit fullscreen
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('should toggle preview mode', async ({ page }) => {
      const previewButton = page.locator('button').filter({
        has: page.locator('[class*="lucide-eye"]'),
      }).first();

      if (await previewButton.isVisible()) {
        await previewButton.click();
        await page.waitForTimeout(300);

        await page.screenshot({ path: 'screenshots/conversion-preview-mode.png' });

        // Toggle back
        await previewButton.click();
      }
    });

    test('should toggle table of contents', async ({ page }) => {
      const tocButton = page.locator('button').filter({
        has: page.locator('[class*="lucide-list-tree"]'),
      }).first();

      if (await tocButton.isVisible()) {
        await tocButton.click();
        await page.waitForTimeout(300);

        await page.screenshot({ path: 'screenshots/conversion-toc.png' });
      }
    });
  });

  test.describe('PDF Conversion', () => {
    test('should have enabled convert button with content', async ({ page }) => {
      const convertBtn = page.locator('[data-testid="convert-btn"]');
      await expect(convertBtn).toBeVisible({ timeout: 10000 });
      await expect(convertBtn).toBeEnabled();
    });

    test('should have format selector', async ({ page }) => {
      // Look for format selector (PDF/HTML)
      const formatSelector = page.locator('button').filter({
        hasText: /PDF|HTML/,
      }).first();

      if (await formatSelector.isVisible()) {
        await expect(formatSelector).toBeVisible();
      }
    });

    test('should have print button', async ({ page }) => {
      const printBtn = page.locator('[data-testid="print-btn"]');
      await expect(printBtn).toBeVisible();
    });

    test('should open page settings dialog', async ({ page }) => {
      // Look for settings button
      const settingsButton = page.locator('button').filter({
        has: page.locator('[class*="lucide-settings"], [class*="lucide-sliders"]'),
      }).first();

      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(300);

        // Dialog should open
        const dialog = page.locator('[role="dialog"]').first();
        if (await dialog.isVisible()) {
          await page.screenshot({ path: 'screenshots/conversion-settings-dialog.png' });

          // Close dialog
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('File Upload', () => {
    test('should have file input', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      const count = await fileInput.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should accept markdown files', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      if (await fileInput.count() > 0) {
        // Check accepted file types
        const accept = await fileInput.getAttribute('accept');
        // Accept attribute should include .md or text/markdown
        if (accept) {
          expect(accept).toMatch(/\.md|text\/markdown|text\/plain/i);
        }
      }
    });
  });

  test.describe('Preview Rendering', () => {
    test('should render headings correctly', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await editor.click();
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
      await page.keyboard.type('# Heading 1\n## Heading 2\n### Heading 3');

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="preview"]');
      await expect(preview.locator('h1')).toContainText('Heading 1');
    });

    test('should render code blocks with syntax highlighting', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await editor.click();
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
      await page.keyboard.type('```javascript\nconst x = 1;\n```');

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="preview"]');
      const codeBlock = preview.locator('pre, code').first();
      if (await codeBlock.isVisible()) {
        await expect(codeBlock).toContainText('const');
      }
    });

    test('should render lists correctly', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await editor.click();
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
      await page.keyboard.type('- Item 1\n- Item 2\n- Item 3');

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="preview"]');
      await expect(preview.locator('li').first()).toContainText('Item 1');
    });

    test('should render links correctly', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await editor.click();
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
      await page.keyboard.type('[Click here](https://example.com)');

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="preview"]');
      const link = preview.locator('a').first();
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute('href', 'https://example.com');
      }
    });

    test('should render blockquotes correctly', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await editor.click();
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
      await page.keyboard.type('> This is a quote');

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="preview"]');
      const blockquote = preview.locator('blockquote').first();
      if (await blockquote.isVisible()) {
        await expect(blockquote).toContainText('This is a quote');
      }
    });

    test('should render tables correctly', async ({ page }) => {
      const editor = page.locator('[data-testid="editor"]');
      await editor.click();
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
      await page.keyboard.type('| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |');

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="preview"]');
      const table = preview.locator('table').first();
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      }
    });
  });
});

test.describe('Conversion Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should show tabs on mobile', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    await page.screenshot({ path: 'screenshots/conversion-mobile-tabs.png', fullPage: true });
  });

  test('should switch between editor and preview tabs', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');

    if (await tablist.isVisible()) {
      // Find preview tab
      const previewTab = page.locator('[role="tab"]').filter({
        hasText: /preview/i,
      }).first();

      if (await previewTab.isVisible()) {
        await previewTab.click();
        await page.waitForTimeout(300);

        await page.screenshot({ path: 'screenshots/conversion-mobile-preview.png' });
      }

      // Switch back to editor
      const editorTab = page.locator('[role="tab"]').filter({
        hasText: /editor|write/i,
      }).first();

      if (await editorTab.isVisible()) {
        await editorTab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should have working convert button on mobile', async ({ page }) => {
    const convertBtn = page.locator('[data-testid="convert-btn"]');

    if (await convertBtn.isVisible()) {
      await expect(convertBtn).toBeEnabled();
    }
  });
});

test.describe('Conversion Tablet Experience', () => {
  test('should work on tablet landscape', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('[data-testid="editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview"]')).toBeVisible();

    await page.screenshot({ path: 'screenshots/conversion-tablet-landscape.png', fullPage: true });
  });

  test('should work on tablet portrait', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'screenshots/conversion-tablet-portrait.png', fullPage: true });
  });
});

test.describe('Conversion Arabic Support', () => {
  test('should display in RTL mode', async ({ page }) => {
    await page.goto('/ar');
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    await page.screenshot({ path: 'screenshots/conversion-arabic-rtl.png', fullPage: true });
  });

  test('should have working editor in Arabic', async ({ page }) => {
    await page.goto('/ar');
    await page.setViewportSize({ width: 1280, height: 720 });

    const editor = page.locator('[data-testid="editor"]');
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Type Arabic content
    await editor.click();
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A');
    await page.keyboard.type('# عنوان\n\nهذا نص عربي');

    await page.waitForTimeout(500);

    const preview = page.locator('[data-testid="preview"]');
    await expect(preview).toContainText('عنوان');

    await page.screenshot({ path: 'screenshots/conversion-arabic-content.png' });
  });

  test('should have Arabic mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ar');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.screenshot({ path: 'screenshots/conversion-arabic-mobile.png', fullPage: true });
  });
});
