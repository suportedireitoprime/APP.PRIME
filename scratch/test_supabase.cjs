require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  try {
    const { data: list5m, error: e1 } = await supabase.rpc('admin_lista_dia', { _tipo: 'online5m', _dia: new Date().toISOString() });
    if (e1) console.error("Error online5m:", e1);
    else console.log("online5m:", list5m?.length);

    const { data: listTrial, error: e2 } = await supabase.rpc('admin_lista_dia', { _tipo: 'trial', _dia: new Date().toISOString() });
    if (e2) console.error("Error trial:", e2);
    else console.log("trial:", listTrial?.length);

    const { data: m, error: e3 } = await supabase.rpc('admin_metricas_dia', { _dia: new Date().toISOString() });
    if (e3) console.error("Error metrics:", e3);
    else console.log("metrics:", m);
  } catch (err) {
    console.error(err);
  }
}
run();
