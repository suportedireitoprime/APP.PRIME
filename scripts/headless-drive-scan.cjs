const { spawn } = require('child_process');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const DRIVE_URL = 'https://drive.google.com/drive/folders/1faVFeCnA5SlrZTFE88l7zsRRA4XtgBix';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('1. Iniciando Chrome Headless na porta 9222...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1920,1080',
    'about:blank'
  ], { detached: false });

  chromeProc.on('error', err => {
    console.error('Falha ao iniciar Chrome:', err);
  });

  // Aguarda Chrome inicializar
  await sleep(2000);

  console.log('2. Conectando à API do Chrome DevTools...');
  let versionRes;
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      versionRes = await res.json();
      break;
    } catch (e) {
      await sleep(1000);
    }
  }

  if (!versionRes) {
    throw new Error('Não foi possível conectar ao Chrome DevTools');
  }
  console.log('Chrome conectado:', versionRes['Browser']);

  // Cria uma nova aba navegando para a pasta do Drive
  const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(DRIVE_URL)}`, { method: 'PUT' });
  const tab = await newTabRes.json();
  console.log('Aba criada:', tab.id, tab.url);

  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let msgId = 1;
  const pendingRequests = new Map();

  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      pendingRequests.get(data.id)(data);
      pendingRequests.delete(data.id);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function sendCDP(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  console.log('3. Habilitando Page e Runtime...');
  await sendCDP('Page.enable');
  await sendCDP('Runtime.enable');

  console.log('4. Aguardando carregamento da página do Drive (10s)...');
  await sleep(10000);

  // Scroll down várias vezes para forçar o carregamento de todos os itens da pasta
  console.log('5. Rolando para baixo para carregar todas as páginas de itens...');
  for (let i = 1; i <= 10; i++) {
    await sendCDP('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo(0, document.body.scrollHeight);
          const scrollable = document.querySelector('[role="main"]') || document.querySelector('.c-P-P') || document.querySelector('c-wiz') || document.body;
          if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
          const grid = document.querySelector('[role="grid"]') || document.querySelector('[role="listbox"]');
          if (grid) grid.scrollTop = grid.scrollHeight;
        })()
      `
    });
    console.log(`   Scroll ${i}/10...`);
    await sleep(2000);
  }

  // Extrair todos os itens visíveis ou no DOM
  console.log('6. Extraindo lista completa de pastas e arquivos...');
  const extractRes = await sendCDP('Runtime.evaluate', {
    expression: `
      (() => {
        const results = [];
        // Busca todos os elementos que representam arquivos/pastas no Drive
        const items = document.querySelectorAll('[data-id], [data-target="doc"], [role="row"], [role="gridcell"], [data-tooltip]');
        const seen = new Set();
        
        // Também busca links /drive/folders/
        const links = document.querySelectorAll('a[href*="/folders/"]');
        for (const a of links) {
          const href = a.getAttribute('href') || '';
          const match = href.match(/folders\\/([a-zA-Z0-9_-]+)/);
          const text = a.textContent.trim();
          if (match && text && !seen.has(match[1])) {
            seen.add(match[1]);
            results.push({ id: match[1], name: text, source: 'link' });
          }
        }

        // Busca atributos data-id
        for (const el of document.querySelectorAll('[data-id]')) {
          const id = el.getAttribute('data-id');
          const name = el.getAttribute('aria-label') || el.textContent.trim();
          if (id && id.length >= 20 && !seen.has(id)) {
            seen.add(id);
            results.push({ id, name, source: 'data-id' });
          }
        }

        // Busca texto bruto na página
        return {
          title: document.title,
          resultsCount: results.length,
          results,
          bodyTextSample: document.body.innerText.slice(0, 1000)
        };
      })()
    `,
    returnByValue: true
  });

  const evalVal = extractRes.result && extractRes.result.value ? extractRes.result.value : {};
  console.log('Resultado extraído do DOM:');
  console.log('Título:', evalVal.title);
  console.log('Total de resultados:', evalVal.resultsCount);
  console.log('Primeiros itens:', evalVal.results ? evalVal.results.slice(0, 15) : 'Nenhum');

  fs.writeFileSync('chrome_extracted_items.json', JSON.stringify(evalVal, null, 2), 'utf8');

  // Limpeza
  ws.close();
  chromeProc.kill();
  console.log('Processo finalizado com sucesso.');
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
