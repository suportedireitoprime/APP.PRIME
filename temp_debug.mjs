import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(url, key);

async function run() {
  console.log("=== Boletins ===");
  const { data: boletins, error: bErr } = await supabase
    .from('boletins_juridicos')
    .select('id, data_ref, tipo, titulo, status, created_at, gerado_por, roteiro_json')
    .order('data_ref', { ascending: false })
    .limit(10);
  if (bErr) console.error(bErr);
  else console.table(boletins.map(b => ({
      id: b.id, data_ref: b.data_ref, status: b.status, titulo: b.titulo, len: b.roteiro_json?.length
  })));

  console.log("\n=== Notícias Dia 18, 19, 20 ===");
  const { data: noticias, error: nErr } = await supabase
    .from('noticias_juridicas')
    .select('id, data_publicacao, fonte')
    .gte('data_publicacao', '2026-08-17T00:00:00Z')
    .order('data_publicacao', { ascending: false });
  
  if (nErr) console.error(nErr);
  else {
    const counts = { '18': 0, '19': 0, '20': 0 };
    noticias.forEach(n => {
        if (n.data_publicacao.includes('2026-08-18')) counts['18']++;
        if (n.data_publicacao.includes('2026-08-19')) counts['19']++;
        if (n.data_publicacao.includes('2026-08-20')) counts['20']++;
    });
    console.log("Notícias por dia:", counts);
  }
}

run();
