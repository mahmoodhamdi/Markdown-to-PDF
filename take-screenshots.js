const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots');

  try {
    // Main editor page - English
    console.log('Taking screenshot of main editor (English)...');
    await page.goto('http://localhost:3002/en', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'editor-en.png'), fullPage: false });

    // Main editor page - Arabic (RTL)
    console.log('Taking screenshot of main editor (Arabic RTL)...');
    await page.goto('http://localhost:3002/ar', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'editor-ar.png'), fullPage: false });

    // Themes page
    console.log('Taking screenshot of themes page...');
    await page.goto('http://localhost:3002/en/themes', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'themes.png'), fullPage: false });

    // Templates page
    console.log('Taking screenshot of templates page...');
    await page.goto('http://localhost:3002/en/templates', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'templates.png'), fullPage: false });

    // Batch page
    console.log('Taking screenshot of batch conversion page...');
    await page.goto('http://localhost:3002/en/batch', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'batch.png'), fullPage: false });

    // API docs page
    console.log('Taking screenshot of API docs page...');
    await page.goto('http://localhost:3002/en/api-docs', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'api-docs.png'), fullPage: false });

    // Mobile view
    console.log('Taking screenshot of mobile view...');
    await context.close();
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:3002/en', { waitUntil: 'networkidle', timeout: 60000 });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile.png'), fullPage: false });

    console.log('All screenshots taken successfully!');
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
