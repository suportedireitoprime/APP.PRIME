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

async function inspectAudioAulas() {
  // 1. Check in all buckets for prefix 'narracoes/areas' or 'narracoes'
  const buckets = ['vacatio-midias', 'estudos-juridicos-midias', 'narracoes-leis', 'audio-aulas', 'livros-pdf'];
  for (const b of buckets) {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: b,
      Prefix: 'narracoes/areas',
      MaxKeys: 20
    }));
    console.log(`Bucket ${b} with Prefix 'narracoes/areas': count = ${res.Contents ? res.Contents.length : 0}`);
    if (res.Contents && res.Contents.length > 0) {
      console.log(`Exemplos em ${b}:`, res.Contents.slice(0, 5).map(x => x.Key));
    }

    const res2 = await s3.send(new ListObjectsV2Command({
      Bucket: b,
      Prefix: 'audioaulas/areas',
      MaxKeys: 20
    }));
    console.log(`Bucket ${b} with Prefix 'audioaulas/areas': count = ${res2.Contents ? res2.Contents.length : 0}`);
    if (res2.Contents && res2.Contents.length > 0) {
      console.log(`Exemplos em ${b}:`, res2.Contents.slice(0, 5).map(x => x.Key));
    }
  }

  // 2. Also let's list all distinct areas in Supabase audioaulas_acervo that have url_audio populated
  let from = 0;
  const areaAudioMap = {};
  while (true) {
    const { data, error } = await supabase
      .from('audioaulas_acervo')
      .select('area, url_audio')
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const row of data) {
      const area = (row.area || 'Sem Área').trim();
      if (!areaAudioMap[area]) {
        areaAudioMap[area] = { total: 0, withUrl: 0, sampleUrl: null };
      }
      areaAudioMap[area].total++;
      if (row.url_audio && row.url_audio.trim().length > 0) {
        areaAudioMap[area].withUrl++;
        if (!areaAudioMap[area].sampleUrl) areaAudioMap[area].sampleUrl = row.url_audio;
      }
    }
    from += 1000;
    if (data.length < 1000) break;
  }

  console.log('\n--- STATUS NO SUPABASE (audioaulas_acervo) ---');
  console.log(JSON.stringify(areaAudioMap, null, 2));
}

inspectAudioAulas().catch(console.error);
