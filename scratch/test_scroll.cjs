const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto('https://drive.google.com/drive/folders/1tN2wQLvjUlis3JDf13nz8HZOubxfkSW7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Find scrollable container
  const scrollableSelector = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const scrollables = all.filter(el => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    return scrollables.map(el => ({
      tag: el.tagName,
      className: el.className,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      role: el.getAttribute('role')
    }));
  });

  console.log("Scrollable containers found:", scrollableSelector);

  // Scroll the first valid scrollable container
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1000);
  }

  // Count items now
  const count = await page.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('[data-id]').forEach(el => {
      const text = el.innerText || '';
      if (text.includes('.mp3')) set.add(text);
    });
    return { total: set.size, sample: Array.from(set).slice(-5) };
  });

  console.log("After PageDown:", count);
  await browser.close();
}

main().catch(console.error);
