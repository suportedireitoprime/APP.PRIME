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
const R2_PREFIX = 'aulas-interativas/trilhas-modulos/capas';

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

async function fileExistsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key
    }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
}

async function uploadToR2(key, buffer, contentType = 'image/webp') {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable'
  }));
}

async function main() {
  const mappingPath = 'C:/Users/ext_wpereira/.gemini/antigravity/brain/dd21ad5e-0e2e-4bc6-b4ba-29d49b970504/scratch/drive_mapping.json';
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

  console.log(`Iniciando sincronização de ${mapping.length} capas para o Cloudflare R2...`);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Prefixo: ${R2_PREFIX}`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < mapping.length; i++) {
    const item = mapping[i];
    const key = `${R2_PREFIX}/${item.name}`;
    const publicUrl = `${R2_DOMAIN}/${key}`;
    process.stdout.write(`[${i + 1}/${mapping.length}] ${item.name}... `);

    try {
      const exists = await fileExistsInR2(key);
      if (exists) {
        console.log(`JÁ EXISTE no R2 (Skip) -> ${publicUrl}`);
        skippedCount++;
        continue;
      }

      const buffer = await downloadDriveFile(item.id);
      if (!buffer || buffer.length < 500) {
        console.log(`ERRO: Buffer inválido (${buffer?.length || 0} bytes)`);
        failedCount++;
        continue;
      }

      await uploadToR2(key, buffer, 'image/webp');
      console.log(`UPLOAD OK (${Math.round(buffer.length / 1024)} KB) -> ${publicUrl}`);
      uploadedCount++;
    } catch (err) {
      console.log(`FALHA: ${err.message}`);
      failedCount++;
    }
  }

  console.log('\n--- RESUMO DO UPLOAD ---');
  console.log(`Enviados com sucesso: ${uploadedCount}`);
  console.log(`Já existiam (pulados): ${skippedCount}`);
  console.log(`Falhas: ${failedCount}`);
}

main().catch(console.error);
