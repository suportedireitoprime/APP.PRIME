const JSZip = require('jszip');

const id = '1HoaWHDzOLSUFkGmm5TJT57LO9vVxaSaC';

async function test() {
  const u = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
  const res = await fetch(u);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());

  const relsXml = await zip.files['word/_rels/document.xml.rels'].async('text');
  const imgRels = {};
  const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
  let m;
  while ((m = relRegex.exec(relsXml)) !== null) {
    if (m[2].includes('media/')) {
      const fileName = m[2].split('/').pop();
      imgRels[m[1]] = fileName;
    }
  }
  console.log('Image Rels mapped:', imgRels);

  const docXml = await zip.files['word/document.xml'].async('text');
  const pTags = docXml.match(/<w:p(?:\s|>).*?<\/w:p>/g) || [];
  console.log('Total paragraphs:', pTags.length);

  pTags.forEach((p, idx) => {
    // Check for images in this paragraph
    const blipMatches = [];
    const blipRegex = /(?:r:embed|r:id)="([^"]+)"/g;
    let bm;
    while ((bm = blipRegex.exec(p)) !== null) {
      if (imgRels[bm[1]]) {
        blipMatches.push({ rId: bm[1], file: imgRels[bm[1]] });
      }
    }

    const text = p.replace(/<[^>]+>/g, '').trim();
    if (blipMatches.length > 0 || text) {
      if (blipMatches.length > 0) {
        console.log(`\n[P #${idx}] IMAGEM AQUI ->`, blipMatches);
      }
      if (text) {
        console.log(`[P #${idx}] TEXTO:`, text.slice(0, 80));
      }
    }
  });
}

test().catch(console.error);
