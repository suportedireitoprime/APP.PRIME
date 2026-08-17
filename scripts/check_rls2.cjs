// Verificar se anon key com auth retorna dados (o app usa auth)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Verificar RLS policies na tabela flashcards_cards
  const { data, error } = await supa.rpc('exec_sql', {
    query: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'flashcards_cards'
      ORDER BY policyname;
    `
  });

  if (error) {
    console.log('RPC exec_sql não existe, tentando via SQL direto...');
    // Tentar ver se RLS está ativado
    const { data: d2, error: e2 } = await supa
      .from('flashcards_cards')
      .select('id', { count: 'exact', head: true });
    console.log('[SERVICE_ROLE] count:', d2, 'err:', e2);
    
    // Tentar via flashcards_temas RPC que é o que o app usa
    const { data: temas, error: temasErr } = await supa.rpc('flashcards_temas', { _area: 'Direito Penal' });
    console.log('[SERVICE_ROLE] flashcards_temas Penal:', temas?.length, 'temas');
    temas?.slice(0, 5).forEach(t => console.log(`  - "${t.tema}" total: ${t.total}`));
    
    // Testar a mesma RPC com anon key
    const supaAnon = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: temasAnon, error: temasAnonErr } = await supaAnon.rpc('flashcards_temas', { _area: 'Direito Penal' });
    console.log('\n[ANON_KEY] flashcards_temas Penal:', temasAnon?.length, 'temas', temasAnonErr ? `ERRO: ${temasAnonErr.message}` : '');
    temasAnon?.slice(0, 5).forEach(t => console.log(`  - "${t.tema}" total: ${t.total}`));

    // Contar via RPC com "Código Penal" nos temas
    const allCp = (temas || []).filter(t => t.tema.toLowerCase().includes('código penal'));
    console.log('\n[SERVICE_ROLE] Temas com "Código Penal":', allCp.length);
    allCp.forEach(t => console.log(`  - "${t.tema}" total: ${t.total}`));
  } else {
    console.log('Policies:', JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
