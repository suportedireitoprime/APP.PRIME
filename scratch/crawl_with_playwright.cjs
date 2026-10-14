const { chromium } = require('playwright');
const fs = require('fs');

async function crawlFolderWithScroll(page, folderId, folderName) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  console.log(`\nNavigating to ${folderName} (${url})...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Collect all items
  const foundItems = new Map();

  for (let step = 0; step < 15; step++) {
    const items = await page.evaluate(() => {
      const results = [];
      // Look for elements with data-id or role="row" or similar in Drive
      document.querySelectorAll('[data-id]').forEach(el => {
        const id = el.getAttribute('data-id');
        const text = el.innerText || '';
        const matchTitle = text.match(/CP Art\.?\s*[0-9A-Za-z-]+(?:\.mp3)?/i) || text.match(/.*\.mp3/i);
        if (id && matchTitle) {
          results.push({ id, title: matchTitle[0].trim() });
        }
      });
      return results;
    });

    for (const it of items) {
      if (!foundItems.has(it.title)) {
        foundItems.set(it.title, it);
      }
    }

    // Scroll down inside the main container
    await page.evaluate(() => {
      const scrollable = document.querySelector('[role="main"]') || document.documentElement || document.body;
      scrollable.scrollBy(0, 1500);
      window.scrollBy(0, 1500);
    });
    await page.waitForTimeout(1000);
  }

  console.log(`Found ${foundItems.size} items in ${folderName}`);
  return Array.from(foundItems.values());
}

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  // Test subfolder 1
  const items = await crawlFolderWithScroll(page, '1tN2wQLvjUlis3JDf13nz8HZOubxfkSW7', 'CP - Arts. 11 a 90');
  console.log("Sample items found:", items.slice(0, 5));
  console.log("Last 5 items:", items.slice(-5));

  await browser.close();
}

main().catch(console.error);
