const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkAll() {
  const buckets = ['audio-aulas', 'estudos-juridicos-midias', 'narracoes-leis', 'vacatio-midias', 'livros-pdf'];
  for (const b of buckets) {
    try {
      const res = await s3.send(new ListObjectsV2Command({ Bucket: b, MaxKeys: 50 }));
      console.log(`Bucket ${b}: count sample = ${res.Contents ? res.Contents.length : 0}, isTruncated = ${res.IsTruncated}`);
      if (res.Contents && res.Contents.length > 0) {
        console.log(`Sample keys in ${b}:`, res.Contents.slice(0, 5).map(x => x.Key));
      }
    } catch (e) {
      console.error(`Error listing bucket ${b}:`, e.message);
    }
  }

  // Also check sample audio URLs in supabase
  try {
    const { data, error } = await supabase.from('audioaulas_acervo').select('area, tema, titulo, url_audio').not('url_audio', 'is', null).limit(10);
    console.log('Supabase audioaulas sample url_audio:', data);
  } catch (e) {
    console.error('Supabase error:', e.message);
  }
}
checkAll();
