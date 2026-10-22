const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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
  console.log('--- Analisando Temas de Audioaulas ---');
  let from = 0;
  const constitucionalTemas = new Map();
  const pecasPorArea = new Map();

  while (true) {
    const { data, error } = await supabase
      .from('audioaulas_acervo')
      .select('id, area, tema, titulo')
      .range(from, from + 999);

    if (error || !data || data.length === 0) break;

    for (const r of data) {
      const area = (r.area || 'Geral').trim();
      const tema = (r.tema || 'Geral').trim();
      
      if (area.toLowerCase().includes('constitucional')) {
        constitucionalTemas.set(tema, (constitucionalTemas.get(tema) || 0) + 1);
      }

      if (/peça|peca|prática|pratica/i.test(tema) || /peça|peca|prática|pratica/i.test(r.titulo)) {
        if (!pecasPorArea.has(area)) pecasPorArea.set(area, new Map());
        const m = pecasPorArea.get(area);
        m.set(tema, (m.get(tema) || 0) + 1);
      }
    }
    from += 1000;
    if (data.length < 1000) break;
  }

  console.log('\n--- TEMAS DE CONSTITUCIONAL ---');
  for (const [t, count] of Array.from(constitucionalTemas.entries()).sort()) {
    console.log(`- ${t} (${count} aulas)`);
  }

  console.log('\n--- ÁREAS COM PEÇAS PRÁTICAS ---');
  for (const [area, temas] of pecasPorArea.entries()) {
    console.log(`\nÁrea: ${area}`);
    for (const [t, count] of temas.entries()) {
      console.log(`  * ${t} (${count} aulas)`);
    }
  }
}

run().catch(console.error);
