const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';

async function listPrefixes() {
  const prefixes = ['aulas/', 'audioaulas/', 'interativas/', 'capas/'];
  for (const p of prefixes) {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: p,
      MaxKeys: 10
    }));
    console.log(`Prefix "${p}": found ${res.KeyCount || 0} objects (isTruncated: ${res.IsTruncated})`);
    if (res.Contents) {
      res.Contents.forEach(c => console.log('   ', c.Key));
    }
  }

  // Also check root prefixes with delimiter '/'
  const rootRes = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Delimiter: '/'
  }));
  console.log('Root CommonPrefixes:');
  if (rootRes.CommonPrefixes) {
    rootRes.CommonPrefixes.forEach(cp => console.log('   ', cp.Prefix));
  }
}

listPrefixes().catch(console.error);

