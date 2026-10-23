const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkAllDb() {
  const { count } = await supabase.from('resumos_juridicos').select('*', { count: 'exact', head: true });
  console.log('Total de linhas em resumos_juridicos:', count);

  let allRows = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('resumos_juridicos')
      .select('area, tema, subtema')
      .range(from, from + step - 1);
    if (error) {
      console.error(error);
      break;
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < step) break;
    from += step;
  }

  console.log(`Linhas recuperadas: ${allRows.length}`);

  const distinctAreas = {};
  const areaTemas = {};
  const areaSubtemas = {};

  allRows.forEach(r => {
    const a = r.area || 'Sem Área';
    distinctAreas[a] = (distinctAreas[a] || 0) + 1;
    if (!areaTemas[a]) areaTemas[a] = new Set();
    if (!areaSubtemas[a]) areaSubtemas[a] = new Set();
    if (r.tema) areaTemas[a].add(r.tema);
    if (r.subtema) areaSubtemas[a].add(`${r.tema || ''} - ${r.subtema}`);
  });

  const summary = Object.keys(distinctAreas).sort().map(area => ({
    area,
    totalCapitulos: distinctAreas[area],
    temasTopicos: areaTemas[area].size,
    subtemas: areaSubtemas[area].size
  }));

  console.table(summary);

  const totalTopicos = summary.reduce((acc, s) => acc + s.temasTopicos, 0);
  const totalSubtemasGeral = summary.reduce((acc, s) => acc + s.subtemas, 0);

  console.log(`\nTOTAL DE ÁREAS: ${summary.length}`);
  console.log(`TOTAL DE TÓPICOS (TEMAS): ${totalTopicos}`);
  console.log(`TOTAL DE SUBTEMAS: ${totalSubtemasGeral}`);
}

checkAllDb().catch(console.error);
