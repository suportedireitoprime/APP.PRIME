const fs = require('fs');

const htmlPath = 'C:/Users/ext_wpereira/.gemini/antigravity-ide/brain/22b5cd56-d5fa-4a7b-8b79-ecf3acdd05c3/.system_generated/steps/206/content.md';
const content = fs.readFileSync(htmlPath, 'utf8');

// Procura ocorrências de arquivos no HTML do Google Drive
// O Google Drive armazena os dados dos arquivos em estruturas de dados JSON nos scripts
const lines = content.split('\n');
console.log('Total de linhas:', lines.length);

// Procura blocos que contenham extensões ou nomes
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('.docx') || line.includes('.mp3') || line.includes('.doc') || line.includes('Resumo')) {
    console.log(`Linha ${i + 1} contém match:`, line.slice(0, 300));
  }
}
