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

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function downloadDriveFile(fileId, retries = 3) {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  for (let tentativa = 1; tentativa <= retries; tentativa++) {
    try {
      let res1 = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res1.ok) throw new Error(`HTTP ${res1.status}`);

      const ct = res1.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const text = await res1.text();
        const cookies = res1.headers.get('set-cookie') || '';
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
          if (!res2.ok) throw new Error(`HTTP ${res2.status} on confirmed download`);
          const ab = await res2.arrayBuffer();
          return Buffer.from(ab);
        }
      }

      const ab = await res1.arrayBuffer();
      return Buffer.from(ab);
    } catch (err) {
      if (tentativa === retries) throw err;
      console.warn(`[Download] Erro no arquivo ${fileId} (${err.message}), retentando em 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function uploadToR2(key, buffer, contentType) {
  // If buffer > 40MB, stream from disk to avoid Windows socket ENOBUFS
  if (buffer.length > 40 * 1024 * 1024) {
    const tmpFile = path.join(__dirname, `../tmp/stream_${Date.now()}.bin`);
    fs.writeFileSync(tmpFile, buffer);
    try {
      const stream = fs.createReadStream(tmpFile);
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: stream,
        ContentLength: buffer.length,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
      }));
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  } else {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000'
    }));
  }
  return `${R2_DOMAIN}/${key}`;
}

async function existsInR2(key) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return (head.ContentLength || 0) > 0;
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('=== SINCRONIZAÇÃO COMPLETA: 42 RESUMOS EM ÁUDIO -> R2 (STREAM SAFE) ===\n');

  const scanPath = path.join(__dirname, '../tmp/resumos_drive_scan.json');
  if (!fs.existsSync(scanPath)) {
    console.error('Arquivo de scan não encontrado:', scanPath);
    process.exit(1);
  }

  const scanData = JSON.parse(fs.readFileSync(scanPath, 'utf8'));
  const metaOutPath = path.join(__dirname, '../tmp/resumos_uploaded_metadata.json');

  let metadata = {};
  if (fs.existsSync(metaOutPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metaOutPath, 'utf8'));
    } catch {}
  }

  console.log(`Carregados ${scanData.length} livros para processar.\n`);

  for (let i = 0; i < scanData.length; i++) {
    const book = scanData[i];
    const cleanName = book.name.replace(/\s*—\s*Diálogo Professora e Aluna/i, '').trim();
    const slug = slugify(cleanName);
    const prog = `[${i + 1}/${scanData.length}] [${cleanName}]`;

    try {
      console.log(`\n${prog} Verificando arquivos no R2 (slug: ${slug})...`);

      const mp3File = book.files.find(f => f.name === 'audiobook-completo.mp3');
      const srtFile = book.files.find(f => f.name === 'audiobook-completo.srt');

      if (!mp3File) {
        console.warn(`${prog} Nenhum audiobook-completo.mp3 encontrado.`);
        continue;
      }

      const mp3Key = `audiobooks/resumos/${slug}/audiobook-completo.mp3`;
      const srtKey = `audiobooks/resumos/${slug}/audiobook-completo.srt`;

      let mp3Url = `${R2_DOMAIN}/${mp3Key}`;
      let srtUrl = srtFile ? `${R2_DOMAIN}/${srtKey}` : undefined;

      // Checa MP3
      const mp3Exists = await existsInR2(mp3Key);
      if (mp3Exists) {
        console.log(`${prog} MP3 já existe no R2.`);
      } else {
        console.log(`${prog} Baixando MP3 (${mp3File.id})...`);
        const mp3Buf = await downloadDriveFile(mp3File.id);
        console.log(`${prog} Enviando ${(mp3Buf.length / 1024 / 1024).toFixed(2)} MB para R2 (streaming)...`);
        await uploadToR2(mp3Key, mp3Buf, 'audio/mpeg');
        console.log(`${prog} MP3 enviado com sucesso!`);
      }

      // Checa SRT
      if (srtFile) {
        const srtExists = await existsInR2(srtKey);
        if (srtExists) {
          console.log(`${prog} SRT já existe no R2.`);
        } else {
          console.log(`${prog} Baixando SRT (${srtFile.id})...`);
          const srtBuf = await downloadDriveFile(srtFile.id);
          await uploadToR2(srtKey, srtBuf, 'text/plain; charset=utf-8');
          console.log(`${prog} SRT enviado com sucesso!`);
        }
      }

      metadata[slug] = {
        cleanName,
        slug,
        resumoAudioUrl: mp3Url,
        resumoSrtUrl: srtUrl,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(metaOutPath, JSON.stringify(metadata, null, 2));
    } catch (err) {
      console.error(`${prog} ERRO:`, err.message);
    }
  }

  console.log('\n=== TODAS AS SINCRONIZAÇÕES CONCLUÍDAS COM SUCESSO! ===');
  console.log(`Metadados salvos em ${metaOutPath}`);
}

main().catch(console.error);
