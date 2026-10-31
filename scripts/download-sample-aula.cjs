const fs = require('fs');

async function downloadDriveFile(fileId) {
  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) {
    // fallback para drive.google.com/uc?export=download&id=
    const res2 = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
    return await res2.text();
  }
  return await res.text();
}

async function main() {
  const aulaHtmlId = '17gd4JERJXOpr1mWNdUzfOxnIDBxybwiP';
  const aulaJsonId = '1EWdrxNRGUMzVGT10qbRTW5Xy4eMqmFSP';
  const comoFoiFeitaId = '1Crbvylab8-lXFGHqWgN4KuYyrOhPE8B_';

  console.log('Baixando aula.json...');
  const jsonContent = await downloadDriveFile(aulaJsonId);
  fs.writeFileSync('scratch/aula.json', jsonContent, 'utf8');
  console.log('aula.json salvo! Tamanho:', jsonContent.length);

  console.log('Baixando COMO_FOI_FEITA.md...');
  const mdContent = await downloadDriveFile(comoFoiFeitaId);
  fs.writeFileSync('scratch/COMO_FOI_FEITA.md', mdContent, 'utf8');
  console.log('COMO_FOI_FEITA.md salvo! Tamanho:', mdContent.length);

  console.log('Baixando aula.html...');
  const htmlContent = await downloadDriveFile(aulaHtmlId);
  fs.writeFileSync('scratch/aula.html', htmlContent, 'utf8');
  console.log('aula.html salvo! Tamanho:', htmlContent.length);
}

main().catch(console.error);

