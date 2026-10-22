const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '9946baad5f56599bbd60f978621f2129',
    secretAccessKey: '23eed9cddfa1428a277e9d5fe5b9b5e5c28ad0aac49fdf4f5720ed85d411b9da'
  }
});

async function run() {
  try {
    const res = await s3.send(new PutObjectCommand({
      Bucket: 'livros-pdf',
      Key: 'test-antigravity.txt',
      Body: 'Hello R2!',
      ContentType: 'text/plain'
    }));
    console.log('Upload success, ETag:', res.ETag);
    await s3.send(new DeleteObjectCommand({ Bucket: 'livros-pdf', Key: 'test-antigravity.txt' }));
    console.log('Delete success!');
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
