require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);

  const campRes = await supabase
          .from("push_campaigns")
          .select(
            "id,title,status,automation_key,created_at"
          )
          .or(
            `and(created_at.gte.${inicio.toISOString()},created_at.lte.${fim.toISOString()}),and(next_run_at.gte.${inicio.toISOString()},next_run_at.lte.${fim.toISOString()})`
          )
          .order("created_at", { ascending: true });

  console.log("Error:", campRes.error);
  console.log("Data count:", campRes.data?.length);
}

run();
