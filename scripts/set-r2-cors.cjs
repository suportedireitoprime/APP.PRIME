const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

const R2_CONFIG = {
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
  secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc',
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

const corsRules = [
  {
    AllowedHeaders: ['*'],
    AllowedMethods: ['GET', 'HEAD'],
    AllowedOrigins: ['*'],
    MaxAgeSeconds: 86400,
  },
];

async function setCorsOnBucket(bucket) {
  console.log(`Aplicando CORS no bucket: ${bucket}...`);
  await s3.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: corsRules,
    },
  }));
  const res = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log(`✓ CORS ativo no bucket ${bucket}:`, JSON.stringify(res.CORSRules));
}

async function main() {
  const buckets = ['livros-pdf', 'estudos-juridicos-midias', 'audio-aulas', 'narracoes-leis', 'vacatio-midias'];
  for (const b of buckets) {
    try {
      await setCorsOnBucket(b);
    } catch (e) {
      console.error(`Erro no bucket ${b}:`, e.message);
    }
  }
}

main().catch(console.error);
