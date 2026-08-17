import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: apres, error } = await supabase
    .from('apresentacoes_narradas')
    .select('id, titulo, status, publicada, total_slides, created_at')
    .ilike('titulo', '%Caverna%')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error("ERRO SUPABASE:", error);
    return;
  }
    
  console.log("=== ÚLTIMAS APRESENTAÇÕES ===");
  apres?.forEach(a => {
    console.log(`[${a.id}] ${a.titulo} - Status: ${a.status} - Pub: ${a.publicada} - Slides: ${a.total_slides} - Date: ${a.created_at}`);
  });

  if (apres && apres.length > 0) {
    const { data: slides, error: slideErr } = await supabase
      .from('apresentacao_slides')
      .select('slide_index, status, imagem_path, audio_path, erro')
      .eq('apresentacao_id', apres[0].id)
      .order('slide_index');
      
    if (slideErr) console.error("Erro slides:", slideErr);
      
    console.log("SLIDES:");
    slides?.forEach(s => {
      console.log(`[${s.slide_index}] Status: ${s.status} - Img: ${s.imagem_path ? 'OK' : 'X'} - Audio: ${s.audio_path ? 'OK' : 'X'} - Erro: ${s.erro}`);
    });
  }
}

check();
