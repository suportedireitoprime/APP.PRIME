const fs = require('fs');

const parsed = JSON.parse(fs.readFileSync('scratch/principios_penais_parsed.json', 'utf8'));

// 1. Atualizar aulasInterativasCatalogoCompleto.ts
let catalogoContent = fs.readFileSync('src/data/aulasInterativasCatalogoCompleto.ts', 'utf8');

for (const [id, data] of Object.entries(parsed)) {
  if (data.urlHtmlR2) {
    // Regex para achar o bloco do ID e substituir urlHtmlR2: ""
    const blockRegex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"urlHtmlR2":\\s*)"([^"]*)"`);
    catalogoContent = catalogoContent.replace(blockRegex, `$1"${data.urlHtmlR2}"`);
    // Atualizar também o número de etapas
    const etapasRegex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"etapas":\\s*)\\d+`);
    catalogoContent = catalogoContent.replace(etapasRegex, `$1${data.totalEtapas}`);
  }
}

fs.writeFileSync('src/data/aulasInterativasCatalogoCompleto.ts', catalogoContent, 'utf8');
console.log('Catálogo atualizado com urlHtmlR2 e etapas reais para as 9 aulas!');

// 2. Injetar em aulasConteudoRealData.ts para carregamento instantâneo a 0ms e offline
let realContent = fs.readFileSync('src/data/aulasConteudoRealData.ts', 'utf8');

// Achar a última chave antes do fechamento `};`
const lastClosingIdx = realContent.lastIndexOf('};');
if (lastClosingIdx !== -1) {
  let injection = '';
  for (const [id, data] of Object.entries(parsed)) {
    injection += `  "${id}": ${JSON.stringify(data, null, 2)},\n`;
  }
  const newContent = realContent.slice(0, lastClosingIdx) + injection + realContent.slice(lastClosingIdx);
  fs.writeFileSync('src/data/aulasConteudoRealData.ts', newContent, 'utf8');
  console.log('aulasConteudoRealData.ts atualizado com as 9 aulas completas!');
}

