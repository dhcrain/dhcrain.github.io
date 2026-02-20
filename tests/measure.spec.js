const { test } = require('@playwright/test');
const path = require('path');

const ORIGINAL_URL = 'https://dhcrain.com/';
const LOCAL_FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function measureSections(page) {
  return await page.evaluate(() => {
    const rows = document.querySelectorAll('.fl-row');
    const results = [];
    rows.forEach((row, i) => {
      const rect = row.getBoundingClientRect();
      const id = row.id || row.getAttribute('data-node') || `row-${i}`;
      const classes = row.className.substring(0, 80);
      results.push({
        index: i,
        id: id,
        classes: classes,
        top: Math.round(rect.top + window.scrollY),
        height: Math.round(rect.height),
        bottom: Math.round(rect.bottom + window.scrollY),
      });
    });
    return {
      bodyHeight: document.body.scrollHeight,
      rows: results,
    };
  });
}

test('measure section heights', async ({ page }) => {
  // Measure original
  await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const original = await measureSections(page);

  console.log('\n=== ORIGINAL SITE ===');
  console.log(`Body height: ${original.bodyHeight}px`);
  original.rows.forEach(r => {
    console.log(`  Row ${r.index} [${r.id}]: top=${r.top} height=${r.height} bottom=${r.bottom}`);
  });

  // Measure local
  await page.goto(LOCAL_FILE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const local = await measureSections(page);

  console.log('\n=== LOCAL SITE ===');
  console.log(`Body height: ${local.bodyHeight}px`);
  local.rows.forEach(r => {
    console.log(`  Row ${r.index} [${r.id}]: top=${r.top} height=${r.height} bottom=${r.bottom}`);
  });

  // Compare
  console.log('\n=== DIFFERENCES ===');
  const maxRows = Math.max(original.rows.length, local.rows.length);
  for (let i = 0; i < maxRows; i++) {
    const o = original.rows[i];
    const l = local.rows[i];
    if (o && l) {
      const hDiff = l.height - o.height;
      const topDiff = l.top - o.top;
      if (Math.abs(hDiff) > 5 || Math.abs(topDiff) > 5) {
        console.log(`  Row ${i}: height diff=${hDiff}px, top diff=${topDiff}px`);
        console.log(`    Original: ${o.id} h=${o.height}`);
        console.log(`    Local:    ${l.id} h=${l.height}`);
      }
    } else if (o) {
      console.log(`  Row ${i}: EXISTS ONLY IN ORIGINAL (${o.id})`);
    } else if (l) {
      console.log(`  Row ${i}: EXISTS ONLY IN LOCAL (${l.id})`);
    }
  }
  console.log(`\nTotal height diff: ${local.bodyHeight - original.bodyHeight}px`);
});
