const fs = require('fs');

async function run() {
  const url = 'https://drive.google.com/drive/folders/1fPpkrxjJ2J_teVypzVLvymRYsCx6kxUC';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  fs.writeFileSync('scripts/pilulas_drive.html', html, 'utf8');

  // Look for any script with AF_initDataCallback
  const afs = [...html.matchAll(/AF_initDataCallback\(\{key:\s*'([^']+)',\s*isError:\s*false,\s*hash:\s*'[^']*',\s*data:(.*?)\}\);<\/script>/gs)];
  console.log('AF callbacks:', afs.length);
  for (const af of afs) {
    console.log('Key:', af[1], 'Data length:', af[2].length);
    fs.writeFileSync(`scripts/af_${af[1]}.json`, af[2], 'utf8');
  }

  // Also look for W_pb or other patterns
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  console.log('Scripts count:', scriptMatches.length);
  let totalMatches = 0;
  for (let i = 0; i < scriptMatches.length; i++) {
    const s = scriptMatches[i][1];
    if (s.includes('1fPpkrxjJ2J_teVypzVLvymRYsCx6kxUC') || s.includes('Pílulas') || s.includes('Direito')) {
      console.log(`Script ${i} mentions folder or pilulas! Length:`, s.length);
    }
  }
}
run().catch(console.error);
