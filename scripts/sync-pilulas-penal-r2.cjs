const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';
const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

async function downloadDriveFile(fileId) {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  let res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    const text = await res.text();
    const cookies = res.headers.get('set-cookie') || '';
    const formMatch = text.match(/<form[^>]*action="([^"]*)"[^>]*>([\s\S]*?)<\/form>/i);
    if (formMatch) {
      const actionUrl = formMatch[1];
      const inputs = [...formMatch[2].matchAll(/<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"/gi)];
      const params = new URLSearchParams();
      for (const inp of inputs) {
        params.set(inp[1], inp[2]);
      }
      const downloadUrl = `${actionUrl}?${params.toString()}`;
      const res2 = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Cookie': cookies
        }
      });
      const ab = await res2.arrayBuffer();
      return Buffer.from(ab);
    }
  }
  
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function existsInR2(key) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return (head.ContentLength || 0) > 0;
  } catch (e) {
    return false;
  }
}

async function uploadToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000'
  }));
  return `${R2_DOMAIN}/${key}`;
}

async function main() {
  const catalogPath = path.join(__dirname, '../src/data/pilulasDireitoPenalCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  console.log('=== SYNCING PILULAS DIREITO PENAL TO R2 ===\n');

  // Let's sync module by module
  for (let mIdx = 0; mIdx < catalog.length; mIdx++) {
    const mod = catalog[mIdx];
    console.log(`\n[${mIdx + 1}/${catalog.length}] Modulo: ${mod.folderName}`);

    for (let tIdx = 0; tIdx < mod.topicos.length; tIdx++) {
      const t = mod.topicos[tIdx];
      const label = `  (${tIdx + 1}/${mod.topicos.length}) ${t.titulo}`;

      // 1. MP3
      if (t.driveMp3Id && t.r2Mp3Key) {
        const exists = await existsInR2(t.r2Mp3Key);
        if (exists) {
          console.log(`${label} -> MP3 ja existe no R2`);
        } else {
          try {
            console.log(`${label} -> Baixando MP3...`);
            const buf = await downloadDriveFile(t.driveMp3Id);
            console.log(`${label} -> Enviando MP3 ao R2 (${(buf.length / 1024 / 1024).toFixed(2)} MB)...`);
            await uploadToR2(t.r2Mp3Key, buf, 'audio/mpeg');
            console.log(`${label} -> ✓ MP3 enviado ao R2`);
          } catch (e) {
            console.error(`${label} -> ERRO no MP3:`, e.message);
          }
        }
      }

      // 2. SRT
      if (t.driveSrtId && t.r2SrtKey) {
        const exists = await existsInR2(t.r2SrtKey);
        if (exists) {
          // already exists
        } else {
          try {
            const buf = await downloadDriveFile(t.driveSrtId);
            await uploadToR2(t.r2SrtKey, buf, 'text/plain; charset=utf-8');
            console.log(`${label} -> ✓ SRT enviado`);
          } catch (e) {}
        }
      }

      // 3. PDF
      if (t.drivePdfId && t.r2PdfKey) {
        const exists = await existsInR2(t.r2PdfKey);
        if (exists) {
          // already exists
        } else {
          try {
            const buf = await downloadDriveFile(t.drivePdfId);
            await uploadToR2(t.r2PdfKey, buf, 'application/pdf');
            console.log(`${label} -> ✓ PDF enviado`);
          } catch (e) {}
        }
      }
    }
  }

  console.log('\n=== ALL MODULES SYNCED TO R2! ===');
}

main().catch(console.error);

