const fs = require('fs');

const html = fs.readFileSync('scripts/gdrive.html', 'utf8');

// Procura ocorrências de extensões de áudio como .mp3, .m4a, .wav, .aac, .ogg
const audioExtRegex = /([a-zA-Z0-9_\-\.\s\(\)]+\.(?:mp3|m4a|wav|aac|ogg))/gi;
const foundAudioNames = [...new Set(html.match(audioExtRegex) || [])];
console.log('Audio file names found:', foundAudioNames.length);
console.log('Sample audio file names:', foundAudioNames.slice(0, 20));

// Tenta encontrar blocos de dados de arquivos (geralmente [id, [name, mimeType, ...]])
// No Google Drive, o data-initial-data ou _DRIVE_ivd contém arrays JSON serializados
const idRegex = /([a-zA-Z0-9_-]{28,35})/g;
const allIds = [...new Set(html.match(idRegex) || [])];
console.log('Unique potential Drive IDs:', allIds.length);

// Procurar padrões JSON de arquivos
const files = [];
const fileBlockRegex = /\["([a-zA-Z0-9_-]{25,})",\["([^"]+)",(?:[^,]+,)*"([^"]+)"\]/g;
let m;
while ((m = fileBlockRegex.exec(html)) !== null) {
  files.push({ id: m[1], name: m[2], mime: m[3] });
}
console.log('Structured files found:', files.length);
if (files.length > 0) {
  console.log('Sample structured files:', files.slice(0, 10));
}
