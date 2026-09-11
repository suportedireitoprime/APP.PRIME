import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const AREA_ID = '892fe81f-e205-4cbd-b931-20582a8658c1';
  const { data: modulos } = await supabase.from('aprender_modulos').select('id, titulo').eq('area_id', AREA_ID);
  console.log(`Módulos de Direito Penal: ${modulos.length}`);

  if (modulos.length > 0) {
    const { count: aulaCount } = await supabase.from('aprender_aulas').select('*', { count: 'exact', head: true }).in('modulo_id', modulos.map(m => m.id));
    console.log(`Total de Aulas: ${aulaCount}`);

    const { data: aulas } = await supabase.from('aprender_aulas').select('id').in('modulo_id', modulos.map(m => m.id));
    if (aulas.length > 0) {
      const { count: blocoCount } = await supabase.from('aprender_blocos').select('*', { count: 'exact', head: true }).in('aula_id', aulas.map(a => a.id));
      console.log(`Total de Blocos: ${blocoCount}`);
    }
  }
}

check().catch(console.error);
