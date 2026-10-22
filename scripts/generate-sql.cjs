const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('scripts/pending_audioaulas_manifest.json', 'utf8'));
const allItems = [...catalog.civil, ...catalog.procCivil, ...catalog.tributario];

const seen = new Set();
const rows = [];

function escapeSql(str) {
  if (!str) return 'NULL';
  return `'` + String(str).replace(/'/g, "''") + `'`;
}

for (const it of allItems) {
  if (seen.has(it.r2Key)) continue;
  seen.add(it.r2Key);

  let tag = 'Civil';
  if (it.area.includes('Processual')) tag = 'Processo Civil';
  else if (it.area.includes('Tributário')) tag = 'Tributário';

  rows.push(`  (${escapeSql(it.area)}, ${escapeSql(it.tema)}, ${it.sequencia || 'NULL'}, ${escapeSql(it.titulo)}, '', ${escapeSql(it.r2Url)}, ${escapeSql(tag)}, ${escapeSql(it.r2Key)})`);
}

const sql = `-- Inserção em lote das 960 novas áudioaulas no Supabase
INSERT INTO public.audioaulas_acervo (area, tema, sequencia, titulo, descricao, url_audio, tag, r2_key)
VALUES
${rows.join(',\n')}
ON CONFLICT (r2_key) DO UPDATE SET
  url_audio = EXCLUDED.url_audio,
  titulo = EXCLUDED.titulo,
  tema = EXCLUDED.tema,
  area = EXCLUDED.area;
`;

fs.writeFileSync('scripts/insert_novas_audioaulas.sql', sql, 'utf8');
console.log('scripts/insert_novas_audioaulas.sql gerado com', rows.length, 'linhas!');
