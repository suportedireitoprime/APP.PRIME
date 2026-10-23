const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Carregar .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log('--- LEVANTAMENTO MAPAS MENTAIS & RESUMOS CATALOG ---');

  // 1. Carregar catálogo local
  const catalogRaw = fs.readFileSync('public/offline-bundle/resumos-catalog.json', 'utf8');
  const catalog = JSON.parse(catalogRaw);

  console.log(`\nTotal de Áreas no Catálogo de Resumos: ${catalog.length}`);
  let totalTemas = 0;
  let totalSubtemas = 0;

  const areasSummary = catalog.map(c => {
    const nTemas = c.temas?.length || 0;
    let nSubtemas = 0;
    (c.temas || []).forEach(t => {
      nSubtemas += (t.subtemas?.length || 1);
    });
    totalTemas += nTemas;
    totalSubtemas += nSubtemas;
    return {
      area: c.area,
      temas: nTemas,
      subtemas: nSubtemas
    };
  });

  console.table(areasSummary);
  console.log(`Total geral de Temas: ${totalTemas}`);
  console.log(`Total geral de Subtemas (capítulos detalhados): ${totalSubtemas}`);

  // 2. Consultar o que já existe em visuais_juridicos no Supabase
  let allVisuais = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('visuais_juridicos')
      .select('id, tipo, categoria, item_key, titulo')
      .range(from, from + step - 1);
    if (error) {
      console.error('Erro ao consultar visuais_juridicos:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allVisuais.push(...data);
    if (data.length < step) break;
    from += step;
  }

  console.log(`\nTotal de visuais já gerados e salvos no Supabase: ${allVisuais.length}`);

  // Agrupamento por tipo
  const porTipo = {};
  const porCategoria = {};
  allVisuais.forEach(v => {
    porTipo[v.tipo] = (porTipo[v.tipo] || 0) + 1;
    porCategoria[v.categoria] = (porCategoria[v.categoria] || 0) + 1;
  });

  console.log('Visuais por Tipo já salvos:', porTipo);
  console.log('Visuais por Categoria já salvos:', porCategoria);

  // Amostra de item_key
  console.log('Exemplos de item_key salvos:', allVisuais.slice(0, 5).map(v => ({ tipo: v.tipo, item_key: v.item_key, titulo: v.titulo })));
}

run().catch(console.error);
