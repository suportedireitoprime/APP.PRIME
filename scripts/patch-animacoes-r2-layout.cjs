const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const catalog = require('../src/data/animacoesCatalog.json');

const R2_CONFIG = {
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
  secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc',
  bucket: 'estudos-juridicos-midias',
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

const OVERRIDE_STYLE = `<style id="app-prime-override">
  :root {
    --bg: #09090b;
    --panel: #111114;
    --ink: #fafafa;
    --ink2: #a1a1aa;
    --line: rgba(255, 255, 255, 0.1);
    --chip: #18181b;
    --shadow: none;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #09090b !important;
    color: #fafafa !important;
    overflow-x: hidden !important;
  }
  .wrap {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    gap: 0 !important;
  }
  .stagebox {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    aspect-ratio: 9 / 16 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    border: 0 !important;
    box-shadow: none !important;
  }
  .caption {
    border-radius: 0 !important;
    border: 0 !important;
    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    background: #111114 !important;
    color: #f4f4f5 !important;
    padding: 10px 14px !important;
    min-height: 52px !important;
    font-size: 15px !important;
    line-height: 1.45 !important;
    box-shadow: none !important;
  }
  .caption .who,
  #capwho {
    display: none !important;
  }
  .caption .w { color: #a1a1aa !important; }
  .caption .w.on { color: #fafafa !important; }
  .caption .w.hot { color: #fbbf24 !important; }
  .controls {
    border-radius: 0 !important;
    border: 0 !important;
    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    background: #09090b !important;
    padding: 10px 12px 12px !important;
    gap: 8px !important;
    box-shadow: none !important;
  }
  .ptime,
  #chaps,
  .chaps,
  .note {
    display: none !important;
  }
  /* Compatibilidade com template alternativo (q58) */
  #wrap {
    min-height: 100dvh !important;
    background: #09090b !important;
  }
  #stageBox {
    padding: 0 !important;
  }
  #stage {
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  :fullscreen .stagebox,
  :-webkit-full-screen .stagebox {
    width: auto !important;
    height: 100dvh !important;
    margin: 0 auto !important;
  }
</style>`;

async function patchOne(item, idx, total) {
  const res = await fetch(`${item.htmlR2Url}?nocache=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar ${item.slug}`);
  let html = await res.text();

  // Remove override antigo se existir (idempotente)
  html = html.replace(/<style id="app-prime-override">[\s\S]*?<\/style>\s*/i, '');

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${OVERRIDE_STYLE}\n</head>`);
  } else {
    html = `${OVERRIDE_STYLE}\n${html}`;
  }

  const key = `animacoes/${item.slug}/index.html`;
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
      Body: Buffer.from(html, 'utf8'),
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'public, max-age=300, must-revalidate',
    })
  );
  console.log(`[${idx + 1}/${total}] Atualizado no R2: ${key}`);
}

(async () => {
  console.log(`Aplicando patch full-bleed em ${catalog.length} animações...`);
  const concurrency = 5;
  for (let i = 0; i < catalog.length; i += concurrency) {
    const batch = catalog.slice(i, i + concurrency);
    await Promise.all(batch.map((item, j) => patchOne(item, i + j, catalog.length)));
  }
  console.log('Todas as animações foram atualizadas no R2 com sucesso.');
})();
