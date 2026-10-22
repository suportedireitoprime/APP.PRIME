const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

async function findR2Areas() {
  const buckets = ['audio-aulas', 'estudos-juridicos-midias', 'narracoes-leis', 'vacatio-midias', 'livros-pdf'];
  console.log('--- BUSCANDO ÁREAS NO R2 ---');
  
  const bucketAreas = {};

  for (const bucket of buckets) {
    bucketAreas[bucket] = new Set();
    let token = undefined;
    let count = 0;
    
    // We can do a paginated search or check prefixes
    try {
      do {
        const res = await s3.send(new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: token,
          MaxKeys: 1000
        }));

        if (res.Contents) {
          count += res.Contents.length;
          for (const item of res.Contents) {
            // Find patterns like narracoes/areas/<area>/... or audioaulas/<area>/... or <area>/...
            const key = item.Key;
            if (key.includes('direito') || key.includes('DIREITO') || key.includes('areas/') || key.includes('audioaulas/')) {
              bucketAreas[bucket].add(key);
            }
          }
        }
        token = res.NextContinuationToken;
      } while (token && count < 10000);
      
      console.log(`Bucket ${bucket}: total items scanned = ${count}, matching keys = ${bucketAreas[bucket].size}`);
      if (bucketAreas[bucket].size > 0) {
        console.log(`Exemplos em ${bucket}:`, Array.from(bucketAreas[bucket]).slice(0, 10));
      }
    } catch (e) {
      console.error(`Erro no bucket ${bucket}:`, e.message);
    }
  }

  return bucketAreas;
}

async function getDriveFolders() {
  console.log('\n--- OBTENDO PASTAS DO GOOGLE DRIVE ---');
  const url = 'https://drive.google.com/drive/folders/1ANgcRvjguTzD8I-Xy5_DgtiYHB_r_rTg';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const data = JSON.parse(hexDecoded);

  const items = [];
  function findItems(arr) {
    if (!Array.isArray(arr)) return;
    if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
      items.push({
        id: arr[0],
        parentId: arr[1],
        name: arr[2],
        mimeType: arr[3]
      });
    }
    for (const el of arr) {
      if (Array.isArray(el)) findItems(el);
    }
  }
  findItems(data);

  // Filter items in the root folder
  const driveRootFolders = items.filter(it => it.mimeType === 'application/vnd.google-apps.folder');
  
  // Uppercase folders
  const uppercaseFolders = driveRootFolders.filter(it => {
    const clean = it.name.replace(/[^a-zA-ZáéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ]/g, '');
    return clean.length > 0 && clean === clean.toUpperCase();
  });

  console.log(`Total de pastas encontradas no Drive: ${driveRootFolders.length}`);
  console.log(`Pastas em CAIXA ALTA (Áreas de Áudioaulas): ${uppercaseFolders.length}`);
  uppercaseFolders.forEach(f => console.log(` - ${f.name} (id: ${f.id})`));

  return { allFolders: driveRootFolders, uppercaseFolders };
}

async function main() {
  const driveInfo = await getDriveFolders();
  const r2Info = await findR2Areas();
  fs.writeFileSync('scripts/drive_r2_analysis.json', JSON.stringify({ driveInfo, r2Sample: Object.fromEntries(Object.entries(r2Info).map(([k, v]) => [k, Array.from(v).slice(0, 50)])) }, null, 2));
}

main().catch(console.error);
