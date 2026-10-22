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
  console.log('--- Analisando Áudioaulas Acervo ---');
  let from = 0;
  const areaCounts = {};
  const areaSampleAudio = {};
  let withAudio = 0;
  let withoutAudio = 0;

  while (true) {
    const { data, error } = await supabase
      .from('audioaulas_acervo')
      .select('id, area, tema, titulo, url_audio')
      .range(from, from + 999);

    if (error || !data || data.length === 0) break;

    for (const r of data) {
      const area = (r.area || 'Sem Área').trim();
      areaCounts[area] = (areaCounts[area] || 0) + 1;
      if (r.url_audio && r.url_audio.trim().length > 0) {
        withAudio++;
        if (!areaSampleAudio[area]) areaSampleAudio[area] = r.url_audio;
      } else {
        withoutAudio++;
      }
    }
    from += 1000;
    if (data.length < 1000) break;
  }

  console.log(`Total geral de audioaulas: ${withAudio + withoutAudio}`);
  console.log(`Com áudio: ${withAudio}`);
  console.log(`Sem áudio: ${withoutAudio}`);

  console.log('\n--- MATÉRIAS EXISTENTES EM AUDIOAULAS ---');
  for (const [area, count] of Object.entries(areaCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`✓ ${area}: ${count} aulas (Exemplo: ${areaSampleAudio[area] ? 'OK' : 'SEM ÁUDIO'})`);
  }

  // Verificar matérias clássicas do Direito que NÃO estão na lista acima
  const MATERIAS_CLASSICAS_DIREITO = [
    'Direito Civil',
    'Direito Processual Civil',
    'Direito Tributário',
    'Direito do Consumidor',
    'Direito Eleitoral',
    'Direito Previdenciário',
    'Direito Constitucional',
    'Direito Administrativo',
    'Direito Penal',
    'Direito Processual Penal',
    'Direito do Trabalho',
    'Direito Processual do Trabalho',
    'Direito Empresarial',
    'Direito Ambiental',
    'Direitos Humanos',
    'Direito Internacional Público',
    'Direito Internacional Privado',
    'Estatuto da OAB / Ética',
    'Direito da Criança e do Adolescente'
  ];

  const existentes = new Set(Object.keys(areaCounts).map(a => a.toLowerCase()));
  const faltandoClassicas = MATERIAS_CLASSICAS_DIREITO.filter(m => {
    return !existentes.has(m.toLowerCase()) && 
           !Array.from(existentes).some(e => e.includes(m.toLowerCase()) || m.toLowerCase().includes(e));
  });

  console.log('\n--- MATÉRIAS CLÁSSICAS DO DIREITO QUE NÃO EXISTEM EM AUDIOAULAS ---');
  faltandoClassicas.forEach(m => console.log(`✗ ${m}`));
}

run().catch(console.error);
