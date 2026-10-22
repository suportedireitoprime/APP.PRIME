const fs = require('fs');

async function downloadDocx(fileId, outPath) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  console.log(`Baixando file ${fileId} de ${url}...`);
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  
  // Verifica se é um arquivo zip/docx válido (assinatura PK\x03\x04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    fs.writeFileSync(outPath, buffer);
    console.log(`Sucesso! Arquivo .docx válido salvo em ${outPath} (${buffer.length} bytes)`);
    return true;
  } else {
    console.log('Não é um docx válido (pode ser página de confirmação de vírus do Google). Início do conteúdo:');
    console.log(buffer.slice(0, 300).toString('utf8'));
    return false;
  }
}

async function run() {
  await downloadDocx('1gZzggPZ-T8C2aw0ZG_B8mhH85JJDHeiK', 'scratch/sample_resumo.docx');
}

run();
