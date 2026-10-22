const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const R2_BUCKET = 'narracoes-leis';
const audios = JSON.parse(fs.readFileSync('scripts/all_drive_audios.json', 'utf8'));

async function downloadDriveFile(driveId) {
  const url = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToR2(key, buffer) {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg'
  });
  return await s3.send(cmd);
}

async function test() {
  const sample = audios.slice(0, 5);
  console.log(`Testando 5 arquivos de amostra...`);

  for (const item of sample) {
    const key = `${item.tabelaNome}/${item.fileName}`;
    process.stdout.write(`Baixando e enviando: ${key} (${item.driveId})... `);
    const buf = await downloadDriveFile(item.driveId);
    console.log(`Baixado (${buf.length} bytes), enviando para R2... `);
    const res = await uploadToR2(key, buf);
    console.log(`✓ R2 ETag: ${res.ETag}`);

    // Test public fetch
    const publicUrl = `https://pub-3e6045d435904ae1916a15ad03bd222b.r2.dev/${encodeURIComponent(item.tabelaNome)}/${encodeURIComponent(item.fileName)}`;
    const check = await fetch(publicUrl, { method: 'HEAD' });
    console.log(`   -> Teste público HEAD status: ${check.status}`);
  }
}

test().catch(console.error);
