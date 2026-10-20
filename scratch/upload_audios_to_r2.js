import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '3372ef3eff66f9d766be0175549a5970',
    secretAccessKey: '6c73e9a65b74a4e456225ef2efc8596f9ca8f4371c094b40e8495ba7e89f9146',
  },
});

const files = [
  {
    url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/vinhetas/intro_audioaulas.mp3',
    key: 'audios/vinhetas/intro_audioaulas.mp3',
    contentType: 'audio/mpeg'
  },
  {
    url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/audio-intro-2.mp3',
    key: 'audios/audio-intro-2.mp3',
    contentType: 'audio/mpeg'
  }
];

const buckets = ['vacatio-midias', 'estudos-juridicos-midias'];

async function main() {
  for (const item of files) {
    console.log(`Baixando ${item.url}...`);
    const resp = await fetch(item.url);
    if (!resp.ok) {
      console.error(`Falha ao baixar ${item.url}: ${resp.status}`);
      continue;
    }
    const buf = Buffer.from(await resp.arrayBuffer());

    for (const bucket of buckets) {
      console.log(`Enviando ${item.key} para ${bucket}...`);
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: item.key,
        Body: buf,
        ContentType: item.contentType,
        CacheControl: 'public, max-age=31536000, immutable'
      }));
      console.log(`OK: ${bucket}/${item.key}`);
    }
  }
  console.log('Finalizado com sucesso!');
}

main().catch(console.error);
