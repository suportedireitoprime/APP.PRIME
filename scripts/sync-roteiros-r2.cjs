const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

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

async function uploadToR2(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));
}

async function fetchWithRetry(url, retries = 4, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const text = await res.text();
        if (text && !text.includes('<!doctype html>')) return text;
      }
    } catch {}
    await new Promise(r => setTimeout(r, delay * (i + 1)));
  }
  return null;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync('src/data/pilulasDireitoPenalCatalog.json', 'utf8'));
  console.log('Syncing all roteiro.txt to R2...');

  let count = 0;
  for (const mod of catalog) {
    for (const t of mod.topicos) {
      if (t.driveTxtId && t.r2TxtKey) {
        try {
          // Check if already in R2
          let exists = false;
          try {
            await s3.send(new HeadObjectCommand({ Bucket: R2_CONFIG.bucket, Key: t.r2TxtKey }));
            exists = true;
          } catch {}

          if (!exists) {
            const txt = await fetchWithRetry(`https://drive.google.com/uc?export=download&id=${t.driveTxtId}`);
            if (txt) {
              await uploadToR2(t.r2TxtKey, Buffer.from(txt, 'utf8'), 'text/plain; charset=utf-8');
              count++;
              if (count % 20 === 0) console.log(`Uploaded ${count} roteiros...`);
            }
          }
        } catch (e) {
          // continue
        }
      }
    }
  }
  console.log(`Done! Total uploaded: ${count}`);
}

main().catch(console.error);

