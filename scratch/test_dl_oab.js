import fs from 'fs';

async function testDownload() {
  const allAudios = JSON.parse(fs.readFileSync('scratch/all_oab_audios.json', 'utf8'));
  const first = allAudios[0];
  console.log('Testing download of:', first);

  const urls = [
    `https://drive.usercontent.google.com/download?id=${first.id}&export=download&authuser=0`,
    `https://drive.google.com/uc?export=download&id=${first.id}`
  ];

  for (const url of urls) {
    try {
      console.log('Trying URL:', url);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
      const buf = await res.arrayBuffer();
      console.log('Bytes received:', buf.byteLength);
      if (buf.byteLength > 10000) {
        fs.writeFileSync('scratch/sample_oab.mp3', Buffer.from(buf));
        console.log('Downloaded successfully and saved sample_oab.mp3');
        return;
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testDownload().catch(console.error);
