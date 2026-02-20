const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ORIGINAL_URL = 'https://dhcrain.com/';
const LOCAL_FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper to scroll down the full page to trigger lazy loading and animations
async function scrollFullPage(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
  // Wait for animations to settle
  await page.waitForTimeout(2000);
}

// Take full-page screenshots of sections by scrolling to specific Y offsets
async function takeSegmentScreenshots(page, name, segments) {
  const shots = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    await page.evaluate((y) => window.scrollTo(0, y), seg.y);
    await page.waitForTimeout(500);
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}-section-${i}-${seg.label}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    shots.push(screenshotPath);
  }
  return shots;
}

test.describe('Visual comparison - dhcrain.com vs static site', () => {

  test('full page screenshot comparison', async ({ page }) => {
    // Screenshot the original site
    await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
    await scrollFullPage(page);
    await page.waitForTimeout(1000);
    const originalShot = path.join(SCREENSHOTS_DIR, 'original-full.png');
    await page.screenshot({ path: originalShot, fullPage: true });

    // Screenshot the local static site
    await page.goto(LOCAL_FILE, { waitUntil: 'networkidle' });
    await scrollFullPage(page);
    await page.waitForTimeout(1000);
    const localShot = path.join(SCREENSHOTS_DIR, 'local-full.png');
    await page.screenshot({ path: localShot, fullPage: true });

    console.log(`\nScreenshots saved to ${SCREENSHOTS_DIR}`);
    console.log(`  Original: ${originalShot}`);
    console.log(`  Local:    ${localShot}`);
  });

  test('section-by-section comparison', async ({ page }) => {
    const viewportHeight = 720;

    // First, get the full height of the original page
    await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
    await scrollFullPage(page);
    const originalHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`Original page height: ${originalHeight}px`);

    // Build segment list
    const segments = [];
    const sectionNames = ['hero', 'icons', 'whatido', 'portfolio1', 'portfolio2', 'portfolio3', 'gallery', 'resume1', 'resume2', 'contact', 'footer'];
    let y = 0;
    let idx = 0;
    while (y < originalHeight) {
      const label = idx < sectionNames.length ? sectionNames[idx] : `extra${idx}`;
      segments.push({ y, label });
      y += viewportHeight;
      idx++;
    }

    // Take original screenshots
    const originalShots = await takeSegmentScreenshots(page, 'original', segments);

    // Now screenshot the local site
    await page.goto(LOCAL_FILE, { waitUntil: 'networkidle' });
    await scrollFullPage(page);
    const localHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`Local page height: ${localHeight}px`);

    const localShots = await takeSegmentScreenshots(page, 'local', segments);

    // Log all screenshot paths for manual comparison
    console.log('\n--- Section Screenshots ---');
    for (let i = 0; i < segments.length; i++) {
      console.log(`Section ${i} (${segments[i].label}):`);
      console.log(`  Original: ${originalShots[i]}`);
      console.log(`  Local:    ${localShots[i]}`);
    }

    // Compare heights
    const heightDiff = Math.abs(originalHeight - localHeight);
    console.log(`\nHeight difference: ${heightDiff}px (original: ${originalHeight}, local: ${localHeight})`);
    if (heightDiff > 100) {
      console.log('WARNING: Significant height difference detected!');
    }
  });

  test('pixel diff comparison', async ({ page }) => {
    // Take original full page screenshot
    await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
    await scrollFullPage(page);
    await page.waitForTimeout(1000);
    const originalBuffer = await page.screenshot({ fullPage: true });

    // Take local full page screenshot
    await page.goto(LOCAL_FILE, { waitUntil: 'networkidle' });
    await scrollFullPage(page);
    await page.waitForTimeout(1000);
    const localBuffer = await page.screenshot({ fullPage: true });

    // Save both for manual inspection
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'diff-original.png'), originalBuffer);
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'diff-local.png'), localBuffer);

    // Compare sizes
    console.log(`Original screenshot: ${originalBuffer.length} bytes`);
    console.log(`Local screenshot: ${localBuffer.length} bytes`);

    // Basic comparison - are they very different in size?
    const sizeDiffPct = Math.abs(originalBuffer.length - localBuffer.length) / originalBuffer.length * 100;
    console.log(`Size difference: ${sizeDiffPct.toFixed(1)}%`);
  });
});
