import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
  const areaId = '892fe81f-e205-4cbd-b931-20582a8658c1';
  
  const { data: modulos, error: modErr } = await supabase
    .from('aprender_modulos')
    .select('*')
    .eq('area_id', areaId);
    
  console.log('Modulos in Direito Penal:', modulos);

  if (modulos && modulos.length > 0) {
    for (const modulo of modulos) {
      const { data: aulas, error: aulasErr } = await supabase
        .from('aprender_aulas')
        .select('id, titulo, ordem')
        .eq('modulo_id', modulo.id)
        .order('ordem', { ascending: true });
      
      console.log(`Aulas in modulo ${modulo.nome} (${modulo.id}):`, aulas);
    }
  }
}

checkDB().catch(console.error);
