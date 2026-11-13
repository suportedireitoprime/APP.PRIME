const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const R2_CONFIG = {
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
  secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc',
  bucket: 'estudos-juridicos-midias',
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

async function existsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_CONFIG.bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));
}

async function fetchWithRetry(url, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 1000) return Buffer.from(ab);
      }
    } catch {}
    await new Promise(r => setTimeout(r, delay * (i + 1)));
  }
  return null;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync('src/data/pilulasDireitoPenalCatalog.json', 'utf8'));
  const remaining = catalog.slice(37); // modules 38-42

  console.log('Retrying modules 38-42...');
  for (const mod of remaining) {
    console.log(`\nModulo ${mod.folderIndex}: ${mod.titulo}`);
    for (const t of mod.topicos) {
      if (t.driveMp3Id && t.r2Mp3Key) {
        const exists = await existsInR2(t.r2Mp3Key);
        if (!exists) {
          const buf = await fetchWithRetry(`https://drive.google.com/uc?export=download&id=${t.driveMp3Id}`);
          if (buf) {
            await uploadToR2(t.r2Mp3Key, buf, 'audio/mpeg');
            console.log(`  ✓ MP3: ${t.titulo}`);
          } else {
            console.log(`  ✗ MP3 falhou: ${t.titulo}`);
          }
        } else {
          console.log(`  - MP3 ja existe: ${t.titulo}`);
        }
      }
      if (t.drivePdfId && t.r2PdfKey) {
        const exists = await existsInR2(t.r2PdfKey);
        if (!exists) {
          const buf = await fetchWithRetry(`https://drive.google.com/uc?export=download&id=${t.drivePdfId}`);
          if (buf) {
            await uploadToR2(t.r2PdfKey, buf, 'application/pdf');
            console.log(`  ✓ PDF: ${t.titulo}`);
          }
        }
      }
      if (t.driveSrtId && t.r2SrtKey) {
        const exists = await existsInR2(t.r2SrtKey);
        if (!exists) {
          const buf = await fetchWithRetry(`https://drive.google.com/uc?export=download&id=${t.driveSrtId}`);
          if (buf) {
            await uploadToR2(t.r2SrtKey, buf, 'text/plain; charset=utf-8');
            console.log(`  ✓ SRT: ${t.titulo}`);
          }
        }
      }
    }
  }
  console.log('\nRetries complete!');
}

main().catch(console.error);
