const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';
const DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

async function testUpload() {
  // 1. Upload de imagem de teste
  const imgPath = 'scratch/unpacked_sample/word/media/image2.png';
  if (fs.existsSync(imgPath)) {
    const imgBuffer = fs.readFileSync(imgPath);
    const imgKey = 'resumos/imagens/direito-penal/crimes-funcionario-publico/cap01-introducao.png';
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: imgKey,
      Body: imgBuffer,
      ContentType: 'image/png'
    }));
    console.log(`Imagem enviada com sucesso: ${DOMAIN}/${imgKey}`);
    
    // Testa fetch
    const res = await fetch(`${DOMAIN}/${imgKey}`);
    console.log(`Status HTTP imagem: ${res.status} (${res.headers.get('content-type')})`);
  }

  // 2. Download de um áudio do Drive e upload para o R2
  const audioDriveId = '1yePM3ISxsmLpR_FVMJkgow0IshshCOAR'; // cap01-introducao.mp3
  console.log(`Baixando áudio do Google Drive: ${audioDriveId}...`);
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${audioDriveId}`;
  const audioRes = await fetch(downloadUrl);
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
  console.log(`Áudio baixado: ${audioBuffer.length} bytes`);

  const audioKey = 'resumos/audio/direito-penal/crimes-funcionario-publico/cap01-introducao.mp3';
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: audioKey,
    Body: audioBuffer,
    ContentType: 'audio/mpeg'
  }));
  console.log(`Áudio enviado com sucesso: ${DOMAIN}/${audioKey}`);

  const checkAudio = await fetch(`${DOMAIN}/${audioKey}`);
  console.log(`Status HTTP áudio: ${checkAudio.status} (${checkAudio.headers.get('content-type')}, bytes: ${checkAudio.headers.get('content-length')})`);
}

testUpload().catch(console.error);
