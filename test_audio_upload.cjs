const https = require('https');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

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

async function test() {
  console.log('Downloading test audio s01.mp3 (id: 1G8-LqvvDJJKZI3WcpErCav1vU7DbYnGA)...');
  const buf = await downloadDriveFile('1G8-LqvvDJJKZI3WcpErCav1vU7DbYnGA');
  console.log('Audio bytes:', buf.length);

  await s3.send(new PutObjectCommand({
    Bucket: 'estudos-juridicos-midias',
    Key: 'aulas-interativas/teste-pipeline/s01.mp3',
    Body: buf,
    ContentType: 'audio/mpeg'
  }));
  console.log('Audio upload OK!');
}

test().catch(console.error);

