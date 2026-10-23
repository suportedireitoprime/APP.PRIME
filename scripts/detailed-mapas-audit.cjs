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

const norm = (v) =>
  (v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const slug = (v) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function chaveDe(baseKey, sub, kind = 'artigo') {
  const a = (sub || '').trim().replace(/^art\.?\s*/i, '');
  if (!a) return baseKey;
  return `${baseKey}#${kind === 'tema' ? 'tema' : 'art'}-${norm(a).replace(/[^a-z0-9]+/g, '-')}`;
}

async function runAudit() {
  console.log('=== AUDITORIA COMPLETA DE MAPAS MENTAIS & VISUAIS JURÍDICOS ===\n');

  // 1. Carregar todos os visuais do Supabase
  let allVisuais = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('visuais_juridicos')
      .select('id, tipo, categoria, item_key, item_label, titulo')
      .range(from, from + step - 1);
    if (error) {
      console.error('Erro ao ler visuais_juridicos:', error);
      break;
    }
    if (!data?.length) break;
    allVisuais.push(...data);
    if (data.length < step) break;
    from += step;
  }
  console.log(`Total de visuais existentes em visuais_juridicos: ${allVisuais.length}`);

  // Mapa rápido de visuais existentes: chave:tipo -> true
  const existentes = new Set();
  allVisuais.forEach(v => {
    existentes.add(`${v.item_key}::${v.tipo}`);
  });

  // 2. Carregar todas as linhas de resumos_juridicos
  let resumos = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('resumos_juridicos')
      .select('id, area, tema, subtema')
      .range(from, from + step - 1);
    if (error) {
      console.error('Erro ao ler resumos_juridicos:', error);
      break;
    }
    if (!data?.length) break;
    resumos.push(...data);
    if (data.length < step) break;
    from += step;
  }
  console.log(`Total de registros em resumos_juridicos: ${resumos.length}\n`);

  // 3. Estruturar hierarquia: Área -> Temas -> Subtemas
  const areasMap = new Map();

  for (const r of resumos) {
    const areaNome = (r.area || 'Sem Área').trim();
    if (!areasMap.has(areaNome)) {
      areasMap.set(areaNome, {
        area: areaNome,
        areaKey: `materia:${slug(areaNome)}`,
        temas: new Map(),
      });
    }
    const a = areasMap.get(areaNome);
    const temaNome = (r.tema || 'Geral').trim();
    if (!a.temas.has(temaNome)) {
      a.temas.set(temaNome, {
        tema: temaNome,
        temaKey: chaveDe(a.areaKey, temaNome, 'tema'),
        subtemas: new Map(),
      });
    }
    const t = a.temas.get(temaNome);
    const subNome = (r.subtema || '').trim();
    if (subNome && !t.subtemas.has(subNome)) {
      t.subtemas.set(subNome, {
        subtema: subNome,
        subtemaKey: chaveDe(a.areaKey, `${temaNome} ${subNome}`, 'tema'),
      });
    }
  }

  const tipos = ['mapa_mental', 'infografico', 'fluxograma', 'diagrama'];

  // 4. Analisar por área:
  // Contaremos quantos subtemas existem e quantos visuais existem/faltam para os 4 tipos
  const relatorioAreas = [];

  let totalGeralSubtemas = 0;
  let totalGeralTemas = 0;
  let totalExistentesSubtema = 0;
  let totalFaltantesSubtema = 0;

  let totalExistentesTema = 0;
  let totalFaltantesTema = 0;

  for (const [areaNome, aData] of [...areasMap.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))) {
    const numTemas = aData.temas.size;
    let numSubtemas = 0;

    let subtemasExistentesPorTipo = { mapa_mental: 0, infografico: 0, fluxograma: 0, diagrama: 0 };
    let temasExistentesPorTipo = { mapa_mental: 0, infografico: 0, fluxograma: 0, diagrama: 0 };

    for (const [tNome, tData] of aData.temas.entries()) {
      numSubtemas += tData.subtemas.size;

      // Verifica no nível tema
      tipos.forEach(tp => {
        if (existentes.has(`${tData.temaKey}::${tp}`)) {
          temasExistentesPorTipo[tp]++;
          totalExistentesTema++;
        } else {
          totalFaltantesTema++;
        }
      });

      // Verifica no nível subtema
      for (const [sNome, sData] of tData.subtemas.entries()) {
        tipos.forEach(tp => {
          if (existentes.has(`${sData.subtemaKey}::${tp}`)) {
            subtemasExistentesPorTipo[tp]++;
            totalExistentesSubtema++;
          } else {
            totalFaltantesSubtema++;
          }
        });
      }
    }

    totalGeralTemas += numTemas;
    totalGeralSubtemas += numSubtemas;

    const totalSubtemasNecessarios = numSubtemas * 4;
    const totalSubtemasProntos = subtemasExistentesPorTipo.mapa_mental + subtemasExistentesPorTipo.infografico + subtemasExistentesPorTipo.fluxograma + subtemasExistentesPorTipo.diagrama;
    const totalSubtemasFaltam = totalSubtemasNecessarios - totalSubtemasProntos;

    const totalTemasNecessarios = numTemas * 4;
    const totalTemasProntos = temasExistentesPorTipo.mapa_mental + temasExistentesPorTipo.infografico + temasExistentesPorTipo.fluxograma + temasExistentesPorTipo.diagrama;
    const totalTemasFaltam = totalTemasNecessarios - totalTemasProntos;

    relatorioAreas.push({
      area: areaNome,
      topicos: numTemas,
      subtemas: numSubtemas,
      subtemasProntos: totalSubtemasProntos,
      subtemasFaltam: totalSubtemasFaltam,
      temasProntos: totalTemasProntos,
      temasFaltam: totalTemasFaltam,
    });
  }

  console.log('--- LEVANTAMENTO POR ÁREA (SUBTEMAS / CAPÍTULOS DE RESUMO) ---');
  console.table(relatorioAreas.map(r => ({
    'Área': r.area,
    'Tópicos': r.topicos,
    'Subtemas': r.subtemas,
    'Visuais Prontos': r.subtemasProntos,
    'Faltam (x4 tipos)': r.subtemasFaltam
  })));

  console.log('\n=== TOTAIS GERAIS ===');
  console.log(`Total de Áreas: ${areasMap.size}`);
  console.log(`Total de Tópicos (Temas de Resumo): ${totalGeralTemas}`);
  console.log(`Total de Subtemas (Capítulos detalhados onde fica o botão Gerar): ${totalGeralSubtemas}`);
  console.log(`Multiplicador dos 4 tipos (Mapa Mental, Infográfico, Fluxograma, Diagrama): x4`);
  console.log(`\n--- CENÁRIO 1: GERAÇÃO POR SUBTEMA (ONDE O USUÁRIO CLICA 'GERAR' NA TELA) ---`);
  console.log(`Total necessário (Subtemas x 4): ${totalGeralSubtemas * 4}`);
  console.log(`Já prontos: ${totalExistentesSubtema}`);
  console.log(`FALTAM GERAR: ${totalFaltantesSubtema}`);
  console.log(`\n--- CENÁRIO 2: GERAÇÃO POR TÓPICO / TEMA GERAL ---`);
  console.log(`Total necessário (Tópicos x 4): ${totalGeralTemas * 4}`);
  console.log(`Já prontos: ${totalExistentesTema}`);
  console.log(`FALTAM GERAR: ${totalFaltantesTema}`);
}

runAudit().catch(console.error);
