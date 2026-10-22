const fs = require('fs');
const JSZip = require('jszip');

async function inspectDocx(filePath) {
  console.log(`\n=== Inspecionando: ${filePath} ===`);
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);

  // Listar arquivos no zip
  const files = Object.keys(zip.files);
  const mediaFiles = files.filter(f => f.startsWith('word/media/'));
  console.log(`Imagens encontradas em word/media/ (${mediaFiles.length}):`);
  for (const m of mediaFiles) {
    const fObj = zip.files[m];
    const data = await fObj.async('nodebuffer');
    console.log(`  - ${m} (${data.length} bytes)`);
  }

  // Ler o document.xml
  if (zip.files['word/document.xml']) {
    const xml = await zip.files['word/document.xml'].async('text');
    // Extrair parágrafos
    const paras = xml.match(/<w:p(?:\s|>).*?<\/w:p>/g) || [];
    console.log(`Parágrafos totais: ${paras.length}`);
    const sampleText = paras.slice(0, 10).map(p => {
      const texts = p.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [];
      return texts.map(t => t.replace(/<[^>]+>/g, '')).join('');
    }).filter(Boolean);
    console.log(`Trecho inicial do texto:\n`, sampleText.slice(0, 5).join('\n'));
  }
}

async function run() {
  await inspectDocx('scripts/sample1.docx');
  await inspectDocx('scripts/sample2.docx');
}
run().catch(console.error);
