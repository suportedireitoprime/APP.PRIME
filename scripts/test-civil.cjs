const fs = require('fs');

async function testSubfolder() {
  const url = 'https://drive.google.com/drive/folders/1gG60uiWRUx2aIzb6ykKRkoGd-jt3fIBB';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  console.log('Civil folder HTML length:', html.length);
  fs.writeFileSync('scripts/civil_drive.html', html, 'utf8');

  // Match items in folder
  // Look for aria-label="... Shared folder" or files like .mp3, .pdf
  const itemRegex = /aria-label="([^"]+?)"[^>]*ssk='[^']*?:([a-zA-Z0-9_-]{25,45})-0-16'/g;
  let m;
  const items = [];
  while ((m = itemRegex.exec(html)) !== null) {
    items.push({ name: m[1].trim(), id: m[2] });
  }

  // Also check if aria-label includes "01. LINDB e Prazos" or similar
  const matchesLINDB = [...html.matchAll(/LINDB/gi)];
  console.log('LINDB occurrences:', matchesLINDB.length);

  console.log(`Found ${items.length} items in Direito Civil:`);
  items.slice(0, 30).forEach(it => console.log(`- ${it.name} (${it.id})`));
}
testSubfolder().catch(console.error);
