const fs = require('fs');

async function listAllFiles(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  
  const entries = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (href.includes('drive.google.com') || href.includes('file') || href.includes('folders')) {
      const idMatch = href.match(/\/(?:d|folders)\/([a-zA-Z0-9_-]+)/);
      const isFolder = href.includes('folders');
      entries.push({ id: idMatch ? idMatch[1] : null, name: text, isFolder, href });
    }
  }
  return entries;
}

async function run() {
  const resumos = await listAllFiles('1ZOHWgYwnKbJGph0emFNdO-YkO7XnFFRD');
  const narracoes = await listAllFiles('1TF6Dd3sBzYsQG9mfx6zs0pwWJgqjWPum');
  
  console.log(`Resumos .docx em Direito Penal: ${resumos.length}`);
  console.log(`Pastas de narrações em Direito Penal: ${narracoes.length}`);
  
  fs.writeFileSync('scratch/penal_resumos.json', JSON.stringify(resumos, null, 2));
  fs.writeFileSync('scratch/penal_narracoes.json', JSON.stringify(narracoes, null, 2));
  console.log('Salvo em scratch/penal_resumos.json e scratch/penal_narracoes.json');
}

run().catch(console.error);
