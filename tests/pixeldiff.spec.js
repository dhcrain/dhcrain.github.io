const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { PNG } = require('pngjs');

const ORIGINAL_URL = 'https://dhcrain.com/';
const LOCAL_FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'screenshots');

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
  await page.waitForTimeout(2000);
}

test('pixel-perfect comparison with diff image', async ({ page }) => {
  // Take original screenshot - scroll twice to trigger lazy loading
  await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
  await scrollFullPage(page);
  await page.waitForTimeout(2000);
  await scrollFullPage(page);
  await page.waitForTimeout(2000);
  const origBuffer = await page.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'pixeldiff-original.png'), origBuffer);

  // Take local screenshot
  await page.goto(LOCAL_FILE, { waitUntil: 'networkidle' });
  await scrollFullPage(page);
  await page.waitForTimeout(1000);
  const localBuffer = await page.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'pixeldiff-local.png'), localBuffer);

  // Parse both PNGs
  const origPng = PNG.sync.read(origBuffer);
  const localPng = PNG.sync.read(localBuffer);

  console.log(`\nOriginal: ${origPng.width}x${origPng.height}`);
  console.log(`Local:    ${localPng.width}x${localPng.height}`);

  // Use the smaller dimensions for comparison
  const width = Math.min(origPng.width, localPng.width);
  const height = Math.min(origPng.height, localPng.height);

  // Create diff image
  const diff = new PNG({ width, height });

  // Crop images to matching size if needed
  const cropImage = (src, w, h) => {
    if (src.width === w && src.height === h) return src.data;
    const cropped = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      src.data.copy(cropped, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
    }
    return cropped;
  };

  const origData = cropImage(origPng, width, height);
  const localData = cropImage(localPng, width, height);

  const pixelmatch = (await import('pixelmatch')).default;
  const numDiffPixels = pixelmatch(origData, localData, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false,
  });

  const totalPixels = width * height;
  const diffPercent = (numDiffPixels / totalPixels * 100).toFixed(2);

  console.log(`\nDiff pixels: ${numDiffPixels} / ${totalPixels} (${diffPercent}%)`);

  // Save diff image
  const diffPath = path.join(SCREENSHOTS_DIR, 'pixeldiff-diff.png');
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  console.log(`Diff image saved to: ${diffPath}`);

  // Analyze which sections have the most differences
  const sectionHeight = Math.floor(height / 9);
  console.log('\nPer-section diff analysis:');
  const sectionNames = ['hero', 'separator1', 'whatido', 'fat-hen', 'cl-clone', 'url-short', 'gallery', 'separator2+resume', 'contact'];
  for (let s = 0; s < 9; s++) {
    const yStart = s * sectionHeight;
    const yEnd = Math.min((s + 1) * sectionHeight, height);
    let sectionDiff = 0;
    for (let y = yStart; y < yEnd; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Red channel in diff image indicates difference
        if (diff.data[idx] > 0) sectionDiff++;
      }
    }
    const sectionPixels = (yEnd - yStart) * width;
    const sectionPct = (sectionDiff / sectionPixels * 100).toFixed(1);
    console.log(`  ${sectionNames[s]}: ${sectionPct}% different (${sectionDiff} pixels)`);
  }
});
