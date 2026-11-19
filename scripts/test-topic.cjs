const fs = require('fs');

async function testTopicFolder() {
  const url = 'https://drive.google.com/drive/folders/1m9RBRxnAcZ1ps0Bbtnp_h5jueSogBcz0';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  console.log('Topic folder HTML length:', html.length);
  fs.writeFileSync('scripts/topic_drive.html', html, 'utf8');

  // Match files
  // Match aria-label="... .mp3" or aria-label="... .pdf"
  const itemRegex = /aria-label="([^"]+?)"[^>]*ssk='[^']*?:([a-zA-Z0-9_-]{25,45})-0-16'/g;
  let m;
  const items = [];
  while ((m = itemRegex.exec(html)) !== null) {
    items.push({ name: m[1].trim(), id: m[2] });
  }

  console.log(`Found ${items.length} items in topic folder:`);
  items.forEach(it => console.log(`* ${it.name} (${it.id})`));
}
testTopicFolder().catch(console.error);
