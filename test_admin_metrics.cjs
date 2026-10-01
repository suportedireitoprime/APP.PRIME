require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMetrics() {
  const isoDate = new Date().toISOString().split('T')[0];
  console.log(`Buscando métricas para o dia: ${isoDate}`);
  
  const { data, error } = await supabase.rpc('admin_metricas_dia', { _dia: isoDate });
  
  if (error) {
    console.error('Erro na RPC admin_metricas_dia:', error);
  } else {
    console.log('Resultados da RPC:', JSON.stringify(data, null, 2));
  }
}

checkMetrics();
