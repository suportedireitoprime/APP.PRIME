const fs = require('fs');

const progress = JSON.parse(fs.readFileSync('scripts/sync_audioaulas_progress.json', 'utf8'));
const keys = Object.keys(progress);
console.log(`Total de áudios já salvos no progresso: ${keys.length}`);

async function testSample() {
  const sample = keys.slice(-5);
  for (const k of sample) {
    const url = `https://pub-0c1a0e4ebbdd44dfa883dd36c269f19f.r2.dev/${k.split('/').map(encodeURIComponent).join('/')}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`- [${res.status}] ${k} (${(progress[k].size / 1024 / 1024).toFixed(2)} MB)`);
    } catch (e) {
      console.log(`- [ERRO] ${k}: ${e.message}`);
    }
  }
}

testSample().catch(console.error);
