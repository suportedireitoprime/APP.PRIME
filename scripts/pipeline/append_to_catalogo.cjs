const fs = require('fs');

function updateCatalogWithCheckpoints() {
  const catPath = 'src/data/aulasInterativasCatalogoCompleto.ts';
  let content = fs.readFileSync(catPath, 'utf-8');

  // Find all checkpoint files
  const files = fs.readdirSync('.').filter(f => f.startsWith('checkpoint_') && f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No checkpoints found.');
    return;
  }

  // Extract MATERIAS_CATALOGO_COMPLETO
  const matStart = 'export const MATERIAS_CATALOGO_COMPLETO: MateriaItem[] = ';
  const matEnd = ';\n\nexport const AULAS_CATALOGO_COMPLETO';
  const mSIdx = content.indexOf(matStart);
  const mEIdx = content.indexOf(matEnd);

  if (mSIdx === -1 || mEIdx === -1) {
    throw new Error('MATERIAS markers not found');
  }

  const rawMaterias = content.slice(mSIdx + matStart.length, mEIdx).trim();
  const materias = JSON.parse(rawMaterias);
  const materiaIdSet = new Set(materias.map(m => m.id));

  // Extract AULAS_CATALOGO_COMPLETO
  const aulaStart = 'export const AULAS_CATALOGO_COMPLETO: AulaItem[] = ';
  const aSIdx = content.indexOf(aulaStart);
  if (aSIdx === -1) {
    throw new Error('AULAS start marker not found');
  }
  const rawAulas = content.slice(aSIdx + aulaStart.length).replace(/;\s*$/, '').trim();
  const aulas = JSON.parse(rawAulas);
  const aulaIdSet = new Set(aulas.map(a => a.id));

  let addedMaterias = 0;
  let addedAulas = 0;

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
    if (data.materias) {
      for (const m of data.materias) {
        if (!materiaIdSet.has(m.id)) {
          materias.push(m);
          materiaIdSet.add(m.id);
          addedMaterias++;
        }
      }
    }
    if (data.aulas) {
      for (const a of data.aulas) {
        if (!aulaIdSet.has(a.id)) {
          aulas.push(a);
          aulaIdSet.add(a.id);
          addedAulas++;
        }
      }
    }
  }

  console.log(`Added ${addedMaterias} new materias and ${addedAulas} new aulas to catalog.`);

  const newContent = `${content.slice(0, mSIdx)}${matStart}${JSON.stringify(materias, null, 2)};\n\n${aulaStart}${JSON.stringify(aulas, null, 2)};\n`;
  fs.writeFileSync(catPath, newContent, 'utf-8');
  console.log('Successfully updated src/data/aulasInterativasCatalogoCompleto.ts!');
}

updateCatalogWithCheckpoints();
