const fs = require('fs');

async function inspectNarracoesFolder(folderId) {
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
  console.log(`\n=== NARRAÇÃO: crimes-funcionario-publico (${entries.length} itens) ===`);
  entries.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.text}] -> ${e.href}`);
  });
}

inspectNarracoesFolder('1DesE3nzo_99I54aXIt-eXQNwSfNLBcjY');
