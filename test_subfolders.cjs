const https = require('https');
const fs = require('fs');

function fetchFolder(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://drive.google.com/embeddedfolderview?id=${id}#list`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const regex = /<div class="flip-entry" id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
        let m;
        const items = [];
        while ((m = regex.exec(d)) !== null) {
          items.push({
            id: m[1],
            url: m[2],
            name: m[3].trim(),
            isFolder: m[2].includes('/folders/')
          });
        }
        resolve(items);
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('Testing "Direito Penal"...');
  const penal = await fetchFolder('13NRXMToFSblGbd3bL6Ut9-q2HQRMDSe4');
  console.log(`Direito Penal has ${penal.length} items:`);
  penal.slice(0, 15).forEach(i => console.log(i.isFolder ? '[FOLDER]' : '[FILE]', i.name, i.id));

  console.log('\nTesting "Capas das Aulas: Direito Penal"...');
  const capas = await fetchFolder('1EweT0nhfQNeMzKEEXsCljGPao6RdR51h');
  console.log(`Capas Direito Penal has ${capas.length} items:`);
  capas.slice(0, 15).forEach(i => console.log(i.isFolder ? '[FOLDER]' : '[FILE]', i.name, i.id));
}

test().catch(console.error);

