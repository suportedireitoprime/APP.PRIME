const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

async function checkBucketDomain() {
  const testKey = 'blog/teste-r2-probe.txt';
  const testBody = 'Teste R2 Antigravity ' + Date.now();

  const buckets = ['estudos-juridicos-midias', 'vacatio-midias', 'livros-pdf'];
  for (const b of buckets) {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: b,
        Key: testKey,
        Body: testBody,
        ContentType: 'text/plain'
      }));
      console.log(`Upload para bucket '${b}' SUCESSO!`);

      // Testar qual domínio responde 200
      const domains = [
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev',
        'https://pub-0c1a0e4ebbdd44dfa883dd36c269f19f.r2.dev',
        'https://pub-9cd49875afe549788617b01e97309a55.r2.dev'
      ];
      for (const d of domains) {
        const url = `${d}/${testKey}`;
        try {
          const res = await fetch(url);
          console.log(`  Dominio ${d}/${testKey} -> Status: ${res.status}`);
          if (res.status === 200) {
            console.log(`  ===> MATCH CONFIRMADO: Bucket '${b}' é servido por '${d}'!`);
          }
        } catch (err) {
          console.log(`  Dominio ${d} falhou:`, err.message);
        }
      }

      await s3.send(new DeleteObjectCommand({ Bucket: b, Key: testKey }));
    } catch (e) {
      console.log(`Erro no bucket '${b}':`, e.message);
    }
  }
}

checkBucketDomain().catch(console.error);
