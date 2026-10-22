const fs = require('fs');

const htmlPath = 'C:/Users/ext_wpereira/.gemini/antigravity-ide/brain/22b5cd56-d5fa-4a7b-8b79-ecf3acdd05c3/.system_generated/steps/206/content.md';
const content = fs.readFileSync(htmlPath, 'utf8');

// Regex para encontrar itens do Drive: no HTML padrão do Drive, cada item vem em arrays como:
// ["ID",["Nome do arquivo", ...], "mimeType"]
// Vamos buscar ocorrências de docx, mp3, pdf, pastas, etc.

const filePattern = /([a-zA-Z0-9_\-\s\u00C0-\u00FF]+\.(?:docx|doc|mp3|m4a|zip|pdf|png|jpg|jpeg))/gi;
const found = content.match(filePattern);
console.log('Arquivos encontrados:', Array.from(new Set(found || [])));

// Procura por pastas e arquivos estruturados nos scripts
const driveIdRegex = /"([a-zA-Z0-9_-]{28,45})"/g;
let match;
const ids = new Set();
while ((match = driveIdRegex.exec(content)) !== null) {
  ids.add(match[1]);
}
console.log('Total IDs potenciais:', ids.size);

// Procura padrões de nomes com extensões ou palavras de direito
const direitoWords = content.match(/(Direito\s+[a-zA-Z\u00C0-\u00FF]+|Constitucional|Administrativo|Civil|Penal|Processual|Tributário|Trabalho)/gi);
console.log('Palavras encontradas:', Array.from(new Set(direitoWords || [])).slice(0, 15));
