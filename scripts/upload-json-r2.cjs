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
const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

async function main() {
  const jsonContent = fs.readFileSync('scratch/aula01_r2.json', 'utf8');
  const key = 'aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.json';

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: Buffer.from(jsonContent, 'utf8'),
    ContentType: 'application/json; charset=utf-8',
    CacheControl: 'no-cache, no-store, must-revalidate, max-age=0'
  }));

  const url = `${R2_DOMAIN}/${key}`;
  console.log('aula.json enviado ao R2:', url);
}

main().catch(console.error);

