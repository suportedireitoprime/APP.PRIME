const { chromium } = require('playwright');
const fs = require('fs');

async function crawlFolderWithScroll(page, folderId, folderName) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  console.log(`Navigating to ${folderName}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const foundItems = new Map();

  for (let step = 0; step < 8; step++) {
    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('[data-id]').forEach(el => {
        const id = el.getAttribute('data-id');
        const text = el.innerText || '';
        const match = text.match(/CDC Art\.?\s*[0-9A-Za-z-]+(?:\.mp3)?/i) || text.match(/Art\.?\s*[0-9A-Za-z-]+(?:\.mp3)?/i) || text.match(/[^\n]+\.mp3/i);
        if (id && match && id.length >= 25) {
          results.push({ id, title: match[0].trim() });
        }
      });
      return results;
    });

    for (const it of items) {
      if (!foundItems.has(it.title)) {
        foundItems.set(it.title, it);
      }
    }

    await page.keyboard.press('PageDown');
    await page.waitForTimeout(500);
  }

  console.log(`  -> ${folderName}: ${foundItems.size} files collected.`);
  return Array.from(foundItems.values());
}

async function run() {
  const cdcRootData = JSON.parse(fs.readFileSync('scratch/cdc_root.json', 'utf8'));
  console.log(`Crawling ${cdcRootData.subfolders.length} CDC subfolders...`);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const allMap = new Map();

  // Direct files in root if any
  for (const f of cdcRootData.files) {
    let cleanTitle = f.title.replace(/\.mp3$/i, '').trim() + '.mp3';
    allMap.set(cleanTitle, { ...f, title: cleanTitle, subfolder: 'CDC - Root' });
  }

  for (let i = 0; i < cdcRootData.subfolders.length; i++) {
    const sf = cdcRootData.subfolders[i];
    console.log(`[${i+1}/${cdcRootData.subfolders.length}] ${sf.title}...`);
    const files = await crawlFolderWithScroll(page, sf.id, sf.title);
    for (const f of files) {
      if (f.title.toLowerCase().endsWith('.mp3') || f.title.toLowerCase().includes('art')) {
        let cleanTitle = f.title.replace(/\.mp3$/i, '').trim() + '.mp3';
        allMap.set(cleanTitle, { ...f, title: cleanTitle, subfolder: sf.title });
      }
    }
  }

  await browser.close();

  const allAudios = Array.from(allMap.values());
  console.log(`\n========================================`);
  console.log(`TOTAL DE ARQUIVOS CDC COLETADOS: ${allAudios.length}`);
  console.log(`========================================`);

  allAudios.sort((a, b) => {
    const numA = (a.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    const numB = (b.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    if (numA && numB && parseInt(numA, 10) !== parseInt(numB, 10)) {
      return parseInt(numA, 10) - parseInt(numB, 10);
    }
    return a.title.localeCompare(b.title, 'pt-BR', { numeric: true });
  });

  fs.writeFileSync('scratch/cdc_complete_files.json', JSON.stringify(allAudios, null, 2));
  console.log('Saved to scratch/cdc_complete_files.json');
}

run().catch(console.error);
