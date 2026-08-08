import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', exception => {
    console.log('[PAGE ERROR]', exception);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });
  
  console.log('Navigating to http://localhost:8080...');
  try {
    await page.goto('http://localhost:8080', { waitUntil: 'load', timeout: 30000 });
    console.log('Navigation complete (load event). Waiting 5 seconds...');
    await page.waitForTimeout(5000);
  } catch (e) {
    console.log('Navigation failed:', e.message);
  }
  
  await browser.close();
})();
