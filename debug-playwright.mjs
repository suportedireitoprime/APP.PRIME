import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('pageerror', (err) => {
    console.log('PAGE ERROR:', err.message);
    console.log('STACK TRACE:', err.stack);
    process.exit(1);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  console.log('Navigating to http://localhost:8080/ ...');
  await page.goto('http://localhost:8080/');
  
  // Wait a bit to let the app initialize
  await page.waitForTimeout(5000);
  console.log('No error caught after 5 seconds.');
  await browser.close();
  process.exit(0);
})();
