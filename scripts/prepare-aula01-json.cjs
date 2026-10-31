const fs = require('fs');

const json = JSON.parse(fs.readFileSync('scratch/aula.json', 'utf8'));
const R2_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia';

json.capaUrl = `${R2_BASE}/capa-3x4.webp`;

json.etapas.forEach(e => {
  if (e.imagem) {
    const filename = e.imagem.split('/').pop();
    e.imagemUrl = `${R2_BASE}/imagens/${filename}`;
  }
  if (e.audio) {
    const filename = e.audio.split('/').pop();
    e.audioUrl = `${R2_BASE}/audio/${filename}`;
  }
});

fs.writeFileSync('scratch/aula01_r2.json', JSON.stringify(json, null, 2), 'utf8');
console.log('JSON com URLs R2 gerado com sucesso! Total etapas:', json.etapas.length);

