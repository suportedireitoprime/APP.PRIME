const fs = require('fs');

async function inspectFolder(folderId, name) {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  
  const entries = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (href.includes('drive.google.com') || href.includes('folders') || href.includes('file')) {
      entries.push({ href, text });
    }
  }
  console.log(`\n=== PASTA: ${name} (${entries.length} itens) ===`);
  entries.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.text}] -> ${e.href}`);
  });
  return entries;
}

async function run() {
  await inspectFolder('1ZOHWgYwnKbJGph0emFNdO-YkO7XnFFRD', '01 Direito Penal -> resumos');
  await inspectFolder('1TF6Dd3sBzYsQG9mfx6zs0pwWJgqjWPum', '01 Direito Penal -> narracoes');
}

run();
