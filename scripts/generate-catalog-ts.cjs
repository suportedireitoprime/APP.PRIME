const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('scripts/pending_audioaulas_manifest.json', 'utf8'));
const allItems = [...manifest.civil, ...manifest.procCivil, ...manifest.tributario];

let startId = 50001;
const catalogRows = allItems.map((item, index) => {
  return {
    id: startId + index,
    area: item.area,
    tema: item.tema,
    sequencia: item.sequencia || (index + 1),
    titulo: item.titulo,
    descricao: '',
    url_audio: item.r2Url,
    r2_key: item.r2Key
  };
});

const tsContent = `// Catálogo pré-carregado de Áudioaulas (Direito Civil, Processo Civil e Direito Tributário)
// Sincronizado do Cloudflare R2 (bucket vacatio-midias / narracoes/areas/)
import type { AulaAudio } from '@/contexts/AudioaulasPlayerContext';

export const NOVAS_AUDIOAULAS_CATALOG: AulaAudio[] = ${JSON.stringify(catalogRows, null, 2)};
`;

fs.writeFileSync('src/data/novasAudioaulasCatalog.ts', tsContent, 'utf8');
console.log(`Gerado src/data/novasAudioaulasCatalog.ts com ${catalogRows.length} aulas!`);
