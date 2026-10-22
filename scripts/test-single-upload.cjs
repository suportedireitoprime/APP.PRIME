const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});
const BUCKET = 'vacatio-midias';

async function downloadDriveFile(driveId, retries = 3) {
  const url = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function testSingleUpload() {
  const manifest = JSON.parse(fs.readFileSync('scripts/pending_audioaulas_manifest.json', 'utf8'));
  const testItem = manifest.civil[0];
  console.log('Testando download e upload para item:', testItem.titulo);
  console.log('Drive ID:', testItem.driveId);
  console.log('R2 Key:', testItem.r2Key);

  const buf = await downloadDriveFile(testItem.driveId);
  console.log(`Download OK! Tamanho: ${buf.length} bytes (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: testItem.r2Key,
    Body: buf,
    ContentType: 'audio/mpeg'
  });
  await s3.send(cmd);
  console.log('Upload para R2 realizado com sucesso!');

  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: testItem.r2Key }));
  console.log('Verificação HeadObject R2:', { contentLength: head.ContentLength, contentType: head.ContentType });

  // Test fetch public URL
  const pubRes = await fetch(testItem.r2Url, { method: 'HEAD' });
  console.log('Status da URL pública R2:', pubRes.status, pubRes.headers.get('content-type'));
}

testSingleUpload().catch(console.error);
