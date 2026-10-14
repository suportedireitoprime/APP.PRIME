const { chromium } = require('playwright');
const fs = require('fs');

async function crawlFolderWithScroll(page, folderId, folderName) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  console.log(`Navigating to ${folderName}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const foundItems = new Map();

  // Scroll down multiple times to load all virtualized rows
  for (let step = 0; step < 12; step++) {
    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('[data-id]').forEach(el => {
        const id = el.getAttribute('data-id');
        const text = el.innerText || '';
        // Extract file name
        const match = text.match(/CP Art\.?\s*[0-9A-Za-z-]+(?:\.mp3)?/i) || text.match(/[^\n]+\.mp3/i);
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
    await page.waitForTimeout(600);
  }

  console.log(`  -> ${folderName}: ${foundItems.size} files collected.`);
  return Array.from(foundItems.values());
}

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const cpSubfolders = [
    { id: '1IwO3rzWUCFvmbGIlwLvQQtX4eSXXXYQW', name: 'CP - Root (Arts. 1 a 10)' },
    { id: '1tN2wQLvjUlis3JDf13nz8HZOubxfkSW7', name: 'CP - Arts. 11 a 90' },
    { id: '1gTkaokHSmPi8P_nKibpvCzkggHF6IMnS', name: 'CP - Arts. 91 a 170' },
    { id: '1voO27ra1eMx4xVfAAe-PgXD763ixdBIh', name: 'CP - Arts. 171 a 250' },
    { id: '1sLyUNvIfDOQ2zqSxlbVhZtsH2KDzIh_4', name: 'CP - Arts. 251 a 330' },
    { id: '1NiUAofr02jnMxARuqBtNeJkl5xUEFLuu', name: 'CP - Arts. 331 a 361' }
  ];

  const allMap = new Map();

  for (const sf of cpSubfolders) {
    const files = await crawlFolderWithScroll(page, sf.id, sf.name);
    for (const f of files) {
      if (f.title.toLowerCase().endsWith('.mp3') || f.title.toLowerCase().includes('art')) {
        // Normaliza título
        let cleanTitle = f.title.replace(/\.mp3$/i, '').trim() + '.mp3';
        allMap.set(cleanTitle, { ...f, title: cleanTitle, subfolder: sf.name });
      }
    }
  }

  await browser.close();

  const allAudios = Array.from(allMap.values());
  console.log(`\n========================================`);
  console.log(`TOTAL DE ARQUIVOS CP COLETADOS: ${allAudios.length}`);
  console.log(`========================================`);

  // Sort natural
  allAudios.sort((a, b) => {
    const numA = (a.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    const numB = (b.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    if (numA && numB && parseInt(numA, 10) !== parseInt(numB, 10)) {
      return parseInt(numA, 10) - parseInt(numB, 10);
    }
    return a.title.localeCompare(b.title, 'pt-BR', { numeric: true });
  });

  fs.writeFileSync('scratch/cp_complete_files.json', JSON.stringify(allAudios, null, 2));
  console.log('Saved to scratch/cp_complete_files.json');
}

run().catch(console.error);
