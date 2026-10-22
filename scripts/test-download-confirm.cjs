const id = '1h3r5y9G2gOrT8zVWyHYMtGvGaVZSosCd';

async function test() {
  const u1 = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
  const r1 = await fetch(u1);
  const cookie = r1.headers.get('set-cookie');
  const html = await r1.text();

  const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/);
  const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
  const confirmVal = confirmMatch ? confirmMatch[1] : 't';
  const uuidVal = uuidMatch ? uuidMatch[1] : '';

  const u2 = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirmVal}&uuid=${uuidVal}`;
  console.log('Fetching u2:', u2);
  const r2 = await fetch(u2, {
    headers: {
      Cookie: cookie || ''
    }
  });
  console.log('r2 status:', r2.status);
  for (const [k, v] of r2.headers.entries()) {
    console.log(`Header ${k}: ${v}`);
  }
  const ab = await r2.arrayBuffer();
  console.log('r2 byteLength:', ab.byteLength);
  console.log('r2 magic bytes:', Buffer.from(ab.slice(0, 4)).toString('hex')); // zip is 504b0304
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(ab);
  console.log('Zip loaded successfully! Files inside:', Object.keys(zip.files).length);
}

test().catch(console.error);
