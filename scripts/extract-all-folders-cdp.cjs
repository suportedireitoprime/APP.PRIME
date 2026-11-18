const { spawn } = require('child_process');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const DRIVE_URL = 'https://drive.google.com/drive/folders/1faVFeCnA5SlrZTFE88l7zsRRA4XtgBix';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
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
  console.log('Navegando para Drive URL...');
  await cdp('Page.navigate', { url: DRIVE_URL });
  await sleep(10000);

  console.log('Descobrindo elementos scrolláveis e rolando até o fim...');

  // Rola até o final para carregar todos os itens
  for (let step = 1; step <= 25; step++) {
    const scrollRes = await cdp('Runtime.evaluate', {
      expression: `
        (() => {
          // Scroll all scrollable elements
          const all = document.querySelectorAll('*');
          let scrolledAny = false;
          for (const el of all) {
            if (el.scrollHeight > el.clientHeight && el.clientHeight > 200) {
              el.scrollTop = el.scrollHeight;
              scrolledAny = true;
            }
          }
          window.scrollTo(0, document.body.scrollHeight);

          // Contar quantos itens estão no DOM agora
          const rows = document.querySelectorAll('[role="row"], [data-id]');
          return { scrolledAny, rowCount: rows.length };
        })()
      `,
      returnByValue: true
    });
    console.log(`Step ${step}/25:`, scrollRes.result.result.value);
    await sleep(1500);
  }

  // Extrair todos os itens
  console.log('Extraindo todos os itens da página...');
  const extractRes = await cdp('Runtime.evaluate', {
    expression: `
      (() => {
        const items = [];
        const seen = new Set();

        // Procura por todos os elementos com data-id
        for (const el of document.querySelectorAll('[data-id]')) {
          const id = el.getAttribute('data-id');
          if (!id || id.length < 20 || seen.has(id)) continue;

          // Nome pode estar no texto ou em aria-label ou em elemento filho
          let name = '';
          const nameEl = el.querySelector('[data-target="doc"], [role="gridcell"], .c-P-P') || el;
          name = el.getAttribute('aria-label') || nameEl.textContent.trim();

          // Limpa ruídos de texto (data, tamanho, etc.)
          const cleanName = name.split('\\n')[0].trim();
          seen.add(id);
          items.push({ id, name: cleanName, fullText: name });
        }

        // Também procura por links
        for (const a of document.querySelectorAll('a[href*="/folders/"]')) {
          const href = a.getAttribute('href');
          const m = href.match(/folders\\/([a-zA-Z0-9_-]+)/);
          if (m && !seen.has(m[1])) {
            seen.add(m[1]);
            const txt = a.textContent.trim().split('\\n')[0].trim();
            items.push({ id: m[1], name: txt, fullText: a.textContent.trim() });
          }
        }

        return {
          total: items.length,
          items
        };
      })()
    `,
    returnByValue: true
  });

  const data = extractRes.result.result.value;
  console.log(`Total de itens extraídos: ${data.total}`);
  fs.writeFileSync('all_drive_folders_cdp.json', JSON.stringify(data, null, 2), 'utf8');

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
