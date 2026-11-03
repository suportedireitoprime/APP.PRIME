const https = require('https');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';
const existingKeys = new Set(JSON.parse(fs.readFileSync('r2_aulas_interativas.json', 'utf-8')));

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

function downloadDriveFile(id) {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function uploadCapas() {
  const gdriveItems = JSON.parse(fs.readFileSync('gdrive_items.json', 'utf-8'));
  const capasFolders = gdriveItems.filter(f => f.name.startsWith('Capas das Aulas:'));
  console.log(`Found ${capasFolders.length} Capas folders.`);

  let totalUploaded = 0;
  let totalSkipped = 0;

  for (const cf of capasFolders) {
    const materiaName = cf.name.replace('Capas das Aulas:', '').trim();
    const materiaSlug = slugify(materiaName);
    console.log(`\nProcessing capas for [${materiaName}] (slug: ${materiaSlug})...`);

    const files = await fetchFolder(cf.id);
    console.log(`  Found ${files.length} cover files.`);

    // Upload in parallel batches of 5
    for (let i = 0; i < files.length; i += 5) {
      const batch = files.slice(i, i + 5);
      await Promise.all(batch.map(async (f) => {
        const fileSlug = slugify(f.name.replace(/\.[^.]+$/, '')) + '.webp';
        const r2Key = `aulas-interativas/capas/${materiaSlug}/${fileSlug}`;

        if (existingKeys.has(r2Key)) {
          totalSkipped++;
          return;
        }

        try {
          const buf = await downloadDriveFile(f.id);
          if (buf.length > 0) {
            await s3.send(new PutObjectCommand({
              Bucket: BUCKET,
              Key: r2Key,
              Body: buf,
              ContentType: 'image/webp'
            }));
            existingKeys.add(r2Key);
            totalUploaded++;
            process.stdout.write('+');
          }
        } catch (err) {
          console.error(`\nFailed cover ${f.name}:`, err.message);
        }
      }));
    }
  }

  console.log(`\n\nCapas summary: Uploaded: ${totalUploaded}, Skipped (Already in R2): ${totalSkipped}`);
}

uploadCapas().catch(console.error);

