const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('\n\n--- PAGE ERROR CAUGHT ---');
    console.log(error.message);
    console.log(error.stack);
    console.log('-------------------------\n\n');
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle', timeout: 10000 });
  } catch (err) {
    console.log('Goto error:', err.message);
  }
  
  await browser.close();
})();
