const fs = require('fs');

const raw = fs.readFileSync('scripts/blog_drive_scan.json', 'utf8');
const data = JSON.parse(raw);

// Pegar um arquivo da pasta 1
const p1Sub = data[0].scan.subfolders[0];
const sample1 = p1Sub.files.find(f => f.name.endsWith('.docx'));

// Pegar um arquivo da pasta 2
const p2Sub = data[1].scan.subfolders[0];
const sample2 = p2Sub.files.find(f => f.name.endsWith('.docx'));

console.log('Sample 1 (Pasta 1):', sample1);
console.log('Sample 2 (Pasta 2):', sample2);

async function downloadSample(file, outName) {
  const url = `https://drive.google.com/uc?export=download&id=${file.id}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const buf = await res.arrayBuffer();
  fs.writeFileSync(outName, Buffer.from(buf));
  console.log(`Baixado: ${outName} (${buf.byteLength} bytes)`);
}

async function run() {
  if (sample1) await downloadSample(sample1, 'scripts/sample1.docx');
  if (sample2) await downloadSample(sample2, 'scripts/sample2.docx');
}
run().catch(console.error);
