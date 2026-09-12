import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

// 1. Setup Supabase
const envData = fs.readFileSync('.env', 'utf8');
const env = envData.split(/\r?\n/).reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) acc[k.trim()] = v.join('=').trim().replace(/`/g, '').replace(/"/g, '');
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const SPREADSHEET_ID = '1dmK7zNLtpIvNN94MDWGme8MNgNaYga5z';

async function fetchCSV(sheetName = null) {
  let url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;
  if (sheetName) {
    url += `&sheet=${encodeURIComponent(sheetName)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const text = await res.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

async function getOrCreateArea(slug, nome, cor) {
  let { data } = await supabase.from('aprender_areas').select('*').eq('slug', slug).maybeSingle();
  if (!data) {
    const { data: inserted, error } = await supabase
      .from('aprender_areas')
      .insert({ slug, nome, cor })
      .select()
      .single();
    if (error) throw error;
    data = inserted;
  }
  return data;
}

async function run() {
  try {
    console.log("Obtendo área de Direito Penal...");
    const area = await getOrCreateArea('direito-penal', 'Direito Penal', '#fb7185');
    console.log(`Área ID: ${area.id}`);

    console.log("Baixando índice principal...");
    const modulesData = await fetchCSV();
    console.log(`Encontrados ${modulesData.length} módulos no índice.`);

    for (let i = 0; i < modulesData.length; i++) {
      const row = modulesData[i];
      const nomeModulo = row.Materia_Penal;
      const aba = row.Aba_Excel;
      const ordem = parseInt(row.ID) || (i + 1);

      if (!nomeModulo || !aba) continue;

      console.log(`\nProcessando Módulo: ${nomeModulo} (Aba: ${aba})`);

      // 1. Criar/Atualizar Módulo
      let { data: mod } = await supabase
        .from('aprender_modulos')
        .select('*')
        .eq('area_id', area.id)
        .eq('titulo', nomeModulo)
        .maybeSingle();

      if (!mod) {
        const { data: inserted, error } = await supabase
          .from('aprender_modulos')
          .insert({
            area_id: area.id,
            titulo: nomeModulo,
            ordem: ordem,
            resumo: row.Escopo_Dogmático || row.Escopo_Dogmǭtico || null
          })
          .select()
          .single();
        if (error) {
          console.error("Erro ao criar módulo", error);
          continue;
        }
        mod = inserted;
      } else {
        await supabase
          .from('aprender_modulos')
          .update({ ordem })
          .eq('id', mod.id);
      }

      console.log(`Módulo ID: ${mod.id}`);

      // 2. Buscar Aulas da Aba
      console.log(`Baixando aba ${aba}...`);
      let aulasData;
      try {
        aulasData = await fetchCSV(aba);
      } catch (err) {
        console.error(`Aba ${aba} não encontrada ou erro no download.`);
        continue;
      }

      console.log(`Encontradas ${aulasData.length} aulas na aba ${aba}.`);

      for (let j = 0; j < aulasData.length; j++) {
        const aulaRow = aulasData[j];
        const aulaOrdem = j + 1;
        const tituloAula = aulaRow.Titulo_da_Aula || aulaRow.Aula;
        if (!tituloAula) continue;

        console.log(`  -> Processando Aula: ${tituloAula}`);

        const aulaSlug = tituloAula.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let { data: aula } = await supabase
          .from('aprender_aulas')
          .select('*')
          .eq('modulo_id', mod.id)
          .eq('slug', aulaSlug)
          .maybeSingle();

        if (!aula) {
          const { data: inserted, error } = await supabase
            .from('aprender_aulas')
            .insert({
              modulo_id: mod.id,
              titulo: tituloAula,
              slug: aulaSlug,
              objetivo: aulaRow.Materia_PDF || '',
              duracao_est_min: parseInt(aulaRow.Total_Slides) || 15,
              ordem: aulaOrdem,
              status: 'published'
            })
            .select()
            .single();
          if (error) {
            console.error("Erro ao criar aula", error);
            continue;
          }
          aula = inserted;
        } else {
          // Garante que está publicada
          await supabase
            .from('aprender_aulas')
            .update({ status: 'published', ordem: aulaOrdem })
            .eq('id', aula.id);
        }

        // 3. Processar Slides (Blocos)
        // Primeiro apagamos os blocos antigos para evitar duplicação em caso de re-import
        await supabase.from('aprender_blocos').delete().eq('aula_id', aula.id);

        const blocosToInsert = [];
        let slideIndex = 1;
        // As colunas de slides se chamam Slide_01, Slide_02, etc.
        for (let k = 1; k <= 100; k++) {
          const key = `Slide_${k.toString().padStart(2, '0')}`;
          if (aulaRow[key] && aulaRow[key].trim() !== '') {
            blocosToInsert.push({
              aula_id: aula.id,
              ordem: slideIndex++,
              tipo: 'leitura',
              markdown: aulaRow[key].trim()
            });
          }
        }

        if (blocosToInsert.length > 0) {
          const { error } = await supabase.from('aprender_blocos').insert(blocosToInsert);
          if (error) {
            console.error("Erro ao inserir blocos", error);
          } else {
            console.log(`     Inseridos ${blocosToInsert.length} blocos.`);
          }
        }
      }
    }

    console.log("Importação concluída com sucesso!");
  } catch (err) {
    console.error("Erro global na importação:", err);
  }
}

run();
