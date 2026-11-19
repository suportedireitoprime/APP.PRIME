const { spawn } = require('child_process');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const FOLDER_ID = '1YjvTVGzsEGdukJQ8rGtqXoc8YMkntRA0';
const DRIVE_URL = `https://drive.google.com/drive/folders/${FOLDER_ID}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('1. Iniciando Chrome...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  await sleep(2000);

  const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = e => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };
  await new Promise(r => ws.onopen = r);

  function cdp(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  console.log('Navegando para o Google Drive das Súmulas...');
  await cdp('Page.navigate', { url: DRIVE_URL });
  await sleep(10000);

  console.log('Rolando até o final para carregar todas as súmulas...');
  for (let step = 1; step <= 25; step++) {
    const scrollRes = await cdp('Runtime.evaluate', {
      expression: `
        (() => {
          const all = document.querySelectorAll('*');
          let scrolledAny = false;
          for (const el of all) {
            if (el.scrollHeight > el.clientHeight && el.clientHeight > 200) {
              el.scrollTop = el.scrollHeight;
              scrolledAny = true;
            }
          }
          window.scrollTo(0, document.body.scrollHeight);
          const rows = document.querySelectorAll('[role="row"], [data-id]');
          return { scrolledAny, rowCount: rows.length };
        })()
      `,
      returnByValue: true
    });
    const val = scrollRes?.result?.result?.value;
    console.log(`Step ${step}/25: rows = ${val?.rowCount}`);
    await sleep(1500);
  }

  console.log('Extraindo itens do DOM...');
  const extractRes = await cdp('Runtime.evaluate', {
    expression: `
      (() => {
        const items = [];
        const seen = new Set();

        for (const el of document.querySelectorAll('[data-id]')) {
          const id = el.getAttribute('data-id');
          if (!id || id.length < 20 || seen.has(id)) continue;
          let name = el.getAttribute('aria-label') || el.textContent.trim();
          seen.add(id);
          items.push({ id, name });
        }

        // Também varre ssk
        const rawHtml = document.documentElement.outerHTML;
        const sskRegex = /aria-label="([^"]+?)"[^>]*ssk='[^']*?:([a-zA-Z0-9_-]{25,45})-0-16'/g;
        let m;
        while ((m = sskRegex.exec(rawHtml)) !== null) {
          if (!seen.has(m[2])) {
            seen.add(m[2]);
            items.push({ id: m[2], name: m[1].trim() });
          }
        }

        return items;
      })()
    `,
    returnByValue: true
  });

  const rawItems = extractRes?.result?.result?.value || [];
  console.log(`Total de itens extraídos: ${rawItems.length}`);

  chromeProc.kill();

  fs.writeFileSync('scripts/sumulas_drive_raw_items.json', JSON.stringify(rawItems, null, 2));
  console.log('Salvo em scripts/sumulas_drive_raw_items.json');
}

main().catch(console.error);
