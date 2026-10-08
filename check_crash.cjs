const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message, error.stack));

  console.log('Navigating to http://localhost:4173/ ...');
  try {
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch (e) {
    console.log('Goto error:', e.message);
  }
  
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
