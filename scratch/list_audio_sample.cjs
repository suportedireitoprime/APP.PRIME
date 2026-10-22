const fs = require('fs');

async function listFolder(folderId, name) {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  
  const entries = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (href.includes('drive.google.com') || href.includes('file')) {
      const idMatch = href.match(/\/d\/([a-zA-Z0-9_-]+)/);
      entries.push({ id: idMatch ? idMatch[1] : null, name: text, href });
    }
  }
  console.log(`\n=== PASTA: ${name} (${entries.length} arquivos) ===`);
  entries.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.name}] -> id: ${e.id}`);
  });
  return entries;
}

listFolder('1DesE3nzo_99I54aXIt-eXQNwSfNLBcjY', 'Direito Penal -> narracoes -> crimes-funcionario-publico');
