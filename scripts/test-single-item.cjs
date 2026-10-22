const fs = require('fs');
const JSZip = require('jszip');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});
const R2_BUCKET = 'estudos-juridicos-midias';
const R2_PUBLIC_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const id = '1HoaWHDzOLSUFkGmm5TJT57LO9vVxaSaC';

async function run() {
  console.time('download');
  const u = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
  const res = await fetch(u);
  const buf = Buffer.from(await res.arrayBuffer());
  console.timeEnd('download');
  console.log('Downloaded bytes:', buf.length);

  console.time('zip');
  const zip = await JSZip.loadAsync(buf);
  console.timeEnd('zip');

  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  console.log('Media files:', mediaFiles);

  console.time('uploadR2');
  for (const m of mediaFiles) {
    const data = await zip.files[m].async('nodebuffer');
    const ext = m.split('.').pop().toLowerCase();
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: `blog/imagens/teste/${m.split('/').pop()}`,
      Body: data,
      ContentType: ext === 'png' ? 'image/png' : 'image/jpeg'
    });
    await s3.send(cmd);
    console.log('Uploaded image:', m);
  }
  console.timeEnd('uploadR2');

  console.time('upsert');
  const { error } = await supabase.from('blog_edicao_posts').upsert([{
    id: 'teste-artigo-123',
    titulo: 'Condições da Ação Teste',
    resumo: 'Resumo teste',
    conteudo_md: '# Teste\n\nConteudo...',
    imagem_url: `${R2_PUBLIC_BASE}/blog/imagens/teste/image1.jpg`,
    categoria: 'Direito Processual',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 4,
    publicado: true,
    data_publicacao: new Date().toISOString()
  }]);
  console.timeEnd('upsert');
  if (error) console.error('Erro upsert:', error);
  else console.log('Sucesso!');
}

run().catch(console.error);
