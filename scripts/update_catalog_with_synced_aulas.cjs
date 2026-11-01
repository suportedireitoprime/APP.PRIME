const fs = require('fs');
const path = require('path');

const discData = JSON.parse(fs.readFileSync(path.join(__dirname, '4_disciplinas_completo.json'), 'utf8'));
const progress = JSON.parse(fs.readFileSync(path.join(__dirname, 'aulas_full_sync_progress.json'), 'utf8'));

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DISC_MAP = {
  'Direito Penal': 'penal',
  'Direito Administrativo': 'administrativo',
  'Direito Constitucional': 'constitucional',
  'Direito do Trabalho': 'trabalho'
};
const DISC_SLUG_MAP = {
  'Direito Penal': 'direito-penal',
  'Direito Administrativo': 'direito-administrativo',
  'Direito Constitucional': 'direito-constitucional',
  'Direito do Trabalho': 'direito-do-trabalho'
};

// Mapa de pesquisa por disciplina + título limpo
const lookup = new Map();
for (const [discNome, discSlug] of Object.entries(DISC_SLUG_MAP)) {
  const materias = discData[discNome] || [];
  const discId = DISC_MAP[discNome];
  for (const mat of materias) {
    const matSlug = slugify(mat.materiaName);
    for (const aula of mat.aulas) {
      const aulaSlug = slugify(aula.name);
      const progressKey = `${discSlug}/${matSlug}/${aulaSlug}`;
      const prog = progress[progressKey];
      if (prog && prog.urlHtmlR2) {
        const cleanTitle = aula.name.replace(/^Aula\s+\d+\s*[-–:]\s*/i, '').trim();
        const key1 = `${discId}::${slugify(cleanTitle)}`;
        const key2 = `${discId}::${slugify(aula.name)}`;
        lookup.set(key1, prog);
        lookup.set(key2, prog);
      }
    }
  }
}

console.log(`Lookup pronto com ${lookup.size} chaves indexadas.`);

const catalogPath = path.join(__dirname, '../src/data/aulasInterativasCatalogoCompleto.ts');
let catalogContent = fs.readFileSync(catalogPath, 'utf8');

// Extrair e parsear AULAS_CATALOGO_COMPLETO
const marker = 'export const AULAS_CATALOGO_COMPLETO: AulaItem[] = ';
const idx = catalogContent.indexOf(marker);
if (idx === -1) {
  console.error('Marcador AULAS_CATALOGO_COMPLETO não encontrado');
  process.exit(1);
}

const before = catalogContent.substring(0, idx + marker.length);
const arrayStr = catalogContent.substring(idx + marker.length).trim().replace(/;$/, '');

let aulas = JSON.parse(arrayStr);
console.log(`Total de aulas no catálogo antes da atualização: ${aulas.length}`);

let matchedCount = 0;
let updatedAulas = aulas.map(aula => {
  const cleanTitle = aula.titulo.replace(/^Aula\s+\d+\s*[-–:]\s*/i, '').trim();
  const key1 = `${aula.disciplinaId}::${slugify(cleanTitle)}`;
  const key2 = `${aula.disciplinaId}::${slugify(aula.titulo)}`;

  const prog = lookup.get(key1) || lookup.get(key2);
  if (prog && prog.urlHtmlR2) {
    matchedCount++;
    return {
      ...aula,
      etapas: prog.etapas || aula.etapas || 32,
      audioQtd: prog.etapas || aula.audioQtd || 32,
      imagensQtd: prog.etapas || aula.imagensQtd || 30,
      urlHtmlR2: prog.urlHtmlR2,
      urlJsonR2: prog.urlJsonR2 || prog.urlHtmlR2.replace(/\/aula\.html$/, '/aula.json'),
      status: 'pronto'
    };
  }
  return aula;
});

console.log(`Aulas associadas com URLs do R2: ${matchedCount} de ${aulas.length}`);

// Salvar de volta
const newContent = before + JSON.stringify(updatedAulas, null, 2) + ';\n';
fs.writeFileSync(catalogPath, newContent, 'utf8');
console.log('Catálogo src/data/aulasInterativasCatalogoCompleto.ts atualizado com sucesso!');

