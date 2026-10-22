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
  await inspectFolder('1l-yopFjrUF50z522w5_aA9OkpSxCtuf8', '01 Direito Penal');
  await inspectFolder('1HRsHPFDsn4xalGt3sa5pXHTKue7dlsPy', '05 Direito Constitucional');
}

run();
