const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Route console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('http://localhost:8080/auth');
  
  // Try to login (assuming we know a test user or just capture whatever error we see)
  // Let's just wait to see if any errors happen on load
  await page.waitForTimeout(3000);

  // We actually need to login to test logout, but I don't have credentials right now.
  // I will just see what errors are there.
  
  await browser.close();
})();
