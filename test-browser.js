const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:8080/');
  
  console.log('Page loaded. Waiting a bit to see if anything hangs...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
