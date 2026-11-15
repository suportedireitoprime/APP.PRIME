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

async function listAll(prefix) {
  let continuationToken = undefined;
  const keys = [];
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken
    }));
    if (res.Contents) {
      for (const obj of res.Contents) {
        keys.push(obj.Key);
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

async function main() {
  const audioaulas = await listAll('audioaulas/');
  console.log(`Total in audioaulas/: ${audioaulas.length}`);
  fs.writeFileSync('r2_audioaulas.json', JSON.stringify(audioaulas, null, 2), 'utf-8');

  const aulasInterativas = await listAll('aulas-interativas/');
  console.log(`Total in aulas-interativas/: ${aulasInterativas.length}`);
  fs.writeFileSync('r2_aulas_interativas.json', JSON.stringify(aulasInterativas, null, 2), 'utf-8');
}

main().catch(console.error);

