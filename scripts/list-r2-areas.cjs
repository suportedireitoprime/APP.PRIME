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

async function listR2AreaFolders() {
  console.log('Listando subpastas de narracoes/areas/ no bucket vacatio-midias...');
  const res = await s3.send(new ListObjectsV2Command({
    Bucket: 'vacatio-midias',
    Prefix: 'narracoes/areas/',
    Delimiter: '/'
  }));

  const areas = (res.CommonPrefixes || []).map(cp => {
    return cp.Prefix.replace('narracoes/areas/', '').replace('/', '');
  });

  console.log(`Encontradas ${areas.length} áreas em vacatio-midias (narracoes/areas/):`);
  areas.forEach(a => console.log(` - ${a}`));

  // Also check if any other prefix exists, like audioaulas/areas/
  const res2 = await s3.send(new ListObjectsV2Command({
    Bucket: 'vacatio-midias',
    Prefix: 'audioaulas/areas/',
    Delimiter: '/'
  }));
  const areas2 = (res2.CommonPrefixes || []).map(cp => {
    return cp.Prefix.replace('audioaulas/areas/', '').replace('/', '');
  });
  console.log(`\nEncontradas ${areas2.length} áreas em vacatio-midias (audioaulas/areas/):`);
  areas2.forEach(a => console.log(` - ${a}`));

  // Also check if audio-aulas bucket has any files with delimiter
  const res3 = await s3.send(new ListObjectsV2Command({
    Bucket: 'audio-aulas',
    Delimiter: '/'
  }));
  console.log(`\nBucket audio-aulas common prefixes:`, res3.CommonPrefixes);

  return { r2NarracoesAreas: areas, r2AudioaulasAreas: areas2 };
}

listR2AreaFolders().then(data => {
  fs.writeFileSync('scripts/r2_areas_found.json', JSON.stringify(data, null, 2));
}).catch(console.error);
