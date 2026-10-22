const fs = require('fs');

async function getLavagemFiles() {
  const res = await fetch('https://drive.google.com/drive/folders/1hlVR1MKbefB4zW1kv8_3YV8sTBqARx52', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return console.log('No match');

  const raw = match[1];
  // Replace \xHH escapes
  const decoded = raw.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  let data;
  try {
    data = JSON.parse(decoded);
  } catch (err) {
    console.log('JSON Parse failed, trying regex extraction...');
  }

  const items = [];
  if (data) {
    function extract(arr) {
      if (!Array.isArray(arr)) return;
      if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
        items.push({ id: arr[0], name: arr[2], mime: arr[3] });
      }
      for (const el of arr) if (Array.isArray(el)) extract(el);
    }
    extract(data);
  } else {
    // Regex extraction fallback
    const idRegex = /\["([a-zA-Z0-9_-]{28,35})",\["([^"]+\.mp3)"/g;
    let m;
    while ((m = idRegex.exec(decoded)) !== null) {
      items.push({ id: m[1], name: m[2], mime: 'audio/mpeg' });
    }
  }

  console.log(`Found ${items.length} items for Lei de Lavagem de Dinheiro:`);
  console.log(items.slice(0, 5));

  const audios = items.map(item => {
    let artNum = '';
    const m = item.name.match(/(?:Art\.?|Artigo)?\s*0*([0-9]+(?:\-[A-Za-z0-9]+)?)/i);
    artNum = m ? m[1] : item.name.replace(/\.[^.]+$/, '').trim();

    return {
      driveId: item.id,
      fileName: item.name,
      artigoNumero: artNum,
      category: 'leis especiais',
      lawName: 'Lei de Lavagem de Dinheiro (9.613/1998)',
      tabelaNome: 'LLAV_LAVAGEM_DINHEIRO',
      sigla: 'LLAV',
      subfolder: ''
    };
  });

  // Append to scripts/all_drive_audios.json
  const current = JSON.parse(fs.readFileSync('scripts/all_drive_audios.json', 'utf8'));
  const merged = [...current, ...audios];
  fs.writeFileSync('scripts/all_drive_audios.json', JSON.stringify(merged, null, 2), 'utf8');
  console.log(`Total audios now: ${merged.length}`);
}

getLavagemFiles().catch(console.error);
