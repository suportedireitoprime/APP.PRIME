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
  // audio folder of Aula 01 Crimes Contra a Familia: 1-HDLF5a8fp8FUUTmwMjmVBvCUIcM5u5-
  const audios = await fetchFolder('1-HDLF5a8fp8FUUTmwMjmVBvCUIcM5u5-');
  console.log(`Audio folder has ${audios.length} files:`);
  audios.slice(0, 5).forEach(a => console.log('  ', a.name, a.id));

  // imagens folder: 1RNMviduGLLNkoBjjYSQ_LnZzrrlx2Dl8
  const imgs = await fetchFolder('1RNMviduGLLNkoBjjYSQ_LnZzrrlx2Dl8');
  console.log(`Imagens folder has ${imgs.length} files:`);
  imgs.slice(0, 5).forEach(img => console.log('  ', img.name, img.id));
}

test().catch(console.error);

