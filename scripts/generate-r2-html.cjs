const fs = require('fs');

const html = fs.readFileSync('scratch/aula.html', 'utf8');
const mediaMap = JSON.parse(fs.readFileSync('scratch/media_map_aula01.json', 'utf8'));

let finalHtml = html;

// Substituir URLs de imagens: "assets/img/<nome>.webp" -> R2 URL
for (const [imgName, r2Url] of Object.entries(mediaMap.imagens)) {
  const localRef = `assets/img/${imgName}`;
  finalHtml = finalHtml.replaceAll(localRef, r2Url);
}

// Substituir URLs de áudios: "assets/audio/<nome>.mp3" -> R2 URL
for (const [audioName, r2Url] of Object.entries(mediaMap.audios)) {
  const localRef = `assets/audio/${audioName}`;
  finalHtml = finalHtml.replaceAll(localRef, r2Url);
}

// Se tiver capa 3x4
if (mediaMap.capa) {
  finalHtml = finalHtml.replaceAll('capa-3x4.webp', mediaMap.capa);
}

fs.writeFileSync('scratch/aula01_standalone_r2.html', finalHtml, 'utf8');
console.log('HTML com links do R2 gerado com sucesso! Tamanho:', finalHtml.length);

